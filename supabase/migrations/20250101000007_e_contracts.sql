-- ================================================================
-- Phase 1: E-contract schema update
-- As requested, setting up the exact `contracts` table schema.
-- ================================================================

DROP TABLE IF EXISTS contracts CASCADE;

CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  template text,
  party_a_name text,
  party_a_signed boolean DEFAULT false,
  party_b_name text,
  party_b_email text,
  party_b_signed boolean DEFAULT false,
  content text,
  status text CHECK (status IN ('draft', 'waiting_other', 'both_signed')) DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자 (로펌 내부) 모두 접근 허용
CREATE POLICY "contracts_auth_all" ON contracts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 익명 사용자 (외부 의뢰인) 단건 조회 허용 (Public 서명 링크용)
CREATE POLICY "contracts_anon_select" ON contracts
  FOR SELECT TO anon USING (true);

-- 익명 사용자 (외부 의뢰인) 업데이트 허용 (서명 시 상태 변경용)
CREATE POLICY "contracts_anon_update" ON contracts
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- updated_at 자동 갱신 트리거
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
