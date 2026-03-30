const fs = require('fs');

async function testAnalyze(targetUrl) {
    try {
        console.log(`Testing POST ${targetUrl}/api/analyze`);
        const res = await fetch(`${targetUrl}/api/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": "ibs_session=mock_sales_session; ibs_role=sales"
            },
            body: JSON.stringify({
                companyId: "mock_company",
                url: "https://www.coupang.com/np/policies/privacy"
            })
        });

        const status = res.status;
        const text = await res.text();
        console.log(`Status: ${status}`);
        console.log(`Response: ${text.substring(0, 800)}`);
        
        fs.writeFileSync('api-test-result3.txt', `Status: ${status}\nResponse: ${text}`);
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testAnalyze('https://company-relationship-management.vercel.app');
