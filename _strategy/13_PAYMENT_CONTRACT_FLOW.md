# 💳 결제 & 계약 플로우 통합 설계서 v2.1
*(SaaS 구독 결제 + 전자계약 연동 | 고객 여정 완결 설계)*

> 연계 문서: [`08_PRICING_STRATEGY.md`] | [`11_WORKFLOW_SYSTEM.md`] | [`Esign Vibe Prompt 전자계약`] | [`02_MULTITENANT_ARCHITECTURE.md`] | [`LAWTOP_IA_DEEP_RESEARCH.md`]
> 작성일: 2026-03-11 v2.1 | 대상: 로펌 SaaS 신규 가입 → 서비스 활성화 → 해지 전 전 구간
> ⚠️ **필드명 통일**: 모든 DB 스키마에서 `law_firm_id` 대신 **`tenant_id`** 사용. `src/lib/constants/automation.ts` 참고.

---

## PRD 요약 (PM Agent 기준)

```
기능명: 결제 & 계약 플로우 (C3 모듈)
모듈: 수임료 청구 / SaaS 구독 결제
우선순위: P1 → P0 (수익 직결, Sprint C3)
담당 개발자: -
예상 기간: Phase 1 MVP 3일 / Phase 2 전자서명 연동 2일 / Phase 3 완전자동화 3일

목표:
  - \"결제 마찰 제거 + 법적 보호\"로 유료 전환율 목표 30% 달성

페르소나:
  - 주요 사용자: 사무장 (결제 실행), 대표 변호사 (계약 최종 승인)
  - 사용 맥락: 신규 가입 시 / 매월 자동결제 실패 시 / 계약 갱신 시

핵심 유저 스토리:
  - \"사무장으로서 포트원 카드 등록 한 번으로 매월 자동 청구되길 원한다\"
  - \"대표 변호사로서 계약서에 전자서명 후 결제하여 법적 근거를 갖추고 싶다\"
  - \"사무장으로서 결제 실패 즉시 카카오 알림을 받고 원탭으로 카드를 바꾸고 싶다\"
```

---

## 1. 핵심 결론: 계약 → 결제 순서

```
❌ 그냥 결제만 받기  →  법적 분쟁 시 근거 없음, B2B 법인 카드 사용 불가
✅ 계약 동의 → 결제  →  법적 보호 + 프리미엄 신뢰감 + 세금계산서 근거
```

| 이유 | 설명 |
|---|---|
| 법적 보호 | 환불·해지·서비스 범위 분쟁 시 계약서가 1차 근거 |
| B2B 필수 조건 | 법인 고객 내부 결재상 계약서 없이 카드 사용 불가 |
| 세금계산서 근거 | 계약서 있어야 세금계산서 발행 기준 명확 |
| 신뢰·단가 방어 | "달랑 카드 긁기" vs "전자계약 후 결제" — 후자가 고단가 포지셔닝 유리 |
| 고객 본인이 변호사 | 법률 전문가가 고객이므로 계약 없는 서비스에 불신 |

---

## 2. 전체 고객 여정 (Customer Journey) — 완전 통합 맵

### 2-A. SaaS 신규 가입 플로우 (Phase 1 MVP — 체크박스 동의)

```
[랜딩페이지]
    ↓ "무료 체험 시작" or "플랜 선택"
[플랜 선택 페이지] /pricing
    → Basic ₩99만 / Pro ₩249만 / Growth ₩499만 / Enterprise 커스텀
    ↓
[회원가입] /signup
    → 로펌명, 담당자명, 이메일, 비밀번호, 사업자등록번호
    ↓
[이용약관 & 서비스 계약 동의] /signup/consent ← ★ 계약 단계
    → 서비스 이용약관 체크박스 [✓]
    → 개인정보 처리방침 체크박스 [✓]
    → 구독 서비스 계약서 PDF 다운로드 링크 제공
    → 동의 타임스탬프 + IP 주소 저장 (법적 증거)
    → "동의하고 진행하기" 버튼
    ↓
[결제] /checkout ← ★ 결제 단계
    → 플랜 확인 + 결제 방법 선택 (카드 / 계좌이체 / 세금계산서)
    → 연간 결제 시 10% 할인 옵션 표시
    → 세금계산서 발행 정보 입력
    ↓
[웰컴 온보딩] /welcome ← ★ 신규 추가
    → 5단계 온보딩 체크리스트 표시
    → "30일 무료 체험 시작됨" 배너
    → 카카오 알림톡: "환영합니다 🎉" 자동 발송
    ↓
[대시보드 활성화] /admin/dashboard
    → 웰컴 온보딩 가이드 표시
    → 계약서 PDF 이메일 자동 발송
    → 온보딩 이메일 시퀀스 시작 (D+1, D+3, D+7)
```

