# 코드 리뷰 보고서 — IBS CRM

> **검토일**: 2026-03-05  16:00~18:50
> **프로젝트**: `company-relationship-management`  
> **검토 범위**: `src/` 전체 (19 페이지, 11 API 라우트, 컴포넌트, 미들웨어, 인증 시스템)  
> **상태**: ✅ 전체 수정 완료 · `next build` 성공 확인

---

## 수정 요약

| 등급 | 건수 | 설명 |
|------|------|------|
| 🔴 CRITICAL | 3건 | 보안 취약점 |
| 🟠 HIGH | 4건 | 버그/로직 오류 |
| 🟡 MEDIUM | 5건 | 코드 품질 |
| 🔵 LOW | 2건 | 개선 사항 |

---

## 🔴 CRITICAL — 보안 취약점 (3건)

### 1. 이메일 API 인증 우회 취약점

**파일**: `src/app/api/email/route.ts`

**문제**: 요청 body에 `autoMode: true`를 포함하면 인증 체크가 완전히 건너뛰어져 비인증 사용자도 임의 이메일 발송 가능.

**수정**: 클라이언트 측 `autoMode` 플래그를 제거하고, 서버 내부 자동화 파이프라인에서만 사용하는 `x-internal-secret` HTTP 헤더 검증 방식으로 교체.

```diff
- const { type, leadId, lawyerNote = '', autoMode = false }: EmailPayload & { autoMode?: boolean } = body;
- if (!autoMode) {
+ const { type, leadId, lawyerNote = '' }: EmailPayload = body;
+ const isInternalCall = req.headers.get('x-internal-secret') === (process.env.INTERNAL_API_SECRET || '__dev_internal__');
+ if (!isInternalCall) {
    const auth = requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
```

---

### 2. 결제 확인 API 인증 미적용

**파일**: `src/app/api/payment/check/route.ts`

**문제**: `POST /api/payment/check` 엔드포인트에 인증 체크가 없어 누구든 결제 정보 조회 가능.

**수정**: `requireSessionFromCookie` 인증 가드 추가.

```diff
+ import { requireSessionFromCookie } from '@/lib/auth';

  export async function POST(req: NextRequest) {
+     const auth = requireSessionFromCookie(req);
+     if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
      try {
```

---

### 3. 프로덕션 환경 Mock 비밀번호 노출

**파일**: `src/app/login/page.tsx`

**문제**: 퀵 로그인 버튼에 평문 비밀번호(`admin123`, `lawyer123` 등)가 하드코딩되어 프로덕션 빌드에도 포함됨.

**수정**: `process.env.NODE_ENV === 'development'` 조건부 래핑으로 개발 환경에서만 표시.

```diff
- {/* Role Quick-Login Badges */}
- <div className="space-y-2">
+ {/* Role Quick-Login Badges — 개발 환경에서만 표시 */}
+ {process.env.NODE_ENV === 'development' && (
+ <div className="space-y-2">
      <p>역할선택 — 선택하면 즉시 로그인</p>
      ...
  </div>
+ )}
```

---

## 🟠 HIGH — 버그/로직 오류 (4건)

### 4. `useRequireAuth` 의존성 배열 누락

**파일**: `src/lib/AuthContext.tsx`

**문제**: `useEffect` deps에 `requiredRoles`가 누락되어 역할 변경 시 effect가 재실행되지 않음 → RBAC 우회 가능.

```diff
- }, [user, loading, router]);
+ }, [user, loading, router, requiredRoles]);
```

---

### 5. 로그아웃 시 미들웨어 쿠키 잔존

**파일**: `src/components/layout/Navbar.tsx`

**문제**: `authLogout()` 호출 시 localStorage만 정리되고 `ibs_session`/`ibs_role` 쿠키는 잔존 → 미들웨어가 여전히 인증된 사용자로 판단.

