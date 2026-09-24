import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db, hashPassword, verifyPassword } from './db.js';
import { createToken, requireAuth, requireRole } from './auth.js';

export const apiRouter = Router();

// ==========================================
// 1. AUTENTICAÇÃO
// ==========================================

// POST /api/auth/register
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { nome, email, matricula, senha, confirmar_senha, perfil } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Nome, e-mail e senha são obrigatórios.',
        error: 'MISSING_FIELDS'
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve conter no mínimo 6 caracteres.',
        error: 'PASSWORD_TOO_SHORT'
      });
    }

    if (confirmar_senha && senha !== confirmar_senha) {
      return res.status(400).json({
        success: false,
        message: 'A confirmação de senha não confere.',
        error: 'PASSWORD_MISMATCH'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de e-mail inválido.',
        error: 'INVALID_EMAIL'
      });
    }

    // RN04: Unique email
    const existing = db.prepare('SELECT id_usuario FROM usuario WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um usuário cadastrado com este e-mail.',
        error: 'EMAIL_ALREADY_EXISTS'
      });
    }

    const userProfile = (perfil === 'PROFESSOR' || perfil === 'ADMINISTRADOR') ? perfil : 'PARTICIPANTE';
    const senhaHash = hashPassword(senha);

    const insertStmt = db.prepare(`
      INSERT INTO usuario (nome, email, senha_hash, matricula, perfil, status_conta)
      VALUES (?, ?, ?, ?, ?, 'APROVADO')
    `);
    const result = insertStmt.run(nome.trim(), email.toLowerCase().trim(), senhaHash, matricula ? matricula.trim() : null, userProfile);

    const userId = Number(result.lastInsertRowid);
    const userSession = {
      id_usuario: userId,
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      matricula: matricula ? matricula.trim() : null,
      perfil: userProfile as 'ADMINISTRADOR' | 'PROFESSOR' | 'PARTICIPANTE',
      foto_perfil: null,
      telefone: null,
      materias_responsavel: null
    };

    const token = createToken(userSession);

    // Audit log
    db.prepare('INSERT INTO auditoria (id_usuario, acao, detalhes, ip) VALUES (?, ?, ?, ?)').run(
      userId,
      'CADASTRO_USUARIO',
      `Novo usuário registrado: ${email} (${userProfile})`,
      req.ip || '127.0.0.1'
    );

    return res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      user: userSession,
      token
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao realizar cadastro.',
      error: err.message
    });
  }
});

// POST /api/auth/login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'E-mail e senha são obrigatórios.',
        error: 'MISSING_CREDENTIALS'
      });
    }

    const user = db.prepare(`
      SELECT id_usuario, nome, email, senha_hash, matricula, perfil, foto_perfil, telefone, materias_responsavel, ativo, status_conta
      FROM usuario
      WHERE email = ?
    `).get(email.toLowerCase().trim()) as any;

    if (!user || !verifyPassword(senha, user.senha_hash)) {
      return res.status(401).json({
        success: false,
        message: 'E-mail ou senha incorretos.',
        error: 'INVALID_CREDENTIALS'
      });
    }

    if (user.ativo !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Sua conta está desativada. Contate a administração do IFCE.',
        error: 'ACCOUNT_DISABLED'
      });
    }

    const userSession = {
      id_usuario: user.id_usuario,
      nome: user.nome,
      email: user.email,
      matricula: user.matricula,
      perfil: user.perfil,
      foto_perfil: user.foto_perfil,
      telefone: user.telefone,
      materias_responsavel: user.materias_responsavel
    };

    const token = createToken(userSession);

    // Audit log
    db.prepare('INSERT INTO auditoria (id_usuario, acao, detalhes, ip) VALUES (?, ?, ?, ?)').run(
      user.id_usuario,
      'LOGIN',
      `Login realizado com sucesso: ${user.email}`,
      req.ip || '127.0.0.1'
    );

    return res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      user: userSession,
      token
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao realizar login.',
      error: err.message
    });
  }
});

// GET /api/auth/me
apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/forgot-password
apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Informe o e-mail cadastrado.',
        error: 'MISSING_EMAIL'
      });
    }

    const user = db.prepare('SELECT id_usuario, nome, email FROM usuario WHERE email = ?').get(email.toLowerCase().trim()) as any;

    if (!user) {
      // Return safe message without exposing whether user exists
      return res.json({
        success: true,
        message: 'Se o e-mail estiver cadastrado, as instruções para redefinição foram enviadas.'
      });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    db.prepare('INSERT INTO recuperacao_senha (id_usuario, token, expira_em) VALUES (?, ?, ?)').run(
      user.id_usuario,
      resetToken,
      expiresAt
    );

    return res.json({
      success: true,
      message: 'Instruções de recuperação enviadas com sucesso.',
      devToken: resetToken // Facilitate development and instant testing
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao processar solicitação.', error: err.message });
  }
});

