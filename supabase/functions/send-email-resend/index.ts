/**
 * Supabase Edge Function: send-email-resend
 * MVP #2: 이메일 폴백 발송 (Resend API)
 *
 * 호출: workflow-deadline-check → 카카오/SMS 모두 실패 시
 *       또는 직접 이메일 발송이 필요한 경우
 *
 * 환경변수:
 *   RESEND_API_KEY — Resend API 키 (기존 키 사용 가능)
 *   FROM_EMAIL     — 발신 이메일 (기본: noreply@lawcrm.kr)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface EmailRequest {
    to: string | string[];  // 수신자 (단일 or 배열)
    cc?: string[];           // CC (불변기일 D-14: 대표 변호사)
    bcc?: string[];           // BCC
    subject: string;             // 제목
    text?: string;             // 텍스트 본문
    html?: string;             // HTML 본문 (text 우선)
    reply_to?: string;             // 회신 주소
}

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'noreply@lawcrm.kr';

    if (!apiKey) {
        return new Response(
            JSON.stringify({ ok: false, error: 'RESEND_API_KEY not configured' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }

    let body: EmailRequest;
    try {
        body = await req.json();
    } catch {
        return new Response(
            JSON.stringify({ ok: false, error: 'Invalid JSON body' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (!body.to || !body.subject || (!body.text && !body.html)) {
        return new Response(
            JSON.stringify({ ok: false, error: 'to, subject, text/html은 필수입니다.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // 수신자 배열 정규화
    const toList = Array.isArray(body.to) ? body.to : [body.to];

    // HTML 본문 미제공 시 텍스트 → 심플 HTML 변환
    const htmlBody = body.html ?? `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc;">
  <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
    <div style="border-left: 4px solid #4f46e5; padding-left: 16px; margin-bottom: 24px;">
      <h2 style="margin: 0; font-size: 18px; color: #1e293b;">${body.subject}</h2>
    </div>
    <div style="color: #334155; font-size: 14px; line-height: 1.8; white-space: pre-line;">${body.text ?? ''}</div>
    <hr style="margin: 28px 0; border: none; border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
      본 메일은 법무법인 CRM 시스템에서 자동 발송되었습니다.<br>
      문의: <a href="mailto:${fromEmail}" style="color: #4f46e5;">${fromEmail}</a>
    </p>
  </div>
</body>
</html>`;

    try {
        const payload: Record<string, unknown> = {
            from: `법무법인 CRM <${fromEmail}>`,
            to: toList,
            subject: body.subject,
            html: htmlBody,
        };

        if (body.text) payload.text = body.text;
        if (body.cc?.length) payload.cc = body.cc;
        if (body.bcc?.length) payload.bcc = body.bcc;
        if (body.reply_to) payload.reply_to = body.reply_to;

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({})) as Record<string, unknown>;

        if (!res.ok) {
            console.error('[send-email-resend] Resend API 오류:', data);
            return new Response(
                JSON.stringify({ ok: false, error: data.message ?? `Resend ${res.status}` }),
                { status: 502, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log('[send-email-resend] 발송 성공:', data.id);
        return new Response(
            JSON.stringify({ ok: true, email_id: data.id }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    } catch (e) {
        console.error('[send-email-resend] 네트워크 오류:', e);
        return new Response(
            JSON.stringify({ ok: false, error: (e as Error).message }),
            { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