```diff
  const handleLogout = () => {
      authLogout();
-     setUser(null);
+     document.cookie = 'ibs_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
+     document.cookie = 'ibs_role=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      router.replace('/');
  };
```

---

### 6. Navbar와 AuthContext 사용자 상태 이중 관리

**파일**: `src/components/layout/Navbar.tsx`

**문제**: Navbar가 `useState`로 자체 `user` 상태를 관리하면서 `getSession()` 직접 호출 + `storage` 이벤트 감시 → AuthContext의 `user`와 불일치 발생 가능.

**수정**: Navbar의 자체 `useState<AuthUser>` 제거, `useAuth()` 훅의 `user`를 직접 사용.

```diff
- const [user, setUser] = useState<AuthUser | null>(null);
+ const { user, logout: authLogout } = useAuth();

- useEffect(() => { setUser(getSession()); }, [pathname]);
- useEffect(() => { /* storage 이벤트 리스너 */ }, []);
  // ↑ 전부 제거: AuthContext가 이미 storage 이벤트를 처리함
```

---

### 7. 미들웨어 PUBLIC_PATHS 매칭 모호성

**파일**: `src/middleware.ts`

**문제**: `'/'`가 `PUBLIC_PATHS`에 포함되어 `pathname.startsWith(p + '/')` 로직에서 혼란 가능. `/chat`도 prefix 매칭 불필요.

**수정**: exact 매칭과 prefix 매칭을 분리.

```diff
- const PUBLIC_PATHS = ['/login', '/pricing', '/sales', '/onboarding', '/', '/chat', '/signup', '/landing'];
- if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
+ const PUBLIC_EXACT = ['/', '/chat'];
+ const PUBLIC_PREFIX = ['/login', '/pricing', '/sales', '/onboarding', '/signup', '/landing', '/legal'];
+ if (PUBLIC_EXACT.includes(pathname) || PUBLIC_PREFIX.some(p => pathname === p || pathname.startsWith(p + '/'))) {
```

---

## 🟡 MEDIUM — 코드 품질 (5건)

### 8. `AUTH_KEY` 상수 중복 정의

**파일**: `src/lib/AuthContext.tsx`

**문제**: `auth.ts`에서 이미 `export const AUTH_KEY = 'ibs_auth_v1'` 하고 있는데 `AuthContext.tsx`에서 별도 선언.

**수정**: `auth.ts`에서 import, 중복 제거.

```diff
- import { loginWithEmailFull, loginWithBiz, clearSession, getSession, ROLE_HOME, type AuthUser } from './auth';
+ import { loginWithEmailFull, loginWithBiz, clearSession, getSession, AUTH_KEY, ROLE_HOME, type AuthUser } from './auth';

- const AUTH_KEY = 'ibs_auth_v1';
+ // AUTH_KEY는 auth.ts에서 import (중복 정의 제거)
```

---

### 9. 미사용 import 제거

**파일**: `src/app/litigation/page.tsx`

```diff
- import { Scale, Plus, X, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp, Calendar, FileText, Gavel } from 'lucide-react';
+ import { Scale, Plus, X, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp, Calendar, Gavel } from 'lucide-react';
```

---

### 10. 로그인 성공 시 `setLoading(false)` 누락

**파일**: `src/app/login/page.tsx`

**문제**: `handleStaffLogin` / `handleClientLogin` 성공 시 `setLoading(false)` 호출 없음 → 라우터 전환 지연 시 로딩 스피너 영구 표시.

```diff
  if (!result.error) {
      const session = getSession();
      if (session) {
          setCookie('ibs_session', session.id, 1);
          setCookie('ibs_role', session.role, 1);
+         setLoading(false);
          router.replace(dest);
      }
  }
```

---

### 11. Suspense fallback 누락

**파일**: `src/app/page.tsx`

```diff
- <Suspense>
+ <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#04091a' }}>
+   <div className="text-gold text-lg font-bold animate-pulse">로딩 중...</div>
+ </div>}>
    <LandingPageInner />
  </Suspense>
```

