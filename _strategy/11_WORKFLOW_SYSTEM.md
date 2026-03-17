# 🔄 워크플로우 시스템 설계서 v2.0
*(내부 직원용 Part A + 고객 클라이언트용 Part B | 법무법인 CRM SaaS)*

> **연계 문서**: `02_MULTITENANT_ARCHITECTURE.md` | `03_AUTOMATION_CATALOG.md` | `DOCUMENT_COMMENT_SYSTEM.md` | `_agents/pm.md`
> **최종 업데이트**: 2026-03-10 | v2.0 (고도화 — DB 스키마 + API + 기술 스택 추가)

---

## 📌 워크플로우 정의

```
워크플로우 = 트리거(언제) + 조건(누가/무엇이) + 액션(무엇을 자동 실행)
```

### 두 가지 대상
| 구분 | 대상 | 진입 URL | 목적 |
|---|---|---|---|
| **Part A — 내부용** | 변호사, 사무장, 대표 (`LAWYER`, `STAFF`, `FIRM_ADMIN`) | `/admin/workflows`, `/dashboard` | 반복 업무 자동화 → 시간 절약 |
| **Part B — 클라이언트용** | 의뢰인 (`CLIENT`), 기업 HR (`CORP_HR`) | `/client-portal` | 셀프서비스 → 투명성·만족도 향상 |

### 연결 구조
```
[PART A — 내부 직원이 설정/트리거]
        ↓ 이벤트 발생 (DB 변경 or pg_cron)
[Supabase Edge Function 자동 처리]
        ↓ 알림 발송 or 클라이언트 액션 요청
[PART B — 클라이언트가 포털에서 응답]
        ↓ 완료 시 DB 업데이트 + 웹훅 트리거
[PART A — 담당 변호사에게 결과 알림 자동 수신]
```

---

## 🗄️ DB 스키마 — 워크플로우 전용 테이블

> **기반**: `02_MULTITENANT_ARCHITECTURE.md` 섹션 4의 `automation_logs` 테이블 확장

