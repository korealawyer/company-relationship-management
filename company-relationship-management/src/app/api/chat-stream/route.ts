import { NextRequest } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';

// A5: Chat Streaming (SSE) 엔드포인트
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'claude-sonnet-4-5';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

// Mock 응답 — 문자 단위로 스트리밍 시뮬레이션
function getMockResponse(messages: ChatMessage[], consultType: string): string {
    const last = messages[messages.length - 1]?.content || '';
    if (consultType === 'legal' || last.includes('법률') || last.includes('계약')) {
        return '네, 어떤 법률 문제가 있으신가요? 다음 중 선택해 주세요:\n\n1. 가맹계약 분쟁\n2. 개인정보 관련\n3. 노동·노무 문제\n4. 형사 사건\n5. 기타\n\n번호를 입력하거나 직접 설명해 주시면 관련 안내를 드리겠습니다.';
    }
    if (consultType === 'eap') {
        return '마음이 힘드시겠어요. 간단한 질문 3가지로 현재 상태를 파악해 드리겠습니다.\n\n**최근 2주간 일상적인 활동에서 즐거움을 느끼는 경우가:**\n① 거의 없다 ② 가끔 있다 ③ 자주 있다';
    }
    return '안녕하세요! IBS 로펌 AI 상담 어시스턴트입니다. 어떤 도움이 필요하신가요?\n\n⚖️ **법률 상담** — 가맹계약, 노동, 개인정보, 형사\n🧠 **심리/EAP** — 스트레스·감정 관리\n💼 **경영 자문** — 노무, 공정거래\n\n원하시는 분야를 말씀해 주세요.';
}

export async function POST(req: NextRequest) {
    // 인증 확인
    const auth = requireSessionFromCookie(req);
    if (!auth.ok) {
        return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: { 'content-type': 'application/json' } });
    }

    const { messages, consultType = 'general' } = await req.json();
    const encoder = new TextEncoder();

    // Claude Streaming 모드
    if (ANTHROPIC_API_KEY) {
        try {
            const resp = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    max_tokens: 1024,
                    stream: true,
                    system: '당신은 IBS 법률사무소의 AI 상담 어시스턴트입니다. 법률·심리·경영 상담 정보를 수집하고 전문가에게 연결합니다. 항상 한국어로 응답. 마크다운 형식 사용.',
                    messages: messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
                }),
            });

            if (!resp.ok || !resp.body) {
                throw new Error(`Claude stream error: ${resp.status}`);
            }

            // Claude SSE → 클라이언트 SSE 중계
            const readable = new ReadableStream({
                async start(controller) {
                    const reader = resp.body!.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';

                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            buffer += decoder.decode(value, { stream: true });
                            const lines = buffer.split('\n');
                            buffer = lines.pop() || '';

                            for (const line of lines) {
                                if (!line.startsWith('data: ')) continue;
                                const data = line.slice(6).trim();
                                if (data === '[DONE]') continue;

                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                                    }
                                } catch { /* skip unparseable lines */ }
                            }
                        }
                    } catch (err) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
                    } finally {
                        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                        controller.close();
                    }
                },
            });

            return new Response(readable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        } catch (err) {
            console.error('[chat-stream] AI 오류, Mock 폴백:', err);
        }
    }

    // Mock Streaming — 문자 단위로 50ms 간격 전송
    const mockText = getMockResponse(messages, consultType);
    const readable = new ReadableStream({
        async start(controller) {
            for (let i = 0; i < mockText.length; i++) {
                const chunk = mockText[i];
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                await new Promise(r => setTimeout(r, 30));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
        },
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
