import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// POST /api/admin/cron
// RLS Bypass가 필요한 크론잡 전용 격리 엔드포인트
export async function POST(req: NextRequest) {
    const cronSecret = req.headers.get('x-admin-cron-secret');
    const expectedSecret = process.env.CRON_SECRET || 'dev-cron-secret';

    if (cronSecret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized CRON execution' }, { status: 401 });
    }

    const sb = getServiceSupabase();
    if (!sb) {
        return NextResponse.json({ error: 'Service Role Key is not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { action } = body;

        // 크론잡 동작 예시
        if (action === 'daily_sync') {
            // Service Role Key를 사용한 안전한 배경 작업
            return NextResponse.json({ success: true, message: 'Daily sync executed securely via Service Role.' });
        }

        return NextResponse.json({ error: 'Unknown CRON action' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