```sql
-- =============================================
-- 1. 워크플로우 규칙 정의 테이블 (자동화 설정 저장)
-- =============================================
CREATE TABLE workflow_rules (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  law_firm_id  uuid REFERENCES law_firms ON DELETE CASCADE NOT NULL,
  name         text NOT NULL,                  -- "수임료 미납 D+7 에스컬레이션"
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'billing_overdue',       -- 수임료 미납
    'case_deadline',         -- 마감일 임박
    'case_status_change',    -- 사건 상태 변경
    'contract_signed',       -- 계약 서명 완료
    'contract_expiring',     -- 계약 만료 임박
    'client_portal_action',  -- 의뢰인 포털 액션
    'board_event',           -- 이사회 이벤트
    'schedule'               -- pg_cron 주기 실행
  )),
  trigger_config jsonb NOT NULL,  -- {"days_before": 7} or {"cron": "0 9 * * *"}
  action_type    text NOT NULL CHECK (action_type IN (
    'send_kakao',            -- 카카오 알림톡
    'send_email',            -- 이메일 발송
    'send_sms',              -- SMS (카카오 실패 폴백)
    'create_document',       -- 문서 자동 생성
    'update_case_status',    -- 사건 상태 변경
    'request_esign',         -- 전자서명 요청
    'create_billing',        -- 청구서 생성
    'notify_portal'          -- 포털 알림 배지
  )),
  action_config  jsonb NOT NULL,  -- {"template_id": "overdue_notice", "recipients": ["client","lawyer"]}
  is_active      boolean DEFAULT TRUE,
  created_by     uuid REFERENCES users,
  created_at     timestamptz DEFAULT NOW()
);

ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "firm_isolation" ON workflow_rules
  USING (law_firm_id = (auth.jwt() ->> 'law_firm_id')::uuid);

-- =============================================
-- 2. 워크플로우 실행 로그 (기존 automation_logs 확장)
-- =============================================
-- 기존 automation_logs 테이블에 컬럼 추가
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS
  workflow_rule_id uuid REFERENCES workflow_rules;
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS
  retry_count int DEFAULT 0;
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS
  resolved_at timestamptz;

-- =============================================
-- 3. 클라이언트 포털 액션 로그
-- =============================================
CREATE TABLE portal_actions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  law_firm_id     uuid REFERENCES law_firms ON DELETE CASCADE NOT NULL,
  client_user_id  uuid REFERENCES users NOT NULL,
  case_id         uuid REFERENCES cases,
  action_type     text CHECK (action_type IN (
    'document_upload',    -- 서류 업로드
    'esign_complete',     -- 전자서명 완료
    'payment_confirm',    -- 납부 확인
    'message_sent',       -- 변호사에게 문의
    'report_downloaded'   -- 리포트 다운로드
  )),
  metadata        jsonb,  -- {"document_id": "...", "file_name": "주민등록등본.pdf"}
  created_at      timestamptz DEFAULT NOW()
);

ALTER TABLE portal_actions ENABLE ROW LEVEL SECURITY;
-- CLIENT는 자신의 액션만 조회
CREATE POLICY "client_own_actions" ON portal_actions
  FOR SELECT USING (client_user_id = auth.uid());
-- 내부 직원은 자기 로펌 전체 조회
CREATE POLICY "firm_isolation" ON portal_actions
  USING (law_firm_id = (auth.jwt() ->> 'law_firm_id')::uuid);

-- =============================================
-- 4. pg_cron 스케줄 설정 (마감일 알림)
-- =============================================
-- 매일 09:00 KST(00:00 UTC) 마감일 체크
SELECT cron.schedule(
  'daily-deadline-check',
  '0 0 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.edge_function_url') || '/workflow-deadline-check',
      headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

---

## 🔌 API 엔드포인트 설계

### Part A — 내부용 API

| Method | Endpoint | 설명 | 담당 역할 |
|---|---|---|---|
| `GET` | `/api/workflows` | 로펌의 전체 워크플로우 규칙 목록 | `FIRM_ADMIN`, `PARTNER_LAWYER` |
| `POST` | `/api/workflows` | 새 워크플로우 규칙 생성 | `FIRM_ADMIN` |
| `PATCH` | `/api/workflows/[id]` | 규칙 ON/OFF, 설정 수정 | `FIRM_ADMIN` |
| `DELETE` | `/api/workflows/[id]` | 규칙 삭제 | `FIRM_ADMIN` |
| `GET` | `/api/workflows/logs` | 이번 달 자동 처리 로그 조회 | `FIRM_ADMIN`, `PARTNER_LAWYER` |
| `POST` | `/api/workflows/[id]/trigger` | 수동 즉시 실행 | `FIRM_ADMIN` |
| `GET` | `/api/workflows/stats` | 월 자동 처리 건수, 성공률 | `FIRM_ADMIN` |

### Part B — 클라이언트 포털 API

| Method | Endpoint | 설명 | 담당 역할 |
|---|---|---|---|
| `GET` | `/api/portal/cases` | 내 사건 목록 | `CLIENT`, `CORP_HR` |
| `GET` | `/api/portal/cases/[id]` | 사건 상세 + 타임라인 | `CLIENT`, `CORP_HR` |
| `POST` | `/api/portal/documents/upload` | 서류 업로드 | `CLIENT`, `CORP_HR` |
| `GET` | `/api/portal/documents` | 내 사건 문서 목록 | `CLIENT`, `CORP_HR` |
| `POST` | `/api/portal/esign/[contractId]` | 전자서명 실행 | `CLIENT`, `CORP_HR` |
| `GET` | `/api/portal/billing` | 청구서·납부 내역 | `CLIENT`, `CORP_HR` |
| `POST` | `/api/portal/messages` | 변호사에게 문의 발송 | `CLIENT`, `CORP_HR` |
| `GET` | `/api/portal/reports/[month]` | 월간 리포트 조회 (기업 전용) | `CORP_HR` |

### Supabase Edge Functions (자동화 핵심)

| Function | 트리거 | 설명 |
|---|---|---|
| `workflow-deadline-check` | pg_cron 매일 09:00 | 마감일 D-7/D-3/D-0 스캔 + 알림 |
| `workflow-billing-overdue` | pg_cron 매일 09:00 | 미납 D+1/D+7/D+30 에스컬레이션 |
| `workflow-contract-signed` | DB 웹훅 (contracts.status='signed') | 착수금 청구서 자동 생성 |
| `workflow-case-status` | DB 웹훅 (cases.status 변경) | 의뢰인 포털 알림 배지 발송 |
| `workflow-board-event` | pg_cron 매월 1일 | 이사 임기 만료 D-90 스캔 |
| `send-kakao-alimtalk` | 내부 호출 | 카카오 알림톡 발송 (→ SMS 폴백) |
| `send-email-resend` | 내부 호출 | Resend 이메일 발송 |

---

## ⚙️ 기술 스택

| 역할 | 기술 | 비고 |
|---|---|---|
| 스케줄러 | `pg_cron` | Supabase Pro 이상 내장 |
| 자동화 실행 | `Supabase Edge Functions` (Deno) | 웹훅 + cron 트리거 |
| 이메일 발송 | `Resend` (`/api/email` 기존 존재) | 기존 연동 활용 |
| 알림톡 | 카카오 비즈메시지 API | 채널 개설 필요 |
| SMS 폴백 | NCP SMS or Twilio | 카카오 실패 시 |
| 전자서명 | 이폼싸인 API | `/api/contracts` 연동 |
| PDF 생성 | `@react-pdf/renderer` or Puppeteer | 청구서·리포트 생성 |
| 실시간 알림 | Supabase Realtime (PostgreSQL Broadcast) | 포털 배지 즉시 반영 |
| 파일 저장 | Supabase Storage (`documents/` 버킷) | 기존 구조 활용 |

---

## 🏢 PART A — 내부 직원용 워크플로우 (상세)

### A-1. 수임 파이프라인 워크플로우

```
트리거: consultations INSERT (신규 상담 접수)
  ↓
