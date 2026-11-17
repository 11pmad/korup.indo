import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc, sql, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { verifyAdminJwt, requireAdminRole, ALL_ADMIN_ROLES, AdminRole } from '../middleware/auth.js';
import { z } from 'zod';

export const adminUsersRouter = Router();

// All user management routes require admin authentication
adminUsersRouter.use(verifyAdminJwt);

const createUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50).regex(/^[a-zA-Z0-9_.-]+$/, 'Username hanya boleh huruf, angka, titik, minus, atau garis bawah'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  role: z.enum(['super_admin', 'admin', 'editor', 'moderator', 'auditor', 'reviewer'] as [string, ...string[]])
});

const updateUserSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(100).optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  role: z.enum(['super_admin', 'admin', 'editor', 'moderator', 'auditor', 'reviewer'] as [string, ...string[]]).optional()
});

const resetPasswordSchema = z.object({
  new_password: z.string().min(6, 'Kata sandi baru minimal 6 karakter')
});

// GET /api/admin/users - List all admin/staff users
adminUsersRouter.get('/', requireAdminRole(['super_admin', 'admin', 'auditor']), async (req, res) => {
  try {
    const users = await db
      .select({
        id: schema.adminUsers.id,
        username: schema.adminUsers.username,
        full_name: schema.adminUsers.full_name,
        email: schema.adminUsers.email,
        role: schema.adminUsers.role,
        is_active: schema.adminUsers.is_active,
        last_login: schema.adminUsers.last_login,
        created_at: schema.adminUsers.created_at
      })
      .from(schema.adminUsers)
      .orderBy(desc(schema.adminUsers.created_at));

    // Stats summary
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active === 1).length;
    const roleCounts = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.json({
      status: 'success',
      data: users,
      meta: {
        total: totalUsers,
        active: activeUsers,
        roleCounts
      }
    });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    return res.status(500).json({ error: 'Gagal mengambil daftar pengguna staf.' });
  }
});

