import { NextRequest } from 'next/server';
import { apiError, apiSuccess, applyRateLimit } from '@/server/auth';
import { queryPersonDetailBySlugOrId } from '@/server/queries';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const limited = await applyRateLimit(req, 'public_read', 120, 60);
  if (limited) return limited;

  const { slug } = await context.params;
  const person = await queryPersonDetailBySlugOrId(slug);
  if (!person) return apiError('NOT_FOUND', 'Profil tokoh tidak ditemukan.', 404);
  return apiSuccess(person);
}
