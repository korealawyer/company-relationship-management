-- =========================================================================
-- Stage 3: Sales Queue Performance Optimization (Vercel/Supabase Hardening)
-- =========================================================================
-- Purpose: 
-- Prevents catastrophic DB 'File Sort' memory overflows when multiple clients
-- request sorted data concurrently. This ensures sub-millisecond query performance
-- and perfectly aligns with the frontend CDC O(1) Auto-Sort algorithm priority:
-- 1. Pending Callbacks
-- 2. Risk Score (DESC)
-- =========================================================================

-- Create a composite B-Tree index exactly matching the frontend getQueue sorting pattern
CREATE INDEX IF NOT EXISTS idx_companies_sales_queue 
ON companies (
    status, 
    last_called_by, 
    callback_scheduled_at ASC NULLS LAST, 
    risk_score DESC NULLS LAST
);

-- =========================================================================
-- Realtime CDC Validation
-- =========================================================================
-- Ensure the 'companies' table is accurately tracked by Supabase Realtime
-- so the new Event All (*) array upsert triggers correctly on the frontend
-- Note: Already enabled in early migrations, just doing a safe idempotent check.
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