[Edge Function: workflow-intake]
  └─ cases 자동 INSERT (status='lead')
  └─ check_conflict_of_interest() 호출
       ├── 충돌 있음 → FIRM_ADMIN 카카오 알림 + cases.status='blocked'
       └── 충돌 없음 → 업무량 최소 변호사 자동 배정
  └─ 배정 변호사 카카오 알림: "신규 사건 배정됨"
  ↓
[수동: 변호사 수임 결정 클릭]
  → cases.status = 'retained'
  ↓
[DB 웹훅 → workflow-contract-signed 준비]
  └─ 계약서 자동 생성 (템플릿 기반)
  └─ 이폼싸인 전자서명 요청 → 의뢰인 이메일+포털 알림
```

**관련 테이블**: `consultations`, `cases`, `workflow_rules`, `automation_logs`
**관련 Edge Function**: `workflow-intake`, `workflow-conflict-check`
**KPI**: 상담 → 수임 전환율 목표 30%

---

### A-2. 수임료 청구·추적 워크플로우

```
트리거 1: contracts.status → 'signed' (DB 웹훅)
  → billing INSERT (type='retainer', status='pending', due_date=오늘+7일)
  → PDF 청구서 생성 (react-pdf)
  → 의뢰인 이메일 + 포털 알림

트리거 2: pg_cron 매일 09:00 (workflow-billing-overdue)
  → billing WHERE status='pending' AND due_date < NOW() 스캔
  ├── D+1: 의뢰인 카카오 알림톡
  ├── D+7: 변호사 + 의뢰인 동시 이메일
  └── D+30: 법적 조치 안내 + FIRM_ADMIN 에스컬레이션
  → automation_logs INSERT (trigger_type='billing_overdue')

트리거 3: billing.status → 'paid' (DB 웹훅)
  → 영수증 PDF 자동 생성
  → 의뢰인 이메일 + 포털 알림
```

**관련 테이블**: `billing`, `contracts`, `automation_logs`, `portal_actions`
**KPI**: 미납률 목표 10% 이하

---

### A-3. 사건 마감일 알림 워크플로우

```
트리거: pg_cron '0 0 * * *' (매일 09:00 KST)
  ↓
