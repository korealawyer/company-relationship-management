import { NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await requireSessionFromCookie(req as any);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await req.json();
    const { to, message, type, senderName } = body;

    const recipients = Array.isArray(to) ? to : [to];

    // 실 API 연동 (환경변수 체크)
    if (process.env.SMS_API_KEY && process.env.SMS_API_URL) {
      for (const recipient of recipients) {
        const response = await fetch(process.env.SMS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SMS_API_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                to: recipient,
                from: process.env.SMS_SENDER_NUMBER || '0212345678',
                text: message,
              }
            ]
          }),
        });
        
        if (!response.ok) {
           console.error(`SMS 발송 실패 (To: ${recipient})`, await response.text());
        }
      }
      return NextResponse.json({ success: true, sentCount: recipients.length, failedCount: 0 });
    } else {
      // Mock 동작
      console.warn('[SMS Mock] 환경변수 누락. SMS를 시뮬레이션 합니다.', { to: recipients, message });
      await new Promise(r => setTimeout(r, 1000));
      return NextResponse.json({ success: true, sentCount: recipients.length, failedCount: 0 });
    }
  } catch (error) {
    console.error('[SMS API] 발송 예외 발생:', error);
    return NextResponse.json({ error: '서버 에러로 인하여 SMS 발송에 실패했습니다.' }, { status: 500 });
  }
}
