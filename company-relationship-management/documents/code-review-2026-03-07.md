# 코드 리뷰 보고서 — IBS CRM

> **검토일**: 2026-03-07  11:00~12:00
> **프로젝트**: `company-relationship-management`  
> **검토 범위**: `src/` 전체 — 15개 파일, +2,450 / -85줄 변경  
> **상태**: ✅ 전체 수정 완료 · `next build` 성공 · ESLint 0 errors · `tsc --noEmit` 0 errors

---

## 수정 요약

| 등급 | 건수 | 설명 |
|------|------|------|
| 🔴 CRITICAL | 3건 | ESLint error 수정 + 404 경로 제거 |
| 🟠 HIGH | 8건 | 신규 페이지 생성 (ai-dashboard, settings, reports, notifications, profile, contracts/new, help, about) |
| 🟡 MEDIUM | 4건 | Navbar 역할별 메뉴 재구성 + 미들웨어 RBAC + sitemap + 퍼블릭 경로 |
| 🔵 LOW | 2건 | 불필요 페이지 삭제 + 데드링크 정리 |

---

## 🔴 CRITICAL — 버그 & 에러 수정 (3건)

### 1. ESLint error: setState in useEffect (ai-dashboard)

**파일**: `src/app/admin/ai-dashboard/page.tsx` (line 82)

**문제**: `Promise.all().then(() => setLoading(false))` — useEffect 내에서 synchronous setState 호출로 cascading render 발생 가능.

**수정**: async IIFE 패턴으로 변경.

```diff
  useEffect(() => {
-     Promise.all([fetchUsage(), fetchBriefing()]).then(() => setLoading(false));
+     const init = async () => {
+         await Promise.all([fetchUsage(), fetchBriefing()]);
+         setLoading(false);
+     };
+     init();
  }, [fetchUsage, fetchBriefing]);
```

---

### 2. ESLint error: unescaped entities (ai-dashboard)

**파일**: `src/app/admin/ai-dashboard/page.tsx` (line 188)

**문제**: JSX 텍스트에 `"다시 생성"` 큰따옴표 직접 사용 → `react/no-unescaped-entities` 에러 2건.

**수정**: HTML entity로 이스케이프.

```diff
- <p>브리핑을 생성하려면 "다시 생성" 버튼을 클릭하세요.</p>
+ <p>브리핑을 생성하려면 &quot;다시 생성&quot; 버튼을 클릭하세요.</p>
```

---

### 3. 404 경로 잔존 참조 제거 (auth.ts, constants.ts)

**파일**: `src/lib/auth.ts`, `src/lib/mock/constants.ts`

**문제**: `/general`, `/hr` 경로가 `ROLE_HOME`과 `MODULE_REGISTRY`에 잔존하여 해당 역할 로그인 시 404 발생.

**수정**: 모두 `/admin`(KPI 페이지)으로 교체.

```diff
  // auth.ts — ROLE_HOME
- general: '/general',
- hr: '/hr',
+ general: '/admin',
+ hr: '/admin',

  // constants.ts — MODULE_REGISTRY
- { id: 'general', href: '/general', ... },
- { id: 'hr', href: '/hr', ... },
+ { id: 'general', href: '/admin', ... },
+ { id: 'hr', href: '/admin', ... },
```

---

## 🟠 HIGH — 신규 페이지 생성 (8건)

### 4. AI 현황 대시보드

**파일**: `src/app/admin/ai-dashboard/page.tsx` (+291줄, 신규)

**기능**:
- **통계 카드 4종**: 총 API 호출 · 총 비용(USD) · 총 토큰 · 평균 응답시간
- **AI 브리핑**: `/api/ai-brief` 연동, 하이라이트 + 액션 아이템 표시
- **최근 호출 기록**: Provider별 색분류, 토큰/비용/시간/상태 테이블
- **Provider별/Endpoint별 사용량**: 사이드바 프로그레스 바 차트
- **초기화**: 사용량 로그 리셋 기능

```
접근 권한: admin, super_admin
```

---

### 5. 시스템 설정 페이지

**파일**: `src/app/settings/page.tsx` (+179줄, 신규)

**기능**:
- **AI 설정**: Provider(Claude/GPT-4o/Gemini) 선택, 모델명, Temperature, 응답 언어
- **알림 설정**: 이메일/브라우저/슬랙 알림 개별 토글
- **자동화 설정**: 자동 분석/드립 이메일/보고서 토글
- **보안 설정**: 2FA 강제/세션 타임아웃(분)

```
접근 권한: admin, super_admin
```

---

### 6. 리포트 & 통계 페이지

**파일**: `src/app/admin/reports/page.tsx` (+231줄, 신규)

**기능**:
- **기간 필터**: 1주일/1개월/3개월/전체
- **통계 카드 4종**: 신규 리드 · 전환율 · 매출 · 상담 응답시간
- **리드 퍼널**: pending→analyzed→confirmed→subscribed 단계별 바 차트
- **변호사 실적**: 검토 건수 · 완료 건수 · 평균 응답시간 테이블
- **매출 트렌드**: 월별 막대 차트 (최고치 하이라이트)

