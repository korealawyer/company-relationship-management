const XLSX = require('xlsx');
const inputFile = 'final_sales_targets.xlsx';

const wb = XLSX.readFile(inputFile);
const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

if (data.length > 0) {
    console.log("Headers:", Object.keys(data[0]));
    console.log("First row preview:");
    console.log(data[0]);
} else {
    console.log("File is empty.");
}
