const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: companies, error: err1 } = await supabase.from('companies').select('*').ilike('name', '%test%');
  console.log("Companies:", companies);

  if (companies && companies.length > 0) {
    for (const comp of companies) {
      const { data: issues, error: err2 } = await supabase.from('issues').select('*').eq('company_id', comp.id);
      console.log(`Issues for ${comp.name} (id: ${comp.id}):`, issues);
    }
  }
}
run();