### 2-B. Phase 2: 전자서명 연동 (Esign 모듈 완성 후)

```
[플랜 선택] → [회원가입] → [전자계약 서명] ← Sprint C (Esign)
    ↓
  관리자가 계약서 발송 (admin/contracts/new)
  → contract_initiated_by: 'law_firm'
  → 고객이 /contracts/sign/[token] 에서 서명
  → 이폼싸인 웹훅 → contracts.status = 'signed'
  → 서명 완료 → 결제 페이지로 자동 이동 (/checkout?contract_id={id})
    ↓
[결제] → [웰컴 온보딩] → [대시보드 활성화]
```

### 2-C. Phase 3: 기업 법인 자문계약 자동 청구 (완전 자동화)

```
기업 의뢰인(고객사) 자문계약 → Esign Level 1 → 서명 완료
    ↓
[workflow-contract-signed Edge Function]
    → billing INSERT (type='retainer', amount=자문료, due_date=오늘+7일)
    → PDF 청구서 자동 생성
    → 기업 담당자 카카오 알림톡: "자문료 청구서 발행됨"
    → 매월 자동 반복 청구 (pg_cron)
```

---

## 3. 결제 체크아웃 UI 상세 (C3 모듈)

### 3-1. 결제 페이지 구성요소

```
URL: /checkout?plan={planId}&annual={true|false}&contract_id={uuid?}

┌─ 왼쪽 (Order Summary) ────────────────────────┐
│  선택 플랜: Pro                                 │
│  변호사 수: 최대 15명                           │
│  월 구독료: 249만원                             │
│  연간 결제 (10% 할인): 2,689만원/년 → 224만원/월│
│                                                │
│  ✅ 첫 30일 무료 체험 포함                      │
│  ✅ 언제든 해지 가능                            │
│                                                │
│  포함 기능:                                     │
│  ✅ 사건 관리 무제한                            │
│  ✅ 전자서명 (월 20건 포함)                     │
│  ✅ AI 계약서 초안                              │
│  ✅ 자동 청구서 발행                            │
│  ✅ 카카오 알림톡 자동 발송                     │
│                                                │
│  🔁 자동결제 날짜: 매월 {가입일} 일             │
│  💡 30일 무료 후 첫 결제 예정: {날짜}           │
└────────────────────────────────────────────────┘

┌─ 오른쪽 (결제 정보 입력) ─────────────────────┐
│                                                │
│  결제 방법                                     │
│  ○ 신용카드 / 법인카드                         │
│  ○ 계좌이체                                    │
│  ○ 세금계산서 선발행 후 계좌이체                │
│                                                │
│  세금계산서 정보                               │
│  사업자등록번호: [___________]                  │
│  상호명: [___________]                         │
│  담당자이메일: [___________]                   │
│                                                │
│  ☐ 자동결제 및 이용약관에 동의합니다           │
│                                                │
│  [결제 완료하기] (gold gradient 버튼)           │
│                                                │
│  🔒 SSL 보안 결제 | 포트원(PortOne) v2 처리    │
│  📄 30일 이내 해지 시 전액 환불 보장           │
└────────────────────────────────────────────────┘
```

### 3-2. 결제 수단별 처리 방식

| 결제 수단 | PG 연동 | 처리 방식 | 비고 |
|---|---|---|---|
| 신용/법인카드 | 포트원(PortOne) v2 | 즉시 정기결제 등록 (빌링키 발급) | 매월 자동 청구 |
| 계좌이체 | 포트원 가상계좌 | 입금 확인 후 구독 활성화 | 2~3 영업일 |
| 세금계산서 선발행 | 수동 + 영업팀 | 영업팀 연락 후 계약 진행 | Enterprise 주로 |

