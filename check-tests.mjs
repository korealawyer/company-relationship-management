import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data: companies } = await s.from('companies').select('id, name, biz_no, issue_count');
    const testComps = companies.filter(c => c.name.toLowerCase().includes('test'));
    
    for (const targetComp of testComps) {
        console.log(`\nCompany: ${targetComp.name} (ID: ${targetComp.id}, biz_no: ${targetComp.biz_no}, issue_count: ${targetComp.issue_count})`);
        const { data: issues } = await s.from('issues').select('*').eq('company_id', targetComp.id);
        console.log(`  => Found ${issues.length} issues in DB`);
        if (issues.length > 0) {
            console.log(`  => Example issue title: ${issues[0].title}`);
        }
    }
}
run();
