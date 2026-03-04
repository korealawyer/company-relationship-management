import { NextRequest, NextResponse } from 'next/server';
import { leadStore } from '@/lib/leadStore';

export async function GET(req: NextRequest) {
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

export async function PATCH(req: NextRequest) {
    const { id, status, memo } = await req.json();
    if (!id) return NextResponse.json({ error: 'id 필수' }, { status: 400 });
    leadStore.update(id, { status, ...(memo ? { lastMemo: memo } : {}) });
    return NextResponse.json({ ok: true });
}
