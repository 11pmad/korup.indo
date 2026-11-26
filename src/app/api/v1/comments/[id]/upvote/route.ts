import { NextRequest } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { apiError, apiSuccess, applyRateLimit, getCitizenSession } from '@/server/auth';
import { db, schema } from '@/server/db';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const citizen = await getCitizenSession();
  if (!citizen) {
    return apiError('UNAUTHORIZED', 'Silakan masuk sebagai warga untuk mendukung komentar.', 401);
  }

  const limited = await applyRateLimit(req, 'write_citizen', 30, 900, citizen.id);
  if (limited) return limited;

  const { id: commentId } = await context.params;
  const [comment] = await db
    .select({ id: schema.caseComments.id })
    .from(schema.caseComments)
    .where(eq(schema.caseComments.id, commentId))
    .limit(1);

  if (!comment) return apiError('NOT_FOUND', 'Komentar tidak ditemukan.', 404);

  const existing = await db
    .select({ id: schema.commentUpvotes.id })
    .from(schema.commentUpvotes)
    .where(
      and(
        eq(schema.commentUpvotes.comment_id, commentId),
        eq(schema.commentUpvotes.user_id, citizen.id)
      )
    )
    .limit(1);

  let upvoted = true;
  if (existing.length > 0) {
    await db.delete(schema.commentUpvotes).where(eq(schema.commentUpvotes.id, existing[0].id));
    await db
      .update(schema.caseComments)
      .set({ upvotes_count: sql`GREATEST(0, ${schema.caseComments.upvotes_count} - 1)` })
      .where(eq(schema.caseComments.id, commentId));
    upvoted = false;
  } else {
    await db.insert(schema.commentUpvotes).values({
      id: `upv-${crypto.randomUUID().slice(0, 12)}`,
      comment_id: commentId,
      user_id: citizen.id,
    });
    await db
      .update(schema.caseComments)
      .set({ upvotes_count: sql`${schema.caseComments.upvotes_count} + 1` })
      .where(eq(schema.caseComments.id, commentId));
  }

  const [updated] = await db
    .select({ upvotes_count: schema.caseComments.upvotes_count })
    .from(schema.caseComments)
    .where(eq(schema.caseComments.id, commentId))
    .limit(1);

  return apiSuccess({ upvoted, upvotes_count: updated?.upvotes_count ?? 0 });
}
