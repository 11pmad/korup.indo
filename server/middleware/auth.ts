import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lki-super-secret-jwt-key-2026-indonesia-maju';

export interface AdminTokenPayload {
  id: string;
  username: string;
  role: 'super_admin' | 'editor' | 'reviewer';
}

export interface CitizenTokenPayload {
  id: string;
  username: string;
  displayName: string;
  role: 'citizen';
  avatarSeed?: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
      citizen?: CitizenTokenPayload;
    }
  }
}

export function generateToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function generateCitizenToken(payload: CitizenTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyAdminJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token autentikasi kurator/admin diperlukan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    if (decoded.role !== 'super_admin' && decoded.role !== 'editor' && decoded.role !== 'reviewer') {
      return res.status(403).json({ error: 'Akses ditolak: Peran kurator/admin diperlukan.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token tidak valid atau telah kedaluwarsa.' });
  }
}

export function verifyCitizenJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Silakan masuk atau daftarkan akun warga terlebih dahulu untuk bersuara.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role === 'citizen') {
      req.citizen = decoded as CitizenTokenPayload;
      return next();
    } else if (decoded.role === 'super_admin' || decoded.role === 'editor' || decoded.role === 'reviewer') {
      req.citizen = {
        id: decoded.id,
        username: decoded.username,
        displayName: `${decoded.username} (Kurator LKI)`,
        role: 'citizen',
        avatarSeed: 'admin'
      };
      return next();
    }
    return res.status(403).json({ error: 'Format token tidak dikenali.' });
  } catch (err) {
    return res.status(401).json({ error: 'Sesi akun warga Anda telah berakhir. Silakan masuk kembali.' });
  }
}

export function optionalCitizenJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role === 'citizen') {
      req.citizen = decoded as CitizenTokenPayload;
    } else if (decoded.role === 'super_admin' || decoded.role === 'editor' || decoded.role === 'reviewer') {
      req.citizen = {
        id: decoded.id,
        username: decoded.username,
        displayName: `${decoded.username} (Kurator LKI)`,
        role: 'citizen',
        avatarSeed: 'admin'
      };
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
}
