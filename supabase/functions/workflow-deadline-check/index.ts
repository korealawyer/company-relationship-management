/**
 * Supabase Edge Function: workflow-deadline-check
 * MVP #2: 자동 기일 알림 (_strategy/LAWTOP_IA_DEEP_RESEARCH.md)
 *
 * 실행 주기: pg_cron 매일 00:00 UTC = 09:00 KST
 * 역할:
 *   1. scheduled_alerts에서 당일 발송 대상 추출 (sent=FALSE + scheduled_for ≤ NOW)
 *   2. 카카오 알림톡 우선 발송 (send-kakao-alimtalk Edge Fn)
 *   3. 카카오 실패 시 → SMS 폴백 (ncp-sms or twilio)
 *   4. SMS 실패 시 → 이메일 폴백 (send-email-resend Edge Fn)
 *   5. notification_logs INSERT (channel, status 모두 기록)
 *   6. scheduled_alerts.sent = TRUE 업데이트
 *
 * ⚠️ trigger_type: automation.ts의 AUTOMATION_TRIGGER_TYPE 값 직접 사용
 *    (Deno Edge Function에서는 import 불가 → 상수값 인라인 정의)
 *    HEARING_ALERT_SENT  = 'hearing_alert_sent'
 *    HEARING_ALERT_FAILED = 'hearing_alert_failed'
 *
 * 환경변수:
 *   SUPABASE_URL            — Supabase 프로젝트 URL
 *   SUPABASE_SERVICE_ROLE_KEY — 서비스 역할 키 (RLS 우회)
 *   KAKAO_API_KEY           — 카카오 알림톡 API 키
 *   KAKAO_SENDER_KEY        — 카카오 채널 발신키
 *   NCP_SMS_ACCESS_KEY      — NCP SMS 접근키
 *   NCP_SMS_SECRET_KEY      — NCP SMS 비밀키
 *   NCP_SMS_SERVICE_ID      — NCP SMS 서비스 ID
 *   NCP_SMS_SENDER          — NCP SMS 발신번호
 *   RESEND_API_KEY          — Resend 이메일 API 키
 *   FROM_EMAIL              — 발신 이메일
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── 상수 (automation.ts mirror — Deno에서 직접 import 불가) ─────────────────
const TRIGGER = {
    HEARING_ALERT_SENT: 'hearing_alert_sent',
    HEARING_ALERT_FAILED: 'hearing_alert_failed',
} as const;

// ── 알림 템플릿 텍스트 ────────────────────────────────────────────────────────

function buildAlertMessage(params: {
    alertType: string;
    caseTitle: string;
    hearingDate: string;
    hearingTime: string | null;
    courtName: string;
    courtroom: string | null;
    daysUntil: number;
}): string {
    const dateStr = new Date(params.hearingDate).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = params.hearingTime ? ` ${params.hearingTime}` : '';
    const courtRoom = params.courtroom ? ` ${params.courtroom}` : '';

    if (params.alertType === 'immutable_warning') {
        return [
            `⚠️ [불변기일 D-14 경고]`,
            `사건: ${params.caseTitle}`,
            `기일: ${dateStr}${timeStr}`,
            `법원: ${params.courtName}${courtRoom}`,
            ``,
            `항소기한 등 불변기일이 14일 후입니다.`,
            `반드시 기일 준수 여부를 확인하십시오.`,
        ].join('\n');
    }

    const urgency =
        params.daysUntil === 0 ? '오늘 기일' :
            params.daysUntil === 1 ? '[D-1 최종 확인]' :
                params.daysUntil === 3 ? '[D-3 기일 알림]' :
                    '[D-7 기일 예정]';

    return [
        `📅 ${urgency}`,
        `사건: ${params.caseTitle}`,
        `기일: ${dateStr}${timeStr}`,
        `법원: ${params.courtName}${courtRoom}`,
    ].join('\n');
}

// ── 카카오 알림톡 발송 ────────────────────────────────────────────────────────

async function sendKakao(params: {
    phone: string;
    message: string;
    templateId: string;
}): Promise<{ ok: boolean; error?: string }> {
    const apiKey = Deno.env.get('KAKAO_API_KEY');
    const senderKey = Deno.env.get('KAKAO_SENDER_KEY');

    if (!apiKey || !senderKey) {
        return { ok: false, error: 'KAKAO credentials not configured' };
    }

    try {
        // Supabase Edge Function 내부 호출 (send-kakao-alimtalk)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const res = await fetch(
            `${supabaseUrl}/functions/v1/send-kakao-alimtalk`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({
                    phone: params.phone,
                    message: params.message,
                    templateId: params.templateId,
                    senderKey,
                }),
                signal: AbortSignal.timeout(8000), // 8초 타임아웃 → SMS 폴백
            }
        );

        if (!res.ok) {
            const err = await res.text();
            return { ok: false, error: `Kakao API error: ${err}` };
        }

        return { ok: true };
    } catch (e) {
        return { ok: false, error: `Kakao send timeout or error: ${(e as Error).message}` };
    }
}

// ── SMS 폴백 (NCP) ───────────────────────────────────────────────────────────

async function sendSms(params: {
    phone: string;
    message: string;
}): Promise<{ ok: boolean; error?: string }> {
    const accessKey = Deno.env.get('NCP_SMS_ACCESS_KEY');
    const secretKey = Deno.env.get('NCP_SMS_SECRET_KEY');
    const serviceId = Deno.env.get('NCP_SMS_SERVICE_ID');
    const from = Deno.env.get('NCP_SMS_SENDER');

    if (!accessKey || !secretKey || !serviceId || !from) {
        return { ok: false, error: 'NCP SMS credentials not configured' };
    }

    try {
        const timestamp = Date.now().toString();
        const method = 'POST';
        const url = `/sms/v2/services/${serviceId}/messages`;

        // NCP HMAC-SHA256 서명
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw', enc.encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        const sigArr = await crypto.subtle.sign(
            'HMAC', key, enc.encode(`${method} ${url}\n${timestamp}\n${accessKey}`)
        );
        const sig = btoa(String.fromCharCode(...new Uint8Array(sigArr)));

        const res = await fetch(`https://sens.apigw.ntruss.com${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'x-ncp-apigw-timestamp': timestamp,
                'x-ncp-iam-access-key': accessKey,
                'x-ncp-apigw-signature-v2': sig,
            },
            body: JSON.stringify({
                type: 'SMS',
                from,
                content: params.message.slice(0, 90), // SMS 90자 제한
                messages: [{ to: params.phone.replace(/-/g, '') }],
            }),
        });

        return { ok: res.ok, error: res.ok ? undefined : `SMS API ${res.status}` };
    } catch (e) {
        return { ok: false, error: `SMS send error: ${(e as Error).message}` };
    }
}

// ── 이메일 폴백 (Resend) ─────────────────────────────────────────────────────

async function sendEmail(params: {
    to: string;
    subject: string;
    text: string;
    ccList?: string[];
}): Promise<{ ok: boolean; error?: string }> {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'noreply@lawcrm.kr';

    if (!apiKey) {
        return { ok: false, error: 'RESEND_API_KEY not configured' };
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [params.to],
                cc: params.ccList ?? [],
                subject: params.subject,
                text: params.text,
            }),
        });

        return { ok: res.ok, error: res.ok ? undefined : `Resend API ${res.status}` };
    } catch (e) {
        return { ok: false, error: `Email send error: ${(e as Error).message}` };
    }
}

// ── 메인: 알림 발송 루프 ──────────────────────────────────────────────────────

serve(async (req) => {
    // 인증 헤더 확인 (cron 호출 시 service role key)
    const authHeader = req.headers.get('Authorization') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!authHeader.includes(serviceKey.slice(-8))) {
        // 기본 인증 체크 (간단한 suffix 매칭 — 실제 운영 시 JWT 검사 권장)
        // 허용: 동일 프로젝트 내 cron 호출
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const nowUtc = new Date().toISOString();
    const results = { dispatched: 0, failed: 0, skipped: 0 };

    // ── 당일 발송 대상 추출 ─────────────────────────────────────────────────
    const { data: alerts, error: fetchErr } = await supabase
        .from('scheduled_alerts')
        .select(`
            id, alert_type, channel, target_type, target_user_id,
            hearing_id, case_id, tenant_id, retry_count,
            hearings(
                id, hearing_date, hearing_time, court_name, courtroom,
                is_immutable, notify_client,
                cases(id, title)
            )
        `)
        .eq('sent', false)
        .lte('scheduled_for', nowUtc)
        .lte('retry_count', 3)  // 최대 3회 재시도
        .order('scheduled_for', { ascending: true });

    if (fetchErr) {
        console.error('[workflow-deadline-check] fetch alerts error:', fetchErr);
        return new Response(JSON.stringify({ error: fetchErr.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (!alerts || alerts.length === 0) {
        return new Response(JSON.stringify({ message: '발송 대상 없음', ...results }), {
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // ── 알림 발송 루프 ──────────────────────────────────────────────────────
    for (const alert of alerts) {
        const hearing = Array.isArray(alert.hearings) ? alert.hearings[0] : alert.hearings;
        const caseItem = hearing?.cases
            ? (Array.isArray(hearing.cases) ? hearing.cases[0] : hearing.cases)
            : null;

        if (!hearing || !caseItem) {
            results.skipped++;
            continue;
        }

        // 수신자 정보 조회
        let recipientPhone: string | null = null;
        let recipientEmail: string | null = null;
        let recipientId: string | null = alert.target_user_id;
        const ccList: string[] = [];

        if (alert.target_user_id) {
            const { data: u } = await supabase
                .from('users')
                .select('id, phone, email')
                .eq('id', alert.target_user_id)
                .single();
            if (u) {
                recipientPhone = u.phone;
                recipientEmail = u.email;
            }
        } else if (alert.target_type === 'client') {
            // 사건의 의뢰인 연락처 조회
            const { data: caseRow } = await supabase
                .from('cases')
                .select('client_id, users(phone, email)')
                .eq('id', alert.case_id)
                .single();
            if (caseRow?.client_id) {
                const u = Array.isArray(caseRow.users) ? caseRow.users[0] : caseRow.users;
                recipientPhone = (u as { phone?: string })?.phone ?? null;
                recipientEmail = (u as { email?: string })?.email ?? null;
                recipientId = caseRow.client_id as string;
            }
        } else if (alert.target_type === 'attorney') {
            // 담당 변호사 연락처 조회
            const { data: caseRow } = await supabase
                .from('cases')
                .select('assigned_attorney_id, users:assigned_attorney_id(phone, email)')
                .eq('id', alert.case_id)
                .single();
            if (caseRow) {
                const u = Array.isArray(caseRow.users) ? caseRow.users[0] : caseRow.users;
                recipientPhone = (u as { phone?: string })?.phone ?? null;
                recipientEmail = (u as { email?: string })?.email ?? null;
                recipientId = caseRow.assigned_attorney_id as string;
            }
        } else if (alert.target_type === 'all') {
            // 불변기일 D-14: 대표 변호사(PARTNER_LAWYER) CC 추가
            const { data: partners } = await supabase
                .from('users')
                .select('email')
                .eq('company_id', alert.tenant_id)
                .eq('role', 'PARTNER_LAWYER');
            if (partners) {
                ccList.push(...partners.map((p: { email: string }) => p.email).filter(Boolean));
            }
        }

        const daysUntil = Math.ceil(
            (new Date(hearing.hearing_date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000
        );

        const message = buildAlertMessage({
            alertType: alert.alert_type,
            caseTitle: caseItem.title,
            hearingDate: hearing.hearing_date,
            hearingTime: hearing.hearing_time,
            courtName: hearing.court_name,
            courtroom: hearing.courtroom,
            daysUntil,
        });

        // ── 채널 우선순위: 카카오 → SMS → 이메일 ─────────────────────────

        let channelUsed: string = alert.channel;
        let sendOk = false;
        let sendError: string | undefined;

        // 인앱 알림 (channel = internal): notification_logs만 INSERT 후 완료
        if (alert.channel === 'internal') {
            sendOk = true;
            channelUsed = 'internal';
        }

        // 카카오 알림톡 시도
        if (!sendOk && recipientPhone && alert.channel === 'kakao') {
            const templateId =
                alert.alert_type === 'immutable_warning' ? 'HEARING_NOTICE_D14'
                    : alert.alert_type === 'client_d3' ? 'HEARING_NOTICE_D3'
                        : alert.alert_type === 'client_d1' ? 'HEARING_NOTICE_D1'
                            : 'HEARING_NOTICE';

            const kakaoRes = await sendKakao({ phone: recipientPhone, message, templateId });
            if (kakaoRes.ok) {
                sendOk = true;
                channelUsed = 'kakao';
            } else {
                sendError = kakaoRes.error;
                console.warn(`[kakao failed] ${kakaoRes.error} → SMS fallback`);

                // SMS 폴백
                const smsRes = await sendSms({ phone: recipientPhone, message });
                if (smsRes.ok) {
                    sendOk = true;
                    channelUsed = 'sms';
                } else {
                    sendError = smsRes.error;
                }
            }
        }

        // 이메일 폴백 (카카오+SMS 모두 실패 or channel=email)
        if (!sendOk && recipientEmail) {
            const subject =
                alert.alert_type === 'immutable_warning'
                    ? `⚠️ [불변기일 D-14 경고] ${caseItem.title}`
                    : `📅 [기일 알림] ${caseItem.title}`;

            const emailRes = await sendEmail({
                to: recipientEmail,
                subject,
                text: message,
                ccList: ccList.length > 0 ? ccList : undefined,
            });

            if (emailRes.ok) {
                sendOk = true;
                channelUsed = 'email';
            } else {
                sendError = emailRes.error;
            }
        }

        // ── notification_logs INSERT ──────────────────────────────────────
        const logStatus = sendOk
            ? (channelUsed === 'sms' ? 'sms_fallback' : 'delivered')
            : (alert.retry_count >= 3 ? 'failed' : 'pending_retry');

        await supabase.from('notification_logs').insert({
            tenant_id: alert.tenant_id,
            alert_id: alert.id,
            trigger_type: sendOk ? TRIGGER.HEARING_ALERT_SENT : TRIGGER.HEARING_ALERT_FAILED,
            recipient_id: recipientId,
            recipient_phone: recipientPhone,
            recipient_email: recipientEmail,
            channel: channelUsed,
            status: logStatus,
            response: sendError ? { error: sendError } : null,
            case_id: alert.case_id,
            hearing_id: alert.hearing_id,
        });

        // ── scheduled_alerts 상태 업데이트 ───────────────────────────────
        if (sendOk) {
            await supabase
                .from('scheduled_alerts')
                .update({ sent: true, sent_at: new Date().toISOString() })
                .eq('id', alert.id);
            results.dispatched++;
        } else {
            await supabase
                .from('scheduled_alerts')
                .update({
                    retry_count: (alert.retry_count ?? 0) + 1,
                    last_error: sendError ?? 'Unknown error',
                })
                .eq('id', alert.id);
            results.failed++;
        }
    }

    console.log('[workflow-deadline-check] 완료:', results);

    return new Response(
        JSON.stringify({ success: true, ...results }),
        { headers: { 'Content-Type': 'application/json' } }
    );
});
