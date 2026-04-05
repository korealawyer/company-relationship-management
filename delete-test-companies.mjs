import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// It is safer to use service role key for deletions, but NEXT_PUBLIC_SUPABASE_ANON_KEY might be all we have
// If NEXT_PUBLIC_SUPABASE_ANON_KEY doesn't work due to RLS, we'll need SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteTestCompanies() {
    let deletedCount = 0;
    while (true) {
        // Fetch test companies
        const { data: companies, error } = await supabase
            .from('companies')
            .select('id, name')
            .ilike('name', '%test%');

        if (error) {
            console.error("Error fetching companies:", error);
            return;
        }

        if (!companies || companies.length === 0) {
            console.log(`No more test companies found. Total deleted: ${deletedCount}`);
            break;
        }

        console.log(`Found ${companies.length} test companies to delete.`);

        for (const company of companies) {
            console.log(`Deleting ${company.name} (${company.id})...`);
            
            // Delete related records just to be safe, although cascade should handle it
            await supabase.from('issues').delete().eq('company_id', company.id);
            await supabase.from('company_contacts').delete().eq('company_id', company.id);
            await supabase.from('email_logs').delete().eq('company_id', company.id);
            
            // Delete company
            const { error: delError } = await supabase.from('companies').delete().eq('id', company.id);
            if (delError) {
                console.error(`Failed to delete ${company.name}:`, delError);
            } else {
                console.log(`Successfully deleted ${company.name}`);
                deletedCount++;
            }
        }
    }
}

deleteTestCompanies();
