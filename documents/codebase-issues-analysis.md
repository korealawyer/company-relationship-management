# 코드베이스 이슈 분석 보고서

> **프로젝트**: IBS Law Firm — Company Relationship Management  
> **분석 일자**: 2026-03-05  
> **분석 대상**: `src/` 전체 (app 라우트, lib, components, API routes)  
> **분류 기준**: 🔴 심각(즉시 수정) · 🟡 주의(단기 해결) · 🟢 개선(장기 과제)

---

## 1. 보안 취약점 (Security)

### 🔴 [S-01] 인증 시스템 전체가 모킹(Mock) 기반

**파일**: `src/lib/auth.ts`

- 사용자 자격증명(`MOCK_ACCOUNTS`)이 소스코드에 평문(plain text)으로 하드코딩됨
- 비밀번호 비교가 `=== password` 단순 문자열 비교 (해시 없음)
- 세션이 `localStorage` + 쿠키에 JSON 직렬화로 저장됨 → XSS 취약
- `INVITE_CODES` (초대코드) 도 소스코드에 하드코딩

```ts
// 현재 코드 (취약)
if (acc.password === password) { ... }
```

**영향**: 누구든 소스코드를 보면 모든 계정 자격증명 획득 가능  
**해결**: Supabase Auth + bcrypt 마이그레이션 (auth.ts 내부 Phase 3 TODO에 명시됨)

---

### 🔴 [S-02] 미들웨어 Role 검증이 쿠키 값에만 의존

**파일**: `src/middleware.ts`

- `ibs_role` 쿠키 값을 직접 비교하는 방식 사용
- 쿠키는 클라이언트가 임의로 수정 가능 → 권한 우회 가능성
- 서버 세션 검증 또는 JWT 서명 검증 없음

---

### 🟡 [S-03] 회원가입 최소 비밀번호 6자리 — 너무 짧음

**파일**: `src/app/signup/page.tsx` (line 86)

```ts
if (password.length < 6) { setInfoError('비밀번호는 6자 이상이어야 합니다.'); return; }
```

법률 서비스 특성상 최소 8자+특수문자 강제 필요

---

### 🟡 [S-04] 회원가입 성공 후 자동 로그인 처리 없음

**파일**: `src/app/signup/page.tsx`

- `signUp()` 호출 후 사용자를 `/chat`으로 즉시 라우팅하지만 실제 세션 생성 없음
- 사용자가 `/chat` 에서 API 요청 시 401 발생할 수 있음

---

## 2. 미구현 기능 (Unimplemented Features)

### 🔴 [U-01] 결제 기능 전체 미구현

**관련 파일**: `src/app/consultation/page.tsx`, `src/app/onboarding/page.tsx`

- 결제 UI (카드, 카카오페이 버튼)가 존재하지만 **클릭해도 아무 동작 없음**
- 결제 버튼에 `onClick` 핸들러 미연결
- `onboarding/page.tsx` 에 "Phase 2: KCP 결제창" 주석이 있으나 미구현 상태
- 결제 성공/실패 여부 무관하게 다음 단계로 진행됨

```tsx
// consultation/page.tsx - 죽은 버튼
<button className="...btn-gold flex items-center justify-center gap-2">
    <CreditCard className="w-4 h-4" /> 카드로 결제하기
</button>
```

---

### 🔴 [U-02] 전자계약 서명 기능 미구현

**파일**: `src/app/contracts/page.tsx`

- "이메일로 발송" 버튼에 핸들러 없음
- 계약서 상세 페이지 `/contracts/[id]` 가 `src/app/contracts/` 하위에 디렉토리가 있으나 라우팅 확인 필요
- 서명 링크가 `Math.random().toString(36).slice(2, 10)` 기반의 더미 URL 생성
- 페이지 하단 주석: `"Phase 2: 모두사인·DocuSign API 연동"`

---

### 🔴 [U-03] AI 분석 API가 실제 URL 분석 안 함

**파일**: `src/app/api/analyze/route.ts`

- URL을 받아도 실제 크롤링/분석 없이 `DEMO_ISSUES` 하드코딩 배열을 그대로 반환
- `isDemoMode: true` 플래그를 반환하지만 클라이언트 UI에서 이를 눈에 보이게 표시하지 않음
- URL 길이로 리스크 등급을 추정하는 극히 단순한 로직 사용

```ts
// URL 길이로 리스크 추정 (실제 분석 아님)
if (url.length >= 30) return 'LOW';
```

