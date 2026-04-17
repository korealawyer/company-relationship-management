import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// Vercel cron job to clean up old 'search_only' records
// This prevents database bloat from users simply searching their cases without registering.
export async function GET(request: Request) {
    // Basic security block if you configure VERCEL_CRON_SECRET in your Vercel project
    const authHeader = request.headers.get('authorization');
    if (process.env.VERCEL_CRON_SECRET) {
        if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const supabase = await getServerSupabase();
        if (!supabase) throw new Error('DB connection failed');
        
        // 7일 전 시간 계산
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const isoString = sevenDaysAgo.toISOString();

        // 7일이 지난 search_only 항목 삭제
        const { count, error } = await supabase
            .from('cases')
            .delete({ count: 'exact' })
            .eq('status', 'search_only')
            .lt('created_at', isoString);

        if (error) {
            console.error('[cron/gc] error deleting old cases', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            deletedCount: count,
            message: 'Garbage collection completed'
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
