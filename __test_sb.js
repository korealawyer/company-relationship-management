const fetch = require('node-fetch');
async function testSb() {
    console.log('Starting testSb...');
    const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY || 'ea2ee6f1972e4b49a5819a65bb79ac24dc067ed597c';
    const url = 'https://cafein24.co.kr/';
    const js_scenario = {
        instructions: [
            {evaluate: "var pBtn = Array.from(document.querySelectorAll('a, button, span, li, p, div')).find(e => e.innerText && e.innerText.includes('개인정보')); if(pBtn) pBtn.click();"},
            {wait: 2500}
        ]
    };
    const sbUrl = 'https://app.scrapingbee.com/api/v1/?api_key=' + scrapingBeeKey + '&url=' + encodeURIComponent(url) + '&js_scenario=' + encodeURIComponent(JSON.stringify(js_scenario)) + '&render_js=true';
    console.log('Requesting: ', sbUrl);
    const res = await fetch(sbUrl);
    if(!res.ok) {
        console.error('ScrapingBee error', res.status, await res.text());
        return;
    }
    const html = await res.text();
    console.log('Got HTML, len:', html.length);
    if (html.includes('수집하는 개인정보')) {
        console.log('SUCCESS: Private policy loaded via modal click.');
    } else {
        console.log('FAIL: Private policy not found in the dom after 2.5 seconds wait. The modal might not be rendering or the button wasn\'t clicked.');
    }
}
testSb().catch(console.error);
