-- ================================================================
-- Sprint B: 문서허브 & 코멘트 시스템 마이그레이션
-- 생성일: 2026-03-11
-- 규칙: tenant_id UUID NOT NULL | RLS Policy: "tenant_isolation"
-- 연계: DocComment Vibe Prompt | DOCUMENT_COMMENT_SYSTEM.md v2.4
--       automation.ts (trigger_type 단일 진실 소스)
-- ================================================================

-- ======================================
-- 1. documents 테이블
--    Sprint C FK 상위 테이블 (contracts.linked_document_id → documents.id)
-- ======================================
CREATE TABLE IF NOT EXISTS documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,           -- ★ RLS 격리 기준 (law_firm_id 사용 금지)
  case_id             UUID,                    -- cases.id 참조 (개인 의뢰인 사건)
  company_id          TEXT,                    -- 'corp-1' | 'corp-2' | 'corp-3' (기업법인 전용)
  title               TEXT NOT NULL,
  doc_type            TEXT CHECK (doc_type IN (
                        'contract', 'court_filing', 'opinion',
                        'board_minutes', 'director_appointment',
                        'shareholder_notice', 'officer_contract',
                        'retainer_report', 'closure_report',
                        'timecost_invoice', 'compliance_report'
                      )),
  doc_source          TEXT CHECK (doc_source IN (
                        'internal',    -- 내부 생성
                        'our_filing',  -- 우리 제출
                        'opponent',    -- 상대방 제출
                        'court'        -- 법원 문건
                      )),
  status              TEXT DEFAULT 'draft' CHECK (status IN (
                        'draft', 'reviewing', 'approved', 'rejected', 'sent'
                      )),
  urgency             TEXT DEFAULT 'normal' CHECK (urgency IN (
                        'normal', 'urgent', 'critical'
                      )),
  version             INTEGER DEFAULT 1,
  file_url            TEXT,                    -- Supabase Storage 경로
  file_type           TEXT,                    -- 'pdf' | 'docx' | 'hwp'
  file_size           BIGINT,                  -- bytes
  uploaded_by         UUID,                    -- users.id 참조
  linked_contract_id  UUID,                    -- Sprint C: contracts.id 역방향 연결
  storage_path        TEXT,                    -- Supabase Storage 전체 경로
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON documents
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ======================================
-- 2. document_comments 테이블
--    parent_id 자기참조 → GitHub PR 스타일 스레드
-- ======================================
CREATE TABLE IF NOT EXISTS document_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,           -- ★ RLS 격리 기준
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES document_comments(id),  -- NULL = 루트 코멘트
  author_id       UUID NOT NULL,           -- users.id 참조
  comment_type    TEXT DEFAULT 'general' CHECK (comment_type IN (
                    'general',            -- 📌 일반 코멘트
                    'approval',           -- ✅ 승인 코멘트 (법적 효력)
                    'revision_request',   -- ⚠️ 수정 요청
                    'notice'              -- 🔔 공지 (전체 읽음 요청)
                  )),
  content         TEXT NOT NULL,
  attachment_url  TEXT,
  tagged_users    TEXT[],                  -- @태그된 사용자 ID 배열
  page_ref        INTEGER,                 -- PDF 몇 페이지에 달린 코멘트
  text_ref        TEXT,                    -- 선택된 텍스트 구절
  due_date        TIMESTAMPTZ,             -- /due [날짜] 단축키 대응
  is_resolved     BOOLEAN DEFAULT FALSE,
  resolved_by     UUID,                    -- 해결 처리한 users.id
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON document_comments
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ======================================
-- 3. document_approvals 테이블
--    법적 보존용 결재 이력
--    순서: lawyer_1st → partner_final → [계약건] sales_contract
--          esign_completed = Sprint C 전자서명 완료 시 자동 INSERT
-- ======================================
CREATE TABLE IF NOT EXISTS document_approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,           -- ★ RLS 격리 기준
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  approver_id     UUID NOT NULL,           -- users.id
  approver_name   TEXT,
  approval_type   TEXT CHECK (approval_type IN (
                    'lawyer_1st',          -- 담당변호사 1차 검토
                    'partner_final',       -- 파트너변호사 최종 승인
                    'sales_contract',      -- 영업팀 계약 한정 결재
                    'admin_override',      -- FIRM_ADMIN 우회 결재
                    'esign_completed'      -- Sprint C: 전자서명 완료 자동 기록
                  )),
  approved_at     TIMESTAMPTZ DEFAULT NOW(),
  comment         TEXT,
  legal_binding   BOOLEAN DEFAULT TRUE     -- 법적 효력 여부
);

ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON document_approvals
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ======================================
-- 4. document_requests 테이블
--    Sprint B-2: 기업 의뢰 → 내부팀 워크플로우
--    trigger_type 값: 'doc_request_created' | 'doc_request_assigned' |
--                     'doc_request_delivered' | 'doc_request_confirmed_by_client'
--    (src/lib/constants/automation.ts DOC_REQUEST_* 상수와 일치)
-- ======================================
CREATE TABLE IF NOT EXISTS document_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,       -- ★ RLS 격리 기준
  request_number      TEXT UNIQUE,         -- 'DR-2026-001' 형식 자동 생성
  title               TEXT NOT NULL,
  doc_type            TEXT,
  description         TEXT,
  urgency             TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'critical')),
  status              TEXT DEFAULT 'pending' CHECK (status IN (
                        'pending',         -- 접수 대기
                        'in_progress',     -- 담당자 배정 후 작성 중
                        'completed',       -- 작성 완료
                        'delivered'        -- 기업고객 전달 완료
                      )),
  company_id          TEXT,                -- 'corp-1' | 'corp-2' | 'corp-3'
  requested_by        UUID,               -- 기업 HR users.id
  requested_by_name   TEXT,               -- 기업 HR 담당자명 (비정규화)
  assignee_id         UUID,               -- 담당 변호사/직원 users.id
  assignee_name       TEXT,               -- 담당자명 (비정규화)
  deadline            DATE,
  linked_document_id  UUID REFERENCES documents(id),  -- 완성 후 연결 문서
  client_confirmed    BOOLEAN DEFAULT FALSE,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON document_requests
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- request_number 자동 생성 트리거
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM document_requests
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  NEW.request_number := 'DR-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_request_number
  BEFORE INSERT ON document_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL)
  EXECUTE FUNCTION generate_request_number();

