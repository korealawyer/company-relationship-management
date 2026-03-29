import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// 접근성 검사를 진행할 타겟 URL (Public 경로 위주 및 핵심 모달)
const TARGET_URLS = [
    '/',
    '/login',
    '/products', // 예: 공개된 상품/서비스 페이지
];

test.describe('Accessibility (a11y) Checks', () => {
    for (const url of TARGET_URLS) {
        test(`Should not have any automatically detectable accessibility issues on ${url}`, async ({ page }) => {
            // 해당 페이지 접속
            const response = await page.goto(url);
            
            // 페이지가 없으면 예외 건너뛰기 처리 방지 (404 대응)
            if (response?.status() === 404) {
               console.log(`[Skip] ${url} returned 404, skipping accessibility test.`);
               return; 
            }

            // 페이지 로드 완료 대기
            await page.waitForLoadState('networkidle');

            // Axe-core를 활용하여 접근성 위반 스캔
            const accessibilityScanResults = await new AxeBuilder({ page })
                // 일부 의도된 디자인 요건 등에 따라 예외 룰이 필요할 시 아래와 같이 추가 가능
                // .disableRules(['color-contrast']) 
                .analyze();

            // 위반 사항 결과 출력용 (디버깅)
            if (accessibilityScanResults.violations.length > 0) {
                console.warn(`Accessibility violations found on ${url}:`);
                accessibilityScanResults.violations.forEach(v => {
                    console.warn(`- Rule: ${v.id} (${v.impact}) - ${v.description}`);
                    console.warn(`  Nodes: ${v.nodes.length}`);
                });
            }

            // 위반 사항이 0개여야 통과되도록 단언(Assertion)
            expect(accessibilityScanResults.violations).toEqual([]);
        });
    }
});
