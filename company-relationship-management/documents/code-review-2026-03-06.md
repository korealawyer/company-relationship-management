# 코드 리뷰 보고서 — IBS CRM

> **검토일**: 2026-03-06  06:00~07:30
> **프로젝트**: `company-relationship-management`
> **검토 범위**: `src/app/employee`, `src/app/admin/leads`, `src/app/litigation`, `src/lib/leadStore`, `src/app/api/email`, `.env.local`
> **상태**: ✅ 전체 수정 완료 · 서버 정상 동작 확인

---

## 수정 요약

| 분류 | 건수 | 설명 |
|------|------|------|
| 🔧 기능 개선 | 3건 | 이메일 발송, 실행 취소, RBAC |
| 🐛 버그 수정 | 2건 | 글자 깨짐, .env.local 경로 오류 |
| 🔐 권한 제어 | 1건 | 영업팀 소송 대시보드 읽기 전용 |

---

## 🐛 버그 수정 (2건)

### 1. .env.local 경로 오류 → SMTP Mock 모드 고착

**파일**: `.env.local`

**문제**: `.env.local`이 상위 폴더(`company-relationship-management/`)에만 존재하고, 실제 Next.js 프로젝트 루트(`company-relationship-management/company-relationship-management/`)에 없어서 환경변수(`SMTP_*`)를 읽지 못함 → 이메일 API가 항상 Mock 모드로 동작.

**수정**: `.env.local`을 Next.js 프로젝트 루트로 복사.

```bash
Copy-Item ".env.local" "company-relationship-management/.env.local" -Force
```

**검증**: API 응답 `mock: False` + 서버 로그 `[email] ✅ 실 발송 완료 | from: IBS 법률사무소 <dhk@ibslaw.co.kr>` 확인.

---

### 2. 이메일 HTML 한자 글자 깨짐

**파일**: `src/app/api/email/route.ts`

**문제**: `buildHookEmail()` 함수의 HTML 문자열에서 `担당자님께`의 `担`이 한자로 잘못 입력되어 수신 메일에서 글자 깨짐 발생.

**수정**:

```diff
- <h3>${lead.contactName} 担당자님께</h3>
+ <h3>${lead.contactName} 담당자님께</h3>
```

---

## 🔧 기능 개선 (3건)

### 3. 실행 취소 (Undo) 기능 추가

**파일**: `src/lib/leadStore.ts`, `src/app/employee/page.tsx`, `src/app/admin/leads/page.tsx`

**내용**: 리드 상태 변경 시 직전 상태로 되돌릴 수 있는 Undo 기능 구현.

#### leadStore 변경사항

```typescript
// 히스토리 스냅샷 저장 (localStorage)
const LEAD_HISTORY_KEY = 'ibs_leads_history_v1';
const MAX_HISTORY = 15;

function pushHistory(): void { /* 현재 상태를 히스토리에 push */ }

leadStore.undo(): Lead[] | null   // 직전 상태로 복원
leadStore.canUndo(): boolean      // 히스토리 존재 여부
```

- `update()`, `updateStatus()`, `addMemo()` 호출 전 자동으로 `pushHistory()` 실행
- 최대 15단계 히스토리 보존

#### UI 토스트

- 상태 변경 후 화면 하단 중앙에 다크 토스트 5초간 표시
- **"↩ 실행 취소"** 버튼 클릭 시 `leadStore.undo()` → 화면 즉시 갱신
- `/employee` (CRM)와 `/admin/leads` (영업 리드) 양쪽 모두 적용

```diff
+ const [undoVisible, setUndoVisible] = useState(false);
+
+ const run = (id: string, fn: () => void) => {
+     setLoading(id);
+     setTimeout(() => { fn(); setLoading(null); refresh(); }, 400);
+     if (undoTimer) clearTimeout(undoTimer);
+     setUndoVisible(true);
+     const t = setTimeout(() => setUndoVisible(false), 5000);
+     setUndoTimer(t);
+ };
```

---

### 4. 하드코딩 이메일 일괄 변경

**파일**: `src/lib/leadStore.ts`, `src/lib/dripStore.ts`, `src/app/api/email/route.ts`, `src/app/admin/leads/page.tsx`, `src/lib/mock/data.ts`

**내용**: 개발/테스트용 가상 기업 이메일 주소를 `dhk@ibslaw.co.kr`로 일괄 교체.

