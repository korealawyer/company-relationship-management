-- ================================================================
-- 009: companies 테이블 개인정보처리방침 관리용 컬럼 추가
-- CRM 슬라이드 패널의 [개인정보] 탭에서 URL 및 원문을 저장하기 위해 필요
-- 실행: Supabase Dashboard > SQL Editor
-- ================================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS privacy_url         text,
  ADD COLUMN IF NOT EXISTS privacy_policy_text text;

-- NOTIFY pgrst, 'reload schema'; -- 필요 시 캐시 리프레시를 위해 실행
