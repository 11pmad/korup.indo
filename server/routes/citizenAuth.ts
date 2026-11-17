import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { db, schema } from '../db/index.js';
import { eq, or } from 'drizzle-orm';
import { generateCitizenToken, verifyCitizenJwt } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';

export const citizenAuthRouter = Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || '84674853872-vknld967r5obl81av27d588mf8ghfhd6.apps.googleusercontent.com'
);

const registerSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  displayName: z.string().min(2, 'Nama tampilan minimal 2 karakter').max(50),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  email: z.string().email('Format email tidak valid'),
  originProvince: z.string().optional().or(z.literal('')),
  originCity: z.string().optional().or(z.literal('')),
  photoUrl: z.string().optional().or(z.literal('')),
  bio: z.string().max(250).optional().or(z.literal('')),
  avatarSeed: z.string().optional()
});

const verifyEmailSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  code: z.string().length(6, 'Kode OTP harus 6 digit angka')
});

const resendCodeSchema = z.object({
  email: z.string().email('Format email tidak valid')
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username atau Email diperlukan'),
  password: z.string().min(1, 'Kata sandi diperlukan')
});

const googleAuthSchema = z.object({
  credential: z.string().optional(),
  accessToken: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional(),
  displayName: z.string().optional(),
  googleId: z.string().optional(),
  photoUrl: z.string().optional().or(z.literal('')),
  originProvince: z.string().optional().or(z.literal('')),
  originCity: z.string().optional().or(z.literal(''))
});

const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'Nama minimal 2 karakter').max(50),
  photoUrl: z.string().optional().or(z.literal('')),
  originProvince: z.string().optional().or(z.literal('')),
  originCity: z.string().optional().or(z.literal('')),
  bio: z.string().max(250).optional().or(z.literal('')),
  avatarSeed: z.string().optional()
});

