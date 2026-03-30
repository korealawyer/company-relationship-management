const fetch = require('node-fetch');

fetch("http://localhost:3000/api/email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-test-bypass": "true"
  },
  body: JSON.stringify({
    type: "send_contract",
    leadId: "test-123",
    to: "dhk@ibslaw.co.kr",
    contractCompany: {
      id: "test-123",
      name: "Test Company",
      biz: "123-45-67890",
      storeCount: 5,
      issues: [],
      riskLevel: "LOW"
    }
  })
}).then(r => r.json()).then(console.log).catch(console.error);
