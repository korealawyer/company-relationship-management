// C1: AI 사용량 대시보드 API
import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { getUsageSummary, clearUsageLog } from '@/lib/aiUsage';

// GET: 사용량 요약 조회
export async function GET(req: NextRequest) {
    const auth = requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    return NextResponse.json(getUsageSummary());
}

// DELETE: 로그 초기화 (admin만)
export async function DELETE(req: NextRequest) {
    const auth = requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    clearUsageLog();
    return NextResponse.json({ ok: true, message: 'AI 사용량 로그가 초기화되었습니다.' });
}
