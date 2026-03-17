# 📊 company-relationship-management 코드 개선점 분석 보고서

> **분석 일자**: 2026-03-05  
> **분석 대상**: IBS 법률사무소 프랜차이즈 법률 서비스 플랫폼  
> **기술 스택**: Next.js 16, React 19, TypeScript, TailwindCSS 4, Framer Motion  
> **분석자**: The_Director (PM 오케스트레이터)

---

> [!IMPORTANT]
> **이 문서만 수정하면 충분한가?** → **아닙니다.**
> 초기 분석에서 `page.tsx`, `auth.ts`, `mockStore.ts`, `middleware.ts`, `supabase.ts` 5개 파일만 검토했습니다.
> 아래 **[추가 발견 항목 16~19번]** 은 `Navbar.tsx`, `dripStore.ts`, `leadStore.ts`, `api/analyze/route.ts`에서
> 추가로 발견된 문제입니다. **이 보고서의 1~19번 전체를 기준**으로 수정하세요.

---

## 🔴 Critical — 즉시 수정 필요

### 1. 보안: 비밀번호 평문 저장 (`auth.ts`)

**위치**: `src/lib/auth.ts` L57–105, L229, L245

```typescript
// ❌ 현재 코드 — 비밀번호 평문 저장
{ email: 'admin@ibslaw.kr', password: 'admin123', user: {...} }

// ❌ 가입된 사용자 비밀번호를 avatar 필드에 저장
saveUsers([...all, { ...user, avatar: password }]);  // L229
const found = users.find(u => u.avatar === password);  // L245
```

**문제점**:
- MOCK_ACCOUNTS 배열에 평문 비밀번호 하드코딩
- 회원가입 시 `avatar` 필드에 평문 비밀번호 저장 (데이터 구조 의미 오용)
- localStorage에 암호화 없이 저장 → 브라우저 개발자 도구로 즉시 노출

**개선 방안**:
```typescript
// ✅ bcrypt 또는 최소한 crypto.subtle로 해싱
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 10);
// 별도 passwordHash 필드 사용
saveUsers([...all, { ...user, passwordHash: hashedPassword }]);
```

> 🚨 법률 서비스 특성상 개인 민감정보를 다루는 플랫폼에서 이는 즉각적인 법적 리스크 요인입니다.

---

### 2. 보안: 미들웨어 RBAC 미완성 (`middleware.ts`)

**위치**: `src/middleware.ts` L24–30

```typescript
// ❌ 현재: 쿠키 존재 여부만 확인 (역할 검증 없음)
const auth = req.cookies.get('ibs_auth');
if (!auth) return NextResponse.redirect(...);
return NextResponse.next(); // 역할 확인 없이 통과!
```

**문제점**:
- `PROTECTED` 객체를 정의했지만 실제로 역할(role) 검증을 전혀 하지 않음
- `client_hr` 권한 사용자가 `/admin` 경로에 접근 가능
- 쿠키에 저장된 역할 값을 조작하면 권한 우회 가능

**개선 방안**:
```typescript
// ✅ 쿠키에서 역할을 파싱하고 경로별 역할 검증
const authCookie = req.cookies.get('ibs_auth');
if (!authCookie) return redirect('/login');
const user = JSON.parse(authCookie.value);
const allowedRoles = PROTECTED[matchedPath];
if (allowedRoles && !allowedRoles.includes(user.role)) {
  return NextResponse.redirect(new URL('/unauthorized', req.url));
}
```

---

### 3. 보안: 사업자번호 로그인 비밀번호 검증 취약 (`auth.ts`)

**위치**: `src/lib/auth.ts` L178–180

```typescript
// ❌ 현재: 4자 이상이면 어떤 비밀번호든 통과
if (password.length < 4) {
  return { success: false, error: '비밀번호가 올바르지 않습니다.' };
}
```

**문제점**: 실제 비밀번호 검증이 전무 — 사업자번호만 알면 任意의 4자+ 문자열로 로그인 가능

---

## 🟠 High — 아키텍처 개선 필요

### 4. 파일 크기 — 거대 단일 컴포넌트

