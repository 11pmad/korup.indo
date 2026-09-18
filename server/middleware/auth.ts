import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lki-super-secret-jwt-key-2026-indonesia-maju';

export interface AdminTokenPayload {
  id: string;
  username: string;
  role: 'super_admin' | 'editor' | 'reviewer';
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

export function generateToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token autentikasi diperlukan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token tidak valid atau telah kedaluwarsa.' });
  }
}
