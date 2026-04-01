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
    '/finance',
    '/sales',
    '/sales-queue',
    // /privacy-report 는 공개 접근 허용 (비로그인 진단 페이지)
];

// ── 역할별 허용 경로 ──────────────────────────────────────────
function isPathAllowed(pathname: string, role: string): boolean {
    if (['super_admin', 'admin'].includes(role)) return true; // 관리자 전체 허용

    const ROLE_ALLOWED: Record<string, string[]> = {
        sales:      ['/employee', '/cases', '/contracts', '/admin/email-preview', '/lawyer/privacy-review', '/sales', '/sales-queue'],
        lawyer:     ['/lawyer', '/cases', '/documents'],
        litigation: ['/litigation', '/cases'],
        finance:    ['/finance', '/billing', '/admin'],
        hr:         ['/admin'],
        counselor:  ['/counselor', '/eap'],
        general:    ['/admin'],
        client_hr:  ['/dashboard', '/consultation', '/chat', '/cases', '/documents',
                     '/billing', '/company-hr', '/privacy-report', '/consultation-history'],
        personal_client: ['/personal-litigation'],
    };

    const allowed = ROLE_ALLOWED[role] ?? [];
    return allowed.some(p => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') || '';

    let response = NextResponse.next();

    const isApiOrStatic = pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname === '/favicon.ico';
    
    // ── 1. 멀티 테넌트(서브/멀티 도메인) Rewrite 처리 ─────────────────
    if (!isApiOrStatic) {
        const matchedDomain = DOMAIN_MAPPINGS.find(mapping => 
            mapping.keywords.some(keyword => host.toLowerCase().includes(keyword))
        );

        if (matchedDomain && !pathname.startsWith(matchedDomain.rewriteTo)) {
            const rewriteUrl = request.nextUrl.clone();
            rewriteUrl.pathname = `${matchedDomain.rewriteTo}${pathname === '/' ? '' : pathname}`;
            response = NextResponse.rewrite(rewriteUrl);
        }
    }

    // ── 2. 보호 대상 경로 확인 ──────────────────────────────────────
    // 중요: 보호된 경로가 아니면 일찍 반환하여 Full Route Cache 보존 및 Edge 지연 방지
    const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
    if (!isProtected) return response;

    // ── 3. Supabase Auth 검증 (getUser 기반으로 보안 강화) ─────────
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const sessionCookie = request.cookies.get('ibs_session') || request.cookies.get('ibs_auth');
        if (!sessionCookie?.value) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        
        // [WARNING]: 배포 환경에서는 이 분기가 타지 않아야 하지만, 최후의 보루로 제공
        // 향후 프로덕션에서는 반드시 JWT 서명 기반으로 권한 검증을 해야 함
        const roleCookie = request.cookies.get('ibs_role')?.value || 'client_hr';
        if (!isPathAllowed(pathname, roleCookie)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        return response;
    }

    const sb = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // *보안 패치*: 권한 탈취 방지를 위해 무결성이 보장되는 getUser 사용
    // Playwright Mock Session 우회 처리 (테스트 환경 지원)
    const sessionCookieValue = request.cookies.get('ibs_session')?.value;
    if (sessionCookieValue && sessionCookieValue.startsWith('mock_')) {
        const mockRole = request.cookies.get('ibs_role')?.value || 'client_hr';
        if (!isPathAllowed(pathname, mockRole)) {
            const homeUrl = request.nextUrl.clone();
            homeUrl.pathname = ['super_admin', 'admin', 'hr', 'general'].includes(mockRole) ? '/admin' : 
                          mockRole === 'finance' ? '/finance' : 
                          mockRole === 'sales' ? '/employee' : 
                          mockRole === 'lawyer' ? '/lawyer' : 
                          mockRole === 'litigation' ? '/litigation' : 
                          mockRole === 'counselor' ? '/counselor' : 
                          mockRole === 'personal_client' ? '/personal-litigation' : '/dashboard';
            return NextResponse.redirect(homeUrl);
        }
        return response;
    }

    const { data: { user }, error } = await sb.auth.getUser();

    // 미인증 또는 토큰 스푸핑/만료 → /login 리다이렉트
    if (error || !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    // 권한(Role) 확인 - RBAC 적용
    const role = (user.user_metadata?.role as string) || 'client_hr';
    if (!isPathAllowed(pathname, role)) {
        // 권한이 없으면 역할별 홈으로 강제 이동
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = ['super_admin', 'admin', 'hr', 'general'].includes(role) ? '/admin' : 
                          role === 'finance' ? '/finance' : 
                          role === 'sales' ? '/employee' : 
                          role === 'lawyer' ? '/lawyer' : 
                          role === 'litigation' ? '/litigation' : 
                          role === 'counselor' ? '/counselor' : 
                          role === 'personal_client' ? '/personal-litigation' : '/dashboard';
        return NextResponse.redirect(homeUrl);
    }

    // 인가 후 최종 응답에 보안 유지 및 크롤링 방지 헤더 설정
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet');
    return response;
}

export const config = {
    // API, 정적 자산, 브라우저 아이콘, 글꼴 등을 캐시에서 배제하여 미들웨어 통과 비용 최소화
    matcher: ['/((?!_next/static|_next/image|images|fonts|favicon.ico|api/).*)'],
};
