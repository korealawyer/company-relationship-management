import { NextRequest, NextResponse } from 'next/server';
import { leadStore } from '@/lib/leadStore';
import { requireSessionFromCookie } from '@/lib/auth';
import { getServiceSupabase, IS_SUPABASE_CONFIGURED } from '@/lib/supabase';

// ── [챗봇 리드 수신] POST /api/leads ─────────────────────────────
// 인증 불필요 — 외부 챗봇에서 호출, rate limit은 별도 미들웨어로 처리
export async function POST(req: NextRequest) {
    let body: { customerName?: string; contact?: string; question?: string; source?: string } = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    const { customerName = '웹 챗봇 신규 리드', contact = '', question = '', source = 'chatbot' } = body;

    if (!contact) {
        return NextResponse.json({ error: '연락처는 필수입니다.' }, { status: 422 });
    }

    const isEmail = contact.includes('@');
    const now = new Date().toISOString();

    let dbErrorMsg: string | null = null;
    
    // ── Mode 1: Supabase 연결됨 → companies 테이블에 저장 ──────────
    if (IS_SUPABASE_CONFIGURED) {
        const sb = getServiceSupabase() ?? (await import('@/lib/supabase').then(m => m.supabase));
        if (sb) {
            const { error } = await sb.from('companies').insert({
                name: customerName,
                biz_no: `CHATBOT-${Date.now()}`, // 임시 사업자번호 (추후 수집)
                contact_name: customerName,
                contact_email: isEmail ? contact : null,
                contact_phone: !isEmail ? contact : null,
                store_count: 0,
                plan: 'none',
                status: 'pending',
                risk_score: 0,
                issue_count: 0,
                source,
                created_at: now,
                updated_at: now,
            });

            if (error) {
                console.error('[POST /api/leads] Supabase insert error:', error);
                dbErrorMsg = error.message || JSON.stringify(error);
                // Supabase 실패 시에도 200 반환 (챗봇 UX 중단 방지)
            }
        } else {
            dbErrorMsg = 'Supabase client could not be initialized';
        }
    } else {
        dbErrorMsg = 'IS_SUPABASE_CONFIGURED is false (missing env vars)';
    }

    // ── Mode 2: 항상 실행 — CRM 실시간 알림 이벤트 ─────────────────
    // SSE 또는 WebSocket 미구현 시 global custom event로 대체
    // (클라이언트 측 FloatingChatbot의 'new-crm-lead' 이벤트와 연동)
    const chatbotNote = `[챗봇 문의] 고객명: ${customerName} | 문의: ${question || '(미입력)'} | 연락처: ${contact}`;

    console.info(`[챗봇 리드 수신] ${chatbotNote}`);

    return NextResponse.json({
        ok: true,
        message: '리드가 접수되었습니다.',
        meta: { source, receivedAt: now, debugError: dbErrorMsg },
    });
}

// Only POST is retained for Chatbot inserts via Supabase.
// GET and PATCH have been deprecated as part of Phase 1 to prevent SSR errors
// and enforce client-side state management using Zustand.
