import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: companies, error: fetchErr } = await sb.from('companies').select('id');
  if (fetchErr) return console.error(fetchErr);

  for (const c of companies) {
    const { data: issues } = await sb.from('issues').select('*').eq('company_id', c.id);
    if (!issues) continue;

    let riskScore = 0;
    let highCount = 0;
    let medCount = 0;

    issues.forEach(iss => {
      if (iss.level === 'HIGH') {
        riskScore += 30;
        highCount++;
      } else if (iss.level === 'MEDIUM') {
        riskScore += 15;
        medCount++;
      } else if (iss.level === 'LOW') {
        riskScore += 5;
      }
    });

    riskScore = Math.min(100, riskScore);

    let riskLevel = 'LOW';
    if (highCount > 0 || riskScore >= 70) riskLevel = 'HIGH';
    else if (medCount > 0 || riskScore >= 40) riskLevel = 'MEDIUM';

    // update
    const { error: updateErr } = await sb.from('companies').update({
      risk_score: riskScore,
      risk_level: riskLevel,
      issue_count: issues.length
    }).eq('id', c.id);

    if (updateErr) {
      console.error(`Error updating ${c.id}:`, updateErr);
    } else {
      console.log(`Updated ${c.id} - issues: ${issues.length}, score: ${riskScore}, level: ${riskLevel}`);
    }
  }
}

main().catch(console.error);
