import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, summaryData, caseId, consultType, companyId } = body;

        if (!summaryData) {
            return NextResponse.json({ error: 'Summary data is required' }, { status: 400 });
        }

        // Use service role supabase to bypass RLS for now, creating a new record
        const sb = getServiceSupabase() || (await import('@/lib/supabase').then(m => m.supabase));
        if (!sb) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const now = new Date().toISOString();
        
        // 5W1H 데이터를 가독성 좋은 텍스트로 가공
        const formattedContent = [
            `[사전 인터뷰 요약]`,
            `분야: ${summaryData.category || '미상'}`,
            `사건: ${summaryData.case || summaryData.event || '미상'}`,
            `상황: ${summaryData.situation || '미상'}`,
            `목적: ${summaryData.purpose || summaryData.goal || '미상'}`
        ].join('\n');

        const title = `[AI 사전 상담] ${consultType === 'legal' ? '법률 자문' : consultType} - ${caseId}`;

        // consultations 테이블에 INSERT
        const insertPayload: any = {
            category: summaryData.category || '기타',
            title: title,
            content: formattedContent,
            ai_draft: JSON.stringify(summaryData, null, 2),
            chat_history: messages,
            status: 'submitted',
            created_at: now,
            updated_at: now,
        };

        if (companyId) {
            insertPayload.company_id = companyId;
        }

        const { data, error: consultError } = await sb.from('consultations').insert(insertPayload).select().single();

        if (consultError) {
            console.error('[Chat Save API] Supabase insert error:', consultError);
            return NextResponse.json({ error: '상담 내역 저장 중 오류가 발생했습니다.', debug: consultError }, { status: 500 });
        }

        return NextResponse.json({ ok: true, message: '상담 내역이 성공적으로 저장되었습니다.', data });

    } catch (err: any) {
        console.error('[Chat Save API] Server error:', err);
        return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
