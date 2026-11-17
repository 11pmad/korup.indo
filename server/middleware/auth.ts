import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'lki-super-secret-admin-jwt-key-2026';
const CITIZEN_JWT_SECRET = process.env.CITIZEN_JWT_SECRET || process.env.JWT_SECRET || 'lki-super-secret-citizen-jwt-key-2026';

if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_JWT_SECRET || !process.env.CITIZEN_JWT_SECRET)) {
  console.warn('⚠️ [SECURITY WARNING] ADMIN_JWT_SECRET or CITIZEN_JWT_SECRET is not set in environment variables! Using fallback secret is insecure in production.');
}

export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'moderator' | 'auditor' | 'reviewer';

export interface AdminTokenPayload {
  id: string;
  username: string;
  full_name?: string | null;
  role: AdminRole;
}

export interface CitizenTokenPayload {
  id: string;
  username: string;
  displayName: string;
  role: 'citizen';
  avatarSeed?: string;
  photoUrl?: string | null;
  originProvince?: string | null;
  originCity?: string | null;
  isEmailVerified?: boolean;
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
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '7d' });
}

export function generateCitizenToken(payload: CitizenTokenPayload): string {
  return jwt.sign(payload, CITIZEN_JWT_SECRET, { expiresIn: '30d' });
}

export const ALL_ADMIN_ROLES: AdminRole[] = ['super_admin', 'admin', 'editor', 'moderator', 'auditor', 'reviewer'];

export function verifyAdminJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token autentikasi kurator/admin diperlukan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminTokenPayload;
    if (!ALL_ADMIN_ROLES.includes(decoded.role)) {
      return res.status(403).json({ error: 'Akses ditolak: Peran kurator/admin tidak sah.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token tidak valid atau telah kedaluwarsa.' });
  }
}

export function requireAdminRole(allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Akses ditolak: Autentikasi staf/admin diperlukan.' });
    }
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ 
        error: `Akses ditolak: Peran Anda (${req.admin.role}) tidak memiliki wewenang untuk tindakan ini.` 
      });
    }
    next();
  };
}

export function verifyCitizenJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Silakan masuk atau daftarkan akun warga terlebih dahulu untuk bersuara.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    let decoded: any;
    try {
      decoded = jwt.verify(token, CITIZEN_JWT_SECRET);
    } catch {
      // Allow curators using admin token to also act as citizen in discussions
      decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    }

    if (decoded.role === 'citizen') {
      if (!decoded.isEmailVerified) {
        return res.status(403).json({
          error: 'Email Anda belum diverifikasi. Silakan lakukan verifikasi email terlebih dahulu sebelum dapat menggunakan aplikasi.',
          needsVerification: true
        });
      }
      req.citizen = decoded as CitizenTokenPayload;
      return next();
    } else if (ALL_ADMIN_ROLES.includes(decoded.role)) {
      req.citizen = {
        id: decoded.id,
        username: decoded.username,
        displayName: `${decoded.username} (Staf LKI)`,
        role: 'citizen',
        avatarSeed: 'admin',
        isEmailVerified: true
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
    let decoded: any;
    try {
      decoded = jwt.verify(token, CITIZEN_JWT_SECRET);
    } catch {
      decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    }

    if (decoded.role === 'citizen' && decoded.isEmailVerified) {
      req.citizen = decoded as CitizenTokenPayload;
    } else if (ALL_ADMIN_ROLES.includes(decoded.role)) {
      req.citizen = {
        id: decoded.id,
        username: decoded.username,
        displayName: `${decoded.username} (Staf LKI)`,
        role: 'citizen',
        avatarSeed: 'admin',
        isEmailVerified: true
      };
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
}