---

### 🔴 [U-04] 국세청 사업자번호 조회 미구현

**파일**: `src/app/onboarding/page.tsx` (line 27-28)

```ts
// Phase 2: 국세청 API 조회
setBiz(p => ({ ...p, companyName: '(주)테스트가맹본부', ceoName: '홍길동', ... }));
```

실제 조회 없이 항상 더미 데이터 반환. 사용자가 실제 사업자번호 입력해도 무의미.

---

### 🟡 [U-05] 이메일 발송 API 실제 동작 미확인

**파일**: `src/app/api/email/` (라우트 존재)

- `employee/page.tsx`에서 `store.sendEmail()` 호출하지만 `mockStore`에 있는 함수이므로 실제 이메일 미발송
- 외부 SMTP/SES 연동 여부 불명확

---

### 🟡 [U-06] 카카오톡 알림 발송 언급됐으나 미구현

**파일**: `src/app/onboarding/page.tsx` (line 175)

```tsx
담당 변호사 배정 완료 알림이 카카오톡으로 발송됩니다.
```

카카오 알림톡 API 연동 코드 없음. 빈 약속.

---

## 3. 연결성 오류 (Dead Links & Routing Errors)

### 🔴 [R-01] `/chat` 페이지가 미들웨어에서 보호되지 않음

**파일**: `src/middleware.ts`, `src/app/api/chat/route.ts`

- `chat/page.tsx` 프론트엔드는 인증 체크 없이 누구나 접근 가능
- `api/chat/route.ts` 는 `requireSessionFromCookie` 로 보호되어 있으나
- 미인증 사용자가 `/chat` 에 접근하면 UI는 보이지만 API 요청 시 401이 발생하는 불일치

---

### 🔴 [R-02] `/pricing` 페이지 링크 다수 — 페이지 내용 및 연결 미확인

**관련 파일**: `client-portal`, `consultation`, `landing` 등 다수

- `<Link href="/pricing">` 가 7개 이상의 컴포넌트에서 참조됨
- `src/app/pricing/page.tsx` 존재하나 코드 검토 시 실제 결제 연동 없음
- 프리미엄 플랜 가격 `₩990,000/월` 또는 `₩99,000/월` 이 페이지마다 다름 (데이터 불일치)

---

### 🔴 [R-03] `/sales` 페이지 링크 — 구현 상태 불명확

**관련 파일**: `client-portal/page.tsx` (lines 140, 366)

```tsx
<Link href="/sales">전문 상담 신청</Link>
```

`src/app/sales/` 디렉토리는 존재하나 기능 구현 수준 미확인.

---

### 🟡 [R-04] 회원가입 완료 후 `/chat` 으로 라우팅 — 채팅 인증 불일치

**파일**: `src/app/signup/page.tsx` (line 415)

```tsx
<button onClick={() => router.replace('/chat')}>법률 문의 시작하기 →</button>
```

회원가입 후 세션이 제대로 설정되지 않으면 `/api/chat` 에서 인증 오류 발생 가능.

---

### 🟡 [R-05] `contracts/[id]` 상세 라우트 미구현 가능성

**파일**: `src/app/contracts/page.tsx` (line 156)

```tsx
<Link href={`/contracts/${c.id}`}>
```

해당 동적 라우트(`contracts/[id]/page.tsx`)의 존재 여부 및 구현 수준 확인 필요.

---

### 🟡 [R-06] `onboarding` 완료 후 `/login` 으로 리다이렉트 — 자동 로그인 없음

**파일**: `src/app/onboarding/page.tsx` (line 36)

```ts
router.push('/login');
```

온보딩 완료(결제 후)에 로그인 페이지로만 보냄. 자동 세션 생성 및 대시보드 이동 없음.

---

## 4. 프로덕션 미적합 코드 (Debug / Dev Code in Production)

### 🔴 [D-01] 테스트 UI가 프로덕션 페이지에 노출

**파일**: `src/app/company-hr/page.tsx` (lines 96-101, 310-315)

```tsx
// 테스트 데이터 추가 버튼이 HR 담당자 UI에 그대로 노출됨
<button onClick={addMockPending}>+ 테스트 신청 추가</button>
<button onClick={() => { setShowNew(false); setCreated(false); ... }}>테스트 데이터 추가해보기</button>
```

실제 사용자가 "테스트 신청 추가" 버튼을 누르면 더미 데이터가 DB(localStorage)에 추가됨.

---

