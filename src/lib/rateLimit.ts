import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
    max: number;      // 최대 요청 수
    windowMs: number; // 윈도우 시간 (밀리초)
}

interface RequestTracker {
    count: number;
    resetTime: number;
}

// In-memory store (Vercel 환경에서도 동일한 Serverless Execution Context 에서는 유지됩니다)
// 개발 서버의 HMR로 인한 초기화 방지
const globalAny: any = globalThis;
if (!globalAny.memoryStore) {
    globalAny.memoryStore = new Map<string, RequestTracker>();
}
const memoryStore = globalAny.memoryStore as Map<string, RequestTracker>;

/**
 * 간단한 in-memory Rate Limiter 입니다.
 */
export function rateLimiter(req: NextRequest, config: RateLimitConfig): { success: boolean, resetTime: number } {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const key = `${ip}_${req.nextUrl.pathname}`;
    const now = Date.now();

    const tracker = memoryStore.get(key);

    if (!tracker || tracker.resetTime < now) {
        memoryStore.set(key, { count: 1, resetTime: now + config.windowMs });
        return { success: true, resetTime: now + config.windowMs };
    }

    if (tracker.count >= config.max) {
        return { success: false, resetTime: tracker.resetTime };
    }

    tracker.count += 1;
    memoryStore.set(key, tracker);
    
    return { success: true, resetTime: tracker.resetTime };
}

/**
 * Next API Route 내에서 즉시 호출하여 방어할 수 있는 헬퍼
 */
export function checkRateLimit(req: NextRequest, config: RateLimitConfig) {
    const result = rateLimiter(req, config);
    if (!result.success) {
        return NextResponse.json(
            { error: '허용된 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' },
            { 
                status: 429,
                headers: { 'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString() }
            }
        );
    }
    return null; // 통과
}
