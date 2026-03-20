import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - 获取房间消息
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const roomId = id;

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return NextResponse.json({
      code: 0,
      data: { messages },
    });
  } catch (error) {
    console.error('获取房间消息失败:', error);
    return NextResponse.json({
      code: -1,
      message: '获取房间消息失败',
    }, { status: 500 });
  }
}

// POST - 保存房间消息
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, content, playerName, playerAvatar } = body;
    const roomId = id;

    // 从 cookie 获取用户 ID（如果有）
    const cookies = request.headers.get('cookie') || '';
    const userIdMatch = cookies.match(/user_id=([^;]+)/);
    const userId = userIdMatch ? userIdMatch[1] : null;

    const message = await prisma.chatMessage.create({
      data: {
        userId,
        roomId,
        role,
        content,
        playerName,
        playerAvatar,
      },
    });

    return NextResponse.json({
      code: 0,
      data: message,
      message: '消息保存成功',
    });
  } catch (error) {
    console.error('保存房间消息失败:', error);
    return NextResponse.json({
      code: -1,
      message: '保存房间消息失败',
    }, { status: 500 });
  }
}
