-- ================================================================
-- IBS 법률사무소 CRM — Supabase PostgreSQL 스키마
-- Supabase Dashboard > SQL Editor 에서 순서대로 실행
-- ================================================================

-- ── 1. 기업 테이블 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    biz_no          varchar(12) UNIQUE NOT NULL,          -- 사업자등록번호
    name            text NOT NULL,
    domain          text,
    contact_name    text,
    contact_email   text,
    contact_phone   text,
    biz_category    text,                                  -- 프랜차이즈, 유통업 등
    store_count     integer DEFAULT 0,
    plan            text DEFAULT 'none',                   -- none | basic | standard | premium
    status          text DEFAULT 'pending',                -- pending | analyzed | lawyer_confirmed | subscribed ...
    risk_level      text,                                  -- HIGH | MEDIUM | LOW
    risk_score      integer DEFAULT 0,
    issue_count     integer DEFAULT 0,
    privacy_url     text,
    assigned_lawyer_id uuid,
    email_sent_at   timestamptz,
    lawyer_confirmed boolean DEFAULT false,
    lawyer_confirmed_at timestamptz,
    source          text DEFAULT 'manual',
    -- 영업 프로세스
    sales_confirmed       boolean DEFAULT false,
    sales_confirmed_at    timestamptz,
    sales_confirmed_by    text,
    -- 이메일 / 클라이언트 응답
    email_subject         text,
    client_replied        boolean DEFAULT false,
    client_replied_at     timestamptz,
    client_reply_note     text,
    -- 통화 / 로그인
    login_count           integer DEFAULT 0,
    call_note             text,
    -- 자동화 / AI
    auto_mode             boolean DEFAULT true,
    ai_draft_ready        boolean DEFAULT false,
    custom_script         jsonb,
    lawyer_note           text,
    -- 계약 프로세스
    contract_sent_at      timestamptz,
    contract_signed_at    timestamptz,
    contract_method       text,
    contract_note         text,
    -- 자동화 추적
    callback_scheduled_at timestamptz,
    follow_up_step        integer,
    ai_memo_summary       text,
    ai_next_action        text,
    ai_next_action_type   text,
    last_call_result      text,
    last_call_at          timestamptz,
    call_attempts         integer DEFAULT 0,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- ── 2. 사용자 테이블 (Supabase Auth users와 1:1 연동) ─────────
CREATE TABLE IF NOT EXISTS users (
    id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           text UNIQUE NOT NULL,
    name            text,
    phone           text,
    role            text NOT NULL DEFAULT 'client_hr',
    -- roles: super_admin | admin | sales | lawyer | litigation | counselor
    --        hr | general | finance | client_hr
    company_id      uuid REFERENCES companies(id),
    created_at      timestamptz DEFAULT now()
);

-- ── 3. 이슈(조문) 테이블 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS issues (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    level           text NOT NULL,                         -- HIGH | MEDIUM | LOW
    law_ref         text,                                  -- 개인정보보호법 §XX
    title           text NOT NULL,
    original_text   text,
    risk_desc       text,
    custom_draft    text,
    lawyer_note     text,
    scenario        text,
    review_checked  boolean DEFAULT false,
    created_at      timestamptz DEFAULT now()
);

-- ── 4. 타임라인(활동 이력) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS timelines (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    author          text NOT NULL,
    content         text NOT NULL,
    type            text DEFAULT 'note',                   -- note | status_change | email | call
    created_at      timestamptz DEFAULT now()
);

-- ── 5. 상담 요청 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      uuid REFERENCES companies(id),
    user_id         uuid REFERENCES users(id),
    category        text,
    urgency         text DEFAULT 'normal',
    title           text,
    content         text,
    ai_draft        text,
    lawyer_draft    text,
    status          text DEFAULT 'submitted',
    callback_phone  text,
    created_at      timestamptz DEFAULT now()
);