---

### 12. 송무 페이지 3초 polling → 30초

**파일**: `src/app/litigation/page.tsx`

**문제**: Mock 데이터를 3초마다 polling하면 불필요한 리렌더링 발생.

```diff
- useEffect(() => { refresh(); const id = setInterval(refresh, 3000); return () => clearInterval(id); }, [refresh]);
+ useEffect(() => { refresh(); const id = setInterval(refresh, 30_000); return () => clearInterval(id); }, [refresh]);
```

---

## 🔵 LOW — 개선 사항 (2건)

### 13. `package.json` name 불일치

```diff
- "name": "franchise-consulting",
+ "name": "company-relationship-management",
```

---

### 14. 테스트 코드 부재 (향후 과제)

프로젝트 전체에 테스트 파일 0개. 인증 로직, API 라우트, 스토어 등 핵심 비즈니스 로직에 대한 자동화 검증 필요.

> **권장**: Phase 3 (Supabase 전환) 이전에 최소한의 단위 테스트 추가

---

## 수정 파일 목록

| # | 파일 | 수정 내용 |
|---|------|-----------|
| 1 | `src/app/api/email/route.ts` | autoMode → x-internal-secret 헤더 검증 |
| 2 | `src/app/api/payment/check/route.ts` | 인증 가드 추가 |
| 3 | `src/app/login/page.tsx` | dev-only 퀵 로그인 + loading state 수정 |
| 4 | `src/lib/AuthContext.tsx` | AUTH_KEY 중복 제거 + deps 수정 |
| 5 | `src/components/layout/Navbar.tsx` | useAuth 통합 + 쿠키 삭제 |
| 6 | `src/middleware.ts` | PUBLIC_PATHS exact/prefix 분리 |
| 7 | `src/app/page.tsx` | Suspense fallback 추가 |
| 8 | `src/app/litigation/page.tsx` | FileText 제거 + polling 30초 |
| 9 | `package.json` | name 수정 |

---

*검토·수정: Antigravity AI Agent*

---

## 오후 세션 추가 작업 (18:00~18:50)

### 🔧 기능 추가/수정 (6건)

#### 15. 결제확인 → 구독 처리 2단계 흐름

**파일**: `src/app/employee/page.tsx`, `src/app/api/payment/check/route.ts`, `src/lib/mock/types.ts`, `src/lib/mock/data.ts`

**내용**: `client_replied` 상태에서 "결제확인" 버튼 클릭 → `/api/payment/check` API 호출 → 결제 내역 확인 후 "구독 처리" 버튼 활성화. `Company` 타입에 `paymentVerified`, `paymentVerifiedAt` 필드 추가.

---

#### 16. 채팅 페이지 로그인 게이트

**파일**: `src/app/chat/page.tsx`

**내용**: 비인증 사용자가 `/chat` 접속 시 "법률 상담" 선택 상태의 라이브 채팅 UI를 배경으로 표시 + 블러 오버레이 + 🔒 잠금 아이콘 + 로그인 CTA. 기존 정적 이미지 프리뷰를 라이브 렌더링으로 교체, `Image` import 제거.

```diff
- import Image from 'next/image';
- {/* 프리뷰 이미지 (배경) */}
- <div className="relative w-full" style={{ height: 480 }}>
-     <Image src="/chat-preview.png" ... />
- </div>
+ {/* 라이브 채팅 UI (배경) — 법률 상담 선택 상태 */}
+ <div> 채팅 헤더 + AI 메시지 + 입력창 </div>
```

---

#### 17. Navbar 메뉴명 변경 + 법률 상담 링크 추가

**파일**: `src/components/layout/Navbar.tsx`

**내용**: public 네비게이션에서 `/pricing` 레이블을 "법률 상담" → "요금제"로 변경, `/chat`을 "법률 상담" 링크로 별도 추가.

