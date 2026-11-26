import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, applyRateLimit, requireAdminApi } from '@/server/auth';
import { runAiCurator } from '@/server/ai-curator';

const aiReqSchema = z.object({
  message: z.string().trim().min(5, 'Pesan instruksi terlalu singkat').max(6000),
  history: z
    .array(
      z.object({
        role: z.enum(['admin', 'ai']),
        text: z.string(),
      })
    )
    .max(20)
    .default([]),
});

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdminApi('use_ai_curator');
  if (error || !session) return error!;

  const limited = await applyRateLimit(req, 'ai_curator', 30, 3600, session.id);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = aiReqSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Input tidak valid.', 400);
  }

  const result = await runAiCurator(parsed.data.message, parsed.data.history);
  return apiSuccess(result);
}