| 파일 | 라인 수 | 문제 |
|------|---------|------|
| `src/app/page.tsx` | 1,138줄 | 단일 파일에 7개 섹션 + 5개 인라인 컴포넌트 |
| `src/lib/mockStore.ts` | 911줄 | 핵심 데이터 모델 + CRUD + AI Mock + 상담 시스템 + 상수 혼재 |
| `src/lib/auth.ts` | 339줄 | 인증 + 초대코드 + 소속신청 + MOCK 데이터 혼재 |

**개선 방안**:
```
src/
├── components/
│   ├── landing/
│   │   ├── HeroSection.tsx
│   │   ├── IssueSection.tsx
│   │   ├── RiskSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── PricingSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   └── FaqSection.tsx
│   └── ui/
├── lib/
│   ├── auth/
│   │   ├── session.ts        # 세션 CRUD
│   │   ├── mockAccounts.ts   # Mock 계정 데이터
│   │   └── inviteCodes.ts    # 초대코드 관리
│   └── store/
│       ├── companyStore.ts   # Company CRUD
│       ├── consultStore.ts   # 상담 시스템
│       ├── litigationStore.ts# 송무팀 관리
│       └── types.ts          # 공통 타입 정의
```

---

### 5. 데이터 레이어 — 전체 localStorage 의존

**위치**: `src/lib/mockStore.ts`, `src/lib/auth.ts`

**문제점**:
- 모든 데이터가 브라우저 localStorage에만 저장 → 탭/기기 간 데이터 공유 불가
- 페이지 새로고침 시 `DEFAULT_COMPANIES` 재로드 로직이 있지만, 다른 기기에서 접근 시 빈 데이터
- localStorage 용량 제한(5MB)을 초과할 경우 데이터 손실

**데이터 의존성 현황**:
```
ibs_auth_v1     → 세션 정보
ibs_users_v1    → 가입 사용자
ibs_pending_v1  → 소속 승인 대기
ibs_store_v4    → 기업 케이스 데이터
ibs_lit_v1      → 송무팀 사건
ibs_auto_settings → 자동화 설정
ibs_auto_logs   → 자동화 로그
ibs_consult_v1  → 법률 상담
ibs_drip_v1     → Drip 캠페인
ibs_leads_v1    → 리드 관리
```
→ **총 10개의 localStorage 키** — Supabase 전환이 최우선 과제

**긴급 마이그레이션 계획** (이미 `supabase.ts`에 스키마 초안 있음):
```typescript
// supabase.ts SQL 스키마를 실제 적용
// Phase 2 전환 시 @supabase/supabase-js install 필요
```

---

### 6. 상태 관리 — Store 패턴 불일치

**위치**: `src/lib/mockStore.ts` vs `src/lib/dripStore.ts` vs `src/lib/leadStore.ts`

**문제점**:
- `mockStore.ts`는 `store` 객체 패턴 사용
- `dripStore.ts`, `leadStore.ts`는 독립된 함수 export 패턴
- 일관성 없는 API → 새 기능 추가 시 패턴 선택 혼란

**개선**: Zustand 또는 통일된 Repository 패턴 도입 권장

---

## 🟡 Medium — UI/UX 개선 사항

### 7. 랜딩 페이지 오탈자 및 의미 불명확 텍스트

**위치**: `src/app/page.tsx`

| 라인 | 현재 | 수정 제안 |
|------|------|---------|
| 1021 | `"자묨12년차 직영 스토리지"` | `"자문 12년차 직영 스토리지"` |
| 1029 | `"행정순욝 고충 성공"` | `"행정소송 고충 성공"` |
| 1037 | `"본사 도주숫을 당겨내며"` | 문맥 재작성 필요 |
| 1038 | `"소송 수패"` | `"소송 승소"` 또는 `"분쟁 해결"` |
| 1112 | `"개인정보보호월회 귀상 자문사"` | 정확한 기관명 확인 필요 |
| 1112 | `"공정거래위원회 등록 뺕주인"` | 정확한 명칭으로 수정 필요 |
| 1126 | `"비술익참제한"` | `"광고성 정보 수신 거부"` 등으로 수정 |

---

### 8. UX: `searchParams`를 Client Component에서 Promise로 처리

**위치**: `src/app/page.tsx` L417–428

```typescript
// ❌ 현재: 'use client'에서 searchParams: Promise<{cid?}> 사용
export default function LandingPage({ searchParams }: { searchParams: Promise<{ cid?: string }> }) {
  useEffect(() => {
    searchParams.then(params => { ... }); // 불필요한 Promise 처리
  }, [searchParams]);
```

