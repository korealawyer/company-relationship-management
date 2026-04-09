const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
// load .env.local without dotenvx
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('lawyers')
    .upsert({ 
      id: '3', 
      name: '임시 변호사',
      department: '기업자문팀',
      title: '파트너 변호사',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  fs.writeFileSync('test-db-output.json', JSON.stringify({ data, error }, null, 2));
}
test();
