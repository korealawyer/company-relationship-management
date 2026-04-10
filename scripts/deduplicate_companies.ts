import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Set to true to actually perform deletions and updates
const EXECUTE_MERGE_AND_DELETE = false;

interface DuplicateGroup {
  key: string;
  records: any[];
}

async function run() {
  console.log("Fetching all companies...");
  let allCompanies: any[] = [];
  let from = 0;
  const size = 1000;
  
  while (true) {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .range(from, from + size - 1);

    if (error || !companies) {
      console.error("Error fetching companies:", error);
      return;
    }
    
    allCompanies = allCompanies.concat(companies);
    
    if (companies.length < size) {
      break;
    }
    from += size;
  }
  const companies = allCompanies;

  console.log(`Fetched ${companies.length} companies.`);

  // 1. Group companies
  const groups: Record<string, any[]> = {};
  for (const company of companies) {
    let key = '';
    const biz = company.biz?.trim();
    if (biz && biz !== '-' && biz !== '') {
      key = `BIZ_${biz}`;
    } else {
      // Fallback: name + domain or url
      const name = company.name?.trim().toLowerCase() || 'noname';
      const domain = company.domain?.trim().toLowerCase() || company.url?.trim().toLowerCase() || 'nodomain';
      key = `NAME_${name}_DOM_${domain}`;
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(company);
  }

  const results: any[] = [];
  let totalToDelete = 0;

  // 2. Process groups
  for (const [key, records] of Object.entries(groups)) {
    if (records.length <= 1) continue; // No duplicates in this group

    // Calculate score for each record to pick the master
    records.forEach(r => {
      let score = 0;
      if (r.assignedSalesId) score += 50;
      if (r.status && !['pending', 'invalid_site', ''].includes(r.status)) score += 40;
      if (r.callAttempts && r.callAttempts > 0) score += 30;
      if (r.lastCallAt) score += 20;
      
      const hasMemos = Array.isArray(r.memos) && r.memos.length > 0;
      const hasTimeline = Array.isArray(r.timeline) && r.timeline.length > 0;
      const hasContacts = Array.isArray(r.contacts) && r.contacts.length > 0;
      if (hasMemos || hasTimeline || hasContacts) score += 10;
      
      r._score = score;
    });

    // Sort by score DESC, then by updatedAt DESC
    records.sort((a, b) => {
      if (b._score !== a._score) {
        return b._score - a._score;
      }
      const dateA = new Date(a.updatedAt || 0).getTime();
      const dateB = new Date(b.updatedAt || 0).getTime();
      return dateB - dateA;
    });

    const master = records[0];
    const duplicates = records.slice(1);

    // Prepare merged data
    const mergedData: any = {};
    const mergedMemos = [...(master.memos || [])];
    const mergedTimeline = [...(master.timeline || [])];
    const mergedContacts = [...(master.contacts || [])];
    
    // Copy missing JSON array data
    let modified = false;

    // Optional: if master is missing some primary fields, bring them over from duplicates
    if (!master.assignedSalesId) {
      const dupWithSales = duplicates.find(d => d.assignedSalesId);
      if (dupWithSales) {
        mergedData.assignedSalesId = dupWithSales.assignedSalesId;
        mergedData.assignedSalesName = dupWithSales.assignedSalesName;
        modified = true;
      }
    }

    for (const dup of duplicates) {
      if (Array.isArray(dup.memos) && dup.memos.length > 0) {
        // avoid exact duplicate memo content if needed, but for simplicity pushing all
        mergedMemos.push(...dup.memos);
        modified = true;
      }
      if (Array.isArray(dup.timeline) && dup.timeline.length > 0) {
        mergedTimeline.push(...dup.timeline);
        modified = true;
      }
      if (Array.isArray(dup.contacts) && dup.contacts.length > 0) {
        // Only add contact if not exactly matched by email or phone
        dup.contacts.forEach((c: any) => {
          const exists = mergedContacts.some(mc => mc.email === c.email && mc.phone === c.phone);
          if (!exists) mergedContacts.push(c);
        });
        modified = true;
      }
    }

    if (modified) {
      mergedData.memos = mergedMemos;
      mergedData.timeline = mergedTimeline;
      mergedData.contacts = mergedContacts;
    }

    const toDeleteIds = duplicates.map(d => d.id);
    totalToDelete += toDeleteIds.length;

    results.push({
      groupKey: key,
      masterId: master.id,
      masterName: master.name,
      masterScore: master._score,
      duplicatesCount: duplicates.length,
      toDeleteIds: toDeleteIds,
      mergedDataUpdates: modified ? mergedData : "No updates to master needed"
    });

    // 3. Execution (if EXECUTE_MERGE_AND_DELETE is true)
    if (EXECUTE_MERGE_AND_DELETE) {
      if (modified) {
        console.log(`Updating master record ${master.id} in group ${key}...`);
        const { error: updateError } = await supabase
          .from('companies')
          .update(mergedData)
          .eq('id', master.id);
        if (updateError) {
          console.error(`Failed to update master ${master.id}:`, updateError);
        }
      }

      console.log(`Deleting ${toDeleteIds.length} duplicate records for group ${key}...`);
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .in('id', toDeleteIds);
      if (deleteError) {
        console.error(`Failed to delete duplicates for group ${key}:`, deleteError);
      }
    }
  }

  // 4. Output Report
  const reportPath = path.resolve(process.cwd(), 'dedup_dry_run_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    executionMode: EXECUTE_MERGE_AND_DELETE ? "LIVE (Data modified)" : "DRY RUN (No data modified)",
    totalCompaniesProcessed: companies.length,
    duplicateGroupsFound: results.length,
    totalRecordsToDelete: totalToDelete,
    groups: results
  }, null, 2));

  console.log('--- COMPLETED ---');
  console.log(`Found ${results.length} duplicate groups.`);
  console.log(`Total duplicate records ${EXECUTE_MERGE_AND_DELETE ? 'deleted' : 'to be deleted'}: ${totalToDelete}`);
  console.log(`Report generated at: ${reportPath}`);
}

run();
