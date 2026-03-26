import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { callClaude, hasAIKey, mockDelay } from '@/lib/ai';
import { buildRAGContext } from '@/lib/rag/vectorSearch';
import { checkRateLimit } from '@/lib/rateLimit';

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
    const auth = await requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
        const rateLimit = await checkRateLimit(`chat_${ip}`, 20, 60);
        if (!rateLimit.success) {
            return NextResponse.json({ error: '요청 한도를 초과했습니다. 잠시 후 텍스트를 입력해주세요.' }, { status: 429 });
        }

        const { messages, consultType = 'general' } = await req.json();

        // SEC-FIX: AI 토큰 고갈 방어 (최대 50개 메시지 및 길이 잘라내기)
        if (!Array.isArray(messages)) return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
        const truncatedMessages = messages.slice(-50);

        if (hasAIKey) {
            try {
                const lastQuestion = truncatedMessages[truncatedMessages.length - 1]?.content || '';
                const ragContext = buildRAGContext(lastQuestion);
                const result = await callClaude({
                    system: `당신은 IBS 법률사무소의 AI 상담 어시스턴트입니다. 법률·심리·경영 상담 정보를 수집하고 전문가에게 연결합니다. 항상 한국어로 응답하세요. 마크다운 형식을 사용하여 깔끔하게 응답하세요.${ragContext}`,
                    messages: truncatedMessages.map((m: ChatMessage) => ({ 
                        role: m.role, 
                        content: m.content.length > 2000 ? m.content.slice(0, 2000) : m.content 
                    })),
                    maxTokens: 1024,
                });
                return NextResponse.json({ message: result.text, mock: false, usage: result.usage });
            } catch (err) {
                console.error('[chat API] AI 오류, Mock 폴백:', err);
            }
        }

        await mockDelay(800);
        return NextResponse.json({ message: generateMockResponse(truncatedMessages, consultType), mock: true });
    } catch (err) {
        console.error('[chat API] 오류:', err);
        const message = err instanceof Error ? err.message : '서버 오류';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
