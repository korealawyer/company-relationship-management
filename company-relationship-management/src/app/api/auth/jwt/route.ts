import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// ⚠️ JWT_SECRET 환경변수 필수 — fallback 제거 (보안 강화)
const JWT_SECRET_RAW = process.env.JWT_SECRET || '';
if (!JWT_SECRET_RAW) {
    console.error('[auth/jwt] 🔴 CRITICAL: JWT_SECRET 환경변수가 설정되지 않았습니다! JWT 발급이 차단됩니다.');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

// SEC-FIX #6: IP 기반 Rate Limiting (인메모리 — 분당 10회)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }
    entry.count++;
    return entry.count <= RATE_LIMIT;
}

export async function POST(req: NextRequest) {
    try {
        // SEC-FIX #6: Rate Limiting 체크
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
        if (!checkRateLimit(clientIp)) {
            return NextResponse.json({ success: false, error: 'Too many requests. 잠시 후 다시 시도하세요.' }, { status: 429 });
        }

        // 보안: 내부 호출만 허용 (서버→서버 또는 같은 도메인)
        const internalSecret = process.env.INTERNAL_API_SECRET;
        const isInternalCall = !!internalSecret && req.headers.get('x-internal-secret') === internalSecret;
        
        if (!isInternalCall) {
            // SEC-FIX: 외부에서의 직접적인 JWT 발급 요청을 완벽히 차단.
            // 모든 인증은 /api/auth/login 라우트에서 DB 대조 후 발급됨
            return NextResponse.json({ success: false, error: 'Forbidden: internal use only' }, { status: 403 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
        }

        const { sessionId, role, companyId } = body;

        if (!sessionId || !role) {
            return NextResponse.json({ success: false, error: 'Missing sessionId or role' }, { status: 400 });
        }

        // SEC-FIX #5: 모든 환경에서 JWT_SECRET 미설정 시 발급 차단 (빈 시크릿 서명 방지)
        if (!JWT_SECRET_RAW) {
            return NextResponse.json({ success: false, error: 'Server configuration error: JWT_SECRET not set' }, { status: 500 });
        }

        // C1: 유효한 역할인지 검증 — middleware.ts PROTECTED 맵의 모든 역할 포함
        const VALID_ROLES = ['super_admin', 'admin', 'lawyer', 'sales', 'client_hr', 'employee', 'counselor', 'litigation', 'hr', 'general', 'finance'];
        if (!VALID_ROLES.includes(role)) {
            return NextResponse.json({ success: false, error: `Invalid role: ${role}` }, { status: 400 });
        }

        const alg = 'HS256';
        const jwt = await new SignJWT({ role, companyId })
            .setProtectedHeader({ alg })
            .setIssuedAt()
            .setSubject(sessionId)
            .setExpirationTime('24h')
            .sign(JWT_SECRET);

        const response = NextResponse.json({ success: true });
        
        response.cookies.set('ibs_jwt', jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;
    } catch (error) {
        console.error('JWT Signing Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

