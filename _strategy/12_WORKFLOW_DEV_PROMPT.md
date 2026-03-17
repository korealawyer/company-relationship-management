# ⚡ 워크플로우 시스템 개발 실행 프롬프트
*(12_WORKFLOW_DEV_PROMPT.md | 설계서: 11_WORKFLOW_SYSTEM.md 기반)*

> **이 파일은 개발 실행 프롬프트입니다.**
> 새 AI 세션에 이 파일 전체를 붙여넣고 개발을 시작하세요.
> 설계 상세는 `_strategy/11_WORKFLOW_SYSTEM.md` 참조.

---

## 🧠 컨텍스트 주입 (세션 시작 시 반드시 읽을 것)

```
# 프로젝트: 법무법인 CRM SaaS — 워크플로우 시스템 구현

## 기술 스택
- Framework: Next.js 14 (App Router), TypeScript
- DB/Auth: Supabase (PostgreSQL + RLS + Edge Functions + Realtime)
- Email: Resend (기존 /api/email, /api/drip 존재)
- 알림: 카카오 알림톡 API (채널 개설 필요)
- 전자서명: 이폼싸인 API
- PDF: @react-pdf/renderer
- 스타일: Tailwind CSS + shadcn/ui

## 멀티테넌트 격리 원칙 (절대 준수)
- 모든 테이블에 tenant_id UUID NOT NULL 필수 (⚠️ law_firm_id 사용 금지 — automation.ts 기준)
- 모든 쿼리는 JWT의 tenant_id로 필터 (auth.jwt() ->> 'tenant_id')
- CLIENT 역할: 자신의 case_id 데이터만 접근
- CORP_HR 역할: 자사 corporate_client_id만 접근
- service_role key: Edge Function 내부에서만 (절대 클라이언트 노출 금지)

## 역할 체계
SUPER_ADMIN > FIRM_ADMIN > PARTNER_LAWYER > LAWYER > STAFF
SALES_MANAGER > SALES
CORP_HR (기업 HR 담당자 — /company-hr 진입)
CLIENT (개인 의뢰인 — /client-portal 진입)

## 현재 src/app/api/ 존재하는 것
/api/email, /api/drip, /api/chat, /api/leads, /api/payment
/api/sales-contact, /api/notion, /api/analyze, /api/review
```

---

## 📋 Phase 1 구현 체크리스트 (이번 스프린트)

### STEP 1: DB 마이그레이션

```sql
-- supabase/migrations/20260310_workflow_system.sql 생성

-- 1. workflow_rules 테이블
CREATE TABLE workflow_rules (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    uuid REFERENCES law_firms ON DELETE CASCADE NOT NULL,  -- ⚠️ law_firm_id → tenant_id
  name         text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'billing_overdue','case_deadline','case_status_change',
    'contract_signed','contract_expiring','client_portal_action',
    'board_event','schedule'
  )),
  trigger_config jsonb NOT NULL DEFAULT '{}',
  action_type    text NOT NULL CHECK (action_type IN (
    'send_kakao','send_email','send_sms','create_document',
    'update_case_status','request_esign','create_billing','notify_portal'
  )),
  action_config  jsonb NOT NULL DEFAULT '{}',
  is_active      boolean DEFAULT TRUE,
  created_by     uuid REFERENCES users,
  created_at     timestamptz DEFAULT NOW()
);
ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON workflow_rules
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 2. portal_actions 테이블
CREATE TABLE portal_actions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       uuid REFERENCES law_firms ON DELETE CASCADE NOT NULL,  -- ⚠️ law_firm_id → tenant_id
  client_user_id  uuid REFERENCES users NOT NULL,
  case_id         uuid REFERENCES cases,
  action_type     text CHECK (action_type IN (
    'document_upload','esign_complete','payment_confirm',
    'message_sent','report_downloaded'
  )),
  metadata        jsonb,
  created_at      timestamptz DEFAULT NOW()
);
ALTER TABLE portal_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_own_actions" ON portal_actions
  FOR SELECT USING (client_user_id = auth.uid());
CREATE POLICY "tenant_isolation" ON portal_actions
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 3. automation_logs 컬럼 추가
ALTER TABLE automation_logs
  ADD COLUMN IF NOT EXISTS workflow_rule_id uuid REFERENCES workflow_rules,
  ADD COLUMN IF NOT EXISTS retry_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- 4. pg_cron 마감일 체크 등록 (Supabase SQL Editor에서 실행)
SELECT cron.schedule(
  'daily-workflow-deadline',
  '0 0 * * *',
  $$SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/workflow-deadline-check',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  );$$
);

SELECT cron.schedule(
  'daily-workflow-billing',
  '0 0 * * *',
  $$SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/workflow-billing-overdue',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  );$$
);
```

