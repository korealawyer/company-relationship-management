import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { callClaude, parseAIJson, hasAIKey, mockDelay } from '@/lib/ai';
import { buildRAGContext } from '@/lib/rag/vectorSearch';

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
    overallScore: number;
    overallLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    clauses: PrivacyClause[];
}

// ── Mock 분석 결과 생성 ────────────────────────────────────
function buildMockAnalysis(leadId: string, companyName: string, url: string): PrivacyAnalysis {
    return {
        leadId, url, companyName,
        analyzedAt: new Date().toISOString(),
        overallScore: 78,
        overallLevel: 'HIGH',
        clauses: [
            {
                clauseNum: '총칙',
                title: '총칙 (서문)',
                original: `${companyName}(이하 "당사"라 함)는 이용자의 개인정보를 중요시하며, 개인정보보호법 등 관련 법령을 준수하고 있습니다. 본 처리방침은 관련 법령 및 내부 운영방침에 따라 변경될 수 있습니다.`,
                riskSummary: '특이 쟁점 없음. 단 "관련 법령 준수" 선언만으로는 후속 조항과의 정합성 보장 불가.',
                level: 'LOW',
                lawRef: '개보법 §3 (개인정보 보호 원칙)',
                scenario: '일부 조항이 구식·누락된 상태에서 "준수" 선언이 남을 경우 민원 접수 시 "관리 부실" 프레임 강화.',
                fix: '서문은 유지하되, 본문 전체(특히 쿠키·뉴미디어·관리행사·안전조치) 최신화 후 정합성 재점검.'
            },
            {
                clauseNum: '제1조',
                title: '수집하는 개인정보 항목',
                original: `회사는 회원에게 서비스를 제공하기 위해 다음 개인정보를 수집합니다.\n1) 수집항목: 이름, 생년월일, 성별, 로그인ID, 비밀번호, 비밀번호 질문과 답변, 자택전화번호, 자택주소, 휴대전화번호, 이메일, 직업, 회사명, 회사전화번호, 서비스 이용기록, 접속로그, 접속IP정보, 결제기록, 선호기록, 선호메뉴, 선호매장, 멤버십카드 소지여부\n2) 자동 수집: 쿠키, 서비스 이용기록, 접속로그, 불량 이용 기록`,
                riskSummary: '🔴 과다수집 의심 + "비밀번호 질문/답변" 수집 표현',
                level: 'HIGH',
                lawRef: '개보법 §16 (개인정보 수집 제한)',
                scenario: '① 서비스 대비 과다수집(자택전화/직업/회사명 등) 의심\n② "비밀번호 질문/답변" 평문 저장 오해 가능 → 개보법 §29 안전조치 이슈\n③ 고지-UI 불일치 시 민원 즉시 제기.',
                fix: '필수/선택 분리 명시. "비밀번호 질문/답변"은 "계정 인증 보조수단"으로 표현 변경. 자택주소/직업은 선택 또는 삭제 검토.'
            },
            {
                clauseNum: '제2조',
                title: '개인정보 수집·이용 목적',
                original: `당사는 수집한 개인정보를 다음 목적에 이용합니다.\n- 서비스 제공 및 계약 이행\n- 회원 관리 및 본인 확인\n- 마케팅 및 광고 활용\n- 통계 분석`,
                riskSummary: '🟡 마케팅 목적 별도 동의 여부 불명확',
                level: 'MEDIUM',
                lawRef: '개보법 §15 (개인정보 수집·이용)',
                scenario: '"마케팅 및 광고 활용"을 필수 수집 목적에 포함하면 별도 동의 없이 광고성 정보 발송 가능하다는 오해 발생 → 과징금 사유.',
                fix: '마케팅 목적은 선택 동의 항목으로 별도 분리. "광고성 정보 수신 동의"와 연계 명시.'
            },
            {
                clauseNum: '제3조',
                title: '개인정보 보유·이용 기간',
                original: `당사는 개인정보 수집 및 이용 목적 달성 시 지체 없이 파기합니다. 단, 관계법령에 의해 보존할 경우 아래와 같이 보관합니다.\n- 계약 또는 청약철회 등에 관한 기록: 5년`,
                riskSummary: '🟡 보유기간 미명시 항목 존재',
                level: 'MEDIUM',
                lawRef: '개보법 §21 (개인정보 파기)',
                scenario: '쿠키, 접속로그, 마케팅 동의 철회 후 기간 등 명시 누락 → 개보법 위반 민원.',
                fix: '쿠키 자동삭제 주기, 비활성 계정 처리 기준, 마케팅 동의 철회 시 즉시파기 명시.'
            },
            {
                clauseNum: '제4조',
                title: '개인정보 제3자 제공',
                original: `당사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의하거나 이용자의 동의가 있는 경우 예외로 합니다.`,
                riskSummary: '🔴 제3자 제공 현황 구체적 명시 누락',
                level: 'HIGH',
                lawRef: '개보법 §17 (개인정보 제3자 제공)',
                scenario: '배달앱·PG사·광고플랫폼 등 실제 제3자 제공이 있으나 처리방침에 명시 안 됨 → 미동의 제공으로 행정처분.',
                fix: '제3자 제공 현황 표(수신자, 목적, 항목, 기간) 반드시 추가. 제공 없으면 "없음"으로 명시.'
            },
        ]
    };
}

export async function POST(req: NextRequest) {
    // A3: 인증 검증 추가
    const auth = await requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { leadId, companyName, url, text } = await req.json();
        if (!leadId || !companyName) return NextResponse.json({ error: 'leadId, companyName 필수' }, { status: 400 });

        let analysis: PrivacyAnalysis;

        if (hasAIKey && (url || text)) {
            try {
                const content = text || `개인정보처리방침 URL: ${url} — 내용을 분석해주세요`;
                const ragContext = buildRAGContext(`개인정보처리방침 ${companyName} 수집 제공 파기 안전조치`);
                const result = await callClaude({
                    system: `한국 개인정보보호법 전문 AI. 개인정보처리방침을 조문별 분석해 JSON으로만 응답.
형식: {"overallScore":0-100,"overallLevel":"HIGH|MEDIUM|LOW","clauses":[{"clauseNum":"제N조","title":"","original":"","riskSummary":"","level":"HIGH|MEDIUM|LOW|OK","lawRef":"","scenario":"","fix":""}]}${ragContext}`,
                    messages: [{ role: 'user', content: `회사명: ${companyName}\n\n${content}` }],
                    maxTokens: 4000,
                });

                const parsed = parseAIJson<Partial<PrivacyAnalysis>>(result.text, {});
                analysis = {
                    leadId, url: url || '', companyName,
                    analyzedAt: new Date().toISOString(),
                    overallScore: parsed.overallScore ?? 50,
                    overallLevel: parsed.overallLevel ?? 'MEDIUM',
                    clauses: parsed.clauses ?? [],
                };
            } catch (err) {
                console.error('[analyze-privacy] AI 오류, Mock 폴백:', err);
                analysis = buildMockAnalysis(leadId, companyName, url || '');
            }
        } else {
            await mockDelay(1200);
            analysis = buildMockAnalysis(leadId, companyName, url || '');
        }

        return NextResponse.json({ analysis, mock: !hasAIKey });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: '분석 중 오류' }, { status: 500 });
    }
}
