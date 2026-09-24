import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve(process.cwd(), 'iventus.sqlite');
export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function hashPassword(password: string): string {
  const salt = 'ifce_iventus_salt_2024';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function initDatabase() {
  db.exec(`
    -- Tabela de Usuários
    CREATE TABLE IF NOT EXISTS usuario (
      id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      matricula TEXT,
      perfil TEXT NOT NULL CHECK(perfil IN ('ADMINISTRADOR', 'PROFESSOR', 'PARTICIPANTE')),
      foto_perfil TEXT,
      telefone TEXT,
      materias_responsavel TEXT,
      status_conta TEXT NOT NULL DEFAULT 'APROVADO' CHECK(status_conta IN ('PENDENTE', 'APROVADO', 'RECUSADO')),
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Tabela de Cursos
    CREATE TABLE IF NOT EXISTS curso (
      id_curso INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      codigo TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'ATIVO' CHECK(status IN ('ATIVO', 'INATIVO'))
    );

    -- Tabela de Semestres
    CREATE TABLE IF NOT EXISTS semestre (
      id_semestre INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      ano INTEGER NOT NULL,
      periodo INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ATIVO' CHECK(status IN ('ATIVO', 'INATIVO'))
    );

    -- Tabela de Eventos
    CREATE TABLE IF NOT EXISTS evento (
      id_evento INTEGER PRIMARY KEY AUTOINCREMENT,
      id_organizador INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      descricao TEXT,
      banner TEXT,
      local TEXT NOT NULL,
      data_inicio TEXT NOT NULL,
      data_fim TEXT NOT NULL,
      horario TEXT,
      inicio_inscricoes TEXT NOT NULL,
      fim_inscricoes TEXT NOT NULL,
      limite_vagas INTEGER NOT NULL CHECK(limite_vagas > 0),
      formato TEXT NOT NULL DEFAULT 'Presencial' CHECK(formato IN ('Presencial', 'Online', 'Híbrido')),
      status TEXT NOT NULL DEFAULT 'RASCUNHO' CHECK(status IN ('RASCUNHO', 'PENDENTE', 'APROVADO', 'REJEITADO', 'PUBLICADO', 'OCULTO', 'EM_ANDAMENTO', 'ENCERRADO', 'CANCELADO')),
      visibilidade TEXT NOT NULL DEFAULT 'PUBLICO' CHECK(visibilidade IN ('PUBLICO', 'PRIVADO')),
      justificativa_recusa TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Tabela de Relacionamento Evento x Cursos
    CREATE TABLE IF NOT EXISTS evento_curso (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_evento INTEGER NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      UNIQUE(id_evento, id_curso)
    );

    -- Tabela de Programação do Evento
    CREATE TABLE IF NOT EXISTS programacao (
      id_programacao INTEGER PRIMARY KEY AUTOINCREMENT,
      id_evento INTEGER NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      descricao TEXT,
      data TEXT NOT NULL,
      horario_inicio TEXT NOT NULL,
      horario_fim TEXT NOT NULL,
      local TEXT,
      responsavel TEXT
    );

    -- Tabela de Inscrições
    CREATE TABLE IF NOT EXISTS inscricao (
      id_inscricao INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
      id_evento INTEGER NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'CONFIRMADA' CHECK(status IN ('CONFIRMADA', 'CANCELADA', 'PENDENTE')),
      turma TEXT,
      data_inscricao TEXT NOT NULL DEFAULT (datetime('now')),
      data_cancelamento TEXT,
      UNIQUE(id_usuario, id_evento)
    );

    -- Tabela de Frequência / Presença
    CREATE TABLE IF NOT EXISTS frequencia (
      id_frequencia INTEGER PRIMARY KEY AUTOINCREMENT,
      id_inscricao INTEGER NOT NULL REFERENCES inscricao(id_inscricao) ON DELETE CASCADE,
      id_programacao INTEGER REFERENCES programacao(id_programacao) ON DELETE CASCADE,
      presente INTEGER NOT NULL DEFAULT 0 CHECK(presente IN (0, 1)),
      registrado_em TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(id_inscricao, id_programacao)
    );

    -- Tabela de Certificados
    CREATE TABLE IF NOT EXISTS certificado (
      id_certificado INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
      id_evento INTEGER NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE,
      codigo_validacao TEXT NOT NULL UNIQUE,
      carga_horaria INTEGER NOT NULL DEFAULT 20,
      arquivo TEXT,
      liberado INTEGER NOT NULL DEFAULT 1 CHECK(liberado IN (0, 1)),
      data_emissao TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(id_usuario, id_evento)
    );

    -- Tabela de Favoritos
    CREATE TABLE IF NOT EXISTS favorito (
      id_favorito INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
      id_evento INTEGER NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(id_usuario, id_evento)
    );

    -- Tabela de Notificações
    CREATE TABLE IF NOT EXISTS notificacao (
      id_notificacao INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'INFO',
      lida INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Tabela de Auditoria
    CREATE TABLE IF NOT EXISTS auditoria (
      id_auditoria INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
      acao TEXT NOT NULL,
      detalhes TEXT,
      ip TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Tabela de Recuperação de Senha
    CREATE TABLE IF NOT EXISTS recuperacao_senha (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expira_em TEXT NOT NULL,
      usado INTEGER NOT NULL DEFAULT 0
    );

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_evento_status ON evento(status);
    CREATE INDEX IF NOT EXISTS idx_evento_organizador ON evento(id_organizador);
    CREATE INDEX IF NOT EXISTS idx_inscricao_usuario ON inscricao(id_usuario);
    CREATE INDEX IF NOT EXISTS idx_inscricao_evento ON inscricao(id_evento);
    CREATE INDEX IF NOT EXISTS idx_certificado_codigo ON certificado(codigo_validacao);
  `);

  // Check if initial users exist, seed if not
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM usuario');
  const result = countStmt.get() as { count: number };

  if (result.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  console.log('Seeding initial IFCE Iventus database...');

  // 1. Insert Cursos
  const insertCurso = db.prepare('INSERT INTO curso (nome, codigo, status) VALUES (?, ?, ?)');
  insertCurso.run('Bacharelado em Ciência da Computação', 'BCC', 'ATIVO');
  insertCurso.run('Engenharia de Software', 'ESW', 'ATIVO');
  insertCurso.run('Licenciatura em Física', 'FIS', 'ATIVO');
  insertCurso.run('Técnico em Informática', 'INFO', 'ATIVO');
  insertCurso.run('Técnico em Mecânica', 'MEC', 'ATIVO');

  // 2. Insert Semestres
  const insertSemestre = db.prepare('INSERT INTO semestre (nome, ano, periodo, status) VALUES (?, ?, ?, ?)');
  insertSemestre.run('2024.1', 2024, 1, 'ATIVO');
  insertSemestre.run('2024.2', 2024, 2, 'ATIVO');
  insertSemestre.run('2025.1', 2025, 1, 'ATIVO');
  insertSemestre.run('2026.1', 2026, 1, 'ATIVO');

  // 3. Insert Users (Standard test accounts + Figma users)
  const insertUser = db.prepare(`
    INSERT INTO usuario (nome, email, senha_hash, matricula, perfil, telefone, materias_responsavel, status_conta, foto_perfil)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Administrador (admin@teste.com / admin123)
  const adminId = insertUser.run(
    'Diego Teixeira Silva',
    'admin@teste.com',
    hashPassword('admin123'),
    'ADM-2024-001',
    'ADMINISTRADOR',
    '(88) 98822-1000',
    null,
    'APROVADO',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  ).lastInsertRowid;

  // Professor 1 (professor@teste.com / professor123 - Saulo Bezerra from Figma)
  const profSauloId = insertUser.run(
    'Saulo Bezerra',
    'professor@teste.com',
    hashPassword('professor123'),
    'PROF-8819',
    'PROFESSOR',
    '(88) 96798-1099',
    'LDS ARQM',
    'APROVADO',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  ).lastInsertRowid;

  // Professor 2 (José Olinda from Figma)
  const profJoseId = insertUser.run(
    'José Olinda',
    'jose.olinda@ifce.edu.br',
    hashPassword('professor123'),
    'PROF-7721',
    'PROFESSOR',
    '(88) 99811-2233',
    'Redes e Infraestrutura',
    'APROVADO',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  ).lastInsertRowid;

  // Professor 3 (Lucas Nogueira)
  const profLucasId = insertUser.run(
    'Lucas Nogueira',
    'lucas.nogueira@ifce.edu.br',
    hashPassword('professor123'),
    'PROF-6652',
    'PROFESSOR',
    '(88) 99744-5566',
    'Inteligência Artificial',
    'APROVADO',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  ).lastInsertRowid;

  // Professor 4 (Lyrane Brito Bezerra)
  insertUser.run(
    'Lyrane Brito Bezerra',
    'lyrane.bezerra@ifce.edu.br',
    hashPassword('professor123'),
    'PROF-5541',
    'PROFESSOR',
    '(88) 99633-8899',
    'Engenharia de Dados',
    'APROVADO',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
  );

  // Participante principal (participante@teste.com / participante123 - Luiz Thomas from Figma)
  const alunoLuizId = insertUser.run(
    'Luiz Thomas Marte Moreira',
    'participante@teste.com',
    hashPassword('participante123'),
    '123456789101112',
    'PARTICIPANTE',
    '(88) 99999-9999',
    null,
    'APROVADO',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
  ).lastInsertRowid;

  // Additional Figma participants for attendance tables
  const students = [
    { nome: 'Ana Beatriz Souza', email: 'ana.souza@aluno.ifce.edu.br', turma: 'Informática S1' },
    { nome: 'Ana Lívia Pinheiro Vieira', email: 'ana.livia@aluno.ifce.edu.br', turma: 'Informática S1' },
    { nome: 'Camilo Marquez', email: 'camilo.marquez@aluno.ifce.edu.br', turma: 'Informática S1' },
    { nome: 'Danilo Torres Matos', email: 'danilo.torres@aluno.ifce.edu.br', turma: 'Informática S1' },
    { nome: 'Gabriel da Silva', email: 'gabriel.silva@aluno.ifce.edu.br', turma: 'Informática S1' },
    { nome: 'Gabriela Oliveira Ferreira', email: 'gabriela.ferreira@aluno.ifce.edu.br', turma: 'Informática S1' },
    { nome: 'João Felipe Gonçalves Diniz', email: 'joao.felipe@aluno.ifce.edu.br', turma: 'Informática S1' },
    { nome: 'Carlos Eduardo Bezerra Duarte', email: 'carlos.duarte@aluno.ifce.edu.br', turma: 'Informática S2' },
    { nome: 'Maria Isabella Silva de Lima', email: 'isabella.lima@aluno.ifce.edu.br', turma: 'Informática S1' },
    { nome: 'Werych Monteiro Mendonça', email: 'werych.mendonca@aluno.ifce.edu.br', turma: 'Informática S3' },
  ];

  const studentIds: { [key: string]: number } = {};
  for (const s of students) {
    const res = insertUser.run(
      s.nome,
      s.email,
      hashPassword('aluno123'),
      'MATR-' + Math.floor(100000 + Math.random() * 900000),
      'PARTICIPANTE',
      '(88) 99000-' + Math.floor(1000 + Math.random() * 9000),
      null,
      'APROVADO',
      null
    );
    studentIds[s.nome] = Number(res.lastInsertRowid);
  }

  // 4. Insert Events (matching Figma screens precisely)
  const insertEvento = db.prepare(`
    INSERT INTO evento (
      id_organizador, titulo, descricao, banner, local, data_inicio, data_fim, horario,
      inicio_inscricoes, fim_inscricoes, limite_vagas, formato, status, visibilidade
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Evento 1: Semana da Computação 2024 (Encerrado / 108 inscritos)
  const ev1 = insertEvento.run(
    profSauloId,
    'Semana da Computação 2024',
    'A Semana da Computação do IFCE reúne acadêmicos, professores e profissionais da área tecnológica para discutir os avanços em engenharia de software, ciência de dados e inteligência artificial através de palestras, minicursos e mostras de projetos.',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    'Campus Cedro - IFCE',
    '2024-05-16',
    '2024-05-18',
    '08:00h - 18:00h',
    '2024-04-01',
    '2024-05-15',
    150,
    'Presencial',
    'ENCERRADO',
    'PUBLICO'
  ).lastInsertRowid;

  // Evento 2: Workshop de IA (Cancelado / Online)
  insertEvento.run(
    profSauloId,
    'Workshop de IA',
    'Workshop prático imersivo sobre modelos generativos, aprendizado de máquina e visão computacional aplicados à resolução de problemas acadêmicos e do setor produtivo regional.',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
    'Online via Google Meet',
    '2024-05-20',
    '2024-05-20',
    '14:00h - 18:00h',
    '2024-05-01',
    '2024-05-19',
    60,
    'Online',
    'CANCELADO',
    'PUBLICO'
  );

  // Evento 3: Mostra Científica IFCE (Ativo / 85 inscritos)
  const ev3 = insertEvento.run(
    profSauloId,
    'Mostra Científica IFCE',
    'Espaço dedicado à apresentação de pesquisas desenvolvidas nos programas de iniciação científica e extensão tecnológica, com avaliação por banca de pareceristas externos e premiação para os melhores trabalhos.',
    'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=800',
    'Campus Cedro - IFCE',
    '2026-10-10',
    '2026-10-12',
    '13:00h - 17:00h',
    '2026-08-01',
    '2026-10-08',
    120,
    'Presencial',
    'PUBLICADO',
    'PUBLICO'
  ).lastInsertRowid;

  // Evento 4: Palestra Inovação e Tecnologia (Rascunho)
  insertEvento.run(
    profSauloId,
    'Palestra Inovação e Tecnologia',
    'Palestra magna sobre ecossistemas de startups, captação de fomento para inovação e desenvolvimento de patentes em instituições federais de ensino.',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    'Auditório Central - Campus Cedro',
    '2026-10-25',
    '2026-10-25',
    '19:00h - 21:30h',
    '2026-09-01',
    '2026-10-24',
    100,
    'Presencial',
    'RASCUNHO',
    'PUBLICO'
  );

  // Evento 5: Minicurso de Python (Online / Pendente de aprovação)
  insertEvento.run(
    profJoseId,
    'Minicurso de Python para Análise de Dados',
    'Treinamento prático de Python cobrindo manipulação de dados com Pandas, visualização gráfica com Seaborn e automação de scripts para pesquisadores.',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
    'Online',
    '2026-11-12',
    '2026-11-14',
    '18:30h - 21:30h',
    '2026-09-15',
    '2026-11-10',
    50,
    'Online',
    'PENDENTE',
    'PUBLICO'
  );

  // Evento 6: Simpósio de Pesquisa e Extensão (Publicado / Ativo)
  insertEvento.run(
    profLucasId,
    'Simpósio de Pesquisa e Inovação 2026',
    'Simpósio anual de congregação científica, recebimento de submissões de artigos e conferências temáticas sobre desenvolvimento regional sustentável.',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    'Campus Cedro - IFCE',
    '2026-11-20',
    '2026-11-22',
    '08:00h - 17:00h',
    '2026-09-01',
    '2026-11-18',
    200,
    'Presencial',
    'PUBLICADO',
    'PUBLICO'
  );

  // 5. Insert Event Courses links
  const insertEvCurso = db.prepare('INSERT INTO evento_curso (id_evento, id_curso) VALUES (?, ?)');
  insertEvCurso.run(ev1, 1);
  insertEvCurso.run(ev1, 4);
  insertEvCurso.run(ev3, 1);
  insertEvCurso.run(ev3, 2);

  // 6. Insert Programação for Semana da Computação 2024
  const insertProg = db.prepare(`
    INSERT INTO programacao (id_evento, titulo, descricao, data, horario_inicio, horario_fim, local, responsavel)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const p1 = insertProg.run(
    ev1,
    'Abertura Oficial e Palestra Magna: Futuro da Computação',
    'Apresentação da semana acadêmica e conferência de abertura com professor convidado.',
    '2024-05-16',
    '08:30',
    '10:30',
    'Auditório Principal',
    'Prof. Saulo Bezerra'
  ).lastInsertRowid;

  const p2 = insertProg.run(
    ev1,
    'Minicurso: Arquitetura de Microserviços e Docker',
    'Construção de contêineres e orquestração de microsserviços modernos.',
    '2024-05-17',
    '14:00',
    '18:00',
    'Laboratório de Redes 02',
    'Prof. José Olinda'
  ).lastInsertRowid;

  insertProg.run(
    ev3,
    'Apresentação dos Pôsteres Científicos - Sessão A',
    'Exposição dos projetos dos bolsistas PIBIC/PIBITI.',
    '2026-10-10',
    '13:30',
    '15:30',
    'Pátio Central',
    'Prof. Saulo Bezerra'
  );

  // 7. Insert Registrations & Attendances
  const insertInscricao = db.prepare(`
    INSERT INTO inscricao (id_usuario, id_evento, status, turma, data_inscricao)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertFreq = db.prepare(`
    INSERT INTO frequencia (id_inscricao, id_programacao, presente)
    VALUES (?, ?, ?)
  `);

  const insertCert = db.prepare(`
    INSERT INTO certificado (id_usuario, id_evento, codigo_validacao, carga_horaria, liberado, data_emissao)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Register Luiz Thomas in Semana da Computação and Mostra Científica
  const insLuiz1 = insertInscricao.run(alunoLuizId, ev1, 'CONFIRMADA', 'Informática S1', '2024-04-10').lastInsertRowid;
  insertFreq.run(insLuiz1, p1, 1);
  insertFreq.run(insLuiz1, p2, 1);
  insertCert.run(alunoLuizId, ev1, 'IFCE-CERT-2024-SC9918', 20, 1, '2024-05-19');

  // Luiz registered in Mostra Científica IFCE
  insertInscricao.run(alunoLuizId, ev3, 'CONFIRMADA', 'Informática S1', '2026-09-01');

  // Register all the Figma students in Semana da Computação
  const attendedNames = ['Ana Beatriz Souza', 'Ana Lívia Pinheiro Vieira', 'Gabriel da Silva', 'João Felipe Gonçalves Diniz'];
  for (const s of students) {
    const sId = studentIds[s.nome];
    const insId = insertInscricao.run(sId, ev1, 'CONFIRMADA', s.turma, '2024-04-15').lastInsertRowid;
    const isPresent = attendedNames.includes(s.nome) ? 1 : 0;
    insertFreq.run(insId, p1, isPresent);

    if (isPresent) {
      const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
      insertCert.run(sId, ev1, `IFCE-CERT-2024-${hash}`, 20, 1, '2024-05-19');
    }
  }

  // Insert other past certificates for Luiz Thomas (matching "Meus certificados" Figma screen!)
  // Past certificates in Figma:
  // - Ciclo de Palestras 2023 (15/08/2023, 10h)
  // - Oficina de Robótica (20/08/2023, 15h)
  // - Mini Curso de Data Science (10/10/2023, 8h)
  const evPast1 = insertEvento.run(
    profJoseId,
    'Ciclo de Palestras 2023',
    'Ciclo semestral de palestras com especialistas da indústria.',
    null,
    'Auditório IFCE',
    '2023-08-15',
    '2023-08-15',
    '08:00h - 18:00h',
    '2023-07-01',
    '2023-08-14',
    80,
    'Presencial',
    'ENCERRADO',
    'PUBLICO'
  ).lastInsertRowid;
  const insP1 = insertInscricao.run(alunoLuizId, evPast1, 'CONFIRMADA', 'Informática S1', '2023-07-20').lastInsertRowid;
  insertCert.run(alunoLuizId, evPast1, 'IFCE-CERT-2023-CP8812', 10, 1, '2023-08-16');

  const evPast2 = insertEvento.run(
    profLucasId,
    'Oficina de Robótica Educacional',
    'Construção de circuitos e robôs seguidores de linha com Arduino.',
    null,
    'Laboratório Maker',
    '2023-08-20',
    '2023-08-20',
    '09:00h - 17:00h',
    '2023-07-15',
    '2023-08-19',
    30,
    'Presencial',
    'ENCERRADO',
    'PUBLICO'
  ).lastInsertRowid;
  const insP2 = insertInscricao.run(alunoLuizId, evPast2, 'CONFIRMADA', 'Informática S1', '2023-07-25').lastInsertRowid;
  insertCert.run(alunoLuizId, evPast2, 'IFCE-CERT-2023-RO7721', 15, 1, '2023-08-21');

  const evPast3 = insertEvento.run(
    profSauloId,
    'Mini Curso de Data Science',
    'Fundamentos de visualização e exploração estatística de dados.',
    null,
    'Online',
    '2023-10-10',
    '2023-10-10',
    '14:00h - 18:00h',
    '2023-09-01',
    '2023-10-09',
    50,
    'Online',
    'ENCERRADO',
    'PUBLICO'
  ).lastInsertRowid;
  const insP3 = insertInscricao.run(alunoLuizId, evPast3, 'CONFIRMADA', 'Informática S1', '2023-09-12').lastInsertRowid;
  insertCert.run(alunoLuizId, evPast3, 'IFCE-CERT-2023-DS6634', 8, 1, '2023-10-11');

  // Insert notifications for Luiz
  const insertNotif = db.prepare('INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo) VALUES (?, ?, ?, ?)');
  insertNotif.run(alunoLuizId, 'Bem-vindo ao IFCE Iventus', 'Sua conta foi criada com sucesso. Explore os eventos científicos disponíveis!', 'SUCESSO');
  insertNotif.run(alunoLuizId, 'Inscrição Confirmada', 'Sua inscrição na Mostra Científica IFCE foi confirmada com sucesso.', 'INFO');
  insertNotif.run(alunoLuizId, 'Certificado Disponível', 'O seu certificado da Semana da Computação 2024 já está pronto para download.', 'SUCESSO');

  // Insert initial audit logs
  const insertAudit = db.prepare('INSERT INTO auditoria (id_usuario, acao, detalhes, ip) VALUES (?, ?, ?, ?)');
  insertAudit.run(adminId, 'SISTEMA_INICIALIZADO', 'Base de dados inicializada com dados de teste do IFCE', '127.0.0.1');
  insertAudit.run(adminId, 'EVENTO_APROVADO', 'Evento "Mostra Científica IFCE" aprovado pelo administrador', '127.0.0.1');

  console.log('Database seeded successfully!');
}
