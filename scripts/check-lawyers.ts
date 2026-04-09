import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: lawyers, error: lErr } = await supabase.from('lawyers').select('*');
  console.log("=== LAWYERS ===");
  console.log(JSON.stringify(lawyers, null, 2));

  const { data: comp, error: cErr } = await supabase.from('companies').select('id, name, assigned_lawyer_id').limit(5);
  console.log("=== COMPANIES ===");
  console.log(JSON.stringify(comp, null, 2));
}
run();
