import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const url = 'http://localhost:3000/api/analyze';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://maacmwyttetetxcweybd.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYWNtd3l0dGV0ZXR4Y3dleWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTQ2MDcsImV4cCI6MjA4OTMzMDYwN30.qvHCQZpk-k5fDFJh_mEiv-tmtJc5LXBYg_mEIXnWloE';

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'info@ibslaw.co.kr',
        password: 'password123'
    });
    
    if (error) { 
        console.error('Login Error:', error); 
        return; 
    }
    
    const cookie = `sb-maacmwyttetetxcweybd-auth-token=${JSON.stringify([data.session.access_token, data.session.refresh_token, null, null, null])}; Path=/`;
    
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie
        },
        body: JSON.stringify({ manualText: '이 사이트는 회원의 개인정보를 보호합니다.', model: 'gpt-4o' })
    });
    
    console.log('Status:', res.status);
    console.log(await res.text());
})();
