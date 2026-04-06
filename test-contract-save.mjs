import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseOperatons() {
    console.log("--- 시작: 데이터 저장 테스트 ---");
    
    // 1. 테스트용 회사 가져오기
    const { data: companies, error: compErr } = await supabase.from('companies').select('*').limit(1);
    
    if (compErr || !companies || companies.length === 0) {
        console.error("회사를 조회할 수 없습니다.", compErr);
        return;
    }
    
    const company = companies[0];
    console.log(`[1] 테스트 대상 회사 조회됨: ${company.name} (ID: ${company.id}, Status: ${company.status})`);

    // 2. 회사 상태를 'contract_signed'로 변경
    const { error: updateErr } = await supabase.from('companies').update({
        status: 'contract_signed',
        contract_signed_at: new Date().toISOString()
    }).eq('id', company.id);

    if (updateErr) {
        console.error("[2] 회사 상태 변경 실패:", updateErr);
    } else {
        console.log(`[2] 회사 상태를 'contract_signed'(계약서 서명 완료)로 업데이트 성공`);
    }

    // 3. 계약서 저장
    const contractId = crypto.randomUUID();
    const { error: contractErr } = await supabase.from('contracts').insert([{
        id: contractId,
        title: '법률자문 계약 (Pro 플랜) - 시스템 테스트용',
        template: '자문 계약서',
        party_a_name: 'test_ibs',
        party_a_signed: true,
        party_b_name: company.name,
        party_b_email: 'test@example.com',
        party_b_signed: true,
        status: 'both_signed',
        content: '계약서 본문 데이터 테스트...'
    }]);

    if (contractErr) {
        console.error("[3] 계약서 데이터 저장 실패 (Schema 불일치 등):", contractErr);
    } else {
        console.log(`[3] 계약서 데이터 저장 성공 (Contract ID: ${contractId})`);
    }

    // 4. 저장 검증
    const { data: savedContract } = await supabase.from('contracts').select('id, title, status').eq('id', contractId).single();
    const { data: updatedCompany } = await supabase.from('companies').select('id, status, contractSignedAt').eq('id', company.id).single();

    console.log("\n--- 최종 DB 저장 확인 결과 ---");
    console.log("Company 최종 상태:", updatedCompany?.status);
    console.log("Contract 조회 결과:", savedContract?.title, "- 상태:", savedContract?.status);
    
    // 5. 테스트용 계약서 삭제 (안전)
    await supabase.from('contracts').delete().eq('id', contractId);
    console.log("[5] 테스트용 계약서 데이터 삭제(정리) 완료");
}

testDatabaseOperatons();
