import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Supabase 클라이언트 초기화 (요청 시마다 최신 env 반영)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey || supabaseKey.includes('여기에')) {
      supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
    const supabase = createClient(supabaseUrl, supabaseKey || '');
    
    const body = await req.json();
    const { client_name, client_email, client_phone, company_name, consultation_type, scheduled_at } = body;

    // 1. 필수 값 검증
    if (!client_name || !client_email || !client_phone || !consultation_type || !scheduled_at) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다. (이름, 이메일, 연락처, 상담유형, 예약시간)' },
        { status: 400 }
      );
    }

    // 상담 유형 검증
    const validTypes = ['기업 자문', '계약서 검토', '일반 분쟁'];
    if (!validTypes.includes(consultation_type)) {
      return NextResponse.json(
        { error: '유효하지 않은 상담유형입니다. (기업 자문, 계약서 검토, 일반 분쟁 중 하나)' },
        { status: 400 }
      );
    }

    // 2. Zoom Access Token 발급 (Server-to-Server OAuth)
    let accessToken: string;
    try {
      const accountId = process.env.ZOOM_ACCOUNT_ID;
      const clientId = process.env.ZOOM_CLIENT_ID;
      const clientSecret = process.env.ZOOM_CLIENT_SECRET;
      
      if (!accountId || !clientId || !clientSecret) {
        throw new Error('Zoom API 환경 변수가 설정되지 않았습니다.');
      }

      const tokenResponse = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || tokenData.reason || 'Unknown token error');
      }
      accessToken = tokenData.access_token;
    } catch (error: any) {
      console.error('Zoom Token Error:', error);
      return NextResponse.json({ error: 'Zoom 토큰 발급에 실패했습니다.', details: error.message }, { status: 500 });
    }

    // 3. Zoom 미팅 생성
    let meetingData: any;
    try {
      const topic = `[${consultation_type}] ${client_name}님 화상 상담`;
      const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          type: 2, // 일반 예약 미팅 (Scheduled meeting)
          start_time: new Date(scheduled_at).toISOString(),
          duration: 60, // 기본 60분
          timezone: 'Asia/Seoul',
          settings: {
            waiting_room: true,        // 대기실 활성화
            join_before_host: false,   // 호스트 전 참가 비활성화
          },
        }),
      });

      meetingData = await meetingResponse.json();
      if (!meetingResponse.ok) {
        throw new Error(meetingData.message || 'Unknown meeting creation error');
      }
    } catch (error: any) {
      console.error('Zoom Meeting Creation Error:', error);
      return NextResponse.json({ error: 'Zoom 미팅 생성에 실패했습니다.', details: error.message }, { status: 500 });
    }

    // 4. Supabase DB 레코드 생성
    const { data: dbData, error: dbError } = await supabase
      .from('zoom_consultations')
      .insert({
        client_name,
        client_email,
        client_phone,
        company_name: company_name || null,
        consultation_type,
        scheduled_at,
        zoom_meeting_id: meetingData.id.toString(),
        zoom_join_url: meetingData.join_url,
        status: 'scheduled',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase DB Insert Error:', dbError);
      return NextResponse.json({ error: '데이터베이스 저장에 실패했습니다.', details: dbError.message }, { status: 500 });
    }

    // 5. 최종 결과 반환
    return NextResponse.json({
      message: 'Zoom 미팅 예약이 성공적으로 완료되었습니다.',
      data: dbData,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Server Internal Error:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.', details: error.message }, { status: 500 });
  }
}
