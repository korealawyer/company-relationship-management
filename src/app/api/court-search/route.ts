import { requireSessionFromCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

/**
 * 대법원 나의사건검색 API (크롤러 큐 등록)
 */

// 간단한 인메모리 Rate Limiting (Vercel Serverless의 cold start 간에는 리셋되지만 어뷰징 임시 방지용)
const rateLimitMap = new Map<string, number>();

export async function POST(request: NextRequest) {
  const __auth = await requireSessionFromCookie(request);
  if (!__auth.ok) {
      return NextResponse.json({ error: __auth.error }, { status: __auth.status });
  }

  try {
      const body = await request.json();
      const caseNumber = body.caseNumber;

      if (!caseNumber) {
          return NextResponse.json({ error: '사건번호를 입력해주세요.' }, { status: 400 });
      }

      // 사건번호 정규화 (공백 제거)
      const normalized = caseNumber.replace(/\s/g, '');

      // Rate limit check: 1 request per 10 seconds per IP/User
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const rateKey = `${ip}_${normalized}`;
      const now = Date.now();
      const lastRequest = rateLimitMap.get(rateKey) || 0;
      
      if (now - lastRequest < 10000) {
          return NextResponse.json({ error: '요청이 너무 많습니다. 10초 후 다시 시도해주세요.' }, { status: 429 });
      }
      rateLimitMap.set(rateKey, now);

      const supabase = await getServerSupabase();
      if (!supabase) throw new Error('DB connection failed');

      const companyId = __auth.companyId;
      if (!companyId) {
          return NextResponse.json({ error: '소속 회사 정보가 없습니다.' }, { status: 403 });
      }

      // 1. Insert an empty search_only case into cases
      const { data: newCase, error: insertError } = await supabase
          .from('cases')
          .insert([{
              tenant_id: companyId,
              title: normalized,
              case_number: normalized,
              case_type: 'other',
              status: 'search_only'
          }])
          .select('id')
          .single();

      if (insertError) {
          // If already exists, we simply tell the client to listen via realtime
          if (insertError.code === '23505') {
              const { data: existing } = await supabase
                  .from('cases')
                  .select('id, status')
                  .eq('case_number', normalized)
                  .single();
                  
              return NextResponse.json({
                  success: true,
                  message: '이미 검색 진행 중이거나 등록된 사건입니다.',
                  caseId: existing?.id,
                  status: existing?.status
              });
          }
          console.error('[court-search] Insert error:', insertError);
          return NextResponse.json({ error: '사건 등록 중 오류가 발생했습니다.' }, { status: 500 });
      }

      // 성공: 클라이언트는 즉시 반환받고 Supabase Realtime으로 대기함
      return NextResponse.json({
          success: true,
          message: '크롤링 대기열에 등록되었습니다. 실시간으로 결과를 수신합니다.',
          caseId: newCase.id
      });
  } catch (error) {
      console.error('[court-search] Server error:', error);
      return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// GET: 등록된 사건번호 (search_only 상태 등) 목록 반환 (관리용)
export async function GET(req: NextRequest) {
  const __auth = await requireSessionFromCookie(req);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });
  
  const supabase = await getServerSupabase();
  if(!supabase) return NextResponse.json({cases: []});
  
  const { data } = await supabase
      .from('cases')
      .select('case_number, title, status')
      .eq('tenant_id', __auth.companyId)
      .eq('status', 'search_only')
      .order('created_at', { ascending: false })
      .limit(20);
  
  const cases = (data || []).map(c => ({
      caseNumber: c.case_number,
      caseName: c.title,
      status: c.status,
  }));
  
  return NextResponse.json({ cases });
}
