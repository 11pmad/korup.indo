import { Router } from 'express';
import { z } from 'zod';
import { db, schema } from '../db/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { verifyCitizenJwt, optionalCitizenJwt } from '../middleware/auth.js';
import { REACTION_DEFINITIONS, ReactionType } from './reactions.js';

export const commentsRouter = Router();

const createCommentSchema = z.object({
  content: z.string().trim().min(5, 'Komentar minimal 5 karakter').max(1000, 'Komentar maksimal 1000 karakter'),
  reaction_type: z.enum([
    'geram',
    'rampok',
    'memalukan',
    'didukung',
    'khilaf_administrasi',
    'dimaklumi',
    'tebang_pilih',
    'kawal_sidang'
  ]).optional()
});

// GET /api/comments/case/:caseId
commentsRouter.get('/case/:caseId', optionalCitizenJwt, async (req, res) => {
  try {
    const { caseId } = req.params;
    const filter = (req.query.filter as string) || 'all';
    const sort = (req.query.sort as string) || 'newest';

    const commentsQuery = await db
      .select({
        id: schema.caseComments.id,
        case_id: schema.caseComments.case_id,
        content: schema.caseComments.content,
        reaction_type: schema.caseComments.reaction_type,
        upvotes_count: schema.caseComments.upvotes_count,
        created_at: schema.caseComments.created_at,
        user: {
          id: schema.citizenUsers.id,
          username: schema.citizenUsers.username,
          display_name: schema.citizenUsers.display_name,
          photo_url: schema.citizenUsers.photo_url,
          origin_province: schema.citizenUsers.origin_province,
          origin_city: schema.citizenUsers.origin_city,
          avatar_seed: schema.citizenUsers.avatar_seed,
          role: schema.citizenUsers.role
        }
      })
      .from(schema.caseComments)
      .innerJoin(schema.citizenUsers, eq(schema.caseComments.user_id, schema.citizenUsers.id))
      .where(
        and(
          eq(schema.caseComments.case_id, caseId),
          eq(schema.caseComments.is_hidden, 0)
        )
      )
      .orderBy(
        sort === 'popular'
          ? desc(schema.caseComments.upvotes_count)
          : desc(schema.caseComments.created_at)
      );

    // Filter by spectrum if specified
    let filtered = commentsQuery;
    if (filter === 'pemakluman') {
      filtered = commentsQuery.filter(c => 
        c.reaction_type && 
        (c.reaction_type === 'didukung' || c.reaction_type === 'khilaf_administrasi' || c.reaction_type === 'dimaklumi')
      );
    } else if (filter === 'kecaman') {
      filtered = commentsQuery.filter(c => 
        c.reaction_type && 
        (c.reaction_type === 'geram' || c.reaction_type === 'rampok' || c.reaction_type === 'memalukan')
      );
    } else if (filter === 'skeptis') {
      filtered = commentsQuery.filter(c => 
        c.reaction_type && 
        (c.reaction_type === 'tebang_pilih' || c.reaction_type === 'kawal_sidang')
      );
    }

    // Check user's upvotes if logged in
    let userUpvotedSet = new Set<string>();
    if (req.citizen?.id) {
      const userUpvotes = await db
        .select({ comment_id: schema.commentUpvotes.comment_id })
        .from(schema.commentUpvotes)
        .where(eq(schema.commentUpvotes.user_id, req.citizen.id));

      userUpvotedSet = new Set(userUpvotes.map(u => u.comment_id));
    }

    const result = filtered.map(c => ({
      ...c,
      reaction_info: c.reaction_type && REACTION_DEFINITIONS[c.reaction_type as ReactionType] 
        ? REACTION_DEFINITIONS[c.reaction_type as ReactionType]
        : null,
      is_upvoted: userUpvotedSet.has(c.id)
    }));

    return res.json({
      status: 'success',
      total: result.length,
      data: result
    });
  } catch (err: any) {
    console.error('Error in GET /api/comments/case/:caseId:', err);
    return res.status(500).json({ error: 'Gagal memuat komentar warga.' });
  }
});