// POST /api/auth/reset-password
apiRouter.post('/api/auth/reset-password', (req: Request, res: Response) => {
  try {
    const { token, nova_senha, confirmar_nova_senha } = req.body;
    if (!token || !nova_senha) {
      return res.status(400).json({ success: false, message: 'Token e nova senha são obrigatórios.' });
    }

    if (confirmar_nova_senha && nova_senha !== confirmar_nova_senha) {
      return res.status(400).json({ success: false, message: 'A confirmação de senha não confere.' });
    }

    const record = db.prepare(`
      SELECT id, id_usuario, expira_em, usado FROM recuperacao_senha WHERE token = ?
    `).get(token) as any;

    if (!record || record.usado === 1 || new Date(record.expira_em).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Link de recuperação inválido ou expirado. Solicite novamente.',
        error: 'INVALID_TOKEN'
      });
    }

    const newHash = hashPassword(nova_senha);
    db.prepare('UPDATE usuario SET senha_hash = ?, updated_at = datetime("now") WHERE id_usuario = ?').run(newHash, record.id_usuario);
    db.prepare('UPDATE recuperacao_senha SET usado = 1 WHERE id = ?').run(record.id);

    return res.json({
      success: true,
      message: 'Senha alterada com sucesso! Você já pode fazer login com a nova senha.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao redefinir senha.', error: err.message });
  }
});

// PUT /api/auth/profile
apiRouter.put('/auth/profile', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id_usuario;
    const { nome, telefone, matricula, materias_responsavel, foto_perfil } = req.body;

    if (!nome) {
      return res.status(400).json({ success: false, message: 'Nome completo é obrigatório.' });
    }

    db.prepare(`
      UPDATE usuario
      SET nome = ?, telefone = ?, matricula = ?, materias_responsavel = ?, foto_perfil = coalesce(?, foto_perfil), updated_at = datetime('now')
      WHERE id_usuario = ?
    `).run(
      nome.trim(),
      telefone ? telefone.trim() : null,
      matricula ? matricula.trim() : null,
      materias_responsavel ? materias_responsavel.trim() : null,
      foto_perfil || null,
      userId
    );

    const updated = db.prepare(`
      SELECT id_usuario, nome, email, matricula, perfil, foto_perfil, telefone, materias_responsavel
      FROM usuario WHERE id_usuario = ?
    `).get(userId) as any;

    const token = createToken(updated);

    return res.json({
      success: true,
      message: 'Dados do perfil atualizados com sucesso!',
      user: updated,
      token
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao atualizar perfil.', error: err.message });
  }
});

// PUT /api/auth/change-password
apiRouter.put('/auth/change-password', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id_usuario;
    const { senha_atual, nova_senha, confirmar_nova_senha } = req.body;

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({ success: false, message: 'Preencha a senha atual e a nova senha.' });
    }

    if (confirmar_nova_senha && nova_senha !== confirmar_nova_senha) {
      return res.status(400).json({ success: false, message: 'A confirmação de nova senha não confere.' });
    }

    const user = db.prepare('SELECT senha_hash FROM usuario WHERE id_usuario = ?').get(userId) as any;
    if (!verifyPassword(senha_atual, user.senha_hash)) {
      return res.status(400).json({ success: false, message: 'A senha atual está incorreta.' });
    }

    const newHash = hashPassword(nova_senha);
    db.prepare('UPDATE usuario SET senha_hash = ?, updated_at = datetime("now") WHERE id_usuario = ?').run(newHash, userId);

    return res.json({
      success: true,
      message: 'Senha alterada com sucesso!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao alterar senha.', error: err.message });
  }
});

// ==========================================
// 2. EVENTOS
// ==========================================

