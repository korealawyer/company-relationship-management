import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MOCK_DB: Record<string, {
    name: string; biz: string; url: string; issueCount: number; riskLevel: string; email: string;
}> = {
    test001: { name: '(주)놀부NBG', biz: '123-45-67890', url: 'nolboo.co.kr', issueCount: 7, riskLevel: 'HIGH', email: 'privacy@nolboo.co.kr' },
    test002: { name: '(주)교촌에프앤비', biz: '234-56-78901', url: 'kyochon.com', issueCount: 5, riskLevel: 'HIGH', email: 'legal@kyochon.com' },
    test003: { name: '(주)파리바게뜨', biz: '345-67-89012', url: 'paris.co.kr', issueCount: 4, riskLevel: 'MEDIUM', email: 'info@paris.co.kr' },
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ cid: string }> }
) {
    const { cid } = await params;
    const company = MOCK_DB[cid];

    // Tenant Isolation Check (SEC-C-01)
    const userRole = request.headers.get('x-user-role');
    const userCompanyId = request.headers.get('x-company-id');
    
    // 내부 직원이 아니면서 본인 회사가 아닌 경우 차단
    if (userRole === 'client_hr' && userCompanyId !== cid) {
        return NextResponse.json({ success: false, error: '권한이 없습니다 (Tenant Isolation).' }, { status: 403 });
    }

    if (!company) {
        return NextResponse.json({ success: false, error: '해당 기업이 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, company });
}
