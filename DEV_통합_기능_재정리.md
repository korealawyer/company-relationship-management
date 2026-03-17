# 🏗️ DEV 전체 기능 통합 재정리
> 기준일: 2026-03-11 | 작성: PM 자동 통합 분석 (DEV_송무_기능_리서치.md + DEV_MASTER송무계약서관련.md + 소스 구조 직접 확인)

---

## 📊 현재 DEV 전체 창별 상태 (실시간 확인)

| 창 | 스프린트 | 상태 | 완료 기준 |
|---|---|---|---|
| **창 1** | Sprint B — 문서허브 + 코멘트 | ⚙️ **진행중** | `documents` 테이블 생성 + 3패널 UI + 코멘트 4종 |
| **창 2** | Sprint C — 전자계약 직접 구현 | ⏸️ 창 1 완료 후 | PDF 합성 + 서명 패드 + Storage 저장 |
| **창 3** | MVP #1+#2 — 사건/기일 | 🔴 **병렬 진행 가능** | 칸반 + 이해충돌 + 기일 자동 알림 |
| **창 4** | C3 — SaaS 결제/구독 | ⏸️ 창 2 완료 후 | 포트원 v2 + 구독 플랜 + 웰컴 온보딩 |

> 소스 확인: `src/app/cases/` 디렉토리 존재 (page.tsx + CasesPageClient.tsx 이미 있음) → 창 3 기반 파일 생성 시작됨

---

## ✅ PART 1 — 이미 완료된 기능 (실제 소스 존재 확인)

| 기능 | 경로 | 비고 |
|---|---|---|
| 사건 대시보드 기반 (page.tsx) | `src/app/cases/page.tsx` | 칸반 클라이언트 컴포넌트 포함 |
| 문서 허브 | `src/app/documents/` | Sprint B 진행 중 |
| 전자계약 | `src/app/contracts/` | Sprint C 대기 |
| 결제/체크아웃 | `src/app/checkout/` | C3 대기 |
| 웰컴 온보딩 | `src/app/welcome/` | C3 대기 |
| 알림 모니터 | `src/app/notifications/` | 기반 존재 |
| 클라이언트 포털 | `src/app/client-portal/` | 기존 구현 |
| 관리자 패널 | `src/app/admin/` | 기존 구현 |
| 랜딩/세일즈/프라이싱 | `src/app/landing/`, `/sales/`, `/pricing/` | 기존 구현 |

---

## 🔴 PART 2 — 지금 당장 구현해야 할 것들 (P0 — 이번 스프린트)

### 🪟 창 3: MVP #1 — 사건 대시보드

**목표**: 로탑 `사건관리 → 현행 사건 홈` 동급 구현

| 항목 | 파일 | 상태 |
|---|---|---|
| cases + case_timeline 테이블 | `migrations/003_mvp_cases.sql` | 🔴 미생성 |
| 칸반 보드 컴포넌트 | `src/components/cases/CaseKanban.tsx` | 🔴 미생성 |
| 사건 카드 | `src/components/cases/CaseCard.tsx` | 🔴 미생성 |
| 신건 등록 폼 | `src/app/cases/new/page.tsx` | 🔴 미생성 |
| 사건 상세 페이지 | `src/app/cases/[id]/page.tsx` | 🔴 미생성 |
| 이해충돌 체크 API | `src/app/api/cases/route.ts` | 🔴 미생성 |
| 상태 변경 API | `src/app/api/cases/[id]/status/route.ts` | 🔴 미생성 |

**완료 기준 (AC)**:
```
[ ] 신건 등록 → 이해충돌 충돌 시 409 반환
[ ] 칸반: 상담중 → 수임 → 진행중 → 종결준비 → 종결 5단계
[ ] RBAC: attorney(내 담당) / staff(전체+상태변경) / admin(전체+통계)
[ ] Realtime: 사건 생성·상태변경 → 전 직군 즉시 반영
[ ] D-3 이내 기일 → 오늘의 긴급 섹션 하이라이트
```

---

### 🪟 창 3: MVP #2 — 기일 자동 알림

**목표**: 로탑 `기일/일정` 동급 + 카카오 알림톡으로 **초월**

