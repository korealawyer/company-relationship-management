// src/lib/ai.ts — AI 공통 유틸리티
// C2: 모델 어댑터 패턴 + C1: 사용량 추적 통합

import { trackUsage } from './aiUsage';

// ── 환경 변수 ─────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const AI_PROVIDER = (process.env.AI_PROVIDER || 'claude') as 'claude' | 'openai' | 'gemini';
const AI_MODEL = process.env.AI_MODEL || '';
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 30_000;

// ── C2: Provider 설정 ─────────────────────────────────────────
interface ProviderConfig {
    url: string;
    apiKey: string;
    defaultModel: string;
    authHeader: string;
    extraHeaders: Record<string, string>;
    buildBody: (model: string, system: string, messages: { role: string; content: string }[], maxTokens: number, temperature?: number) => Record<string, unknown>;
    extractResult: (data: Record<string, unknown>) => { text: string; inputTokens: number; outputTokens: number; model: string };
}

const PROVIDERS: Record<string, ProviderConfig> = {
    claude: {
        url: 'https://api.anthropic.com/v1/messages',
        apiKey: ANTHROPIC_API_KEY,
        defaultModel: 'claude-sonnet-4-5',
        authHeader: 'x-api-key',
        extraHeaders: { 'anthropic-version': '2023-06-01' },
        buildBody: (model, system, messages, maxTokens, temperature) => {
            const body: Record<string, unknown> = { model, max_tokens: maxTokens, system, messages };
            if (temperature !== undefined) body.temperature = temperature;
            return body;
        },
        extractResult: (data) => ({
            text: ((data.content as { text: string }[])?.[0]?.text) || '',
            inputTokens: (data.usage as { input_tokens: number })?.input_tokens || 0,
            outputTokens: (data.usage as { output_tokens: number })?.output_tokens || 0,
            model: (data.model as string) || 'claude-sonnet-4-5',
        }),
    },
    openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        apiKey: OPENAI_API_KEY,
        defaultModel: 'gpt-4o',
        authHeader: 'Authorization',
        extraHeaders: {},
        buildBody: (model, system, messages, maxTokens, temperature) => ({
            model,
            max_tokens: maxTokens,
            messages: [{ role: 'system', content: system }, ...messages],
            ...(temperature !== undefined ? { temperature } : {}),
        }),
        extractResult: (data) => ({
            text: ((data.choices as { message: { content: string } }[])?.[0]?.message?.content) || '',
            inputTokens: (data.usage as { prompt_tokens: number })?.prompt_tokens || 0,
            outputTokens: (data.usage as { completion_tokens: number })?.completion_tokens || 0,
            model: (data.model as string) || 'gpt-4o',
        }),
    },
    gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        apiKey: GOOGLE_API_KEY,
        defaultModel: 'gemini-2.0-flash',
        authHeader: '',
        extraHeaders: {},
        buildBody: (model, system, messages, maxTokens) => ({
            model,
            system_instruction: { parts: [{ text: system }] },
            contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
            generationConfig: { maxOutputTokens: maxTokens },
        }),
        extractResult: (data) => ({
            text: ((data.candidates as { content: { parts: { text: string }[] } }[])?.[0]?.content?.parts?.[0]?.text) || '',
            inputTokens: (data.usageMetadata as { promptTokenCount: number })?.promptTokenCount || 0,
            outputTokens: (data.usageMetadata as { candidatesTokenCount: number })?.candidatesTokenCount || 0,
            model: 'gemini-2.0-flash',
        }),
    },
};

/** 현재 활성 AI 키 존재 여부 */
export const hasAIKey = !!(ANTHROPIC_API_KEY || OPENAI_API_KEY || GOOGLE_API_KEY);

/** 현재 사용 중인 AI 프로바이더 이름 */
export const currentProvider = AI_PROVIDER;

/** API 호출 결과 */
export interface AIResult {
    text: string;
    usage: { input: number; output: number };
    model: string;
    durationMs: number;
    provider: string;
}