// POST /api/comments/case/:caseId
commentsRouter.post('/case/:caseId', verifyCitizenJwt, async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.citizen!.id;

    const parse = createCommentSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0]?.message || 'Isi komentar tidak valid' });
    }

    const { content, reaction_type } = parse.data;

    // Check if case exists
    const caseItem = await db.query.cases.findFirst({
      where: eq(schema.cases.id, caseId)
    });

    if (!caseItem) {
      return res.status(404).json({ error: 'Berkas perkara tidak ditemukan.' });
    }

    const commentId = `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(schema.caseComments).values({
      id: commentId,
      case_id: caseId,
      user_id: userId,
      reaction_type: (reaction_type as any) || null,
      content,
      upvotes_count: 0,
      is_hidden: 0
    });

    // If reaction_type was selected, also sync reaction into case_reactions
    if (reaction_type) {
      const rxnId = `rxn-${caseId}-${userId}`;
      await db
        .insert(schema.caseReactions)
        .values({
          id: rxnId,
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

    // Fetch newly created comment with user info
    const newComment = await db
      .select({
        id: schema.caseComments.id,
        case_id: schema.caseComments.case_id,
        content: schema.caseComments.content,
        reaction_type: schema.caseComments.reaction_type,
        upvotes_count: schema.caseComments.upvotes_count,
        created_at: schema.caseComments.created_at,
        user: {
          id: schema.citizenUsers.id,
          username: schema.citizenUsers.username,
          display_name: schema.citizenUsers.display_name,
          avatar_seed: schema.citizenUsers.avatar_seed,
          role: schema.citizenUsers.role
        }
      })
      .from(schema.caseComments)
      .innerJoin(schema.citizenUsers, eq(schema.caseComments.user_id, schema.citizenUsers.id))
      .where(eq(schema.caseComments.id, commentId))
      .limit(1);

    return res.status(201).json({
      status: 'success',
      message: 'Komentar Anda berhasil dipublikasikan!',
      data: {
        ...newComment[0],
        reaction_info: reaction_type ? REACTION_DEFINITIONS[reaction_type as ReactionType] : null,
        is_upvoted: false
      }
    });
  } catch (err: any) {
    console.error('Error in POST /api/comments/case/:caseId:', err);
    return res.status(500).json({ error: 'Gagal mengirimkan komentar warga.' });
  }
});

// POST /api/comments/:commentId/upvote
commentsRouter.post('/:commentId/upvote', verifyCitizenJwt, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.citizen!.id;

    const comment = await db.query.caseComments.findFirst({
      where: eq(schema.caseComments.id, commentId)
    });

    if (!comment) {
      return res.status(404).json({ error: 'Komentar tidak ditemukan.' });
    }

    // Check if already upvoted
    const existingUpvote = await db.query.commentUpvotes.findFirst({
      where: and(
        eq(schema.commentUpvotes.comment_id, commentId),
        eq(schema.commentUpvotes.user_id, userId)
      )
    });

    let isUpvoted = false;
    let newCount = comment.upvotes_count;

    if (existingUpvote) {
      // Toggle off (remove upvote)
      await db
        .delete(schema.commentUpvotes)
        .where(
          and(
            eq(schema.commentUpvotes.comment_id, commentId),
            eq(schema.commentUpvotes.user_id, userId)
          )
        );

      newCount = Math.max(0, newCount - 1);
      await db
        .update(schema.caseComments)
        .set({ upvotes_count: newCount })
        .where(eq(schema.caseComments.id, commentId));
      isUpvoted = false;
    } else {
      // Add upvote
      await db.insert(schema.commentUpvotes).values({
        id: `upv-${commentId}-${userId}`,
        comment_id: commentId,
        user_id: userId
      });

      newCount += 1;
      await db
        .update(schema.caseComments)
        .set({ upvotes_count: newCount })
        .where(eq(schema.caseComments.id, commentId));
      isUpvoted = true;
    }

    return res.json({
      status: 'success',
      data: {
        commentId,
        upvotesCount: newCount,
        isUpvoted
      }
    });
  } catch (err: any) {
    console.error('Error in upvoting comment:', err);
    return res.status(500).json({ error: 'Gagal memproses dukungan komentar.' });
  }
});
