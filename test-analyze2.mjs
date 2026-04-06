const fetch = require('node-fetch');

(async () => {
    try {
        const res = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manualText: '이 사이트는 회원의 개인정보를 보호합니다.', model: 'gpt-4o-mini' })
        });
        console.log(res.status);
        console.log(await res.text());
    } catch(e) {
        console.error(e);
    }
})();
