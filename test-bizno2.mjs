import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Find user by email containing 0123654789
  const { data: adminUsers } = await supabase.auth.admin.listUsers();
  if (adminUsers?.users) {
      const user = adminUsers.users.find(u => u.email?.includes('0123654789'));
      console.log('User found:', user?.email, 'Meta:', user?.user_metadata);
      
      if (user?.user_metadata?.companyId) {
          const cid = user.user_metadata.companyId;
          const { data: c } = await supabase.from('companies').select('*').eq('id', cid).single();
          console.log('Their company in DB:', c?.id, c?.name, c?.biz_no);
      }
  } else {
      console.log("no admin access");
  }

  // Also query companies with biz_no like 0123654789
  const { data: c2 } = await supabase.from('companies').select('id, name, biz_no').like('biz_no', '%0123654789%');
  console.log('Companies matching biz_no:', c2);
}
run();