// GET /api/events
apiRouter.get('/events', (req: Request, res: Response) => {
  try {
    const { search, status, tab, organizadorId, formato } = req.query;
    const currentUserId = req.user ? req.user.id_usuario : null;

    let query = `
      SELECT 
        e.*,
        u.nome as organizador_nome,
        u.email as organizador_email,
        (SELECT COUNT(*) FROM inscricao i WHERE i.id_evento = e.id_evento AND i.status = 'CONFIRMADA') as total_inscritos
    `;

    if (currentUserId) {
      query += `,
        (SELECT COUNT(*) FROM inscricao i WHERE i.id_evento = e.id_evento AND i.id_usuario = ${currentUserId} AND i.status = 'CONFIRMADA') as usuario_inscrito,
        (SELECT COUNT(*) FROM favorito f WHERE f.id_evento = e.id_evento AND f.id_usuario = ${currentUserId}) as is_favorito
      `;
    } else {
      query += `, 0 as usuario_inscrito, 0 as is_favorito`;
    }

    query += ` FROM evento e JOIN usuario u ON e.id_organizador = u.id_usuario WHERE 1=1 `;
    const params: any[] = [];

    // Filter by tab for Professor
    if (tab) {
      if (tab === 'publicados') {
        query += ` AND e.status = 'PUBLICADO' `;
      } else if (tab === 'ativos') {
        query += ` AND e.status IN ('APROVADO', 'PUBLICADO', 'EM_ANDAMENTO') `;
      } else if (tab === 'encerrados') {
        query += ` AND e.status = 'ENCERRADO' `;
      } else if (tab === 'cancelados') {
        query += ` AND e.status = 'CANCELADO' `;
      } else if (tab === 'rascunhos') {
        query += ` AND e.status = 'RASCUNHO' `;
      }
    } else if (status) {
      query += ` AND e.status = ? `;
      params.push(status);
    } else {
      // Default: If not admin or organizer filtering, show public viewable events
      if (!organizadorId && (!req.user || req.user.perfil === 'PARTICIPANTE')) {
        query += ` AND e.status IN ('PUBLICADO', 'EM_ANDAMENTO', 'ENCERRADO') `;
      }
    }

    if (organizadorId) {
      query += ` AND e.id_organizador = ? `;
      params.push(Number(organizadorId));
    }

    if (formato) {
      query += ` AND e.formato = ? `;
      params.push(formato);
    }

    if (search) {
      query += ` AND (e.titulo LIKE ? OR e.descricao LIKE ? OR e.local LIKE ?) `;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY e.data_inicio DESC `;

    const events = db.prepare(query).all(...params);
    return res.json({ success: true, events });
  } catch (err: any) {
    console.error('Events list error:', err);
    return res.status(500).json({ success: false, message: 'Erro ao buscar eventos.', error: err.message });
  }
});

// GET /api/events/:id
apiRouter.get('/events/:id', (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    const currentUserId = req.user ? req.user.id_usuario : null;

    const event = db.prepare(`
      SELECT 
        e.*,
        u.nome as organizador_nome,
        u.email as organizador_email,
        u.telefone as organizador_telefone,
        (SELECT COUNT(*) FROM inscricao i WHERE i.id_evento = e.id_evento AND i.status = 'CONFIRMADA') as total_inscritos
      FROM evento e
      JOIN usuario u ON e.id_organizador = u.id_usuario
      WHERE e.id_evento = ?
    `).get(eventId) as any;

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento não encontrado.', error: 'NOT_FOUND' });
    }

    // Get schedule
    const schedule = db.prepare(`
      SELECT * FROM programacao WHERE id_evento = ? ORDER BY data ASC, horario_inicio ASC
    `).all(eventId);

    // Get associated courses
    const courses = db.prepare(`
      SELECT c.* FROM curso c
      JOIN evento_curso ec ON c.id_curso = ec.id_curso
      WHERE ec.id_evento = ?
    `).all(eventId);

    // Check user registration & presence & certificate if logged in
    let userRegistration: any = null;
    let userCertificate: any = null;
    let isFavorited = false;

    if (currentUserId) {
      userRegistration = db.prepare(`
        SELECT * FROM inscricao WHERE id_evento = ? AND id_usuario = ?
      `).get(eventId, currentUserId);

      userCertificate = db.prepare(`
        SELECT * FROM certificado WHERE id_evento = ? AND id_usuario = ?
      `).get(eventId, currentUserId);

      const fav = db.prepare('SELECT id_favorito FROM favorito WHERE id_evento = ? AND id_usuario = ?').get(eventId, currentUserId);
      isFavorited = !!fav;
    }

    return res.json({
      success: true,
      event: {
        ...event,
        vagas_restantes: Math.max(0, event.limite_vagas - event.total_inscritos),
        programacao: schedule,
        cursos: courses,
        inscrito: userRegistration && userRegistration.status === 'CONFIRMADA',
        inscricao: userRegistration,
        certificado: userCertificate,
        is_favorito: isFavorited
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar detalhes do evento.', error: err.message });
  }
});

// POST /api/events (RN01: Somente professores criam eventos)
apiRouter.post('/events', requireAuth, requireRole('PROFESSOR', 'ADMINISTRADOR'), (req: Request, res: Response) => {
  try {
    const {
      titulo,
      descricao,
      banner,
      local,
      data_inicio,
      data_fim,
      horario,
      inicio_inscricoes,
      fim_inscricoes,
      limite_vagas,
      formato,
      status,
      cursos_ids,
      programacao
    } = req.body;

    // Validations
    if (!titulo || !local || !data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        message: 'Título, local, data inicial e final são obrigatórios.',
        error: 'MISSING_FIELDS'
      });
    }

    const vagas = Number(limite_vagas) || 50;
    if (vagas <= 0) {
      return res.status(400).json({
        success: false,
        message: 'O limite de vagas deve ser maior que zero.',
        error: 'INVALID_VACANCIES'
      });
    }

    // RN07: As inscrições devem terminar antes ou no início do evento
    const dataInicioDt = new Date(data_inicio);
    const dataFimDt = new Date(data_fim);
    if (dataFimDt < dataInicioDt) {
      return res.status(400).json({
        success: false,
        message: 'A data de término não pode ser anterior à data de início.',
        error: 'INVALID_DATES'
      });
    }

    const organizerId = req.user!.id_usuario;
    const initialStatus = status === 'PUBLICADO' ? 'PUBLICADO' : (status === 'RASCUNHO' ? 'RASCUNHO' : 'PENDENTE');

    const insertEventStmt = db.prepare(`
      INSERT INTO evento (
        id_organizador, titulo, descricao, banner, local, data_inicio, data_fim, horario,
        inicio_inscricoes, fim_inscricoes, limite_vagas, formato, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertEventStmt.run(
      organizerId,
      titulo.trim(),
      descricao ? descricao.trim() : null,
      banner || null,
      local.trim(),
      data_inicio,
      data_fim,
      horario ? horario.trim() : '08:00h - 18:00h',
      inicio_inscricoes || new Date().toISOString().split('T')[0],
      fim_inscricoes || data_inicio,
      vagas,
      formato || 'Presencial',
      initialStatus
    );

    const eventId = Number(result.lastInsertRowid);

    // Link cursos if provided
    if (Array.isArray(cursos_ids)) {
      const linkStmt = db.prepare('INSERT OR IGNORE INTO evento_curso (id_evento, id_curso) VALUES (?, ?)');
      for (const cId of cursos_ids) {
        linkStmt.run(eventId, Number(cId));
      }
    }

    // Add initial schedule items if provided
    if (Array.isArray(programacao)) {
      const progStmt = db.prepare(`
        INSERT INTO programacao (id_evento, titulo, descricao, data, horario_inicio, horario_fim, local, responsavel)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of programacao) {
        if (p.titulo) {
          progStmt.run(
            eventId,
            p.titulo,
            p.descricao || '',
            p.data || data_inicio,
            p.horario_inicio || '08:00',
            p.horario_fim || '10:00',
            p.local || local,
            p.responsavel || req.user!.nome
          );
        }
      }
    }

    // Audit log
    db.prepare('INSERT INTO auditoria (id_usuario, acao, detalhes, ip) VALUES (?, ?, ?, ?)').run(
      organizerId,
      'CRIAR_EVENTO',
      `Evento criado: "${titulo}" com status ${initialStatus}`,
      req.ip || '127.0.0.1'
    );

    return res.status(201).json({
      success: true,
      message: 'Evento cadastrado com sucesso!',
      eventId
    });
  } catch (err: any) {
    console.error('Create event error:', err);
    return res.status(500).json({ success: false, message: 'Erro ao cadastrar evento.', error: err.message });
  }
});

// PUT /api/events/:id (RN06: Eventos encerrados não podem ser editados; RN09: Somente professor responsável ou admin edita)
apiRouter.put('/events/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM evento WHERE id_evento = ?').get(eventId) as any;

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Evento não encontrado.' });
    }

    // RN06: Eventos encerrados não podem ser editados
    if (existing.status === 'ENCERRADO') {
      return res.status(400).json({
        success: false,
        message: 'Eventos encerrados não podem ser alterados.',
        error: 'EVENT_ALREADY_ENDED'
      });
    }

    // RN09: Somente o professor responsável (ou administrador) pode editar seu evento
    if (req.user!.perfil !== 'ADMINISTRADOR' && existing.id_organizador !== req.user!.id_usuario) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para editar o evento de outro professor.',
        error: 'FORBIDDEN'
      });
    }

    const {
      titulo,
      descricao,
      banner,
      local,
      data_inicio,
      data_fim,
      horario,
      inicio_inscricoes,
      fim_inscricoes,
      limite_vagas,
      formato,
      status
    } = req.body;

    db.prepare(`
      UPDATE evento
      SET 
        titulo = coalesce(?, titulo),
        descricao = coalesce(?, descricao),
        banner = coalesce(?, banner),
        local = coalesce(?, local),
        data_inicio = coalesce(?, data_inicio),
        data_fim = coalesce(?, data_fim),
        horario = coalesce(?, horario),
        inicio_inscricoes = coalesce(?, inicio_inscricoes),
        fim_inscricoes = coalesce(?, fim_inscricoes),
        limite_vagas = coalesce(?, limite_vagas),
        formato = coalesce(?, formato),
        status = coalesce(?, status),
        atualizado_em = datetime('now')
      WHERE id_evento = ?
    `).run(
      titulo !== undefined ? titulo : null,
      descricao !== undefined ? descricao : null,
      banner !== undefined ? banner : null,
      local !== undefined ? local : null,
      data_inicio !== undefined ? data_inicio : null,
      data_fim !== undefined ? data_fim : null,
      horario !== undefined ? horario : null,
      inicio_inscricoes !== undefined ? inicio_inscricoes : null,
      fim_inscricoes !== undefined ? fim_inscricoes : null,
      limite_vagas ? Number(limite_vagas) : null,
      formato !== undefined ? formato : null,
      status !== undefined ? status : null,
      eventId
    );

    return res.json({
      success: true,
      message: 'Evento atualizado com sucesso!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao atualizar evento.', error: err.message });
  }
});

// POST /api/events/:id/status
apiRouter.post('/events/:id/status', requireAuth, (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    const { status, justificativa } = req.body;

    const existing = db.prepare('SELECT * FROM evento WHERE id_evento = ?').get(eventId) as any;
    if (!existing) return res.status(404).json({ success: false, message: 'Evento não encontrado.' });

    // Authorization
    if (req.user!.perfil !== 'ADMINISTRADOR' && existing.id_organizador !== req.user!.id_usuario) {
      return res.status(403).json({ success: false, message: 'Ação não permitida.' });
    }

    db.prepare(`
      UPDATE evento
      SET status = ?, justificativa_recusa = ?, atualizado_em = datetime('now')
      WHERE id_evento = ?
    `).run(status, justificativa || null, eventId);

    // If status became ENCERRADO, notify participants
    if (status === 'ENCERRADO') {
      const registrations = db.prepare('SELECT id_usuario FROM inscricao WHERE id_evento = ? AND status = "CONFIRMADA"').all(eventId) as any[];
      const notifStmt = db.prepare('INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo) VALUES (?, ?, ?, ?)');
      for (const r of registrations) {
        notifStmt.run(
          r.id_usuario,
          'Evento Encerrado',
          `O evento "${existing.titulo}" foi encerrado. Verifique a emissão do seu certificado!`,
          'INFO'
        );
      }
    }

    return res.json({ success: true, message: `Status do evento alterado para ${status}.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao atualizar status.', error: err.message });
  }
});

// ==========================================
// 3. INSCRIÇÕES
// ==========================================

// POST /api/events/:id/register (RN05: Sem duplicidade, RN08: Vagas, RN07: Período)
apiRouter.post('/events/:id/register', requireAuth, (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    const userId = req.user!.id_usuario;

    const event = db.prepare(`
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM inscricao i WHERE i.id_evento = e.id_evento AND i.status = 'CONFIRMADA') as total_inscritos
      FROM evento e WHERE e.id_evento = ?
    `).get(eventId) as any;

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento não encontrado.' });
    }

    if (event.status === 'CANCELADO') {
      return res.status(400).json({ success: false, message: 'Este evento foi cancelado.' });
    }

    if (event.status === 'ENCERRADO') {
      return res.status(400).json({ success: false, message: 'Este evento já foi encerrado.' });
    }

    // RN05: Participante não pode se inscrever duas vezes
    const existingInscricao = db.prepare(`
      SELECT * FROM inscricao WHERE id_evento = ? AND id_usuario = ?
    `).get(eventId, userId) as any;

    if (existingInscricao && existingInscricao.status === 'CONFIRMADA') {
      return res.status(400).json({
        success: false,
        message: 'Você já está inscrito neste evento.',
        error: 'ALREADY_REGISTERED'
      });
    }

    // RN07: Inscrições devem estar dentro do período
    const today = new Date().toISOString().split('T')[0];
    if (event.fim_inscricoes && today > event.fim_inscricoes) {
      return res.status(400).json({
        success: false,
        message: 'O período de inscrições para este evento já foi encerrado.',
        error: 'REGISTRATION_CLOSED'
      });
    }

    // RN08: O número de inscritos nunca pode ultrapassar o limite de vagas
    if (event.total_inscritos >= event.limite_vagas) {
      return res.status(400).json({
        success: false,
        message: 'Evento lotado! Todas as vagas já foram preenchidas.',
        error: 'EVENT_FULL'
      });
    }

    if (existingInscricao && existingInscricao.status === 'CANCELADA') {
      db.prepare(`
        UPDATE inscricao
        SET status = 'CONFIRMADA', data_inscricao = datetime('now'), data_cancelamento = null
        WHERE id_inscricao = ?
      `).run(existingInscricao.id_inscricao);
    } else {
      db.prepare(`
        INSERT INTO inscricao (id_usuario, id_evento, status, turma, data_inscricao)
        VALUES (?, ?, 'CONFIRMADA', 'Informática S1', datetime('now'))
      `).run(userId, eventId);
    }

    // Notification
    db.prepare('INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo) VALUES (?, ?, ?, ?)').run(
      userId,
      'Inscrição Realizada',
      `Sua inscrição no evento "${event.titulo}" foi confirmada com sucesso.`,
      'SUCESSO'
    );

    // Audit
    db.prepare('INSERT INTO auditoria (id_usuario, acao, detalhes, ip) VALUES (?, ?, ?, ?)').run(
      userId,
      'INSCRICAO_EVENTO',
      `Inscrição no evento ID ${eventId} ("${event.titulo}")`,
      req.ip || '127.0.0.1'
    );

    return res.status(201).json({
      success: true,
      message: 'Inscrição realizada com sucesso! Nos vemos no evento.'
    });
  } catch (err: any) {
    console.error('Register in event error:', err);
    return res.status(500).json({ success: false, message: 'Erro ao realizar inscrição.', error: err.message });
  }
});

// DELETE /api/events/:id/register (RN12: Cancelamento somente antes do encerramento das inscrições)
apiRouter.delete('/events/:id/register', requireAuth, (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    const userId = req.user!.id_usuario;

    const event = db.prepare('SELECT * FROM evento WHERE id_evento = ?').get(eventId) as any;
    if (!event) return res.status(404).json({ success: false, message: 'Evento não encontrado.' });

    // RN12: Cancelamento somente antes do encerramento das inscrições
    const today = new Date().toISOString().split('T')[0];
    if (event.fim_inscricoes && today > event.fim_inscricoes) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível cancelar a inscrição pois o prazo de inscrições já encerrou.',
        error: 'CANCELLATION_DEADLINE_PASSED'
      });
    }

    const inscricao = db.prepare('SELECT * FROM inscricao WHERE id_evento = ? AND id_usuario = ? AND status = "CONFIRMADA"').get(eventId, userId) as any;
    if (!inscricao) {
      return res.status(400).json({ success: false, message: 'Você não possui inscrição ativa neste evento.' });
    }

    db.prepare(`
      UPDATE inscricao
      SET status = 'CANCELADA', data_cancelamento = datetime('now')
      WHERE id_inscricao = ?
    `).run(inscricao.id_inscricao);

    return res.json({
      success: true,
      message: 'Inscrição cancelada com sucesso. A vaga foi liberada.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao cancelar inscrição.', error: err.message });
  }
});

