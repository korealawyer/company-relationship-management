import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data: companies } = await s.from('companies').select('*').eq('biz_no', '1234567890');
    console.log("Found companies with biz_no 1234567890:", companies.map(c => ({ id: c.id, name: c.name, lawyer_confirmed: c.lawyer_confirmed, biz_no: c.biz_no })));

    if (companies.length > 0) {
        for (const c of companies) {
             const { data: issues } = await s.from('issues').select('*').eq('company_id', c.id);
             console.log(`Issues for ${c.name} (${c.id}):`, issues.length, "issues found");
        }
    }
}
run();