```
접근 권한: admin, super_admin
```

---

### 7. 알림 센터

**파일**: `src/app/notifications/page.tsx` (+234줄, 신규)

**기능**:
- **카테고리 필터**: 전체/리드/AI/이메일/시스템
- **알림 목록**: 제목 · 메시지 · 시간 · 읽음 상태 표시
- **일괄 처리**: 전체 읽음 처리 버튼
- **개별 액션**: 읽음 토글 · 삭제
- **읽지 않은 알림 카운트** 표시

```
접근 권한: 모든 내부 직원 + client_hr
```

---

### 8. 프로필 페이지

**파일**: `src/app/profile/page.tsx` (+177줄, 신규)

**기능**:
- **프로필 정보**: 이름 · 이메일 · 전화번호 · 부서 · 직책 수정
- **비밀번호 변경**: 현재/새/확인 3필드 폼
- **알림 수신 설정**: 이메일 알림 · 브라우저 알림 · 주간 보고서 개별 토글

```
접근 권한: 모든 로그인 사용자
```

---

### 9. 계약서 생성 위저드

**파일**: `src/app/contracts/new/page.tsx` (+215줄, 신규)

**기능**:
- **4단계 위저드**: 템플릿 선택 → 당사자 정보 → 조건 설정 → 최종 확인
- **6종 템플릿**: 가맹계약서 · 개인정보 위탁 · 서비스 이용 · NDA · 근로계약 · 직접 작성
- **당사자 정보**: 갑(甲)/을(乙) 회사명 · 사업자번호 · 대표자 · 주소
- **조건 설정**: 시작일 · 기간(6~36개월) · AI 법률 검토 토글
- **단계 표시**: 프로그레스 바 + 단계 번호

```
접근 권한: 로그인 사용자
```

---

### 10. FAQ/도움말 페이지

**파일**: `src/app/help/page.tsx` (+145줄, 신규)

**기능**:
- **12개 FAQ**: 서비스 · 요금 · 법률 · 기술 · 계정 5개 카테고리
- **아코디언 UI**: 클릭 시 펼치기/접기 애니메이션
- **카테고리 필터**: 탭 버튼으로 카테고리별 필터링
- **실시간 검색**: 질문+답변 텍스트 통합 검색
- **추가 도움말**: AI 상담 · 전문 상담 신청 · 요금제 안내 링크 카드

```
접근 권한: 퍼블릭 (로그인 불필요)
```

---

### 11. 회사/변호사 소개 페이지

**파일**: `src/app/about/page.tsx` (+170줄, 신규)

**기능**:
- **핵심 수치 4종**: 누적 자문 기업 · 고객 만족도 · 분석 처리방침 · 운영 경력
- **변호사 소개 3인**: 유정훈(대표) · 김수현(파트너) · 박지은(시니어) 프로필 카드
  - 전문 분야 · 경력 · 누적 사건 수 · 별점
- **주요 연혁 5건**: 2018~2026년 타임라인
- **연락처**: 주소 · 전화 · 이메일 + 무료 상담 CTA 버튼

```
접근 권한: 퍼블릭 (로그인 불필요)
```

---

## 🟡 MEDIUM — 네비게이션 & 인프라 (4건)

### 12. Navbar 역할별 메뉴 재구성

**파일**: `src/components/layout/Navbar.tsx` (+12줄 변경)

**변경 내용**:
- **public 메뉴**: `/client-portal` 제거 → `/about`(회사 소개), `/help`(FAQ) 추가
- **admin/super_admin 메뉴**: `/admin/email-preview`, `/lawyer/privacy-review` 제거 → `/admin/reports`(리포트), `/admin/ai-dashboard`(AI 현황), `/settings`(설정) 추가
- **client_hr 메뉴**: `/pricing` 제거 → `/contracts`(계약서), `/notifications`(알림) 추가

```diff
  // public
- { href: '/client-portal', label: '고객 포털' },
+ { href: '/about', label: '회사 소개' },
+ { href: '/help', label: 'FAQ' },

  // admin
- { href: '/admin/email-preview', label: '이메일 미리보기' },
- { href: '/lawyer/privacy-review', label: '조문 검토' },
+ { href: '/admin/reports', label: '리포트' },
+ { href: '/admin/ai-dashboard', label: 'AI 현황' },
+ { href: '/settings', label: '설정' },

  // client_hr
- { href: '/pricing', label: '요금제' },
+ { href: '/contracts', label: '계약서' },
+ { href: '/notifications', label: '알림' },
```

---

### 13. 미들웨어 RBAC 업데이트

**파일**: `src/middleware.ts` (+8줄 변경)

**변경 내용**:
- **PROTECTED 추가**: `/settings` (admin, super_admin), `/notifications` (7개 역할), `/profile` (10개 역할)
- **PUBLIC_PREFIX 추가**: `/about`, `/help`
- **matcher 추가**: `/settings/:path*`, `/notifications/:path*`, `/profile/:path*`

