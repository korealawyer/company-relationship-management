import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

let envPath = '.env.local';
if (!fs.existsSync(envPath)) {
    envPath = '.env';
}

dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local or .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching companies...");
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: true }); // Oldest first

  if (error) {
    console.error("Error fetching companies:", error);
    return;
  }

  // Group by name
  const byName = {};
  for (const c of companies) {
    // Some names might have "(주)" or spaces, we should trim, but strictly matching exactly what was uploaded is fine too.
    const name = c.name.trim();
    if (!byName[name]) byName[name] = [];
    byName[name].push(c);
  }

  let mergedCount = 0;
  let deletedCount = 0;

  for (const [name, list] of Object.entries(byName)) {
    if (list.length > 1) {
      console.log(`Found duplicate for '${name}': ${list.length} records`);
      // Sort by creation time just in case, though the SQL query did this.
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      const primary = list[0];
      const duplicates = list.slice(1);
      
      let updates = {};
      
      duplicates.forEach(dup => {
        // Add new privacy fields to Updates if the primary doesn't have them
        if (dup.privacy_url && !primary.privacy_url) {
          updates.privacy_url = dup.privacy_url;
          primary.privacy_url = dup.privacy_url; // Update in-memory for subsequent checks
        }
        if (dup.privacy_policy_text && !primary.privacy_policy_text) {
          updates.privacy_policy_text = dup.privacy_policy_text;
          primary.privacy_policy_text = dup.privacy_policy_text;
        }
      });

      if (Object.keys(updates).length > 0) {
        console.log(`  Updating primary ${primary.id} with new privacy info...`);
        const { error: updateErr } = await supabase.from('companies').update(updates).eq('id', primary.id);
        if (updateErr) {
            console.error("  Update Error:", updateErr);
            continue;
        }
        mergedCount++;
      } else {
        console.log(`  No new privacy info to merge for primary ${primary.id}.`);
      }

      // Delete the duplicate records
      for (const dup of duplicates) {
        console.log(`  Deleting duplicate ${dup.id} (created at ${dup.created_at})`);
        const { error: delErr } = await supabase.from('companies').delete().eq('id', dup.id);
        if (delErr) {
            console.error("  Delete Error:", delErr);
        } else {
            deletedCount++;
        }
      }
    }
  }

  console.log(`\nFinished DB cleanup!`);
  console.log(`Updated ${mergedCount} primary records with new data.`);
  console.log(`Deleted ${deletedCount} duplicate records.`);
}

run();