[Edge Function: workflow-deadline-check]
  → cases WHERE deadline_at IS NOT NULL AND status='active' 스캔
  ├── D-7: 담당 변호사 카카오 알림
  ├── D-3: 변호사 + 사무장 이메일
  └── D-0: 변호사 + FIRM_ADMIN 긴급 카카오 알림 (빨간 배지)
  → automation_logs INSERT 각 건마다
```

**관련 테이블**: `cases`, `automation_logs`, `workflow_rules`
**KPI**: 기일 놓침 0건

---

### A-4. 기업 법인 정기 자동화 워크플로우

```
트리거: pg_cron 매월 1일 00:00 UTC

[Edge Function: workflow-board-event]
  → board_events WHERE term_expiry BETWEEN now() AND now()+90days 스캔
  → 담당 변호사 카카오: "이사 임기 만료 D-90: [이름]"

[Edge Function: workflow-contract-expiring]
  → contracts WHERE expires_at BETWEEN now() AND now()+30days 스캔
  → 갱신 제안서 PDF 자동 생성 + 기업 담당자 이메일

[Edge Function: workflow-monthly-report]
  → corporate_clients 전체 순회
  → 각 기업별 월간 법무 리포트 데이터 집계
  → PDF 생성 + 기업 포털에 업로드 + CORP_HR 알림
```

**관련 테이블**: `board_events`, `contracts`, `corporate_clients`, `documents`
**KPI**: 기업 고객 자동화 처리 건수 월 40건+ → Churn 방어

---

### A-5. 어드민 워크플로우 대시보드 UI 스펙

**위치**: `src/app/admin/workflows/page.tsx`

**컴포넌트 구조**:
```
<WorkflowDashboard>
  <WorkflowStatsBar>         ← 이번 달 처리 건수, 성공률, 절약 시간
  <WorkflowRuleList>
    <WorkflowRuleCard>       ← 각 룰 카드: 이름, 타입, ON/OFF 토글
      <LastRunStatus>        ← 마지막 실행: 성공/실패, 시각
      <ManualTriggerButton>  ← 수동 즉시 실행
      <LogDrawer>            ← 실행 로그 슬라이드 패널
    </WorkflowRuleCard>
  <CreateWorkflowButton>     ← 새 워크플로우 만들기 (Phase 3)
```

**API 호출**:
```typescript
// GET /api/workflows
const { data: rules } = await supabase
  .from('workflow_rules')
  .select('*, automation_logs(count)')
  .eq('law_firm_id', lawFirmId)
  .order('created_at', { ascending: false })

// GET /api/workflows/stats
// 이번 달 자동 처리 건수
const { count } = await supabase
  .from('automation_logs')
  .select('id', { count: 'exact' })
  .eq('law_firm_id', lawFirmId)
  .gte('created_at', startOfMonth)
```

---

## 👥 PART B — 고객 클라이언트용 워크플로우 (상세)

### B-1. 전자서명 워크플로우

```
[내부: 변호사가 계약서 서명 요청 생성]
  → contracts INSERT (status='sent')
  → 이폼싸인 API: esign 요청 생성 → esign_request_id 저장
  ↓
[클라이언트 포털: 서명 대기 배지 표시]
  → portal_actions 알림 배지
  ↓
[클라이언트: 포털 or 이메일 링크에서 전자서명]
  → 이폼싸인 웹훅 수신 (POST /api/webhooks/esign)
  ↓
[자동]
  → contracts.status = 'signed', signed_at = NOW()
  → portal_actions INSERT (action_type='esign_complete')
  → DB 웹훅 → workflow-contract-signed 트리거
  → 변호사 카카오: "전자서명 완료됨"
  → 착수금 청구서 자동 생성 → 의뢰인 포털 알림
```

**관련 테이블**: `contracts`, `portal_actions`, `billing`
**외부 API**: 이폼싸인 (`/api/webhooks/esign`)
**KPI**: 서명 완료까지 평균 24시간 이내

---

### B-2. 서류 제출 워크플로우

```
[내부: 변호사가 서류 제출 요청]
  → workflow_rules에서 'client_portal_action' 트리거 설정
  → 의뢰인 포털 알림 + 이메일: "○○ 서류를 ○월 ○일까지 제출해주세요"
  ↓
