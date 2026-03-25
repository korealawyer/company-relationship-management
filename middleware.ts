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
    '/employee',
    '/lawyer',
    '/litigation',
    '/admin',
    '/dashboard',
    '/counselor',
    '/company-hr',
    '/eap',
    '/cases',
    '/documents',
    '/billing',
    '/chat',
    '/personal-litigation',
    '/consultation-history',
    // /privacy-report 는 공개 접근 허용 (비로그인 진단 페이지)
];

// ── 역할별 허용 경로 ──────────────────────────────────────────
// 해당 역할이 접근할 수 없는 경로 → 홈으로 리다이렉트
function isPathAllowed(pathname: string, role: string): boolean {
    if (['super_admin', 'admin'].includes(role)) return true; // 관리자 전체 허용

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

    // ── 1. 멀티 테넌트(서브/멀티 도메인) Rewrite 처리 ─────────────────
    let response = NextResponse.next({
        request: { headers: request.headers },
    });

    const isApiOrStatic = pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname === '/favicon.ico';
    
    if (!isApiOrStatic) {
        const matchedDomain = DOMAIN_MAPPINGS.find(mapping => 
            mapping.keywords.some(keyword => host.toLowerCase().includes(keyword))
        );

        if (matchedDomain && !pathname.startsWith(matchedDomain.rewriteTo)) {
            const rewriteUrl = request.nextUrl.clone();
            rewriteUrl.pathname = `${matchedDomain.rewriteTo}${pathname === '/' ? '' : pathname}`;
            response = NextResponse.rewrite(rewriteUrl, {
                request: { headers: request.headers },
            });
        }
    }

    // ── 2. 보호 대상 경로 확인 ──────────────────────────────────────
    const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
    if (!isProtected) return response;

    // Supabase 미설정 시 → 기존 쿠키 방식으로 폴백
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const sessionCookie = request.cookies.get('ibs_session') || request.cookies.get('ibs_auth');
        if (!sessionCookie?.value) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return response;
    }

    // ── 3. Supabase 세션 검증 ─────────────────────────────────────

    const sb = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // 토큰 갱신 시 응답 쿠키 업데이트
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data: { session } } = await sb.auth.getSession();

    // 미인증 → /login 리다이렉트
    if (!session) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * 다음을 제외한 모든 요청에 매칭:
         * - _next/static (정적 파일)
         * - _next/image (이미지 최적화)
         * - favicon.ico
         * - api 라우트 (자체 인증 처리)
         * 
         * (주의: 멀티 테넌트 매핑을 고려하여 최상단(/) 및 공개 페이지도 미들웨어를 타도록 수정됨)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
};
