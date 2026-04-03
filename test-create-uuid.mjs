import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
dotenv.config({path:'.env.local'});
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function main() {
    const issues = [
        {
        "level": "HIGH",
        "law": "개인정보보호법 제17조",
        "title": "제3자 제공 시 선택동의 위반",
        "originalText": "제 4조 (개인정보의 제3자 제공)",
        "riskDesc": "개인정보보호법 제17조(개인정보의 제공) 위반 혐의",
        "customDraft": "【제3자 제공 현황】\n| 제공받는 자 | 제공 목적 | 제공 항목 | 보유기간 |\n|---|---|---|---|\n| (주)KG이니시스 | 결제 처리 | 이름, 카드정보 | 결제 완료 후 5년 |",
        "lawyerNote": "개인정보보호법 제17조 제1항 지적사항입니다.",
        "reviewChecked": true,
        "aiDraftGenerated": true
        }
    ];
        
    const {data: allCompanies, error: uErr} = await s.from('companies').select('*').eq('biz_no', '1234567890');
    if (allCompanies && allCompanies.length === 0) {
        console.log("Creating new company with biz_no 1234567890...");
        const newId = uuidv4();
        const res = await s.from('companies').insert({
            id: newId,
            name: '(주)놀부NBG',
            biz_no: '1234567890',
            status: 'lawyer_confirmed',
            issues: issues,
            lawyerConfirmed: true,
            riskScore: 85
        });
        console.log("Created with ID:", newId);
    } else if (allCompanies && allCompanies.length > 0) {
        console.log("Company exists with ID:", allCompanies[0].id);
        const { error: patchErr } = await s.from('companies').update({
            issues: issues,
            lawyerConfirmed: true,
            status: 'lawyer_confirmed'
        }).eq('id', allCompanies[0].id);
        console.log("Updated existing");
    }
}
main();
