import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import crypto from 'crypto';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing credentials");
  process.exit(1);
}

const sb = createClient(url, key);

async function check() {
  console.log("Logging in as sales@ibslaw.kr...");
  const { data: authData, error: authErr } = await sb.auth.signInWithPassword({
    email: 'sales@ibslaw.kr',
    password: 'sales123'
  });

  if (authErr) {
    console.error("Login failed:", authErr.message);
    return;
  }
  console.log("Logged in! User ID:", authData.user.id);
  
  const validUUID = crypto.randomUUID();
  const validCompanyUUID = crypto.randomUUID(); // This will fail FK constraint, but let's see which error we get

  console.log("Attempting valid UUID insert...");
  const { error: insertErr } = await sb.from('company_memos').insert({
    id: validUUID,
    company_id: validCompanyUUID,
    author: "system",
    content: "test",
    created_at: new Date().toISOString()
  });

  console.log("Memos INSERT result error:", insertErr);
}

check();
