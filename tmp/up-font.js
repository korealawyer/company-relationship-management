const fs = require('fs');

const path = 'src/app/(admin)/lawyer/privacy-review/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace all fontSize: number with fontSize: number + 2
content = content.replace(/fontSize:\s*(\d+(\.\d+)?)/g, (match, p1) => {
    return 'fontSize: ' + (parseFloat(p1) + 2);
});

// Also replace 'height: 58' to 'height: 64'
content = content.replace(/height:\s*58/g, 'height: 64');

// And top: 58 to top: 64
content = content.replace(/top:\s*58/g, 'top: 64');

fs.writeFileSync(path, content, 'utf8');
console.log('Font updated!');
