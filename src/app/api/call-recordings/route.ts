import { requireSessionFromCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// GET /api/call-recordings?company_id=xxx — 기업별 녹음 내역 조회
export async function GET(request: NextRequest) {
  const __auth = await requireSessionFromCookie(request as any);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');

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

    // 1. Upload to Supabase Storage
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${companyId}/${Date.now()}_call.webm`;

    const adminSupabase = getServiceSupabase() || supabase;
    if (!adminSupabase) {
      throw new Error('Supabase client is not initialized.');
    }

    // Attempt to create bucket if it does not exist
    try {
        await adminSupabase.storage.createBucket('call-recordings', { public: true });
    } catch (e) {
        // bucket might already exist, ignore error
    }

    const { error: uploadError } = await adminSupabase.storage
      .from('call-recordings')
      .upload(fileName, buffer, {
        contentType: audioFile.type || 'audio/webm',
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error(`오디오 파일 업로드에 실패했습니다. 상세: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = adminSupabase.storage
      .from('call-recordings')
      .getPublicUrl(fileName);

    // 2. OpenAI Whisper STT 변환
    let transcript = '';
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "ko"
      });
      transcript = transcription.text;
    } catch (e) {
      console.error('STT Error:', e);
      transcript = '(음성 인식 실패 - 내용을 확인할 수 없습니다)';
    }

    const summaryPrompt = formData.get('systemPrompt') as string || '';

    // 3. OpenAI GPT-4o-mini 요약
    let summary = '';
    try {
      const defaultSummaryPrompt = `당신은 법무법인 B2B 영업 통화 기록을 분석하는 최고 수준의 AI 어시스턴트입니다.
제공된 통화 스크립트를 바탕으로 다음을 작성해주세요:
- [주요 내용]: 통화의 주 목적과 주요 논의 사항 (2~3문장 이내)
- [니즈 및 페인포인트]: 고객이 겪고 있는 문제나 필요로 하는 사항
- [다음 액션 아이템]: 영업 담당자가 취해야 할 명확한 다음 단계 (Next step)

Markdown 형식을 사용하여 짧고 직관적으로 작성해주세요.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: summaryPrompt || defaultSummaryPrompt
          },
          {
            role: "user",
            content: transcript
          }
        ],
        temperature: 0.3
      });
      summary = completion.choices[0].message.content || '요약 결과를 생성하지 못했습니다.';
    } catch (e) {
      console.error('Summary Error:', e);
      summary = '(AI 요약 실패)';
    }

    return NextResponse.json({
      success: true,
      transcript,
      summary,
      audioUrl: publicUrl,
      companyId,
      durationSeconds,
      fileSize: audioFile.size,
    });
  } catch (err: any) {
    console.error('API /call-recordings POST Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