| 항목 | 파일 | 상태 |
|---|---|---|
| hearings + scheduled_alerts + notification_logs 테이블 | `migrations/003_mvp_cases.sql` | 🔴 미생성 |
| 기일 등록 폼 | `src/app/cases/[id]/hearings/new/page.tsx` | 🔴 미생성 |
| 기일 등록 API | `src/app/api/hearings/route.ts` | 🔴 미생성 |
| 알림 모니터 페이지 | `src/app/notifications/monitor/page.tsx` | 🔴 미생성 |
| 알림 재발송 API | `src/app/api/notifications/resend/route.ts` | 🔴 미생성 |
| pg_cron 등록 | Supabase SQL Editor | 🔴 미실행 |

**완료 기준 (AC)**:
```
[ ] 기일 등록 → scheduled_alerts D-14/7/3/1/0 자동 생성
[ ] 불변기일(is_immutable=true) → D-14 특별 경고, 대표 변호사 CC
[ ] 카카오 실패 → SMS fallback 자동 전환
[ ] CASE_CONFLICT_DETECTED / HEARING_ALERT_SENT automation_logs 확인
[ ] /notifications/monitor → 수신 여부 모니터링 + 수동 재발송
```

---

### 🪟 창 1: Sprint B — 문서허브 + 코멘트 시스템 (⚙️ 진행중)

**목표**: 로탑 `문서관리` 동급 + 코멘트·승인 워크플로우 추가

| 항목 | 파일 | 상태 |
|---|---|---|
| documents 테이블 | `migrations/001_sprint_b_documents.sql` | ⚙️ 진행중 |
| document_comments (자기참조 스레드) | 위 동일 | ⚙️ 진행중 |
| document_approvals, document_requests | 위 동일 | ⚙️ 진행중 |
| 문서 허브 3패널 레이아웃 | `src/app/documents/` | ⚙️ 진행중 |
| DocumentUploadZone.tsx | `src/components/documents/` | ✅ 일부 존재 |
| CommentThread.tsx | `src/components/documents/` | ✅ 일부 존재 |

**완료 기준 (AC)** — 창 2 Esign의 게이트 역할:
```
[ ] /documents 3패널 + 코멘트 스레드 작동
[ ] documents 테이블 DB에 생성됨 (Sprint C 게이트)
[ ] 코멘트 4종: 일반📌 / 승인✅ / 수정요청⚠️ / 공지🔔
[ ] trigger_type 전부 automation.ts 상수 확인
[ ] npx tsc --noEmit 에러 없음
```

---

### 🪟 창 2: Sprint C — 전자계약 직접 구현 (⏸️ Sprint B 완료 후)

**목표**: 이폼싸인 없이 직접 구현 — canvas 서명 패드 + PDF 합성

| 항목 | 파일 | 상태 |
|---|---|---|
| contracts 테이블 | `migrations/002_sprint_c_esign.sql` | 🔴 미생성 |
| 서명 패드 컴포넌트 | `src/components/contracts/SignaturePad.tsx` | 🔴 미생성 |
| PDF 합성 | `src/lib/pdf/contractPdf.tsx` | 🔴 미생성 |
| 공개 서명 페이지 | `src/app/contracts/sign/[token]/page.tsx` | 🔴 미생성 |
| 서명 API | `src/app/api/contracts/[id]/sign/route.ts` | 🔴 미생성 |
| 발송 API | `src/app/api/contracts/[id]/send/route.ts` | 🔴 미생성 |
| 어드민 계약 관리 | `src/app/admin/contracts/page.tsx` | 🔴 미생성 |

**완료 기준 (AC)**:
```
[ ] Storage contracts/{tenant_id}/{token}.pdf 저장 확인
[ ] documents.linked_contract_id 역방향 업데이트 확인
[ ] ESIGN_COMPLETED automation_log 기록 확인
[ ] 만료 토큰 → 만료 안내 페이지
[ ] 서명 완료 → /checkout?contract_id={id} 리다이렉트
```

---

### 🪟 창 4: C3 — SaaS 결제 구독 (⏸️ Sprint C 완료 후)

**목표**: 포트원 v2 빌링키 구독 + SaaS 플랜 완성

| 항목 | 파일 | 상태 |
|---|---|---|
| SaaS 플랜 정의 | `src/lib/saas-pricing.ts` | 🔴 미생성 |
| 동의 페이지 | `src/app/signup/consent/page.tsx` | 🔴 미생성 |
| 웹훅 처리 | `src/app/api/webhooks/portone/route.ts` | 🔴 미생성 |
| 빌링 어드민 | `src/app/admin/billing/page.tsx` | 🔴 미생성 |

