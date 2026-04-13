import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://maacmwyttetetxcweybd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYWNtd3l0dGV0ZXR4Y3dleWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1NDYwNywiZXhwIjoyMDg5MzMwNjA3fQ.b_Z76no4SBewqszae6ajiitT_2Krcx1Da480mWs6Nw8');

async function run() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // start of today
  const todayStr = today.toISOString();
  
  // First, let's find the user 김유라 to get her user ID
  const { data: users, error: userError } = await supabase.from('users').select('*').eq('full_name', '김유라');
  console.log('Users:', users);
  
  // Check the recent logs or call updates
  // Typically, a table like call_logs, or companies history might exist.
  // Let's also check the schema tables.
  const { data: cols } = await supabase.rpc('get_tables'); // Or just query some assumed tables
  
  // Find all tables that might be relevant
  // For now, let's just query `companies` where updated_at >= today, updated_by or assigned_to = '김유라'
  // Let's see what columns `companies` has by fetching 1 row
  const { data: companySample } = await supabase.from('companies').select('*').limit(1);
  console.log('Company sample:', companySample);
  
  const { data: calls } = await supabase.from('call_logs').select('*').limit(1);
  console.log('Call logs sample:', calls);
}

run();
