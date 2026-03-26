// src/lib/tokenBlacklist.ts
// ⚠️ Phase 3: Supabase (Auth/Sessions) 또는 Redis(Vercel KV) 연동 확장을 위한 추상화 인터페이스
// 현재는 서버리스 초기화 특성을 고려한 Mock/인메모리 구현체로, 실제 프로덕션 환경에서는 반드시 Redis(KV) 등을 사용해야 합니다.

const globalBlacklist = new Set<string>();

/**
 * 토큰이 블랙리스트에 등록되어 있는지 확인합니다.
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
    // 실제 운영 환경 (Vercel KV 예시):
    // return (await kv.get(`blacklist:${jti}`)) === 'revoked';
    return globalBlacklist.has(jti);
}

/**
 * 토큰 식별자(jti)를 블랙리스트에 등재합니다.
 * @param jti 토큰 식별자
 * @param expiresInMs 토큰의 남은 유효기간 (이 기간이 지나면 블랙리스트에서 삭제해도 됨)
 */
export async function blacklistToken(jti: string, expiresInMs: number = 86400000): Promise<void> {
    // 실제 운영 환경 (Vercel KV 예시):
    // await kv.set(`blacklist:${jti}`, 'revoked', { px: expiresInMs });
    
    globalBlacklist.add(jti);
    
    // 메모리 누수 방지: 토큰 유효기간 만료 시 Set에서 자동 제거
    if (expiresInMs > 0) {
        setTimeout(() => {
            globalBlacklist.delete(jti);
        }, expiresInMs).unref?.(); // Edge/Node 환경 호환을 위한 unref (선택사항)
    }
}
