import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import crypto from 'crypto';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  process.exit(1);
}

const sb = createClient(url, key);
const adminSb = createClient(url, serviceKey!);

async function check() {
  await sb.auth.signInWithPassword({
    email: 'admin@ibslaw.kr',
    password: 'admin123'
  });

  console.log("Attempting valid UUID insert as ADMIN...");
  const { error: insertErr } = await sb.from('company_memos').insert({
    id: crypto.randomUUID(),
    company_id: crypto.randomUUID(),
    author: "system",
    content: "test",
    created_at: new Date().toISOString()
  });

  console.log("Memos INSERT result anon:", insertErr);
  
  // Try inserting with Service Key
  const { error: adminErr } = await adminSb.from('company_memos').insert({
    id: crypto.randomUUID(),
    company_id: crypto.randomUUID(), // invalid FK maybe?
    author: "system",
    content: "test",
  });
  
  console.log("Memos INSERT result Service Key:", adminErr);
}

check();
