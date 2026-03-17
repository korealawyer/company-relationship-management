// src/lib/aiUsage.ts — C1: AI 사용량 추적
// 토큰 소비, 호출 횟수, 응답 시간 서버사이드 메모리 캐시

export interface AIUsageEntry {
    id: string;
    at: string;
    endpoint: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
    success: boolean;
    error?: string;
}

export interface AIUsageSummary {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    avgDurationMs: number;
    successRate: number;
    estimatedCostUsd: number;
    byEndpoint: Record<string, { calls: number; tokens: number }>;
    recentEntries: AIUsageEntry[];
}

// 서버 메모리 캐시 — 재시작 시 초기화 (운영 환경에서는 DB/Redis로 교체)
const usageLog: AIUsageEntry[] = [];
const MAX_LOG_SIZE = 500;

/**
 * AI 사용 기록 추가
 */
export function trackUsage(entry: Omit<AIUsageEntry, 'id' | 'at'>): void {
    const record: AIUsageEntry = {
        ...entry,
        id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        at: new Date().toISOString(),
    };
    usageLog.push(record);
    if (usageLog.length > MAX_LOG_SIZE) usageLog.shift();
}

/**
 * 비용 추정 (Claude Sonnet 4.5 기준)
 * input: $3/1M tokens, output: $15/1M tokens
 */
function estimateCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens * 3 / 1_000_000) + (outputTokens * 15 / 1_000_000);
}

/**
 * AI 사용량 요약 계산
 */
export function getUsageSummary(): AIUsageSummary {
    const totalCalls = usageLog.length;
    const totalInputTokens = usageLog.reduce((s, e) => s + e.inputTokens, 0);
    const totalOutputTokens = usageLog.reduce((s, e) => s + e.outputTokens, 0);
    const totalDuration = usageLog.reduce((s, e) => s + e.durationMs, 0);
    const successCount = usageLog.filter(e => e.success).length;

    const byEndpoint: Record<string, { calls: number; tokens: number }> = {};
    for (const entry of usageLog) {
        if (!byEndpoint[entry.endpoint]) byEndpoint[entry.endpoint] = { calls: 0, tokens: 0 };
        byEndpoint[entry.endpoint].calls++;
        byEndpoint[entry.endpoint].tokens += entry.inputTokens + entry.outputTokens;
    }

    return {
        totalCalls,
        totalInputTokens,
        totalOutputTokens,
        avgDurationMs: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
        successRate: totalCalls > 0 ? Math.round(successCount / totalCalls * 100) : 100,
        estimatedCostUsd: Math.round(estimateCost(totalInputTokens, totalOutputTokens) * 100) / 100,
        byEndpoint,
        recentEntries: usageLog.slice(-20).reverse(),
    };
}

/**
 * 로그 초기화
 */
export function clearUsageLog(): void {
    usageLog.length = 0;
}
