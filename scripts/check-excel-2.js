const xlsx = require('xlsx');
const fs = require('fs');

function inspectExcel(filePath) {
    if (!fs.existsSync(filePath)) {
        return { error: 'File not found', filePath };
    }
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to json and print first 2 rows
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    return {
        file: filePath,
        totalRows: data.length,
        headers: data[0],
        row1: data[1],
        row2: data[2],
        row3: data[3]
    };
}

const out1 = inspectExcel('C:\\Users\\jdc03\\OneDrive\\Desktop\\123.xlsx');
const out2 = inspectExcel('C:\\Users\\jdc03\\Downloads\\방침_업데이트_양식.xlsx');

fs.writeFileSync('scripts/excel-schema.json', JSON.stringify({ source: out1, template: out2 }, null, 2));
