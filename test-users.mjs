import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(url, key);

async function test() {
    const { data: u1, error: e1 } = await sb.from('users').select('id').limit(1);
    console.log('users:', u1, e1);
}
test();
