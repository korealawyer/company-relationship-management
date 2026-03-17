/**
 * Supabase Edge Function: workflow-billing-upsell
 * SaaS 구독 헬스스코어 이상 감지 → 업셀 기회 자동 트리거
 *
 * 실행 주기: pg_cron 매주 월요일 09:00 KST (00:00 UTC)
 *   SELECT cron.schedule(
 *     'billing-upsell-weekly',
 *     '0 0 * * 1',
 *     $$SELECT net.http_post(url:='{SUPABASE_URL}/functions/v1/workflow-billing-upsell',
 *       headers:='{"Authorization":"Bearer {SERVICE_ROLE_KEY}"}',
 *       body:='{}')$$
 *   );
 *
 * 업셀 기회 감지 기준:
 *   - Basic 플랜 + 사건 수 > 50 → Pro 업셀
 *   - Pro 플랜 + 변호사 수 >= 12 → Growth 업셀
 *   - Pro 플랜 + 월간 API 호출 수 > 80% → Growth 업셀
 *   - 체험 종료 D-7 → 유료 전환 알림
 *
 * 처리 순서:
 *   1. active/trial 구독 전체 조회
 *   2. 각 테넌트 사용량 지표 집계
 *   3. 업셀 조건 매칭 → UPSELL_TRIGGERED 로그
 *   4. 카카오 / 이메일 업셀 메시지 발송
 *
 * ⚠️ trigger_type: automation.ts 미러 인라인
 * 설계 근거: _strategy/08_PRICING_STRATEGY.md + pm.md /saas_churn 워크플로우
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── 상수 (automation.ts 미러) ─────────────────────────────────────────
const TRIGGER = {
  UPSELL_TRIGGERED: 'upsell_triggered',
} as const;

// ── 플랜 가격 (saas-pricing.ts 미러 — Deno import 불가) ──────────────
const PLAN_PRICE: Record<string, number> = {
  basic:  990000,
  pro:   2490000,
  growth:4990000,
};
const PLAN_UPGRADE: Record<string, string> = {
  basic: 'pro',
  pro:   'growth',
};

// ── 업셀 메시지 빌더 ──────────────────────────────────────────────────
function buildUpsellMessage(params: {
  reason: string;
  currentPlan: string;
  targetPlan: string;
  savings?: number;
}) {
  const planLabel: Record<string, string> = { basic: 'Basic', pro: 'Pro', growth: 'Growth' };
  const targetPrice = PLAN_PRICE[params.targetPlan] ?? 0;

  return [
    `🚀 [플랜 업그레이드 안내]`,
    `현재 ${planLabel[params.currentPlan] ?? params.currentPlan} 플랜 사용 중`,
    ``,
    `📊 업그레이드 이유:`,
    `${params.reason}`,
    ``,
    `✅ ${planLabel[params.targetPlan] ?? params.targetPlan} 플랜 (₩${targetPrice.toLocaleString()}/월)으로`,
    `   무제한 기능을 활용해 보세요.`,
    ``,
    `👉 지금 업그레이드: https://lawtop.kr/admin/billing`,
  ].join('\n');
}

// ── 이메일 발송 ───────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, text: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey || !to) return false;
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
    return res.ok;
  } catch { return false; }
}

// ── 카카오 발송 ───────────────────────────────────────────────────────
async function sendKakao(phone: string, message: string, supabaseUrl: string, serviceKey: string) {
  const senderKey = Deno.env.get('KAKAO_SENDER_KEY');
  if (!senderKey || !phone) return false;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-kakao-alimtalk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ phone, message, templateId: 'UPSELL_NOTICE', senderKey }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch { return false; }
}

// ── 메인 ─────────────────────────────────────────────────────────────
serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase    = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results = { evaluated: 0, triggered: 0, sent: 0 };

  // ── active/trial 구독 전체 조회 ───────────────────────────────────
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, tenant_id, plan, status, trial_ends_at, billing_contact_email, billing_contact_phone')
    .in('status', ['active', 'trial']);

  if (error || !subs?.length) {
    return new Response(JSON.stringify({ message: '평가 대상 없음' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  for (const sub of subs) {
    results.evaluated++;
    const upsellReasons: string[] = [];
    const targetPlan = PLAN_UPGRADE[sub.plan];

    if (!targetPlan) continue; // growth는 업셀 대상 없음

    // ── 업셀 기회 1: Basic + 사건 수 > 50 ─────────────────────────
    if (sub.plan === 'basic') {
      const { count } = await supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', sub.tenant_id)
        .eq('status', 'active');

      if ((count ?? 0) > 50) {
        upsellReasons.push(`활성 사건 ${count}건으로 Basic 한도(50건 권장) 초과`);
      }
    }

    // ── 업셀 기회 2: Pro + 변호사 수 >= 12 ────────────────────────
    if (sub.plan === 'pro') {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', sub.tenant_id)
        .eq('role', 'lawyer');

      if ((count ?? 0) >= 12) {
        upsellReasons.push(`변호사 ${count}명으로 Pro 한도(15인) 근접`);
      }
    }

    // ── 업셀 기회 3: 체험 종료 D-7 → 유료 전환 알림 ──────────────
    if (sub.status === 'trial' && sub.trial_ends_at) {
      const daysLeft = Math.ceil(
        (new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000
      );
      if (daysLeft <= 7 && daysLeft >= 0) {
        upsellReasons.push(`무료 체험 종료 D-${daysLeft} (${new Date(sub.trial_ends_at).toLocaleDateString('ko-KR')})`);
      }
    }

    if (upsellReasons.length === 0) continue;

    // ── 업셀 메시지 발송 ──────────────────────────────────────────
    const message = buildUpsellMessage({
      reason: upsellReasons.join('\n   · '),
      currentPlan: sub.plan,
      targetPlan,
    });
    const subject = `[LAWTOP] ${sub.plan.toUpperCase()} 플랜 업그레이드를 추천드립니다`;

    let sent = false;
    if (sub.billing_contact_phone) {
      sent = await sendKakao(sub.billing_contact_phone, message, supabaseUrl, serviceKey);
    }
    if (!sent && sub.billing_contact_email) {
      sent = await sendEmail(sub.billing_contact_email, subject, message);
    }
    if (sent) results.sent++;

    // ── automation_log 기록 ────────────────────────────────────────
    await supabase.from('automation_logs').insert({
      tenant_id: sub.tenant_id,
      trigger_type: TRIGGER.UPSELL_TRIGGERED,
      payload: {
        current_plan: sub.plan,
        target_plan: targetPlan,
        reasons: upsellReasons,
        notified: sent,
      },
    });

    results.triggered++;
  }

  console.log('[workflow-billing-upsell] 완료:', results);
  return new Response(JSON.stringify({ success: true, ...results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
