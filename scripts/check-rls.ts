import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing credentials");
  process.exit(1);
}

const sb = createClient(url, key);

async function check() {
  console.log("Checking tables...");
  
  // Try to insert a dummy memo (we'll delete it right after)
  const dummyMemo = {
    id: "test-auth-memo",
    company_id: "test", // This might fail foreign key IF companies don't have "test"
    author: "system",
    content: "test",
    created_at: new Date().toISOString()
  };

  // First, let's just do a SELECT to see if table exists
  const { data: memoData, error: memoErr } = await sb.from('company_memos').select('*').limit(1);
  console.log("Memos SELECT result:", memoErr ? memoErr.message : "Success");

  const { data: tlData, error: tlErr } = await sb.from('company_timeline').select('*').limit(1);
  console.log("Timeline SELECT result:", tlErr ? tlErr.message : "Success");
}

check();
