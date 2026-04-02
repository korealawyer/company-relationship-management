const fs = require('fs');
const fetch = require('node-fetch');

const targetUrl = 'https://www.cafein24.co.kr/franchise';
const results = {};

async function testScrapingBee() {
  const apiKey = process.env.SCRAPINGBEE_API_KEY || 'ea2ee6f1972e4b49a5819a65bb79ac24dc067ed597c'; 
  const js = {
    instructions: [
      { evaluate: "var pBtn = Array.from(document.querySelectorAll('a, button, span, li, p, div')).find(e => e.innerText && e.innerText.includes('개인정보')); if(pBtn) pBtn.click();" },
      { wait: 3500 }
    ]
  };
  const sbUrl = "https://app.scrapingbee.com/api/v1/?api_key=" + apiKey + "&url=" + encodeURIComponent(targetUrl) + "&js_scenario=" + encodeURIComponent(JSON.stringify(js)) + "&render_js=True";
  
  try {
    const res = await fetch(sbUrl);
    const text = await res.text();
    results['scrapingbee'] = {
        length: text.length,
        has_privacy: text.includes('개인정보'),
        has_destruction: text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').includes('파기')
    };
  } catch(e) {
    results['scrapingbee'] = { error: e.message };
  }
}

async function testJinaSingle() {
  try {
    const res = await fetch(`https://r.jina.ai/${targetUrl}`);
    const text = await res.text();
    results['jina_single'] = {
        length: text.length,
        has_privacy: text.includes('개인정보'),
        sample: text.slice(0, 300).replace(/\n/g, ' ')
    };
  } catch(e) {
    results['jina_single'] = { error: e.message };
  }
}

async function testJinaDeepCrawl() {
  try {
    const res = await fetch(`https://r.jina.ai/${targetUrl}`);
    const text = await res.text();
    
    const lines = text.split('\n');
    let privacyLink = null;
    for (const line of lines) {
      if (line.includes('개인정보처리방침') || line.includes('개인정보방침') || line.includes('privacy')) {
        const linkMatch = line.match(/\((https?:\/\/[^)]+)\)/);
        if (linkMatch) {
            privacyLink = linkMatch[1];
            break;
        } else {
            const relativeMatch = line.match(/\((\/[^)]+)\)/);
            if (relativeMatch) {
                const baseUrl = new URL(targetUrl).origin;
                privacyLink = baseUrl + relativeMatch[1];
                break;
            }
        }
      }
    }

    if (privacyLink) {
        const privacyRes = await fetch(`https://r.jina.ai/${privacyLink}`);
        const privacyText = await privacyRes.text();
        results['jina_deep'] = {
            found_link: privacyLink,
            length: privacyText.length,
            has_third_party: privacyText.includes('제3자'),
            sample: privacyText.slice(0, 300).replace(/\n/g, ' ')
        };
    } else {
        results['jina_deep'] = { found_link: null };
    }
  } catch(e) {
    results['jina_deep'] = { error: e.message };
  }
}

async function run() {
  await testScrapingBee();
  await testJinaSingle();
  await testJinaDeepCrawl();
  fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
}

run();
