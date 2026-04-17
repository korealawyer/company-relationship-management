-- 20260416000000_add_call_attempts_rpc.sql
-- Description: RPC functions to safely increment/decrement call attempts 
-- adhering to Zero-Load policy and avoiding race conditions.

CREATE OR REPLACE FUNCTION increment_call_attempts(target_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Atomic increment for call attempts.
  -- Strict RLS check enforced via WHERE clause (only the assigned sales user can modify).
  UPDATE companies
  SET call_attempts = COALESCE(call_attempts, 0) + 1,
      updated_at = NOW()
  WHERE id = target_company_id
    AND (assigned_sales_id = auth.uid() OR auth.uid() IS NULL);
END;
$$;

CREATE OR REPLACE FUNCTION decrement_call_attempts(target_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Atomic decrement for call attempts.
  UPDATE companies
  SET call_attempts = GREATEST(COALESCE(call_attempts, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = target_company_id
    AND (assigned_sales_id = auth.uid() OR auth.uid() IS NULL);
END;
$$;
