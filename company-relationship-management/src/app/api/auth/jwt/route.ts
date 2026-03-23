import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-mock-secret-for-phase-1');

export async function POST(req: NextRequest) {
    try {
        const { sessionId, role, companyId } = await req.json();

        if (!sessionId || !role) {
            return NextResponse.json({ success: false, error: 'Missing sessionId or role' }, { status: 400 });
        }

        const alg = 'HS256';
        const jwt = await new SignJWT({ role, companyId })
            .setProtectedHeader({ alg })
            .setIssuedAt()
            .setSubject(sessionId)
            .setExpirationTime('24h')
            .sign(JWT_SECRET);

        const response = NextResponse.json({ success: true });
        
        response.cookies.set('ibs_jwt', jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;
    } catch (error) {
        console.error('JWT Signing Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
