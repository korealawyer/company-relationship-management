import { NextRequest, NextResponse } from 'next/server';

// 보호 경로 → 허용 역할
const PROTECTED: Record<string, string[]> = {
    '/admin': ['super_admin', 'admin', 'sales', 'hr', 'general', 'finance'],
    '/lawyer': ['super_admin', 'lawyer'],
    '/litigation': ['super_admin', 'litigation', 'lawyer'],
    '/client-portal': ['client_hr'],
    '/consultation': ['client_hr', 'super_admin', 'lawyer'],
    '/contracts': ['super_admin', 'lawyer', 'client_hr'],
    '/legal': ['super_admin', 'lawyer', 'client_hr'],
    '/eap': ['client_hr', 'counselor'],
    '/counselor': ['counselor', 'super_admin'],
    '/employee': ['sales', 'admin', 'super_admin', 'lawyer', 'litigation'],
    '/company-hr': ['client_hr', 'super_admin'],
    '/dashboard': ['super_admin', 'admin', 'sales', 'lawyer', 'litigation', 'hr', 'general', 'finance', 'counselor', 'client_hr'],
};

// 퍼블릭 경로 (인증 불필요)
const PUBLIC_PATHS = ['/login', '/pricing', '/sales', '/onboarding', '/', '/chat', '/signup', '/landing'];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 퍼블릭 경로 통과
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return NextResponse.next();
    }

    // 세션 쿠키 확인 (ibs_auth_v1 → localStorage 기반이므로 ibs_session 쿠키 사용)
    const sessionCookie = req.cookies.get('ibs_session') || req.cookies.get('ibs_auth');
    if (!sessionCookie) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Role 기반 경로 접근 제어 (RBAC)
    // 가장 긴(구체적인) 경로부터 매칭
    const matchedPath = Object.keys(PROTECTED)
        .sort((a, b) => b.length - a.length)
        .find(p => pathname === p || pathname.startsWith(p + '/'));

    if (matchedPath) {
        const roleCookie = req.cookies.get('ibs_role');
        // ibs_role 쿠키 없음 → 인증 세션은 있지만 역할 불명 → 재로그인 요구
        if (!roleCookie?.value) {
            const loginUrl = new URL('/login', req.url);
            loginUrl.searchParams.set('from', pathname);
            loginUrl.searchParams.set('error', 'no_role');
            return NextResponse.redirect(loginUrl);
        }
        const allowedRoles = PROTECTED[matchedPath];
        if (!allowedRoles.includes(roleCookie.value)) {
            // 권한 없음 → 로그인 페이지로 (from 파라미터 포함)
            const loginUrl = new URL('/login', req.url);
            loginUrl.searchParams.set('from', pathname);
            loginUrl.searchParams.set('error', 'unauthorized');
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
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
        '/consultation/:path*',
    ],
};
