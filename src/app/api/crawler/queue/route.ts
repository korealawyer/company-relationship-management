import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('x-crawler-secret');
    if (!process.env.CRAWLER_SECRET_KEY || authHeader !== process.env.CRAWLER_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 서비스 역할 키를 사용하여 모든 테넌트의 사건 접근 권한 획득
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 가져올 타겟 조회
    // 잠금 상태가 아니거나, 락이 끝났고 에러가 아닌 활성 사건들 5개 추출
    const { data: cases, error: fetchError } = await supabase
      .from('cases')
      .select('id, case_number, title, tenant_id')
      .eq('status', 'active')
      .neq('crawling_status', 'error') // 연속 에러된 건은 일단 패스
      .or('locked_until.is.null,locked_until.lt.now()')
      .order('last_crawled_at', { ascending: true, nullsFirst: true })
      .limit(5);

    if (fetchError) {
      throw fetchError;
    }

    if (!cases || cases.length === 0) {
      return NextResponse.json({ cases: [] });
    }

    // 2. 락 설정 (현재 시간 + 10분)
    const caseIds = cases.map((c) => c.id);
    const tenMinsLater = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: lockError } = await supabase
      .from('cases')
      .update({
        crawling_status: 'processing',
        locked_until: tenMinsLater
      })
      .in('id', caseIds);

    if (lockError) {
      throw lockError;
    }

    return NextResponse.json({ cases });

  } catch (error: any) {
    console.error('queue API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
