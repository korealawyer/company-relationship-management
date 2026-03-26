import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { blacklistToken } from '@/lib/tokenBlacklist';

// middleware.ts 등과 동일한 시크릿 로직
const JWT_SECRET_RAW = process.env.JWT_SECRET || 'fallback_secret_for_local_testing_only';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

export async function POST(req: NextRequest) {
    try {
        const jwtCookie = req.cookies.get('ibs_jwt');
        
        // 쿠키에 토큰이 있을 경우, 검증하여 만료 전 블랙리스트 등록 진행
        if (jwtCookie?.value) {
            try {
                const { payload } = await jwtVerify(jwtCookie.value, JWT_SECRET);
                
                // 페이로드에 jti가 포함된 경우에만 무효화 처리 가능
                if (payload.jti) {
                    const exp = payload.exp ? payload.exp * 1000 : Date.now() + 86400000;
                    const expiresInMs = Math.max(0, exp - Date.now());
                    
                    if (expiresInMs > 0) {
                        await blacklistToken(payload.jti, expiresInMs);
                    }
                }
            } catch (err) {
                // 검증 실패 시(위조 토큰, 이미 만료 등) 무시하고 쿠키 삭제만 진행
                console.warn('[auth/logout] 무효화 검증 실패 또는 이미 만료된 토큰:', err);
            }
        }
        
        const response = NextResponse.json({ success: true, message: '성공적으로 로그아웃되었습니다.' });
        
        // 브라우저 쿠키에서 ibs_jwt 완전 삭제
        response.cookies.delete('ibs_jwt');
        
        return response;
    } catch (error) {
        console.error('Logout Route Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