**SaaS 플랜 (saas-pricing.ts)**:
```
BASIC:  ₩990,000/월 (변호사 4인 이하)
PRO:    ₩2,490,000/월 (15인 이하)
GROWTH: ₩4,990,000/월 (무제한)
```

**완료 기준 (AC)**:
```
[ ] /signup/consent 4개 미체크 → 버튼 비활성
[ ] 포트원 테스트카드 빌링키 → pg_subscription_id 저장
[ ] Transaction.Failed → 카카오 알림톡 발송
[ ] FIRM_ADMIN 외 /admin/billing → 403
[ ] saas-pricing.ts → /sales, /pricing 동기화
```

---

## 🟡 PART 3 — P1 업그레이드 (창 3 완료 직후 추가)

### 3-1. 신건등록 폼 필드 세분화

로탑 대비 현재 `cases` 테이블 갭:

```sql
-- 현재 설계
case_type TEXT CHECK (case_type IN ('civil','criminal','family','admin'))
attorney_id UUID  -- 단일 담당자

-- ⚠️ 추가해야 할 컬럼들
ALTER TABLE cases ADD COLUMN case_subtype    TEXT;            -- 소분류 (손해배상/대여금/임금 등)
ALTER TABLE cases ADD COLUMN case_level      TEXT CHECK (case_level IN ('1심','2심','3심','조정','수사'));
ALTER TABLE cases ADD COLUMN is_advisory     BOOLEAN DEFAULT FALSE;  -- 자문/TC 사건 여부
ALTER TABLE cases ADD COLUMN related_case_id UUID REFERENCES cases(id);  -- 기존사건 연결
ALTER TABLE cases ADD COLUMN executor_id     UUID REFERENCES users(id);  -- 수행 담당자
ALTER TABLE cases ADD COLUMN assistant_id    UUID REFERENCES users(id);  -- 보조 담당자
```

### 3-2. 사건메모 / History UI

- `case_timeline` 테이블 기반 자유 텍스트 메모 입력 UI
- 개인별 `내 사건메모` 필터링 뷰
- 타임라인 형태 렌더링 (시간순 역순)

### 3-3. 일괄 종결 처리

- 다중 사건 선택 → 일괄 `closed` 상태 변경
- 자동종결 예정건: `hearing_at + 180일` 초과 시 목록 분류
- 종결 리스트 페이지 (`/cases?status=closed`)

### 3-4. 수동 SMS/카카오 발송 UI

- 현재 자동 알림만 있음 → 직원이 개별 문자 수동 발송할 수 있는 UI 필요
- 연락처 퀵 검색 → 원클릭 발송
- 발신 이력 리스트

---

## 🔵 PART 4 — P2 (수납/청구 관리 Phase — 별도 스프린트)

### 수납 DB 스키마 (미설계 — 별도 마이그레이션 필요)

```sql
-- 청구서 테이블
CREATE TABLE billings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES law_firms(id),
  case_id         UUID REFERENCES cases(id),
  client_id       UUID REFERENCES clients(id),
  billing_date    DATE,
  category        TEXT,  -- 수임료 / 실비
  amount_base     BIGINT,  -- 청구원금
  amount_tax      BIGINT,  -- 청구세금
  amount_total    BIGINT GENERATED ALWAYS AS (amount_base + amount_tax) STORED,
  is_issued       BOOLEAN DEFAULT FALSE,  -- 계산서 발행 여부
  issued_at       DATE,
  note            TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 입금 테이블
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES law_firms(id),
  billing_id      UUID REFERENCES billings(id),
  case_id         UUID REFERENCES cases(id),
  client_id       UUID REFERENCES clients(id),
  paid_at         DATE,
  amount          BIGINT,
  method          TEXT CHECK (method IN ('card','transfer','cash','other')),
  account_id      TEXT,   -- 입금계좌
  depositor       TEXT,   -- 입금명의인
  note            TEXT,
  created_by      UUID REFERENCES users(id)
);
```

**핵심 화면 (로탑 수납 메뉴 동급)**:
- `/admin/billing/charges` — 건별 청구/미수 (청구원금·세금·합계·입금합계·미수합계)
- `/admin/billing/payments` — 건별 입금 (입금일·수단·계좌·명의인)
- `/admin/billing/dashboard` — 미수 현황 요약 헤더

