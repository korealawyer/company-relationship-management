import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

function generateMockResponse(messages: ChatMessage[], consultType: string): string {
    const last = messages[messages.length - 1]?.content || '';
    if (consultType === 'legal' || last.includes('법률') || last.includes('계약')) {
        const responses = [
            '네, 어떤 법률 문제가 있으신가요? 다음 중 선택해 주세요:\n\n1. 가맹계약 분쟁\n2. 개인정보 관련\n3. 노동·노무 문제\n4. 형사 사건\n5. 기타',
            '상황을 파악했습니다. 관련 서류를 준비해 주시면 변호사가 직접 검토하겠습니다.\n\n📋 **준비 서류**\n- 계약서 원본\n- 분쟁 발생 경위서\n- 관련 증거 자료\n\n접수번호 **IBS-2026-0301-001**이 발급되었습니다. 48시간 내 담당 변호사가 답변드립니다.',
        ];
        return responses[Math.min(messages.filter(m => m.role === 'assistant').length, responses.length - 1)];
    }
    if (consultType === 'eap') {
        return '마음이 힘드시겠어요. 간단한 질문 3가지로 현재 상태를 파악해 드리겠습니다.\n\n**최근 2주간 일상적인 활동에서 즐거움을 느끼는 경우가:**\n① 거의 없다 ② 가끔 있다 ③ 자주 있다';
    }
    return '안녕하세요! IBS 로펌 AI 상담 어시스턴트입니다. 어떤 도움이 필요하신가요?\n\n⚖️ **법률 상담** — 가맹계약, 노동, 개인정보, 형사\n🧠 **심리/EAP** — 스트레스·감정 관리\n💼 **경영 자문** — 노무, 공정거래\n\n원하시는 분야를 말씀해 주세요.';
}

export async function POST(req: NextRequest) {
    // 인증 검증 (관리자/내부직원/고객 HR 모두 허용)
    const auth = requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { messages, consultType = 'general' } = await req.json();
        let aiResponse: string;
        if (ANTHROPIC_API_KEY) {
            const resp = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-5', max_tokens: 1024,
                    system: '당신은 IBS 법률사무소의 AI 상담 어시스턴트입니다. 법률·심리·경영 상담 정보를 수집하고 전문가에게 연결합니다. 항상 한국어로 응답하세요.',
                    messages: messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
                }),
            });
            const data = await resp.json();
            aiResponse = data.content?.[0]?.text || '죄송합니다. 응답 생성 중 문제가 발생했습니다.';
        } else {
            await new Promise(r => setTimeout(r, 800));
            aiResponse = generateMockResponse(messages, consultType);
        }
        return NextResponse.json({ message: aiResponse, mock: !ANTHROPIC_API_KEY });
    } catch (err) {
        console.error('[chat API] 오류:', err);
        const message = err instanceof Error ? err.message : '서버 오류';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
