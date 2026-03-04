import { NextRequest, NextResponse } from 'next/server';

// 보호 경로 → 허용 역할
const PROTECTED: Record<string, string[]> = {
    '/admin': ['super_admin', 'admin', 'sales', 'hr', 'general', 'finance'],
    '/lawyer': ['super_admin', 'lawyer'],
    '/litigation': ['super_admin', 'litigation'],
    '/client-portal': ['client_hr'],
    '/consultation': ['client_hr', 'super_admin', 'lawyer'],
    '/contracts': ['super_admin', 'lawyer', 'client_hr'],
    '/legal': ['super_admin', 'lawyer', 'client_hr'],
    '/eap': ['client_hr', 'counselor'],
    '/counselor': ['counselor', 'super_admin'],
};

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 퍼블릭 경로
    if (['/login', '/pricing', '/sales', '/onboarding', '/', '/chat'].some(p => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // 인증 쿠키 확인 (Phase 2: Supabase session 쿠키로 대체)
    const auth = req.cookies.get('ibs_auth');
    if (!auth) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/lawyer/:path*', '/litigation/:path*', '/client-portal/:path*', '/contracts/:path*', '/legal/:path*'],
};
