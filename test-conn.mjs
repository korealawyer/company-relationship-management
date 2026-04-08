import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  console.log("1. Checking DB Read Access...");
  const t1 = Date.now();
  const { data, error } = await supabase.from('companies').select('id').limit(1);
  if (error) {
    console.error("DB Error:", error.message || error);
  } else {
    console.log(`DB Read OK in ${Date.now() - t1}ms. Returns rows: ${data?.length}`);
  }

  console.log("\n2. Checking Auth Server status...");
  const authRes = await supabase.auth.signInWithPassword({
    email: 'test_dummy_user@ibslaw.kr',
    password: 'dummy_password' 
  });
  console.log("Auth Error Message:", authRes.error ? authRes.error.message : 'Success');
  
  if (authRes.error && authRes.error.message.includes("Database read-only")) {
    console.log("CRITICAL: Database is in read-only mode!");
  } else if (authRes.error && authRes.error.message.includes("Invalid login")) {
    console.log("Auth server is UP and responding normally.");
  }
}

check();
