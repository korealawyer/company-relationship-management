-- ================================================================
-- Phase 1 update: E-contract schema update
-- Add signature_data_url column to contracts table
-- ================================================================

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS signature_data_url TEXT;
