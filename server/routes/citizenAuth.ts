import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { generateCitizenToken, verifyCitizenJwt } from '../middleware/auth.js';

export const citizenAuthRouter = Router();

const registerSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  displayName: z.string().min(2, 'Nama tampilan minimal 2 karakter').max(50),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  avatarSeed: z.string().optional()
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username diperlukan'),
  password: z.string().min(1, 'Kata sandi diperlukan')
});

const quickAuthSchema = z.object({
  displayName: z.string().min(2, 'Nama minimal 2 karakter').max(50),
  avatarSeed: z.string().optional()
});

// POST /api/auth/citizen/register
citizenAuthRouter.post('/register', async (req, res) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ 
        error: parse.error.issues[0]?.message || 'Data registrasi tidak valid' 
      });
    }

    const { username, displayName, password, email, avatarSeed } = parse.data;

    // Check if username taken
    const existing = await db.query.citizenUsers.findFirst({
      where: eq(schema.citizenUsers.username, username.toLowerCase())
    });

    if (existing) {
      return res.status(400).json({ error: 'Username tersebut sudah terdaftar oleh warga lain.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const chosenAvatar = avatarSeed || ['garuda', 'merah', 'emas', 'banteng', 'padi'][Math.floor(Math.random() * 5)];

    await db.insert(schema.citizenUsers).values({
      id: userId,
      username: username.toLowerCase(),
      display_name: displayName,
      email: email || null,
      password_hash: passwordHash,
      avatar_seed: chosenAvatar,
      role: 'citizen'
    });

    const token = generateCitizenToken({
      id: userId,
      username: username.toLowerCase(),
      displayName,
      role: 'citizen',
      avatarSeed: chosenAvatar
    });

    return res.status(201).json({
      status: 'success',
      message: 'Pendaftaran akun warga berhasil! Anda sekarang dapat memberikan suara dan tanggapan.',
      token,
      user: {
        id: userId,
        username: username.toLowerCase(),
        displayName,
        role: 'citizen',
        avatarSeed: chosenAvatar
      }
    });
  } catch (err: any) {
    console.error('Error in citizen register:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat mendaftarkan akun warga.' });
  }
});

// POST /api/auth/citizen/login
citizenAuthRouter.post('/login', async (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Username dan kata sandi wajib diisi.' });
    }

    const { username, password } = parse.data;

    const user = await db.query.citizenUsers.findFirst({
      where: eq(schema.citizenUsers.username, username.toLowerCase())
    });

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Username atau kata sandi tidak cocok.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Username atau kata sandi tidak cocok.' });
    }

    const token = generateCitizenToken({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: 'citizen',
      avatarSeed: user.avatar_seed || 'garuda'
    });

    return res.json({
      status: 'success',
      message: 'Selamat datang kembali, Warga LKI!',
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: 'citizen',
        avatarSeed: user.avatar_seed || 'garuda'
      }
    });
  } catch (err: any) {
    console.error('Error in citizen login:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat proses masuk akun warga.' });
  }
});

// POST /api/auth/citizen/quick (Mode Cepat Suara Warga)
citizenAuthRouter.post('/quick', async (req, res) => {
  try {
    const parse = quickAuthSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Nama tampilan minimal 2 karakter.' });
    }

    const { displayName, avatarSeed } = parse.data;
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const username = `warga_${randomSuffix}`;
    const userId = `usr-q-${Date.now()}-${randomSuffix}`;
    const chosenAvatar = avatarSeed || ['garuda', 'merah', 'emas', 'banteng', 'padi'][Math.floor(Math.random() * 5)];

    await db.insert(schema.citizenUsers).values({
      id: userId,
      username,
      display_name: displayName,
      email: null,
      password_hash: null,
      avatar_seed: chosenAvatar,
      role: 'citizen'
    });

    const token = generateCitizenToken({
      id: userId,
      username,
      displayName,
      role: 'citizen',
      avatarSeed: chosenAvatar
    });

    return res.status(201).json({
      status: 'success',
      message: 'Identitas Warga aktif! Anda langsung dapat bersuara dan berkomentar.',
      token,
      user: {
        id: userId,
        username,
        displayName,
        role: 'citizen',
        avatarSeed: chosenAvatar
      }
    });
  } catch (err: any) {
    console.error('Error in quick citizen auth:', err);
    return res.status(500).json({ error: 'Gagal membuat identitas warga cepat.' });
  }
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
      // Fallback from token payload
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
        avatarSeed: user.avatar_seed || 'garuda',
        role: 'citizen',
        created_at: user.created_at
      }
    });
  } catch (err: any) {
    console.error('Error in citizen me:', err);
    return res.status(500).json({ error: 'Gagal mengambil profil akun warga.' });
  }
});
