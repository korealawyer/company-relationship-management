import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const mockCompany = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    name: '가상구독기업(주) - 테스트',
    email: 'contact@testunicorn.co.kr',
    phone: '02-1234-5678',
    store_count: 5,
    plan: 'premium',
    status: 'subscribed',
    risk_level: 'LOW',
    biz_no: '111-22-33333',
    biz_category: '소프트웨어 자문, 개발 및 공급'
};

async function seed() {
    console.log('Inserting 1 mock subscribed company into Supabase...');
    const { data, error } = await supabase.from('companies').insert(mockCompany);
    
    if (error) {
        console.error('Error inserting mock data:', error);
    } else {
        console.log('✅ Successfully inserted 1 subscribed fake company: (주)테스트유니콘');
    }
}

seed();
