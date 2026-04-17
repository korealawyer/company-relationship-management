-- ================================================================
-- 이슈 테이블에 추가 분석 컬럼 (법적 근거, 수정 의견) 추가
-- ================================================================

ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS legal_basis JSONB,
ADD COLUMN IF NOT EXISTS revision_opinion TEXT;
