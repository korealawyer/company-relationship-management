const fs = require('fs');

const files = [
  'src/hooks/useDataLayer.ts',
  'src/components/sales/call/InlinePanel.tsx',
  'src/components/sales/call/MemoTab.tsx',
  'src/components/crm/SalesDashboard.tsx',
  'src/app/api/email/route.ts',
  'src/app/api/auth/claim/route.ts',
  'src/app/(marketing)/privacy-report/result/page.tsx',
  'src/app/(admin)/sales-queue/page.tsx',
  'src/app/(admin)/admin/email-preview/page.tsx',
  'src/app/(admin)/admin/clients/page.tsx',
  'src/app/(admin)/lawyer/privacy-review/page.tsx',
  'src/app/(admin)/sales/voice-memo/_utils/useRecording.ts'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/from '@\/lib\/stores'/g, "from '@/lib/supabaseStore'");
    fs.writeFileSync(f, c, 'utf8');
  }
});
console.log('Fixed imports!');
