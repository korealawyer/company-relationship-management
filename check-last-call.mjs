import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.from('companies').select('id, status, last_call_result').in('last_call_result', ['rejected', 'invalid_site']);
    if (error) {
        console.error(error);
        return;
    }
    
    let count = 0;
    for (const c of data) {
        if (c.status !== c.last_call_result) {
            const { error: updErr } = await supabase.from('companies').update({ status: c.last_call_result }).eq('id', c.id);
            if (!updErr) count++;
        }
    }
    console.log(`Updated ${count} records successfully.`);
}
main();
