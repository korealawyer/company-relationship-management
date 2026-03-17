/**
 * Supabase Edge Function: send-kakao-alimtalk
 * 카카오 알림톡 발송 + 이메일 대체 폴백
 *
 * 지원 템플릿 (kakao_templates 테이블 관리):
 *   BILLING_OVERDUE_D1  — 결제 실패 안내 (PAYMENT_FAILED 이벤트)
 *   TRIAL_ENDING_D7     — 체험 만료 7일 전 법적 고지
 *   PAYMENT_SUCCESS     — 결제 완료 영수증 (링크 포함)
 *
 * 요청 형식:
 *   POST /functions/v1/send-kakao-alimtalk
 *   Body: {
 *     templateKey: 'BILLING_OVERDUE_D1' | 'TRIAL_ENDING_D7' | 'PAYMENT_SUCCESS',
 *     phone: '010-1234-5678',
 *     email?: 'fallback@example.com',   // 카카오 실패 시 이메일 폴백
 *     variables: { 법인명: '..', 플랜명: '..', ... }
 *   }
 *
 * 발송 우선순위: 카카오 알림톡 → 이메일 폴백
 * 카카오 미발급(kakao_template_id=NULL) 시 즉시 이메일 발송
 *
 * 환경변수:
 *   KAKAO_API_KEY         — 카카오 비즈메시지 API 키
 *   KAKAO_SENDER_KEY      — 채널 발신키
 *   RESEND_API_KEY        — Resend 이메일 API 키
 *   FROM_EMAIL            — 발신 이메일
 *   SUPABASE_URL          — (자동 주입)
 *   SUPABASE_SERVICE_ROLE_KEY — (자동 주입)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── 요청 인터페이스 ────────────────────────────────────────────────────
interface AlimtalkRequest {
  templateKey: string;           // BILLING_OVERDUE_D1 | TRIAL_ENDING_D7 | PAYMENT_SUCCESS
  phone?: string;                // 카카오 수신 번호
  email?: string;                // 이메일 폴백 주소
  variables?: Record<string, string>; // 템플릿 변수 치환 맵
  // 직접 메시지 (templateKey 없이 발송 시 사용)
  message?: string;
  templateId?: string;           // 레거시 호환 — 직접 카카오 템플릿 ID
  senderKey?: string;            // 레거시 호환
}

interface KakaoTemplate {
  kakao_template_id: string | null;
  title: string;
  body_template: string;
  buttons: Record<string, string>[];
  is_legal_required: boolean;
  email_subject: string | null;
}

// ── 템플릿 변수 치환 ──────────────────────────────────────────────────
function applyVariables(template: string, vars?: Record<string, string>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (msg, [key, val]) => msg.replaceAll(`{{${key}}}`, val),
    template
  );
}

// ── 카카오 알림톡 발송 (솔라피 또는 카카오 직접 API) ──────────────────
async function sendKakaoAlimtalk(params: {
  phone: string;
  message: string;
  templateId: string;
  senderKey: string;
  buttons: Record<string, string>[];
}): Promise<{ ok: boolean; error?: string }> {
  // ⚠️ 실제 연동: 솔라피(https://api.solapi.com) 또는 카카오 직접 API
  // 현재: 솔라피 알림톡 API v4 방식 (가장 많이 사용되는 한국 표준)

  const apiKey    = Deno.env.get('SOLAPI_API_KEY')    // 솔라피 API 키
               ?? Deno.env.get('KAKAO_API_KEY');       // 레거시 호환
  const apiSecret = Deno.env.get('SOLAPI_API_SECRET') // 솔라피 시크릿
               ?? Deno.env.get('KAKAO_API_SECRET');    // 레거시 호환
  const pfId      = Deno.env.get('KAKAO_SENDER_KEY')
               ?? params.senderKey;

  if (!apiKey || !apiSecret || !pfId) {
    return { ok: false, error: 'Kakao/Solapi credentials not configured' };
  }

  // 솔라피 HMAC-SHA256 인증
  const dateStr  = new Date().toISOString();
  const msgId    = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  const toSign   = `${dateStr}${msgId}`;
  const enc      = new TextEncoder();
  const key      = await crypto.subtle.importKey(
    'raw', enc.encode(apiSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigArr   = await crypto.subtle.sign('HMAC', key, enc.encode(toSign));
  const sig      = Array.from(new Uint8Array(sigArr))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  try {
    const res = await fetch('https://api.solapi.com/messages/v4/send', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${dateStr}, salt=${msgId}, signature=${sig}`,
      },
      body: JSON.stringify({
        message: {
          to:   params.phone.replace(/-/g, ''),
          from: Deno.env.get('KAKAO_SENDER_PHONE') ?? '0215881234',
          kakaoOptions: {
            pfId,
            templateId: params.templateId,
            variables:  {},  // 이미 applyVariables로 치환된 메시지 사용
            disableSms: false,  // 알림톡 실패 시 SMS 자동 폴백
            buttons:    params.buttons,
          },
          text: params.message,  // SMS 폴백 메시지
        },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `Solapi error: ${err}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── 이메일 발송 (Resend) — 알림톡 미발급/실패 시 대체 ─────────────────
async function sendEmailFallback(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey   = Deno.env.get('RESEND_API_KEY');
  const fromMail = Deno.env.get('FROM_EMAIL') ?? 'noreply@lawtop.kr';

  if (!apiKey || !params.to) {
    return { ok: false, error: 'RESEND_API_KEY not configured or no email address' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from:    fromMail,
        to:      [params.to],
        subject: params.subject,
        text:    params.text,
      }),
    });
    return { ok: res.ok, error: res.ok ? undefined : `Resend ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── 메인 ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: AlimtalkRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { templateKey, phone, email, variables, message: directMsg, templateId: directTplId, senderKey } = body;
  const result = { channel: 'none', ok: false, error: '' };

  // ── 레거시 직접 발송 모드 (templateId 직접 지정) ───────────────────
  if (directTplId && directMsg && phone) {
    const kakaoRes = await sendKakaoAlimtalk({
      phone, message: directMsg,
      templateId: directTplId,
      senderKey:  senderKey ?? Deno.env.get('KAKAO_SENDER_KEY') ?? '',
      buttons:    [],
    });
    result.channel = 'kakao';
    result.ok      = kakaoRes.ok;
    result.error   = kakaoRes.error ?? '';
    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── 템플릿 키 방식 (표준) ──────────────────────────────────────────
  if (!templateKey) {
    return new Response(JSON.stringify({ error: 'templateKey is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // kakao_templates 테이블에서 템플릿 조회
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: tpl, error: tplErr } = await supabase
    .from('kakao_templates')
    .select('kakao_template_id, title, body_template, buttons, is_legal_required, email_subject')
    .eq('template_key', templateKey)
    .eq('is_active', true)
    .single() as { data: KakaoTemplate | null; error: unknown };

  if (tplErr || !tpl) {
    console.error(`[send-kakao-alimtalk] Template not found: ${templateKey}`, tplErr);
    return new Response(JSON.stringify({ error: `Template "${templateKey}" not found` }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  // 변수 치환
  const message = applyVariables(tpl.body_template, variables);

  // ── 발송 전략: 카카오 먼저, 실패/미발급 → 이메일 폴백 ─────────────
  let kakaoOk = false;

  if (phone && tpl.kakao_template_id) {
    // 카카오 알림톡 발급 완료 → 발송
    const kakaoRes = await sendKakaoAlimtalk({
      phone,
      message,
      templateId: tpl.kakao_template_id,
      senderKey:  Deno.env.get('KAKAO_SENDER_KEY') ?? '',
      buttons:    tpl.buttons ?? [],
    });
    kakaoOk = kakaoRes.ok;
    if (kakaoRes.ok) {
      result.channel = 'kakao';
      result.ok      = true;
    } else {
      console.warn(`[send-kakao-alimtalk] Kakao failed (${templateKey}): ${kakaoRes.error} → email fallback`);
      result.error = kakaoRes.error ?? '';
    }
  } else if (phone && !tpl.kakao_template_id) {
    // 카카오 미발급 중 → 이메일 대체 (개발/심사 중)
    console.log(`[send-kakao-alimtalk] Template "${templateKey}" has no kakao_template_id → email fallback`);
  }

  // 이메일 폴백 (카카오 실패 or 미발급 시)
  if (!kakaoOk && email) {
    const subject = tpl.email_subject ?? tpl.title;
    const emailRes = await sendEmailFallback({ to: email, subject, text: message });
    result.channel = emailRes.ok ? 'email' : 'none';
    result.ok      = emailRes.ok;
    if (!emailRes.ok) result.error = emailRes.error ?? '';
  }

  // 법적 의무 템플릿은 발송 실패도 로그 기록
  if (tpl.is_legal_required && !result.ok) {
    console.error(`[send-kakao-alimtalk] LEGAL REQUIRED template "${templateKey}" FAILED to send!`, {
      phone, email, error: result.error,
    });
  }

  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : (result.channel === 'none' ? 500 : 207),
    headers: { 'Content-Type': 'application/json' },
  });
});
