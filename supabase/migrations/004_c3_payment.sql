-- ================================================================
-- C3: SaaS 결제 & 구독 플로우 DB 마이그레이션
-- 파일명: supabase/migrations/004_c3_payment.sql
-- 실행 순서: schema.sql → 001 → 002 → 003 → 004 (이 파일)
--
-- 설계 근거:
--   _strategy/13_PAYMENT_CONTRACT_FLOW.md (결제·구독 플로우)
--   _strategy/08_PRICING_STRATEGY.md (플랜 정의)
--   멀티테넌트 격리: tenant_id (NOT law_firm_id) — 절대 규칙 #1
--   RLS Policy 명: tenant_isolation
--   trigger_type 값: src/lib/constants/automation.ts에서 관리
-- ================================================================

-- ================================================================
-- TABLE 1: subscriptions (SaaS 구독 상태 관리)
-- ================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 멀티테넌트 격리 (절대 규칙 #1: tenant_id)
    tenant_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 구독 플랜 (SUBSCRIPTION_PLAN from automation.ts)
    plan                TEXT NOT NULL CHECK (plan IN (
                          'basic',      -- Basic: 변호사 4인 이하, ₩99만/월
                          'pro',        -- Pro: 변호사 15인 이하, ₩249만/월
                          'growth',     -- Growth: 무제한, ₩499만/월
                          'enterprise'  -- Enterprise: 협의
                        )),

    -- 청구 주기 (BILLING_CYCLE from automation.ts)
    billing_cycle       TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),

    -- 구독 상태 (trial → active → past_due → cancelled)
    status              TEXT NOT NULL DEFAULT 'trial' CHECK (status IN (
                          'trial',      -- 무료 체험 (30일)
                          'active',     -- 정상 구독 중
                          'past_due',   -- 결제 실패 (미납 상태 — billing_past_due 트리거)
                          'cancelled',  -- 해지 완료
                          'paused'      -- 일시 정지 (Enterprise 협의)
                        )),

    -- 포트원 빌링키 정보 (카드 정보 비저장 — 토큰화)
    portone_billing_key TEXT,           -- 포트원 발급 빌링키 (결제 수단 토큰)
    portone_customer_id TEXT,           -- 포트원 고객 ID

    -- 계약 및 체험 기간
    trial_ends_at       TIMESTAMPTZ,    -- 무료 체험 종료 시각 (NOW() + 30일)
    contract_signed_at  TIMESTAMPTZ,   -- 전자계약 서명 완료 시각 (Esign 연동)
    current_period_start TIMESTAMPTZ,  -- 현재 청구 주기 시작
    current_period_end  TIMESTAMPTZ,   -- 현재 청구 주기 종료

    -- 취소 정보 (7일 냉각기간 고려)
    cancel_at           TIMESTAMPTZ,   -- 예정 취소 시각 (기간 말에 취소)
    cancelled_at        TIMESTAMPTZ,   -- 실제 취소 처리 시각

    -- 타임스탬프
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 테넌트당 구독은 1개만 (활성 구독 중복 방지)
    CONSTRAINT subscriptions_tenant_unique UNIQUE (tenant_id)
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON subscriptions
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION subscriptions_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION subscriptions_set_updated_at();

-- 인덱스: 만료 임박 체험 스캔 (pg_cron: D-3 업셀 트리거용)
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_expiry
    ON subscriptions(trial_ends_at, status)
    WHERE status = 'trial';

-- 인덱스: 미납 상태 스캔
CREATE INDEX IF NOT EXISTS idx_subscriptions_past_due
    ON subscriptions(status, updated_at)
    WHERE status = 'past_due';


