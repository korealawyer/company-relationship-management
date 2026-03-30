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

const mockCompanies = [
  {
    name: '아이비에스전자(주)',
    biz_no: '123-45-67890',
    biz_category: '제조업',
    domain: 'ibselectronics.co.kr',
    contact_name: '김영업대표',
    contact_phone: '010-1234-5678',
    status: 'analyzed',
    risk_score: 85,
    risk_level: 'HIGH',
    call_attempts: 0
  },
  {
    name: '미래IT서비스',
    biz_no: '234-56-78901',
    biz_category: '정보통신업',
    domain: 'miraeit.com',
    contact_name: '이정보팀장',
    contact_phone: '010-2345-6789',
    status: 'lawyer_confirmed',
    risk_score: 60,
    risk_level: 'MEDIUM',
    call_attempts: 1,
    last_call_result: 'no_answer',
    last_call_at: new Date().toISOString()
  },
  {
    name: '대박프랜차이즈',
    biz_no: '345-67-89012',
    biz_category: '도소매업',
    domain: 'daebakfc.co.kr',
    contact_name: '박가맹대표',
    contact_phone: '010-3456-7890',
    status: 'emailed',
    risk_score: 90,
    risk_level: 'HIGH',
    call_attempts: 2,
    last_call_result: 'callback',
    last_call_at: new Date().toISOString()
  },
  {
    name: '신진무역상사',
    biz_no: '456-78-90123',
    biz_category: '도매 및 소매업',
    domain: 'shinjintrade.com',
    contact_name: '최무역실장',
    contact_phone: '010-4567-8901',
    status: 'client_replied',
    risk_score: 40,
    risk_level: 'LOW',
    call_attempts: 1,
    last_call_result: 'connected',
    last_call_at: new Date().toISOString()
  },
  {
    name: '(주)혁신건설',
    biz_no: '567-89-01234',
    biz_category: '건설업',
    domain: 'innovbuild.com',
    contact_name: '정혁신소장',
    contact_phone: '010-5678-9012',
    status: 'client_viewed',
    risk_score: 75,
    risk_level: 'HIGH',
    call_attempts: 0
  }
];

async function seed() {
  console.log('Seeding telemarketing data...');
  const rows = mockCompanies.map(c => ({
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...c
  }));

  const { data, error } = await supabase.from('companies').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
  
  if (error) {
    console.error('Error inserting mock data:', error);
  } else {
    console.log('Successfully inserted mock telemarketing records.');
  }
}

seed();
