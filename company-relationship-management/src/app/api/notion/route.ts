import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
    // QA-FIX #1: 인증 추가 — 기존에 누락되어 누구나 호출 가능했음
    const auth = await requireSessionFromCookie(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();

    // Mock Notion DB sync response
    // In production: use @notionhq/client to create/update a database record
    const record = {
        id: `notion-${Date.now()}`,
        company: body.company ?? 'Unknown',
        issueCount: body.issues?.length ?? 0,
        createdAt: new Date().toISOString(),
        lawyerOpinion: body.opinion ?? null,
        status: 'synced',
    };

    return NextResponse.json({
        success: true,
        message: 'Notion DB 동기화 완료 (Mock)',
        record,
    });
}
