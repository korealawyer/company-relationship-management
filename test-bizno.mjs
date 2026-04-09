import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

async function run() {
  const { data: com, error: err2 } = await supabase.from('companies').select('id, name, biz_no').limit(100);
  console.log("Companies count:", com?.length);
  
  if (com) {
    const target = com.find(c => c.biz_no === '0123654789' || c.biz === '0123654789' || c.id === '0123654789');
    console.log("Found Company with 0123654789:", target);
  }
}
run();
