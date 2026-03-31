import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.');
    process.exit(1);
}

// Service Role 클라이언트
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
    console.log('🌱 테스트용 계약서 데이터 삽입 시작...');
    
    const dummyContract = {
        title: '법률 자문 서비스 이용 계약서 (테스트용)',
        template: '기본 자문 계약서',
        party_a_name: 'IBS 법률사무소',
        party_a_signed: true,
        party_b_name: '테스트 고객',
        party_b_email: 'dhk@ibslaw.co.kr',
        party_b_signed: false,
        content: '본 계약은 갑(IBS)이 을(테스트 고객)에게 개인정보보호법 관련 법률 자문 및 처리방침 수정 업무를 위탁하고, 을이 이를 성실히 수행함에 있어 필요한 제반 사항을 규정함을 목적으로 한다.\n\n제1조 (자문 수수료)\n월 50만원 (VAT별도)\n\n제2조 (비밀유지)\n양 당사자는 엄격히 비밀을 유지한다.',
        status: 'waiting_other'
    };

    const { data, error } = await supabase
        .from('contracts')
        .insert(dummyContract)
        .select()
        .single();
        
    if (error) {
        console.error('❌ 계약서 생성 실패:', error.message);
        process.exit(1);
    }
    
    console.log('✅ 테스트 계약서 생성 성공!');
    console.log(`링크: http://localhost:3000/contracts/${data.id}`);
}

run().catch(console.error);
