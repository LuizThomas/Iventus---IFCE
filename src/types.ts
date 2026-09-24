export type UserRole = 'ADMINISTRADOR' | 'PROFESSOR' | 'PARTICIPANTE';

export interface User {
  id_usuario: number;
  nome: string;
  email: string;
  matricula: string | null;
  perfil: UserRole;
  foto_perfil: string | null;
  telefone: string | null;
  materias_responsavel: string | null;
  status_conta?: string;
  created_at?: string;
}

export type EventStatus = 
  | 'RASCUNHO' 
  | 'PENDENTE' 
  | 'APROVADO' 
  | 'REJEITADO' 
  | 'PUBLICADO' 
  | 'OCULTO' 
  | 'EM_ANDAMENTO' 
  | 'ENCERRADO' 
  | 'CANCELADO';

export interface ScheduleItem {
  id_programacao?: number;
  id_evento?: number;
  titulo: string;
  descricao?: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  local?: string;
  responsavel?: string;
}

export interface Course {
  id_curso: number;
  nome: string;
  codigo: string;
  status: 'ATIVO' | 'INATIVO';
}

export interface Semester {
  id_semestre: number;
  nome: string;
  ano: number;
  periodo: number;
  status: 'ATIVO' | 'INATIVO';
}

export interface EventItem {
  id_evento: number;
  id_organizador: number;
  titulo: string;
  descricao: string | null;
  banner: string | null;
  local: string;
  data_inicio: string;
  data_fim: string;
  horario: string | null;
  inicio_inscricoes: string;
  fim_inscricoes: string;
  limite_vagas: number;
  total_inscritos: number;
  vagas_restantes?: number;
  formato: 'Presencial' | 'Online' | 'Híbrido';
  status: EventStatus;
  visibilidade: 'PUBLICO' | 'PRIVADO';
  justificativa_recusa?: string | null;
  organizador_nome: string;
  organizador_email: string;
  organizador_telefone?: string;
  usuario_inscrito?: number;
  is_favorito?: number | boolean;
  inscrito?: boolean;
  programacao?: ScheduleItem[];
  cursos?: Course[];
}

export interface Registration {
  id_inscricao: number;
  status_inscricao: 'CONFIRMADA' | 'CANCELADA' | 'PENDENTE';
  data_inscricao: string;
  data_cancelamento?: string | null;
  turma?: string;
  pode_cancelar: number;
  id_evento: number;
  titulo: string;
  descricao: string | null;
  banner: string | null;
  local: string;
  data_inicio: string;
  data_fim: string;
  horario: string | null;
  inicio_inscricoes: string;
  fim_inscricoes: string;
  limite_vagas: number;
  formato: 'Presencial' | 'Online' | 'Híbrido';
  status: EventStatus;
  organizador_nome: string;
  is_favorito?: number | boolean;
}

export interface AttendanceParticipant {
  id_inscricao: number;
  id_usuario: number;
  nome: string;
  email: string;
  matricula: string | null;
  turma: string | null;
  presenca: number;
  certificado_codigo: string | null;
}

export interface CertificateItem {
  id_certificado: number;
  codigo_validacao: string;
  carga_horaria: number;
  data_emissao: string;
  id_evento: number;
  evento_titulo: string;
  data_inicio: string;
  data_fim: string;
  local: string;
  organizador_nome: string;
  participante_nome?: string;
  participante_matricula?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalProfessors: number;
  totalParticipants: number;
  pendingEvents: number;
  approvedEvents: number;
  endedEvents: number;
  totalRegistrations: number;
  totalCertificates: number;
}
