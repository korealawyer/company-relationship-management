import { requireSessionFromCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const __auth = await requireSessionFromCookie(req as any);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

  try {
    // 1. URL에서 쿼리 파라미터 가져오기 (?date=YYYY-MM-DD)
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get('date');

    // 2. 파라미터 검증
    if (!date) {
      return NextResponse.json(
        { error: '날짜 파라미터(date)가 없습니다. (예: ?date=2024-05-20)' },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: '올바른 날짜 포맷이 아닙니다. (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // 3. 하드코딩된 더미 예약 가능 시간대 배열
    // - 향후 DB나 실제 캘린더를 연동하여 조회하는 로직으로 대체 가능합니다.
    const dummyAvailableSlots = [
      '10:00',
      '11:00',
      '14:00',
      '15:00',
      '16:00',
    ];

    // 4. 결과 반환
    return NextResponse.json({
      date,
      availableSlots: dummyAvailableSlots,
      message: '예약 가능한 시간대를 성공적으로 조회했습니다.',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Available Slots Check Error:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
