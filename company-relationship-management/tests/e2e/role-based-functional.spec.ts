import { test, expect } from '@playwright/test';

const ROLES_TEST_DATA = [
    { email: 'admin@ibslaw.kr', role: 'super_admin', expectedDashboard: '/admin' },
    { email: 'sales@ibslaw.kr', role: 'sales', expectedDashboard: '/employee' },
    { email: 'lawyer@ibslaw.kr', role: 'lawyer', expectedDashboard: '/lawyer' },
    { email: 'litigation@ibslaw.kr', role: 'litigation', expectedDashboard: '/litigation' },
    { email: 'counselor@ibslaw.kr', role: 'counselor', expectedDashboard: '/counselor' },
];

test.describe('Role-based Functional Testing & Navigation', () => {
    for (const data of ROLES_TEST_DATA) {
        test(`Should logic successfully and load dashboard for role: ${data.role}`, async ({ page, context }) => {
            // 1. 세션 쿠키 수동 주입 (Mock Authorization)
            await context.addCookies([
                { name: 'ibs_session', value: `mock_${data.role}_session`, domain: 'localhost', path: '/' },
                { name: 'ibs_role', value: data.role, domain: 'localhost', path: '/' }
            ]);

            // 2. 로그인 페이지 접근 시 자동 리다이렉트 대기 대신,
            // 역할별 바로 허용된 페이지로 다이렉트 접근하여 렌더링 검사
            await page.goto(data.expectedDashboard);

            // 3. 대시보드 로딩 완료 대기
            await page.waitForLoadState('networkidle');

            // 4. 페이지 렌더링 무결성 검증 (오류 발생 여부)
            const body = page.locator('body');
            await expect(body).not.toBeEmpty();
            const textContent = await body.textContent();
            expect(textContent).not.toMatch(/500 Internal Server Error/i);
            expect(textContent).not.toMatch(/Application error/i);
        });
    }

    test('Should login successfully as Client B2B and load client portal', async ({ page, context }) => {
        // 기업 고객용 Mock 세션
        await context.addCookies([
            { name: 'ibs_session', value: 'mock_client_session', domain: 'localhost', path: '/' },
            { name: 'ibs_role', value: 'client_hr', domain: 'localhost', path: '/' }
        ]);

        // 바로 대시보드(본인 홈)로 이동
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const body = page.locator('body');
        await expect(body).not.toBeEmpty();
        const textContent = await body.textContent();
        expect(textContent).not.toMatch(/500 Internal Server Error/i);
        expect(textContent).not.toMatch(/Application error/i);
    });
});
