const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/analyze/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'test_company',
        issues: [{
            level: 'HIGH',
            title: 'Test Issue',
            originalText: 'Some test text',
            riskDesc: 'Risk',
            customDraft: 'Fixed draft',
            lawyerNote: 'Note'
        }]
      })
    });
    const data = await res.text();
    console.log(res.status, data);
  } catch(e) {
    console.error(e);
  }
}
test();
