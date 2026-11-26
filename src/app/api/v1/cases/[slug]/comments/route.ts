import { NextRequest } from 'next/server';
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  apiError,
  apiSuccess,
  applyRateLimit,
  getCitizenSession,
} from '@/server/auth';
import { db, schema } from '@/server/db';
import { commentCreateSchema } from '@/server/validators';

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

  const [rows, citizen] = await Promise.all([
    db
      .select({
        id: schema.caseComments.id,
        content: schema.caseComments.content,
        reaction_type: schema.caseComments.reaction_type,
        upvotes_count: schema.caseComments.upvotes_count,
        created_at: schema.caseComments.created_at,
        user_id: schema.citizenUsers.id,
        username: schema.citizenUsers.username,
        display_name: schema.citizenUsers.display_name,
        origin_province: schema.citizenUsers.origin_province,
        avatar_seed: schema.citizenUsers.avatar_seed,
      })
      .from(schema.caseComments)
      .innerJoin(schema.citizenUsers, eq(schema.caseComments.user_id, schema.citizenUsers.id))
      .where(and(eq(schema.caseComments.case_id, c.id), eq(schema.caseComments.is_hidden, false)))
      .orderBy(desc(schema.caseComments.upvotes_count), desc(schema.caseComments.created_at))
      .limit(100),
    getCitizenSession(),
  ]);

  let upvotedIds = new Set<string>();
  if (citizen && rows.length > 0) {
    const upvotes = await db
      .select({ comment_id: schema.commentUpvotes.comment_id })
      .from(schema.commentUpvotes)
      .where(
        and(
          eq(schema.commentUpvotes.user_id, citizen.id),
          inArray(
            schema.commentUpvotes.comment_id,
            rows.map((r) => r.id)
          )
        )
      );
    upvotedIds = new Set(upvotes.map((u) => u.comment_id));
  }

  return apiSuccess(
    rows.map((r) => ({
      ...r,
      has_upvoted: upvotedIds.has(r.id),
    }))
  );
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const citizen = await getCitizenSession();
  if (!citizen) {
    return apiError('UNAUTHORIZED', 'Silakan masuk sebagai warga terlebih dahulu untuk berdiskusi.', 401);
  }
  if (!citizen.isEmailVerified) {
    return apiError('FORBIDDEN', 'Akun warga belum terverifikasi email.', 403);
  }

  const limited = await applyRateLimit(req, 'write_citizen', 20, 900, citizen.id);
  if (limited) return limited;

  const { slug } = await context.params;
  const [c] = await db
    .select({ id: schema.cases.id, slug: schema.cases.slug })
    .from(schema.cases)
    .where(or(eq(schema.cases.slug, slug), eq(schema.cases.id, slug)))
    .limit(1);

  if (!c) return apiError('NOT_FOUND', 'Perkara tidak ditemukan.', 404);

  const body = await req.json().catch(() => null);
  const parsed = commentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Komentar tidak valid.', 400);
  }

  const newId = `cmt-${crypto.randomUUID().slice(0, 12)}`;
  await db.insert(schema.caseComments).values({
    id: newId,
    case_id: c.id,
    user_id: citizen.id,
    content: parsed.data.content,
    reaction_type: parsed.data.reactionType ?? null,
    upvotes_count: 0,
    is_hidden: false,
  });

  revalidatePath(`/kasus/${c.slug}`);
  return apiSuccess({ id: newId }, undefined, 201);
}
