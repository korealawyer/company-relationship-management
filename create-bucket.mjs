import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking if 'documents' bucket exists...");
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
      console.error("Error listing buckets:", listError);
      return;
  }
  
  const docsBucket = buckets.find(b => b.name === 'documents');
  if (docsBucket) {
      console.log("'documents' bucket already exists. Setting it to public just in case...");
      const { data, error } = await supabase.storage.updateBucket('documents', {
          public: true,
          allowedMimeTypes: null,
          fileSizeLimit: 52428800 // 50MB
      });
      console.log("Update result:", data, error);
  } else {
      console.log("Creating 'documents' bucket...");
      const { data, error } = await supabase.storage.createBucket('documents', {
        public: true,
        allowedMimeTypes: null,
        fileSizeLimit: 52428800 // 50MB
      });
      console.log("Create result:", data, error);
  }
}

main();
