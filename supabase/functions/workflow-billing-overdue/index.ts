/**
 * Supabase Edge Function: workflow-billing-overdue
 * 결제 미납(past_due) 테넌트 대상 자동 추적 & 카카오 알림톡 발송
 *
 * 실행 주기: pg_cron 매일 09:00 KST (00:00 UTC)
 *   SELECT cron.schedule(
 *     'billing-overdue-daily',
 *     '0 0 * * *',
 *     $$SELECT net.http_post(url:='{SUPABASE_URL}/functions/v1/workflow-billing-overdue',
 *       headers:='{"Authorization":"Bearer {SERVICE_ROLE_KEY}"}',
 *       body:='{}')$$
 *   );
 *
 * 처리 순서:
 *   1. subscriptions.status = 'past_due' 테넌트 조회
 *   2. 미납 경과일(overdue_days) 계산
 *   3. 단계별 자동 추적:
 *      D+1  → 카카오 알림톡 (결제 재시도 안내)
 *      D+3  → 이메일 추가 발송
 *      D+7  → 서비스 기능 제한 (read-only 전환)
 *      D+14 → 최종 해지 예고
 *   4. automation_logs INSERT (BILLING_PAST_DUE 트리거)
 *   5. /billing_chase 워크플로우 연동
 *
 * ⚠️ trigger_type: automation.ts 미러 인라인 (Deno import 불가)
 * 설계 근거: _strategy/13_PAYMENT_CONTRACT_FLOW.md + pm.md /billing_chase 워크플로우
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── 상수 (automation.ts 미러 — Deno에서 직접 import 불가) ─────────────
const TRIGGER = {
  BILLING_PAST_DUE: 'billing_past_due',
  PAYMENT_FAILED:   'payment_failed',
} as const;

// ── 단계별 미납 처리 정책 ─────────────────────────────────────────────
const OVERDUE_STAGES = [
  { daysGte: 1,  daysLt: 3,  action: 'kakao_reminder',    channel: 'kakao'  },
  { daysGte: 3,  daysLt: 7,  action: 'email_followup',    channel: 'email'  },
  { daysGte: 7,  daysLt: 14, action: 'restrict_features', channel: 'kakao'  },
  { daysGte: 14, daysLt: 999,action: 'cancellation_warning', channel: 'email' },
] as const;

// ── 연체 알림 메시지 빌더 ─────────────────────────────────────────────
function buildOverdueMessage(overdueDays: number, tenantName?: string): string {
  const firm = tenantName ?? '법무법인';
  if (overdueDays >= 14) {
    return [
      `⚠️ [구독 해지 최종 예고] ${firm}`,
      `결제 미납 ${overdueDays}일째입니다.`,
      `3일 내 결제하지 않으시면 구독이 자동 해지됩니다.`,
      `결제 문의: cs@lawtop.kr`,
    ].join('\n');
  }
  if (overdueDays >= 7) {
    return [
      `🔒 [서비스 제한 안내] ${firm}`,
      `결제 미납 ${overdueDays}일째로 일부 기능이 제한됩니다.`,
      `지금 바로 결제를 완료해 모든 기능을 복원하세요.`,
      `결제 링크: https://lawtop.kr/admin/billing`,
    ].join('\n');
  }
  if (overdueDays >= 3) {
    return [
      `📧 [결제 재시도 안내] ${firm}`,
      `결제가 아직 완료되지 않았습니다 (미납 ${overdueDays}일).`,
      `등록 카드 만료 또는 한도 초과 시 카드를 재등록해 주세요.`,
      `결제 관리: https://lawtop.kr/admin/billing`,
    ].join('\n');
  }
  return [
    `💳 [결제 알림] ${firm}`,
    `정기 구독 결제에 실패했습니다.`,
    `카드 정보를 확인하고 재결제를 시도해 주세요.`,
    `결제 관리: https://lawtop.kr/admin/billing`,
  ].join('\n');
}

// ── 카카오 알림톡 발송 (send-kakao-alimtalk Edge Fn 호출) ─────────────
async function sendKakaoAlert(phone: string, message: string, supabaseUrl: string, serviceKey: string) {
  const senderKey = Deno.env.get('KAKAO_SENDER_KEY');
  if (!senderKey || !phone) return { ok: false, error: 'No kakao config or phone' };

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-kakao-alimtalk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        phone,
        message,
        templateId: 'BILLING_OVERDUE',
        senderKey,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return { ok: res.ok, error: res.ok ? undefined : await res.text() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── 이메일 발송 (Resend) ──────────────────────────────────────────────
async function sendEmailAlert(to: string, subject: string, text: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey || !to) return { ok: false, error: 'No resend config or email' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: Deno.env.get('FROM_EMAIL') ?? 'noreply@lawtop.kr',
        to: [to],
        subject,
        text,
      }),
    });
    return { ok: res.ok };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── 메인 ─────────────────────────────────────────────────────────────
serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase    = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results = { processed: 0, kakaoSent: 0, emailSent: 0, failed: 0 };

  // ── past_due 구독 조회 ─────────────────────────────────────────────
  const { data: overdueSubs, error: fetchErr } = await supabase
    .from('subscriptions')
    .select('id, tenant_id, plan, status, past_due_since, billing_contact_email, billing_contact_phone')
    .eq('status', 'past_due')
    .not('past_due_since', 'is', null);

  if (fetchErr) {
    console.error('[billing-overdue] fetch error:', fetchErr);
    return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500 });
  }

  if (!overdueSubs || overdueSubs.length === 0) {
    return new Response(JSON.stringify({ message: '미납 구독 없음', ...results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  for (const sub of overdueSubs) {
    const overdueDays = Math.floor(
      (Date.now() - new Date(sub.past_due_since).getTime()) / 86_400_000
    );

    // 해당 단계 결정
    const stage = OVERDUE_STAGES.find(
      s => overdueDays >= s.daysGte && overdueDays < s.daysLt
    );
    if (!stage) { results.processed++; continue; }

    const message = buildOverdueMessage(overdueDays);
    let notified = false;

    // 카카오 발송
    if ((stage.channel === 'kakao') && sub.billing_contact_phone) {
      const res = await sendKakaoAlert(sub.billing_contact_phone, message, supabaseUrl, serviceKey);
      if (res.ok) { results.kakaoSent++; notified = true; }
    }

    // 이메일 발송 (kakao 실패 시 폴백 또는 email 단계)
    if (!notified && sub.billing_contact_email) {
      const subject = `[LAWTOP] 결제 미납 ${overdueDays}일 — 즉시 확인 필요`;
      const res = await sendEmailAlert(sub.billing_contact_email, subject, message);
      if (res.ok) { results.emailSent++; notified = true; }
      else results.failed++;
    }

    // automation_log 기록
    await supabase.from('automation_logs').insert({
      tenant_id: sub.tenant_id,
      trigger_type: TRIGGER.BILLING_PAST_DUE,
      payload: {
        overdue_days: overdueDays,
        action: stage.action,
        channel: stage.channel,
        notified,
        plan: sub.plan,
      },
    });

    // D+7: 서비스 기능 제한 플래그 설정
    if (stage.action === 'restrict_features') {
      await supabase
        .from('subscriptions')
        .update({ features_restricted: true } as Record<string, unknown>)
        .eq('id', sub.id);
    }

    // D+14: 해지 예약 설정
    if (stage.action === 'cancellation_warning') {
      const cancelAt = new Date();
      cancelAt.setDate(cancelAt.getDate() + 3);
      await supabase
        .from('subscriptions')
        .update({ scheduled_cancellation_at: cancelAt.toISOString() } as Record<string, unknown>)
        .eq('id', sub.id);
    }

    results.processed++;
  }

  console.log('[workflow-billing-overdue] 완료:', results);
  return new Response(JSON.stringify({ success: true, ...results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
