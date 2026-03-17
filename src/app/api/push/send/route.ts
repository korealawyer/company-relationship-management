import { NextRequest, NextResponse } from 'next/server';
import { PushService } from '@/lib/leadScoring';

// ── POST /api/push/send ─────────────────────────────────
// 트래킹 API에서 호출 → 모든 구독자에게 푸시 발송
export async function POST(req: NextRequest) {
    try {
        const { leadId, title, body, url } = await req.json();

        const subs = PushService.getAll();
        console.log(`🔔 [PUSH] 발송 요청 | lead=${leadId} | 구독자=${subs.length}명`);
        console.log(`   제목: ${title}`);
        console.log(`   내용: ${body}`);

        if (subs.length === 0) {
            console.log('   ⚠️ 등록된 푸시 구독이 없습니다. (PWA 설치 후 알림 허용 필요)');
            return NextResponse.json({
                ok: true,
                delivered: 0,
                message: '등록된 구독이 없습니다. PWA를 설치하고 알림을 허용해주세요.',
            });
        }

        // web-push 라이브러리가 있으면 실제 발송, 없으면 시뮬레이션
        let delivered = 0;
        try {
            // Phase 1: 시뮬레이션 (콘솔 로그)
            // Phase 2: web-push 실제 발송으로 교체
            for (const sub of subs) {
                console.log(`   📱 → ${sub.endpoint.slice(0, 50)}... [시뮬]`);
                delivered++;
            }
        } catch (e) {
            console.error('[PUSH] 발송 오류:', e);
        }

        return NextResponse.json({ ok: true, delivered, total: subs.length });
    } catch (err) {
        console.error('[PUSH] 발송 처리 오류:', err);
        return NextResponse.json({ error: '푸시 발송 실패' }, { status: 500 });
    }
}
