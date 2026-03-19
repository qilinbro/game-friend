import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    // 清除会话 cookie
    response.cookies.delete('session');

    return response;
  } catch (error) {
    console.error('登出错误:', error);
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    );
  }
}