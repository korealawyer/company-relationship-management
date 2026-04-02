const fetch = require('node-fetch');

async function testApiExtract() {
  console.log('Testing Analyze API with http://localhost:3000/api/analyze...');
  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // By passing a dummy cookie or bypassing auth if it allows, we can test it. 
      // If it requires auth, we can test Jina or ScrapingBee directly.
      body: JSON.stringify({ url: 'https://cafein24.co.kr/home' })
    });
    
    if (!res.ok) {
       console.log('API responded with status', res.status);
       console.log(await res.text());
       return;
    }
    const data = await res.json();
    console.log('Success:', data.success);
    console.log('Extracted Text Length:', data.rawText ? data.rawText.length : 0);
    console.log('First 500 chars:', data.rawText ? data.rawText.slice(0, 500) : '');
  } catch(e) {
    console.error('Error fetching API:', e);
  }
}

async function testJinaExtract() {
  console.log('\nTesting Jina AI (https://r.jina.ai/) with cafein24.co.kr...');
  try {
    const res = await fetch('https://r.jina.ai/https://cafein24.co.kr/home');
    const text = await res.text();
    console.log('Jina Response Length:', text.length);
    console.log('Contains 개인정보?:', text.includes('개인정보'));
    console.log('First 500 chars:', text.slice(0, 500));
  } catch(e) {
    console.error('Error with Jina:', e);
  }
}

async function testScrapingBee() {
  console.log('\nTesting ScrapingBee with cafein24.co.kr...');
  const apiKey = process.env.SCRAPINGBEE_API_KEY || 'ea2ee6f1972e4b49a5819a65bb79ac24dc067ed597c'; 
  const js = {
    instructions: [
      { evaluate: "var pBtn = Array.from(document.querySelectorAll('a, button, span, li, p, div')).find(e => e.innerText && e.innerText.includes('개인정보')); if(pBtn) pBtn.click();" },
      { wait: 3500 }
    ]
  };
  const sbUrl = "https://app.scrapingbee.com/api/v1/?api_key=" + apiKey + "&url=https://cafein24.co.kr/home&js_scenario=" + encodeURIComponent(JSON.stringify(js)) + "&render_js=True";
  
  try {
    const res = await fetch(sbUrl);
    const text = await res.text();
    console.log('ScrapingBee Response Length:', text.length);
    console.log('Contains 개인정보?:', text.includes('개인정보'));
    
    // Check if we can find something looks like privacy policy text
    const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    console.log('Clean Text Includes 파기?:', cleanText.includes('파기'));
  } catch(e) {
    console.error('ScrapingBee error:', e);
  }
}

async function run() {
  await testJinaExtract();
  await testScrapingBee();
  // await testApiExtract(); // Requires auth
}

run();