| 파일 | 변경 필드 |
|------|-----------|
| `leadStore.ts` | `contactEmail`, `contacts[].email` (5개 mock lead) |
| `dripStore.ts` | `contactEmail` (2개 mock member) |
| `api/email/route.ts` | `FROM_EMAIL` 기본값 |
| `admin/leads/page.tsx` | `CLAUSE_MOCK` 내 초안 이메일 |
| `mock/data.ts` | `AI_DRAFTS.i4` 문의 이메일 |

> **주의**: localStorage 캐시(`ibs_leads_v1`, `ibs_drip_v1`) 삭제 필요.
> 브라우저 콘솔: `localStorage.removeItem('ibs_leads_v1'); localStorage.removeItem('ibs_drip_v1'); location.reload();`

---

### 5. 네이버 웍스 SMTP 설정 완료 및 이메일 발송 검증

**파일**: `.env.local`

**내용**: Naver Works SMTP 설정으로 실제 이메일 발송 구성.

```env
SMTP_HOST=smtp.worksmobile.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=dhk@ibslaw.co.kr
SMTP_PASS=<설정완료>
SMTP_FROM_EMAIL=dhk@ibslaw.co.kr
SMTP_TO_EMAIL=dhk@ibslaw.co.kr
```

**검증**: `POST /api/email` 호출 → `mock: False` 응답 + 서버 로그 실 발송 확인 + `dhk@ibslaw.co.kr` 수신 확인.

---

## 🔐 권한 제어 (1건)

### 6. 영업팀 소송 대시보드 읽기 전용 제한

**파일**: `src/app/litigation/page.tsx`

**내용**: `role: 'sales'` 사용자가 송무팀 사건 관리 페이지(`/litigation`)에 접근 시 상태 변경·등록 불가.

#### 적용된 제한 항목

| 항목 | 영업팀 | 기타 역할 |
|------|--------|----------|
| 사건 상태 변경 버튼 | 🔒 "영업팀은 상태를 변경할 수 없습니다" 메시지 | ✅ 클릭 가능 |
| 기한·일정 체크 | 클릭 무반응(`if (readOnly) return`) | ✅ 체크 가능 |
| 메모/결과 저장 버튼 | `disabled` + `🔒 저장 불가` 텍스트 | ✅ 저장 가능 |
| 신규 사건 등록 버튼 | "읽기 전용" 배지로 대체 | ✅ 등록 가능 |

#### 구현 방식

```diff
+ import { getSession } from '@/lib/auth';
+ import { Lock } from 'lucide-react';

+ function CaseCard({ lit, onUpdate, readOnly }: { ...; readOnly?: boolean }) {
+     const toggleDeadline = (d: LitigationDeadline) => {
+         if (readOnly) return;   // 영업팀 차단
+         ...
+     };

  export default function LitigationPage() {
+     const [userRole, setUserRole] = useState('');
+     useEffect(() => {
+         const session = getSession();
+         setUserRole(session?.role ?? '');
+         ...
+     }, [refresh]);
+     const readOnly = userRole === 'sales';
```

**테스트 계정**: `sales@ibslaw.kr` / `sales123`

---

## 수정 파일 목록

| # | 파일 | 수정 내용 |
|---|------|-----------|
| 1 | `.env.local` (루트 복사) | 올바른 Next.js 경로에 환경변수 배치 |
| 2 | `.env.local` | Naver Works SMTP 설정 완료 |
| 3 | `src/app/api/email/route.ts` | 한자 `担` → 한글 `담` 수정 + FROM_EMAIL 기본값 |
| 4 | `src/lib/leadStore.ts` | mock 이메일 변경 + pushHistory/undo/canUndo 추가 |
| 5 | `src/lib/dripStore.ts` | mock 이메일 변경 |
| 6 | `src/app/admin/leads/page.tsx` | mock 이메일 변경 + undo 토스트 UI |
| 7 | `src/lib/mock/data.ts` | mock 이메일 변경 |
| 8 | `src/app/employee/page.tsx` | leadStore 통합 + undo 토스트 UI + 린트 수정 |
| 9 | `src/app/litigation/page.tsx` | 영업팀 읽기 전용 RBAC |

---

*검토·수정: Antigravity AI Agent (2026-03-06 오전 세션)*
