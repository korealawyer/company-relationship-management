# 코드 리뷰 보고서 — IBS CRM

> **검토일**: 2026-03-06  09:00~20:30
> **프로젝트**: `company-relationship-management`  
> **검토 범위**: `src/` 전체 — 12개 파일, +2,097 / -1,391줄 변경  
> **상태**: ✅ 전체 수정 완료 · `next build` 성공 확인

---

## 수정 요약

| 등급 | 건수 | 설명 |
|------|------|------|
| � CRITICAL | 0건 | — |
| 🟠 HIGH | 3건 | 기능 대폭 추가/리팩토링 |
| � MEDIUM | 6건 | 레이아웃 통일 + UX 개선 |
| � LOW | 3건 | 데이터 확장 + 스타일 정리 |

---

## � HIGH — 주요 기능 추가/변경 (3건)

### 1. 영업 CRM 페이지 대폭 확장 (employee)

**파일**: `src/app/employee/page.tsx` (+1,026줄 대규모 리팩토링)

**변경 내용**:
- **엑셀 업로드**: 대량 리드를 `.xlsx` 파일로 일괄 등록하는 모달(`UploadModal`) 추가
  - 중복 검사 (회사명 + 도메인 기준), 필수 필드 검증
  - 경고 표시 + 선택 해제 + 업로드 차단 규칙
  - 사유 포함 엑셀 다운로드 기능
- **드립 캠페인 관리**: `dripStore` 연동, 캠페인 멤버 등록·진행 상태 표시
- **이메일 발송 기능**: `lawyer_confirmed` 상태에서 `/api/email` 호출 후 자동 상태 전환
- **전화 아이콘 제거**: 리드 행에서 불필요한 전화번호 표시 요소 삭제
- 기존 단건 추가(`AddLeadModal`)를 인라인으로 통합

```diff
+ import { dripStore, DripMember, DRIP_SEQUENCE, fillTemplate } from '@/lib/dripStore';
+ import { Upload, Gavel, CheckSquare, Square, ArrowUpDown } from 'lucide-react';

+ // UploadModal: 엑셀 업로드 + 중복 검사 + 사유 포함 다운로드
+ function UploadModal({ onClose, onAdd }: { ... }) { ... }
```

---

### 2. 영업 현황판(admin/leads) 리팩토링

**파일**: `src/app/admin/leads/page.tsx` (665줄 변경)

**변경 내용**:
- **라이트 테마 통일**: 색상 시스템(`T` 객체) 적용, 다크 → 라이트 전환
- **일괄 상태 변경 제거**: `BulkToolbar`에서 상태 일괄 변경 드롭다운 제거 (사고 방지). 변호사 배정만 유지
- **리드 추가 모달 제거**: 인라인 방식으로 전환 (employee 페이지에서 통합 관리)
- **검색/필터 UI**: 세로 레이아웃으로 변경 (가독성 개선)
- **상태 레이블 수정**: `analyzed` → '분석완료' (기존: '검색완료')

```diff
- function BulkToolbar({ count, onClear, onBulkStatus, onBulkAssign }: {
+ function BulkToolbar({ count, onClear, onBulkAssign }: {
      count: number; onClear: () => void;
-     onBulkStatus: (s: LeadStatus) => void;
      onBulkAssign: (l: string) => void;
  }) {
-     const [showStatus, setShowStatus] = useState(false);
```

---

### 3. Lead 데이터 모델 확장 (leadStore)

**파일**: `src/lib/leadStore.ts` (+105줄)

**변경 내용**:
- `bizCategory` 필드 추가 (프랜차이즈/유통업 등 업종 대분류)
- 초기 데이터 5건 → 10건으로 확장: 투썸플레이스, 올리브영, 이디야커피, 맘스터치, 국순당 추가
- 다양한 상태(`analyzed`, `in_contact`, `contracted`, `failed`)의 테스트 데이터 보강
- `source` 필드 다양화: `excel`, `crawler`, `manual`

