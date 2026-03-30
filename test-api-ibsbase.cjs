const fs = require('fs');

async function testAnalyze() {
    try {
        console.log("Testing POST https://ibsbase.com/api/analyze");
        const res = await fetch("https://ibsbase.com/api/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                manualText: "㈜아이비에스(이하 '회사'라 합니다)는 고객의 개인정보를 중요시하며, '정보통신망 이용촉진 및 정보보호'에 관한 법률 등 관련 법령을 준수하고 있습니다. 본 보호정책은 정부의 법률 및 지침의 변경과 회사의 내부 방침 변경 등으로 인하여 수시로 변경될 수 있습니다. 제1조 (수집하는 개인정보 항목) 회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다. 1. 수집항목 : 이름, 로그인ID, 비밀번호, 자택 전화번호, 자택 주소, 휴대전화번호, 이메일, 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보"
            })
        });

        const status = res.status;
        const text = await res.text();
        console.log(`Status: ${status}`);
        console.log(`Response: ${text.substring(0, 500)}`);
        
        fs.writeFileSync('api-test-result.txt', `Status: ${status}\nResponse: ${text}`);
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testAnalyze();
