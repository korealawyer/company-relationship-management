const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('companies').select('id, name, audit_report').eq('id', '78a9d693-ba99-4145-a328-4720e94b3122').single();
  console.log('Result:', data);
  if (!data?.audit_report) {
    console.log('No audit_report found!');
  }
}
check();
