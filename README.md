# IFCE Iventus — Plataforma de Gerenciamento de Eventos Científicos do IFCE

Sistema web full-stack completo, funcional e responsivo para governança e gerenciamento de eventos científicos, acadêmicos, simpósios e mostras tecnológicas do Instituto Federal do Ceará (IFCE - Campus Cedro).

O sistema foi desenvolvido seguindo estritamente o protótipo visual do Figma em termos de componentes, cores institucionais do IFCE (verde `#168038`, vermelho institucional e tons de suporte), tipografia, tabelas, modais com paleta de destaque (como os modais verde e amarelo para criação e edição de eventos), controle de presença e emissão de certificados.

---

## 1. Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React Icons, Canvas Confetti.
- **Backend**: Node.js 22, Express 4, TypeScript (`tsx`).
- **Banco de Dados Relacional**: SQLite (`node:sqlite` nativo do Node 22 com suporte pleno a chaves estrangeiras `PRAGMA foreign_keys = ON;`, transações, constraints `UNIQUE` e índices otimizados).
- **Segurança e Criptografia**: Hash seguro de senhas com PBKDF2 (`node:crypto`) e salt criptográfico; tokens de sessão HMAC-SHA256 para autorização de rotas com verificação de perfil no backend.

---

## 2. Contas de Teste (Ambiente de Demonstração)

O sistema já é inicializado com a base de dados populada com dados reais e fiéis ao protótipo do Figma. Você pode alternar instantaneamente entre os perfis pelo menu de usuário no topo ou fazer login manual:

| Perfil | Nome | E-mail | Senha |
|---|---|---|---|
| **Participante / Aluno** | Luiz Thomas Marte Moreira | `participante@teste.com` | `participante123` |
| **Professor / Organizador** | Saulo Bezerra | `professor@teste.com` | `professor123` |
| **Administrador** | Diego Teixeira Silva | `admin@teste.com` | `admin123` |

*Também cadastrados para listas de chamada e frequência:*
- Alunos: Ana Beatriz Souza, Ana Lívia Pinheiro Vieira, Camilo Marquez, Danilo Torres Matos, Gabriel da Silva, Gabriela Oliveira Ferreira, João Felipe Gonçalves Diniz.
- Docentes: José Olinda, Lucas Nogueira, Lyrane Brito Bezerra.

---

## 3. Estrutura do Banco de Dados Relacional

O banco relacional `iventus.sqlite` implementa as 13 entidades e relacionamentos especificados:

1. `usuario`: `id_usuario`, `nome`, `email` (UNIQUE), `senha_hash`, `matricula`, `perfil` (`ADMINISTRADOR`, `PROFESSOR`, `PARTICIPANTE`), `foto_perfil`, `telefone`, `materias_responsavel`, `status_conta`, `ativo`, `created_at`, `updated_at`.
2. `evento`: `id_evento`, `id_organizador` (FK usuario), `titulo`, `descricao`, `banner`, `local`, `data_inicio`, `data_fim`, `horario`, `inicio_inscricoes`, `fim_inscricoes`, `limite_vagas` (> 0), `formato` (`Presencial`, `Online`), `status` (`RASCUNHO`, `PENDENTE`, `APROVADO`, `REJEITADO`, `PUBLICADO`, `ENCERRADO`, `CANCELADO`), `justificativa_recusa`, timestamps.
3. `inscricao`: `id_inscricao`, `id_usuario` (FK usuario), `id_evento` (FK evento), `status` (`CONFIRMADA`, `CANCELADA`), `turma`, `data_inscricao`, `data_cancelamento`. Restrição `UNIQUE(id_usuario, id_evento)`.
4. `programacao`: `id_programacao`, `id_evento` (FK evento), `titulo`, `descricao`, `data`, `horario_inicio`, `horario_fim`, `local`, `responsavel`.
5. `frequencia`: `id_frequencia`, `id_inscricao` (FK inscricao), `id_programacao` (FK programacao), `presente` (0 ou 1), `registrado_em`. Restrição `UNIQUE(id_inscricao, id_programacao)`.
6. `certificado`: `id_certificado`, `id_usuario` (FK usuario), `id_evento` (FK evento), `codigo_validacao` (UNIQUE), `carga_horaria`, `liberado`, `data_emissao`. Restrição `UNIQUE(id_usuario, id_evento)`.
7. `curso`: `id_curso`, `nome`, `codigo` (UNIQUE), `status`.
8. `semestre`: `id_semestre`, `nome` (UNIQUE), `ano`, `periodo`, `status`.
9. `evento_curso`: relacionamento N:N entre `evento` e `curso`.
10. `favorito`: `id_favorito`, `id_usuario`, `id_evento`.
11. `notificacao`: `id_notificacao`, `id_usuario`, `titulo`, `mensagem`, `tipo`, `lida`.
12. `auditoria`: `id_auditoria`, `id_usuario`, `acao`, `detalhes`, `ip`, `created_at`.
13. `recuperacao_senha`: `id`, `id_usuario`, `token` (UNIQUE), `expira_em`, `usado`.