[클라이언트: 포털에서 파일 업로드]
  → POST /api/portal/documents/upload
  → Supabase Storage: documents/{law_firm_id}/cases/{case_id}/client_upload/
  → documents INSERT (uploaded_by=client_user_id)
  → portal_actions INSERT (action_type='document_upload')
  ↓
[자동]
  → Supabase Realtime → 담당 변호사 브라우저 실시간 알림
  → 변호사 카카오: "의뢰인이 서류를 업로드했습니다"
  → cases 타임라인 자동 기록
```

**보안**: `CLIENT` 역할은 자신의 case_id 폴더에만 업로드 가능 (Storage RLS)
**KPI**: 평균 서류 제출 완료 시간 < 48시간

---

### B-3. 사건 진행 조회 워크플로우

```
[클라이언트: /client-portal 접속]
  → GET /api/portal/cases
  → RLS: client_id = auth.uid() 필터 (타 의뢰인 데이터 절대 차단)
  ↓
[화면 표시]
  → 사건 상태 진행바: lead → consulting → retained → active → closed
  → 마지막 업데이트 타임라인 (consultations + portal_actions 합산)
  → 서명 대기 / 서류 제출 요청 배지 표시
  ↓
[클라이언트: 변호사에게 문의]
  → POST /api/portal/messages
  → Supabase Realtime → 담당 변호사 실시간 알림
  → consultations INSERT (channel='portal')
```

**관련 테이블**: `cases`, `consultations`, `portal_actions`, `documents`
**KPI**: 포털 로그인률 목표 60% 이상

---

### B-4. 기업 클라이언트 월간 리포트 워크플로우

```
[자동: 매월 1일 workflow-monthly-report 실행]
  → corporate_clients 데이터 집계
    - 진행 사건 현황 (cases)
    - 계약 만료 일정 (contracts)
    - 법무 리스크 점수 (corporate_clients.risk_score)
    - 이번 달 청구/수납 내역 (billing)
  → PDF 리포트 생성
  → Storage 업로드: documents/{law_firm_id}/corporate/{corp_id}/reports/2026-03.pdf
  → documents INSERT (doc_type='retainer_report')
  ↓
[CORP_HR: 포털 알림 수신]
  → portal_actions 배지: "3월 법무 리포트 준비됨"
  ↓
[CORP_HR: 포털에서 리포트 확인·다운로드]
  → portal_actions INSERT (action_type='report_downloaded')
  → 리포트에 코멘트 작성 → document_comments INSERT → 변호사 수신
```

**관련 테이블**: `documents`, `document_comments`, `portal_actions`, `corporate_clients`
**KPI**: 기업 포털 월간 리포트 열람률 목표 80%

---

### B-5. 클라이언트 포털 UI 스펙

**위치**: `src/app/client-portal/page.tsx`

**컴포넌트 구조**:
```
<ClientPortalLayout>
  <PortalHeader>           ← 의뢰인 이름, 로그아웃
  <ActionRequired>         ← ⚡ 서명 대기 / 서류 제출 요청 (강조 카드)
  <CaseList>
    <CaseCard>             ← 사건명, 상태 진행바, 마지막 업데이트
      <CaseTimeline>       ← 사건 이력 타임라인
      <DocumentList>       ← 서류 목록 + 업로드 버튼
      <MessageComposer>    ← 변호사에게 문의
  <BillingSection>         ← 청구서·납부 내역
  <ReportSection>          ← 월간 리포트 (CORP_HR 전용)
```

**실시간 알림** (Supabase Realtime):
```typescript
// 포털에서 실시간 알림 구독
const channel = supabase
  .channel('portal-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'portal_actions',
    filter: `client_user_id=eq.${userId}`
  }, (payload) => {
    showToast(payload.new)
  })
  .subscribe()
```

---

## 🔗 Part A ↔ Part B 연동 시퀀스 (전체)

```
변호사(A)               시스템                    의뢰인(B)
   │                      │                           │
   │──수임 결정──────────→│                           │
   │                      │──contracts INSERT──────→  │
   │                      │──이폼싸인 요청────────→   │
   │                      │                    ←서명완료│
   │←서명완료 알림────────│                           │
   │                      │──착수금 청구서────────→   │
   │                      │                    ←납부완료│
   │←수납 확인 알림───────│                           │
   │                      │──영수증 자동발행───────→  │
   │                      │──서류 제출 요청────────→  │
   │                      │                    ←서류업로드│
   │←서류 수신 알림───────│                           │