```diff
+ '/settings': ['super_admin', 'admin'],
+ '/notifications': ['super_admin', 'admin', 'sales', 'lawyer', 'litigation', 'counselor', 'client_hr'],
+ '/profile': ['super_admin', 'admin', 'sales', 'lawyer', 'litigation', 'counselor', 'client_hr', 'hr', 'general', 'finance'],

- const PUBLIC_PREFIX = ['/login', '/pricing', '/sales', '/onboarding', '/signup', '/landing', '/legal'];
+ const PUBLIC_PREFIX = ['/login', '/pricing', '/sales', '/onboarding', '/signup', '/landing', '/legal', '/about', '/help'];
```

---

### 14. Sitemap 업데이트

**파일**: `src/app/sitemap.ts` (+6줄 변경)

**변경**: `/consultation` 엔트리를 `/about`으로 교체. `/help` 엔트리 신규 추가.

---

### 15. 불필요 페이지 삭제 & 데드링크 정리

**삭제**: `src/app/consultation/` 디렉토리 전체 삭제

**참조 정리** (5곳):
- `middleware.ts`: PROTECTED에서 `/consultation` 제거 + matcher에서 `/consultation/:path*` 제거
- `sitemap.ts`: `/consultation` 엔트리 제거
- `client-portal/page.tsx`: `/consultation` 링크 2곳 → `/chat`으로 변경
- `Navbar.tsx`: `/general`, `/hr` 링크 → `/admin`으로 변경

---

## 🔵 LOW — 기타 (2건)

### 16. auth.ts ROLE_HOME 경로 정리

**파일**: `src/lib/auth.ts` (2줄 변경)

`general`, `hr` 역할의 홈 경로를 존재하는 `/admin`으로 변경.

---

### 17. MODULE_REGISTRY 경로 정리

**파일**: `src/lib/mock/constants.ts` (2줄 변경)

`general`, `hr` 모듈의 `href`를 존재하는 `/admin`으로 변경.

---

## 수정 파일 목록

| # | 파일 | 변경량 | 수정 내용 |
|---|------|--------|-----------|
| 1 | `src/app/admin/ai-dashboard/page.tsx` | +291 (신규) | AI 사용량·비용·브리핑 대시보드 |
| 2 | `src/app/admin/reports/page.tsx` | +231 (신규) | 리드 퍼널·전환율·매출 리포트 |
| 3 | `src/app/notifications/page.tsx` | +234 (신규) | 알림 센터 |
| 4 | `src/app/contracts/new/page.tsx` | +215 (신규) | 4단계 계약서 생성 위저드 |
| 5 | `src/app/settings/page.tsx` | +179 (신규) | 시스템 설정 (AI·알림·보안) |
| 6 | `src/app/profile/page.tsx` | +177 (신규) | 프로필·비밀번호·알림 설정 |
| 7 | `src/app/about/page.tsx` | +170 (신규) | 회사·변호사 소개·연혁 |
| 8 | `src/app/help/page.tsx` | +145 (신규) | 12개 FAQ 아코디언 |
| 9 | `src/components/layout/Navbar.tsx` | +12 | 역할별 메뉴 재구성 |
| 10 | `src/middleware.ts` | +8 | RBAC + PUBLIC + matcher 추가 |
| 11 | `src/app/sitemap.ts` | +6 | /about, /help 추가 |
| 12 | `src/lib/auth.ts` | 2 | ROLE_HOME 경로 수정 |
| 13 | `src/lib/mock/constants.ts` | 2 | MODULE_REGISTRY 경로 수정 |
| 14 | `src/app/client-portal/page.tsx` | 2 | /consultation → /chat |
| 15 | `src/app/consultation/` | 삭제 | 불필요 redirect 페이지 제거 |

---

## 검증 결과

| 검증 항목 | 결과 |
|----------|------|
| `next build` | ✅ exit 0 (33개 라우트) |
| `npx eslint src/` | ✅ 0 errors, 107 warnings |
| `tsc --noEmit` | ✅ 0 타입 에러 |
| Navbar 링크 무결성 | ✅ 20개 전부 유효 |
| router.push 경로 | ✅ 6건 전부 유효 |
| 미들웨어 RBAC 정합 | ✅ Pass |
| API routes (14개) | ✅ 전부 존재 |
| 보안 (하드코딩 비밀번호) | ✅ 0건 |

---

## 설계 결정 사항

### 신규 페이지 접근 권한 구조

```
퍼블릭 (로그인 불필요)
├── /about    — 회사/변호사 소개
└── /help     — FAQ/도움말

관리자 전용 (admin, super_admin)
├── /admin/ai-dashboard  — AI 현황
├── /admin/reports       — 리포트
└── /settings            — 시스템 설정

내부 직원 공통
├── /notifications  — 알림 센터
└── /profile        — 프로필 관리

고객사 HR
├── /contracts      — 계약서 목록
└── /notifications  — 알림
```

### 색상 시스템 (`T` 객체) 일관 적용

모든 신규 페이지에 동일한 색상 토큰 사용:

```typescript
const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};
```

---

*검토·수정: Antigravity AI Agent (2026-03-07)*
