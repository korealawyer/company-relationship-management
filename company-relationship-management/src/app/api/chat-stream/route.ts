import { NextRequest } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { hasAIKey } from '@/lib/ai';
import { checkRateLimit } from '@/lib/rateLimit';

// A5: Chat Streaming (SSE) 엔드포인트
// QA-FIX #6: 멀티 프로바이더 지원 — ai.ts의 통합 키 체크 사용
// hasAIKey는 Claude/OpenAI/Gemini 중 어느 하나라도 설정되면 true
const AI_PROVIDER = (process.env.AI_PROVIDER || 'claude') as 'claude' | 'openai' | 'gemini';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
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
    const auth = await requireSessionFromCookie(req);
    if (!auth.ok) {
        return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: { 'content-type': 'application/json' } });
    }

    // SEC-FIX: AI 자원 고갈(DoS) 보호를 위한 Rate Limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const rateLimit = await checkRateLimit(`chat_stream_${ip}_${auth.role}`, 5, 60); // 1분에 5회 제한
    if (!rateLimit.success) {
        return new Response(JSON.stringify({ error: 'AI 채팅 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.' }), { status: 429, headers: { 'content-type': 'application/json' } });
    }

    // SEC-FIX: 페이로드 오염 방어 (Malformed JSON, 비정상 Array 주입 등)
    let parsedBody;
    try {
        parsedBody = await req.json();
    } catch (err) {
        return new Response(JSON.stringify({ error: '요청 본문이 올바른 JSON 형식이 아닙니다.' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const { messages, consultType = 'general' } = parsedBody;

    if (!Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ error: '유효한 messages 배열이 필요합니다.' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
    
    // 최대 메시지 갯수 및 내용 길이 제한 (악의적 payload 방어)
    if (messages.length > 50) {
        return new Response(JSON.stringify({ error: '메시지 히스토리가 너무 깁니다.' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
    const safeMessages: ChatMessage[] = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 2000) // 최대 길이 제한
    }));

    const encoder = new TextEncoder();

    // QA-FIX #6: hasAIKey로 통합 체크 (기존: ANTHROPIC_API_KEY만 체크)
    // 현재 SSE 스트리밍은 Claude API만 지원하므로 hasAIKey + Claude 프로바이더 확인
    if (hasAIKey && AI_PROVIDER === 'claude' && ANTHROPIC_API_KEY) {
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
                    messages: safeMessages,
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
            console.error('[chat-stream] Claude AI 오류, Mock 폴백:', err);
        }
    } else if (hasAIKey && AI_PROVIDER === 'openai' && OPENAI_API_KEY) {
        try {
            const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: process.env.AI_MODEL || 'gpt-4o-mini',
                    stream: true,
                    messages: [
                        { role: 'system', content: '당신은 IBS 법률사무소의 AI 상담 어시스턴트입니다. 항상 한국어로 응답. 마크다운 형식 사용.' },
                        ...safeMessages
                    ],
                }),
            });

            if (!resp.ok) throw new Error(`OpenAI stream error: ${resp.status}`);

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
                                if (!line.trim() || !line.startsWith('data: ')) continue;
                                const data = line.slice(6).trim();
                                if (data === '[DONE]') continue;

                                try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices[0]?.delta?.content;
                                    if (content) {
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                                    }
                                } catch { /* skip */ }
                            }
                        }
                    } catch (err) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
                    } finally {
                        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                        controller.close();
                    }
                }
            });

            return new Response(readable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        } catch (err) {
            console.error('[chat-stream] OpenAI AI 오류, Mock 폴백:', err);
        }
    }

    // Mock Streaming — 문자 단위로 50ms 간격 전송
    const mockText = getMockResponse(safeMessages, consultType);
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