function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/citizen/register
citizenAuthRouter.post('/register', authRateLimiter, async (req, res) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ 
        error: parse.error.issues[0]?.message || 'Data registrasi tidak valid' 
      });
    }

    const { username, displayName, password, email, originProvince, originCity, photoUrl, bio, avatarSeed } = parse.data;

    // Check if username or email already taken
    const existing = await db.query.citizenUsers.findFirst({
      where: or(
        eq(schema.citizenUsers.username, username.toLowerCase()),
        eq(schema.citizenUsers.email, email.toLowerCase())
      )
    });

    if (existing) {
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        return res.status(400).json({ error: 'Username tersebut sudah terdaftar oleh warga lain.' });
      }
      return res.status(400).json({ error: 'Email tersebut sudah terdaftar. Silakan masuk atau gunakan email lain.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const chosenAvatar = avatarSeed || ['garuda', 'merah', 'emas', 'banteng', 'padi'][Math.floor(Math.random() * 5)];
    const otpCode = generate6DigitOtp();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    await db.insert(schema.citizenUsers).values({
      id: userId,
      username: username.toLowerCase(),
      display_name: displayName,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      avatar_seed: chosenAvatar,
      photo_url: photoUrl || null,
      origin_province: originProvince || null,
      origin_city: originCity || null,
      bio: bio || null,
      is_email_verified: 0,
      email_verification_code: otpCode,
      email_verification_expires: otpExpires,
      auth_provider: 'local',
      role: 'citizen'
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Citizen Auth] OTP Code for ${email}: ${otpCode}`);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Kode verifikasi 6-digit telah dikirim ke email Anda. Silakan verifikasi untuk melanjutkan.',
      needsVerification: true,
      email: email.toLowerCase(),
      // In local development / preview environment, we return debug_otp so user can easily test without real SMTP mailer setup
      ...(process.env.NODE_ENV !== 'production' ? { debug_otp: otpCode } : {})
    });
  } catch (err: any) {
    console.error('Error in citizen register:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat mendaftarkan akun warga.' });
  }
});

// POST /api/auth/citizen/verify-email
citizenAuthRouter.post('/verify-email', authRateLimiter, async (req, res) => {
  try {
    const parse = verifyEmailSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ 
        error: parse.error.issues[0]?.message || 'Kode verifikasi tidak valid' 
      });
    }

    const { email, code } = parse.data;

    const user = await db.query.citizenUsers.findFirst({
      where: eq(schema.citizenUsers.email, email.toLowerCase())
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna dengan email ini tidak ditemukan.' });
    }

    if (user.is_email_verified === 1) {
      const token = generateCitizenToken({
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: 'citizen',
        avatarSeed: user.avatar_seed || 'garuda',
        photoUrl: user.photo_url || undefined,
        originProvince: user.origin_province || undefined,
        originCity: user.origin_city || undefined,
        isEmailVerified: true
      });

      return res.json({
        status: 'success',
        message: 'Email sudah terverifikasi sebelumnya.',
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          email: user.email,
          photoUrl: user.photo_url,
          originProvince: user.origin_province,
          originCity: user.origin_city,
          bio: user.bio,
          avatarSeed: user.avatar_seed,
          role: 'citizen',
          isEmailVerified: true
        }
      });
    }

    if (user.email_verification_code !== code.trim()) {
      return res.status(400).json({ error: 'Kode verifikasi yang dimasukkan salah.' });
    }

    if (user.email_verification_expires && new Date() > new Date(user.email_verification_expires)) {
      return res.status(400).json({ error: 'Kode verifikasi telah kadaluarsa. Silakan minta kode baru.' });
    }

    // Mark as verified
    await db.update(schema.citizenUsers)
      .set({
        is_email_verified: 1,
        email_verification_code: null,
        email_verification_expires: null
      })
      .where(eq(schema.citizenUsers.id, user.id));

    const token = generateCitizenToken({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: 'citizen',
      avatarSeed: user.avatar_seed || 'garuda',
      photoUrl: user.photo_url || undefined,
      originProvince: user.origin_province || undefined,
      originCity: user.origin_city || undefined,
      isEmailVerified: true
    });

    return res.json({
      status: 'success',
      message: 'Selamat! Email Anda berhasil diverifikasi. Akun Anda telah aktif.',
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        photoUrl: user.photo_url,
        originProvince: user.origin_province,
        originCity: user.origin_city,
        bio: user.bio,
        avatarSeed: user.avatar_seed,
        role: 'citizen',
        isEmailVerified: true
      }
    });
  } catch (err: any) {
    console.error('Error in email verification:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat verifikasi email.' });
  }
});

// POST /api/auth/citizen/resend-code
citizenAuthRouter.post('/resend-code', authRateLimiter, async (req, res) => {
  try {
    const parse = resendCodeSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }

    const { email } = parse.data;

    const user = await db.query.citizenUsers.findFirst({
      where: eq(schema.citizenUsers.email, email.toLowerCase())
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna dengan email ini tidak ditemukan.' });
    }

    if (user.is_email_verified === 1) {
      return res.status(400).json({ error: 'Email ini sudah terverifikasi. Anda dapat langsung masuk.' });
    }

    const otpCode = generate6DigitOtp();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    await db.update(schema.citizenUsers)
      .set({
        email_verification_code: otpCode,
        email_verification_expires: otpExpires
      })
      .where(eq(schema.citizenUsers.id, user.id));

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Citizen Auth Resend] New OTP Code for ${email}: ${otpCode}`);
    }

    return res.json({
      status: 'success',
      message: 'Kode verifikasi baru berhasil dikirim ke email Anda.',
      ...(process.env.NODE_ENV !== 'production' ? { debug_otp: otpCode } : {})
    });
  } catch (err: any) {
    console.error('Error in resending verification code:', err);
    return res.status(500).json({ error: 'Gagal mengirim ulang kode verifikasi.' });
  }
});

// POST /api/auth/citizen/login
citizenAuthRouter.post('/login', authRateLimiter, async (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Identitas (username/email) dan kata sandi wajib diisi.' });
    }

    const { identifier, password } = parse.data;
    const cleanId = identifier.trim().toLowerCase();

    const user = await db.query.citizenUsers.findFirst({
      where: or(
        eq(schema.citizenUsers.username, cleanId),
        eq(schema.citizenUsers.email, cleanId)
      )
    });

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Username/Email atau kata sandi tidak cocok.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Username/Email atau kata sandi tidak cocok.' });
    }

    // Check email verification requirement
    if (user.is_email_verified !== 1) {
      // Create new OTP if expired or missing
      let currentOtp = user.email_verification_code;
      if (!currentOtp || (user.email_verification_expires && new Date() > new Date(user.email_verification_expires))) {
        currentOtp = generate6DigitOtp();
        await db.update(schema.citizenUsers)
          .set({
            email_verification_code: currentOtp,
            email_verification_expires: new Date(Date.now() + 15 * 60 * 1000)
          })
          .where(eq(schema.citizenUsers.id, user.id));
      }

      return res.status(403).json({
        error: 'Email Anda belum diverifikasi. Silakan masukkan kode OTP yang telah dikirim ke email Anda.',
        needsVerification: true,
        email: user.email,
        ...(process.env.NODE_ENV !== 'production' ? { debug_otp: currentOtp } : {})
      });
    }

    const token = generateCitizenToken({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: 'citizen',
      avatarSeed: user.avatar_seed || 'garuda',
      photoUrl: user.photo_url || undefined,
      originProvince: user.origin_province || undefined,
      originCity: user.origin_city || undefined,
      isEmailVerified: true
    });

    return res.json({
      status: 'success',
      message: 'Selamat datang kembali, Warga LKI!',
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        photoUrl: user.photo_url,
        originProvince: user.origin_province,
        originCity: user.origin_city,
        bio: user.bio,
        avatarSeed: user.avatar_seed || 'garuda',
        role: 'citizen',
        isEmailVerified: true
      }
    });
  } catch (err: any) {
    console.error('Error in citizen login:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat proses masuk akun warga.' });
  }
});