// GET /api/me/registrations
apiRouter.get('/me/registrations', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id_usuario;
    const today = new Date().toISOString().split('T')[0];

    const registrations = db.prepare(`
      SELECT 
        i.id_inscricao,
        i.status as status_inscricao,
        i.data_inscricao,
        i.data_cancelamento,
        e.*,
        u.nome as organizador_nome,
        (SELECT COUNT(*) FROM favorito f WHERE f.id_evento = e.id_evento AND f.id_usuario = ?) as is_favorito,
        (CASE WHEN e.fim_inscricoes >= ? THEN 1 ELSE 0 END) as pode_cancelar
      FROM inscricao i
      JOIN evento e ON i.id_evento = e.id_evento
      JOIN usuario u ON e.id_organizador = u.id_usuario
      WHERE i.id_usuario = ? AND i.status = 'CONFIRMADA'
      ORDER BY e.data_inicio ASC
    `).all(userId, today, userId);

    return res.json({ success: true, registrations });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar inscrições.', error: err.message });
  }
});

// POST /api/events/:id/favorite
apiRouter.post('/events/:id/favorite', requireAuth, (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    const userId = req.user!.id_usuario;

    const existing = db.prepare('SELECT id_favorito FROM favorito WHERE id_evento = ? AND id_usuario = ?').get(eventId, userId) as any;

    if (existing) {
      db.prepare('DELETE FROM favorito WHERE id_favorito = ?').run(existing.id_favorito);
      return res.json({ success: true, favorited: false });
    } else {
      db.prepare('INSERT INTO favorito (id_usuario, id_evento) VALUES (?, ?)').run(userId, eventId);
      return res.json({ success: true, favorited: true });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao alternar favorito.', error: err.message });
  }
});

