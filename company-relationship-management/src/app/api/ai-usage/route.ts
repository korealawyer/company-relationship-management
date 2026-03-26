// C1: AI 사용량 대시보드 API
import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { getUsageSummary, clearUsageLog } from '@/lib/aiUsage';

// GET: 사용량 요약 조회
export async function GET(req: NextRequest) {
    const auth = await requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    return NextResponse.json(getUsageSummary());
}

// DELETE: 로그 초기화 (admin만)
export async function DELETE(req: NextRequest) {
    const auth = await requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // SEC-FIX: RBAC 관리자 체크 누락 패치
    if (auth.role !== 'admin' && auth.role !== 'super_admin') {
        return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    clearUsageLog();
    return NextResponse.json({ ok: true, message: 'AI 사용량 로그가 초기화되었습니다.' });
}
