import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameId, name, maxPlayers } = body;

    if (!gameId || !name || !maxPlayers) {
      return NextResponse.json({
        code: -1,
        message: '缺少必要参数'
      }, { status: 400 });
    }

    // 验证游戏是否存在
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return NextResponse.json({
        code: -1,
        message: '游戏不存在'
      }, { status: 404 });
    }

    // 创建房间
    const room = await prisma.room.create({
      data: {
        gameId,
        name,
        maxPlayers,
        online: true
      },
      include: {
        game: true
      }
    });

    return NextResponse.json({
      code: 0,
      data: room,
      message: '房间创建成功'
    });
  } catch (error) {
    console.error('创建房间失败:', error);
    return NextResponse.json({
      code: -1,
      message: '创建房间失败'
    }, { status: 500 });
  }
}
