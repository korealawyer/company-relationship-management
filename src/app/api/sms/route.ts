import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, reason, amount } = body;

    // 1. 유효성 검사
    if (!reason || !amount) {
      return NextResponse.json(
        { success: false, error: '청구 사유와 금액이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 2. 외부 SMS API 호출 로직 (추상화)
    // 예: Aligo, Twilio, Sens 등의 클라이언트를 사용하여 메시지 송신
    // const smsResponse = await sendSMS({
    //   to: phone,
    //   message: `[IBS 로펌] ${reason} 청구 금액 ${amount}원 결제가 필요합니다.`
    // });

    // 외부 연동을 흉내 내기 위한 딜레이 추가
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 3. 결제 링크 생성 및 결과 반환
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const paymentLink = `ibs.law/pay/${randomCode}`;

    return NextResponse.json({
      success: true,
      data: {
        paymentLink,
        message: 'SMS 결제 링크 발송이 성공적으로 완료되었습니다.',
        sentTo: phone
      }
    });
  } catch (error) {
    console.error('SMS API 발송 실패:', error);
    return NextResponse.json(
      { success: false, error: '서버 에러로 인하여 SMS 발송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
