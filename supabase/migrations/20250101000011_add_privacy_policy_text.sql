-- 009: 개인정보처리방침 원문(텍스트) 저장 컬럼 추가
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS privacy_policy_text TEXT;

COMMENT ON COLUMN companies.privacy_policy_text IS '개인정보처리방침 원문 전체 텍스트 (관리자가 복사/붙여넣기로 입력)';
