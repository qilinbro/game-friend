import { redirect } from 'next/navigation';
import { generateState, getAuthorizationUrl } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const state = generateState();
  const authUrl = getAuthorizationUrl();

  // 设置 state cookie（必须在重定向之前）
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 分钟
    path: '/',
  });

  // 重定向到 OAuth 授权页面
  // 注意：redirect() 会抛出信号，不需要也不应该被 catch
  redirect(authUrl);
}