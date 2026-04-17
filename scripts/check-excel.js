const xlsx = require('xlsx');
const fs = require('fs');

function inspectExcel(filePath) {
    console.log('\n--- Inspecting File:', filePath, '---');
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to json and print first 2 rows
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Total Rows:', data.length);
    console.log('Row 1 (Headers):', data[0]);
    console.log('Row 2 (Data):', data[1]);
}

inspectExcel('C:\\Users\\jdc03\\OneDrive\\Desktop\\123.xlsx');
inspectExcel('C:\\Users\\jdc03\\Downloads\\방침_업데이트_양식.xlsx');
