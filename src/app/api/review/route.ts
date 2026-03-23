import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

interface ReviewResult {
    issues: { clauseTitle: string; level: 'HIGH' | 'MEDIUM' | 'LOW'; original: string; problem: string; suggestion: string; lawRef: string; }[];
    summary: string;
    overallRisk: 'HIGH' | 'MEDIUM' | 'LOW';
}

function mockAnalysis(text: string): ReviewResult {
    return {
        overallRisk: 'HIGH',
        summary: '계약서 검토 결과 3건의 리스크 조항이 발견되었습니다. 위약금 조항과 계약 해지 조건이 가맹사업법 기준을 위반할 소지가 있습니다.',
        issues: [
            { clauseTitle: '제8조 위약금', level: 'HIGH', original: '가맹점사업자가 계약을 중도 해지할 경우 가맹금의 200%를 위약금으로 지급한다.', problem: '가맹사업법 제14조 위반 소지. 위약금이 실제 손해를 현저히 초과합니다.', suggestion: '위약금은 실제 손해액 범위 내로 제한해야 합니다.', lawRef: '가맹사업법 §14, 민법 §398' },
            { clauseTitle: '제12조 계약 해지', level: 'HIGH', original: '가맹본부는 서면 통보 후 즉시 계약을 해지할 수 있다.', problem: '가맹사업법 제14조는 최소 2개월의 시정 기간 부여를 의무화합니다.', suggestion: '"서면 통보 후 2개월간의 시정 기간을 부여한 후"로 변경 필요.', lawRef: '가맹사업법 §14①' },
            { clauseTitle: '제15조 영업지역', level: 'MEDIUM', original: '영업구역은 상호 협의에 따라 변경될 수 있다.', problem: '영업지역 변경 관련 구체적 조건이 명시되지 않아 분쟁 소지가 있습니다.', suggestion: '"영업지역 변경 시 가맹점사업자의 서면 동의가 필요하다"는 내용 명시 권고.', lawRef: '가맹사업법 §12③' },
        ],
    };
}

export async function POST(req: NextRequest) {
    // 인증 검증 (변호사/관리자만 접근 허용)
    const auth = await requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { text } = await req.json();
        if (!text || text.trim().length < 10) return NextResponse.json({ error: '내용이 너무 짧습니다.' }, { status: 400 });
        let result: ReviewResult;
        if (ANTHROPIC_API_KEY) {
            const resp = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-5', max_tokens: 4096,
                    system: '한국 가맹사업법 전문 계약서 검토 AI입니다. 반드시 JSON만 반환: {"overallRisk":"HIGH|MEDIUM|LOW","summary":"요약","issues":[{"clauseTitle":"","level":"HIGH","original":"","problem":"","suggestion":"","lawRef":""}]}',
                    messages: [{ role: 'user', content: `계약서 검토:\n\n${text.slice(0, 8000)}` }],
                }),
            });
            const data = await resp.json();
            result = JSON.parse(data.content?.[0]?.text?.match(/\{[\s\S]*\}/)?.[0] || '{}');
        } else {
            await new Promise(r => setTimeout(r, 1500));
            result = mockAnalysis(text);
        }
        return NextResponse.json({ result, mock: !ANTHROPIC_API_KEY });
    } catch (err) {
        console.error('[review API] 오류:', err);
        return NextResponse.json({ error: '분석 중 오류' }, { status: 500 });
    }
}
