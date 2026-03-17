/**
 * Supabase Edge Function: workflow-contract-signed
 * 서명 완료 이벤트 → 청구서(automation_logs) 자동 생성 트리거
 *
 * 호출: src/app/api/contracts/[id]/sign/route.ts 에서 서명 완료 후 비동기 호출
 *
 * 처리:
 *   1. contracts 조회 (company_id, tenant_id 확인)
 *   2. automation_logs: BILLING_CHASE_TRIGGERED (수임료 청구 자동 트리거)
 *   3. 이메일 알림: 관리자에게 서명 완료 + 청구 예정 통보
 *
 * 절대 규칙: tenant_id (law_firm_id 금지)
 * trigger_type 값: 이 파일은 Edge Function (Deno), automation.ts import 불가
 *                  → 허용 예외: 문자열 값은 automation.ts 정의값과 동일하게 유지
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// automation.ts의 AUTOMATION_TRIGGER_TYPE과 동일한 값 (Edge Function은 TS import 불가)
// 반드시 automation.ts 값과 일치 유지 필요
const TRIGGER = {
    ESIGN_COMPLETED: 'esign_completed',     // automation.ts와 동일
    BILLING_CHASE_TRIGGERED: 'billing_chase_triggered', // automation.ts와 동일
} as const;

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let body: {
        contract_id: string;
        tenant_id: string;
        signed_at: string;
        pdf_url?: string | null;
    };

    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
        });
    }

    const { contract_id, tenant_id, signed_at, pdf_url } = body;

    if (!contract_id || !tenant_id) {
        return new Response(JSON.stringify({ ok: false, error: 'contract_id, tenant_id 필수' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
        });
    }

    // 1. 계약 조회
    const { data: contract, error: fetchErr } = await supabase
        .from('contracts')
        .select('id, contract_title, party_a_name, party_b_name, party_b_email, company_id, tenant_id, duration_months')
        .eq('id', contract_id)
        .eq('tenant_id', tenant_id)
        .single();

    if (fetchErr || !contract) {
        return new Response(JSON.stringify({ ok: false, error: '계약을 찾을 수 없습니다.' }), {
            status: 404, headers: { 'Content-Type': 'application/json' },
        });
    }

    // 2. automation_logs: BILLING_CHASE_TRIGGERED
    //    서명 완료 → 수임료 청구 자동 시작
    const { error: logErr } = await supabase.from('automation_logs').insert({
        tenant_id,
        trigger_type: TRIGGER.BILLING_CHASE_TRIGGERED,
        related_contract_id: contract_id,
        target_entity_type: 'contract',
        target_entity_id: contract_id,
        sent_channel: 'in_app',
        status: 'sent',
        payload: {
            contract_title: contract.contract_title,
            party_b_name: contract.party_b_name,
            company_id: contract.company_id,
            signed_at,
            pdf_url: pdf_url ?? null,
            billing_due_days: 30,
            note: 'esign_completed → billing_chase 자동 트리거',
        },
    });

    if (logErr) {
        console.error('[workflow-contract-signed] billing log 실패:', logErr.message);
    }

    // 3. 관리자 이메일 알림 (send-email-resend Edge Function 호출)
    const adminEmail = Deno.env.get('ADMIN_EMAIL');
    if (adminEmail) {
        try {
            await fetch(`${supabaseUrl}/functions/v1/send-email-resend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                },
                body: JSON.stringify({
                    to: adminEmail,
                    subject: `[서명완료] ${contract.contract_title}`,
                    text: [
                        `계약서 서명이 완료되었습니다.`,
                        ``,
                        `계약서: ${contract.contract_title}`,
                        `서명자: ${contract.party_b_name}`,
                        `서명일시: ${new Date(signed_at).toLocaleString('ko-KR')}`,
                        pdf_url ? `PDF: ${pdf_url}` : '',
                        ``,
                        `수임료 청구 워크플로우가 자동으로 시작됩니다.`,
                    ].filter(Boolean).join('\n'),
                }),
            });
        } catch (emailErr) {
            console.error('[workflow-contract-signed] 관리자 이메일 실패:', emailErr);
        }
    }

    return new Response(
        JSON.stringify({
            ok: true,
            triggered: TRIGGER.BILLING_CHASE_TRIGGERED,
            contract_id,
        }),
        { headers: { 'Content-Type': 'application/json' } },
    );
});
