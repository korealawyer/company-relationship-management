const fs = require('fs');

const routes = [
  { p: 'src/app/api/zoom/create/route.ts', param: 'req' },
  { p: 'src/app/api/zoom/available-slots/route.ts', param: 'req' },
  { p: 'src/app/api/track/route.ts', param: 'req' },
  { p: 'src/app/api/superlawyer/generate-hwpx/route.ts', param: 'request' },
  { p: 'src/app/api/push/subscribe/route.ts', param: 'req' },
  { p: 'src/app/api/ocr/route.ts', param: 'req' },
  { p: 'src/app/api/ocr/batch/route.ts', param: 'req' },
  { p: 'src/app/api/push/send/route.ts', param: 'req' },
  { p: 'src/app/api/notion/route.ts', param: 'request' },
  { p: 'src/app/api/forms/map-fields/route.ts', param: 'request' },
  { p: 'src/app/api/forms/generate/route.ts', param: 'request' },
  { p: 'src/app/api/leads/guide/route.ts', param: 'req' },
  { p: 'src/app/api/leads/upload/route.ts', param: 'req' },
  { p: 'src/app/api/court-search/route.ts', param: 'request' },
  { p: 'src/app/api/chat/route.ts', param: 'req' },
  { p: 'src/app/api/company/[cid]/route.ts', param: 'request' },
  { p: 'src/app/api/call-recordings/route.ts', param: 'request' },
  { p: 'src/app/api/analyze-privacy/route.ts', param: 'req' },
];

for (const { p, param } of routes) {
  if (!fs.existsSync(p)) continue;
  let text = fs.readFileSync(p, 'utf8');
  if (text.includes('requireSessionFromCookie')) continue;
  
  // Add imports
  let imports = [];
  if (!text.includes('NextResponse')) imports.push("import { NextResponse } from 'next/server';");
  imports.push("import { requireSessionFromCookie } from '@/lib/auth';");
  
  text = imports.join('\n') + '\n' + text;
  
  // Replace GET/POST/etc
  text = text.replace(/export async function (GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\)\s*\{/g, (match) => {
    // Determine args and authParam
    let argNameMatch = match.match(/\(\s*([a-zA-Z0-9_]+)\s*:/);
    let authParamMatch = argNameMatch ? argNameMatch[1] : 'req';
    
    // if no args, we change that
    if (match.includes('()')) {
       return match.replace('()', '(req: any)') + 
         `\n  const __auth = await requireSessionFromCookie(req as any);\n  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });\n`;
    }
    
    return match + 
      `\n  const __auth = await requireSessionFromCookie(${authParamMatch} as any);\n  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });\n`;
  });
  
  fs.writeFileSync(p, text);
  console.log('Secured:', p);
}
