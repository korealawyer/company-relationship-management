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
        const targetModel = model || 'gpt-4o-mini';
        let resolvedApiKey = clientApiKey;

        if (targetModel.includes('claude')) {
            resolvedApiKey = clientApiKey || process.env.ANTHROPIC_API_KEY;
        } else if (targetModel.includes('gemini')) {
            resolvedApiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        } else {
            resolvedApiKey = clientApiKey || process.env.OPENAI_API_KEY;
        }

        if (!resolvedApiKey) {
            console.warn(`[Analyze Memo API] API_KEY is not set for model = ${targetModel}. Returning mock response.`);
            return NextResponse.json({
                success: true,
                result: {
                    summary: '요약 기능이 비활성화되어 있습니다',
                    keyPoints: ['관리자에게 문의하거나 API 키를 설정해주세요'],
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

        let content = '';

        if (targetModel.includes('claude')) {
            const anthropicKey = resolvedApiKey;
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'x-api-key': anthropicKey
                },
                body: JSON.stringify({
                    model: targetModel === 'claude-3-opus' ? 'claude-3-opus-20240229' : 'claude-3-5-sonnet-20241022',
                    max_tokens: 2048,
                    system: '반드시 순수 JSON 스키마에 맞게 응답을 생성해야 하며, 앞뒤로 백틱(```)이나 부가 설명을 절대 포함하지 마세요.',
                    messages: [{ role: 'user', content: finalPrompt }]
                }),
            });

            if (!response.ok) {
                console.error('[Analyze Memo API] Anthropic Failure:', await response.text());
                return NextResponse.json(
                    { success: false, error: 'AI 모델(Anthropic) 호출에 실패했습니다.' },
                    { status: 502 }
                );
            }
            const aiData = await response.json();
            content = aiData.content?.[0]?.text || '';
        } else if (targetModel.includes('gemini')) {
            const geminiKey = resolvedApiKey;
            const geminiModel = targetModel === 'gemini-1.5-pro' ? 'gemini-1.5-pro' : 'gemini-2.0-flash';
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: '반드시 마크다운 백틱(```json) 없이 순수 JSON 자체만 반환할 것.' }] },
                    contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
                    generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
                }),
            });

            if (!response.ok) {
                console.error('[Analyze Memo API] Gemini Failure:', await response.text());
                return NextResponse.json(
                    { success: false, error: 'AI 모델(Gemini) 호출에 실패했습니다.' },
                    { status: 502 }
                );
            }
            const aiData = await response.json();
            content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${resolvedApiKey}`
                },
                body: JSON.stringify({
                    model: targetModel,
                    temperature: 0.2,
                    messages: [{ role: 'user', content: finalPrompt }],
                    response_format: { type: "json_object" }
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
            content = aiData.choices?.[0]?.message?.content || '{}';
        }
        
        // Handle markdown JSON block
        const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(cleanContent);

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
