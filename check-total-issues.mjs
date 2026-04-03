import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data: issues, error } = await s.from('issues').select('*');
    if (error) console.error("Error fetching issues:", error);
    else console.log(`Total issues in DB: ${issues.length}`);
}
run();