> **포트원 선택 이유**: 국내 법인카드 자동이체 지원 | 정기결제(빌링키) 완전 지원 | 세금계산서 API 연동 | 가상계좌 즉시 발급

### 3-3. 결제 상태 관리 (DB 스키마)

```sql
-- C3: SaaS 구독 결제 테이블
-- ⚠️ law_firm_id → tenant_id 통일 (LAWTOP_IA_DEEP_RESEARCH.md 기준)
-- ⚠️ trigger_type 상수는 src/lib/constants/automation.ts 단일 관리
CREATE TABLE subscriptions (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id            uuid REFERENCES law_firms ON DELETE CASCADE NOT NULL,
  plan                 text CHECK (plan IN ('basic','pro','growth','enterprise')),
  billing_cycle        text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),  -- ⚠️ CHECK 필수
  status               text DEFAULT 'trial' CHECK (status IN (
    'trial','active','past_due','cancelled','paused'
  )),
  trial_ends_at        timestamptz DEFAULT NOW() + INTERVAL '30 days',
  current_period_start timestamptz,
  current_period_end   timestamptz,
  pg_customer_id       text,   -- 포트원 customer_uid
  pg_subscription_id   text,   -- 포트원 정기결제 key (빌링키)
  amount               integer NOT NULL,  -- 원 단위
  contract_signed_at   timestamptz,  -- ★ 계약 동의 타임스탬프 (법적 증거)
  contract_version     text,          -- 계약서 버전 (예: "v2026.03")
  tax_invoice_email    text,
  business_reg_no      text,  -- 사업자등록번호 (AES-256 암호화)
  cancelled_at         timestamptz,  -- 해지 처리 일시 → automation: 'subscription_cancelled'
  cancel_reason        text,         -- 해지 사유 (이탈 분석용: A~E 분류)
  downgrade_from       text,         -- 다운그레이드 이전 플랜 → automation: 'subscription_downgraded'
  created_at           timestamptz DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON subscriptions
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 결제 이력 테이블
CREATE TABLE payment_logs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       uuid REFERENCES law_firms NOT NULL,
  subscription_id uuid REFERENCES subscriptions,
  amount          integer NOT NULL,
  status          text CHECK (status IN ('success','failed','refunded','cancelled')),
  pg_receipt_url  text,
  paid_at         timestamptz,
  fail_reason     text,
  retry_count     int DEFAULT 0,  -- 결제 실패 재시도 횟수
  created_at      timestamptz DEFAULT NOW()
);

ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON payment_logs
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

---

## 4. 이용약관 & 계약 동의 설계

### 4-1. 체크박스 동의 UI (MVP — 즉시 구현)

```
[이용약관 동의 화면]  /signup/consent
┌──────────────────────────────────────────┐
│  📋 서비스 이용 계약                      │
│                                          │
│  구독 플랜: Pro (월 249만원)              │
│                                          │
│  [계약서 전문 보기 →] (PDF 다운로드)      │
│                                          │
│  ☐ 서비스 이용약관에 동의합니다           │
│  ☐ 개인정보 처리방침에 동의합니다         │
│  ☐ 구독 서비스 계약 내용을 확인했습니다   │
│  ☐ 자동결제 및 정기결제에 동의합니다 ★   │
│                                          │
│  * 월 결제일: 가입일 기준                 │
│  * 언제든 해지 가능 (해지 시 말일까지)    │
│                                          │
│  [동의하고 결제하기] ← 모두 체크 시 활성  │
└──────────────────────────────────────────┘
```

### 4-2. 법적 효력 확보를 위한 필수 저장 항목

```typescript
// src/app/api/consent/route.ts
interface ConsentRecord {
  user_id: string;
  tenant_id: string;            // ⚠️ law_firm_id → tenant_id
  contract_version: string;     // 예: "TOS_2026.03"
  consented_at: string;         // ISO 8601 timestamp
  ip_address: string;           // 법적 증거 수집
  user_agent: string;           // 브라우저/기기 정보
  items_agreed: {
    terms_of_service: boolean;        // 서비스 이용약관
    privacy_policy: boolean;          // 개인정보처리방침
    subscription_contract: boolean;   // 구독 서비스 계약
    auto_payment: boolean;            // 자동결제 동의 ★
  };
}
```

### 4-3. 동의 화면 구현 파일 목록

| 파일 | 역할 | 상태 |
|---|---|---|
| `src/app/signup/consent/page.tsx` | 이용약관 동의 페이지 | ❌ 신규 생성 |
| `src/app/checkout/page.tsx` | 결제 페이지 | ❌ 신규 생성 |
| `src/app/api/checkout/route.ts` | 결제 처리 API (포트원 연동) | ❌ 신규 생성 |
| `src/app/api/consent/route.ts` | 동의 기록 저장 API | ❌ 신규 생성 |
| `src/app/api/subscriptions/route.ts` | 구독 상태 관리 API | ❌ 신규 생성 |
| `src/app/api/webhooks/portone/route.ts` | 포트원 결제 웹훅 수신 | ❌ 신규 생성 |
| `src/app/welcome/page.tsx` | 온보딩 체크리스트 페이지 | ❌ 신규 생성 |
| `src/app/admin/billing/page.tsx` | 구독 관리·결제 이력 페이지 | ❌ 신규 생성 |
| `public/docs/service-contract-v2026.03.pdf` | 구독 계약서 PDF | ❌ 준비 필요 |

---

## 5. 포트원(PortOne) v2 연동 — 빌링키 정기결제

### 5-1. 빌링키 발급 (클라이언트)

```typescript
// src/app/checkout/page.tsx (클라이언트 컴포넌트)
import PortOne from '@portone/browser-sdk/v2'

