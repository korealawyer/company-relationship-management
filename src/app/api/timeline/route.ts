import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { companyId, author, content, type } = body;

        if (!companyId || !content || !type) {
            return NextResponse.json({ error: '필수 입력 항목 누락' }, { status: 400 });
        }

        const supabase = await getServerSupabase();
        if (!supabase) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
            return NextResponse.json({ error: '서버 환경 설정 오류' }, { status: 500 });
        }

        const { data, error } = await supabase.from('timeline').insert([{
            company_id: companyId,
            author: author || '시스템',
            content,
            type,
            created_at: new Date().toISOString()
        }]);

        if (error) {
            console.error('Timeline Event API error:', error);
            return NextResponse.json({ error: '이벤트 기록 중 오류 발생' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });

    } catch (err: any) {
        console.error('Timeline POST API error:', err);
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}