-- ================================================================
-- TABLE 2: payment_logs (결제 이력 로그)
-- 포트원 결제 성공/실패 이력 보존
-- ================================================================
CREATE TABLE IF NOT EXISTS payment_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 멀티테넌트 격리
    tenant_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 연계 구독
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- 결제 금액 및 플랜 스냅샷 (구독 플랜 변경 후에도 이력 보존)
    amount          NUMERIC(12, 0) NOT NULL,   -- 실결제 금액 (원 단위)
    plan_snapshot   TEXT,                       -- 결제 시점 플랜 (스냅샷)
    billing_cycle   TEXT,                       -- 결제 시점 청구 주기

    -- 포트원 트랜잭션
    portone_tx_id   TEXT,                       -- 포트원 거래 ID (멱등성 확인)
    portone_status  TEXT,                       -- 포트원 원본 상태 (Paid, Failed 등)

    -- 내부 상태
    status          TEXT NOT NULL CHECK (status IN (
                      'success',  -- 결제 성공 (PAYMENT_SUCCESS 트리거)
                      'failed',   -- 결제 실패 (PAYMENT_FAILED 트리거)
                      'refunded', -- 환불 완료
                      'pending'   -- 처리 중
                    )),

    -- 실패 이유 (재시도 판단용)
    failure_reason  TEXT,

    -- 세금계산서 발행 여부
    tax_invoice_issued   BOOLEAN NOT NULL DEFAULT FALSE,
    tax_invoice_number   TEXT,

    -- 타임스탬프
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON payment_logs
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 인덱스: 테넌트별 최신 결제 이력 조회
CREATE INDEX IF NOT EXISTS idx_payment_logs_tenant_date
    ON payment_logs(tenant_id, created_at DESC);

-- 인덱스: portone_tx_id 중복 방지 (멱등성)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_logs_tx_id
    ON payment_logs(portone_tx_id)
    WHERE portone_tx_id IS NOT NULL;


-- ================================================================
-- TABLE 3: consent_records (이용약관 동의 법적 증거)
-- 7년 보존 의무 (전자상거래법)
-- ================================================================
CREATE TABLE IF NOT EXISTS consent_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 멀티테넌트 격리
    tenant_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 동의 사용자
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,

    -- 법적 증거 데이터 (변경 불가 — 별도 audit)
    ip_address      INET NOT NULL,              -- 동의 시점 IP
    user_agent      TEXT NOT NULL,              -- 브라우저 정보
    terms_version   TEXT NOT NULL,              -- 약관 버전 (예: '2026-03-01')
    consented_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 동의 항목 체크박스 상태 (법적 요건: 개별 동의 기록)
    agree_service   BOOLEAN NOT NULL DEFAULT FALSE,   -- 서비스 이용약관 (필수)
    agree_privacy   BOOLEAN NOT NULL DEFAULT FALSE,   -- 개인정보 수집·이용 (필수)
    agree_recurring BOOLEAN NOT NULL DEFAULT FALSE,   -- 자동결제 동의 (필수)
    agree_contract  BOOLEAN NOT NULL DEFAULT FALSE,   -- 구독 계약 동의 (필수)
    agree_marketing BOOLEAN NOT NULL DEFAULT FALSE,   -- 마케팅 수신 (선택)

    -- 필수 동의 완료 여부 체크 (API에서 INSERT 전 검증)
    CONSTRAINT all_required_consented CHECK (
        agree_service = TRUE AND agree_privacy = TRUE
        AND agree_recurring = TRUE AND agree_contract = TRUE
    )
);

-- RLS
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON consent_records
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 인덱스: 최신 동의 기록 조회 (결제 전 검증용)
CREATE INDEX IF NOT EXISTS idx_consent_records_tenant_user
    ON consent_records(tenant_id, user_id, consented_at DESC);


-- ================================================================
-- TABLE 4: workflow_rules (자동화 워크플로우 규칙)
-- 11_WORKFLOW_SYSTEM.md 연계
-- ================================================================
CREATE TABLE IF NOT EXISTS workflow_rules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 멀티테넌트 격리
    tenant_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 규칙 타입 (automation.ts AUTOMATION_TRIGGER_TYPE 기준)
    rule_type   TEXT NOT NULL,              -- trigger_type 값 (예: 'hearing_added')

    -- 규칙 설정 (JSONB — 채널, 수신자, 조건 등)
    config      JSONB NOT NULL DEFAULT '{}',
    -- 예시:
    -- { "channel": "kakao", "target": "client", "days_before": 3 }
    -- { "channel": "email", "target": "attorney", "template": "hearing_reminder" }

    -- 규칙 이름 (관리자 UI 표시용)
    name        TEXT,
    description TEXT,

    -- 활성화 여부
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,

    -- 타임스탬프
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 테넌트 내 규칙 타입 유니크 (기본 규칙 1개)
    -- 복수 규칙은 config 배열로 처리
    CONSTRAINT workflow_rules_tenant_type_unique UNIQUE (tenant_id, rule_type, name)
);