// POST /api/auth/citizen/google
citizenAuthRouter.post('/google', authRateLimiter, async (req, res) => {
  try {
    const parse = googleAuthSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ 
        error: parse.error.issues[0]?.message || 'Data login Google tidak valid' 
      });
    }

    let { email, displayName, googleId, photoUrl, originProvince, originCity, credential, accessToken } = parse.data;

    // 1. Verifikasi Google ID Token jika dikirim credential
    if (credential) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID || '84674853872-vknld967r5obl81av27d588mf8ghfhd6.apps.googleusercontent.com'
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          return res.status(400).json({ error: 'Token Google tidak valid atau tidak memiliki email.' });
        }
        googleId = payload.sub;
        email = payload.email;
        displayName = displayName || payload.name || payload.given_name || email.split('@')[0];
        photoUrl = photoUrl || payload.picture || null;
      } catch (err: any) {
        console.error('Google ID token verification failed:', err);
        return res.status(401).json({ error: 'Verifikasi Google Token gagal: ' + (err.message || 'Token tidak valid') });
      }
    } 
    // 2. Verifikasi Google OAuth Access Token jika dikirim accessToken
    else if (accessToken) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!userInfoRes.ok) {
          throw new Error('Gagal memverifikasi token ke server Google.');
        }
        const userInfo = (await userInfoRes.json()) as { sub: string; email: string; name?: string; given_name?: string; picture?: string };
        if (!userInfo || !userInfo.email) {
          return res.status(400).json({ error: 'Data profil dari akun Google tidak lengkap.' });
        }
        googleId = userInfo.sub;
        email = userInfo.email;
        displayName = displayName || userInfo.name || userInfo.given_name || email.split('@')[0];
        photoUrl = photoUrl || userInfo.picture || null;
      } catch (err: any) {
        console.error('Google access token verification failed:', err);
        return res.status(401).json({ error: 'Verifikasi Google Access Token gagal: ' + (err.message || 'Token tidak valid') });
      }
    }

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Data login Google tidak lengkap (email dan ID Google diperlukan).' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const finalDisplayName = displayName || cleanEmail.split('@')[0];

    // Check if citizen exists with google_id or email
    let user = await db.query.citizenUsers.findFirst({
      where: or(
        eq(schema.citizenUsers.google_id, googleId),
        eq(schema.citizenUsers.email, cleanEmail)
      )
    });

    if (user) {
      // Security check: Prevent unauthorized takeover of email registered with password
      if (user.auth_provider === 'local' && user.password_hash) {
        return res.status(409).json({
          error: 'Akun dengan email ini terdaftar menggunakan kata sandi biasa. Silakan masuk dengan formulir login email & kata sandi.'
        });
      }

      // Update Google info if not already linked or update photo
      await db.update(schema.citizenUsers)
        .set({
          google_id: googleId,
          auth_provider: 'google',
          is_email_verified: 1, // Google verified
          photo_url: user.photo_url || photoUrl || null,
          origin_province: user.origin_province || originProvince || null,
          origin_city: user.origin_city || originCity || null
        })
        .where(eq(schema.citizenUsers.id, user.id));

      user = await db.query.citizenUsers.findFirst({
        where: eq(schema.citizenUsers.id, user.id)
      });
    } else {
      // Create new Google citizen user
      const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20) || 'warga';
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const username = `${baseUsername}_${randomSuffix}`.toLowerCase();
      const userId = `usr-g-${Date.now()}-${randomSuffix}`;
      const chosenAvatar = ['garuda', 'merah', 'emas', 'banteng', 'padi'][Math.floor(Math.random() * 5)];

      await db.insert(schema.citizenUsers).values({
        id: userId,
        username,
        display_name: finalDisplayName,
        email: cleanEmail,
        google_id: googleId,
        auth_provider: 'google',
        photo_url: photoUrl || null,
        origin_province: originProvince || null,
        origin_city: originCity || null,
        avatar_seed: chosenAvatar,
        is_email_verified: 1, // Pre-verified via Google
        role: 'citizen'
      });

      user = await db.query.citizenUsers.findFirst({
        where: eq(schema.citizenUsers.id, userId)
      });
    }

    if (!user) {
      return res.status(500).json({ error: 'Gagal memproses otentikasi Google.' });
    }

    const token = generateCitizenToken({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: 'citizen',
      avatarSeed: user.avatar_seed || 'garuda',
      photoUrl: user.photo_url || undefined,
      originProvince: user.origin_province || undefined,
      originCity: user.origin_city || undefined,
      isEmailVerified: true
    });

    return res.json({
      status: 'success',
      message: 'Berhasil masuk menggunakan akun Google!',
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        photoUrl: user.photo_url,
        originProvince: user.origin_province,
        originCity: user.origin_city,
        bio: user.bio,
        avatarSeed: user.avatar_seed || 'garuda',
        role: 'citizen',
        isEmailVerified: true,
        authProvider: user.auth_provider
      }
    });
  } catch (err: any) {
    console.error('Error in Google auth:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat masuk dengan akun Google.' });
  }
});

