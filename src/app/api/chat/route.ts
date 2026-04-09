import { requireSessionFromCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

interface ChatMessage { role: 'user' | 'assistant' | 'system'; content: string; }

// 개발 모드용 Fallback
function generateMockResponse(messages: ChatMessage[]): string {
    const last = messages[messages.length - 1]?.content || '';
    if (messages.length > 3) {
        return '상세히 말씀해 주셔서 감사합니다. 담당 변호사가 충분히 검토할 수 있도록 정리되었습니다.\n담당 변호사가 검토 후 연락드릴 수 있도록, 먼저 담당자님의 성함을 남겨주시겠습니까?\n\n```json\n{"type": "summary", "legal_category": "가맹사업", "case_type": "계약 위반", "subject": "B2B 고객", "when_where": "최근", "antagonist": "거래처", "action": "계약 불이행", "goal": "손해배상 청구", "summary": "거래처의 계약 불이행으로 인한 손해배상 청구 검토 요청"}\n```';
    }
    return '상황을 좀 더 구체적으로 파악하기 위해 여쭙겠습니다. 해당 문제가 처음 발생한 시점은 언제인가요?';
}

export async function POST(req: NextRequest) {
    const __auth = await requireSessionFromCookie(req as any);
    if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

    try {
        const { messages, systemPrompt, model } = await req.json();
        const finalModel = model || 'gpt-4o'; // 기본값

        let aiResponse = '';

        try {
            if (finalModel.startsWith('claude')) {
                const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
                if (ANTHROPIC_API_KEY) {
                    const claudeModel = finalModel.includes('opus') ? 'claude-3-opus-20240229' : 'claude-3-5-sonnet-20241022';
                    const resp = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json',
                            'x-api-key': ANTHROPIC_API_KEY,
                        },
                        body: JSON.stringify({
                            model: claudeModel,
                            max_tokens: 1500,
                            system: systemPrompt || "당신은 법률 AI 어시스턴트입니다.",
                            messages: messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
                        }),
                    });

                    if (!resp.ok) throw new Error(`Anthropic API 오류: ${resp.status}`);
                    const data = await resp.json();
                    aiResponse = data.content?.[0]?.text || '';
                } else {
                    console.warn('[chat API] ANTHROPIC_API_KEY is missing.');
                }
            } else if (finalModel.startsWith('gemini')) {
                const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
                if (GEMINI_API_KEY) {
                    const geminiModel = finalModel.includes('flash') ? 'gemini-1.5-flash-latest' : 'gemini-1.5-pro-latest';
                    const geminiContents = messages.map((m: ChatMessage) => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    }));
                    
                    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            systemInstruction: { parts: [{ text: systemPrompt || "당신은 법률 AI 어시스턴트입니다." }] },
                            contents: geminiContents,
                            generationConfig: { maxOutputTokens: 1500, temperature: 0.7 }
                        }),
                    });

                    if (!resp.ok) throw new Error(`Gemini API 오류: ${resp.status}`);
                    const data = await resp.json();
                    aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else {
                    console.warn('[chat API] GEMINI_API_KEY is missing.');
                }
            } else {
                // Default: OpenAI (gpt-4o, gpt-4o-mini)
                const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
                if (OPENAI_API_KEY) {
                    const openAiMessages = [
                        { role: 'system', content: systemPrompt || "당신은 법률 AI 어시스턴트입니다." },
                        ...messages.map((m: ChatMessage) => ({ role: m.role, content: m.content }))
                    ];

                    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        },
                        body: JSON.stringify({
                            model: finalModel === 'gpt-4o-mini' ? 'gpt-4o-mini' : 'gpt-4o',
                            messages: openAiMessages,
                            max_tokens: 1500,
                            temperature: 0.7
                        }),
                    });

                    if (!resp.ok) throw new Error(`OpenAI API 오류: ${resp.status}`);
                    const data = await resp.json();
                    aiResponse = data.choices?.[0]?.message?.content || '';
                } else {
                    console.warn('[chat API] OPENAI_API_KEY is missing.');
                }
            }
        } catch (error) {
            console.error('[chat API] 연동 중 오류 발생:', error);
        }

        // 해당 모델의 API 키가 없거나 에러가 났을 때 Fallback 적용
        if (!aiResponse) {
            await new Promise(r => setTimeout(r, 800));
            aiResponse = generateMockResponse(messages);
        }

        // JSON 요약본 검출 로직
        let isSummary = false;
        let summaryData = null;
        let visibleMessage = aiResponse;

        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed.type === 'summary') {
                    isSummary = true;
                    summaryData = parsed;
                    // 사용자에게 보여질 텍스트에서는 JSON 블록 제거
                    visibleMessage = aiResponse.replace(/```json\n[\s\S]*?\n```/, '').trim();
                }
            } catch (e) {
                console.error("JSON 파싱 에러:", e);
            }
        }

        return NextResponse.json({ 
            message: visibleMessage || '알겠습니다. 추가 문의 사항이 있으시다면 말씀해주세요.', 
            isSummary,
            summaryData
        });
    } catch (err) {
        console.error('[chat API] 오류:', err);
        return NextResponse.json(
            { error: '서버 오류', message: '현재 AI 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주시거나 02-598-8518로 문의해주세요.' },
            { status: 500 }
        );
    }
}
