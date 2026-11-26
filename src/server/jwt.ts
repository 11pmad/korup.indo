import { SignJWT, jwtVerify } from 'jose';

export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'moderator' | 'auditor' | 'reviewer';

export interface AdminSessionPayload {
  id: string;
  username: string;
  fullName: string | null;
  role: AdminRole;
}

export interface CitizenSessionPayload {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarSeed: string;
  isEmailVerified: boolean;
}

function getSecretBytes(name: 'ADMIN_JWT_SECRET' | 'CITIZEN_JWT_SECRET'): Uint8Array {
  const val =
    process.env[name] ||
    (process.env.NODE_ENV !== 'production'
      ? `dev-${name}-only-not-for-prod-use-32ch`
      : '');
  if (!val || val.length < 16) {
    throw new Error(`${name} wajib dikonfigurasi di environment.`);
  }
  return new TextEncoder().encode(val);
}

export async function signAdminSession(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ ...payload, typ: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(getSecretBytes('ADMIN_JWT_SECRET'));
}

export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretBytes('ADMIN_JWT_SECRET'));
    if (payload.typ !== 'admin' || typeof payload.id !== 'string' || typeof payload.role !== 'string') {
      return null;
    }
    return {
      id: payload.id,
      username: String(payload.username ?? ''),
      fullName: payload.fullName ? String(payload.fullName) : null,
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}

export async function signCitizenSession(payload: CitizenSessionPayload): Promise<string> {
  return new SignJWT({ ...payload, typ: 'citizen' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretBytes('CITIZEN_JWT_SECRET'));
}

export async function verifyCitizenToken(token: string): Promise<CitizenSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretBytes('CITIZEN_JWT_SECRET'));
    if (payload.typ !== 'citizen' || typeof payload.id !== 'string') {
      return null;
    }
    return {
      id: payload.id,
      username: String(payload.username ?? ''),
      displayName: String(payload.displayName ?? ''),
      email: String(payload.email ?? ''),
      avatarSeed: String(payload.avatarSeed ?? 'garuda'),
      isEmailVerified: Boolean(payload.isEmailVerified),
    };
  } catch {
    return null;
  }
}
