import { requireSessionFromCookie } from '@/lib/auth';
// src/app/api/call-recordings/route.ts — 통화 녹음 API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/call-recordings?company_id=xxx — 기업별 녹음 내역 조회
export async function GET(request: NextRequest) {
  const __auth = await requireSessionFromCookie(request as any);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    // Phase 2: Supabase에서 직접 조회
    // 현재는 클라이언트 localStorage 기반이므로 204 반환
    return NextResponse.json({
        message: 'Client-side localStorage 기반. 서버 API는 Phase 2에서 Supabase 연동 예정.',
        companyId,
    });
}

// POST /api/call-recordings — 녹음 업로드 + STT 처리
export async function POST(request: NextRequest) {
  const __auth = await requireSessionFromCookie(request as any);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File | null;
        const companyId = formData.get('company_id') as string;
        const durationSeconds = parseInt(formData.get('duration_seconds') as string) || 0;

        if (!audioFile || !companyId) {
            return NextResponse.json(
                { error: 'audio 파일과 company_id가 필요합니다.' },
                { status: 400 }
            );
        }

        // Phase 2: Supabase Storage에 업로드
        // Phase 2: Google STT / Whisper API 호출
        // 현재는 클라이언트 Mock STT 사용

        return NextResponse.json({
            success: true,
            message: 'Phase 2에서 서버 STT 처리 예정. 현재는 클라이언트 Mock STT 사용.',
            companyId,
            durationSeconds,
            fileSize: audioFile.size,
        });
    } catch (err) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
