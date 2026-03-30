const fs = require('fs');

async function testAnalyzeManual() {
    try {
        console.log(`Testing POST https://company-relationship-management.vercel.app/api/analyze with manualText`);
        const res = await fetch(`https://company-relationship-management.vercel.app/api/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": "ibs_session=mock_sales_session; ibs_role=sales"
            },
            body: JSON.stringify({
                companyId: "mock_company",
                manualText: "㈜아이비에스(이하 '회사'라 합니다)는 고객의 개인정보를 중요시하며, '정보통신망 이용촉진 및 정보보호'에 관한 법률 등 관련 법령을 준수하고 있습니다. 본 보호정책은 정부의 법률 및 지침의 변경과 회사의 내부 방침 변경 등으로 인하여 수시로 변경될 수 있습니다. 제1조 (수집하는 개인정보 항목) 회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다. 1. 수집항목 : 이름, 로그인ID, 비밀번호, 자택 전화번호, 자택 주소, 휴대전화번호, 이메일, 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보 등 수집합니다."
            })
        });

        const status = res.status;
        const text = await res.text();
        console.log(`Status: ${status}`);
        console.log(`Response: ${text.substring(0, 800)}`);
        
        fs.writeFileSync('api-test-manual.txt', `Status: ${status}\nResponse: ${text}`);
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testAnalyzeManual();
