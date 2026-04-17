-- Migration: 029_enable_realtime_and_search_status
-- Purpose: 
-- 1. Modify the inline CHECK constraint on cases.status to allow 'search_only'.
-- 2. Add 'cases' table to the 'supabase_realtime' publication for websockets.

DO $$
DECLARE
    rec record;
BEGIN
    -- Find and drop any existing check constraints on cases.status
    FOR rec IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'cases'::regclass 
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%status IN%'
    LOOP
        EXECUTE 'ALTER TABLE cases DROP CONSTRAINT ' || rec.conname;
    END LOOP;
END
$$;

-- Add explicit named constraint with 'search_only'
ALTER TABLE cases
ADD CONSTRAINT cases_status_check CHECK (
    status IN (
        'intake', 'retained', 'active', 'closing', 'closed', 'search_only'
    )
);

-- Add a column to store structured crawler data for real-time frontend
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS crawler_data JSONB;

-- Enable REALTIME for the cases table
-- Note: 'supabase_realtime' publication usually exists in Supabase.
DO $$
BEGIN
    -- Only add if it's not already in the publication
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'cases'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE cases;
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- If supabase_realtime does not exist, create it (for local testing parity)
        CREATE PUBLICATION supabase_realtime FOR TABLE cases;
END
$$;
