-- ================================================================
-- 008: companies 테이블 누락 컬럼 추가
-- 프론트엔드(types.ts Company 인터페이스)에는 정의되어 있으나
-- Supabase DB에 물리적으로 존재하지 않았던 컬럼들을 일괄 추가
-- 실행: Supabase Dashboard > SQL Editor
-- ================================================================

ALTER TABLE companies
  -- ── 영업 프로세스 ──
  ADD COLUMN IF NOT EXISTS sales_confirmed       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sales_confirmed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS sales_confirmed_by    text,

  -- ── 이메일 / 클라이언트 응답 ──
  ADD COLUMN IF NOT EXISTS email_subject         text,
  ADD COLUMN IF NOT EXISTS client_replied        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_replied_at     timestamptz,
  ADD COLUMN IF NOT EXISTS client_reply_note     text,

  -- ── 통화 / 로그인 ──
  ADD COLUMN IF NOT EXISTS login_count           integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS call_note             text,

  -- ── 자동화 / AI ──
  ADD COLUMN IF NOT EXISTS auto_mode             boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_draft_ready        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_script         jsonb,
  ADD COLUMN IF NOT EXISTS lawyer_note           text,

  -- ── 계약 프로세스 ──
  ADD COLUMN IF NOT EXISTS contract_sent_at      timestamptz,
  ADD COLUMN IF NOT EXISTS contract_signed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS contract_method       text,
  ADD COLUMN IF NOT EXISTS contract_note         text,

  -- ── 자동화 추적 필드 ──
  ADD COLUMN IF NOT EXISTS callback_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_step        integer,
  ADD COLUMN IF NOT EXISTS ai_memo_summary       text,
  ADD COLUMN IF NOT EXISTS ai_next_action        text,
  ADD COLUMN IF NOT EXISTS ai_next_action_type   text,
  ADD COLUMN IF NOT EXISTS last_call_result      text,
  ADD COLUMN IF NOT EXISTS last_call_at          timestamptz,
  ADD COLUMN IF NOT EXISTS call_attempts         integer DEFAULT 0;

-- ================================================================
-- 인덱스 추가 (자주 필터링되는 컬럼)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_companies_sales_confirmed ON companies(sales_confirmed);
CREATE INDEX IF NOT EXISTS idx_companies_client_replied   ON companies(client_replied);
CREATE INDEX IF NOT EXISTS idx_companies_auto_mode        ON companies(auto_mode);