// PUT /api/auth/citizen/profile (Edit Profil Warga)
citizenAuthRouter.put('/profile', verifyCitizenJwt, async (req, res) => {
  try {
    const userId = req.citizen?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Sesi warga tidak valid atau telah berakhir.' });
    }

    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ 
        error: parse.error.issues[0]?.message || 'Data profil tidak valid' 
      });
    }

    const { displayName, photoUrl, originProvince, originCity, bio, avatarSeed } = parse.data;

    const existingUser = await db.query.citizenUsers.findFirst({
      where: eq(schema.citizenUsers.id, userId)
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Data pengguna tidak ditemukan.' });
    }

    await db.update(schema.citizenUsers)
      .set({
        display_name: displayName,
        photo_url: photoUrl !== undefined ? (photoUrl || null) : existingUser.photo_url,
        origin_province: originProvince !== undefined ? (originProvince || null) : existingUser.origin_province,
        origin_city: originCity !== undefined ? (originCity || null) : existingUser.origin_city,
        bio: bio !== undefined ? (bio || null) : existingUser.bio,
        avatar_seed: avatarSeed || existingUser.avatar_seed || 'garuda'
      })
      .where(eq(schema.citizenUsers.id, userId));

    const updatedUser = await db.query.citizenUsers.findFirst({
      where: eq(schema.citizenUsers.id, userId)
    });

    if (!updatedUser) {
      return res.status(500).json({ error: 'Gagal memperbarui profil pengguna.' });
    }

    const newToken = generateCitizenToken({
      id: updatedUser.id,
      username: updatedUser.username,
      displayName: updatedUser.display_name,
      role: 'citizen',
      avatarSeed: updatedUser.avatar_seed || 'garuda',
      photoUrl: updatedUser.photo_url || undefined,
      originProvince: updatedUser.origin_province || undefined,
      originCity: updatedUser.origin_city || undefined,
      isEmailVerified: updatedUser.is_email_verified === 1
    });

    return res.json({
      status: 'success',
      message: 'Profil warga berhasil diperbarui.',
      token: newToken,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.display_name,
        email: updatedUser.email,
        photoUrl: updatedUser.photo_url,
        originProvince: updatedUser.origin_province,
        originCity: updatedUser.origin_city,
        bio: updatedUser.bio,
        avatarSeed: updatedUser.avatar_seed || 'garuda',
        role: 'citizen',
        isEmailVerified: updatedUser.is_email_verified === 1,
        authProvider: updatedUser.auth_provider
      }
    });
  } catch (err: any) {
    console.error('Error updating citizen profile:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat memperbarui profil warga.' });
  }
});

// POST /api/auth/citizen/quick (Dinonaktifkan: Mengharuskan akun terverifikasi)
citizenAuthRouter.post('/quick', authRateLimiter, (_req, res) => {
  return res.status(410).json({
    error: 'Mode Kilat telah dinonaktifkan demi menjaga integritas data dan kepastian suara warga. Silakan masuk menggunakan Akun Google atau daftarkan email Anda untuk verifikasi OTP.',
    needsVerification: true
  });
});

// GET /api/auth/citizen/me
citizenAuthRouter.get('/me', verifyCitizenJwt, async (req, res) => {
  try {
    const userId = req.citizen?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Tidak ada sesi warga yang aktif.' });
    }

    const user = await db.query.citizenUsers.findFirst({
      where: eq(schema.citizenUsers.id, userId)
    });

    if (!user) {
      return res.json({
        status: 'success',
        user: req.citizen
      });
    }

    return res.json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        photoUrl: user.photo_url,
        originProvince: user.origin_province,
        originCity: user.origin_city,
        bio: user.bio,
        avatarSeed: user.avatar_seed || 'garuda',
        role: 'citizen',
        isEmailVerified: user.is_email_verified === 1,
        authProvider: user.auth_provider,
        created_at: user.created_at
      }
    });
  } catch (err: any) {
    console.error('Error in citizen me:', err);
    return res.status(500).json({ error: 'Gagal mengambil profil akun warga.' });
  }
});