// 빌링키 발급 요청 (카드 등록)
const issueResult = await PortOne.requestIssueBillingKey({
  storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
  channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
  billingKeyMethod: 'CARD',
  issueId: `billing-${tenantId}-${Date.now()}`,
  issueName: '법무법인 CRM SaaS 구독',
  customer: {
    customerId: tenantId,           // ⚠️ tenant_id 사용
    email: billingEmail,
    fullName: firmName,
    phoneNumber: contactPhone,
  }
})

// 발급된 빌링키로 서버에서 결제 처리
// POST /api/checkout  → portone Server SDK로 즉시 결제
```

### 5-2. 즉시 결제 처리 (서버)

```typescript
// src/app/api/checkout/route.ts (서버 사이드)
import PortOne from '@portone/server-sdk'

const client = PortOne.PortOneClient(process.env.PORTONE_API_SECRET)

// 빌링키로 즉시 결제 (트라이얼 종료 후 첫 결제 or 연간 결제)
const paymentResult = await client.payment.payWithBillingKey({
  storeId: process.env.PORTONE_STORE_ID,
  paymentId: `pay-${tenantId}-${Date.now()}`,
  billingKey: billingKey,
  orderName: `[${planName}] 법무법인 CRM ${billingCycle === 'annual' ? '연간' : '월간'} 구독`,
  amount: { total: amount },
  currency: 'KRW',
  customer: { id: tenantId, email: billingEmail },
})

// 결제 성공 → subscriptions.status 'trial' → 'active' 업데이트
// 결제 성공 → payment_logs 기록
// 결제 성공 → 카카오 알림톡 발송 (결제 완료 알림)
```

### 5-3. 웹훅 이벤트 처리 (포트원 → 우리 서버)

```typescript
// src/app/api/webhooks/portone/route.ts
// 포트원이 결제 상태 변경 시 POST 호출

