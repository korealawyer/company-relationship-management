import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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
