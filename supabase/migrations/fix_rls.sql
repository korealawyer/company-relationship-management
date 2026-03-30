-- Fix RLS Policies for nested company data tables

-- 1) Enable RLS on the tables just in case they aren't
ALTER TABLE company_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

-- 2) Drop any existing broken policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated full access" ON company_memos;
DROP POLICY IF EXISTS "Allow authenticated full access" ON company_timeline;
DROP POLICY IF EXISTS "Allow authenticated full access" ON company_contacts;

-- 3) Create explicit full access policies for authenticated users
CREATE POLICY "Allow authenticated full access" 
ON company_memos 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated full access" 
ON company_timeline 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated full access" 
ON company_contacts 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);