-- ── 6. 구독 ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan            text NOT NULL,                         -- basic | standard | premium
    amount          integer NOT NULL,
    status          text DEFAULT 'active',                 -- active | expired | cancelled
    started_at      timestamptz DEFAULT now(),
    expires_at      timestamptz
);

-- ── 7. 판매 문의 (CTA 클릭) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_contacts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      uuid REFERENCES companies(id),
    contact_type    text,                                  -- phone | meeting | zoom | messenger
    message         text,
    created_at      timestamptz DEFAULT now()
);

-- ================================================================
-- RLS (Row Level Security) — 데이터 격리
-- ================================================================

ALTER TABLE companies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues        ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_contacts ENABLE ROW LEVEL SECURITY;

-- ── 헬퍼: 현재 사용자 역할 ───────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text LANGUAGE sql STABLE AS $$
    SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role')::text, (auth.jwt() -> 'user_metadata' ->> 'role')::text, 'client_hr')
$$;

CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
$$;

CREATE OR REPLACE FUNCTION is_internal()
RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT get_my_role() IN ('super_admin','admin','sales','lawyer','litigation','hr','general','finance')
$$;

-- ── companies RLS ─────────────────────────────────────────────
-- 내부 직원: 전체 조회/수정
-- client_hr: 본인 회사만
CREATE POLICY "companies_internal_all"   ON companies FOR ALL TO authenticated
    USING (is_internal()) WITH CHECK (is_internal());

CREATE POLICY "companies_client_select"  ON companies FOR SELECT TO authenticated
    USING (id = get_my_company_id() AND get_my_role() = 'client_hr');

-- ── users RLS ─────────────────────────────────────────────────
CREATE POLICY "users_self"               ON users FOR SELECT TO authenticated
    USING (id = auth.uid() OR is_internal());

CREATE POLICY "users_internal_write"     ON users FOR ALL TO authenticated
    USING (is_internal()) WITH CHECK (is_internal());

-- ── issues RLS ───────────────────────────────────────────────
CREATE POLICY "issues_internal_all"     ON issues FOR ALL TO authenticated
    USING (is_internal()) WITH CHECK (is_internal());

CREATE POLICY "issues_client_select"    ON issues FOR SELECT TO authenticated
    USING (company_id = get_my_company_id() AND get_my_role() = 'client_hr');

-- ── timelines RLS ────────────────────────────────────────────
CREATE POLICY "timelines_internal_all"  ON timelines FOR ALL TO authenticated
    USING (is_internal()) WITH CHECK (is_internal());

CREATE POLICY "timelines_client_select" ON timelines FOR SELECT TO authenticated
    USING (company_id = get_my_company_id() AND get_my_role() = 'client_hr');

-- ── consultations RLS ─────────────────────────────────────────
CREATE POLICY "consult_internal_all"    ON consultations FOR ALL TO authenticated
    USING (is_internal()) WITH CHECK (is_internal());

CREATE POLICY "consult_client"          ON consultations FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── subscriptions RLS ─────────────────────────────────────────
CREATE POLICY "subs_internal_all"       ON subscriptions FOR ALL TO authenticated
    USING (is_internal()) WITH CHECK (is_internal());

CREATE POLICY "subs_client_select"     ON subscriptions FOR SELECT TO authenticated
    USING (company_id = get_my_company_id());

-- ── sales_contacts RLS ────────────────────────────────────────
CREATE POLICY "sales_contacts_insert"  ON sales_contacts FOR INSERT TO authenticated
    WITH CHECK (company_id = get_my_company_id() OR is_internal());

CREATE POLICY "sales_contacts_internal"ON sales_contacts FOR SELECT TO authenticated
    USING (is_internal());

-- ================================================================
-- updated_at 자동 갱신 트리거
-- ================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ================================================================
-- 사용자 가입 시 users 테이블 자동 생성 트리거
-- ================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role, company_id)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'client_hr'),
        (NEW.raw_user_meta_data->>'company_id')::uuid
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================================
-- 알림 테이블 (Notifications)
-- ================================================================
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('document', 'payment', 'consultation', 'member', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    href TEXT,
    action_label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
