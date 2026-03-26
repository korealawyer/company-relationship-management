import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ── 멀티 테넌트 도메인 매핑 규칙 ──────────────────────────────
const DOMAIN_MAPPINGS = [
    { keywords: ['franchise'], rewriteTo: '/franchise' },
    { keywords: ['sme'], rewriteTo: '/sme' },
    { keywords: ['medical', 'hospital'], rewriteTo: '/medical' },
];

// ── 보호 경로 목록 ────────────────────────────────────────────
const PROTECTED_PATHS = [
    '/employee', '/lawyer', '/litigation', '/admin',
    '/dashboard', '/counselor', '/company-hr', '/eap',
    '/cases', '/documents', '/billing', '/chat',
    '/personal-litigation', '/consultation-history',
];

// ── 역할별 허용 경로 검증 함수 모듈화 ──────────────────────────────────────────
function isPathAllowed(pathname: string, role: string): boolean {
    if (['super_admin', 'admin'].includes(role)) return true;

    const ROLE_ALLOWED: Record<string, string[]> = {
        sales:      ['/employee', '/cases', '/contracts'],
        lawyer:     ['/lawyer', '/cases', '/documents'],
        litigation: ['/litigation', '/cases'],
        finance:    ['/billing', '/admin'],
        hr:         ['/admin'],
        counselor:  ['/counselor', '/eap'],
        general:    ['/admin'],
        client_hr:  ['/dashboard', '/consultation', '/chat', '/cases', '/documents',
                     '/billing', '/company-hr', '/privacy-report', '/consultation-history'],
    };

    const allowed = ROLE_ALLOWED[role] ?? [];
    return allowed.some(p => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') || '';

    // ── 1. 멀티 테넌트 도메인 매핑 로직 ───────────────────────────
    const matchedDomain = DOMAIN_MAPPINGS.find(mapping => 
        mapping.keywords.some(keyword => host.toLowerCase().includes(keyword))
    );

    // Default 응답 객체 생성
    let response = matchedDomain && !pathname.startsWith(matchedDomain.rewriteTo)
        ? NextResponse.rewrite(new URL(`${matchedDomain.rewriteTo}${pathname === '/' ? '' : pathname}`, request.url))
        : NextResponse.next({ request: { headers: request.headers } });

    // ── 2. 보호 경로 접근 검사 ──────────────────────────────────────
    const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
    if (!isProtected) return response;

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        // [FallBack] Supabase 환경변수 미설정 시 기존 Legacy 세션 검사
        const sessionCookie = request.cookies.get('ibs_session') || request.cookies.get('ibs_auth');
        if (!sessionCookie?.value) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        
        const roleCookie = request.cookies.get('ibs_role')?.value || 'client_hr';
        if (!isPathAllowed(pathname, roleCookie)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return response;
    }

    // ── 3. 견고한 Supabase SSR 세션 검증 (해결: 토큰 리프레시 쿠키 소실 버그) ─────────
    const sb = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // [핵심 해결 로직]: 새로 갱신된 쿠키를 `request`와 생성된 `response` 모두에 항상 반영
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set({ name, value, ...options });
                    });
                },
            },
        }
    );

    const { data: { session } } = await sb.auth.getSession();

    if (!session) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('next', pathname);
        // 토큰 갱신 과정에서 생성된 쿠키를 소실하지 않게 기존 response에 헤더/상태 부여
        return NextResponse.redirect(redirectUrl, {
            headers: response.headers
        });
    }

    const role = (session.user.user_metadata?.role as string) || 'client_hr';
    if (!isPathAllowed(pathname, role)) {
        // 권한 우회 접근 차단 - 홈으로 강제 리다이렉트 시 기존 쿠키 유지
        const homePath = ['super_admin', 'admin', 'hr', 'finance', 'general'].includes(role) ? '/admin' : 
                          role === 'sales' ? '/employee' : 
                          role === 'lawyer' ? '/lawyer' : 
                          role === 'litigation' ? '/litigation' : 
                          role === 'counselor' ? '/counselor' : '/dashboard';
                          
        return NextResponse.redirect(new URL(homePath, request.url), {
            headers: response.headers
        });
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
    ],
};
