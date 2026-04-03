import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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
        "customDraft": "【제3자 제공 현황】",
        "lawyerNote": "개인정보보호법 제17조 제1항은...",
        "reviewChecked": true,
        "aiDraftGenerated": true
        }
    ];
        
    const {data: allCompanies, error: uErr} = await s.from('companies').select('*').eq('id', 'c1');
    if (allCompanies && allCompanies.length === 0) {
        console.log("Creating c1 company...");
        const res = await s.from('companies').insert({
            id: 'c1',
            name: '(주)놀부NBG',
            biz_no: '1234567890',
            status: 'lawyer_confirmed',
            issues: issues,
            lawyerConfirmed: true,
            riskScore: 85
        });
        console.log("Created c1", res);
    } else {
        await s.from('companies').update({
            issues: issues,
            lawyerConfirmed: true,
            status: 'lawyer_confirmed'
        }).eq('id', 'c1');
        console.log("Updated c1");
    }
}
main();
