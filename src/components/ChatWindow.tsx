'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SoftMemory {
  id: number;
  factObject: string;
  factContent: string;
  createTime: number;
  updateTime: number;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageContent = input.trim();
    setInput('');
    setLoading(true);

    // 上报事件到 Agent Memory
    try {
      await fetch('/api/agent-memory/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: {
            kind: 'chat',
            id: conversationId || 'new',
          },
          action: 'message_sent',
          actionLabel: '发送了聊天消息',
          displayText: `用户发送了消息: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
          refs: [
            {
              objectType: 'chat_message',
              objectId: userMessage.id,
              contentPreview: messageContent.substring(0, 100),
              snapshot: {
                text: messageContent,
                capturedAt: Date.now(),
              },
            },
          ],
          importance: 0.5,
          idempotencyKey: `msg_${userMessage.id}`,
          payload: {
            conversationId: conversationId || 'new',
            messageLength: messageContent.length,
          },
        }),
      });
    } catch (error) {
      console.error('上报事件失败:', error);
      // 不影响聊天流程
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: conversationId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('聊天失败');
      }

      // 如果有 conversation_id，保存下来
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // 流式响应
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('无法读取响应');

        let assistantContent = '';
        let newConversationId = conversationId;

        // 添加空的消息用于流式内容
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        let currentEvent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
              continue;
            }

            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              // 流结束标志
              if (data === '[DONE]') {
                break;
              }

              // 解析数据
              try {
                const parsed = JSON.parse(data);

                // 处理会话事件
                if (currentEvent === 'session' && parsed.sessionId) {
                  newConversationId = parsed.sessionId;
                  setConversationId(newConversationId);
                }

                // 处理聊天内容
                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                  assistantContent += parsed.choices[0].delta.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // 忽略解析错误
              }

              currentEvent = '';
            }
          }
        }
      } else {
        // 非流式响应
        const result = await response.json();
        if (result.code === 0) {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: result.data?.content || '收到回复',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (result.data?.conversation_id) {
            setConversationId(result.data.conversation_id);
          }
        }
      }
    } catch (error) {
      console.error('聊天错误:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，聊天出错了，请重试',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 分析游戏风格
  const analyzeGameStyle = async () => {
    if (analyzing) return;
    setAnalyzing(true);

    try {
      // 获取软记忆数据
      const response = await fetch('/api/user/softmemory?pageNo=1&pageSize=50');
      const data = await response.json();

      if (data.code === 0 && data.data?.list) {
        const memories = data.data.list as SoftMemory[];

        // 构建分析提示
        const memoryText = memories
          .map((m) => `${m.factObject}: ${m.factContent}`)
          .join('\n');

        const analysisPrompt = `根据我的个人记忆信息，分析我的游戏风格和偏好：

${memoryText}

请从以下几个方面进行分析：
1. 游戏类型偏好（如：FPS、MOBA、开放世界等）
2. 游戏风格（如：竞技、休闲、社交、探索等）
3. 团队角色偏好（如：指挥、输出、辅助、肉盾等）
4. 活跃时间段
5. 适合的队友类型

请给出详细的个性化分析。`;

        // 发送分析请求
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: '分析一下我的游戏风格',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: analysisPrompt,
            systemPrompt: '你是一个专业的游戏风格分析师，根据用户的个人记忆信息进行深度分析。',
            sessionId: conversationId || undefined,
          }),
        });

        if (chatResponse.ok) {
          const reader = chatResponse.body?.getReader();
          const decoder = new TextDecoder();

          if (reader) {
            let assistantContent = '';
            let newConversationId = conversationId;

            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);

            let currentEvent = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('event: ')) {
                  currentEvent = line.slice(7).trim();
                  continue;
                }

                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();

                  if (data === '[DONE]') {
                    break;
                  }

                  try {
                    const parsed = JSON.parse(data);

                    if (currentEvent === 'session' && parsed.sessionId) {
                      newConversationId = parsed.sessionId;
                      setConversationId(newConversationId);
                    }

                    if (parsed.choices && parsed.choices[0]?.delta?.content) {
                      assistantContent += parsed.choices[0].delta.content;
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessage.id
                            ? { ...msg, content: assistantContent }
                            : msg
                        )
                      );
                    }
                  } catch (e) {}

                  currentEvent = '';
                }
              }
            }
          }
        }
      } else {
        // 没有记忆数据时的提示
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '暂时还没有足够的记忆数据来分析你的游戏风格。多跟我聊聊，让我更好地了解你吧！',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('分析错误:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '分析失败，请稍后重试',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl shadow-sm">
      {/* 聊天记录区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <img src="/pictures/游戏搭子logo.png" alt="游戏搭子" className="w-20 h-20 mx-auto mb-4" />
              <p>开始聊天，帮你找到游戏搭子</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-pink-200' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-pink-400"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '发送中...' : '发送'}
          </button>
          <button
            onClick={analyzeGameStyle}
            disabled={loading || analyzing}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="分析我的游戏风格"
          >
            <span>📊</span>
            <span className="hidden sm:inline">分析风格</span>
          </button>
        </div>
      </div>
    </div>
  );
}