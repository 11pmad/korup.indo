import { NextRequest } from 'next/server';
import { and, eq, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  apiError,
  apiSuccess,
  applyRateLimit,
  getCitizenSession,
} from '@/server/auth';
import { db, schema } from '@/server/db';
import { reactionTypeSchema } from '@/server/validators';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const [c] = await db
    .select({ id: schema.cases.id })
    .from(schema.cases)
    .where(or(eq(schema.cases.slug, slug), eq(schema.cases.id, slug)))
    .limit(1);

  if (!c) return apiError('NOT_FOUND', 'Perkara tidak ditemukan.', 404);

  const [counts, citizen] = await Promise.all([
    db
      .select({
        reaction_type: schema.caseReactions.reaction_type,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.caseReactions)
      .where(eq(schema.caseReactions.case_id, c.id))
      .groupBy(schema.caseReactions.reaction_type),
    getCitizenSession(),
  ]);

  let userReaction: string | null = null;
  if (citizen) {
    const [existing] = await db
      .select({ reaction_type: schema.caseReactions.reaction_type })
      .from(schema.caseReactions)
      .where(
        and(
          eq(schema.caseReactions.case_id, c.id),
          eq(schema.caseReactions.user_id, citizen.id)
        )
      )
      .limit(1);
    userReaction = existing?.reaction_type ?? null;
  }

  return apiSuccess({ counts, userReaction });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const citizen = await getCitizenSession();
  if (!citizen) {
    return apiError('UNAUTHORIZED', 'Silakan masuk sebagai warga terlebih dahulu untuk memberikan reaksi.', 401);
  }
  if (!citizen.isEmailVerified) {
    return apiError('FORBIDDEN', 'Akun warga belum terverifikasi email.', 403);
  }

  const limited = await applyRateLimit(req, 'write_citizen', 30, 900, citizen.id);
  if (limited) return limited;

  const { slug } = await context.params;
  const [c] = await db
    .select({ id: schema.cases.id, slug: schema.cases.slug })
    .from(schema.cases)
    .where(or(eq(schema.cases.slug, slug), eq(schema.cases.id, slug)))
    .limit(1);

  if (!c) return apiError('NOT_FOUND', 'Perkara tidak ditemukan.', 404);

  const body = await req.json().catch(() => null);
  const parsed = reactionTypeSchema.safeParse(body?.reactionType);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Jenis reaksi tidak valid.', 400);
  }

  const existing = await db
    .select()
    .from(schema.caseReactions)
    .where(
      and(
        eq(schema.caseReactions.case_id, c.id),
        eq(schema.caseReactions.user_id, citizen.id)
      )
    )
    .limit(1);

  let activeReaction: string | null = parsed.data;
  if (existing.length > 0 && existing[0].reaction_type === parsed.data) {
    await db.delete(schema.caseReactions).where(eq(schema.caseReactions.id, existing[0].id));
    activeReaction = null;
  } else if (existing.length > 0) {
    await db
      .update(schema.caseReactions)
      .set({ reaction_type: parsed.data })
      .where(eq(schema.caseReactions.id, existing[0].id));
  } else {
    await db.insert(schema.caseReactions).values({
      id: `rx-${crypto.randomUUID().slice(0, 12)}`,
      case_id: c.id,
      user_id: citizen.id,
      reaction_type: parsed.data,
    });
  }

  const counts = await db
    .select({
      reaction_type: schema.caseReactions.reaction_type,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.caseReactions)
    .where(eq(schema.caseReactions.case_id, c.id))
    .groupBy(schema.caseReactions.reaction_type);

  revalidatePath(`/kasus/${c.slug}`);
  return apiSuccess({ counts, userReaction: activeReaction });
}
