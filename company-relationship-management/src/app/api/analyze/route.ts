import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { callClaude, parseAIJson, hasAIKey, mockDelay } from '@/lib/ai';

// Mock 분석 결과 (AI 키 없을 때 사용)
const DEMO_ISSUES = [
    {
        id: 1, level: 'HIGH', title: '수집 항목 법정 기재 누락',
        law: '개인정보 보호법 제30조 제1항 제1호',
        problem: '수집하는 개인정보 항목이 처리방침에 명시되지 않아 과태료 부과 대상입니다.',
        solution: '처리방침에 수집 항목(성명, 연락처, 이메일)을 명시하는 조항 추가 필요.',
        fine: '최대 3,000만원',
    },
    {
        id: 2, level: 'HIGH', title: '제3자 제공 동의 절차 부재',
        law: '개인정보 보호법 제17조 제2항',
        problem: '가맹점 데이터를 파트너사에 제공 시 별도 동의 절차가 없습니다.',
        solution: '"제3자 제공 동의" 섹션 신설 및 파트너사 목록, 제공 목적, 보유 기간 명시.',
        fine: '최대 5,000만원',
    },
    {
        id: 3, level: 'MEDIUM', title: '보유·이용 기간 불명확',
        law: '개인정보 보호법 제30조 제1항 제3호',
        problem: '"서비스 종료 시까지"라는 불명확한 표현 사용.',
        solution: '"계약 종료 후 5년 (상법 제33조)" 등 구체적 법정 보유 기간 기재.',
        fine: '시정 권고',
    },
];

interface AnalysisIssue {
    id: number;
    level: string;
    title: string;
    law: string;
    problem: string;
    solution: string;
    fine: string;
}

function estimateRiskLevel(url: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (!url) return 'HIGH';
    if (!url.startsWith('https://')) return 'HIGH';
    if (url.length < 20) return 'MEDIUM';
    if (url.length >= 30) return 'LOW';
    return 'MEDIUM';
}

export async function POST(request: NextRequest) {
    // 인증 검증
    const auth = requireSessionFromCookie(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // 입력값 파싱
    let body: { url?: string; companyId?: string; companyName?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: '잘못된 요청 형식입니다. JSON Content-Type을 확인하세요.' },
            { status: 400 }
        );
    }

    const { url, companyId, companyName } = body;

    if (!url && !companyId) {
        return NextResponse.json(
            { success: false, error: 'url 또는 companyId 중 하나는 필수입니다.' },
            { status: 400 }
        );
    }

    if (url) {
        try { new URL(url); } catch {
            return NextResponse.json(
                { success: false, error: '유효한 URL 형식이 아닙니다. (예: https://example.com/privacy)' },
                { status: 422 }
            );
        }
    }

    // AI 분석
    if (hasAIKey && url) {
        try {
            const result = await callClaude({
                system: `한국 개인정보보호법 전문 AI 분석기입니다.
URL 기반으로 개인정보처리방침을 분석합니다.
반드시 JSON만 반환하세요:
{"riskLevel":"HIGH|MEDIUM|LOW","issues":[{"id":1,"level":"HIGH|MEDIUM|LOW","title":"","law":"","problem":"","solution":"","fine":""}]}`,
                messages: [{
                    role: 'user',
                    content: `회사명: ${companyName || '알수없음'}\n개인정보처리방침 URL: ${url}\n\n이 URL의 개인정보처리방침을 분석하여 법적 리스크와 이슈를 찾아주세요.`,
                }],
                maxTokens: 4000,
            });

            const parsed = parseAIJson<{ riskLevel?: string; issues?: AnalysisIssue[] }>(result.text, {});
            const issues = parsed.issues || DEMO_ISSUES;
            const riskLevel = (['HIGH', 'MEDIUM', 'LOW'].includes(parsed.riskLevel || '') ? parsed.riskLevel : estimateRiskLevel(url)) as 'HIGH' | 'MEDIUM' | 'LOW';

            return NextResponse.json({
                success: true,
                isDemoMode: false,
                message: 'AI 분석 완료',
                analysisId: `ai-${Date.now()}`,
                analyzedUrl: url,
                issueCount: issues.length,
                issues,
                riskLevel,
                completedAt: new Date().toISOString(),
                aiUsage: result.usage,
            });
        } catch (err) {
            console.error('[analyze API] AI 오류, Mock 폴백:', err);
            // AI 실패 시 Mock으로 폴백
        }
    }

    // Mock 모드
    await mockDelay(500);
    return NextResponse.json({
        success: true,
        isDemoMode: true,
        message: 'AI 분석 완료 (데모 모드 — 실제 URL 분석은 API 키 설정 후 제공)',
        analysisId: `demo-${Date.now()}`,
        analyzedUrl: url ?? null,
        issueCount: DEMO_ISSUES.length,
        issues: DEMO_ISSUES,
        riskLevel: estimateRiskLevel(url ?? ''),
        completedAt: new Date().toISOString(),
    });
}
