-- ================================================================
-- IBS CRM — Supabase 초기 스키마
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣기 → Run
-- ================================================================

-- ── 1) 사용자 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client_hr',
  company_id TEXT,
  company_name TEXT,
  avatar_url TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2) 기업 (영업 CRM) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  biz_no TEXT UNIQUE,
  url TEXT,
  email TEXT,
  phone TEXT,
  store_count INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  assigned_lawyer TEXT,
  sales_confirmed BOOLEAN DEFAULT false,
  sales_confirmed_at TIMESTAMPTZ,
  sales_confirmed_by TEXT,
  lawyer_confirmed BOOLEAN DEFAULT false,
  lawyer_confirmed_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  email_subject TEXT,
  client_replied BOOLEAN DEFAULT false,
  client_replied_at TIMESTAMPTZ,
  client_reply_note TEXT,
  login_count INT DEFAULT 0,
  call_note TEXT,
  plan TEXT DEFAULT 'none',
  auto_mode BOOLEAN DEFAULT false,
  ai_draft_ready BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual',
  risk_score INT DEFAULT 0,
  risk_level TEXT DEFAULT '',
  issue_count INT DEFAULT 0,
  biz_type TEXT,
  domain TEXT,
  privacy_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  lawyer_note TEXT,
  contract_sent_at TIMESTAMPTZ,
  contract_signed_at TIMESTAMPTZ,
  contract_method TEXT,
  contract_note TEXT,
  callback_scheduled_at TIMESTAMPTZ,
  follow_up_step INT DEFAULT 0,
  ai_memo_summary TEXT,
  ai_next_action TEXT,
  ai_next_action_type TEXT,
  last_call_result TEXT,
  last_call_at TIMESTAMPTZ,
  call_attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3) 이슈 (개인정보 위반 등) ────────────────────────────────
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('HIGH','MEDIUM','LOW')),
  law TEXT,
  title TEXT NOT NULL,
  original_text TEXT,
  risk_desc TEXT,
  custom_draft TEXT,
  lawyer_note TEXT,
  review_checked BOOLEAN DEFAULT false,
  ai_draft_generated BOOLEAN DEFAULT false,
  scenario TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4) 기업 담당자 연락처 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_contacts (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  department TEXT,
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT false
);

-- ── 5) 기업 타임라인 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_timeline (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  author TEXT,
  type TEXT CHECK (type IN ('status_change','call','email','note','meeting')),
  content TEXT,
  from_status TEXT,
  to_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 6) 기업 메모 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_memos (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  author TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 7) 송무팀 소송 사건 ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS litigation_cases (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  company_name TEXT,
  case_no TEXT,
  court TEXT,
  type TEXT,
  opponent TEXT,
  claim_amount BIGINT DEFAULT 0,
  status TEXT DEFAULT 'preparing'
    CHECK (status IN ('preparing','filed','hearing','settlement','judgment','closed')),
  assigned_lawyer TEXT,
  notes TEXT,
  result TEXT DEFAULT '',
  result_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 8) 송무 기한 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS litigation_deadlines (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES litigation_cases(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ
);

-- ── 9) 법률 상담 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  company_name TEXT,
  branch_name TEXT,
  author_name TEXT,
  author_role TEXT,
  category TEXT,
  urgency TEXT DEFAULT 'normal',
  title TEXT,
  body TEXT,
  ai_answer TEXT,
  ai_confidence INT DEFAULT 0,
  ai_law TEXT[],
  lawyer_answer TEXT,
  assigned_lawyer TEXT,
  assigned_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  status TEXT DEFAULT 'submitted',
  callback_phone TEXT,
  callback_requested_at TIMESTAMPTZ,
  callback_done_at TIMESTAMPTZ,
  callback_note TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 10) 개인 의뢰인 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_year INT,
  address TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 11) 개인 소송 사건 ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_litigations (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES personal_clients(id) ON DELETE CASCADE,
  client_name TEXT,
  case_no TEXT,
  court TEXT,
  type TEXT,
  role TEXT,
  opponent TEXT,
  opponent_lawyer TEXT,
  claim_amount BIGINT DEFAULT 0,
  status TEXT DEFAULT 'consulting',
  assigned_lawyer TEXT,
  notes TEXT,
  result TEXT DEFAULT '',
  result_note TEXT,
  legal_fee BIGINT DEFAULT 0,
  court_fee BIGINT DEFAULT 0,
  next_hearing_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 12) 개인 소송 기한 ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_lit_deadlines (
  id TEXT PRIMARY KEY,
  litigation_id TEXT REFERENCES personal_litigations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ
);

-- ── 13) 개인 소송 문서 ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_lit_documents (
  id TEXT PRIMARY KEY,
  litigation_id TEXT REFERENCES personal_litigations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('complaint','brief','evidence','court_order','judgment','other')),
  added_at TIMESTAMPTZ DEFAULT now()
);

-- ── 14) 자동화 설정 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  auto_sales_confirm BOOLEAN DEFAULT true,
  auto_assign_lawyer BOOLEAN DEFAULT true,
  auto_generate_draft BOOLEAN DEFAULT true,
  auto_send_email BOOLEAN DEFAULT true,
  lawyer_round_robin INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT DEFAULT '시스템'
);

-- ── 15) 자동화 로그 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_logs (
  id TEXT PRIMARY KEY,
  type TEXT,
  label TEXT,
  company_name TEXT,
  detail TEXT,
  prev_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══ RLS 활성화 ═══════════════════════════════════════════════
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE litigation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE litigation_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_litigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_lit_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_lit_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_logs ENABLE ROW LEVEL SECURITY;

-- ── 기본 RLS 정책: 인증된 사용자 모든 작업 허용 ────────────
-- 프로덕션에서는 role 기반 세분화 필요
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'users','companies','issues','company_contacts','company_timeline',
      'company_memos','litigation_cases','litigation_deadlines','consultations',
      'personal_clients','personal_litigations','personal_lit_deadlines',
      'personal_lit_documents','auto_settings','auto_logs'
    ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Allow authenticated full access" ON %I',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "Allow authenticated full access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS "Allow anon read" ON %I',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "Allow anon read" ON %I FOR SELECT TO anon USING (true)',
      tbl
    );
  END LOOP;
END
$$;

-- ══ 인덱스 ═══════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_biz_no ON companies(biz_no);
CREATE INDEX IF NOT EXISTS idx_issues_company ON issues(company_id);
CREATE INDEX IF NOT EXISTS idx_litigation_company ON litigation_cases(company_id);
CREATE INDEX IF NOT EXISTS idx_consultations_company ON consultations(company_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_personal_lit_client ON personal_litigations(client_id);
CREATE INDEX IF NOT EXISTS idx_personal_lit_status ON personal_litigations(status);

-- ══ 자동화 설정 초기값 ═══════════════════════════════════════
INSERT INTO auto_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;
