import { apiSuccess, CITIZEN_COOKIE_NAME } from '@/server/auth';

export async function POST() {
  const res = apiSuccess({ loggedOut: true });
  res.cookies.delete(CITIZEN_COOKIE_NAME);
  return res;
}
