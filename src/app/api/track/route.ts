import { requireSessionFromCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { LeadScoringService } from '@/lib/leadScoring';

// 1x1 투명 GIF (트래킹 픽셀)
const TRANSPARENT_GIF = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

// ── GET /api/track ──────────────────────────────────────
// ?lid=lead_001&type=open          → 트래킹 픽셀 (1x1 GIF)
// ?lid=lead_001&type=click&url=... → 클릭 리다이렉트
export async function GET(req: NextRequest) {

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('lid');
    const type = searchParams.get('type') as 'open' | 'click';
    const redirectUrl = searchParams.get('url');
    const now = new Date().toISOString();

    if (!leadId || !type) {
        return new NextResponse(TRANSPARENT_GIF, {
            status: 200,
            headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-cache, no-store' },
        });
    }

    try {
        if (type === 'open') {
            // 이메일 열람 기록
            const scoreData = LeadScoringService.recordEvent({
                type: 'email_open',
                at: now,
                leadId,
                userAgent: req.headers.get('user-agent') || undefined,
            });

            console.log(`📧 [TRACK] 이메일 열람 | lead=${leadId} | opens=${scoreData.openCount} | score=${scoreData.score}`);

            // 첫 열람이면 푸시 알림 트리거
            if (scoreData.openCount === 1) {
                try {
                    const baseUrl = new URL(req.url).origin;
                    await fetch(`${baseUrl}/api/push/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            leadId,
                            title: '🔥 이메일 열람 감지!',
                            body: `${leadId} 담당자가 이메일을 열었습니다. 지금 전화하세요!`,
                            url: `/sales/call`,
                        }),
                    });
                } catch (e) {
                    console.error('[TRACK] 푸시 발송 실패:', e);
                }
            }

            // 1x1 투명 GIF 반환
            return new NextResponse(TRANSPARENT_GIF, {
                status: 200,
                headers: {
                    'Content-Type': 'image/gif',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });
        }

        if (type === 'click') {
            // CTA 클릭 기록
            const scoreData = LeadScoringService.recordEvent({
                type: 'cta_click',
                at: now,
                leadId,
                url: redirectUrl || undefined,
            });

            console.log(`🖱️ [TRACK] CTA 클릭 | lead=${leadId} | clicks=${scoreData.clickCount} | score=${scoreData.score}`);

            // 리다이렉트
            const target = redirectUrl || '/';
            return NextResponse.redirect(target, { status: 302 });
        }
    } catch (err) {
        console.error('[TRACK] 추적 오류:', err);
    }

    // 폴백: 트래킹 픽셀
    return new NextResponse(TRANSPARENT_GIF, {
        status: 200,
        headers: { 'Content-Type': 'image/gif' },
    });
}
