import { NextRequest, NextResponse } from 'next/server';

import { jwtVerify } from 'jose';

// ⚠️ JWT_SECRET 환경변수 필수 — fallback 제거 (보안 강화)
const JWT_SECRET_RAW = process.env.JWT_SECRET || '';
// QA-FIX #4: 모든 환경에서 JWT_SECRET 미설정 경고 (기존: production에서만)
if (!JWT_SECRET_RAW) {
    if (process.env.NODE_ENV === 'production') {
        console.error('[middleware] 🔴 CRITICAL: JWT_SECRET 환경변수가 설정되지 않았습니다! 모든 인증이 무효화됩니다.');
    } else {
        console.warn('[middleware] ⚠️ JWT_SECRET 미설정 — 개발 환경에서도 빈 시크릿은 보안 위험입니다.');
    }
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

// 보호 경로 → 허용 역할
const PROTECTED: Record<string, string[]> = {
    '/admin': ['super_admin', 'admin', 'hr', 'general', 'finance'],
    '/lawyer': ['super_admin', 'admin', 'sales', 'lawyer'],
    '/litigation': ['super_admin', 'admin', 'sales', 'litigation', 'lawyer'],
    '/client-portal': ['client_hr'],

    '/contracts': ['super_admin', 'lawyer', 'client_hr'],
    '/legal': ['super_admin', 'lawyer', 'client_hr'],
    '/eap': ['client_hr', 'counselor'],
    '/counselor': ['counselor', 'super_admin'],
    '/employee': ['sales', 'admin', 'super_admin', 'lawyer', 'litigation'],
    '/company-hr': ['client_hr', 'super_admin'],
    '/dashboard': ['super_admin', 'admin', 'sales', 'lawyer', 'litigation', 'hr', 'general', 'finance', 'counselor', 'client_hr'],
    '/settings': ['super_admin', 'admin'],
    '/notifications': ['super_admin', 'admin', 'sales', 'lawyer', 'litigation', 'counselor', 'client_hr'],
    '/profile': ['super_admin', 'admin', 'sales', 'lawyer', 'litigation', 'counselor', 'client_hr', 'hr', 'general', 'finance'],
};

// 퍼블릭 경로 (인증 불필요)
// '/'는 정확 일치만, 나머지는 prefix 매칭 허용
// C3: '/legal' 전체를 PUBLIC에서 제거, '/legal/privacy'만 정확 매칭으로 퍼블릭 허용
const PUBLIC_EXACT = ['/', '/chat', '/legal/privacy'];
const PUBLIC_PREFIX = ['/login', '/pricing', '/sales', '/onboarding', '/signup', '/landing', '/about', '/help', '/api/auth'];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 퍼블릭 경로 통과
    if (PUBLIC_EXACT.includes(pathname) || PUBLIC_PREFIX.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return NextResponse.next();
    }

    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);

    // JWT 기반 세션 쿠키 확인 (ibs_jwt)
    const jwtCookie = req.cookies.get('ibs_jwt');
    if (!jwtCookie?.value) {
        return NextResponse.redirect(loginUrl);
    }

    let jwtPayload: any = null;
    try {
        const { payload } = await jwtVerify(jwtCookie.value, JWT_SECRET);
        
        // SEC-FIX: 로그아웃을 통해 무효화(Blacklisted)된 토큰인지 검사
        if (payload.jti) {
            const { isTokenBlacklisted } = await import('@/lib/tokenBlacklist');
            if (await isTokenBlacklisted(payload.jti)) {
                throw new Error('Blacklisted token');
            }
        }
        
        jwtPayload = payload;
    } catch (error) {
        console.error('JWT Verification failed:', error);
        loginUrl.searchParams.set('error', 'session_expired');
        // 세션 만료 시 ibs_jwt 쿠키 삭제
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('ibs_jwt');
        return response;
    }

    // Role 기반 경로 접근 제어 (RBAC)
    // 가장 긴(구체적인) 경로부터 매칭
    const matchedPath = Object.keys(PROTECTED)
        .sort((a, b) => b.length - a.length)
        .find(p => pathname === p || pathname.startsWith(p + '/'));

    if (matchedPath) {
        const userRole = jwtPayload.role;
        if (!userRole) {
            loginUrl.searchParams.set('error', 'no_role');
            return NextResponse.redirect(loginUrl);
        }
        
        const allowedRoles = PROTECTED[matchedPath];
        if (!allowedRoles.includes(userRole)) {
            // 권한 없음 → 예외 처리 (403처럼 동작하도록)
            loginUrl.searchParams.set('error', 'unauthorized');
            return NextResponse.redirect(loginUrl);
        }
    }

    // 통과 시 헤더에 role을 주입하여 백엔드 API에서 읽을 수 있게 함 (테넌트 격리용)
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-role', jwtPayload.role || '');
    requestHeaders.set('x-company-id', jwtPayload.companyId || '');

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/lawyer/:path*',
        '/litigation/:path*',
        '/client-portal/:path*',
        '/contracts/:path*',
        '/legal/:path*',
        '/company-hr/:path*',
        '/dashboard/:path*',
        '/counselor/:path*',
        '/employee/:path*',
        '/settings/:path*',
        '/notifications/:path*',
        '/profile/:path*',
        '/eap/:path*',
    ],
};
