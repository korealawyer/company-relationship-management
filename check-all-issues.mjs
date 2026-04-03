import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data: companies } = await s.from('companies').select('id, name, biz_no, issue_count');
    const targetComp = companies.find(c => c.name.toLowerCase() === 'test' || c.name.toLowerCase() === 'test2');
    console.log("Target Comp:", targetComp);

    if (targetComp) {
        const { data: issues } = await s.from('issues').select('*').eq('company_id', targetComp.id);
        console.log("Issues:", issues);
    }
}
run();
