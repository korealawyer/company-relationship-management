import { test, expect } from '@playwright/test';

test.describe('API Security & Defense Mechanisms E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Go to login page or any initial state if UI testing is needed
        // For API tests, we use the `request` fixture instead.
    });

    test('1. Rate Limiting Protection (429 Too Many Requests)', async ({ request }) => {
        // AI Review Endpoint limit check (Allowed 5 times per min)
        const URL = '/api/review';
        const reqBody = {
            text: "테스트 계약서 내용"
        };
        
        // Log in to bypass 401 Unauthorized
        await request.post('/api/auth/login', {
            data: { type: 'staff', email: 'admin@ibslaw.kr', password: 'admin123' }
        });
        
        // 5 successful mock requests
        for (let i = 0; i < 5; i++) {
            const res = await request.post(URL, { data: reqBody });
            expect([200, 400]).toContain(res.status()); // We expect 200, or 400 if text is too short. But auth passes.
        }
        
        // 6th request should hit Rate Limit limit
        const resOverlimit = await request.post(URL, { data: reqBody });
        expect(resOverlimit.status()).toBe(429);
        const resBody = await resOverlimit.json();
        expect(resBody.error).toContain('한도를 초과');
    });

    test('2. IDOR Protection (/api/leads)', async ({ request }) => {
        // PATCH /api/leads with arbitrary ID without ownership
        const res = await request.patch('/api/leads', {
            data: { id: "some_random_lead_id", status: "contracted" }
        });
        
        // Cannot modify lead. Either 401(No session) or 403/404 based on RBAC logic
        expect([401, 403, 404]).toContain(res.status());
    });

    test('3. Malformed JSON Payload Defense', async ({ request }) => {
        // Sending invalid JSON to endpoints that crash without try-catch
        const URL = '/api/auth/login';
        const badRes = await request.post(URL, {
            data: "this is not a valid json object",
            headers: { 'Content-Type': 'application/json' }
        });
        
        // It should gracefully return 400 Bad Request, not 500
        expect(badRes.status()).toBe(400); 
    });

    test('4. XSS Prevention in Drip / Email', async ({ request }) => {
        // Drip / Email route
        const payloads = [
            '<script>alert(1)</script>',
            'onload="alert(1)"',
        ];
        
        for (const sql of payloads) {
            const res = await request.post('/api/email', {
                data: {
                    type: 'sales_notify',
                    leadId: 'test_lead_id',
                    lawyerNote: sql 
                }
            });
            // If logged in, should escape html
            // Here we just test it doesn't crash
            expect([401, 200]).toContain(res.status());
        }
    });

    test('5. JWT Origin Bypass Prevention', async ({ request }) => {
        // Trying to mint JWT from external origin without valid headers
        const res = await request.post('/api/auth/jwt', {
            data: { sessionId: "x", role: "super_admin" },
            headers: { 'Content-Type': 'application/json' }
            // Missing Origin and Referer
        });
        
        // 403 Forbidden is expected for external calls missing correct internal secret
        expect(res.status()).toBe(403);
    });
});
