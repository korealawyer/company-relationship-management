import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data: companies } = await s.from('companies').select('id, name, biz_no, issue_count, created_at, updated_at').order('updated_at', { ascending: false }).limit(10);
    console.log("Recent Companies:", companies);
    
    for (const targetComp of companies) {
        if (targetComp.issue_count > 0) {
            const { data: issues } = await s.from('issues').select('*').eq('company_id', targetComp.id);
            console.log(`\nCompany: ${targetComp.name} (ID: ${targetComp.id}, biz_no: ${targetComp.biz_no}, issue_count: ${targetComp.issue_count})`);
            console.log(`  => Found ${issues.length} issues in DB`);
        }
    }
}
run();
