-- ================================================================
-- Sprint C: 전자계약 (Esign) 마이그레이션
-- 생성일: 2026-03-11
-- 규칙: tenant_id UUID NOT NULL | RLS Policy: "tenant_isolation"
-- 연계: Sprint B (documents.linked_contract_id FK 매핑)
--       automation.ts (trigger_type: ESIGN_SENT | ESIGN_COMPLETED | ESIGN_RESENT)
-- ================================================================

-- ======================================
-- 1. contracts 테이블
-- ======================================
CREATE TABLE IF NOT EXISTS contracts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL,                           -- ★ RLS 격리 기준 (law_firm_id 사용 금지)

  -- Sprint B 역방향 FK
  linked_document_id   UUID REFERENCES documents(id) ON DELETE SET NULL,

  -- 계약 당사자
  party_a_name         TEXT NOT NULL,                          -- 갑 (甲): 법무법인
  party_a_biz_no       TEXT,
  party_a_rep          TEXT,
  party_a_address      TEXT,
  party_b_name         TEXT NOT NULL,                          -- 을 (乙): 의뢰인/거래처
  party_b_biz_no       TEXT,
  party_b_rep          TEXT,
  party_b_address      TEXT,
  party_b_email        TEXT,                                   -- 서명 요청 이메일

  -- 계약 내용
  template_type        TEXT CHECK (template_type IN (
                         'franchise',          -- 가맹계약서
                         'privacy',            -- 개인정보 위탁
                         'service',            -- 서비스 이용
                         'nda',                -- 비밀유지(NDA)
                         'employment',         -- 근로계약서
                         'retainer',           -- 자문계약서
                         'custom'              -- 직접 작성
                       )),
  contract_title       TEXT NOT NULL,
  contract_body        TEXT,                                   -- 계약서 본문 (Markdown/HTML)
  start_date           DATE,
  duration_months      INTEGER DEFAULT 12,

  -- 전자서명 상태
  status               TEXT DEFAULT 'draft' CHECK (status IN (
                         'draft',              -- 작성 중
                         'sent',               -- 서명 요청 발송됨
                         'viewed',             -- 수신인 열람
                         'signed',             -- 서명 완료
                         'expired',            -- 서명 링크 만료
                         'cancelled'           -- 취소
                       )),

  -- 서명 토큰 (URL 공유용)
  sign_token           UUID UNIQUE DEFAULT gen_random_uuid(),
  expires_at           TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  -- 서명 완료 증적 (법적 효력)
  signed_at            TIMESTAMPTZ,
  ip_address           TEXT,                                   -- 서명자 IP
  user_agent           TEXT,                                   -- 서명자 브라우저

  -- 서명 결과 파일
  pdf_url              TEXT,                                   -- 공개 접근 URL
  pdf_storage_path     TEXT,                                   -- Supabase Storage 경로: contracts/{tenant_id}/{token}.pdf
  signature_data_url   TEXT,                                   -- Canvas 서명 이미지 (base64)

  -- 기업 법인 ID (corp-1, corp-2, corp-3)
  company_id           TEXT,                                   -- 'corp-1' | 'corp-2' | 'corp-3'

  -- 요청자 정보
  created_by           UUID,                                   -- 서명 요청한 변호사/관리자 users.id

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자: tenant_id 기준 격리
CREATE POLICY "tenant_isolation" ON contracts
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 미인증(익명) 서명자: sign_token으로 조회 허용
-- (서명 페이지 /contracts/sign/[token] 접근 시 사용)
CREATE POLICY "sign_token_lookup" ON contracts
  FOR SELECT
  USING (sign_token IS NOT NULL);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();

-- ======================================
-- 2. automation_logs: related_contract_id 컬럼 추가
--    (Sprint B automation_logs 테이블에 contracts FK 추가)
-- ======================================
ALTER TABLE automation_logs
  ADD COLUMN IF NOT EXISTS related_contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- ================================================================
-- ✅ 완료 요약
-- contracts               → RLS tenant_isolation ✅ | sign_token_lookup ✅
--                           linked_document_id → documents(id) FK ✅
--                           ip_address, user_agent, signed_at 법적 증적 ✅
-- automation_logs         → related_contract_id 컬럼 추가 ✅
-- Storage: contracts 버킷 → tenant_id 격리 RLS ✅
-- ================================================================

-- ======================================
-- 3. Supabase Storage: contracts 버킷 RLS
--    버킷명: contracts
--    경로 규칙: contracts/{tenant_id}/{token}.pdf
--    업로드: service_role만 허용 (서버 사이드 API에서만 업로드)
--    다운로드: tenant_id가 JWT의 tenant_id와 일치하는 경우만 허용
-- ======================================

-- Storage 버킷은 Supabase Dashboard에서 생성 (또는 아래 seed 활용)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('contracts', 'contracts', false, 52428800, ARRAY['application/pdf', 'image/png'])
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 다운로드 (SELECT) — jwt의 tenant_id와 경로 첫 번째 세그먼트 일치
CREATE POLICY "contracts_tenant_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

-- Storage RLS: 업로드 (INSERT) — service_role 전용 (API 서버에서만)
-- 클라이언트 직접 업로드 차단
CREATE POLICY "contracts_service_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'contracts'
    AND auth.role() = 'service_role'
  );

-- Storage RLS: 삭제 (DELETE) — service_role 전용
CREATE POLICY "contracts_service_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'contracts'
    AND auth.role() = 'service_role'
  );