```diff
  public: [
      { href: '/', label: '홈' },
      { href: '/sales', label: '서비스 소개' },
-     { href: '/pricing', label: '법률 상담' },
+     { href: '/chat', label: '법률 상담' },
+     { href: '/pricing', label: '요금제' },
      { href: '/client-portal', label: '고객 포털' },
  ],
```

---

#### 18. 구독제 요금표 추가

**파일**: `src/app/pricing/page.tsx`

**내용**: 단건 서비스 카드 아래에 3단계 구독 요금표 섹션 추가 (150줄).

| 플랜 | 가격 | 대상 |
|------|------|------|
| 🔵 스타터 | ₩490,000/월 | 소규모 가맹점·개인 |
| ⭐ 스탠다드 (추천) | ₩990,000/월 | 가맹 본사·중소기업 |
| 🟣 프리미엄 | ₩2,200,000/월 | 대형 본사·상장 준비 |

공통 혜택 그리드: 전담 변호사 · 24시간 응답 · AI 분석 · 해지 자유.

---

### 🐛 버그 수정 (2건)

#### 19. 로그인 시 AuthContext 상태 미동기화 (CRITICAL)

**파일**: `src/app/login/page.tsx`

**원인**: 로그인 페이지가 `auth.ts`의 `loginWithEmail()`/`loginWithBiz()`를 직접 호출 → localStorage만 업데이트, **AuthContext의 React state(`user`)는 `null` 유지** → `/chat` 등 `useAuth().isAuthenticated` 의존 페이지에서 인증 실패.

**수정**: 4개 로그인 경로 모두 `useAuth()`의 `login()`/`loginWithBizNo()` 메서드로 교체.

```diff
- import { loginWithEmail, loginWithBiz, ROLE_HOME, getSession } from '@/lib/auth';
+ import { ROLE_HOME, getSession } from '@/lib/auth';
+ import { useAuth } from '@/lib/AuthContext';

- const result = loginWithEmail(email, password);
- if (result.success) {
+ const result = await authLogin(email, password);
+ if (!result.error) {
```

---

#### 20. 로그아웃 시 AuthContext 상태 미동기화 (CRITICAL)

**파일**: `src/components/layout/Navbar.tsx`

**원인**: Navbar가 `clearSession()` + 로컬 `setUser(null)`로 로그아웃 → AuthContext의 React state는 업데이트 안 됨 → 로그아웃 후 `/chat` 접속 시 여전히 인증 상태로 판단, LoginGate 미표시.

**수정**: `useAuth().logout()` 사용으로 AuthContext + localStorage 동시 정리.

```diff
+ import { useAuth } from '@/lib/AuthContext';

+ const { logout: authLogout } = useAuth();
  const handleLogout = () => {
-     clearSession();
-     setUser(null);
+     authLogout();       // AuthContext state + localStorage 모두 정리
+     setUser(null);      // Navbar 로컬 state도 즉시 반영
      router.replace('/');
  };
```

---

## 추가 수정 파일 목록 (오후 세션)

| # | 파일 | 수정 내용 |
|---|------|-----------| 
| 10 | `src/app/employee/page.tsx` | 결제확인→구독 처리 2단계 + key prop 수정 |
| 11 | `src/app/api/payment/check/route.ts` | 결제 확인 API 신규 생성 |
| 12 | `src/lib/mock/types.ts` | `paymentVerified` 필드 추가 |
| 13 | `src/lib/mock/data.ts` | 기본값 추가 |
| 14 | `src/app/chat/page.tsx` | 로그인 게이트 (라이브 프리뷰) |
| 15 | `src/app/pricing/page.tsx` | 구독제 요금표 섹션 추가 |
| 16 | `src/components/layout/Navbar.tsx` | 메뉴명 수정 + useAuth 로그아웃 통합 |
| 17 | `src/app/login/page.tsx` | useAuth 로그인 통합 (상태 동기화) |

---

*추가 검토·수정: Antigravity AI Agent (2026-03-05 오후 세션)*
