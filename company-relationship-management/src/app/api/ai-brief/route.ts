// B3: AI 요약 대시보드 — 오늘의 브리핑 생성
import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { callClaude, hasAIKey, mockDelay } from '@/lib/ai';

interface BriefResult {
    briefing: string;
    highlights: string[];
    actionItems: string[];
    generatedAt: string;
    mock: boolean;
}

function buildMockBrief(): BriefResult {
    return {
        briefing: `## 📋 오늘의 AI 브리핑 (Mock)\n\n현재 **12건**의 리드가 관리 중이며, 그 중 **3건**이 분석 완료 상태에서 영업 컨펌을 대기 중입니다.\n\n### 주요 현황\n- 🔴 HIGH 리스크: **4건** (즉시 대응 필요)\n- 🟡 MEDIUM 리스크: **5건** (주간 내 처리 권장)\n- 🟢 LOW 리스크: **3건** (정기 모니터링)\n\n### 금주 성과\n- 신규 리드 등록: 2건\n- AI 분석 완료: 5건\n- 이메일 발송: 3건\n- 구독 전환: 1건`,
        highlights: [
            '🔴 교촌F&B 개인정보처리방침에 HIGH 리스크 4건 — 영업팀 긴급 컨펌 필요',
            '📧 드립 이메일 Day 8 발송 대기 — 3개사 (BBQ, 맘스터치, 한솥)',
            '✅ 김변호사 검토 완료 — 2건 (파리바게뜨, 뚜레쥬르)',
        ],
        actionItems: [
            '교촌F&B 분석 결과 영업 컨펌 진행 → /employee 페이지에서 처리',
            '드립 Day 8 이메일 일괄 발송 → /admin/leads 드립 탭에서 발송',
            '이디야커피 리드 정보 보완 필요 (이메일 주소 누락)',
        ],
        generatedAt: new Date().toISOString(),
        mock: true,
    };
}

export async function GET(req: NextRequest) {
    const auth = requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (hasAIKey) {
        try {
            // 실제 AI 모드 — localStorage는 서버에서 접근 불가하므로
            // 클라이언트가 현황 데이터를 POST로 보내는 대안 방식도 고려
            // 현재는 일반 브리핑 생성
            const result = await callClaude({
                system: `당신은 IBS 법률사무소의 CRM AI 분석가입니다.
리드 관리 현황을 분석하고 오늘의 브리핑을 생성합니다.
반드시 JSON만 반환: {"briefing":"마크다운 형식","highlights":["주요사항1","주요사항2"],"actionItems":["할일1","할일2"]}`,
                messages: [{
                    role: 'user',
                    content: '현재 CRM 현황을 기반으로 오늘의 AI 브리핑을 생성해주세요. 프랜차이즈 법률 CRM 관점에서 주요 현황, 하이라이트, 액션 아이템을 정리해주세요.',
                }],
                maxTokens: 2048,
            });

            const { parseAIJson } = await import('@/lib/ai');
            const parsed = parseAIJson<Partial<BriefResult>>(result.text, {});
            return NextResponse.json({
                briefing: parsed.briefing || '브리핑 생성 완료',
                highlights: parsed.highlights || [],
                actionItems: parsed.actionItems || [],
                generatedAt: new Date().toISOString(),
                mock: false,
            });
        } catch (err) {
            console.error('[ai-brief] AI 오류, Mock 폴백:', err);
        }
    }

    await mockDelay(800);
    return NextResponse.json(buildMockBrief());
}

// POST: 클라이언트가 현황 데이터를 전달하여 맞춤 브리핑 생성
export async function POST(req: NextRequest) {
    const auth = requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { stats } = await req.json();

    if (hasAIKey && stats) {
        try {
            const result = await callClaude({
                system: `IBS 법률사무소 CRM AI 분석가. 제공된 데이터를 기반으로 브리핑 생성.
JSON 반환: {"briefing":"마크다운","highlights":[""],"actionItems":[""]}`,
                messages: [{
                    role: 'user',
                    content: `리드 현황 데이터:\n${JSON.stringify(stats, null, 2)}\n\n위 데이터를 분석하여 오늘의 AI 브리핑을 생성해주세요.`,
                }],
                maxTokens: 2048,
            });

            const { parseAIJson } = await import('@/lib/ai');
            const parsed = parseAIJson<Partial<BriefResult>>(result.text, {});
            return NextResponse.json({
                briefing: parsed.briefing || '브리핑 생성 완료',
                highlights: parsed.highlights || [],
                actionItems: parsed.actionItems || [],
                generatedAt: new Date().toISOString(),
                mock: false,
            });
        } catch (err) {
            console.error('[ai-brief POST] AI 오류, Mock 폴백:', err);
        }
    }

    await mockDelay(800);
    return NextResponse.json(buildMockBrief());
}
