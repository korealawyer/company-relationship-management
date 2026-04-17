-- ================================================================
-- 이슈 테이블에 AI 분석용 추가 컬럼 (위반 시나리오, 예상 제재, 수정 권고) 추가
-- ================================================================

ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS penalty TEXT,
ADD COLUMN IF NOT EXISTS recommendation TEXT;
