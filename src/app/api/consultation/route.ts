import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { companyName, employeeCount, contactName, phone, email, inquiryType, details } = body;

        // Use service role supabase to bypass RLS for public submissions
        const sb = getServiceSupabase() || (await import('@/lib/supabase').then(m => m.supabase));
        if (!sb) {
            return NextResponse.json({ error: '데이터베이스 연결을 실패했습니다.' }, { status: 500 });
        }

        const companyId = crypto.randomUUID();
        const now = new Date().toISOString();

        // 1. 기업 정보(Lead) 저장
        const { error: companyError } = await sb.from('companies').insert({
            id: companyId,
            name: companyName || '미상(진단요청)',
            biz_no: `CONSULT-${Date.now()}`,
            contact_name: contactName || '',
            contact_phone: phone || '',
            contact_email: email || '',
            store_count: 0,
            status: 'pending',
            plan: 'none',
            risk_score: 0,
            issue_count: 0,
            source: 'consultation',
            created_at: now,
            updated_at: now,
        });

        if (companyError) {
            console.error('[Consultation API] Supabase company insert error:', companyError);
            return NextResponse.json({ error: '기업 정보 등록 중 오류가 발생했습니다.', debug: companyError.message || JSON.stringify(companyError) }, { status: 500 });
        }

        // 2. 진단(상담) 내역 저장
        const consultId = crypto.randomUUID();
        const { error: consultError } = await sb.from('consultations').insert({
            id: consultId,
            company_id: companyId,
            company_name: companyName || '미상(진단요청)',
            branch_name: '',
            author_name: contactName || '',
            author_role: '임직원',
            category: inquiryType || '기타',
            urgency: 'normal',
            title: `[사전 진단 신청] ${companyName} - ${inquiryType || '법률 자문'}`,
            body: `[선택한 직원수] ${employeeCount || '선택 안함'}\n\n[상세 내역 및 요청사항]\n${details || '내용 없음'}`,
            status: 'submitted',
            created_at: now,
            updated_at: now,
            is_private: true
        });

        if (consultError) {
            console.error('[Consultation API] Supabase consultation insert error:', consultError);
            // Even if consultation fails, company was created. Not ideal but acceptable for simple flow.
            return NextResponse.json({ error: '상담 내역 등록 중 오류가 발생했습니다.', debug: consultError.message || JSON.stringify(consultError) }, { status: 500 });
        }

        return NextResponse.json({ ok: true, message: '진단 요청이 성공적으로 접수되었습니다.' });

    } catch (err: any) {
        console.error('[Consultation API] Server error:', err);
        return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
