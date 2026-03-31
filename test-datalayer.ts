import { getSupabase } from './src/lib/supabase';
import dataLayer from './src/lib/dataLayer';

async function testDataLayerUpdate() {
  const sb = getSupabase();
  if(!sb) return;
  
  const { data } = await sb.from('companies').select('id, contact_name, contact_phone').limit(1);
  if(!data || data.length === 0) return;
  const id = data[0].id;

  console.log("Original data:", data[0]);

  console.log("Calling dataLayer.companies.update...");
  await dataLayer.companies.update(id, {
    contactName: 'Updated Name ' + Date.now(),
    contactPhone: '010-5555-5555'
  });

  const { data: updated } = await sb.from('companies').select('id, contact_name, contact_phone').eq('id', id).single();
  console.log("Updated data:", updated);
}
testDataLayerUpdate();