/** Claude/OpenAI/Gemini 호출 옵션 */
export interface CallClaudeOptions {
    system: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
    maxTokens?: number;
    maxRetries?: number;
    timeoutMs?: number;
    temperature?: number;
    /** C1: 사용량 추적용 엔드포인트 이름 */
    endpoint?: string;
}

/**
 * AI 모델 호출 (C2: Provider 자동 선택, Retry + Timeout + C1: 사용량 추적)
 */
export async function callClaude(opts: CallClaudeOptions): Promise<AIResult> {
    const {
        system,
        messages,
        maxTokens = 4096,
        maxRetries = DEFAULT_MAX_RETRIES,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        temperature,
        endpoint = 'unknown',
    } = opts;

    const provider = PROVIDERS[AI_PROVIDER] || PROVIDERS.claude;
    if (!provider.apiKey) throw new Error(`${AI_PROVIDER} API key not configured`);

    const model = AI_MODEL || provider.defaultModel;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const start = Date.now();
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            const body = provider.buildBody(model, system, messages, maxTokens, temperature);
            const headers: Record<string, string> = {
                'content-type': 'application/json',
                ...provider.extraHeaders,
            };

            let url = provider.url;
            if (AI_PROVIDER === 'gemini') {
                url = url.replace('{model}', model) + `?key=${provider.apiKey}`;
            } else if (provider.authHeader === 'Authorization') {
                headers[provider.authHeader] = `Bearer ${provider.apiKey}`;
            } else {
                headers[provider.authHeader] = provider.apiKey;
            }

            const resp = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            clearTimeout(timer);
            const durationMs = Date.now() - start;

            if (!resp.ok) {
                const errText = await resp.text().catch(() => '');
                if ((resp.status === 429 || resp.status >= 500) && attempt < maxRetries - 1) {
                    const backoff = Math.min(1000 * Math.pow(2, attempt), 8000);
                    await new Promise(r => setTimeout(r, backoff));
                    lastError = new Error(`HTTP ${resp.status}: ${errText}`);
                    continue;
                }
                // C1: 실패 기록
                trackUsage({ endpoint, model, inputTokens: 0, outputTokens: 0, durationMs, success: false, error: `${resp.status}` });
                throw new Error(`${AI_PROVIDER} API error ${resp.status}: ${errText}`);
            }

            const data = await resp.json();
            const result = provider.extractResult(data);

            // C1: 성공 기록
            trackUsage({
                endpoint, model: result.model,
                inputTokens: result.inputTokens, outputTokens: result.outputTokens,
                durationMs, success: true,
            });

            return {
                text: result.text,
                usage: { input: result.inputTokens, output: result.outputTokens },
                model: result.model,
                durationMs,
                provider: AI_PROVIDER,
            };
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (lastError.name === 'AbortError') {
                lastError = new Error(`${AI_PROVIDER} API timeout after ${timeoutMs}ms`);
                trackUsage({ endpoint, model, inputTokens: 0, outputTokens: 0, durationMs: timeoutMs, success: false, error: 'timeout' });
            }
            if (attempt < maxRetries - 1) {
                const backoff = Math.min(1000 * Math.pow(2, attempt), 8000);
                await new Promise(r => setTimeout(r, backoff));
                continue;
            }
        }
    }

    throw lastError || new Error('AI call failed after retries');
}

/**
 * AI 응답에서 JSON 추출 + 파싱
 */
export function parseAIJson<T>(raw: string, fallback: T): T {
    try {
        return JSON.parse(raw) as T;
    } catch {
        const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlock) {
            try { return JSON.parse(codeBlock[1].trim()) as T; } catch { /* fallthrough */ }
        }
        const braceMatch = raw.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            try { return JSON.parse(braceMatch[0]) as T; } catch { /* fallthrough */ }
        }
        const bracketMatch = raw.match(/\[[\s\S]*\]/);
        if (bracketMatch) {
            try { return JSON.parse(bracketMatch[0]) as T; } catch { /* fallthrough */ }
        }
        return fallback;
    }
}

/**
 * Mock 지연
 */
export function mockDelay(ms = 1000): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}
