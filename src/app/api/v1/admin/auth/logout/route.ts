import { ADMIN_COOKIE_NAME, apiSuccess } from '@/server/auth';

export async function POST() {
  const res = apiSuccess({ loggedOut: true });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
