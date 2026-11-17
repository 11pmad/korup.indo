import { Router } from 'express';
import { z } from 'zod';
import { db, schema } from '../db/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { verifyCitizenJwt, optionalCitizenJwt } from '../middleware/auth.js';

export const reactionsRouter = Router();

export const REACTION_DEFINITIONS = {
  geram: {
    emoji: '😡',
    label: 'Sangat Geram',
    spectrum: 'kecaman',
    description: 'Tindakan serakah dan tidak bermoral yang melukai rasa keadilan rakyat.'
  },
  rampok: {
    emoji: '💸',
    label: 'Rampok Uang Rakyat',
    spectrum: 'kecaman',
    description: 'Menguras anggaran negara demi kemewahan pribadi dan kroni.'
  },
  memalukan: {
    emoji: '🤮',
    label: 'Memalukan & Menjijikkan',
    spectrum: 'kecaman',
    description: 'Merusak kehormatan institusi dan moral bangsa.'
  },
  didukung: {
    emoji: '🤝',
    label: 'Didukung & Masuk Akal',
    spectrum: 'pemakluman',
    description: 'Kebijakan demi kepentingan rakyat atau fasilitas penunjang tugas dinas yang wajar.'
  },
  khilaf_administrasi: {
    emoji: '💡',
    label: 'Khilaf Administrasi (Niat Baik)',
    spectrum: 'pemakluman',
    description: 'Kesalahan prosedur tanpa niat korupsi; pejabat bersangkutan tidak menikmati sepeser pun.'
  },
  dimaklumi: {
    emoji: '🕊️',
    label: 'Dimaklumi & Dimaafkan',
    spectrum: 'pemakluman',
    description: 'Kerugian negara nihil/dipulihkan; dakwaan hukum terasa berlebihan.'
  },
  tebang_pilih: {
    emoji: '⚖️',
    label: 'Janggal / Tebang Pilih',
    spectrum: 'skeptis',
    description: 'Aroma politisasi hukum atau penargetan lawan politik secara selektif.'
  },
  kawal_sidang: {
    emoji: '🧐',
    label: 'Kawal Sidang Objektif',
    spectrum: 'skeptis',
    description: 'Fakta belum terang; masyarakat harus mengawal pembuktian di pengadilan.'
  }
} as const;

export type ReactionType = keyof typeof REACTION_DEFINITIONS;

const reactionSchema = z.object({
  reaction_type: z.enum([
    'geram',
    'rampok',
    'memalukan',
    'didukung',
    'khilaf_administrasi',
    'dimaklumi',
    'tebang_pilih',
    'kawal_sidang'
  ])
});

// Helper to compute sentiment summary
function computeSentiment(rows: { reaction_type: string }[]) {
  const counts: Record<string, number> = {
    geram: 0,
    rampok: 0,
    memalukan: 0,
    didukung: 0,
    khilaf_administrasi: 0,
    dimaklumi: 0,
    tebang_pilih: 0,
    kawal_sidang: 0
  };

  rows.forEach(r => {
    if (counts[r.reaction_type] !== undefined) {
      counts[r.reaction_type]++;
    }
  });

  const total = rows.length;
  const kecamanCount = counts.geram + counts.rampok + counts.memalukan;
  const pemaklumanCount = counts.didukung + counts.khilaf_administrasi + counts.dimaklumi;
  const skeptisCount = counts.tebang_pilih + counts.kawal_sidang;

  const kecamanPct = total > 0 ? Math.round((kecamanCount / total) * 100) : 0;
  const pemaklumanPct = total > 0 ? Math.round((pemaklumanCount / total) * 100) : 0;
  const skeptisPct = total > 0 ? Math.round((skeptisCount / total) * 100) : 0;

  let badgeType: 'kecaman' | 'pemakluman' | 'skeptis' | 'netral' = 'netral';
  let badgeLabel = 'Belum Cukup Suara';

  if (total >= 1) {
    if (pemaklumanPct >= 50) {
      badgeType = 'pemakluman';
      badgeLabel = `🤝 Mayoritas Warga Memaklumi (${pemaklumanPct}%)`;
    } else if (kecamanPct >= 50) {
      badgeType = 'kecaman';
      badgeLabel = `🔥 Dikecam Keras Rakyat (${kecamanPct}%)`;
    } else if (skeptisPct >= 40) {
      badgeType = 'skeptis';
      badgeLabel = `⚖️ Dinilai Tebang Pilih / Janggal (${skeptisPct}%)`;
    } else {
      badgeType = 'netral';
      badgeLabel = `⚖️ Perdebatan Publik Seimbang`;
    }
  }

  return {
    total,
    counts,
    spectrum: {
      kecaman: { count: kecamanCount, percentage: kecamanPct },
      pemakluman: { count: pemaklumanCount, percentage: pemaklumanPct },
      skeptis: { count: skeptisCount, percentage: skeptisPct }
    },
    badge: {
      type: badgeType,
      label: badgeLabel
    }
  };
}

