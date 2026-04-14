-- ================================================================
-- 029: Add company_id and document_url to contracts
-- ================================================================

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS company_id TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT;
