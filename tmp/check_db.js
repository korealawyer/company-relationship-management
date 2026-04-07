const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://maacmwyttetetxcweybd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYWNtd3l0dGV0ZXR4Y3dleWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1NDYwNywiZXhwIjoyMDg5MzMwNjA3fQ.b_Z76no4SBewqszae6ajiitT_2Krcx1Da480mWs6Nw8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: iData, error: iErr } = await supabase.from('issues').select('*').limit(1);
  if (iErr) console.error(iErr);
  else console.log("issues columns:", Object.keys(iData[0] || {}));

  const { data: cData, error: cErr } = await supabase.from('companies').select('*').limit(1);
  if (cErr) console.error(cErr);
  else console.log("companies columns:", Object.keys(cData[0] || {}));
}
check();
