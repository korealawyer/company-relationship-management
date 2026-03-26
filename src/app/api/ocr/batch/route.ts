import { requireSessionFromCookie } from '@/lib/auth';
// ── Batch OCR API Route ──────────────────────────────────
// POST /api/ocr/batch — 여러 파일 배치 처리
// 각 파일별 결과 배열 반환, 개별 에러 시 해당 파일만 에러 처리

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const __auth = await requireSessionFromCookie(req as any);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

  try {
    const formData = await req.formData();
    const files: File[] = [];
    const mode = (formData.get('mode') as string) || 'document';

    // 여러 파일 추출
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: '파일이 필요합니다.' },
        { status: 400 },
      );
    }

    if (files.length > 20) {
      return NextResponse.json(
        { error: '한 번에 최대 20개 파일만 처리할 수 있습니다.' },
        { status: 400 },
      );
    }

    // 각 파일을 개별적으로 /api/ocr 라우트에 전달
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const singleForm = new FormData();
        singleForm.append('file', file);
        singleForm.append('mode', mode);

        // 내부 API 호출 (같은 서버)
        const baseUrl = req.nextUrl.origin;
        const res = await fetch(`${baseUrl}/api/ocr`, {
          method: 'POST',
          body: singleForm,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `OCR 처리 실패 (${res.status})`);
        }

        return await res.json();
      }),
    );

    // 결과 정리
    const batchResults = results.map((r, i) => {
      if (r.status === 'fulfilled') {
        return {
          fileName: files[i].name,
          success: true,
          ...r.value,
        };
      } else {
        return {
          fileName: files[i].name,
          success: false,
          error: r.reason?.message || 'Unknown error',
        };
      }
    });

    const successCount = batchResults.filter(r => r.success).length;
    const failCount = batchResults.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      total: files.length,
      successCount,
      failCount,
      results: batchResults,
    });
  } catch (err) {
    console.error('[OCR Batch API] Error:', err);
    const message = err instanceof Error ? err.message : '배치 OCR 처리 오류';
    return NextResponse.json(
      { error: message, code: 'BATCH_OCR_ERROR' },
      { status: 500 },
    );
  }
}
