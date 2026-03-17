import { NextRequest, NextResponse } from 'next/server';
import { PushService } from '@/lib/leadScoring';

// ── POST /api/push/subscribe ────────────────────────────
// 클라이언트 Push 구독 정보 저장
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { endpoint, keys, userId } = body;

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json({ error: '유효하지 않은 구독 정보' }, { status: 400 });
        }

        const sub = PushService.subscribe({ endpoint, keys, userId });
        console.log(`🔔 [PUSH] 구독 등록 | id=${sub.id} | user=${userId || 'unknown'}`);

        return NextResponse.json({ ok: true, subscriptionId: sub.id });
    } catch (err) {
        console.error('[PUSH] 구독 오류:', err);
        return NextResponse.json({ error: '구독 처리 실패' }, { status: 500 });
    }
}

// ── DELETE /api/push/subscribe ──────────────────────────
export async function DELETE(req: NextRequest) {
    try {
        const { endpoint } = await req.json();
        PushService.unsubscribe(endpoint);
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: '구독 해제 실패' }, { status: 500 });
    }
}
