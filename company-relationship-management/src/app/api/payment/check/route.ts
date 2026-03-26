import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';

// ── 결제 확인 API ─────────────────────────────────────────────
// 실제 PG사 연동 전까지 Mock 데이터 사용
// 향후 카카오페이/토스페이먼츠 등 연동 시 이 파일만 수정

interface PaymentRecord {
    companyId: string;
    amount: number;
    plan: 'starter' | 'standard' | 'premium';
    paidAt: string;
    method: string;
    txId: string;
}

// Mock 결제 내역 (실제로는 PG사 API 호출)
const MOCK_PAYMENTS: PaymentRecord[] = [
    {
        companyId: 'c5',
        amount: 330000,
        plan: 'standard',
        paidAt: '2026-02-25T14:30:00+09:00',
        method: '카카오페이',
        txId: 'TX-202602251430-001',
    },
    {
        companyId: 'c7',
        amount: 330000,
        plan: 'standard',
        paidAt: '2026-02-22T10:00:00+09:00',
        method: '계좌이체',
        txId: 'TX-202602221000-002',
    },
];

export async function POST(req: NextRequest) {
    // 인증 검증
    const auth = await requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // Rate Limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const { checkRateLimit } = await import('@/lib/rateLimit');
    const rateLimit = await checkRateLimit(`payment_check_${ip}_${auth.role}`, 10, 60);
    if (!rateLimit.success) {
        return NextResponse.json({ error: '요청 한도를 초과했습니다.' }, { status: 429 });
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: '잘못된 JSON 형식입니다.' }, { status: 400 });
    }

    try {
        const { companyId } = body;
        if (!companyId || typeof companyId !== 'string') {
            return NextResponse.json({ error: '유효한 companyId(string)가 필수입니다.' }, { status: 400 });
        }

        // SEC-FIX: 완벽한 화이트리스트 기반 IDOR 통제
        // 결제 정보는 최고 관리자, 영업팀, 그리고 본인 고객사 계정만 조회 가능
        const allowedRoles = ['super_admin', 'admin', 'sales'];
        if (auth.role === 'client_hr') {
            if (auth.companyId !== companyId) {
                return NextResponse.json({ error: '자사의 결제 내역만 열람할 수 있습니다.' }, { status: 403 });
            }
        } else if (!allowedRoles.includes(auth.role)) {
            return NextResponse.json({ error: '결제 정보 열람 권한이 없습니다.' }, { status: 403 });
        }

        // 실제 PG사 연동 시 이 부분을 API 호출로 교체
        // 예: const result = await kakaopay.getPaymentByOrderId(companyId);
        await new Promise(r => setTimeout(r, 800)); // 조회 시뮬레이션

        const payment = MOCK_PAYMENTS.find(p => p.companyId === companyId);

        if (payment) {
            return NextResponse.json({
                found: true,
                payment: {
                    amount: payment.amount,
                    plan: payment.plan,
                    paidAt: payment.paidAt,
                    method: payment.method,
                    txId: payment.txId,
                },
            });
        }

        return NextResponse.json({
            found: false,
            message: '결제 내역이 없습니다. 고객에게 결제를 요청해주세요.',
        });
    } catch (err) {
        console.error('[payment/check] 오류:', err);
        return NextResponse.json({ error: '결제 확인 중 오류' }, { status: 500 });
    }
}
