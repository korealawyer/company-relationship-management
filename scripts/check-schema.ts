import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sb = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await sb.rpc('get_trigger_functions').select('*'); // or just insert a dummy to see error
  const res = await sb.from('consultations').insert([{ title: 'test' }]).select();
  console.log('Insert attempt:', res);

  const res2 = await sb.from('companies').insert([{ name: 'test company', biz_no: 'dummy_123' }]).select();
  console.log('Company insert attempt:', res2);

  if (res2.data) {
     const res3 = await sb.from('consultations').insert([{ company_id: res2.data[0].id, title: 'test2' }]).select();
     console.log('Consult insert attempt:', res3);
  }
}
check();