const webhookEvents = {
  'Transaction.Paid':      handlePaymentSuccess,    // 결제 성공 → subscription active
  'Transaction.Failed':    handlePaymentFailed,     // 결제 실패 → past_due + 알림
  'Transaction.Cancelled': handleRefund,            // 환불 → refund 처리
  'BillingKey.Issued':     handleBillingKeyIssued,  // 빌링키 발급 완료
  'BillingKey.Deleted':    handleBillingKeyDeleted, // 빌링키 삭제 → 구독 취소
}
```

---

## 6. 온보딩 시퀀스 (결제 완료 후)

### 6-1. 웰컴 페이지 /welcome

결제 성공 리다이렉트 경로:
```
/checkout → (결제 성공) → /welcome → /admin/dashboard
```

```
[웰컴 온보딩 체크리스트] /welcome
┌────────────────────────────────────────────────┐
│  🎉 환영합니다! 30일 무료 체험이 시작됐습니다  │
│                                                │
│  5단계로 시작하세요 (완료 시 첫 달 50% 할인)  │
│                                                │
│  ☐ 1. 첫 번째 사건 등록하기          → /cases/new
│  ☐ 2. 팀원(변호사/사무장) 초대하기   → /admin/team
│  ☐ 3. 의뢰인 포털 링크 발송하기      → /admin/clients
│  ☐ 4. 첫 자동화 워크플로우 설정하기  → /admin/workflows
│  ☐ 5. 세금계산서 정보 완성하기       → /admin/billing
│                                                │
│  [대시보드로 이동] or [온보딩 영상 보기]        │
└────────────────────────────────────────────────┘
```

> **온보딩 완료 기준 (pm.md Rule #2 — 7일 이내)**
> - [ ] 의뢰인 3명 이상 등록
> - [ ] 사건 2건 이상 생성
> - [ ] 팀원 1명 이상 초대
> - [ ] 알림 설정 완료

### 6-2. 온보딩 이메일 자동 시퀀스 (Resend 연동)

| D+일 | 이메일 제목 | 내용 |
|---|---|---|
| D+0 | "가입 완료 🎉 — 계약서 PDF 첨부" | 계약서 PDF + 로그인 링크 |
| D+1 | "첫 번째 사건 등록, 2분이면 됩니다" | 사건 등록 가이드 영상 링크 |
| D+3 | "[팁] 카카오 알림톡 자동 발송 설정법" | 알림톡 설정 단계별 가이드 |
| D+7 | "지난 1주 동안 얼마나 절약했나요?" | 사용 현황 리포트 (자동 계산) |
| D+14 | "팀원 모두 초대하셨나요?" | 팀 초대 유도 + 기능 소개 |
| D+25 | "5일 후 첫 결제 예정 안내" | D-5 결제 예정 고지 (법적 의무) |
| D+28 | "내일 첫 결제가 시작됩니다" | D-2 최종 안내 + 플랜 변경 링크 |

### 6-3. 카카오 알림톡 결제 자동화

| 시점 | 알림톡 내용 | 채널 |
|---|---|---|
| 가입 당일 | "환영합니다! 30일 무료 체험 시작" | 카카오 알림톡 |
| D-7 (결제 전) | "7일 후 [플랜명] [금액]원 결제 예정" | 카카오 알림톡 |
| 결제 성공 | "[금액]원 결제 완료. 영수증: [링크]" | 카카오 알림톡 |
| 결제 실패 | "결제 실패 안내 — 카드 정보 업데이트 필요" | 카카오 알림톡 + SMS |
| D+1 미납 | "결제가 완료되지 않아 서비스가 제한됩니다" | 카카오 알림톡 + 이메일 |
| D+7 미납 | "미납 7일 — 계정 일시 정지 예정" | 카카오 알림톡 + 이메일 |
| D+14 미납 | "계정 정지. 데이터 보관 기간 30일" | 카카오 알림톡 + 이메일 |

---

## 7. 구독 해지 & 다운그레이드 플로우

### 7-1. 해지 플로우

```
[admin/billing] → "구독 해지" 클릭
    ↓
[해지 의향 모달]
    → "해지 이유" 선택 (이탈 스코어 분석용)
    → "더 나은 제안 보기" (재계약 유도 — /saas_churn 워크플로우 연동)
    ↓
[해지 확정]
    → subscriptions.status → 'cancelled'
    → subscriptions.cancelled_at → NOW()
    → subscriptions.cancel_reason 저장
    → 현재 결제 주기 말일까지 서비스 유지
    → 카카오 알림톡: "해지 처리됨. {말일}까지 이용 가능"
    ↓
