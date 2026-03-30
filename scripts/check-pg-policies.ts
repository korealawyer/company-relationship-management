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
  const { data, error } = await sb.from('pg_policies').select('*').in('tablename', ['company_memos', 'company_timeline', 'companies']).limit(10);
  console.log("pg_policies query:", error || data);
}

check();
