import { apiError, apiSuccess, getAdminSession } from '@/server/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return apiError('UNAUTHORIZED', 'Sesi admin tidak valid.', 401);
  }
  return apiSuccess({ admin: session });
}