---

## 4. Regras de Negócio Implementadas (RN01 a RN12)

- **RN01**: Somente professores e administradores podem criar eventos.
- **RN02**: Somente administradores podem excluir usuários (com confirmação e auditoria).
- **RN03**: Participante somente recebe certificado quando possuir presença confirmada (`presente = 1`).
- **RN04**: Cada usuário possui e-mail estritamente único.
- **RN05**: Participante não pode se inscrever duas vezes no mesmo evento (`UNIQUE(id_usuario, id_evento)`).
- **RN06**: Eventos encerrados (`ENCERRADO`) não podem ser editados.
- **RN07**: As inscrições encerram no máximo até a data de início do evento.
- **RN08**: O número de inscritos nunca ultrapassa o limite de vagas (`limite_vagas`).
- **RN09**: Somente o professor responsável pode editar seu evento.
- **RN10**: Certificados somente podem ser disponibilizados após o encerramento do evento.
- **RN11**: Todo evento possui pelo menos um organizador responsável vinculado.
- **RN12**: Participante somente pode cancelar sua inscrição antes do encerramento das inscrições.

---

## 5. Principais Endpoints da API REST

### Autenticação & Perfil
- `POST /api/auth/register` — Cadastro com validação de dados, e-mail único e hash PBKDF2.
- `POST /api/auth/login` — Autenticação de usuários e geração de token HMAC-SHA256.
- `GET /api/auth/me` — Recupera os dados da sessão do usuário autenticado.
- `POST /api/auth/forgot-password` — Solicita recuperação de senha com token de expiração.
- `POST /api/auth/reset-password` — Valida token e atualiza a senha de forma segura.
- `PUT /api/auth/profile` — Atualiza dados cadastrais, telefone, matrícula e foto.
- `PUT /api/auth/change-password` — Valida senha atual e define nova senha.

### Eventos & Inscrições
- `GET /api/events` — Catálogo e listagem de eventos com filtros por status, formato, docente e busca.
- `GET /api/events/:id` — Detalhes completos do evento, programação, vagas e status do usuário.
- `POST /api/events` — Cadastro de novo evento (restringido a Docentes/Admin).
- `PUT /api/events/:id` — Edição do evento (valida RN06 e RN09).
- `POST /api/events/:id/status` — Altera status para Encerrado, Cancelado, Publicado, etc.
- `POST /api/events/:id/register` — Inscrição do participante (valida RN05, RN07 e RN08).
- `DELETE /api/events/:id/register` — Cancelamento da inscrição (valida RN12).
- `GET /api/me/registrations` — Consulta as inscrições ativas do participante.
- `POST /api/events/:id/favorite` — Alterna estado de favorito do evento.

### Presença & Certificados
- `GET /api/events/:id/attendance` — Lista de presença para o professor do evento.
- `POST /api/events/:id/attendance` — Registro em tempo real de presença por aluno.
- `POST /api/events/:id/release-certificates` — Libera certificados para alunos com presença (RN03 e RN10).
- `GET /api/me/certificates` — Lista de certificados emitidos para o participante.
- `GET /api/certificates/verify/:code` — Validação pública da autenticidade de um certificado por QR code/código.

### Administração
- `GET /api/admin/stats` — Indicadores consolidados do banco (Usuários, Eventos, Inscrições, Certificados).
- `GET /api/admin/events` — Lista de eventos para moderação administrativa.
- `POST /api/admin/events/:id/approve` — Aprovação do evento.
- `POST /api/admin/events/:id/reject` — Recusa de evento com justificativa obrigatória.
- `GET /api/admin/users` — Gestão de usuários cadastrados.
- `DELETE /api/admin/users/:id` — Exclusão administrativa de usuário (RN02).
- `GET|POST /api/admin/courses` — Gestão de cursos de graduação e técnicos.
- `GET|POST /api/admin/semesters` — Gestão de semestres letivos.
- `GET /api/admin/audit` — Consulta à trilha de auditoria.

---

## 6. Como Executar o Projeto

1. Instalar as dependências:
   ```bash
   npm install
   ```
2. Iniciar o servidor full-stack de desenvolvimento:
   ```bash
   npm run dev
   ```
3. O servidor Express será executado na porta 3000 com o Vite integrado, inicializando automaticamente o banco SQLite e suas sementes de dados.
4. Para compilar para produção:
   ```bash
   npm run build
   npm start
   ```
