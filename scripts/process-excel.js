const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const sourcePath = 'C:\\Users\\jdc03\\OneDrive\\Desktop\\123.xlsx';
const outputPath = 'C:\\Users\\jdc03\\Downloads\\123_방침업데이트_가공본_v2.xlsx';

console.log('Reading source file...');
const workbook = xlsx.readFile(sourcePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const sourceData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
const headers = sourceData[0];
const rows = sourceData.slice(1);

const colIdx = {
    brand: headers.indexOf('업체명(브랜드)'),
    company: headers.indexOf('가맹본부명(법인/운영사)'),
    worker: headers.indexOf('작업자'),
    memo: headers.indexOf('후속일정\r\n(진행단계)'),
    url: headers.indexOf('홈페이지(URL)'),
};

const processedData = [];
// Add Template Headers
processedData.push([
    "기업명", 
    "영업자", 
    "메모", 
    "개인정보처리방침 URL", 
    "개인정보처리방침 전문"
]);

let processedCount = 0;

rows.forEach(row => {
    // skip empty rows
    if (!row || row.length === 0) return;
    
    // Sometimes row elements are undefined
    const getVal = (idx) => (idx !== -1 && row[idx]) ? row[idx].toString().trim() : '';

    let brand = getVal(colIdx.brand);
    let company = getVal(colIdx.company);
    let companyName = brand ? brand : company;
    if (!companyName) return; // skip rows without name

    let workerName = getVal(colIdx.worker);
    let memo = getVal(colIdx.memo);
    let url = getVal(colIdx.url);
    if (!url.startsWith('http') && url.length > 0) {
        url = 'https://' + url;
    }
    let privacyPolicy = ""; // Leave blank for manual update
    
    processedData.push([companyName, workerName, memo, url, privacyPolicy]);
    processedCount++;
});

console.log(`Processed ${processedCount} rows.`);

console.log('Writing to output file...');
const newWorkbook = xlsx.utils.book_new();
const newWorksheet = xlsx.utils.aoa_to_sheet(processedData);

// Set column widths
const wscols = [
    {wch: 30}, // 기업명
    {wch: 15}, // 영업자
    {wch: 40}, // 메모
    {wch: 40}, // 개인정보처리방침 URL
    {wch: 50}  // 개인정보처리방침 전문
];
newWorksheet['!cols'] = wscols;

xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, '방침_업데이트');

xlsx.writeFile(newWorkbook, outputPath);
console.log(`Success! File saved to: ${outputPath}`);
