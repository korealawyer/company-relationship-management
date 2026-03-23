import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';

// 데모 분석 결과 (실제 배포 시: OpenAI API + Puppeteer로 URL 실제 분석)
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

// URL 기반 최소 리스크 추정 (데모 수준)
function estimateRiskLevel(url: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (!url) return 'HIGH';
    // HTTPS 미사용 시 HIGH
    if (!url.startsWith('https://')) return 'HIGH';
    // 짧은 URL은 정책 페이지를 지정하지 않은 가능성
    if (url.length < 20) return 'MEDIUM';
    // https로 시작하고 30자 이상이면 LOW가 가능
    if (url.length >= 30) return 'LOW';
    return 'MEDIUM'; // 기본: 데모 모드에서는 MEDIUM
}

export async function POST(request: NextRequest) {
    // 인증 검증
    const auth = await requireSessionFromCookie(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // ── 입력값 파싱 (try-catch로 400 에러 방지) ──
    let body: { url?: string; companyId?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: '잘못된 요청 형식입니다. JSON Content-Type을 확인하세요.' },
            { status: 400 }
        );
    }

    const { url, companyId } = body;

    // ── 필수 파라미터 검증 ──
    if (!url && !companyId) {
        return NextResponse.json(
            { success: false, error: 'url 또는 companyId 중 하나는 필수입니다.' },
            { status: 400 }
        );
    }

    // ── URL 형식 기본 검증 ──
    if (url) {
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { success: false, error: '유효한 URL 형식이 아닙니다. (예: https://example.com/privacy)' },
                { status: 422 }
            );
        }
    }

    // ── 분석 시뮬레이션 (실제 배포 시 OpenAI + Puppeteer로 교체) ──
    // ⚠️ 데모 모드: 아래 결과는 URL을 실제로 분석하지 않음
    await new Promise((resolve) => setTimeout(resolve, 500));

    const riskLevel = estimateRiskLevel(url ?? '');

    return NextResponse.json({
        success: true,
        isDemoMode: true, // 클라이언트가 데모임을 인지할 수 있도록 플래그 명시
        message: 'AI 분석 완료 (데모 모드 — 실제 URL 분석은 계약 후 제공)',
        analysisId: `demo-${Date.now()}`,
        analyzedUrl: url ?? null,
        issueCount: DEMO_ISSUES.length,
        issues: DEMO_ISSUES,
        riskLevel,
        completedAt: new Date().toISOString(),
    });
}
