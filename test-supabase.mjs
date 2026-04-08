import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const sb = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  const from = 0;
  const to = 49;
  let query = sb.from('companies').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
  
  console.log("Fetching paginated companies...");
  const res = await query;
  console.log("Error:", res.error);
  console.log("Data length:", res.data?.length);
  console.log("Count:", res.count);
  
  console.log("\nFetching stats...");
  const statsRes = await sb.from('companies').select('id, plan, risk_score, store_count, status');
  console.log("Stats Error:", statsRes.error);
  console.log("Stats Rows length:", statsRes.data?.length);
}

testFetch();
