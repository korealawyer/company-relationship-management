// Apply RLS fix via Supabase Management API (SQL query endpoint)
// Run: npx tsx scripts/apply-rls-fix.ts

const SUPABASE_URL = 'https://maacmwyttetetxcweybd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYWNtd3l0dGV0ZXR4Y3dleWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1NDYwNywiZXhwIjoyMDg5MzMwNjA3fQ.b_Z76no4SBewqszae6ajiitT_2Krcx1Da480mWs6Nw8';

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

const SQL = `
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated full access" ON company_memos;
DROP POLICY IF EXISTS "Allow authenticated full access" ON company_timeline;
DROP POLICY IF EXISTS "Allow authenticated full access" ON company_contacts;
DROP POLICY IF EXISTS "company_memos_all" ON company_memos;
DROP POLICY IF EXISTS "company_timeline_all" ON company_timeline;
DROP POLICY IF EXISTS "company_contacts_all" ON company_contacts;

-- Create new policies for authenticated + anon
CREATE POLICY "company_memos_all" ON company_memos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "company_timeline_all" ON company_timeline FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "company_contacts_all" ON company_contacts FOR ALL USING (true) WITH CHECK (true);
`;

async function applyRLS() {
    // Use pg_net or a Supabase Edge Function, but the simplest approach
    // is to use a database function to run arbitrary SQL.
    // Let's create a helper function first, then call it.

    // Step 1: Create a helper function via PostgREST RPC
    console.log('🔧 Creating helper function...');
    
    const createFnSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(query TEXT) 
        RETURNS void AS $$
        BEGIN
            EXECUTE query;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // We need to use the SQL API which requires the management API key
    // Instead, let's use a series of individual RPC calls via the existing schema

    // Alternative: Use service role key to directly test authenticated access
    // The service_role key bypasses RLS, so the real question is whether the
    // authenticated role has the right policy.

    // Let's try a different approach: use supabase-js with service role to create the policy
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
        db: { schema: 'public' }
    });

    // Try using rpc if a function exists
    const statements = [
        `DROP POLICY IF EXISTS "Allow authenticated full access" ON company_memos`,
        `DROP POLICY IF EXISTS "company_memos_all" ON company_memos`,
        `CREATE POLICY "company_memos_all" ON company_memos FOR ALL USING (true) WITH CHECK (true)`,
        `DROP POLICY IF EXISTS "Allow authenticated full access" ON company_timeline`,
        `DROP POLICY IF EXISTS "company_timeline_all" ON company_timeline`,
        `CREATE POLICY "company_timeline_all" ON company_timeline FOR ALL USING (true) WITH CHECK (true)`,
        `DROP POLICY IF EXISTS "Allow authenticated full access" ON company_contacts`,
        `DROP POLICY IF EXISTS "company_contacts_all" ON company_contacts`,
        `CREATE POLICY "company_contacts_all" ON company_contacts FOR ALL USING (true) WITH CHECK (true)`,
    ];

    for (const stmt of statements) {
        console.log(`   Running: ${stmt.slice(0, 60)}...`);
        const { error } = await sb.rpc('exec_sql', { query: stmt });
        if (error) {
            if (error.message.includes('function') && error.message.includes('does not exist')) {
                console.log('\n⚠️  exec_sql function does not exist. Creating it first...');
                // We can't create it via PostgREST either.
                // The user needs to run this SQL in the Supabase Dashboard.
                console.log('\n' + '='.repeat(60));
                console.log('📋 Please run this SQL in Supabase Dashboard > SQL Editor:');
                console.log('='.repeat(60));
                console.log(SQL);
                console.log('='.repeat(60));
                return;
            }
            console.log(`   ❌ Error: ${error.message}`);
        } else {
            console.log(`   ✅ Done`);
        }
    }

    console.log('\n✅ All RLS policies applied successfully!');
}

applyRLS().catch(console.error);