```diff
- storeCount: 1800, bizType: '외식(치킨)', riskScore: 82, ...
+ storeCount: 1800, bizType: '외식(치킨)', bizCategory: '프랜차이즈', riskScore: 82, ...

+ // 신규 추가 리드
+ { id: 'lead_006', companyName: '(주)투썸플레이스', ... },
+ { id: 'lead_007', companyName: '(주)올리브영', ... },
+ { id: 'lead_008', companyName: '(주)이디야커피', ... },
+ { id: 'lead_009', companyName: '(주)맘스터치', ... },
+ { id: 'lead_010', companyName: '(주)국순당', ... },
```

---

## 🟡 MEDIUM — 레이아웃 통일 + UX 개선 (6건)

### 4. 변호사 페이지 테이블 레이아웃

**파일**: `src/app/lawyer/page.tsx` (482줄 변경)

**변경**: 사이드바 + 카드 레이아웃 → **상단 탭 + 통계 카드 + 테이블 + 확장 행** 구조로 전면 리팩토링.

- 탭: Overview · 상담 검토 · 계약서 검토
- 테이블 컬럼: 회사명 | 상태 | 이슈(HIGH/MED/LOW 뱃지) | URL | 최종 업데이트 | 액션
- 확장 행: 미검토 이슈 상세 목록 표시
- Issue 프로퍼티 수정: `text` → `title`, `clause` → `law` (타입 오류 수정)

---

### 5. 상담사 페이지 테이블 레이아웃

**파일**: `src/app/counselor/page.tsx` (387줄 변경)

**변경**: 카드 + 사이드 패널 → **통계 카드 + 필터 탭 + 테이블 + 확장 행** 구조로 전면 리팩토링.

- 통계 카드 4종: 담당 사례 | 이번 주 상담 | 고위험 내담자 | 종결 사례
- 테이블 컬럼: 내담자 | 소속기업 | 상담유형 | 회기 | 다음 일정 | 위험도 | 상태 | 액션
- 확장 행: 내담자 정보 + 최근 상담 메모 (2단 그리드)
- 검색: 내담자·소속기업 실시간 검색

---

### 6. 송무 페이지 테이블 레이아웃

**파일**: `src/app/litigation/page.tsx` (556줄 변경)

**변경**: CaseCard 개별 카드 → **통계 카드 + 필터 탭 + 테이블 + 확장 행(`CaseExpandedRow`)** 구조로 전면 리팩토링.

- 통계 카드 4종: 전체 사건 | 진행 중 | 긴급 기한 | 청구액 합계
- 테이블 컬럼: 사건번호 | 의뢰인 | 유형 | 상대방 | 법원 | 상태 | 청구액 | 기한 | 액션
- 확장 행: 기한·일정 관리(토글 가능) + 상태 변경 + 사건 메모 + 결과 기록
- 긴급 기한 배너 · AddCaseModal은 기존 기능 그대로 유지
- 검색: 회사명·사건번호·상대방 실시간 검색

---

### 7. 송무직원 로그인 퀵버튼 추가

**파일**: `src/app/login/page.tsx` (+1줄)

**변경**: DEV 퀵로그인 그리드에 **송무팀** 버튼 추가.

```diff
+ { label: '송무', email: 'lit@ibslaw.kr', pw: 'lit123', color: '#7c3aed' },
```

> 기존 `auth.ts`에 `lit@ibslaw.kr` 계정, `ROLE_HOME`에 `/litigation` 매핑, `middleware.ts`에 litigation RBAC이 모두 구현되어 있어 퀵버튼만 추가.

---

### 8. 영업 현황판 레이아웃 라이트 테마 통일

**파일**: `src/app/admin/leads/page.tsx`, `src/app/admin/email-preview/page.tsx`, `src/app/admin/leads/[id]/page.tsx`, `src/app/lawyer/privacy-review/page.tsx`

**변경**: 다크 테마 배경 → 라이트 테마(`#f8f9fc`)로 통일. 패딩·max-width를 employee 페이지 기준으로 맞춤.

