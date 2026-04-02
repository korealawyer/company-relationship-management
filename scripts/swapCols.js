const fs = require('fs');
const path = require('path');
const fp = path.resolve('src/components/sales/call/InlinePanel.tsx');

let content = fs.readFileSync(fp, 'utf8');

const col2Start = content.indexOf('{/* Col 2: 메모 & AI 분석 */}');
const col3Start = content.indexOf('{/* Col 3: 스크립트 & 통화 제어 */}');

if (col2Start === -1 || col3Start === -1) {
    console.error('Markers not found');
    process.exit(1);
}

// Find the end of Col 3 by finding `{/* Col 3` and then looking for the closing tags.
// By regex:
const gridEndIndexRegex = /[ \t]*<\/div>[\r\n \t]*<\/div>[\r\n \t]*<\/div>[\r\n \t]*<\/td>/;
const match = content.substring(col3Start).match(gridEndIndexRegex);

if (!match) {
    console.error('Could not find end of grid');
    process.exit(1);
}

const gridEndIndex = col3Start + match.index;

console.log('col2Start:', col2Start);
console.log('col3Start:', col3Start);
console.log('gridEndIndex:', gridEndIndex);

const col1ToCol2 = content.substring(0, col2Start);
const col2Str = content.substring(col2Start, col3Start);
const col3Str = content.substring(col3Start, gridEndIndex);
const endOfFile = content.substring(gridEndIndex);

const newContent = col1ToCol2 + col3Str + col2Str + endOfFile;
fs.writeFileSync(fp, newContent);
console.log('Swap completed. Col 3 is now before Col 2.');
