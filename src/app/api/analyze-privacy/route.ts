import { requireSessionFromCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// ── 타입 ──────────────────────────────────────────────────
export interface PrivacyClause {
    clauseNum: string;
    title: string;
    original: string;
    riskSummary: string;
    level: 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';
    lawRef: string;
    scenario: string;
    fix: string;
}

export interface PrivacyAnalysis {
    leadId: string;
    url: string;
    companyName: string;
    analyzedAt: string;
    overallScore: number; // 0~100, 높을수록 위험
    overallLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    clauses: PrivacyClause[];
}

export async function POST(req: NextRequest) {
  const __auth = await requireSessionFromCookie(req as any);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

    try {
        const { leadId, companyName, url, text } = await req.json();
        if (!leadId || !companyName) return NextResponse.json({ error: 'leadId, companyName 필수' }, { status: 400 });

        let analysis: PrivacyAnalysis;

        if (!ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
        }
        if (!url && !text) {
            return NextResponse.json({ error: '분석할 URL 또는 텍스트가 필요합니다.' }, { status: 400 });
        }



        // 실 Claude 분석
        const content_str = text || `개인정보처리방침 URL: ${url} — 내용을 분석해주세요`;
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5', max_tokens: 4000,
                system: `한국 개인정보보호법 전문 AI. 개인정보처리방침을 조문별 분석해 JSON으로만 응답.
형식: {"overallScore":0-100,"overallLevel":"HIGH|MEDIUM|LOW","clauses":[{"clauseNum":"제N조","title":"","original":"","riskSummary":"","level":"HIGH|MEDIUM|LOW|OK","lawRef":"","scenario":"","fix":""}]}`,
                messages: [{ role: 'user', content: `회사명: ${companyName}\n\n${content_str}` }],
            }),
        });
        const data = await resp.json();
        const parsed = JSON.parse(data.content?.[0]?.text?.match(/\{[\s\S]*\}/)?.[0] || '{}');
        analysis = { leadId, url: url || '', companyName, analyzedAt: new Date().toISOString(), ...parsed };

        return NextResponse.json({ analysis });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: '분석 중 오류' }, { status: 500 });
    }
}