---

## ⚫ PART 5 — P3 중기 로드맵 (3~6개월)

| 기능 | 난이도 | 로탑 대비 | 예상 개발 기간 |
|---|---|---|---|
| **대법원 파싱봇** — 기일 자동 수집 | 높 | 🔴 핵심 갭 | 4~6주 |
| **손해배상 자동 계산기** — 원고용/간이/가압류/상속분 | 높 | 🔴 핵심 갭 | 3~4주 |
| **TC/TM 타임시트** — Time Charge 업무시간 정산 | 높 | 🔴 갭 있음 | 4주 |
| **법률 서식 라이브러리** — 약 3,000종 유지 | 매우 높 | 🔴 큰 갭 | 별도 프로젝트 |
| **기여분배 관리** — 수임비율·TM분배 | 중 | 🟡 갭 있음 | 2주 |

---

## 🏆 PART 6 — 로탑 대비 우리가 이미 앞서는 영역

| 우리 강점 | 로탑 | 우리 |
|---|---|---|
| 아키텍처 | Windows 설치형 | ✅ 웹 SaaS (어디서든 접근) |
| 기일 알림 | 이메일 + SMS | ✅ **카카오 알림톡** 우선 |
| 전자계약 | 외부 서비스 의존 | ✅ **직접 구현** (이폼싸인 불필요) |
| AI 기능 | 없음 | ✅ AI 챗봇·자동화 |
| 기업 법인 대시보드 | 없음 | ✅ 기업 전용 포털 |
| 프랜차이즈 전용 기능 | 없음 | ✅ 뉴스레터·계약 자동화 |
| 투명한 SaaS 요금 | 협상제 | ✅ 공개 플랜 3단계 |

---

## 🗃️ PART 7 — DB 마이그레이션 전체 순서

| 순서 | 파일 | 창 | 내용 |
|---|---|---|---|
| 1 | `migrations/001_sprint_b_documents.sql` | 창 1 시작 | documents, document_comments, document_approvals, document_requests |
| 2 | `migrations/002_sprint_c_esign.sql` | 창 2 시작 | contracts |
| 3 | `migrations/003_mvp_cases.sql` | 창 3 시작 | cases, hearings, scheduled_alerts, notification_logs |
| 4 | `migrations/004_c3_payment.sql` | 창 4 시작 | subscriptions, payment_logs, consent_records, workflow_rules |
| 5 | `migrations/005_p1_cases_upgrade.sql` | P1 후 | case_subtype, case_level, executor_id, assistant_id, is_advisory, related_case_id |
| 6 | `migrations/006_billing_system.sql` | P2 | billings, payments |

> ⚠️ **절대 규칙**: `tenant_id` 사용. `law_firm_id` 금지. | `trigger_type` → `automation.ts`에서만 import

---

## 🔔 PART 8 — 카카오 알림톡 템플릿 (심사 대기 중)

| 템플릿 ID | 발송 시점 | 내용 |
|---|---|---|
| `HEARING_NOTICE_D14` | 불변기일 D-14 | 항소기한 긴급 경고 |
| `HEARING_NOTICE_D7` | 기일 D-7 | 내부 담당자 예고 |
| `HEARING_NOTICE_D3` | 기일 D-3 | 기일·법원·담당 변호사 안내 |
| `HEARING_NOTICE_D1` | 기일 D-1 | 최종 기일 알림 |
| `BILLING_OVERDUE_D1` | 미납 D+1 | 결제 실패 + 납부 링크 |
| `BILLING_OVERDUE_D7` | 미납 D+7 | 계정 제한 경고 |
| `PAYMENT_SUCCESS` | 결제 성공 | 영수증 링크 |
| `PAYMENT_FAILED` | 결제 실패 | 카드 정보 업데이트 링크 |
| `TRIAL_ENDING_D7` | 체험 D-7 | 결제 예정 고지 (법적 의무) |
| `WELCOME` | 가입 당일 | 환영 + 30일 체험 시작 안내 |

---

## 📅 PART 9 — 전체 실행 타임라인

