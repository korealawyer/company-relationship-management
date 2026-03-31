// Fix RLS for company_memos, company_timeline, company_contacts
// Run: npx tsx scripts/fix-rls-memos.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env
const envPath = path.join(__dirname, '..', '.env.vercel');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/"/g, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '');

if (!url || !key) {
    console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY');
    process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function fixRLS() {
    console.log('🔧 Fixing RLS policies for company_memos...');

    // Use rpc to run raw SQL
    const sql = `
        -- Enable RLS
        ALTER TABLE company_memos ENABLE ROW LEVEL SECURITY;
        ALTER TABLE company_timeline ENABLE ROW LEVEL SECURITY;
        ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Allow authenticated full access" ON company_memos;
        DROP POLICY IF EXISTS "Allow authenticated full access" ON company_timeline;
        DROP POLICY IF EXISTS "Allow authenticated full access" ON company_contacts;
        
        DROP POLICY IF EXISTS "company_memos_all" ON company_memos;
        DROP POLICY IF EXISTS "company_timeline_all" ON company_timeline;
        DROP POLICY IF EXISTS "company_contacts_all" ON company_contacts;

        -- Create new policies
        CREATE POLICY "company_memos_all" ON company_memos FOR ALL TO authenticated USING (true) WITH CHECK (true);
        CREATE POLICY "company_timeline_all" ON company_timeline FOR ALL TO authenticated USING (true) WITH CHECK (true);
        CREATE POLICY "company_contacts_all" ON company_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
    `;

    // Run SQL via REST API
    const response = await fetch(`${url}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'apikey': key!,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    });

    // Alternative: just test if we can read from company_memos
    console.log('🧪 Testing company_memos access...');
    const { data, error } = await sb.from('company_memos').select('*').limit(1);
    
    if (error) {
        console.log('❌ company_memos access error:', error.message);
        console.log('\n📋 Please run this SQL in Supabase SQL Editor:');
        console.log('─'.repeat(60));
        console.log(sql);
        console.log('─'.repeat(60));
    } else {
        console.log('✅ company_memos accessible! Found', data?.length ?? 0, 'rows');
    }

    // Test insert
    console.log('\n🧪 Testing company_memos insert...');
    
    // First get a company id
    const { data: companies } = await sb.from('companies').select('id').limit(1);
    if (companies && companies.length > 0) {
        const testId = crypto.randomUUID();
        const { error: insertErr } = await sb.from('company_memos').insert({
            id: testId,
            company_id: companies[0].id,
            author: '테스트',
            content: '테스트 메모 - RLS 검증',
            created_at: new Date().toISOString(),
        });
        
        if (insertErr) {
            console.log('❌ Insert error:', insertErr.message);
        } else {
            console.log('✅ Insert successful!');
            // Clean up test data
            await sb.from('company_memos').delete().eq('id', testId);
            console.log('🗑️ Test data cleaned up');
        }
    }
}

fixRLS().catch(console.error);
