-- 구분(프랜차이즈/그외) 정보를 별도로 저장하기 위한 컬럼 추가
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS franchise_type text;