**문제점**: Next.js 15+에서 Server Component는 `searchParams`를 `Promise`로 받지만, `'use client'`인 컴포넌트에서는 이 패턴이 불필요하고 혼란을 야기

**개선 방안**: Landing 페이지를 Server Component로 분리하거나 `useSearchParams()` 훅 사용

---

### 9. URL 분석기 — 실제 값과 무관한 Mock 결과

**위치**: `src/app/page.tsx` L186–274 (`UrlAnalyzer` 컴포넌트)

```typescript
// ❌ URL과 무관하게 랜덤 이슈 수 반환
const [issueCount] = useState(() => Math.floor(Math.random() * (6 - 3 + 1)) + 3);
```

**문제점**: 사용자가 실제 URL을 입력해도 결과가 랜덤 → 신뢰성 저하  
**개선 방안**: 최소한 URL 패턴 분석(도메인 체크)이라도 반영, 또는 "데모 분석" 명시

---

### 10. 인터랙티브 가격 계산기 슬라이더 비율 오류

**위치**: `src/app/page.tsx` L319

```typescript
// ❌ storeCount/2: 가맹점 200개일 때 배경이 100%가 아닌 50%만 채워짐
background: `linear-gradient(to right, #c9a84c ${storeCount / 2}%, ...)`
// ✅ 수정: storeCount / 200 * 100
background: `linear-gradient(to right, #c9a84c ${(storeCount / 200) * 100}%, ...)`
```

---

## 🟢 Low — 코드 품질 개선

### 11. TypeScript — `as` 캐스팅 남용

**위치**: `src/lib/auth.ts`

```typescript
// ❌ 불필요한 타입 단언
role: 'client_hr' as RoleType,
role: 'counselor' as RoleType,
```

`RoleType` 타입에 이미 해당 값들이 포함되어 있으므로 `as` 불필요 — IDE의 타입 체크를 우회함

---

### 12. 마법 숫자 — 인라인 색상/수치 하드코딩

**위치**: `src/app/page.tsx` 전체

```typescript
// ❌ 수백 개의 인라인 스타일
style={{ color: '#c9a84c' }}
style={{ background: 'rgba(201,168,76,0.15)' }}
```

**개선**: CSS 변수 또는 Tailwind 커스텀 컬러 토큰으로 통일

```css
:root {
  --color-gold: #c9a84c;
  --color-gold-light: #e8c87a;
  --color-navy: #04091a;
}
```

---

### 13. `_PRICING_PLANS` 변수 — 미사용 dead code

**위치**: `src/app/page.tsx` L122–177

```typescript
// 변수명 앞에 _ 접두사 → 미사용 상태
const _PRICING_PLANS = [ ... ];
```

사용되지 않는 코드는 번들 크기를 늘리고 혼란을 야기 → 삭제 또는 실제 활용

---

### 14. `runAutoPipeline` 재귀 setTimeout 메모리 리스크

**위치**: `src/lib/mockStore.ts` L435–482

```typescript
function runAutoPipeline(companyId: string, delay = 0) {
  setTimeout(() => {
    // ...
    runAutoPipeline(companyId, 800); // 재귀 호출
  }, delay);
}
```

**문제점**: 자동화 파이프라인의 각 단계가 완료되면 다음 단계를 재귀적으로 호출 → 명시적인 종료 조건 없이 탈출하는 구조  
**개선**: Promise 체이닝 또는 State Machine 패턴(XState 등) 도입

---

### 15. 자동화 로그 인메모리 인덱스 리셋 문제

**위치**: `src/lib/mockStore.ts` L762–766

```typescript
let _lawyerIdx = 0; // 모듈 레벨 인메모리 상태
function assignNextLawyer(): string {
  const l = LAWYERS[_lawyerIdx % LAWYERS.length];
  _lawyerIdx++;
  return l;
}
```

**문제점**: 페이지 새로고침 시 인덱스가 0으로 리셋 → 라운드로빈이 첫 번째 변호사부터 다시 시작  
`AutoSettings.lawyerRoundRobin`에 이미 localStorage 저장 로직이 있지만 `_lawyerIdx`와 이중으로 관리됨

---

---

## 🆕 추가 발견 항목 (초기 분석 미포함 파일)

### 16. `dripStore.ts` — 임시 비밀번호 평문 저장 + 인메모리 휘발성

**위치**: `src/lib/dripStore.ts` L24, L165, L173, L194

```typescript
// ❌ DripMember 인터페이스에 tempPassword 평문 필드
tempPassword: string;

// ❌ Mock 데이터에 임시 비밀번호 하드코딩
tempPassword: 'IBS2026!',

// ❌ 인메모리 배열 — 서버 재시작 시 모든 멤버 삭제됨
let _members: DripMember[] = [...]
```

**문제점 3가지**:
1. 임시 비밀번호(`IBS2026!`)가 코드에 하드코딩 → Git 히스토리에 영구 노출
2. `tempPassword` 필드가 평문으로 저장 → `auth.ts`의 동일 문제 반복
3. `_members` 인메모리 배열 → 서버/Vercel cold start 시 모든 드립 멤버 초기화

**개선**:
```typescript
// 임시 비밀번호는 생성 후 해싱 저장, 원본은 이메일 발송 후 즉시 파기
const tempPw = generateTempPassword();
await sendEmail(contactEmail, tempPw);  // 발송
const member = { ..., tempPasswordHash: await hash(tempPw) }; // 해시만 저장
```

---

### 17. `leadStore.ts` — 인메모리 전용 + `Date.now()` ID 충돌 위험

**위치**: `src/lib/leadStore.ts` L159, L168, L200–201

```typescript
// ❌ 인메모리만 사용 — 새로고침 시 초기 Mock 데이터로 리셋
let _leads: Lead[] = [...INITIAL_LEADS];

// ❌ Date.now() 기반 ID — 동시 등록 시 충돌 가능
id: `lead_${Date.now()}_${i}`,

// ❌ addMemo와 addTimelineEvent가 같은 밀리초에 실행되면 동일 ID 생성
id: `m_${Date.now()}`,
id: `t_${Date.now() + 1}`,  // +1로 회피했지만 불안정
```

**문제점**:
- `mockStore.ts`는 localStorage 사용 → 새로고침 유지
- `leadStore.ts`는 인메모리만 → 새로고침 시 리드 데이터 초기화
- 동일 Store임에도 **데이터 영속성 전략이 다름** → 혼란 유발

**개선**: `crypto.randomUUID()` 사용 + localStorage 또는 Supabase 연동 통일

---

### 18. `api/analyze/route.ts` — 입력값 검증 없음 + URL 실제 미사용

**위치**: `src/app/api/analyze/route.ts` L27–46

```typescript
export async function POST(request: NextRequest) {
    const body = await request.json(); // ❌ 파싱 실패 시 500 에러
    const { url, companyId } = body;

    // ❌ url을 받지만 실제로 사용하지 않음 — 항상 동일한 MOCK_ISSUES 반환
    return NextResponse.json({ issues: MOCK_ISSUES });
}
```

**문제점 3가지**:
1. `request.json()` 실패(Content-Type 오류 등) 시 try-catch 없어 500 에러 그대로 노출
2. URL 파라미터를 받지만 실제 분석에 전혀 사용하지 않음 → API 계약 불이행
3. 응답에 `riskLevel`이 항상 `'HIGH'`로 고정 → 클라이언트가 이 값을 신뢰하면 버그

**개선**:
```typescript
export async function POST(request: NextRequest) {
    let body;
    try { body = await request.json(); } 
    catch { return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 }); }
    // url 파라미터를 실제 사용하거나 '데모 분석' 명시
}
```

---

### 19. `Navbar.tsx` — 세션 동기화 이슈 + 미존재 경로 링크

**위치**: `src/components/layout/Navbar.tsx` L176–178, L139, L293

```typescript
// ❌ pathname 변경 시마다 localStorage 읽기 (성능 비효율)
useEffect(() => {
    setUser(getSession()); // 매 라우트 이동마다 재실행
}, [pathname]);

