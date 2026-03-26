import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// Fallback in-memory cache for local development or when KV is not set up
const fallbackCache = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
    identifier: string,
    limit: number = 10,
    windowSeconds: number = 60
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    // If Vercel KV is configured, use Upstash Ratelimit
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        try {
            const ratelimit = new Ratelimit({
                redis: kv,
                limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
                analytics: true,
            });
            return await ratelimit.limit(identifier);
        } catch (error) {
            console.warn('[RateLimit] Vercel KV 연동 실패, Fallback 적용:', error);
        }
    }

    // Fallback: In-memory Rate Limit (Vercel 환경에서는 인스턴스마다 리셋되지만 로컬/임시 방어용)
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    let current = fallbackCache.get(identifier);
    if (!current || now > current.resetAt) {
        current = { count: 1, resetAt: now + windowMs };
    } else {
        current.count++;
    }
    fallbackCache.set(identifier, current);

    return {
        success: current.count <= limit,
        limit,
        remaining: Math.max(0, limit - current.count),
        reset: current.resetAt,
    };
}
