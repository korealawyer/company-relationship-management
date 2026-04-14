const fs = require('fs');

const files = [
  'src/app/(admin)/admin/clients/page.tsx',
  'src/app/(admin)/sales/voice-memo/_utils/useRecording.ts',
  'src/components/sales/call/MemoTab.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/import\('@\/lib\/stores'\)/g, "import('@/lib/supabaseStore')");
    // fix the implicit any for full
    c = c.replace(/\.then\((full) => {/g, ".then((full: any) => {");
    fs.writeFileSync(f, c, 'utf8');
  }
});
console.log('Fixed dynamic imports!');
