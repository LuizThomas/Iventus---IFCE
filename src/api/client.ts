import { EventItem, User, Registration, CertificateItem, AttendanceParticipant, AdminStats, Course, Semester } from '../types';

const TOKEN_KEY = 'ifce_iventus_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Erro ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (body: any) => request<{ success: boolean; user: User; token: string; message: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body)
  }),

  login: (body: any) => request<{ success: boolean; user: User; token: string; message: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body)
  }),

  getMe: () => request<{ success: boolean; user: User }>('/api/auth/me'),

  forgotPassword: (email: string) => request<{ success: boolean; message: string; devToken?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),

  resetPassword: (body: any) => request<{ success: boolean; message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body)
  }),

  updateProfile: (body: any) => request<{ success: boolean; user: User; token: string; message: string }>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(body)
  }),

  changePassword: (body: any) => request<{ success: boolean; message: string }>('/api/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(body)
  }),

  // Events
  getEvents: (params?: { search?: string; status?: string; tab?: string; organizadorId?: number; formato?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.tab) query.append('tab', params.tab);
    if (params?.organizadorId) query.append('organizadorId', String(params.organizadorId));
    if (params?.formato) query.append('formato', params.formato);

    const qs = query.toString();
    return request<{ success: boolean; events: EventItem[] }>(`/api/events${qs ? `?${qs}` : ''}`);
  },

  getEventDetails: (id: number) => request<{ success: boolean; event: EventItem }>(`/api/events/${id}`),

  createEvent: (body: any) => request<{ success: boolean; message: string; eventId: number }>('/api/events', {
    method: 'POST',
    body: JSON.stringify(body)
  }),

  updateEvent: (id: number, body: any) => request<{ success: boolean; message: string }>(`/api/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  }),

  updateEventStatus: (id: number, status: string, justificativa?: string) => request<{ success: boolean; message: string }>(`/api/events/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, justificativa })
  }),

  // Registrations
  registerInEvent: (eventId: number) => request<{ success: boolean; message: string }>(`/api/events/${eventId}/register`, {
    method: 'POST'
  }),

  cancelRegistration: (eventId: number) => request<{ success: boolean; message: string }>(`/api/events/${eventId}/register`, {
    method: 'DELETE'
  }),

  getMyRegistrations: () => request<{ success: boolean; registrations: Registration[] }>('/api/me/registrations'),

  toggleFavorite: (eventId: number) => request<{ success: boolean; favorited: boolean }>(`/api/events/${eventId}/favorite`, {
    method: 'POST'
  }),

  // Attendance
  getAttendance: (eventId: number) => request<{ success: boolean; event: any; participants: AttendanceParticipant[] }>(`/api/events/${eventId}/attendance`),

  updateAttendance: (eventId: number, id_inscricao: number, presente: boolean) => request<{ success: boolean; message: string }>(`/api/events/${eventId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({ id_inscricao, presente })
  }),

  releaseCertificates: (eventId: number) => request<{ success: boolean; message: string }>(`/api/events/${eventId}/release-certificates`, {
    method: 'POST'
  }),

  // Certificates
  getMyCertificates: () => request<{ success: boolean; certificates: CertificateItem[] }>('/api/me/certificates'),

  verifyCertificate: (code: string) => request<{ success: boolean; certificado: CertificateItem }>(`/api/certificates/verify/${code}`),

  // Admin
  getAdminStats: () => request<{ success: boolean; stats: AdminStats }>('/api/admin/stats'),

  getAdminEvents: () => request<{ success: boolean; events: EventItem[] }>('/api/admin/events'),

  approveEvent: (id: number) => request<{ success: boolean; message: string }>(`/api/admin/events/${id}/approve`, {
    method: 'POST'
  }),

  rejectEvent: (id: number, justificativa: string) => request<{ success: boolean; message: string }>(`/api/admin/events/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ justificativa })
  }),

  getAdminUsers: () => request<{ success: boolean; users: User[] }>('/api/admin/users'),

  deleteUser: (id: number) => request<{ success: boolean; message: string }>(`/api/admin/users/${id}`, {
    method: 'DELETE'
  }),

  getCourses: () => request<{ success: boolean; courses: Course[] }>('/api/admin/courses'),

  createCourse: (body: any) => request<{ success: boolean; message: string }>('/api/admin/courses', {
    method: 'POST',
    body: JSON.stringify(body)
  }),

  getSemesters: () => request<{ success: boolean; semesters: Semester[] }>('/api/admin/semesters'),

  createSemester: (body: any) => request<{ success: boolean; message: string }>('/api/admin/semesters', {
    method: 'POST',
    body: JSON.stringify(body)
  }),

  getAuditLogs: () => request<{ success: boolean; logs: any[] }>('/api/admin/audit')
};
