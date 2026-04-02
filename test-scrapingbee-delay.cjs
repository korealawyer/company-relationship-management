const fetch = require('node-fetch');

async function testDelayedScraping() {
  const targetUrl = 'https://www.cafein24.co.kr/franchise';
  const apiKey = process.env.SCRAPINGBEE_API_KEY || 'ea2ee6f1972e4b49a5819a65bb79ac24dc067ed597c'; 
  console.log(`[Test] ScrapingBee with 10s wait on ${targetUrl}...`);

  // We wait 3 seconds before clicking to ensure page loads, then 10 seconds after click
  const js = {
    instructions: [
      { wait: 3000 },
      { evaluate: "var pBtn = Array.from(document.querySelectorAll('a, button, span, li, p, div')).find(e => e.innerText && e.innerText.includes('개인정보')); if(pBtn) { console.log('Found it, clicking!'); pBtn.click(); }" },
      { wait: 10000 } // Wait 10 seconds!
    ]
  };
  
  const sbUrl = "https://app.scrapingbee.com/api/v1/?api_key=" + apiKey + 
                "&url=" + encodeURIComponent(targetUrl) + 
                "&js_scenario=" + encodeURIComponent(JSON.stringify(js)) + 
                "&render_js=True";
  
  try {
    const start = Date.now();
    const res = await fetch(sbUrl);
    const text = await res.text();
    const end = Date.now();
    
    console.log(`Time taken: ${(end - start)/1000} seconds`);
    console.log(`Response Length: ${text.length}`);
    console.log(`Contains '개인정보'?: ${text.includes('개인정보')}`);
    
    const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    console.log(`Clean Text Includes '파기' (privacy keyword)?: ${cleanText.includes('파기')}`);
    console.log('--- First 300 chars ---');
    console.log(cleanText.slice(0, 300));
  } catch(e) {
    console.error('Error:', e.message);
  }
}

testDelayedScraping();
