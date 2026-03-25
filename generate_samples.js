const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'public', 'test-data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // 1. sample_complaint.jpg
  await page.setContent(`
    <html><body style="font-family: sans-serif; padding: 50px;">
      <h1>소장</h1>
      <p>원고: (주)놀부</p>
      <p>청구금액: 50,000,000원</p>
      <p>위와 같이 청구합니다.</p>
    </body></html>
  `);
  await page.screenshot({ path: path.join(outDir, 'sample_complaint.jpg') });

  // 2. sample_evidence.pdf (with text layer)
  await page.setContent(`
    <html><body style="font-family: sans-serif; padding: 50px;">
      <h1>증거 자료 1호</h1>
      <p>2026년 3월 24일 이체 내역서</p>
      <p>송금인: (주)흥부</p>
      <p>수취인: (주)놀부</p>
      <p>금액: 50,000,000원</p>
    </body></html>
  `);
  await page.pdf({ path: path.join(outDir, 'sample_evidence.pdf'), format: 'A4' });

  // 3. sample_contract_scan.pdf (without text layer - we make an image then put in PDF, or just use page.pdf then convert to image)
  await page.setContent(`
    <html><body style="font-family: sans-serif; padding: 50px; background: #eee;">
      <h1>계약서 (Contract)</h1>
      <p>제1조: 본 계약은 불공정합니다.</p>
      <p>위험 조항: 일방적 해지권 부여.</p>
    </body></html>
  `);
  const contractImgPath = path.join(outDir, 'contract_temp.jpg');
  await page.screenshot({ path: contractImgPath });
  
  await page.setContent(`
    <html><body style="margin: 0;">
      <img src="file://${contractImgPath}" style="width: 100%;">
    </body></html>
  `);
  await page.pdf({ path: path.join(outDir, 'sample_contract_scan.pdf'), format: 'A4' });
  fs.unlinkSync(contractImgPath);

  // 4. sample_biz_license.jpg
  await page.setContent(`
    <html><body style="font-family: sans-serif; padding: 50px; border: 5px solid #000;">
      <h1 style="text-align: center;">사업자등록증</h1>
      <p><strong>등록번호:</strong> 123-45-67890</p>
      <p><strong>상호:</strong> (주)테스트</p>
      <p><strong>성명:</strong> 홍길동</p>
      <p><strong>사업장 소재지:</strong> 서울특별시 강남구</p>
    </body></html>
  `);
  await page.screenshot({ path: path.join(outDir, 'sample_biz_license.jpg') });

  await browser.close();
  console.log("All sample files generated.");
}

main().catch(console.error);
