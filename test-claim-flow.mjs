import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    // 1. Pick a company
    const { data: companies } = await s.from('companies').select('id, name').limit(1);
    const company = companies[0];
    console.log("Picked company:", company.name, company.id);

    // 2. Call claim API
    const res = await fetch('http://localhost:3000/api/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            claimId: company.id,
            bizNum: '8888888888',
            password: 'Password123!',
            agreeMarketing: true
        })
    });
    const claimRes = await res.json();
    console.log("Claim Response:", claimRes);

    if (claimRes.success) {
        // 3. Try login
        const { data: loginData, error: loginErr } = await s.auth.signInWithPassword({
            email: '8888888888@client.ibsbase.com',
            password: 'Password123!'
        });
        if (loginErr) {
            console.error("Login failed:", loginErr);
        } else {
            console.log("Login Success! User metadata companyId:", loginData.user.user_metadata.companyId);
            console.log("Does it match?", loginData.user.user_metadata.companyId === company.id);
        }
    }
}
run();