// GET /api/reactions/case/:caseId
reactionsRouter.get('/case/:caseId', optionalCitizenJwt, async (req, res) => {
  try {
    const { caseId } = req.params;
    const allReactions = await db
      .select({ reaction_type: schema.caseReactions.reaction_type })
      .from(schema.caseReactions)
      .where(eq(schema.caseReactions.case_id, caseId));

    const sentiment = computeSentiment(allReactions);

    let userReaction: string | null = null;
    if (req.citizen?.id) {
      const userRow = await db
        .select({ reaction_type: schema.caseReactions.reaction_type })
        .from(schema.caseReactions)
        .where(
          and(
            eq(schema.caseReactions.case_id, caseId),
            eq(schema.caseReactions.user_id, req.citizen.id)
          )
        )
        .limit(1);

      if (userRow.length > 0) {
        userReaction = userRow[0].reaction_type;
      }
    }

    return res.json({
      status: 'success',
      data: {
        ...sentiment,
        userReaction,
        definitions: REACTION_DEFINITIONS
      }
    });
  } catch (err: any) {
    console.error('Error in GET /api/reactions/case/:caseId:', err);
    return res.status(500).json({ error: 'Gagal mengambil statistik reaksi kasus.' });
  }
});

// POST /api/reactions/case/:caseId
reactionsRouter.post('/case/:caseId', verifyCitizenJwt, async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.citizen!.id;

    const parse = reactionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Jenis reaksi tidak valid.' });
    }

    const { reaction_type } = parse.data;

    // Check if case exists
    const caseExists = await db.query.cases.findFirst({
      where: eq(schema.cases.id, caseId)
    });

    if (!caseExists) {
      return res.status(404).json({ error: 'Berkas perkara tidak ditemukan.' });
    }

    // Check if user already had this exact reaction -> allow toggling off (cancel vote)
    const existing = await db.query.caseReactions.findFirst({
      where: and(
        eq(schema.caseReactions.case_id, caseId),
        eq(schema.caseReactions.user_id, userId)
      )
    });

    let userReaction: string | null = reaction_type;
    let message = `Reaksi Anda (${REACTION_DEFINITIONS[reaction_type].emoji} ${REACTION_DEFINITIONS[reaction_type].label}) berhasil dicatat!`;

    if (existing && existing.reaction_type === reaction_type) {
      // User clicked the same reaction again -> cancel reaction
      await db.delete(schema.caseReactions).where(
        and(
          eq(schema.caseReactions.case_id, caseId),
          eq(schema.caseReactions.user_id, userId)
        )
      );
      userReaction = null;
      message = 'Reaksi Anda telah dibatalkan.';
    } else {
      // Upsert into case_reactions
      const reactionId = `rxn-${caseId}-${userId}`;
      await db
        .insert(schema.caseReactions)
        .values({
          id: reactionId,
          case_id: caseId,
          user_id: userId,
          reaction_type: reaction_type as any
        })
        .onConflictDoUpdate({
          target: [schema.caseReactions.case_id, schema.caseReactions.user_id],
          set: {
            reaction_type: reaction_type as any,
            created_at: sql`NOW()`
          }
        });
    }

    // Recompute stats
    const allReactions = await db
      .select({ reaction_type: schema.caseReactions.reaction_type })
      .from(schema.caseReactions)
      .where(eq(schema.caseReactions.case_id, caseId));

    const sentiment = computeSentiment(allReactions);

    return res.json({
      status: 'success',
      message,
      data: {
        ...sentiment,
        userReaction,
        definitions: REACTION_DEFINITIONS
      }
    });
  } catch (err: any) {
    console.error('Error in POST /api/reactions/case/:caseId:', err);
    return res.status(500).json({ error: 'Gagal mencatat reaksi warga.' });
  }
});
