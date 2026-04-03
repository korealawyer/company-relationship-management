async function test() {
    const res = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Need a tiny session cookie mock or auth bypass
        },
        body: JSON.stringify({
            companyId: 'test',
            homepageUrl: 'https://test.com',
            privacyUrl: '',
            manualText: '없음'
        })
    });
    console.log(res.status);
    console.log(await res.text());
}
test();