// POST /api/admin/users - Create new staff user
adminUsersRouter.post('/', requireAdminRole(['super_admin']), async (req, res) => {
  try {
    const parse = createUserSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0]?.message || 'Data pengguna tidak valid.' });
    }

    const { username, password, full_name, email, role } = parse.data;

    // Check if username already exists
    const existing = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.username, username.toLowerCase().trim())
    });

    if (existing) {
      return res.status(400).json({ error: `Username "${username}" sudah digunakan. Silakan gunakan username lain.` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr-adm-${role.replace('_', '-')}-${Date.now().toString(36)}`;

    const [newUser] = await db
      .insert(schema.adminUsers)
      .values({
        id: userId,
        username: username.toLowerCase().trim(),
        password_hash: passwordHash,
        full_name: full_name.trim(),
        email: email ? email.trim().toLowerCase() : null,
        role: role as any,
        is_active: 1
      })
      .returning({
        id: schema.adminUsers.id,
        username: schema.adminUsers.username,
        full_name: schema.adminUsers.full_name,
        email: schema.adminUsers.email,
        role: schema.adminUsers.role,
        is_active: schema.adminUsers.is_active,
        created_at: schema.adminUsers.created_at
      });

    return res.status(201).json({
      status: 'success',
      message: `Akun verifikator "${newUser.full_name}" (${newUser.username}) dengan peran ${newUser.role} berhasil dibuat!`,
      data: newUser
    });
  } catch (err: any) {
    console.error('Error creating admin user:', err);
    return res.status(500).json({ error: 'Gagal membuat akun verifikator baru.' });
  }
});

// PUT /api/admin/users/:id - Update user profile & role
adminUsersRouter.put('/:id', requireAdminRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const parse = updateUserSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0]?.message || 'Data tidak valid.' });
    }

    const user = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, id)
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const { full_name, email, role } = parse.data;

    // Safety guard: If demoting this user from super_admin, verify there is at least one other active super_admin
    if (user.role === 'super_admin' && role && role !== 'super_admin') {
      const superAdmins = await db
        .select({ id: schema.adminUsers.id })
        .from(schema.adminUsers)
        .where(
          and(
            eq(schema.adminUsers.role, 'super_admin'),
            eq(schema.adminUsers.is_active, 1)
          )
        );

      if (superAdmins.length <= 1) {
        return res.status(400).json({
          error: 'Operasi ditolak: Anda tidak dapat menurunkan peran Super Admin terakhir dalam sistem!'
        });
      }
    }

    const updatePayload: Record<string, any> = {};
    if (full_name !== undefined) updatePayload.full_name = full_name.trim();
    if (email !== undefined) updatePayload.email = email ? email.trim().toLowerCase() : null;
    if (role !== undefined) updatePayload.role = role;

    const [updatedUser] = await db
      .update(schema.adminUsers)
      .set(updatePayload)
      .where(eq(schema.adminUsers.id, id))
      .returning({
        id: schema.adminUsers.id,
        username: schema.adminUsers.username,
        full_name: schema.adminUsers.full_name,
        email: schema.adminUsers.email,
        role: schema.adminUsers.role,
        is_active: schema.adminUsers.is_active,
        last_login: schema.adminUsers.last_login,
        created_at: schema.adminUsers.created_at
      });

    return res.json({
      status: 'success',
      message: `Profil pengguna "${updatedUser.full_name}" berhasil diperbarui.`,
      data: updatedUser
    });
  } catch (err: any) {
    console.error('Error updating admin user:', err);
    return res.status(500).json({ error: 'Gagal memperbarui data pengguna.' });
  }
});

// PUT /api/admin/users/:id/status - Toggle active/suspend status
adminUsersRouter.put('/:id/status', requireAdminRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active !== 0 && is_active !== 1) {
      return res.status(400).json({ error: 'Status is_active harus 0 (nonaktif) atau 1 (aktif).' });
    }

    // Safety guard: cannot suspend self
    if (req.admin?.id === id && is_active === 0) {
      return res.status(400).json({ error: 'Operasi ditolak: Anda tidak dapat menonaktifkan akun Anda sendiri!' });
    }

    const user = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, id)
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    // Safety guard: cannot suspend the only active super_admin
    if (user.role === 'super_admin' && is_active === 0) {
      const activeSuperAdmins = await db
        .select({ id: schema.adminUsers.id })
        .from(schema.adminUsers)
        .where(
          and(
            eq(schema.adminUsers.role, 'super_admin'),
            eq(schema.adminUsers.is_active, 1)
          )
        );

      if (activeSuperAdmins.length <= 1) {
        return res.status(400).json({
          error: 'Operasi ditolak: Anda tidak dapat menonaktifkan satu-satunya Super Admin aktif dalam sistem!'
        });
      }
    }

    const [updated] = await db
      .update(schema.adminUsers)
      .set({ is_active })
      .where(eq(schema.adminUsers.id, id))
      .returning({
        id: schema.adminUsers.id,
        username: schema.adminUsers.username,
        full_name: schema.adminUsers.full_name,
        is_active: schema.adminUsers.is_active
      });

    return res.json({
      status: 'success',
      message: `Status akun "${updated.full_name}" berhasil diubah menjadi ${is_active === 1 ? 'Aktif' : 'Ditangguhkan (Suspended)'}.`,
      data: updated
    });
  } catch (err: any) {
    console.error('Error toggling admin user status:', err);
    return res.status(500).json({ error: 'Gagal mengubah status pengguna.' });
  }
});

// POST /api/admin/users/:id/reset-password - Reset password
adminUsersRouter.post('/:id/reset-password', requireAdminRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const parse = resetPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0]?.message || 'Kata sandi tidak valid.' });
    }

    const user = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, id)
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const passwordHash = await bcrypt.hash(parse.data.new_password, 10);
    await db
      .update(schema.adminUsers)
      .set({ password_hash: passwordHash })
      .where(eq(schema.adminUsers.id, id));

    return res.json({
      status: 'success',
      message: `Kata sandi untuk pengguna "${user.full_name || user.username}" berhasil diatur ulang.`
    });
  } catch (err: any) {
    console.error('Error resetting admin user password:', err);
    return res.status(500).json({ error: 'Gagal mengatur ulang kata sandi pengguna.' });
  }
});

// DELETE /api/admin/users/:id - Delete staff user
adminUsersRouter.delete('/:id', requireAdminRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Safety guard: cannot delete self
    if (req.admin?.id === id) {
      return res.status(400).json({ error: 'Operasi ditolak: Anda tidak dapat menghapus akun Anda sendiri!' });
    }

    const user = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, id)
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    // Safety guard: cannot delete the only super_admin
    if (user.role === 'super_admin') {
      const superAdmins = await db
        .select({ id: schema.adminUsers.id })
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.role, 'super_admin'));

      if (superAdmins.length <= 1) {
        return res.status(400).json({
          error: 'Operasi ditolak: Anda tidak dapat menghapus Super Admin terakhir dalam sistem!'
        });
      }
    }

    await db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, id));

    return res.json({
      status: 'success',
      message: `Akun pengguna "${user.full_name || user.username}" telah berhasil dihapus secara permanen.`
    });
  } catch (err: any) {
    console.error('Error deleting admin user:', err);
    return res.status(500).json({ error: 'Gagal menghapus pengguna.' });
  }
});

// =========================================================================
// CITIZEN USERS MANAGEMENT (MANAJEMEN AKUN WARGA PUBLIK)
// =========================================================================

const updateCitizenSchema = z.object({
  display_name: z.string().min(2, 'Nama minimal 2 karakter').max(100).optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  origin_province: z.string().optional().or(z.literal('')),
  origin_city: z.string().optional().or(z.literal('')),
  bio: z.string().max(250).optional().or(z.literal('')),
  is_email_verified: z.union([z.literal(0), z.literal(1)]).optional()
});

const verifyCitizenSchema = z.object({
  is_email_verified: z.union([z.literal(0), z.literal(1)])
});

const resetCitizenPasswordSchema = z.object({
  new_password: z.string().min(6, 'Kata sandi minimal 6 karakter')
});

// GET /api/admin/users/citizens - List all citizen users
adminUsersRouter.get('/citizens', requireAdminRole(ALL_ADMIN_ROLES), async (req, res) => {
  try {
    const citizens = await db
      .select({
        id: schema.citizenUsers.id,
        username: schema.citizenUsers.username,
        display_name: schema.citizenUsers.display_name,
        email: schema.citizenUsers.email,
        photo_url: schema.citizenUsers.photo_url,
        origin_province: schema.citizenUsers.origin_province,
        origin_city: schema.citizenUsers.origin_city,
        bio: schema.citizenUsers.bio,
        avatar_seed: schema.citizenUsers.avatar_seed,
        is_email_verified: schema.citizenUsers.is_email_verified,
        auth_provider: schema.citizenUsers.auth_provider,
        role: schema.citizenUsers.role,
        created_at: schema.citizenUsers.created_at
      })
      .from(schema.citizenUsers)
      .orderBy(desc(schema.citizenUsers.created_at));

    const total = citizens.length;
    const verifiedCount = citizens.filter(c => c.is_email_verified === 1).length;
    const unverifiedCount = total - verifiedCount;
    const googleCount = citizens.filter(c => c.auth_provider === 'google').length;
    const localCount = citizens.filter(c => c.auth_provider !== 'google').length;

    return res.json({
      status: 'success',
      data: citizens,
      meta: {
        total,
        verifiedCount,
        unverifiedCount,
        googleCount,
        localCount
      }
    });
  } catch (err: any) {
    console.error('Error fetching citizens for admin:', err);
    return res.status(500).json({ error: 'Gagal mengambil daftar akun warga.' });
  }
});

// PUT /api/admin/users/citizens/:id - Update citizen data
adminUsersRouter.put('/citizens/:id', requireAdminRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const parse = updateCitizenSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0]?.message || 'Data warga tidak valid.' });
    }

    const citizen = await db.query.citizenUsers.findFirst({
      where: eq(schema.citizenUsers.id, id)
    });

    if (!citizen) {
      return res.status(404).json({ error: 'Akun warga tidak ditemukan.' });
    }

    const { display_name, email, origin_province, origin_city, bio, is_email_verified } = parse.data;

    // Check email uniqueness if email updated
    if (email && email.toLowerCase().trim() !== (citizen.email || '').toLowerCase()) {
      const existingEmail = await db.query.citizenUsers.findFirst({
        where: eq(schema.citizenUsers.email, email.toLowerCase().trim())
      });
      if (existingEmail && existingEmail.id !== id) {
        return res.status(400).json({ error: 'Email tersebut sudah digunakan oleh akun warga lain.' });
      }
    }

    const updatePayload: Record<string, any> = {};
    if (display_name !== undefined) updatePayload.display_name = display_name.trim();
    if (email !== undefined) updatePayload.email = email ? email.toLowerCase().trim() : null;
    if (origin_province !== undefined) updatePayload.origin_province = origin_province.trim() || null;
    if (origin_city !== undefined) updatePayload.origin_city = origin_city.trim() || null;
    if (bio !== undefined) updatePayload.bio = bio.trim() || null;
    if (is_email_verified !== undefined) updatePayload.is_email_verified = is_email_verified;

    const [updatedCitizen] = await db
      .update(schema.citizenUsers)
      .set(updatePayload)
      .where(eq(schema.citizenUsers.id, id))
      .returning({
        id: schema.citizenUsers.id,
        username: schema.citizenUsers.username,
        display_name: schema.citizenUsers.display_name,
        email: schema.citizenUsers.email,
        photo_url: schema.citizenUsers.photo_url,
        origin_province: schema.citizenUsers.origin_province,
        origin_city: schema.citizenUsers.origin_city,
        bio: schema.citizenUsers.bio,
        is_email_verified: schema.citizenUsers.is_email_verified,
        auth_provider: schema.citizenUsers.auth_provider,
        role: schema.citizenUsers.role,
        created_at: schema.citizenUsers.created_at
      });

    return res.json({
      status: 'success',
      message: `Data akun warga "${updatedCitizen.display_name}" (@${updatedCitizen.username}) berhasil diperbarui.`,
      data: updatedCitizen
    });
  } catch (err: any) {
    console.error('Error updating citizen user:', err);
    return res.status(500).json({ error: 'Gagal memperbarui data akun warga.' });
  }
});

// PUT /api/admin/users/citizens/:id/verify - Toggle / manual verify email
adminUsersRouter.put('/citizens/:id/verify', requireAdminRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const parse = verifyCitizenSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Nilai status is_email_verified harus 0 atau 1.' });
    }

    const { is_email_verified } = parse.data;

    const citizen = await db.query.citizenUsers.findFirst({
      where: eq(schema.citizenUsers.id, id)
    });

    if (!citizen) {
      return res.status(404).json({ error: 'Akun warga tidak ditemukan.' });
    }

    const [updated] = await db
      .update(schema.citizenUsers)
      .set({ 
        is_email_verified,
        email_verification_code: null,
        email_verification_expires: null
      })
      .where(eq(schema.citizenUsers.id, id))
      .returning({
        id: schema.citizenUsers.id,
        username: schema.citizenUsers.username,
        display_name: schema.citizenUsers.display_name,
        is_email_verified: schema.citizenUsers.is_email_verified
      });

    return res.json({
      status: 'success',
      message: `Status verifikasi warga "${updated.display_name}" berhasil diubah menjadi ${is_email_verified === 1 ? 'Terverifikasi (Aktif)' : 'Belum Diverifikasi'}.`,
      data: updated
    });
  } catch (err: any) {
    console.error('Error verifying citizen user:', err);
    return res.status(500).json({ error: 'Gagal mengubah status verifikasi akun warga.' });
  }
});

// POST /api/admin/users/citizens/:id/reset-password - Reset password for citizen
adminUsersRouter.post('/citizens/:id/reset-password', requireAdminRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const parse = resetCitizenPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0]?.message || 'Kata sandi minimal 6 karakter.' });
    }

    const citizen = await db.query.citizenUsers.findFirst({
      where: eq(schema.citizenUsers.id, id)
    });

    if (!citizen) {
      return res.status(404).json({ error: 'Akun warga tidak ditemukan.' });
    }

    const passwordHash = await bcrypt.hash(parse.data.new_password, 10);
    await db
      .update(schema.citizenUsers)
      .set({ password_hash: passwordHash })
      .where(eq(schema.citizenUsers.id, id));

    return res.json({
      status: 'success',
      message: `Kata sandi akun warga "${citizen.display_name || citizen.username}" berhasil diatur ulang.`
    });
  } catch (err: any) {
    console.error('Error resetting citizen password:', err);
    return res.status(500).json({ error: 'Gagal mereset kata sandi akun warga.' });
  }
});

// DELETE /api/admin/users/citizens/:id - Delete citizen account
adminUsersRouter.delete('/citizens/:id', requireAdminRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const citizen = await db.query.citizenUsers.findFirst({
      where: eq(schema.citizenUsers.id, id)
    });

    if (!citizen) {
      return res.status(404).json({ error: 'Akun warga tidak ditemukan.' });
    }

    await db.delete(schema.citizenUsers).where(eq(schema.citizenUsers.id, id));

    return res.json({
      status: 'success',
      message: `Akun warga "${citizen.display_name || citizen.username}" (@${citizen.username}) telah berhasil dihapus secara permanen.`
    });
  } catch (err: any) {
    console.error('Error deleting citizen user:', err);
    return res.status(500).json({ error: 'Gagal menghapus akun warga.' });
  }
});

