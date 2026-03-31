// Fix RLS for company_memos via Supabase PostgREST
// Run: npx tsx scripts/fix-rls-direct.ts

const url = 'https://maacmwyttetetxcweybd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYWNtd3l0dGV0ZXR4Y3dleWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1NDYwNywiZXhwIjoyMDg5MzMwNjA3fQ.b_Z76no4SBewqszae6ajiitT_2Krcx1Da480mWs6Nw8';

async function main() {
    // 1. Test SELECT with service role key
    console.log('🧪 [1] Testing SELECT from company_memos with service_role key...');
    const selectRes = await fetch(`${url}/rest/v1/company_memos?select=*&limit=3`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
        }
    });
    console.log('   Status:', selectRes.status, selectRes.statusText);
    const selectData = await selectRes.json();
    console.log('   Data:', JSON.stringify(selectData).slice(0, 200));

    // 2. Get a company ID for testing
    console.log('\n🧪 [2] Getting a company ID...');
    const compRes = await fetch(`${url}/rest/v1/companies?select=id&limit=1`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
        }
    });
    const compData = await compRes.json();
    console.log('   Company:', JSON.stringify(compData));
    
    if (!compData || compData.length === 0) {
        console.log('❌ No companies found.');
        return;
    }
    const companyId = compData[0].id;

    // 3. Test INSERT
    console.log('\n🧪 [3] Testing INSERT into company_memos...');
    const testId = crypto.randomUUID();
    const insertRes = await fetch(`${url}/rest/v1/company_memos`, {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        },
        body: JSON.stringify({
            id: testId,
            company_id: companyId,
            author: '시스템',
            content: 'RLS 테스트 메모',
            created_at: new Date().toISOString(),
        }),
    });
    console.log('   Status:', insertRes.status, insertRes.statusText);
    const insertData = await insertRes.json();
    console.log('   Result:', JSON.stringify(insertData).slice(0, 200));

    if (insertRes.ok) {
        // Clean up
        console.log('   ✅ INSERT succeeded! Cleaning up...');
        await fetch(`${url}/rest/v1/company_memos?id=eq.${testId}`, {
            method: 'DELETE',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
            },
        });
        console.log('   🗑️ Cleaned up.');
    }

    // 4. Now test with anon key behavior (the real problem)
    console.log('\n📋 NOTE: If service_role works but frontend fails,');
    console.log('   the issue is RLS blocking authenticated users.');
    console.log('   Run this SQL in Supabase Dashboard > SQL Editor:');
    console.log('   ────────────────────────────────────────');
    console.log(`   DROP POLICY IF EXISTS "company_memos_all" ON company_memos;`);
    console.log(`   CREATE POLICY "company_memos_all" ON company_memos FOR ALL TO authenticated USING (true) WITH CHECK (true);`);
    console.log('   ────────────────────────────────────────');
}

main().catch(console.error);