### 🔴 [D-02] `require()` 동적 임포트 사용 (CommonJS in ESM)

**파일**: `src/app/company-hr/page.tsx` (line 98)

```ts
const { requestAffiliation } = require('@/lib/auth');
```

Next.js App Router는 ES Modules 기반. `require()` 는 예상치 못한 번들 오류를 유발할 수 있음.  
`import` 구문 및 상단 정적 임포트로 변경 필요.

---

### 🟡 [D-03] 초대코드 테스트 값이 UI에 노출

**파일**: `src/app/signup/page.tsx` (lines 284-285)

```tsx
<div className="text-[10px]">
    테스트 코드: <b>GYOCHON-2026</b> / <b>NOLBOO-2026</b>
</div>
```

실제 서비스에서 초대코드가 UI에 직접 표시되면 보안 의미가 없어짐.

---

### 🟡 [D-04] 사업자번호 테스트 값이 UI에 노출

**파일**: `src/app/signup/page.tsx` (lines 310-311)

```tsx
테스트: <b>123-45-67890</b> (놀부NBG) / <b>999-90-01001</b> (가맹점)
```

---

### 🟡 [D-05] AI 분석 API `isDemoMode` 미표시

**파일**: `src/app/api/analyze/route.ts`, `src/app/client-portal/page.tsx`

API는 `isDemoMode: true` 를 반환하지만 클라이언트 포털은 이를 사용자에게 알리지 않음.  
사용자는 실제 분석 결과라고 오인할 수 있음.

---

## 5. 데이터 일관성 오류 (Data Consistency)

### 🟡 [DC-01] 플랜 가격 불일치

| 위치 | 표시 가격 |
|------|-----------|
| `consultation/page.tsx` | Basic ₩990,000/월 |
| `client-portal/page.tsx` | 월 99,000원부터 시작 |
| `onboarding/page.tsx` | Basic ₩990,000 / Pro ₩2,490,000 / Premium ₩4,990,000 |

동일 서비스의 가격이 페이지마다 다름. 사용자 혼란 및 신뢰도 저하.

---

### 🟡 [DC-02] 하드코딩된 회사명 (목업 데이터)

모든 주요 페이지에서 실제 세션 데이터가 아닌 하드코딩된 회사명 사용:

| 파일 | 하드코딩 값 |
|------|------------|
| `company-hr/page.tsx` | `(주)교촌에프앤비` |
| `client-portal/page.tsx` | `(주)놀부NBG` |
| `dashboard/page.tsx` | 세션 기반이지만 fallback이 목업 |

세션에서 `companyId` 를 가져오려는 시도가 있으나 (`company-hr` line 77-85) 기본값이 `'c2'`로 하드코딩됨.

---

### 🟡 [DC-03] 상담사(counselor) 페이지 인증 전혀 없음

**파일**: `src/app/counselor/page.tsx`

- `useEffect`, `getSession()` 등 인증 코드 전혀 없음
- 미들웨어가 `/counselor` 를 `counselor` 롤로 제한하고 있더라도, 페이지 자체에 세션 의존 데이터가 없어 무의미
- 모든 케이스 데이터가 하드코딩

---

## 6. UX / 접근성 문제 (UX Issues)

### 🟡 [UX-01] 폼 제출 후 성공/실패 피드백 불충분

**파일**: `src/app/contracts/page.tsx`

- 계약서 생성 버튼 클릭 시 `setCreated(true)` 만 실행, 실제 API 요청 없음
- 생성된 서명 링크가 `Math.random()` 기반이라 매 렌더마다 바뀜

---

### 🟡 [UX-02] 에러 상태 미처리 페이지 다수

다음 페이지들은 API 오류 시 사용자에게 에러를 알리지 않음:

- `chat/page.tsx`: catch 블록이 일반 언어 오류 메시지를 챗에 넣음 (양호)
- `consultation/page.tsx`: 결제 버튼이 onClick 없음 (사용자가 클릭해도 반응 없음)
- `contracts/page.tsx`: 이메일 발송 버튼에 핸들러 없음

---

### 🟢 [UX-03] 모바일 레이아웃 미검증

- `employee/page.tsx` (영업팀 CRM): 10컬럼 테이블인데 모바일 반응형 없음
- `src/app/admin/page.tsx`: 복잡한 그리드 레이아웃이 소형 화면에서 깨질 수 있음

---

## 7. 코드 품질 문제 (Code Quality)

### 🟡 [CQ-01] `any` 타입 사용