```diff
- <div className="min-h-screen" style={{ background: '#04091a' }}>
+ <div className="min-h-screen px-4 py-8" style={{ background: '#f8f9fc' }}>
```

---

### 9. Navbar 메뉴 업데이트

**파일**: `src/components/layout/Navbar.tsx` (+10줄 변경)

**변경**: 네비게이션 메뉴에 역할별 링크 조정, 레이아웃 텍스트 미세 수정.

---

## 🔵 LOW — 데이터 확장 + 스타일 정리 (3건)

### 10. next-env.d.ts 자동 업데이트

**파일**: `next-env.d.ts` (자동 생성)

TypeScript 타입 선언 파일 자동 업데이트.

---

### 11. 이메일 미리보기 페이지 라이트 테마

**파일**: `src/app/admin/email-preview/page.tsx` (+83줄 변경)

다크 배경 → 라이트 테마 전환, 패딩 통일.

---

### 12. 리드 상세 페이지 테마 통일

**파일**: `src/app/admin/leads/[id]/page.tsx` (+38줄 변경)

상세 보기 페이지의 배경·카드 색상을 라이트 테마로 통일.

---

## 수정 파일 목록

| # | 파일 | 변경량 | 수정 내용 |
|---|------|--------|-----------|
| 1 | `src/app/employee/page.tsx` | +1,026 | 엑셀 업로드, 드립 캠페인, 이메일 발송, 전화 아이콘 제거 |
| 2 | `src/app/admin/leads/page.tsx` | 665 | 라이트 테마, 일괄 상태변경 제거, 검색 세로 레이아웃 |
| 3 | `src/app/litigation/page.tsx` | 556 | CRM 테이블 레이아웃 전면 리팩토링 |
| 4 | `src/app/lawyer/page.tsx` | 482 | CRM 테이블 레이아웃 전면 리팩토링 |
| 5 | `src/app/counselor/page.tsx` | 387 | CRM 테이블 레이아웃 전면 리팩토링 |
| 6 | `src/app/lawyer/privacy-review/page.tsx` | 133 | 라이트 테마 통일 |
| 7 | `src/lib/leadStore.ts` | 105 | `bizCategory` 추가, 리드 10건으로 확장 |
| 8 | `src/app/admin/email-preview/page.tsx` | 83 | 라이트 테마 통일 |
| 9 | `src/app/admin/leads/[id]/page.tsx` | 38 | 라이트 테마 통일 |
| 10 | `src/components/layout/Navbar.tsx` | 10 | 메뉴 링크 조정 |
| 11 | `next-env.d.ts` | 2 | TypeScript 자동 업데이트 |
| 12 | `src/app/login/page.tsx` | 1 | 송무팀 DEV 퀵로그인 추가 |

---

## 설계 결정 사항

### 레이아웃 통일 원칙

변호사·상담사·송무 3개 포털을 **영업 CRM(employee) 페이지의 테이블 패턴**으로 통일:

```
상단 헤더 (제목 + 검색)
    ↓
통계 카드 (4종 그리드)
    ↓  
필터 탭 (상태별 카운트)
    ↓
테이블 (확장 행으로 상세 표시)
```

- **공통 색상 시스템**: `T` 객체로 heading/body/sub/muted/faint/border 통일
- **확장 행 패턴**: 클릭 시 행 아래에 상세 패널 표시 (모달 대신)
- **기존 기능 보존**: 사건등록 모달, 기한 토글, 메모 저장 등 모든 CRUD 유지

### 엑셀 업로드 필터 규칙

1. **사업자번호 동일** → 경고 표시 + 선택 해제 (업로드 차단)
2. **회사명 동일** → 경고 표시 + 선택 해제 (업로드 차단)
3. **사업 형태 미입력 또는 공백** → 경고 표시만 (업로드 허용)
4. 사유 포함 엑셀 다운로드 기능 제공

---

*검토·수정: Antigravity AI Agent (2026-03-06)*