---

### STEP 2: Supabase Edge Functions 생성

**파일 위치**: `supabase/functions/`

#### 2-A. `workflow-deadline-check/index.ts`

```typescript
// supabase/functions/workflow-deadline-check/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date()
  const checkPoints = [
    { days: 7, label: 'D-7', urgency: 'normal' },
    { days: 3, label: 'D-3', urgency: 'urgent' },
    { days: 0, label: 'D-0', urgency: 'critical' },
  ]

  let totalSent = 0

  for (const cp of checkPoints) {
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + cp.days)
    const dateStr = targetDate.toISOString().split('T')[0]

    const { data: cases } = await supabase
      .from('cases')
      .select('id, title, deadline_at, tenant_id, assigned_lawyer_id, users!assigned_lawyer_id(name, phone)')
      .eq('deadline_at', dateStr)
      .eq('status', 'active')

    for (const c of (cases ?? [])) {
      // 알림 발송 (카카오 or 이메일 폴백)
      await supabase.functions.invoke('send-kakao-alimtalk', {
        body: {
          phone: c.users?.phone,
          template: 'deadline_notice',
          params: { case_title: c.title, days_label: cp.label }
        }
      })

      // 로그 기록
      await supabase.from('automation_logs').insert({
        tenant_id: c.tenant_id,  // ⚠️ law_firm_id → tenant_id
        trigger_type: 'case_deadline',
        target_entity_id: c.id,
        target_entity_type: 'cases',
        sent_channel: 'kakao',
        status: 'sent'
      })

      totalSent++
    }
  }

  return new Response(JSON.stringify({ sent: totalSent }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

#### 2-B. `workflow-billing-overdue/index.ts`

```typescript
// supabase/functions/workflow-billing-overdue/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date()

  // 미납 청구서 조회
  const { data: overdueBills } = await supabase
    .from('billing')
    .select(`
      id, amount, due_date, tenant_id,
      cases!inner(title, assigned_lawyer_id),
      clients(contact_phone, contact_email, name)
    `)
    .eq('status', 'pending')
    .lt('due_date', today.toISOString().split('T')[0])

  for (const bill of (overdueBills ?? [])) {
    const daysOverdue = Math.floor(
      (today.getTime() - new Date(bill.due_date).getTime()) / (1000 * 60 * 60 * 24)
    )

    let template = ''
    let shouldNotifyLawyer = false

    if (daysOverdue >= 30) {
      template = 'billing_overdue_legal'
      shouldNotifyLawyer = true
    } else if (daysOverdue >= 7) {
      template = 'billing_overdue_d7'
      shouldNotifyLawyer = true
    } else if (daysOverdue >= 1) {
      template = 'billing_overdue_d1'
    }

    if (!template) continue

    // 의뢰인 알림
    await supabase.functions.invoke('send-kakao-alimtalk', {
      body: {
        phone: bill.clients?.contact_phone,
        template,
        params: { amount: bill.amount, days: daysOverdue }
      }
    })

    // 변호사 알림 (D+7, D+30)
    if (shouldNotifyLawyer) {
      await supabase.functions.invoke('send-email-resend', {
        body: {
          to: 'lawyer@example.com', // 실제 변호사 이메일
          subject: `[미납 알림] ${bill.clients?.name} — ${daysOverdue}일 미납`,
          template: 'billing_escalation'
        }
      })
    }

    // 로그
    await supabase.from('automation_logs').insert({
      tenant_id: bill.tenant_id,  // ⚠️ law_firm_id → tenant_id
      trigger_type: 'billing_overdue',
      target_entity_id: bill.id,
      target_entity_type: 'billing',
      sent_channel: 'kakao',
      status: 'sent'
    })
  }

  return new Response(JSON.stringify({ processed: overdueBills?.length ?? 0 }))
})
```

---

### STEP 3: API 라우트 생성

#### 3-A. `/api/workflows/route.ts`

```typescript
// src/app/api/workflows/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: 로펌의 워크플로우 규칙 목록
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('workflow_rules')
    .select(`
      *,
      automation_logs(count)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}

// POST: 새 워크플로우 규칙 생성
export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('workflow_rules')
    .insert({ ...body, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
```

#### 3-B. `/api/portal/cases/route.ts`

```typescript
// src/app/api/portal/cases/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS가 자동으로 client_id = auth.uid() 필터 적용
  const { data, error } = await supabase
    .from('cases')
    .select(`
      id, title, case_type, status, deadline_at, created_at,
      consultations(id, summary, created_at),
      documents(id, title, doc_type, status),
      contracts(id, status, signed_at),
      billing(id, type, amount, status, due_date)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}
