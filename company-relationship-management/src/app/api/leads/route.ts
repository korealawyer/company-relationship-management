import { NextRequest, NextResponse } from 'next/server';
import { leadStore } from '@/lib/leadStore';
import { requireSessionFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
    // 인증 검증
    const auth = await requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'riskScore';

    let leads = leadStore.getAll();
    if (status && status !== 'all') leads = leads.filter(l => l.status === status);
    leads.sort((a, b) => {
        if (sort === 'riskScore') return b.riskScore - a.riskScore;
        if (sort === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
    });
    return NextResponse.json({ leads });
}

// QA-FIX #2: 허용 status 화이트리스트 — LeadStatus 타입과 일치시킴
// 기존: ['new','analyzing','reviewed','contacted','emailed','converted','disqualified'] → 실제 타입과 완전 불일치
const ALLOWED_STATUSES = ['pending', 'analyzed', 'sales_confirmed', 'lawyer_confirmed', 'emailed', 'in_contact', 'contracted', 'failed'];

export async function PATCH(req: NextRequest) {
    // 인증 검증
    const auth = await requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });

    const { id, status, memo } = body;
    if (!id) return NextResponse.json({ error: 'id 필수' }, { status: 400 });

    // SEC-FIX #2: 리드 존재 여부 확인 (IDOR 방지)
    const target = leadStore.getById(id);
    if (!target) return NextResponse.json({ error: '리드를 찾을 수 없습니다.' }, { status: 404 });

    // status 화이트리스트 검증
    if (status && !ALLOWED_STATUSES.includes(status)) {
        return NextResponse.json({ error: `허용되지 않은 status 값입니다: ${status}` }, { status: 422 });
    }

    leadStore.update(id, { status, ...(memo ? { lastMemo: memo } : {}) });
    return NextResponse.json({ ok: true });
}
