// src/app/api/analyze/report/route.ts
import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { getPromptConfig, DEFAULT_PROMPT_CONFIG } from '@/lib/prompts/privacy';

export const maxDuration = 60; // 60 seconds for complex markdown generation
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { issues, companyName, _promptConfig } = await req.json();

        if (!issues || !Array.isArray(issues)) {
            return NextResponse.json({ error: '유효한 issues 배열이 필요합니다.' }, { status: 400 });
        }

        // 1. 프롬프트 세팅 로드
        const config = _promptConfig || DEFAULT_PROMPT_CONFIG;
        const rawPrompt = config.generateAuditReportPrompt || DEFAULT_PROMPT_CONFIG.generateAuditReportPrompt;

        // 2. 변수 치환
        const issuesJson = JSON.stringify(issues, null, 2);
        const finalPrompt = rawPrompt
            .replace('{{companyName}}', companyName || '의뢰인 기업')
            .replace('{{issuesJson}}', issuesJson);

        // 3. 모델 선택 (기본적으로 Anthropic Claude 3.5 Sonnet이 이런 실사 보고서 작성에 우수함, 혹은 GPT-4o 사용)
        const activeModelId = config.model || 'gpt-4o';
        const apiKey = process.env.OPENAI_API_KEY;
        const anthropicKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey && !anthropicKey) {
             return NextResponse.json({ error: 'AI API Key 누락' }, { status: 500 });
        }

        let model;
        if (activeModelId.includes('claude') && anthropicKey) {
            const anthropic = createAnthropic({ apiKey: anthropicKey });
            model = anthropic(activeModelId);
        } else if (apiKey) {
            const openai = createOpenAI({ apiKey });
            // fallback to openai if claude selected but no key
            const actualModelId = activeModelId.includes('claude') ? 'gpt-4o' : activeModelId;
            model = openai(actualModelId);
        } else {
             return NextResponse.json({ error: '적합한 API Key 없음' }, { status: 500 });
        }

        // 4. AI 생성 요청
        const { text } = await generateText({
            model,
            prompt: finalPrompt,
            temperature: 0.2, // 보수적이고 일관된 톤 유지
            maxTokens: 4096, // 긴 문서 생성 허용
        });

        // 결과 마크다운 텍스트 반환
        return NextResponse.json({ 
            success: true, 
            reportMarkdown: text.trim() 
        });

    } catch (error: any) {
        console.error('[API] Report Generation Error:', error);
        return NextResponse.json({ 
            error: '보고서 생성 중 오류 발생',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
