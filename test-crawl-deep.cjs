const fetch = require('node-fetch');

async function testJinaDeepCrawl(targetUrl) {
  console.log(`\n[Test] Crawling ${targetUrl} with Jina AI...`);
  try {
    const res = await fetch(`https://r.jina.ai/${targetUrl}`);
    const text = await res.text();
    
    // Look for link to privacy policy
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
        console.log('✅ Found Privacy Policy Link:', privacyLink);
        console.log(`\n[Test] Crawling Privacy Policy page: ${privacyLink} ...`);
        const privacyRes = await fetch(`https://r.jina.ai/${privacyLink}`);
        const privacyText = await privacyRes.text();
        
        console.log('✅ Privacy Policy Page Content Length:', privacyText.length);
        console.log('✅ First 500 chars of Privacy Policy:\n-----------------------');
        console.log(privacyText.slice(0, 500));
        console.log('-----------------------');
    } else {
        console.log('❌ Could not find an explicit link to Privacy Policy in the Markdown.');
        console.log('Checking if the main page text contains privacy-related keywords:');
        console.log('Contains "개인정보처리":', text.includes('개인정보처리'));
        console.log('Contains "제3자 제공":', text.includes('제3자 제공'));
    }
  } catch(e) {
    console.error('Error during deep crawl:', e);
  }
}

testJinaDeepCrawl('https://cafein24.co.kr');
