import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    
    // Block direct external origin calls as per security requirements
    if (!origin || (origin && origin !== 'http://localhost:3000' && origin !== process.env.NEXT_PUBLIC_APP_URL && !origin.startsWith('http://localhost:3000'))) {
        return NextResponse.json({ error: 'Forbidden: Cross-Origin Requests are not allowed for this endpoint' }, { status: 403 });
    }

    return NextResponse.json({ token: 'mock-jwt-token' });
}
