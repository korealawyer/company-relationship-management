const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const sbUrlMatch = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const sbKeyMatch = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
const serviceKeyMatch = envText.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const { createClient } = require('@supabase/supabase-js');
const url = sbUrlMatch ? sbUrlMatch[1].trim() : '';
const key = serviceKeyMatch ? serviceKeyMatch[1].trim() : (sbKeyMatch ? sbKeyMatch[1].trim() : '');

const supabase = createClient(url, key);

async function run() {
    console.log('Querying companies matching "test"...');
    const { data: nameData, error: nameError } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', '%test%');
        
    if (nameError) {
        console.error('Error fetching by name:', nameError.message);
        const { data: cNameData, error: cNameError } = await supabase
            .from('companies')
            .select('*')
            .ilike('company_name', '%test%');
        if (!cNameError) console.log('Results by company_name:', JSON.stringify(cNameData, null, 2));
    } else {
        console.log('Results by name:', JSON.stringify(nameData, null, 2));
    }
}
run();
