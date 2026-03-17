# 🏛️ 개발 마스터 문서 (검증 & 핸드오프용)

> 이 문서 하나로 검증 → 수정 → 개발 에이전트 전달까지 완결
> 기준일: 2026-03-11 | 수정 v2 반영

---

## 📁 소스 문서 전체 링크

| # | 문서 | 역할 | 창 |
|---|---|---|---|
| 1 | [automation.ts](file:///c:/projects/company-relationship-management/src/lib/constants/automation.ts) | trigger_type 단일 소스 | 전체 |
| 2 | [pm.md](file:///c:/projects/company-relationship-management/_agents/pm.md) | PRD·AC·TIER 1 버그 | 전체 |
| 3 | [LAWTOP_IA_DEEP_RESEARCH.md](file:///c:/projects/company-relationship-management/_strategy/LAWTOP_IA_DEEP_RESEARCH.md) | DB 스키마·MVP 스펙 | 전체 |
| 4 | [02_MULTITENANT_ARCHITECTURE.md](file:///c:/projects/company-relationship-management/_strategy/02_MULTITENANT_ARCHITECTURE.md) | RLS·tenant_id 보안 | 전체 |
| 5 | [DocComment Vibe Prompt](file:///c:/projects/company-relationship-management/DocComment%20Vibe%20Prompt) | Sprint B 구현 본체 | 창 1 |
| 6 | [DOCUMENT_COMMENT_SYSTEM.md](file:///c:/projects/company-relationship-management/_strategy/DOCUMENT_COMMENT_SYSTEM.md) | 역할 매트릭스·코멘트 설계 | 창 1 |
| 7 | [Esign Vibe Prompt 전자계약](file:///c:/projects/company-relationship-management/Esign%20Vibe%20Prompt%20%EC%A0%84%EC%9E%90%EA%B3%84%EC%95%BD) | Sprint C 구현 본체 | 창 2 |
| 8 | [13_PAYMENT_CONTRACT_FLOW.md](file:///c:/projects/company-relationship-management/_strategy/13_PAYMENT_CONTRACT_FLOW.md) | 결제·Esign 통합 설계 | 창 2, 4 |
| 9 | [11_WORKFLOW_SYSTEM.md](file:///c:/projects/company-relationship-management/_strategy/11_WORKFLOW_SYSTEM.md) | 워크플로우 트리거 | 창 2, 3 |
| 10 | [12_WORKFLOW_DEV_PROMPT.md](file:///c:/projects/company-relationship-management/_strategy/12_WORKFLOW_DEV_PROMPT.md) | workflow_rules·pg_cron | 창 3 |
| 11 | [08_PRICING_STRATEGY.md](file:///c:/projects/company-relationship-management/_strategy/08_PRICING_STRATEGY.md) | 업셀 트리거·플랜 한계값 | 창 4 |
| 12 | [pricing.ts (수정금지)](file:///c:/projects/company-relationship-management/src/lib/pricing.ts) | 프랜차이즈 전용 — 건드리지 말 것 | — |
| 13 | [signup/page.tsx (수정금지)](file:///c:/projects/company-relationship-management/src/app/signup/page.tsx) | 프랜차이즈 온보딩 — 건드리지 말 것 | — |

---

## ✅ 절대 규칙 (모든 창 공통)

```
1. tenant_id 사용. law_firm_id 절대 금지.
   JWT: auth.jwt() ->> 'tenant_id'
   RLS Policy명: tenant_isolation

2. trigger_type 값 → automation.ts에서만 import.
   직접 문자열 리터럴 작성 금지.

3. automation.ts 파일 자체는 수정 금지.

4. Mock ID 통일 (DocComment ↔ Esign 양쪽 동일):
   corp-1 = 삼성전자 서비스
   corp-2 = 교촌에프앤비
   corp-3 = 롯데GRS
   tenant-001 = 로펌 테넌트

5. 수정 금지 파일:
   src/lib/pricing.ts        → 프랜차이즈 전용
   src/app/signup/page.tsx   → 프랜차이즈 온보딩
   Navbar.tsx                → 통째로 재작성 금지, append만
```

---

## 🪟 창별 컨텍스트 프롬프트

### 창 1 — Sprint B: DocComment
> 전달: 소스 문서 1~4 + 5 + 6 첨부

```
# Sprint B: 문서허브 & 코멘트 시스템 구현

## 절대 규칙
- tenant_id 사용 (law_firm_id 금지)
- trigger_type: automation.ts에서만 import
- automation.ts 파일 수정 금지

## 시작 전 확인
- src/app/documents/ : ❌ 미존재 → 신규 생성
- src/components/documents/ : ❌ 미존재 → 신규 생성
- src/components/layout/Navbar.tsx : ✅ 존재 → append만 (재작성 금지)

## 구현 범위
- documents 테이블 생성 (Sprint C FK의 상위 테이블 — 반드시 완료)
- document_comments (parent_id 자기참조 스레드)
- document_approvals, document_requests
- /documents 3패널 레이아웃
- 코멘트 유형 4가지: 일반📌 / 승인✅ / 수정요청⚠️ / 공지🔔
- 의뢰 워크플로우 (Sprint B-2)

## Mock ID
corp-1=삼성전자서비스 corp-2=교촌에프앤비 corp-3=롯데GRS tenant-001=로펌

## 완료 기준 (AC)
1. /documents 3패널 + 코멘트 스레드 작동
2. documents 테이블 DB에 생성됨 (Sprint C 게이트)
3. trigger_type 전부 automation.ts 상수 확인
4. npx tsc --noEmit 에러 없음
```

---

### 창 2 — Sprint C: Esign (직접 구현)
> **시작 게이트**: documents 테이블 존재 확인 필수
> 전달: 소스 문서 1~4 + 7 + 8 + 9 첨부

```
# Sprint C: 전자계약 직접 구현

## 시작 전 체크
SELECT * FROM information_schema.tables WHERE table_name = 'documents';
→ 없으면 중단. Sprint B 완료 후 시작.

## 절대 규칙
- tenant_id 사용 (law_firm_id 금지)
- 이폼싸인 외부 API 연동 없음. 직접 구현.
- contracts.linked_document_id → documents.id FK 역방향 필수
- Mock ID DocComment와 동일값 유지

## 직접 구현 방식
  관리자 → 서명 요청(token 생성) → 이메일 발송
  → /contracts/sign/[token] → canvas 서명 패드
  → 서명 완료 → @react-pdf/renderer PDF 합성
  → Supabase Storage contracts/{tenant_id}/{token}.pdf
  → IP + user_agent + signed_at 저장
  → contracts.status = 'signed'
  → documents 역방향 INSERT

## 신규 파일
- src/components/contracts/SignaturePad.tsx
- src/lib/pdf/contractPdf.tsx
- src/app/contracts/sign/[token]/page.tsx
- src/app/api/contracts/[id]/sign/route.ts
- src/app/api/contracts/[id]/send/route.ts
- src/app/admin/contracts/page.tsx (신규 생성 — 기존 UI 이전+확장)
  ⚠️ 사전 적용: src/app/contracts/page.tsx → redirect('/admin/contracts') 처리 완료.
     기존 파일 이동 불필요. /admin/contracts/page.tsx만 새로 작성할 것.

## 완료 기준 (AC)
1. Storage contracts/{tenant_id}/{token}.pdf 저장 확인
2. documents.linked_contract_id 역방향 업데이트 확인
3. ESIGN_COMPLETED automation_log 기록 확인
4. 만료 토큰 → 만료 안내 페이지
5. 서명 완료 → /checkout?contract_id={id} 리다이렉트 준비
```

---

### 창 3 — MVP #1~2: 사건·기일 (병렬)
> 창 1/2와 독립, Day 1부터 병렬 가능
> 전달: 소스 문서 1~4 첨부

```
# MVP #1+#2: 사건 대시보드 + 기일 자동 알림

## 절대 규칙
- tenant_id 사용 (law_firm_id 금지)
- 이해충돌 체크: 사건 생성 시 opponent × tenant_id 중복 → 409 반환
- 불변기일(is_immutable=true): D-14 특별 경고, 대표 변호사 CC

## 구현 범위
MVP #1 — 사건 대시보드
- cases + case_timeline 테이블
- 칸반: 상담중→수임→진행중→종결준비→종결
- RBAC: attorney(내 담당)/staff(전체+상태변경)/admin(전체+통계)

MVP #2 — 기일 알림
- hearings + scheduled_alerts + notification_logs 테이블
- pg_cron 매일 09:00 dispatch_scheduled_alerts()
- 알림 채널: 카카오 알림톡 → SMS fallback → 이메일
- 타이밍: D-14(불변) D-7(내부) D-3(의뢰인) D-1 D-0

## 완료 기준 (AC)
1. 신건 → 이해충돌 409 확인
2. 기일 등록 → scheduled_alerts 자동 생성
3. 카카오 실패 → SMS fallback 확인
4. CASE_CONFLICT_DETECTED / HEARING_ALERT_SENT 로그 확인
```

---

### 창 4 — C3: 결제
> **시작 게이트**: Sprint C 완료 후
> 전달: 소스 문서 1~4 + 8 + 11 첨부

```
# C3: SaaS 결제 & 구독 플로우

## 파일 충돌 규칙 (반드시 준수)
- src/lib/pricing.ts → 수정 금지 (프랜차이즈 전용)
  SaaS 구독 플랜 → src/lib/saas-pricing.ts 신규 생성
- src/app/signup/page.tsx → 수정 금지
  /signup/consent, /checkout, /welcome → 신규 파일로만

## SaaS 플랜 (saas-pricing.ts에 정의)
- BASIC:  ₩990,000/월 (변호사 4인 이하)
- PRO:    ₩2,490,000/월 (15인 이하)
- GROWTH: ₩4,990,000/월 (무제한)

## 구현 순서
1. /signup/consent → 동의 4개 + IP/UA 저장
2. /checkout → 포트원 v2 빌링키 → 즉시 결제
3. /api/webhooks/portone → Paid/Failed/Cancelled 처리
4. /welcome → 온보딩 체크리스트 5단계
5. /admin/billing → FIRM_ADMIN 전용 구독 관리

## pm.md TIER 1 버그 함께 처리
- B1/B2: saas-pricing.ts → /sales, /pricing import
- B3: 가입 완료 → /dashboard?onboarding=1 리다이렉트
- B4: /pricing CTA href 수정

## 완료 기준 (AC)
1. /signup/consent 4개 미체크 → 버튼 비활성
2. 포트원 테스트카드 빌링키 → pg_subscription_id 저장
3. Transaction.Failed → 카카오 알림톡 발송
4. FIRM_ADMIN 외 /admin/billing → 403
5. saas-pricing.ts → /sales, /pricing 동기화
```

---

## 🗂️ 창별 신규 파일 수

| 창 | 신규 파일 | 수정 파일 |
|---|---|---|
| 창 1 (DocComment) | documents/, components/documents/, api/documents/, api/document-requests/ 등 **11개** | Navbar.tsx |
| 창 2 (Esign) | admin/contracts/, SignaturePad.tsx, contractPdf.tsx, api/contracts/ 등 **8개** | contracts/page.tsx(redirect) |
| 창 3 (사건/기일) | cases/, notifications/monitor/, api/cases/, api/notifications/ 등 **10개** | — |
| 창 4 (결제) | saas-pricing.ts, signup/consent/, checkout/, welcome/, admin/billing/, api/webhooks/portone/ 등 **13개** | sales/, pricing/, dashboard/ |

---

## 🗃️ DB 마이그레이션 순서

| 파일 | 내용 | 시점 |
|---|---|---|
| [schema.sql (기존)](file:///c:/projects/company-relationship-management/supabase/schema.sql) | 현재 스키마 확인 | 시작 전 |
| `migrations/001_sprint_b_documents.sql` | documents, document_comments, document_approvals, document_requests, automation_logs 확장 | 창 1 시작 시 |
| `migrations/002_sprint_c_esign.sql` | contracts | 창 2 시작 시 |
| `migrations/003_mvp_cases.sql` | cases, hearings, scheduled_alerts, notification_logs | 창 3 시작 시 |
| `migrations/004_c3_payment.sql` | subscriptions, payment_logs, consent_records, workflow_rules, portal_actions | 창 4 시작 시 |

---

## 🔧 환경변수 체크리스트

```bash
# 현재 없음 — .env.local 신규 생성 필요
NEXT_PUBLIC_SUPABASE_URL=          # ✅ 확인 필요
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # ✅ 확인 필요
SUPABASE_SERVICE_ROLE_KEY=         # ✅ Edge Function용
NEXT_PUBLIC_PORTONE_STORE_ID=      # 🔴 신규 발급 (포트원 v2)
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=   # 🔴 신규 발급
PORTONE_API_SECRET=                # 🔴 신규 발급
PORTONE_WEBHOOK_SECRET=            # 🔴 신규 발급
KAKAO_ALIMTALK_API_KEY=            # 🟡 통합 테스트 전까지
KAKAO_CHANNEL_ID=                  # 🟡 통합 테스트 전까지
RESEND_API_KEY=                    # ✅ 기존 확인
```

---

## 🔗 Supabase Edge Functions (신규 생성)

```
supabase/functions/
├── send-kakao-alimtalk/index.ts       카카오 알림톡 발송 + SMS fallback
├── send-email-resend/index.ts         Resend 이메일 발송
├── workflow-deadline-check/index.ts   기일 D-day 체크 (pg_cron 연동)
├── workflow-billing-overdue/index.ts  미납 청구서 체크
├── workflow-contract-signed/index.ts  서명 완료 → 청구서 자동 생성
└── workflow-billing-upsell/index.ts   업셀 기회 감지
```

**pg_cron 등록 (Supabase SQL Editor에서 직접 실행):**
```sql
SELECT cron.schedule('daily-alert-dispatch', '0 0 * * *', $$SELECT dispatch_scheduled_alerts();$$);
SELECT cron.schedule('daily-billing-overdue', '0 1 * * *', $$SELECT check_billing_overdue();$$);
SELECT cron.schedule('daily-upsell-check',   '0 2 * * *', $$SELECT check_upsell_triggers();$$);
```

---

## 📱 카카오 알림톡 템플릿 (심사 신청 필요 — 통합 테스트 전까지)

| 템플릿 ID | 발송 시점 | 내용 |
|---|---|---|
| `HEARING_NOTICE_D14` | 불변기일 D-14 | 항소기한 긴급 경고 |
| `HEARING_NOTICE_D3` | 기일 D-3 | 기일·법원·담당 변호사 |
| `HEARING_NOTICE_D1` | 기일 D-1 | 최종 기일 알림 |
| `BILLING_OVERDUE_D1` | 미납 D+1 | 결제 실패 안내 |
| `BILLING_OVERDUE_D7` | 미납 D+7 | 계정 제한 경고 |
| `PAYMENT_SUCCESS` | 결제 성공 | 영수증 링크 |
| `PAYMENT_FAILED` | 결제 실패 | 카드 정보 업데이트 링크 |
| `TRIAL_ENDING_D7` | 체험 D-7 | 결제 예정 고지 (법적 의무) |
| `WELCOME` | 가입 당일 | 환영 + 30일 체험 시작 |

---

## ✅ 통합 테스트 체크리스트 (Day 3)

```
DB 연결
[ ] documents.id ← contracts.linked_document_id FK 정상
[ ] tenant_id 기준 RLS — 타 tenant 데이터 차단 확인
[ ] automation_logs trigger_type 전부 automation.ts 상수와 일치

Sprint B
[ ] 문서 업로드 → DOCUMENT_UPLOADED log 생성
[ ] 코멘트 추가 → Realtime @멘션 알림

Sprint C
[ ] 서명 완료 → Storage PDF 저장 + contracts.status = 'signed'
[ ] documents.linked_contract_id 역방향 업데이트 확인
[ ] 만료 토큰 → 만료 안내 표시

MVP #1~2
[ ] 신건 → 이해충돌 409 반환
[ ] 기일 등록 → scheduled_alerts D-14/7/3/1/0 생성
[ ] 카카오 실패 → SMS fallback 자동 전환

C3 결제
[ ] 포트원 테스트카드 → pg_subscription_id 저장
[ ] Transaction.Failed 웹훅 → 카카오 알림톡 발송
[ ] FIRM_ADMIN 외 /admin/billing → 403
[ ] saas-pricing.ts → /sales, /pricing 동기화
[ ] /checkout?contract_id={id} → subscriptions.contract_signed_at 저장
```

---

## 🚀 실행 순서

```
Day 1 AM  창 1 오픈 → Sprint B (DocComment)
          창 3 오픈 → MVP #1~2 (사건/기일) ← 병렬

Day 1 PM  창 1 AC 확인 (documents 테이블 생성 여부)
          → 통과 시 창 2 오픈 → Sprint C (Esign)

Day 2     창 2+3 병렬 진행

Day 2 PM  창 2 완료 후 창 4 오픈 → C3 결제

Day 3     통합 테스트 체크리스트 전체 확인
```