// ==========================================
// 4. FREQUÊNCIA E CERTIFICADOS
// ==========================================

// GET /api/events/:id/attendance
apiRouter.get('/events/:id/attendance', requireAuth, (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    const currentUserId = req.user!.id_usuario;

    const event = db.prepare('SELECT id_organizador, titulo, status FROM evento WHERE id_evento = ?').get(eventId) as any;
    if (!event) return res.status(404).json({ success: false, message: 'Evento não encontrado.' });

    // Must be organizer or admin
    if (req.user!.perfil !== 'ADMINISTRADOR' && event.id_organizador !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Apenas o organizador pode visualizar a lista de frequência.' });
    }

    const participants = db.prepare(`
      SELECT 
        i.id_inscricao,
        i.turma,
        u.id_usuario,
        u.nome,
        u.email,
        u.matricula,
        (SELECT COALESCE(MAX(f.presente), 0) FROM frequencia f WHERE f.id_inscricao = i.id_inscricao) as presenca,
        (SELECT c.codigo_validacao FROM certificado c WHERE c.id_evento = i.id_evento AND c.id_usuario = u.id_usuario) as certificado_codigo
      FROM inscricao i
      JOIN usuario u ON i.id_usuario = u.id_usuario
      WHERE i.id_evento = ? AND i.status = 'CONFIRMADA'
      ORDER BY u.nome ASC
    `).all(eventId);

    return res.json({ success: true, event, participants });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar frequência.', error: err.message });
  }
});

