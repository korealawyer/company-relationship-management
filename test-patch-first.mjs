import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path:'.env.local'});
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function main() {
    const {data: allCompanies, error: uErr} = await s.from('companies').select('*');
    if (allCompanies && allCompanies.length > 0) {
        const firstCompany = allCompanies[0];
        console.log("First company is:", firstCompany.name, firstCompany.id);
        
        const issues = [
          {
            "level": "HIGH",
            "law": "개인정보보호법 제17조",
            "title": "제3자 제공 시 선택동의 위반",
            "originalText": "제 4조 (개인정보의 제3자 제공)",
            "riskDesc": "개인정보보호법 제17조(개인정보의 제공) 위반 혐의",
            "customDraft": "【제3자 제공 현황】",
            "lawyerNote": "개인정보보호법 제17조 제1항은 웅앵웅",
            "reviewChecked": true,
            "aiDraftGenerated": true
          }
        ];

        // Patch the first company which is what the fallback uses
        await s.from('companies').update({
            issues: issues,
            lawyerConfirmed: true,
            status: 'lawyer_confirmed'
        }).eq('id', firstCompany.id);
        console.log("Patched first company");
    }
}
main();
