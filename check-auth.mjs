import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); // Need service role to list users

async function run() {
    const { data: { users }, error } = await s.auth.admin.listUsers();
    
    if (error) {
        console.error("Error listing users:", error);
        return;
    }

    const testUsers = users.filter(u => u.email && u.email.includes('123456789'));
    console.log("Test Users found:");
    testUsers.forEach(u => console.log(u.email, u.user_metadata));
}
run();
