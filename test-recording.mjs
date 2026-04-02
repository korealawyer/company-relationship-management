import { chromium } from 'playwright';

(async () => {
    // Launch browser with fake media devices
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            // '--use-file-for-fake-audio-capture=...' // Optional: if we want a specific audio
        ]
    });
    
    const context = await browser.newContext();
    await context.grantPermissions(['microphone']);

    // Set mock cookies to bypass login
    await context.addCookies([
        {
            name: 'ibs_session',
            value: 'mock_super_admin_session',
            domain: 'localhost',
            path: '/'
        },
        {
            name: 'ibs_role',
            value: 'super_admin',
            domain: 'localhost',
            path: '/'
        }
    ]);

    const page = await context.newPage();

    console.log('Navigating to Voice Memo page...');
    await page.goto('http://localhost:3000/sales/voice-memo');

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Click a company from the list to enable recording section
    console.log('Selecting a company...');
    try {
        // Look for the first clickable company row
        const companyListItems = page.locator('div[tabindex="0"]');
        if (await companyListItems.count() > 0) {
            await companyListItems.first().click({ timeout: 2000 });
            console.log('Clicked first company.');
        } else {
            console.log('No company elements with tabindex=0 found. Let\'s try to click the first element that looks like a company name.');
            await page.getByText('(주)놀부NBG').first().click({ timeout: 2000 });
        }
    } catch (e) {
        console.log('Could not select a company:', e.message);
    }

    await page.waitForTimeout(1000);

    // Find the record button
    console.log('Finding Record Button (Mic icon)...');
    try {
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            // Find the large circular button
            const recBtn = btns.find(b => b.style.width === '88px');
            if(recBtn) recBtn.click();
            else console.log('Record button not found by width. Falling back..');
        });
        console.log('Recording started (Script clicked button).');
    } catch (e) {
        console.log('Error clicking record button:', e);
    }

    await page.waitForTimeout(3000);

    console.log('Stopping recording...');
    try {
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const recBtn = btns.find(b => b.style.width === '88px');
            if(recBtn) recBtn.click();
        });
        console.log('Record stopped (Script clicked button).');
    } catch (e) {
        console.log('Error stopping recording:', e);
    }

    console.log('Waiting for STT processing...');
    // Monitor the DOM for toast or success logs
    await page.waitForTimeout(4000);

    // Look for success/failure toast or text
    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes('변환 완료') || pageText.includes('AI 요약')) {
        console.log('SUCCESS: STT Processing completed.');
        console.log('Here is a snippet of the page text with the result:');
        
        // Find text surrounding "AI 요약"
        const snippetIndex = Math.max(0, pageText.indexOf('AI 요약') - 50);
        console.log(pageText.substring(snippetIndex, snippetIndex + 200));
    } else if (pageText.includes('실패')) {
        console.log('FAILED: STT Processing failed.');
    } else {
        console.log('UNKNOWN: Could not verify if STT finished properly. Text snippet:');
        console.log(pageText.substring(0, 500));
    }

    await browser.close();
})();
