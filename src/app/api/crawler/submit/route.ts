import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-crawler-secret');
    if (!process.env.CRAWLER_SECRET_KEY || authHeader !== process.env.CRAWLER_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId, status, data, errorMsg, captchaFailed } = await req.json();

    if (!caseId) {
      return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (status === 'error') {
      if (captchaFailed) {
        // Fetch current fail count
        const { data: currentCase } = await supabase
          .from('cases')
          .select('captcha_fail_count')
          .eq('id', caseId)
          .single();

        const fails = (currentCase?.captcha_fail_count || 0) + 1;
        
        if (fails >= 5) {
          // 5회 이상 실패: 락 해제, 에러 상태로 변경
          await supabase.from('cases').update({
            crawling_status: 'error',
            locked_until: null,
            captcha_fail_count: fails
          }).eq('id', caseId);
        } else {
          // 재시도를 위해 락 제거
          await supabase.from('cases').update({
            crawling_status: 'idle',
            locked_until: null,
            captcha_fail_count: fails
          }).eq('id', caseId);
        }
      } else {
        // 일반 에러 발생 (사이트 마비, 비밀번호 변경 등)
        await supabase.from('cases').update({
          crawling_status: 'error',
          locked_until: null
        }).eq('id', caseId);
      }
      return NextResponse.json({ success: true, message: 'Error logged' });
    }

    // 성공 시 업데이트 로직 - 기존 notes 백업 후 appended string 저장
    const { data: currentCase } = await supabase
      .from('cases')
      .select('notes')
      .eq('id', caseId)
      .single();

    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const strData = data ? `\n- 진행 상태: ${data.progress || '알 수 없음'}\n- 다음 기일: ${data.nextDate || '알 수 없음'}\n- 기일 내역: ${data.nextEvent || '알 수 없음'}` : '';
    const crawledInfo = `\n\n[${timestamp} 대법원 크롤러 자동 업데이트]${strData}`;
    const newNotes = (currentCase?.notes || '') + crawledInfo;

    const { error: updateError } = await supabase.from('cases').update({
      crawling_status: 'idle',
      locked_until: null,
      last_crawled_at: new Date().toISOString(),
      captcha_fail_count: 0,
      notes: newNotes,
    }).eq('id', caseId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('submit API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
