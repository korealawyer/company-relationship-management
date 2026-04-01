import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const auth = await requireSessionFromCookie(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body: { systemPrompt?: string; model?: string; apiKey?: string; memos: Array<{ author: string; content: string; created_at?: string }>; companyData?: any };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: '잘못된 요청 형식입니다. JSON Content-Type을 확인하세요.' },
            { status: 400 }
        );
    }

    const { systemPrompt, model, apiKey: clientApiKey, memos, companyData } = body;

    if (!memos || memos.length === 0) {
        return NextResponse.json(
            { success: false, error: '분석할 메모 데이터가 없습니다.' },
            { status: 400 }
        );
    }

    try {
        const apiKey = clientApiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn('[Analyze Memo API] OPENAI_API_KEY is not set. Returning mock response.');
            return NextResponse.json({
                success: true,
                result: {
                    summary: 'AI 요약 기능이 비활성화되어 있습니다 (API Key 미설정). 이전 기록을 참조하세요.',
                    keyPoints: ['API 설정 후 자동 요약 활성화'],
                    nextAction: '수동 분석 또는 담당자 팔로업',
                    nextActionType: 'follow_up_call',
                    confidence: 0
                }
            });
        }

        const formattedMemos = memos.map((m, i) => 
            `\n--- 메모 ${i + 1} ---\n작성자: ${m.author || '알수없음'}\n내용: ${m.content || ''}${m.created_at ? `\n작성일시: ${m.created_at}` : ''}`
        ).join('\n');

        const companyInfo = companyData ? `\n[기업 기본 정보]\n상태: ${companyData.status || '알수없음'}` : '';

        const finalPrompt = `${systemPrompt || '영업 메모를 분석하여 JSON 형식으로 반환하세요.'}\n${companyInfo}\n\n[소통 히스토리]\n${formattedMemos}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'gpt-4o-mini',
                temperature: 0.2, // 일관된 분석 결과를 위해 낮춤
                messages: [{ role: 'user', content: finalPrompt }],
                response_format: { type: "json_object" } // 확정적인 JSON 구조 반환 요건
            }),
        });

        if (!response.ok) {
            console.error('[Analyze Memo API] OpenAI Failure:', await response.text());
            return NextResponse.json(
                { success: false, error: 'AI 분석 서버의 응답 오류가 발생했습니다.' },
                { status: 502 }
            );
        }

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content || '{}';
        
        const parsedResult = JSON.parse(content);

        return NextResponse.json({
            success: true,
            result: parsedResult
        });

    } catch (error: any) {
        console.error('[Analyze Memo API] Unexpected Error:', error);
        return NextResponse.json(
            { success: false, error: 'AI 분석 중 예기치 않은 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