```

---

### STEP 4: UI 컴포넌트 생성

#### 4-A. 어드민 워크플로우 대시보드

**파일**: `src/app/admin/workflows/page.tsx`

```
구현할 UI:
- 상단: 이번 달 자동 처리 N건 / 성공률 / 절약 시간 표시 카드 3개
- 중단: 워크플로우 규칙 목록 (카드 형태)
  - 각 카드: 이름, 트리거 타입 배지, ON/OFF 토글, 마지막 실행 시각
  - 수동 즉시 실행 버튼 (POST /api/workflows/[id]/trigger)
  - 실행 로그 슬라이드 패널 (클릭 시 펼침)
- 하단: 새 워크플로우 만들기 버튼 (Phase 3용 — 현재는 disabled)

권한: FIRM_ADMIN, PARTNER_LAWYER만 접근
```

#### 4-B. 의뢰인 포털 메인

**파일**: `src/app/client-portal/page.tsx`

```
구현할 UI:
- 상단: "안녕하세요, [의뢰인명]님" + 액션 필요 배지 (빨간 점)
- 액션 카드 (최우선 표시):
  - ✍️ 서명 대기 중 N건 → [지금 서명] 버튼
  - 📁 서류 제출 요청 N건 → [업로드] 버튼
- 내 사건 목록:
  - 각 카드: 사건명, 상태 진행바 (5단계), 마지막 업데이트
  - 클릭 시 상세 (타임라인 + 문서 목록 + 문의 작성)
- 청구서 섹션: 납부 대기 / 완료 내역
- 실시간 알림: Supabase Realtime 구독 (portal_actions 테이블)

권한: CLIENT, CORP_HR
TIP: 모바일 퍼스트 (변호사 법원 외출, 의뢰인 이동 중 접근) — viewport 360px 이상 대응
```

---

### STEP 5: 웹훅 엔드포인트 (이폼싸인)

```typescript
// src/app/api/webhooks/esign/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const payload = await req.json()
  // 이폼싸인 웹훅 서명 검증 (HMAC)
  // ...

  if (payload.status === 'signed') {
    const supabase = createAdminClient() // service_role key

    await supabase
      .from('contracts')
      .update({ status: 'signed', signed_at: new Date().toISOString() })
      .eq('esign_request_id', payload.request_id)

    await supabase.from('portal_actions').insert({
      action_type: 'esign_complete',
      metadata: { esign_request_id: payload.request_id }
      // law_firm_id, client_user_id는 contracts 조회 후 채울 것
    })

    // workflow-contract-signed Edge Function 트리거
    await supabase.functions.invoke('workflow-contract-signed', {
      body: { esign_request_id: payload.request_id }
    })
  }

  return NextResponse.json({ ok: true })
}
```

---

## 🚀 개발 실행 순서

```
1. DB 마이그레이션 실행 (STEP 1 SQL)
   → npx supabase db push

2. Edge Functions 배포 (STEP 2)
   → npx supabase functions deploy workflow-deadline-check
   → npx supabase functions deploy workflow-billing-overdue

3. API 라우트 생성 (STEP 3)
   → src/app/api/workflows/route.ts
   → src/app/api/portal/cases/route.ts
   → src/app/api/webhooks/esign/route.ts

4. UI 구현 (STEP 4)
   → src/app/admin/workflows/page.tsx
   → src/app/client-portal/page.tsx

5. 환경변수 확인
   SUPABASE_SERVICE_ROLE_KEY=...
   RESEND_API_KEY=...
   ESIGN_API_KEY=...      ← 이폼싸인 (신규 발급 필요)
   KAKAO_API_KEY=...      ← 카카오 비즈채널 (신규 개설 필요)

6. 로컬 테스트
   → npm run dev
   → npx supabase functions serve workflow-deadline-check
```

---

## ❗ 개발 시 주의사항

| 항목 | 주의 |
|---|---|
| **RLS 우회** | Edge Function에서만 `service_role key` 사용. API Route에서는 반드시 `createServerClient()` (anon key) |
| **CLIENT 격리** | `/api/portal/*` 모든 엔드포인트에서 RLS 의존. 추가 필터 절대 금지 (보안 이중 체크 아님, RLS가 단일 기준) |
| **카카오 폴백** | 카카오 알림톡 실패 시 → SMS → 이메일 순서로 자동 폴백 구현 필수 |
| **암호화** | `clients.registration_number`, `billing.amount` 등 민감 데이터는 AES-256 암호화 후 저장 |
| **pg_cron 사용** | Supabase Pro 플랜 이상 필요 (현재 플랜 확인 후 진행) |

---

*설계 원문: `_strategy/11_WORKFLOW_SYSTEM.md` | 자동화 카탈로그: `03_AUTOMATION_CATALOG.md`*