```

---

## 📊 워크플로우 ROI 계산

| 항목 | 기존 (수동) | 워크플로우 후 | 절감 |
|---|---|---|---|
| 마감일 관리 | 사무장 30분/일 | 0분 (자동) | 월 10시간 |
| 미납 추적 | 사무장 1시간/주 | 0분 (자동) | 월 4시간 |
| 계약서 처리 | 출력+스캔+이메일 | 전자서명 원탭 | 건당 30분 |
| 의뢰인 문의 응대 | 전화 3회/사건 | 포털 셀프 조회 | 사건당 1.5시간 |
| **합계 (변호사 10명)** | — | — | **월 150시간 절약** |

```
150시간 × 변호사 시간당 ₩100,000 = 월 ₩1,500만 절약
구독료 (Premium) ₩499만/월 → ROI 3배
SaaS 법칙: 워크플로우 3개 이상 사용 로펌 → 해지율 3% 미만
```

---

## ✅ 구현 우선순위

### Phase 1 — 이번 스프린트 (2주)
- [ ] `workflow_rules` 테이블 생성 + RLS 적용
- [ ] `portal_actions` 테이블 생성 + RLS 적용
- [ ] `automation_logs` 컬럼 추가 (workflow_rule_id, retry_count)
- [ ] Edge Function: `workflow-deadline-check` (pg_cron 연동)
- [ ] Edge Function: `workflow-billing-overdue`
- [ ] `/api/portal/cases` — 의뢰인 사건 조회 API
- [ ] `src/app/client-portal/page.tsx` — 포털 기본 UI
- [ ] `src/app/admin/workflows/page.tsx` — 어드민 워크플로우 현황

### Phase 2 — 다음 스프린트 (2~4주)
- [ ] Edge Function: `workflow-contract-signed` (이폼싸인 웹훅 연동)
- [ ] Edge Function: `workflow-case-status` (Realtime 포털 알림)
- [ ] `/api/portal/documents/upload` — 클라이언트 서류 업로드
- [ ] `/api/portal/esign/[contractId]` — 전자서명 워크플로우
- [ ] 카카오 알림톡 API 연동 (`send-kakao-alimtalk` Edge Function)

### Phase 3 — 3개월 내
- [ ] Edge Function: `workflow-board-event` (이사사업 자동화)
- [ ] Edge Function: `workflow-monthly-report` (PDF 생성 + 기업 포털)
- [ ] 어드민 워크플로우 빌더 UI (로펌이 직접 커스텀 규칙 생성)
- [ ] `/api/portal/reports/[month]` — 기업 클라이언트 리포트

---

## 🔒 법적·보안 제약

| 항목 | 규정 | 대응 |
|---|---|---|
| 의뢰인 데이터 격리 | 변호사법 비밀유지 의무 | RLS — `CLIENT`: `client_id = auth.uid()` 완전 격리 |
| 기업 데이터 격리 | 비밀유지 의무 | RLS — `CORP_HR`: 자사 `corporate_client_id` 만 접근 |
| 전자서명 법적 효력 | 전자서명법 | 이폼싸인 공인전자서명 (법적 효력 보장) |
| 개인정보 처리 | 개인정보보호법 | 주민번호/계좌 AES-256 암호화, 평문 저장 금지 |
| 파일 업로드 보안 | 개인정보보호법 | Storage RLS — `(foldername)[1] = JWT law_firm_id` |
| 이해충돌 방지 | 변호사법 제31조 | `check_conflict_of_interest()` 함수 자동 실행 |

---

*연계 문서: `02_MULTITENANT_ARCHITECTURE.md` | `03_AUTOMATION_CATALOG.md` | `DOCUMENT_COMMENT_SYSTEM.md` | `_agents/pm.md` | `12_WORKFLOW_DEV_PROMPT.md`*
