import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { MOCK_ACCOUNTS, MOCK_BIZ_ACCOUNTS, AuthUser } from '@/lib/auth';
import type { RoleType } from '@/lib/mockStore';
import { checkRateLimit } from '@/lib/rateLimit';

// SEC-FIX: 하드코딩된 fallback 시크릿을 제거하여 프로덕션 환경의 보안 취약점 원천 차단
const JWT_SECRET_RAW = process.env.JWT_SECRET || '';
if (!JWT_SECRET_RAW) {
    console.error('[auth/login] 🔴 CRITICAL: JWT_SECRET 환경변수가 누락되었습니다!');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

export async function POST(req: NextRequest) {
    try {
        if (!JWT_SECRET_RAW) {
            return NextResponse.json({ success: false, error: '서버 인증 키 설정이 누락되어 로그인이 일시 차단되었습니다.' }, { status: 500 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
        }

        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
        
        // SEC-FIX: 분산 IP Brute-force 공격 방어를 위한 타겟 계정 단위 Rate Limit 적용
        const accountId = body.type === 'staff' ? body.email : body.bizNum;
        if (typeof accountId === 'string' && accountId.trim() !== '') {
            const accRateLimit = await checkRateLimit(`login_acc_${accountId}`, 5, 60);
            if (!accRateLimit.success) {
                return NextResponse.json({ success: false, error: '해당 계정에 대한 비정상적인 로그인 시도가 감지되었습니다. 잠시 후 다시 시도하세요.' }, { status: 429 });
            }
        }

        const rateLimit = await checkRateLimit(`login_ip_${ip}`, 10, 60);
        if (!rateLimit.success) {
            return NextResponse.json({ success: false, error: '현재 IP에서 너무 많은 로그인 시도가 발생했습니다. 잠시 후 다시 시도하세요.' }, { status: 429 });
        }
        
        const { type, email, password, bizNum, bizPassword } = body;

        // SEC-FIX: Type Mismatch Injection 방어로 인한 서버 크래시 방어
        if (type === 'staff') {
            if (typeof email !== 'string' || typeof password !== 'string') {
                return NextResponse.json({ success: false, error: '이메일 또는 비밀번호 형식이 올바르지 않습니다.' }, { status: 400 });
            }
        } else if (type === 'client') {
            if (typeof bizNum !== 'string' || typeof bizPassword !== 'string') {
                return NextResponse.json({ success: false, error: '사업자번호 또는 비밀번호 형식이 올바르지 않습니다.' }, { status: 400 });
            }
        } else {
            return NextResponse.json({ success: false, error: '잘못된 로그인 타입입니다.' }, { status: 400 });
        }

        let user: AuthUser | null = null;

        if (type === 'staff') {
            const account = MOCK_ACCOUNTS.find(a => a.email.toLowerCase() === email?.toLowerCase() && a.password === password);
            if (!account) {
                return NextResponse.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
            }
            user = { ...account.user, loginAt: new Date().toISOString() };
        } else if (type === 'client') {
            const digits = bizNum?.replace(/\D/g, '');
            const biz = MOCK_BIZ_ACCOUNTS[digits || ''];
            if (!biz || biz.password !== bizPassword) {
                return NextResponse.json({ success: false, error: '사업자번호 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
            }
            user = {
                id: `biz_${digits}`,
                name: biz.ceo,
                email: `${digits}@client.ibslaw.kr`,
                role: 'client_hr' as RoleType,
                companyId: digits,
                companyName: biz.name,
                loginAt: new Date().toISOString(),
            };
        } else {
            return NextResponse.json({ success: false, error: 'Invalid login type' }, { status: 400 });
        }

        const alg = 'HS256';
        const jti = crypto.randomUUID();
        const jwt = await new SignJWT({ role: user.role, companyId: user.companyId || '', jti })
            .setProtectedHeader({ alg })
            .setIssuedAt()
            .setJti(jti)
            .setSubject(user.id)
            .setExpirationTime('24h')
            .sign(JWT_SECRET);

        const response = NextResponse.json({ success: true, user });
        
        response.cookies.set('ibs_jwt', jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;
    } catch (error) {
        console.error('Login Route Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
