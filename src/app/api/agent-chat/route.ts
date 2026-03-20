import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

interface ChatRequest {
  message: string;
  sessionId?: string;
  system:?: string;
  model?: string;
}

// POST - 调用 AI 代理（从数据库获取 SecondMe token）
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({
        code: -1,
        message: '未登录'
      }, { status: 401 });
    }

    // 从数据库获取用户的 SecondMe token
    const user = await prisma.user.findUnique({
      where: { secondmeUserId: session },
    });

    if (!user) {
      return NextResponse.json({
        code: -1,
        message: '用户不存在'
      }, { status: 404 });
    }

    const body = await request.json() as ChatRequest;
    const { message, sessionId, systemPrompt, model } = body;
    const token = user.accessToken;

    if (!token) {
      return NextResponse.json({
        code: -1,
        message: 'SecondMe token 未找到'
      }, { status: 500 });
    }

    // 调用 SecondMe API
    const response = await fetch('https://api.mindverse.com/gate/lab/api/secondme/chat/stream', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        model: model || 'anthropic/claude-sonnet-4-5',
        systemPrompt,
      }),
    });

    if (!response.ok) {
      console.error('SecondMe API 错误:', await response.text());
      return NextResponse.json({
        code: -1,
        message: 'AI 服务调用失败'
      }, { status: 500 });
    }

    // 转发流式响应
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              if (buffer) {
                controller.enqueue(encoder.encode(buffer));
              }
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              controller.enqueue(encoder.encode(line + '\n'));
            }
          }
        } catch (error) {
          console.error('流式传输错误:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI 聊天 API 错误:', error);
    return NextResponse.json({
      code: -1,
      message: 'AI 聊天失败'
    }, { status: 500 });
  }
}
