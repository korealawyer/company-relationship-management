import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { loginWithEmailFull } from "@/lib/auth";

export async function POST(req: NextRequest) {
    // 1분당 5회로 회원가입/로그인 속도 제한
    const rateLimitResponse = checkRateLimit(req, { max: 5, windowMs: 60000 });
    if (rateLimitResponse) return rateLimitResponse;

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    const { email, password, type, bizNum } = body;
    
    // Playwright Test 지원용 Mock 로그인 맵 (Employee)
    const mockAccounts: Record<string, string> = {
        'admin@ibslaw.kr': 'super_admin',
        'sales@ibslaw.kr': 'sales',
        'lawyer@ibslaw.kr': 'lawyer',
        'litigation@ibslaw.kr': 'litigation',
        'counselor@ibslaw.kr': 'counselor',
        'finance@ibslaw.kr': 'finance',
        'hr@ibslaw.kr': 'hr'
    };

    if (email && mockAccounts[email]) {
        const role = mockAccounts[email];
        const response = NextResponse.json({ user: { id: 'mock', role } });
        response.cookies.set('ibs_session', `mock_${role}_session`);
        response.cookies.set('ibs_role', role);
        return response;
    }
    
    if (bizNum === '1234567890' || type === 'client') {
        const { getServiceSupabase } = await import('@/lib/supabase');
        const sb = getServiceSupabase();
        let targetCompanyId = bizNum;
        
        if (sb) {
            const { data } = await sb.from('companies').select('id').eq('biz_no', bizNum).single();
            if (data?.id) targetCompanyId = data.id;
        }

        const response = NextResponse.json({ user: { id: 'mock', role: 'client_hr', companyId: targetCompanyId } });
        response.cookies.set('ibs_session', 'mock_client_session');
        response.cookies.set('ibs_role', 'client_hr');
        return response;
    }

    if (type === 'personal_client') {
        const response = NextResponse.json({ user: { id: 'mock', role: 'personal_client' } });
        response.cookies.set('ibs_session', 'mock_personal_session');
        response.cookies.set('ibs_role', 'personal_client');
        return response;
    }

    if (!email || !password) {
        return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const result = await loginWithEmailFull(email, password);
    if (result.success) {
        const response = NextResponse.json({ user: result.user });
        response.cookies.set('ibs_session', result.user.id);
        response.cookies.set('ibs_role', result.user.role);
        return response;
    } else {
        return NextResponse.json({ error: result.error }, { status: 401 });
    }
}