-- ======================================
-- 5. automation_logs 테이블
--    모든 자동화 이벤트 기록
--    trigger_type → src/lib/constants/automation.ts AUTOMATION_TRIGGER_TYPE 참조
--    Sprint B/B-2 trigger_type 값:
--      'document_uploaded' | 'document_comment_added' | 'document_comment_resolved'
--      'document_approved' | 'document_rejected'
--      'doc_request_created' | 'doc_request_assigned'
--      'doc_request_delivered' | 'doc_request_confirmed_by_client'
--    Sprint C 추가: 'esign_sent' | 'esign_completed' (기존 테이블 재사용)
-- ======================================
CREATE TABLE IF NOT EXISTS automation_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,       -- ★ RLS 격리 기준
  trigger_type        TEXT NOT NULL,       -- automation.ts AUTOMATION_TRIGGER_TYPE 상수값
  related_document_id UUID REFERENCES documents(id),
  related_contract_id UUID,               -- Sprint C: contracts.id
  related_case_id     UUID,               -- cases.id
  actor_id            UUID,               -- 이벤트 발생 주체 users.id
  target_entity_id    UUID,
  target_entity_type  TEXT,               -- 'document' | 'comment' | 'request' | 'contract'
  sent_channel        TEXT CHECK (sent_channel IN ('kakao', 'email', 'sms', 'push', 'in_app')),
  status              TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  payload             JSONB,              -- 추가 메타데이터 (JSON)
  error_message       TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON automation_logs
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ================================================================
-- ✅ 완료 요약
-- documents            → RLS tenant_isolation ✅
-- document_comments    → RLS tenant_isolation ✅ | parent_id 자기참조 ✅
-- document_approvals   → RLS tenant_isolation ✅ | esign_completed Sprint C 대비 ✅
-- document_requests    → RLS tenant_isolation ✅ | request_number 자동생성 ✅
-- automation_logs      → RLS tenant_isolation ✅ | trigger_type automation.ts 참조 ✅
-- ================================================================