```
Day 1 AM  ─── 창 1 (Sprint B: DocComment) 오픈
          ─── 창 3 (MVP #1+#2: 사건/기일) 병렬 오픈 ← 지금 당장 시작 가능

Day 1 PM  ─── 창 1 documents 테이블 AC 확인
              → 통과 시 창 2 오픈 (Sprint C: Esign)

Day 2     ─── 창 2 + 창 3 병렬 진행

Day 2 PM  ─── 창 2 완료 후 창 4 오픈 (C3: 결제)

Day 3     ─── 통합 테스트 전체 체크리스트 확인

Day 4+    ─── P1 업그레이드: 신건등록 소분류·역할 세분화 + 사건메모 UI + 일괄종결

Week 2+   ─── P2: 수납/청구 관리 스프린트

Month 2+  ─── P3 중기: 대법원 파싱봇 + 손해배상 계산기 + TC/TM
```

---

## ✅ PART 10 — 통합 테스트 마스터 체크리스트 (Day 3)

```
### DB 연결
[ ] documents.id ← contracts.linked_document_id FK 정상
[ ] tenant_id 기준 RLS — 타 tenant 데이터 차단 확인
[ ] automation_logs trigger_type 전부 automation.ts 상수와 일치

### Sprint B (DocComment)
[ ] 문서 업로드 → DOCUMENT_UPLOADED log 생성
[ ] 코멘트 추가 → Realtime @멘션 알림

### Sprint C (Esign)
[ ] 서명 완료 → Storage PDF 저장 + contracts.status = 'signed'
[ ] documents.linked_contract_id 역방향 업데이트 확인
[ ] 만료 토큰 → 만료 안내 표시

### MVP #1~2 (사건/기일)
[ ] 신건 → 이해충돌 409 반환
[ ] 기일 등록 → scheduled_alerts D-14/7/3/1/0 생성
[ ] 카카오 실패 → SMS fallback 자동 전환
[ ] /notifications/monitor 알림 모니터링 + 수동 재발송

### C3 결제
[ ] 포트원 테스트카드 → pg_subscription_id 저장
[ ] Transaction.Failed 웹훅 → 카카오 알림톡 발송
[ ] FIRM_ADMIN 외 /admin/billing → 403
[ ] saas-pricing.ts → /sales, /pricing 동기화
[ ] /checkout?contract_id={id} → subscriptions.contract_signed_at 저장
```

---

## 🔗 연계 문서 전체 맵

| 문서 | 역할 | 창 |
|---|---|---|
| [DEV_MASTER송무계약서관련.md](file:///c:/projects/company-relationship-management/DEV_MASTER송무계약서관련.md) | 창별 컨텍스트 프롬프트 본체 | 전체 |
| [DEV_송무_기능_리서치.md](file:///c:/projects/company-relationship-management/DEV_%EC%86%A1%EB%AC%B4_%EA%B8%B0%EB%8A%A5_%EB%A6%AC%EC%84%9C%EC%B9%98.md) | 로탑 메뉴 갭 분석 원본 | 창 3 |
| [LAWTOP_IA_DEEP_RESEARCH.md](file:///c:/projects/company-relationship-management/_strategy/LAWTOP_IA_DEEP_RESEARCH.md) | 로탑 전체 기능 분석 | 전체 |
| [DOCUMENT_COMMENT_SYSTEM.md](file:///c:/projects/company-relationship-management/_strategy/DOCUMENT_COMMENT_SYSTEM.md) | 역할 매트릭스·코멘트 설계 | 창 1 |
| [13_PAYMENT_CONTRACT_FLOW.md](file:///c:/projects/company-relationship-management/_strategy/13_PAYMENT_CONTRACT_FLOW.md) | 결제·Esign 통합 설계 | 창 2, 4 |
| [11_WORKFLOW_SYSTEM.md](file:///c:/projects/company-relationship-management/_strategy/11_WORKFLOW_SYSTEM.md) | 워크플로우 트리거 | 창 2, 3 |
| [12_WORKFLOW_DEV_PROMPT.md](file:///c:/projects/company-relationship-management/_strategy/12_WORKFLOW_DEV_PROMPT.md) | pg_cron·workflow_rules | 창 3 |
| [08_PRICING_STRATEGY.md](file:///c:/projects/company-relationship-management/_strategy/08_PRICING_STRATEGY.md) | 업셀 트리거·플랜 한계값 | 창 4 |

---

> **마지막 업데이트**: 2026-03-11 | **다음 리뷰**: Day 3 통합 테스트 완료 후
