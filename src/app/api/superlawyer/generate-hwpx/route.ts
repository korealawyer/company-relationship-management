import { requireSessionFromCookie } from '@/lib/auth';
/**
 * HWPX 생성 API 엔드포인트
 * 
 * POST /api/superlawyer/generate-hwpx
 * 
 * Body: {
 *   content: string (마크다운 형식의 법률 의견서 본문)
 *   metadata?: {
 *     date?: string,
 *     caseNumber?: string,
 *     clientName?: string,
 *     opponentName?: string,
 *     lawyerName?: string,
 *     firmName?: string,
 *     caseTitle?: string,
 *     conclusion?: string,
 *   }
 * }
 * 
 * Response: HWPX 파일 바이너리 (application/octet-stream)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateOpinionHwpx } from '@/lib/hwpx/hwpx-engine';

interface GenerateHwpxBody {
  content: string;
  metadata?: {
    date?: string;
    caseNumber?: string;
    clientName?: string;
    opponentName?: string;
    lawyerName?: string;
    firmName?: string;
    caseTitle?: string;
    conclusion?: string;
  };
}

export async function POST(request: NextRequest) {
  const __auth = await requireSessionFromCookie(request as any);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

  try {
    const body: GenerateHwpxBody = await request.json();

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'content 필드가 필요합니다. (마크다운 문자열)' },
        { status: 400 }
      );
    }

    // HWPX 생성
    const hwpxBuffer = generateOpinionHwpx(
      body.content,
      body.metadata || {},
    );

    // 파일명 생성
    const dateStr = new Date().toISOString().split('T')[0];
    const caseNum = body.metadata?.caseNumber || 'draft';
    const filename = `법률의견서_${caseNum}_${dateStr}.hwpx`;

    // 바이너리 응답
    return new NextResponse(new Uint8Array(hwpxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(hwpxBuffer.length),
      },
    });
  } catch (error) {
    console.error('[generate-hwpx] Error:', error);
    return NextResponse.json(
      { error: 'HWPX 파일 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
