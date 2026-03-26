import { requireSessionFromCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// ── [가이드북 리드 수신] POST /api/leads/guide ──────────────────
export async function POST(req: NextRequest) {
  const __auth = await requireSessionFromCookie(req as any);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

    try {
        const body = await req.json();
        const { companyName, contactName, contactEmail, contactPhone, bizType } = body;

        if (!contactEmail && !contactPhone) {
            return NextResponse.json({ error: '연락처는 필수입니다.' }, { status: 422 });
        }

        const sb = getServiceSupabase();
        if (sb) {
            const now = new Date().toISOString();
            const payload = {
                name: companyName || '미확인 기업 (가이드북 다운로드)',
                biz_no: `GUIDE-${Date.now()}`,
                contact_name: contactName,
                contact_email: contactEmail,
                contact_phone: contactPhone,
                biz_category: bizType || '기타',
                store_count: 0,
                plan: 'none',
                status: 'guide_download',
                risk_score: 0,
                issue_count: 0,
                source: 'guide_download',
                created_at: now,
                updated_at: now,
            };

            const { error } = await sb.from('companies').insert(payload);
            
            if (error) {
                console.error('[POST /api/leads/guide] Supabase insert error:', error);
                return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 });
            }
        }

        return NextResponse.json({ ok: true, message: '가이드북 신청 리드가 접수되었습니다.' });
    } catch (err) {
        console.error('Guide API Error:', err);
        return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }
}