[CS 팀 알림] → /saas_churn 워크플로우 자동 트리거
    → 해지 72시간 이내 CS 연락 → 복구 시도
```

### 7-2. 해지 이유 분류 (이탈 분석 — KPI: 미납률 < 10%)

```
A. 가격이 부담됩니다       → 다운그레이드 제안
B. 기능이 부족합니다       → PM에게 피드백 전달
C. 다른 솔루션을 사용합니다 → 경쟁사 분석 데이터 수집
D. 잠시 휴업/폐업합니다    → 일시정지(paused) 제안
E. 기타                    → CS 콜 연결
```

### 7-3. 다운그레이드 플로우

```
[현재 플랜] → [더 낮은 플랜 선택]
    ↓
  다음 결제 주기부터 적용 (즉시 적용 아님)
  subscriptions.downgrade_from 저장 (기존 플랜명)
  카카오 알림톡: "다음 결제일부터 [신규플랜] 적용됩니다"
```

---

## 8. 업셀 트리거 자동화 — 08_PRICING_STRATEGY.md 연동

```sql
-- 매일 실행: 업셀 기회 감지 (workflow-billing-upsell Edge Function)
SELECT
  s.tenant_id,
  s.plan,
  COUNT(u.id) as lawyer_count,
  COUNT(c.id) as monthly_cases,
  SUM(al.count) as monthly_automations,
  s.current_period_end as renewal_date
FROM subscriptions s
LEFT JOIN users u ON u.tenant_id = s.tenant_id AND u.role = 'LAWYER'
LEFT JOIN cases c ON c.tenant_id = s.tenant_id
  AND c.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN (
  SELECT tenant_id, COUNT(*) as count FROM automation_logs
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY tenant_id
) al ON al.tenant_id = s.tenant_id
WHERE s.status = 'active'
HAVING
  (s.plan = 'basic'  AND COUNT(u.id) >= 4) OR   -- 변호사 한계 도달
  (s.plan = 'pro'    AND COUNT(c.id) >= 80) OR   -- 사건 한계 도달
  (s.plan = 'growth' AND SUM(al.count) >= 80);   -- 자동화 포화
```

**업셀 트리거 발생 시 자동 액션:**
1. CS 팀 대시보드 알림 (업셀 기회 플래그)
2. 개인화 이메일 자동 발송 (절약 시간 + 플랜 업그레이드 제안)
3. 30일 이내 미전환 시 인앱 팝업 표시

---

## 9. 전체 리다이렉트 플로우 & URL 가드

```
/signup → /signup/consent → /checkout → /welcome → /admin/dashboard

