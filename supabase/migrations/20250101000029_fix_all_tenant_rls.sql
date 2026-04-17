-- ================================================================
-- Migration: 030_fix_all_tenant_rls
-- Purpose: Fix RLS Policies for tenant isolation (JWT parsing)
-- auth.jwt() stores custom claims inside user_metadata or app_metadata depending on sign in.
-- We must use (auth.jwt() -> 'user_metadata' ->> 'companyId')::uuid to get tenant_id.
-- ================================================================

-- cases
DROP POLICY IF EXISTS "tenant_isolation" ON cases;
CREATE POLICY "tenant_isolation" ON cases
  USING (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid)
  WITH CHECK (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid);

-- case_timeline
DROP POLICY IF EXISTS "tenant_isolation" ON case_timeline;
CREATE POLICY "tenant_isolation" ON case_timeline
  USING (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid)
  WITH CHECK (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid);

-- hearings
DROP POLICY IF EXISTS "tenant_isolation" ON hearings;
CREATE POLICY "tenant_isolation" ON hearings
  USING (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid)
  WITH CHECK (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid);

-- scheduled_alerts
DROP POLICY IF EXISTS "tenant_isolation" ON scheduled_alerts;
CREATE POLICY "tenant_isolation" ON scheduled_alerts
  USING (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid)
  WITH CHECK (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid);

-- notification_logs
DROP POLICY IF EXISTS "tenant_isolation" ON notification_logs;
CREATE POLICY "tenant_isolation" ON notification_logs
  USING (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid)
  WITH CHECK (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid);

-- documents
DROP POLICY IF EXISTS "tenant_isolation" ON documents;
CREATE POLICY "tenant_isolation" ON documents
  USING (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid)
  WITH CHECK (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid);

-- document_comments
DROP POLICY IF EXISTS "tenant_isolation" ON document_comments;
CREATE POLICY "tenant_isolation" ON document_comments
  USING (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid)
  WITH CHECK (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid);

-- document_approvals
DROP POLICY IF EXISTS "tenant_isolation" ON document_approvals;
CREATE POLICY "tenant_isolation" ON document_approvals
  USING (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid)
  WITH CHECK (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid);

-- document_requests
DROP POLICY IF EXISTS "tenant_isolation" ON document_requests;
CREATE POLICY "tenant_isolation" ON document_requests
  USING (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid)
  WITH CHECK (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid);

-- automation_logs
DROP POLICY IF EXISTS "tenant_isolation" ON automation_logs;
CREATE POLICY "tenant_isolation" ON automation_logs
  USING (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid)
  WITH CHECK (tenant_id = COALESCE(nullif(auth.jwt() -> 'user_metadata' ->> 'companyId', ''), nullif(auth.jwt() -> 'user_metadata' ->> 'company_id', ''))::uuid);
