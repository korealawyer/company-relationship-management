-- 030_add_is_read_to_consultations.sql

ALTER TABLE consultations
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Supabase 마이그레이터 트랜잭션 외부에서 인덱스 생성 (오류 시 수동 실행)
COMMIT;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_unread 
ON consultations (company_id) 
WHERE is_read = false;
BEGIN;
