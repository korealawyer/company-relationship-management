import { NextRequest, NextResponse } from "next/server";
import { requireSessionFromCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const auth = await requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    const { companyId } = body;

    // IDOR 방어: 클라이언트가 자신의 companyId 이외의 결제 내역을 조회하려고 하면 403 반환
    if (auth.role === 'client' || auth.role === 'client_hr') {
        if (auth.companyId !== companyId) {
            return NextResponse.json({ error: 'Forbidden: 타 회사의 결제 정보에 접근할 수 없습니다.' }, { status: 403 });
        }
    }

    // Mock 결제 내역 응답
    return NextResponse.json({ payments: [{ id: 'pay_1', amount: 100000, status: 'paid' }] });
}