// ❌ /my-page 경로가 존재하지 않음
<Link href="/my-page">내 페이지</Link>
```

**문제점**:
1. 다른 탭에서 로그아웃해도 현재 탭 Navbar는 로그인 상태 유지 (localStorage는 탭간 동기화 없음)
2. `/my-page` 경로가 `src/app/` 어디에도 없음 → 클릭 시 404
3. `AuthContext.tsx`가 별도로 존재하는데 Navbar는 이를 사용하지 않고 직접 `getSession()` 호출 → 인증 상태 불일치 가능

**개선**:
```typescript
// AuthContext 사용으로 통일
const { user } = useAuth(); // AuthContext에서
// 또는 storage 이벤트 구독으로 타 탭 로그아웃 감지
window.addEventListener('storage', (e) => {
    if (e.key === AUTH_KEY) setUser(getSession());
});
```

---

## 📋 Phase별 우선순위 로드맵

### Phase 1 — Quick Wins (1주 이내)
- [ ] 오탈자 수정 (7번 항목)
- [ ] 슬라이더 비율 수정 (10번 항목)
- [ ] `_PRICING_PLANS` dead code 제거 (13번 항목)
- [ ] CSS 변수 정의 및 인라인 색상 교체 시작 (12번 항목)

### Phase 2 — 보안 강화 (2주 이내)
- [ ] 비밀번호 해싱 도입 (1번 항목) — `bcryptjs` 패키지 추가
- [ ] `dripStore` 임시 비밀번호 해싱 + Git 히스토리 평문 제거 (16번 항목)
- [ ] 미들웨어 RBAC 완성 (2번 항목)
- [ ] 사업자번호 로그인 검증 강화 (3번 항목)
- [ ] `/my-page` 경로 생성 또는 Navbar 링크 수정 (19번 항목)

### Phase 3 — 아키텍처 리팩토링 (4주 이내)
- [ ] Supabase 실제 연동 전환 (5번 항목) — `supabase.ts` 활성화
- [ ] `leadStore` + `dripStore` 인메모리 → localStorage 또는 Supabase 통일 (17번 항목)
- [ ] `api/analyze/route.ts` 입력 검증 + try-catch 추가 (18번 항목)
- [ ] Navbar 세션 동기화 — `AuthContext` 통일 (19번 항목)
- [ ] 랜딩 페이지 컴포넌트 분리 (4번 항목)
- [ ] `mockStore.ts` 도메인별 분리 (4번 항목)
- [ ] `searchParams` 처리 방식 수정 (8번 항목)

### Phase 4 — 완성도 (6주 이내)
- [ ] 상태 관리 통일 (Zustand 도입) (6번 항목)
- [ ] URL 분석기 신뢰성 개선 (9번 항목)
- [ ] `runAutoPipeline` State Machine 전환 (14번 항목)

---

## 📁 분석 대상 파일 목록

| 파일 | 라인 수 | 주요 역할 |
|------|---------|---------|
| `src/app/page.tsx` | 1,138 | 메인 랜딩페이지 (전체 섹션 포함) |
| `src/lib/mockStore.ts` | 911 | 핵심 데이터 저장소 + 자동화 파이프라인 |
| `src/lib/auth.ts` | 339 | 인증/세션/권한 관리 |
| `src/lib/supabase.ts` | 109 | Supabase 연동 준비 레이어 |
| `src/middleware.ts` | 36 | 라우트 보호 미들웨어 |
| `src/lib/dripStore.ts` | - | Drip 마케팅 캠페인 |
| `src/lib/leadStore.ts` | - | 리드 관리 |
| `src/lib/AuthContext.tsx` | - | React Context 인증 상태 |
| `src/components/ui/` | - | Button, Card 공통 컴포넌트 |
| `src/components/layout/` | - | 레이아웃 컴포넌트 |

---

## ✅ 잘 구현된 부분

1. **역할 기반 모듈 레지스트리** (`MODULE_REGISTRY`) — 새 기능 추가 시 단일 진실 공급원(SSOT) 패턴이 잘 적용됨
2. **자동화 파이프라인 설계** — 영업컨펌 → 변호사배정 → 이메일발송 흐름이 체계적
3. **TypeScript 타입 정의** — `RoleType`, `CaseStatus`, `Company` 등 도메인 타입이 잘 정의됨
4. **Supabase 마이그레이션 준비** — `supabase.ts`에 SQL 스키마와 마이그레이션 가이드가 미리 준비됨
5. **Framer Motion 활용** — 랜딩 페이지의 스크롤 애니메이션과 전환 효과가 세련되게 구현됨
6. **가격 계산 공식** — `calcPrice()` 함수로 가맹점 수 기반 요금 산정 로직이 명확히 분리됨
