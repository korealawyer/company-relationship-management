const fs = require('fs');
const files = ['src/components/sales/call/CompanyTableRow.tsx', 'src/app/(admin)/sales/call/page.tsx'];
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/text-\[(\d+)px\]/g, (match, p1) => {
        const val = parseInt(p1);
        if (val >= 8 && val <= 14) {
             return 'text-[' + (val + 2) + 'px]';
        }
        return match;
    });
    fs.writeFileSync(f, content);
});
console.log('Font sizes updated.');