// POST /api/events/:id/attendance
apiRouter.post('/events/:id/attendance', requireAuth, (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    const { id_inscricao, presente } = req.body;

    const event = db.prepare('SELECT id_organizador FROM evento WHERE id_evento = ?').get(eventId) as any;
    if (!event) return res.status(404).json({ success: false, message: 'Evento não encontrado.' });

    if (req.user!.perfil !== 'ADMINISTRADOR' && event.id_organizador !== req.user!.id_usuario) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    const firstProg = db.prepare('SELECT id_programacao FROM programacao WHERE id_evento = ? LIMIT 1').get(eventId) as any;
    const progId = firstProg ? firstProg.id_programacao : null;

    db.prepare(`
      INSERT INTO frequencia (id_inscricao, id_programacao, presente, registrado_em)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(id_inscricao, id_programacao) DO UPDATE SET presente = excluded.presente, registrado_em = datetime('now')
    `).run(id_inscricao, progId, presente ? 1 : 0);

    return res.json({ success: true, message: 'Presença atualizada com sucesso!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao registrar frequência.', error: err.message });
  }
});

// POST /api/events/:id/release-certificates (RN10: Somente após encerramento; RN03: Somente participante com presença)
apiRouter.post('/events/:id/release-certificates', requireAuth, (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    const event = db.prepare('SELECT * FROM evento WHERE id_evento = ?').get(eventId) as any;
    if (!event) return res.status(404).json({ success: false, message: 'Evento não encontrado.' });

    if (req.user!.perfil !== 'ADMINISTRADOR' && event.id_organizador !== req.user!.id_usuario) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    // RN10: Certificados somente após encerramento do evento
    if (event.status !== 'ENCERRADO') {
      return res.status(400).json({
        success: false,
        message: 'Os certificados só podem ser liberados após o encerramento oficial do evento.',
        error: 'EVENT_NOT_ENDED'
      });
    }

    // Find all confirmed registrations with presence = 1
    const eligible = db.prepare(`
      SELECT DISTINCT i.id_usuario
      FROM inscricao i
      JOIN frequencia f ON i.id_inscricao = f.id_inscricao
      WHERE i.id_evento = ? AND i.status = 'CONFIRMADA' AND f.presente = 1
    `).all(eventId) as any[];

    const insertCert = db.prepare(`
      INSERT OR IGNORE INTO certificado (id_usuario, id_evento, codigo_validacao, carga_horaria, liberado, data_emissao)
      VALUES (?, ?, ?, 20, 1, datetime('now'))
    `);

    let count = 0;
    for (const el of eligible) {
      const uniqueCode = `IFCE-CERT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const res = insertCert.run(el.id_usuario, eventId, uniqueCode);
      if (res.changes > 0) count++;
    }

    return res.json({
      success: true,
      message: `${count} certificado(s) emitido(s) com sucesso para os participantes com presença confirmada!`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao liberar certificados.', error: err.message });
  }
});

// GET /api/me/certificates
apiRouter.get('/me/certificates', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id_usuario;

    const certificates = db.prepare(`
      SELECT 
        c.id_certificado,
        c.codigo_validacao,
        c.carga_horaria,
        c.data_emissao,
        e.id_evento,
        e.titulo as evento_titulo,
        e.data_inicio,
        e.data_fim,
        e.local,
        u.nome as organizador_nome
      FROM certificado c
      JOIN evento e ON c.id_evento = e.id_evento
      JOIN usuario u ON e.id_organizador = u.id_usuario
      WHERE c.id_usuario = ? AND c.liberado = 1
      ORDER BY c.data_emissao DESC
    `).all(userId);

    return res.json({ success: true, certificates });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar certificados.', error: err.message });
  }
});

// GET /api/certificates/:code (Verificação pública)
apiRouter.get('/certificates/verify/:code', (req: Request, res: Response) => {
  try {
    const code = req.params.code;

    const cert = db.prepare(`
      SELECT 
        c.id_certificado,
        c.codigo_validacao,
        c.carga_horaria,
        c.data_emissao,
        u.nome as participante_nome,
        u.matricula as participante_matricula,
        e.titulo as evento_titulo,
        e.data_inicio,
        e.data_fim,
        e.local,
        org.nome as organizador_nome
      FROM certificado c
      JOIN usuario u ON c.id_usuario = u.id_usuario
      JOIN evento e ON c.id_evento = e.id_evento
      JOIN usuario org ON e.id_organizador = org.id_usuario
      WHERE c.codigo_validacao = ?
    `).get(code) as any;

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificado não encontrado ou inválido.' });
    }

    return res.json({ success: true, certificado: cert });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao verificar certificado.', error: err.message });
  }
});

// ==========================================
// 5. PAINEL ADMINISTRATIVO
// ==========================================

// GET /api/admin/stats
apiRouter.get('/admin/stats', requireAuth, requireRole('ADMINISTRADOR'), (req: Request, res: Response) => {
  try {
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM usuario').get() as any).count;
    const totalProfessors = (db.prepare('SELECT COUNT(*) as count FROM usuario WHERE perfil = "PROFESSOR"').get() as any).count;
    const totalParticipants = (db.prepare('SELECT COUNT(*) as count FROM usuario WHERE perfil = "PARTICIPANTE"').get() as any).count;

    const pendingEvents = (db.prepare('SELECT COUNT(*) as count FROM evento WHERE status = "PENDENTE"').get() as any).count;
    const approvedEvents = (db.prepare('SELECT COUNT(*) as count FROM evento WHERE status IN ("APROVADO", "PUBLICADO")').get() as any).count;
    const endedEvents = (db.prepare('SELECT COUNT(*) as count FROM evento WHERE status = "ENCERRADO"').get() as any).count;

    const totalRegistrations = (db.prepare('SELECT COUNT(*) as count FROM inscricao WHERE status = "CONFIRMADA"').get() as any).count;
    const totalCertificates = (db.prepare('SELECT COUNT(*) as count FROM certificado').get() as any).count;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalProfessors,
        totalParticipants,
        pendingEvents,
        approvedEvents,
        endedEvents,
        totalRegistrations,
        totalCertificates
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao obter estatísticas.', error: err.message });
  }
});

// GET /api/admin/events (Aprovação e Gerenciamento de eventos)
apiRouter.get('/admin/events', requireAuth, requireRole('ADMINISTRADOR'), (req: Request, res: Response) => {
  try {
    const events = db.prepare(`
      SELECT 
        e.*,
        u.nome as organizador_nome,
        u.email as organizador_email,
        (SELECT COUNT(*) FROM inscricao i WHERE i.id_evento = e.id_evento AND i.status = 'CONFIRMADA') as total_inscritos
      FROM evento e
      JOIN usuario u ON e.id_organizador = u.id_usuario
      ORDER BY (CASE WHEN e.status = 'PENDENTE' THEN 0 ELSE 1 END), e.criado_em DESC
    `).all();

    return res.json({ success: true, events });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao listar eventos.', error: err.message });
  }
});

// POST /api/admin/events/:id/approve
apiRouter.post('/admin/events/:id/approve', requireAuth, requireRole('ADMINISTRADOR'), (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    db.prepare('UPDATE evento SET status = "PUBLICADO", atualizado_em = datetime("now") WHERE id_evento = ?').run(eventId);

    db.prepare('INSERT INTO auditoria (id_usuario, acao, detalhes, ip) VALUES (?, ?, ?, ?)').run(
      req.user!.id_usuario,
      'APROVACAO_EVENTO',
      `Evento ID ${eventId} aprovado pelo administrador`,
      req.ip || '127.0.0.1'
    );

    return res.json({ success: true, message: 'Evento aprovado e publicado com sucesso!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao aprovar evento.', error: err.message });
  }
});

// POST /api/admin/events/:id/reject
apiRouter.post('/admin/events/:id/reject', requireAuth, requireRole('ADMINISTRADOR'), (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    const { justificativa } = req.body;

    if (!justificativa || !justificativa.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A justificativa da recusa é obrigatória.',
        error: 'JUSTIFICATION_REQUIRED'
      });
    }

    db.prepare('UPDATE evento SET status = "REJEITADO", justificativa_recusa = ?, atualizado_em = datetime("now") WHERE id_evento = ?').run(
      justificativa.trim(),
      eventId
    );

    db.prepare('INSERT INTO auditoria (id_usuario, acao, detalhes, ip) VALUES (?, ?, ?, ?)').run(
      req.user!.id_usuario,
      'RECUSA_EVENTO',
      `Evento ID ${eventId} recusado. Motivo: ${justificativa.trim()}`,
      req.ip || '127.0.0.1'
    );

    return res.json({ success: true, message: 'Evento recusado com sucesso.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao recusar evento.', error: err.message });
  }
});

// GET /api/admin/users
apiRouter.get('/admin/users', requireAuth, requireRole('ADMINISTRADOR'), (req: Request, res: Response) => {
  try {
    const users = db.prepare(`
      SELECT id_usuario, nome, email, matricula, perfil, status_conta, telefone, ativo, created_at
      FROM usuario
      ORDER BY created_at DESC
    `).all();

    return res.json({ success: true, users });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao listar usuários.', error: err.message });
  }
});

// DELETE /api/admin/users/:id (RN02: Somente administradores excluem usuários)
apiRouter.delete('/admin/users/:id', requireAuth, requireRole('ADMINISTRADOR'), (req: Request, res: Response) => {
  try {
    const targetUserId = Number(req.params.id);

    if (targetUserId === req.user!.id_usuario) {
      return res.status(400).json({ success: false, message: 'Você não pode excluir sua própria conta de administrador.' });
    }

    db.prepare('DELETE FROM usuario WHERE id_usuario = ?').run(targetUserId);

    db.prepare('INSERT INTO auditoria (id_usuario, acao, detalhes, ip) VALUES (?, ?, ?, ?)').run(
      req.user!.id_usuario,
      'EXCLUSAO_USUARIO',
      `Usuário ID ${targetUserId} excluído pelo administrador`,
      req.ip || '127.0.0.1'
    );

    return res.json({ success: true, message: 'Usuário excluído com sucesso.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao excluir usuário.', error: err.message });
  }
});

// GET /api/admin/courses
apiRouter.get('/admin/courses', (req: Request, res: Response) => {
  try {
    const courses = db.prepare('SELECT * FROM curso ORDER BY nome ASC').all();
    return res.json({ success: true, courses });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao listar cursos.', error: err.message });
  }
});

// POST /api/admin/courses
apiRouter.post('/admin/courses', requireAuth, requireRole('ADMINISTRADOR'), (req: Request, res: Response) => {
  try {
    const { nome, codigo } = req.body;
    if (!nome || !codigo) return res.status(400).json({ success: false, message: 'Nome e código são obrigatórios.' });

    db.prepare('INSERT INTO curso (nome, codigo) VALUES (?, ?)').run(nome.trim(), codigo.trim().toUpperCase());
    return res.status(201).json({ success: true, message: 'Curso cadastrado com sucesso!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao cadastrar curso.', error: err.message });
  }
});

// GET /api/admin/semesters
apiRouter.get('/admin/semesters', (req: Request, res: Response) => {
  try {
    const semesters = db.prepare('SELECT * FROM semestre ORDER BY ano DESC, periodo DESC').all();
    return res.json({ success: true, semesters });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao listar semestres.', error: err.message });
  }
});

// POST /api/admin/semesters
apiRouter.post('/admin/semesters', requireAuth, requireRole('ADMINISTRADOR'), (req: Request, res: Response) => {
  try {
    const { nome, ano, periodo } = req.body;
    if (!nome || !ano || !periodo) return res.status(400).json({ success: false, message: 'Preencha todos os campos do semestre.' });

    db.prepare('INSERT INTO semestre (nome, ano, periodo) VALUES (?, ?, ?)').run(nome.trim(), Number(ano), Number(periodo));
    return res.status(201).json({ success: true, message: 'Semestre cadastrado com sucesso!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao cadastrar semestre.', error: err.message });
  }
});

// GET /api/admin/audit
apiRouter.get('/admin/audit', requireAuth, requireRole('ADMINISTRADOR'), (req: Request, res: Response) => {
  try {
    const logs = db.prepare(`
      SELECT a.*, u.nome as usuario_nome, u.email as usuario_email
      FROM auditoria a
      LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all();
    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar registros de auditoria.', error: err.message });
  }
});
