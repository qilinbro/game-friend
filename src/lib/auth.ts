import { cookies } from 'next/headers';

// 环境变量 - 严格类型（假设环境变量已配置）
const CLIENT_ID = process.env.SECONDME_CLIENT_ID!;
const CLIENT_SECRET = process.env.SECONDME_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SECONDME_REDIRECT_URI!;
const OAUTH_URL = process.env.SECONDME_OAUTH_URL!;
const TOKEN_ENDPOINT = process.env.SECONDME_TOKEN_ENDPOINT!;
const REFRESH_ENDPOINT = process.env.SECONDME_REFRESH_ENDPOINT!;
const API_BASE_URL = process.env.SECONDME_API_BASE_URL!;

// 生成 OAuth 授权 URL
export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    redirect_uri: REDIRECT_URI!,
    response_type: 'code',
    scope: 'user.info user.info.shades chat note.add',
  });

  return `${OAUTH_URL}?${params.toString()}`;
}

// 生成 state 参数用于 CSRF 防护
export function generateState(): string {
  return crypto.randomUUID();
}

// 验证 state 参数
export async function verifyState(state: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;
  return storedState === state;
}

// 交换 code 获取 token
export async function exchangeCodeForToken(code: string) {
  // 使用 x-www-form-urlencoded 格式而非 JSON
  // SecondMe API 期望表单编码格式
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  console.log('Token request:', params.toString());

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const responseText = await response.text();
  console.log('Token raw response:', responseText);

  if (!response.ok) {
    const error = JSON.parse(responseText);
    throw new Error(error.message || 'Token 交换失败');
  }

  const tokenData = JSON.parse(responseText);
  
  // SecondMe API 返回嵌套结构且使用驼峰式字段名
  // 需要展平并规范化字段名
  if (tokenData.data) {
    return {
      access_token: tokenData.data.accessToken,
      refresh_token: tokenData.data.refreshToken,
      expires_in: tokenData.data.expiresIn,
      token_type: tokenData.data.tokenType,
      scope: tokenData.data.scope,
    };
  }

  return tokenData;
}

// 刷新 access token
export async function refreshAccessToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(REFRESH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const responseText = await response.text();

  if (!response.ok) {
    const error = JSON.parse(responseText);
    throw new Error(error.message || 'Token 刷新失败');
  }

  const tokenData = JSON.parse(responseText);

  // 处理嵌套的响应结构
  if (tokenData.data) {
    return {
      access_token: tokenData.data.accessToken,
      refresh_token: tokenData.data.refreshToken,
      expires_in: tokenData.data.expiresIn,
      token_type: tokenData.data.tokenType,
      scope: tokenData.data.scope,
    };
  }

  return tokenData;
}

// 从环境变量获取 API 基础 URL
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// 验证 token 是否过期
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt;
}