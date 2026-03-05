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
    const auth = requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { companyId } = await req.json();
        if (!companyId) {
            return NextResponse.json({ error: 'companyId 필수' }, { status: 400 });
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