**파일**: `src/app/onboarding/page.tsx` (line 47)

```tsx
const InputRow = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
```

TypeScript 타입 안전성 포기.

---

### 🟡 [CQ-02] 폼 유효성 검사 누락

- `onboarding/page.tsx`: 스텝 이동 시 이전 스텝 데이터 유효성 검사 없이 진행 가능
- `contracts/page.tsx`: `handleCreate()`가 제목만 체크하고 이메일 형식 검증 없음

---

### 🟡 [CQ-03] 비효율적 setInterval 사용

**파일**: `src/app/employee/page.tsx` (line 195)

```ts
useEffect(() => { refresh(); const id = setInterval(refresh, 2000); return () => clearInterval(id); }, [refresh]);
```

서버에서 데이터를 받지 않고 localStorage를 2초마다 폴링. 실제 다중 사용자 환경에서는 동기화 안 됨.

---

### 🟢 [CQ-04] 대형 단일 파일 컴포넌트

- `employee/page.tsx`: 568줄 (여러 서브컴포넌트를 같은 파일에 포함)
- `consultation/page.tsx`: 521줄
- 이미 `src/components/landing/` 분리 패턴을 적용했으나 대부분 페이지에 적용 안 됨

---

### 🟢 [CQ-05] `React` 미사용 임포트 혼재

일부 파일은 `import React from 'react'`, 일부는 임포트 없음 — Next.js에서는 필요 없으나 일관성 부재.

---

## 8. 미구현 API 엔드포인트

| 엔드포인트 | 상태 | 비고 |
|-----------|------|------|
| `POST /api/analyze` | 🟡 데모모드 | 실제 URL 크롤링 없음 |
| `POST /api/chat` | 🟡 조건부 | `ANTHROPIC_API_KEY` 없으면 목업 |
| `POST /api/email` | 🔴 확인필요 | 실제 발송 여부 불명확 |
| `POST /api/analyze-privacy` | 🔴 확인필요 | 구현 수준 미확인 |
| `GET /api/company` | 🔴 확인필요 | 구현 수준 미확인 |
| `GET /api/leads` | 🔴 확인필요 | 구현 수준 미확인 |
| `GET /api/notion` | 🔴 확인필요 | Notion API 연동 여부 불명확 |
| `GET /api/drip` | 🔴 확인필요 | 이메일 드립 캠페인 구현 여부 불명확 |
| `GET /api/review` | 🔴 확인필요 | 리뷰 API 용도 불명확 |

---

## 9. 총 정리

| 분류 | 심각(🔴) | 주의(🟡) | 개선(🟢) |
|------|---------|---------|---------|
| 보안 | 2 | 2 | 0 |
| 미구현 기능 | 4 | 2 | 0 |
| 연결성 오류 | 3 | 3 | 0 |
| 프로덕션 미적합 | 2 | 3 | 0 |
| 데이터 일관성 | 0 | 3 | 0 |
| UX/접근성 | 0 | 2 | 1 |
| 코드 품질 | 0 | 2 | 3 |
| **합계** | **11** | **17** | **4** |

---

## 10. 권고 우선순위

### Phase 1 (즉시 수정 — 배포 전 필수)
1. **[S-01]** 모든 하드코딩된 자격증명 환경변수로 분리
2. **[D-01]** 테스트 버튼/더미 데이터 추가 UI 프로덕션에서 제거
3. **[D-02]** `require()` → `import` 변경
4. **[D-03/04]** 테스트 코드/번호 UI 노출 제거
5. **[U-01]** 결제 버튼에 최소한의 에러 메시지 또는 비활성화 처리

### Phase 2 (단기 — 1~2주)
1. **[S-02]** 미들웨어 JWT 서명 검증 추가
2. **[U-03]** `isDemoMode` 사용자 노출 처리
3. **[DC-01]** 플랜 가격 통합 (단일 소스)
4. **[R-01]** `/chat` 프론트엔드 인증 가드 추가
5. **[U-04]** 온보딩 사업자번호 조회 실제 구현 또는 명시적 "데모" 표시

### Phase 3 (장기 — 핵심 기능 구현)
1. Supabase Auth 마이그레이션 (S-01 근본 해결)
2. 결제 게이트웨이 연동 (KCP/토스페이먼츠)
3. DocuSign 또는 모두사인 전자계약 연동
4. Anthropic API 안정화 + 실제 URL 분석 (Puppeteer/Playwright)
5. 카카오 알림톡 API 연동
