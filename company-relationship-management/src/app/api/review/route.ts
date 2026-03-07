import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { callClaude, parseAIJson, hasAIKey, mockDelay } from '@/lib/ai';
import { buildRAGContext } from '@/lib/rag/vectorSearch';

interface ReviewIssue {
    clauseTitle: string;
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    original: string;
    problem: string;
    suggestion: string;
    lawRef: string;
}

interface ReviewResult {
    issues: ReviewIssue[];
    summary: string;
    overallRisk: 'HIGH' | 'MEDIUM' | 'LOW';
}

// B4: 비교 분석 결과
interface CompareResult {
    diffs: {
        clause: string;
        changeType: 'added' | 'removed' | 'modified';
        risk: 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';
        original: string;
        modified: string;
        suggestion: string;
    }[];
    summary: string;
    overallImprovement: boolean;
}

function mockAnalysis(): ReviewResult {
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

function mockCompare(): CompareResult {
    return {
        summary: '수정본에서 2건의 리스크가 개선되었으나, 1건의 새로운 리스크가 발견되었습니다.',
        overallImprovement: true,
        diffs: [
            { clause: '제8조 위약금', changeType: 'modified', risk: 'OK', original: '가맹금의 200%를 위약금으로', modified: '실제 손해액 범위 내에서 위약금을', suggestion: '적절한 수정입니다.' },
            { clause: '제20조 경업금지', changeType: 'added', risk: 'MEDIUM', original: '', modified: '계약 종료 후 3년간 동종 업종 금지', suggestion: '경업금지 기간이 과도할 수 있습니다. 1~2년으로 축소 검토.' },
        ],
    };
}

export async function POST(req: NextRequest) {
    const auth = requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await req.json();
        const { text, textA, textB, mode = 'single' } = body;

        // B4: 비교 분석 모드
        if (mode === 'compare') {
            if (!textA || !textB) return NextResponse.json({ error: '원본(textA)과 수정본(textB) 모두 필요합니다.' }, { status: 400 });

            if (hasAIKey) {
                try {
                    const ragCtx = buildRAGContext(textA.slice(0, 500) + ' ' + textB.slice(0, 500));
                    const result = await callClaude({
                        system: `한국 가맹사업법 전문 계약서 비교 분석 AI입니다.
두 버전의 계약서를 비교하여 변경점과 리스크를 분석합니다.${ragCtx}
반드시 JSON만 반환: {"summary":"","overallImprovement":true/false,"diffs":[{"clause":"","changeType":"added|removed|modified","risk":"HIGH|MEDIUM|LOW|OK","original":"","modified":"","suggestion":""}]}`,
                        messages: [{
                            role: 'user',
                            content: `[원본 계약서]\n${textA.slice(0, 6000)}\n\n[수정본 계약서]\n${textB.slice(0, 6000)}`,
                        }],
                        maxTokens: 4096,
                    });
                    const parsed = parseAIJson<CompareResult>(result.text, mockCompare());
                    return NextResponse.json({ result: parsed, mock: false, mode: 'compare' });
                } catch (err) {
                    console.error('[review API] 비교 분석 AI 오류:', err);
                }
            }
            await mockDelay(1500);
            return NextResponse.json({ result: mockCompare(), mock: true, mode: 'compare' });
        }

        // 단독 분석 모드
        if (!text || text.trim().length < 10) return NextResponse.json({ error: '내용이 너무 짧습니다.' }, { status: 400 });

        if (hasAIKey) {
            try {
                const ragCtx = buildRAGContext(text.slice(0, 500));
                const result = await callClaude({
                    system: `한국 가맹사업법 전문 계약서 검토 AI입니다. 반드시 JSON만 반환: {"overallRisk":"HIGH|MEDIUM|LOW","summary":"요약","issues":[{"clauseTitle":"","level":"HIGH","original":"","problem":"","suggestion":"","lawRef":""}]}${ragCtx}`,
                    messages: [{ role: 'user', content: `계약서 검토:\n\n${text.slice(0, 8000)}` }],
                    maxTokens: 4096,
                });
                const parsed = parseAIJson<ReviewResult>(result.text, mockAnalysis());
                return NextResponse.json({ result: parsed, mock: false });
            } catch (err) {
                console.error('[review API] AI 오류, Mock 폴백:', err);
            }
        }

        await mockDelay(1500);
        return NextResponse.json({ result: mockAnalysis(), mock: true });
    } catch (err) {
        console.error('[review API] 오류:', err);
        return NextResponse.json({ error: '분석 중 오류' }, { status: 500 });
    }
}
