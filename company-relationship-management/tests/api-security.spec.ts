import { test, expect } from '@playwright/test';

test.describe('API Security & Hardening Tests', () => {
    
    // 1. JWT Role Spoofing 방어 검증 (내부 호출 차단)
    test('Should block direct external calls to /api/auth/jwt', async ({ request }) => {
        // 내부 키 없이 외부에서 토큰 강제 생성 시도
        const response = await request.post('/api/auth/jwt', {
            data: { role: 'super_admin' },
        });
        // 403 Forbidden 기대
        expect(response.status()).toBe(403);
        const body = await response.json();
        expect(body.error).toContain('Forbidden');
    });

    // 2. 외부 Malformed JSON 파싱 크래시(500) 방어 검증
    test('Should handle malformed JSON gracefully with 400 Bad Request', async ({ request }) => {
        // 1. 어드민 로그인 (인증 우회 방지, 권한 획득)
        const loginRes = await request.post('/api/auth/login', {
            data: { type: 'staff', email: 'admin@ibslaw.kr', password: 'admin123' }
        });
        expect(loginRes.status()).toBe(200);

        // 2. 잘못된 JSON 구조를 /api/drip 에 전송
        const response = await request.post('/api/drip', {
            headers: { 'Content-Type': 'application/json' },
            data: '{ "invalid_json_missing_quotes: true, ', 
        });
        
        // 500 에러가 아닌 400 Bad Request가 발생해야 함 (서버 크래시 방어 검증)
        expect(response.status()).toBe(400);
        const body = await response.json();
        // 응답 메시지가 JSON 파싱 에러이거나 필수값 누락 에러(모두 400)인지 상관없이 500 방어가 핵심
        expect(body).toHaveProperty('error');
    });

    // 3. IDOR 검증: Client B가 Client A의 결제 정보 조회 시도
    test('Should block IDOR attempts on /api/payment/check', async ({ request }) => {
        // Step 1. c1 계정으로 로그인 (Client B) - MOCK_BIZ_ACCOUNTS에 등록되어있는 놀부NBG
        const loginRes = await request.post('/api/auth/login', {
            data: { type: 'client', bizNum: '1234567890', bizPassword: '1234' }
        });
        expect(loginRes.status()).toBe(200);
        const loginData = await loginRes.json();
        expect(loginData.user.companyId).toBe('1234567890');

        // Step 2. c1 계정으로 c2의 결제 내역(Client A: 2345678901) 조회 시도 
        const checkRes = await request.post('/api/payment/check', {
            data: { companyId: '2345678901' } 
        });
        
        // 권한 에러(403) 발생해야 함 (자신의 companyId 다름)
        expect(checkRes.status()).toBe(403);
    });

    // 4. Rate Limiting 검사 (로그인 엔드포인트)
    test('Should rate limit excessive login attempts', async ({ request }) => {
        // 짧은 시간에 여러번 로그인 시도 (Limit은 5)
        let rateLimited = false;
        
        for (let i = 0; i < 7; i++) {
            const res = await request.post('/api/auth/login', {
                data: { type: 'staff', email: 'admin@ibslaw.kr', password: 'wrong' } 
            });
            if (res.status() === 429) {
                rateLimited = true;
            }
        }
        
        // 적어도 한 번은 429 Too Many Requests에 걸려야 함
        expect(rateLimited).toBe(true);
    });
});
