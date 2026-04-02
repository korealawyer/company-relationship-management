import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

export async function POST(req: NextRequest) {
    try {
        const { memoId, transcript, memoContent } = await req.json();
        
        let summary = '';
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `당신은 법무법인 B2B 영업 통화 기록을 분석하는 최고 수준의 AI 어시스턴트입니다.
제공된 통화 스크립트를 바탕으로 다음을 작성해주세요:
- [주요 내용]: 통화의 주 목적과 주요 논의 사항 (2~3문장 이내)
- [니즈 및 페인포인트]: 고객이 겪고 있는 문제나 필요로 하는 사항
- [다음 액션 아이템]: 영업 담당자가 취해야 할 명확한 다음 단계 (Next step)

Markdown 형식을 사용하여 짧고 직관적으로 작성해주세요.`
                    },
                    {
                        role: "user",
                        content: `다음은 통화 스크립트 전문입니다:\n\n${transcript}\n\n위의 통화 내용을 바탕으로 분석 리포트를 작성해주세요. (경고: 내용이 의미 없더라도 대화형으로 응답하지 말고, 발견된 정보가 없으면 '분석할 의미 있는 대화 내용이 없습니다.' 라고만 요약할 것)`
                    }
                ],
                temperature: 0.3
            });
            summary = completion.choices[0].message.content || '요약 결과를 생성하지 못했습니다.';
        } catch (e) {
            console.error('Re-Summarize Error', e);
            summary = '(AI 요약 실패)';
        }

        // Reconstruct content
        const parts = memoContent.split('[AI 요약]');
        const preamble = parts[0];
        const newContent = `${preamble}[AI 요약]\n${summary}\n\n[전문]\n${transcript}`;

        const sb = getServiceSupabase();
        if (sb) {
            await sb.from('company_memos').update({ content: newContent }).eq('id', memoId);
        }

        return NextResponse.json({ success: true, newContent });
    } catch (e: any) {
        console.error('API Error', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
