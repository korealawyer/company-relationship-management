import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const auth = await requireSessionFromCookie(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body: { companyId: string, brandName: string, issues: any[], customPrompt?: string, model?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    const { brandName, issues, customPrompt, model } = body;

    if (!brandName) {
        return NextResponse.json({ success: false, error: '브랜드명이 필요합니다.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const v2Template = `[전화영업 스크립트 v2.0 - 기본 구조]
0) 오프닝 (1문장 핵심)
"대표님/담당자님, 안녕하세요. 저는 법률사무소 IBS 영업팀입니다. ${brandName} 홈페이지 점검 중 발견된 개인정보처리방침 리스크 때문에 연락드렸습니다."

1) 게이트키퍼 통과 시나리오
- "안녕하세요, ${brandName} 개인정보처리방침 법률 검토 결과를 문서로 남기기 전에, 책임을 맡고 계신 대표님이나 담당자님께 짧게 팩트만 확인하려고 전화드렸습니다."

2) 대표/담당자 본론 연결 시나리오
- "지금 ${brandName} 웹사이트 개인정보처리방침을 보면, [위반사유]가 확인되고 있습니다. 관련해서 최근 점검 대상에 오를 소지가 있어 안내드립니다."

3) 구체적인 리스크(이슈) 전달
{{RISK_INJECTION}}

4) 마무리/액션 (관심/무관심 케이스)
- 관심: "관련해서 저희가 미리 작성해둔 진단 보고서와 수정안이 있습니다. 메일이나 카톡으로 보내드릴까요?"
- 무관심: "네, 알겠습니다. 방치하시면 추후 [제재/불이익]가 발생할 수 있으니 꼭 자체적으로 점검해보시길 바랍니다. 자료만 문자로 남겨드리겠습니다."

[준수해야 할 포맷 규칙]
- 150자 이상 분량으로 구체적으로 작성
- "불법입니다" 같은 단정적 표현 금지, "점검/민원 시 비용이 커진다" 정도로만
- "지금 통화 가능하실까요?" 같은 허락 구하기 멘트 삭제
- 변호사나 컨설턴트처럼 전문적이고 단호한 톤 사용`;

    const formattedIssues = (issues || []).map((i: any, x: number) => 
        `💡 리스크 ${x+1}: [${i.level}] ${i.title}\n - 발견된 내용: ${i.originalText}\n - 위반 위험: ${i.riskDesc}\n - 조언: ${i.lawyerNote || i.customDraft || '수정 필요'}`
    ).join('\n\n');

    let basePrompt = `이 에이전트는 [전화영업 스크립트 v2.0] 를 기본 대본으로 사용하면서, 스크립트 내 (브랜드별 교체) 구간을 브랜드별 리스크 진단 문서 근거로 맞춤 문구로 치환하여 작성합니다.

[입력 정보]
- 대상 브랜드명: ${brandName}
- 근거 리스크 데이터:
${formattedIssues || '발견된 주요 리스크 없음 (일반 안내 모드로 작성할 것)'}

[AI 작성 규칙]
1. 전체 대본을 하나의 완전한 텍스트로 완성해서 반환하세요.
2. 마크다운 \`\`\` 를 쓰지 말고, 순수 텍스트만 출력하세요.
3. 스크립트 내용 외에 서론/결론 요약, 해설 등은 절대 출력하지 마세요 (no-summary policy).
4. 위 [전화영업 스크립트 v2.0 - 기본 구조]를 바탕으로, 실제 콜을 할 수 있도록 자연스럽게 편집하세요.
`;

    if (customPrompt) {
        basePrompt = customPrompt + '\n\n' + basePrompt;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'gpt-4o',
                temperature: 0.7,
                messages: [
                    { role: 'system', content: basePrompt },
                    { role: 'user', content: v2Template }
                ]
            })
        });

        if (!response.ok) {
            return NextResponse.json({ success: false, error: 'AI 모델 호출에 실패했습니다.' }, { status: 502 });
        }

        const aiData = await response.json();
        const scriptContent = aiData.choices?.[0]?.message?.content?.trim() || '';

        return NextResponse.json({
            success: true,
            script: scriptContent
        });

    } catch (error) {
        console.error('[Generate Script API] Error:', error);
        return NextResponse.json({ success: false, error: '스크립트 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
