import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext();
        await context.addCookies([
            { name: 'ibs_session', value: 'mock_super_admin_session', domain: 'localhost', path: '/' },
            { name: 'ibs_role', value: 'super_admin', domain: 'localhost', path: '/' }
        ]);

        const page = await context.newPage();
        console.log('Navigating to Sales Queue page...');
        await page.goto('http://localhost:3000/sales-queue');

        await page.waitForTimeout(2000);

        // Click on "▶ 다음 전화하기"
        console.log('Claiming next company in queue...');
        const nextButton = page.locator('button:has-text("▶ 다음 전화하기")');
        if (await nextButton.isVisible()) {
            await nextButton.click();
            await page.waitForTimeout(2000); // Wait for candidate 
        }

        console.log('Waiting for active call to appear...');
        const maxRetries = 5;
        let found = false;
        for (let i = 0; i < maxRetries; i++) {
            const editBtn = page.locator('button[title="담당자 수정"]');
            if (await editBtn.count() > 0) {
                console.log('Found edit button, attempting to modify...');
                
                // Read original contact name
                const oldNameLocator = editBtn.locator('xpath=preceding-sibling::span');
                const oldName = await oldNameLocator.innerText();
                console.log('Original name:', oldName);

                // Force click the hover-to-show button
                await editBtn.click({ force: true });
                await page.waitForTimeout(500);

                // Look for input field 
                const input = page.locator('input[placeholder="담당자명"]');
                await input.fill(oldName + ' (자동테스트)'); // Append text to test
                
                // Click save button inside inline editor
                const saveBtn = page.locator('button:has-text("저장")').first();
                await saveBtn.click();
                
                await page.waitForTimeout(1000);
                
                // Verify new name
                const newNameLocator = page.locator('button[title="담당자 수정"]').locator('xpath=preceding-sibling::span');
                const newName = await newNameLocator.innerText();
                console.log('New name updated to:', newName);
                
                if (newName === oldName + ' (자동테스트)') {
                    console.log('✅ TEST PASSED: Contact name successfully edited inline!');
                } else {
                    console.log('❌ TEST FAILED: Contact name did NOT update correctly.');
                }

                // Cleanup by cancelling the call lock
                const cancelBtn = page.locator('button:has-text("통화 취소")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.first().click();
                    console.log('Call cancelled to release queue lock.');
                }

                found = true;
                break;
            }
            console.log(`Waiting for candidate... attempt ${i+1}`);
            await page.waitForTimeout(1000);
        }
        
        if (!found) {
            console.log('❌ TEST FAILED: Could not find active call or edit button. Ensure there are active companies in the queue.');
            const pageText = await page.evaluate(() => document.body.innerText);
            console.log('Page text snapshot:', pageText.substring(0, 300));
        }

    } catch (e) {
        console.error('Test threw an error:', e);
    } finally {
        await browser.close();
    }
})();