가입 단계별 URL 가드:
  /signup/consent  → 회원가입 완료 여부 체크 (미완료 시 /signup 리다이렉트)
  /checkout        → consent 완료 여부 체크 (미완료 시 /signup/consent 리다이렉트)
  /welcome         → payment 완료 여부 체크 (미완료 시 /checkout 리다이렉트)
  /admin/*         → subscription.status === 'active' | 'trial' 체크
                     미활성 시 /checkout 리다이렉트
  /admin/billing   → FIRM_ADMIN 역할만 접근 가능
  /admin/billing/cancel → FIRM_ADMIN 역할만 접근 가능

Phase 2 전자서명 연동 시:
  /checkout        → contract_id 쿼리 파라미터로 서명 완료 여부 추가 검증
```

---

## 10. 전체 구현 로드맵 & 공수

### Phase 1: MVP (즉시 구현)
```
체크박스 동의 → 포트원 결제 (테스트 모드) → 웰컴 온보딩 → 대시보드
```

| 순위 | 작업 | 파일 | 공수 |
|---|---|---|---|
| 🔴 P0 | 이용약관 동의 페이지 | `signup/consent/page.tsx` | 2h |
| 🔴 P0 | 결제 페이지 UI | `checkout/page.tsx` | 3h |
| 🔴 P0 | 포트원 빌링키 발급 API | `api/checkout/route.ts` | 2h |
| 🔴 P0 | 동의 기록 저장 API | `api/consent/route.ts` | 1h |
| 🔴 P0 | 포트원 웹훅 수신 | `api/webhooks/portone/route.ts` | 2h |
| 🟡 P1 | 웰컴 온보딩 페이지 | `welcome/page.tsx` | 2h |
| 🟡 P1 | 결제 완료 후 구독 활성화 | `api/subscriptions/route.ts` | 2h |
| 🟡 P1 | 카카오 알림톡 결제 알림 | Edge Function `send-kakao-alimtalk` | 1h |
| 🟡 P1 | 세금계산서 발행 정보 입력 | `checkout/page.tsx` | 1h |
| 🟢 P2 | 구독 관리 페이지 | `admin/billing/page.tsx` | 3h |
| 🟢 P2 | 결제 이력 조회 | `admin/billing/history/page.tsx` | 2h |
| 🟢 P2 | 해지 플로우 | `admin/billing/cancel/page.tsx` | 2h |
| 🟢 P2 | 온보딩 이메일 시퀀스 | Resend 이메일 자동화 | 3h |

**총 공수: P0 = 10h | P1 = 6h | P2 = 10h**

### Phase 2: 전자서명 연동 (Sprint C 완료 후)
```
Esign 모듈 → 구독 계약서 전자서명 → 서명 완료 → 결제
```
- 이폼싸인 웹훅 → `contracts.status='signed'` 수신
- `/checkout?contract_id={id}` 파라미터로 서명 연동
- 서명 완료 타임스탬프 → `subscriptions.contract_signed_at` 저장

### Phase 3: 완전 자동화
```
기업 자문계약 → Esign → 서명 완료 → 수임료 자동 청구 → 포털 알림
```
- `workflow-contract-signed` Edge Function으로 청구서 자동 생성
- 매월 `pg_cron`으로 정기 청구 자동화

---

## 11. ROI 계산 — 고객 설득 데이터

| 항목 | 기존 (수동) | 자동화 후 | 절감 |
|---|---|---|---|
| 청구서 발행 | 담당 직원 30분/건 | 0분 (자동) | 월 10시간+ |
| 미납 추적 | 전화·이메일 수동 | 카카오 알림 자동 | 월 4시간 |
| 세금계산서 발행 | 홈택스 별도 접속 | API 자동 발행 | 건당 20분 |
| 결제 실패 대응 | CS 팀 수동 연락 | 자동 알림 + 링크 | 건당 1시간 |
| 계약서 보관 | 실물/이메일 분산 | Supabase 자동 보관 | 분쟁 시 즉시 조회 |

```
→ 연 절감 비용 vs 구독료:
  기존 직원 업무 시간(월 20h) × 직원 시급 30,000원 = 600,000원/월 절약
  우리 Basic 구독료 990,000원/월 대비 → ROI 61%
  (사건 누락 방지, 법적 분쟁 예방 가치 제외 시에도)
```

---

## 12. Acceptance Criteria (완료 기준) — pm.md PART 2 기준

### Phase 1 MVP 완료 기준
- [ ] `/signup/consent` 4개 체크박스 전체 미체크 시 "동의하고 진행하기" 비활성 확인
- [ ] 동의 완료 시 `consent_records` 테이블에 `ip_address`, `user_agent`, `consented_at` 저장 확인
- [ ] 포트원 테스트 카드로 빌링키 발급 → `subscriptions.pg_subscription_id` 저장 확인
- [ ] 결제 성공 후 `/welcome` 리다이렉트 정상 작동 확인
- [ ] `subscriptions.status` = `'trial'` → `'active'` 상태 전환 확인
- [ ] 포트원 웹훅 `Transaction.Failed` 수신 시 카카오 알림톡 발송 확인
- [ ] 모바일에서 `/signup → /checkout` 전체 플로우 3분 이내 완료 확인
- [ ] `FIRM_ADMIN` 외 역할로 `/admin/billing` 접근 시 403 반환 확인

### Phase 2 전자서명 연동 완료 기준
- [ ] 이폼싸인 웹훅 → `contracts.status = 'signed'` 자동 업데이트 확인
- [ ] 서명 완료 → `/checkout?contract_id={id}` 자동 리다이렉트 확인
- [ ] `subscriptions.contract_signed_at` 타임스탬프 저장 확인

---

## 13. Edge Cases & 법적 고려사항

### 13-1. Edge Cases (pm.md Rule #4 기준)

| 케이스 | 처리 방법 |
|---|---|
| **빈 상태**: 결제 수단 미등록 | "아직 결제 수단이 없습니다. 카드를 등록해보세요." CTA 포함 |
| **권한 없는 접근** | 403 + "결제 관리는 대표 관리자만 가능합니다" 안내 |
| **네트워크 에러** | Optimistic UI + 재시도 버튼 (포트원 SDK 내장) |
| **사업자등록번호 오류** | 국세청 API 실시간 검증 → 즉시 에러 표시 |
| **동일 플랜 재가입** | "이미 활성화된 구독이 있습니다" 모달 → 관리 페이지 이동 |
| **결제 실패 3회 이상** | 계정 `past_due` 전환 → CS 자동 알림 |
| **트라이얼 중 결제 시도** | "30일 무료 체험 중. 종료 후 자동 결제됩니다" 안내 |

### 13-2. 법적 컴플라이언스 체크리스트 (전자상거래법·전자금융거래법)

> [!IMPORTANT]
> **전자상거래법 & 방문판매법 & 전자금융거래법** 준수 필요

| 항목 | 요건 | 처리 방법 |
|---|---|---|
| 구독 해지 안내 | 결제 전 해지 방법 명시 의무 | 체크아웃 페이지 하단 고지 |
| 자동결제 고지 | 정기결제 날짜/금액 미리 고지 | 결제 전 SMS/이메일 D-7 발송 (법적 의무) |
| 청약철회 기간 | 7일 이내 철회 가능 | 약관 명시 + 환불 정책 고지 |
| 개인정보 수집 | 결제 정보 수집 동의 | 개인정보처리방침 동의 항목 포함 |
| 전자계약 보관 | 계약서 5년 보관 의무 | Supabase Storage + 별도 백업 |
| 사업자등록번호 | 세금계산서 발행 시 검증 | 국세청 API 실시간 검증 |
| 결제 정보 암호화 | 카드번호 평문 저장 금지 | 포트원이 처리 (직접 저장 불가) |

> [!WARNING]
> **D-7 자동결제 사전 고지는 법적 의무**입니다 (전자금융거래법 제18조). 카카오 알림톡 + 이메일 동시 발송 구현 필수.

### 13-3. 변호사법/개인정보보호법 체크 (pm.md Rule #4 기준)

- [ ] 사업자등록번호 `AES-256` 암호화 저장 확인 (평문 저장 불가)
- [ ] RLS Policy — `tenant_id` 기준 타 로펌 결제 데이터 차단 확인
- [ ] 카드번호 우리 서버 미저장 확인 (포트원 토큰화 처리)
- [ ] 개인정보 처리방침 v2026.03 기준 동의 항목 포함 확인

---

## 14. 핵심 KPI 모니터링 (pm.md Rule #8 기준)

| KPI | 목표 | 측정 방법 |
|---|---|---|
| 유료 전환율 | > 30% (무료체험 → 유료) | 트라이얼 종료 후 `active` 전환 비율 |
| 결제 실패율 | < 5% | `payment_logs.status = 'failed'` 비율 |
| 미납률 | < 10% | `subscriptions.status = 'past_due'` 비율 |
| D7 온보딩 완료율 | > 60% | `welcome` 체크리스트 5단계 완료 비율 |
| 해지율 (Monthly Churn) | < 3% | 월별 `cancelled` 전환 비율 |
| 업셀 전환 | > 15% (업셀 타겟 대비) | 업셀 알림 발송 → 플랜 업그레이드 전환 |

---

*연계 Sprint: C3 (결제) → Esign Phase 2 (전자계약 연동) → 자문계약 자동 청구*
*연계 워크플로우: `/billing_chase` (미납 추적) | `/contract_renewal` (계약 갱신) | `/saas_churn` (해지 방어)*
*연계 문서: [`pm.md`] | [`08_PRICING_STRATEGY.md`] | [`11_WORKFLOW_SYSTEM.md`] | [`02_MULTITENANT_ARCHITECTURE.md`]*
