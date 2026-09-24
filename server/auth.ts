import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ifce_iventus_secret_key_prod_2026';

export interface UserSession {
  id_usuario: number;
  nome: string;
  email: string;
  matricula: string | null;
  perfil: 'ADMINISTRADOR' | 'PROFESSOR' | 'PARTICIPANTE';
  foto_perfil: string | null;
  telefone: string | null;
  materias_responsavel: string | null;
}

// Token generation: base64 payload + hmac signature
export function createToken(user: UserSession): string {
  const payload = JSON.stringify({
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): UserSession | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }

    // Verify user is still active in database
    const userStmt = db.prepare('SELECT id_usuario, ativo FROM usuario WHERE id_usuario = ?');
    const dbUser = userStmt.get(payload.id_usuario) as { id_usuario: number; ativo: number } | undefined;
    if (!dbUser || dbUser.ativo !== 1) return null;

    return {
      id_usuario: payload.id_usuario,
      nome: payload.nome,
      email: payload.email,
      matricula: payload.matricula,
      perfil: payload.perfil,
      foto_perfil: payload.foto_perfil,
      telefone: payload.telefone,
      materias_responsavel: payload.materias_responsavel
    };
  } catch {
    return null;
  }
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: UserSession;
    }
  }
}

// Middleware to extract user from Authorization header
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);
  if (user) {
    req.user = user;
  }
  next();
}

// Guard: requires logged in
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Acesso não autorizado. Faça login para continuar.',
      error: 'UNAUTHORIZED'
    });
  }
  next();
}

// Guard: requires specific roles
export function requireRole(...roles: Array<'ADMINISTRADOR' | 'PROFESSOR' | 'PARTICIPANTE'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acesso não autorizado.',
        error: 'UNAUTHORIZED'
      });
    }

    if (!roles.includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para realizar esta ação.',
        error: 'FORBIDDEN'
      });
    }

    next();
  };
}
