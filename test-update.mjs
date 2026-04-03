import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path:'.env.local'});
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function main() {
    const {data: user, error: uErr} = await s.from('companies').select('*').eq('biz_no', '1234567890');
    console.log("Found user length:", user?.length);
    if (user && user.length > 0) {
        console.log("User company id:", user[0].id);
        console.log("Issues length:", user[0].issues?.length);
        console.log("lawyerConfirmed:", user[0].lawyerConfirmed);
    }
    if (uErr) console.error(uErr);
}
main();
