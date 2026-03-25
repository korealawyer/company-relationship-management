'use server'

import { getServiceSupabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock123')

// ── Mock 인메모리 저장소 (Supabase 미설정 시 폴백) ────────────────
const mockContracts = new Map<string, any>();

export async function createContract(data: {
    title: string;
    template: string;
    partyEmail: string;
    companyName: string;
    content: string;
}) {
    const supabase = getServiceSupabase();
    
    // ── Mock 모드 폴백 ──────────────────────────────────────────────
    if (!supabase) {
        const id = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        mockContracts.set(id, {
            id,
            title: data.title,
            template: data.template,
            party_a_name: data.companyName || 'IBS 법률사무소',
            party_a_signed: true,
            party_b_email: data.partyEmail || null,
            party_b_name: data.partyEmail ? data.partyEmail.split('@')[0] : '의뢰인',
            party_b_signed: false,
            status: 'draft',
            content: data.content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        console.log('[Mock] 계약서 생성:', id, data.title);
        revalidatePath('/contracts');
        return id;
    }

    const { data: contract, error } = await supabase.from('contracts').insert({
        title: data.title,
        template: data.template,
        party_a_name: data.companyName || 'IBS 법률사무소',
        party_a_signed: true,
        party_b_email: data.partyEmail || null,
        party_b_name: data.partyEmail ? data.partyEmail.split('@')[0] : '의뢰인',
        party_b_signed: false,
        status: 'draft',
        content: data.content
    }).select('id').single();

    if (error) throw error;
    
    revalidatePath('/contracts');
    return contract.id;
}


export async function sendContractEmail(contractId: string, email: string, link: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY가 없습니다. 모의 발송 처리합니다.');
    }
    
    try {
        if (process.env.RESEND_API_KEY) {
            const { error } = await resend.emails.send({
                from: 'IBS E-Contract <onboarding@resend.dev>', // resend 기본 테스트 이메일 세팅
                to: email,
                subject: '안전한 전자계약 검토/서명 요청서가 도착했습니다.',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;">
                        <h2 style="color: #c9a84c;">전자계약서 서명 요청</h2>
                        <p>안녕하세요,</p>
                        <p>웹 시스템상에서 안전하고 효력있는 전자계약서 검토 및 서명을 요청드립니다.</p>
                        <p>아래 링크를 클릭하여 계약서를 확인하고 서명을 진행해 주세요.</p>
                        <div style="margin: 40px 0; text-align: center;">
                            <a href="${link}" style="background-color: #111827; color: #c9a84c; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">계약서 확인 및 서명하기</a>
                        </div>
                        <p style="color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px;">본 전자서명 링크는 해당 계약 파기 또는 체결 완료 시까지 유효합니다.</p>
                    </div>
                `
            });
            if (error) throw error;
        }

        const supabase = getServiceSupabase();
        if (supabase) {
           await supabase.from('contracts').update({ status: 'waiting_other' }).eq('id', contractId);
        }

        revalidatePath('/contracts');
        revalidatePath(`/contracts/${contractId}`);

        return { success: true };
    } catch (error: any) {
        throw new Error(`이메일 발송 실패: ${error.message}`);
    }
}

export async function sendContractAlimtalk(phone: string, link: string) {
    console.log(`[Alimtalk 발송 로직]: 폰번호 ${phone} 로 서명 링크 ${link} 발송 시도`);
    try {
        // 비즈니스 로직(fetch) 뼈대
        // const response = await fetch('https://api.alimtalk.vendor/send', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ phone, template: 'contract_sign_request', link })
        // });
        // if (!response.ok) throw new Error('API 응답 오류');
        
        console.log('[Alimtalk 발송 성공]');
        return { success: true };
    } catch (error: any) {
        throw new Error(`알림톡 발송 실패: ${error.message}`);
    }
}
