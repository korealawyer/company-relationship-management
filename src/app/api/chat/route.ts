import { NextRequest, NextResponse } from 'next/server';
import { IBS_FULL_CHAT_PROMPT, IBS_SYSTEM_PROMPT } from '@/lib/prompts/chat';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

// ── 모의 응답 (API 키 없을 때) — 프롬프트 철학 반영 ──────────────
function generateMockResponse(messages: ChatMessage[], consultType: string): string {
    const last = messages[messages.length - 1]?.content || '';
    const lowerLast = last.toLowerCase();

    // 감정 표현 감지
    if (lowerLast.includes('억울') || lowerLast.includes('화나') || lowerLast.includes('너무')) {
        return '충분히 억울하실 수 있습니다. 상황을 더 자세히 말씀해 주시면 법적으로 취할 수 있는 조치를 안내드리겠습니다. 어떤 일이 있으셨나요?';
    }

    if (consultType === 'legal' || lowerLast.includes('법률') || lowerLast.includes('계약') || lowerLast.includes('가맹')) {
        const responses = [
            '네, 법률 문제라면 구체적인 상황을 알려주시면 바로 답변드릴 수 있습니다.\n\n다음 중 어떤 상황이신가요?\n\n1. 가맹계약서 검토 또는 작성\n2. 개인정보 처리방침 관련\n3. 가맹점과의 분쟁\n4. 노동·인사 문제\n5. 형사·민사 소송',
            '상황을 파악했습니다. 관련 서류를 준비해 주시면 담당 변호사가 48시간 내에 검토 후 정확한 답변을 드립니다.\n\n📋 일반적으로 필요한 서류\n- 계약서 원본\n- 분쟁 경위서\n- 관련 증거 (문자, 이메일 등)\n\n접수 후 담당 변호사가 직접 연락드리겠습니다.',
        ];
        return responses[Math.min(messages.filter(m => m.role === 'assistant').length, responses.length - 1)];
    }
    if (consultType === 'eap') {
        return '힘드신 상황이 느껴집니다. 저희 EAP 프로그램을 통해 전문 심리 상담사와 연결해 드릴 수 있습니다.\n\n먼저 간단히 현재 상태를 파악하겠습니다.\n\n**최근 2주간 일상적인 활동에서 즐거움을 느끼는 경우가:**\n① 거의 없다 ② 가끔 있다 ③ 자주 있다';
    }

    return '안녕하세요! IBS 법무 어시스턴트입니다.\n\n어떤 법률 문제든 바로 답변드립니다.\n\n⚖️ 법률 — 가맹계약, 개인정보, 노동, 형사\n🧠 심리/EAP — 스트레스·감정 관리\n💼 경영 자문 — 공정거래, 노무\n\n어떤 도움이 필요하신가요?';
}

// ── POST /api/chat — 인증 없음 (외부 방문자 포함) ────────────────
// 주의: 배포 전 Rate Limiting 미들웨어 추가 권장
export async function POST(req: NextRequest) {
    try {
        const { messages, consultType = 'general', isPublic = false } = await req.json();

        // 컨텍스트에 맞는 system prompt 선택
        const systemPrompt = isPublic ? IBS_SYSTEM_PROMPT : IBS_FULL_CHAT_PROMPT;

        let aiResponse: string;

        if (ANTHROPIC_API_KEY) {
            const resp = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                },
                body: JSON.stringify({
                    model: 'claude-opus-4-5',
                    max_tokens: 2048,
                    system: systemPrompt,
                    messages: messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
                }),
            });

            if (!resp.ok) {
                const errText = await resp.text();
                console.error('[chat API] Anthropic 오류:', errText);
                throw new Error(`Anthropic API 오류: ${resp.status}`);
            }

            const data = await resp.json();
            aiResponse = data.content?.[0]?.text || '죄송합니다. 응답 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주시거나 전화(02-598-8518)로 문의 주세요.';
        } else {
            // 개발 환경 mock
            await new Promise(r => setTimeout(r, 800));
            aiResponse = generateMockResponse(messages, consultType);
        }

        return NextResponse.json({ message: aiResponse, mock: !ANTHROPIC_API_KEY });
    } catch (err) {
        console.error('[chat API] 오류:', err);
        const message = err instanceof Error ? err.message : '서버 오류';
        return NextResponse.json(
            { error: message, fallback: '현재 AI 서버에 문제가 있습니다. 02-598-8518로 직접 문의해 주세요.' },
            { status: 500 }
        );
    }
}