-- RLS
ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON workflow_rules
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION workflow_rules_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER workflow_rules_updated_at
    BEFORE UPDATE ON workflow_rules
    FOR EACH ROW EXECUTE FUNCTION workflow_rules_set_updated_at();

-- 인덱스: 활성 규칙 조회 (자동화 엔진 스캔용)
CREATE INDEX IF NOT EXISTS idx_workflow_rules_active
    ON workflow_rules(tenant_id, rule_type)
    WHERE is_active = TRUE;


-- ================================================================
-- TABLE 5: portal_actions (포털 사용자 액션 로그)
-- 의뢰인 포털 / 기업 HR 포털 행동 이력
-- ================================================================
CREATE TABLE IF NOT EXISTS portal_actions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 멀티테넌트 격리
    tenant_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 액션 타입 (automation.ts AUTOMATION_TRIGGER_TYPE 연계)
    action_type TEXT NOT NULL,              -- 예: 'doc_request_created', 'esign_viewed'

    -- 액션 주체
    actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role  TEXT,                       -- 액션 시점 역할 스냅샷

    -- 액션 대상 (사건/문서/계약 등)
    target_id   UUID,                       -- 대상 리소스 ID
    target_type TEXT,                       -- 대상 타입 ('case', 'document', 'contract')

    -- 추가 메타데이터 (JSONB)
    metadata    JSONB NOT NULL DEFAULT '{}',
    -- 예시:
    -- { "case_id": "...", "action": "viewed", "duration_sec": 45 }
    -- { "document_id": "...", "downloaded": true }

    -- IP / UA (보안 감사용)
    ip_address  INET,
    user_agent  TEXT,

    -- 타임스탬프
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE portal_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON portal_actions
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 인덱스: 테넌트별 최신 액션 조회 (대시보드 활동 피드)
CREATE INDEX IF NOT EXISTS idx_portal_actions_tenant_date
    ON portal_actions(tenant_id, created_at DESC);

-- 인덱스: 사용자별 액션 이력 (포털 개별 활동 조회)
CREATE INDEX IF NOT EXISTS idx_portal_actions_actor
    ON portal_actions(tenant_id, actor_id, created_at DESC);


-- ================================================================
-- 기본 워크플로우 규칙 시드 데이터
-- (새 테넌트 생성 시 자동 적용하지 않으므로 주석 처리)
-- 실제 적용: 가입 완료 웹훅에서 INSERT
-- ================================================================
-- INSERT INTO workflow_rules (tenant_id, rule_type, name, config, is_active)
-- VALUES
--   (NEW.id, 'hearing_added',      '기일 D-3 의뢰인 카카오 알림',
--    '{"channel":"kakao","target":"client","days_before":3}', TRUE),
--   (NEW.id, 'hearing_added',      '기일 D-7 내부 변호사 알림',
--    '{"channel":"internal","target":"attorney","days_before":7}', TRUE),
--   (NEW.id, 'payment_failed',     '결제 실패 → 관리자 이메일',
--    '{"channel":"email","target":"firm_admin"}', TRUE),
--   (NEW.id, 'billing_chase_triggered', '미수 독촉 자동화',
--    '{"days_overdue":7,"action":"send_reminder"}', TRUE);


-- ================================================================
-- 완료 메시지
-- ================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ 004_c3_payment.sql 마이그레이션 완료';
    RAISE NOTICE '   - subscriptions 테이블 (trial→active FSM)';
    RAISE NOTICE '   - payment_logs 테이블 (포트원 tx_id 멱등성)';
    RAISE NOTICE '   - consent_records 테이블 (법적 증거, 필수 동의 체크)';
    RAISE NOTICE '   - workflow_rules 테이블 (자동화 규칙 JSONB)';
    RAISE NOTICE '   - portal_actions 테이블 (포털 행동 로그)';
    RAISE NOTICE '   ⚠️  모든 테이블 tenant_isolation RLS 적용 완료';
END;
$$;
