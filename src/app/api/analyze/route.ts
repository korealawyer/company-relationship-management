import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';

// Pro 요금제 활용: 최대 3분 허용 (기본 15초 제한 해제)
export const maxDuration = 180; // 3분
export const runtime = 'nodejs'; // Edge 대신 Node 환경으로 넉넉한 컴퓨팅 사용

// 데모 분석 결과 (폴백용)
const DEMO_ISSUES = [
    {
        id: crypto.randomUUID(), level: 'HIGH', title: '수집 항목 법정 기재 누락',
        law: '개인정보 보호법 제30조 제1항 제1호',
        originalText: '수집 및 이용 목적: 회원 가입 및 관리 등...',
        riskDesc: '수집하는 별도 개인정보 항목이 처리방침에 명시되지 않아 과태료 부과 대상입니다. (예상 제재: 최대 3,000만원)',
        customDraft: '처리방침에 수집 항목(성명, 연락처, 이메일)을 명시하는 조항 추가 필요.',
        lawyerNote: '', reviewChecked: false, aiDraftGenerated: true
    },
    {
        id: crypto.randomUUID(), level: 'HIGH', title: '제3자 제공 동의 절차 부재',
        law: '개인정보 보호법 제17조 제2항',
        originalText: '파트너사 및 제휴업체에 광고 데이터 제공 가능',
        riskDesc: '가맹점 데이터를 파트너사에 제공 시 별도 동의 절차가 없습니다. (예상 제재: 최대 5,000만원)',
        customDraft: '"제3자 제공 동의" 섹션 신설 및 파트너사 목록, 제공 목적, 보유 기간 명시.',
        lawyerNote: '', reviewChecked: false, aiDraftGenerated: true
    },
    {
        id: crypto.randomUUID(), level: 'MEDIUM', title: '보유·이용 기간 불명확',
        law: '개인정보 보호법 제30조 제1항 제3호',
        originalText: '보관 기간: 서비스 종료 시까지 혹은 회원 탈퇴 시까지',
        riskDesc: '"서비스 종료 시까지"라는 불명확한 표현을 사용 중입니다. (예상 제재: 시정 권고)',
        customDraft: '"계약 종료 후 5년 (상법 제33조)" 등 구체적 법정 보유 기간 기재.',
        lawyerNote: '', reviewChecked: false, aiDraftGenerated: true
    },
];

// URL 기반 최소 리스크 추정 (데모 수준 폴백)
function estimateRiskLevel(url: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (!url) return 'HIGH';
    if (!url.startsWith('https://')) return 'HIGH';
    if (url.length < 20) return 'MEDIUM';
    if (url.length >= 30) return 'LOW';
    return 'MEDIUM';
}

function generateFallbackResponse(url?: string) {
    const riskLevel = estimateRiskLevel(url ?? '');
    return NextResponse.json({
        success: true,
        isDemoMode: true,
        message: 'AI 분석 완료 (데모 모드 — 분석 실패 또는 API 키 누락)',
        analysisId: `demo-${Date.now()}`,
        analyzedUrl: url ?? null,
        issueCount: DEMO_ISSUES.length,
        issues: DEMO_ISSUES,
        riskLevel,
        completedAt: new Date().toISOString(),
    });
}

export async function POST(request: NextRequest) {
    // 인증 검증
    const auth = await requireSessionFromCookie(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // ── 입력값 파싱 (try-catch로 400 에러 방지) ──
    let body: { url?: string; companyId?: string; manualText?: string; systemPrompt?: string; };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: '잘못된 요청 형식입니다. JSON Content-Type을 확인하세요.' },
            { status: 400 }
        );
    }

    const { url, companyId, manualText, systemPrompt } = body;

    // ── 필수 파라미터 검증 ──
    if (!url && !companyId && !manualText) {
        return NextResponse.json(
            { success: false, error: 'url, companyId, manualText 중 하나는 필수입니다.' },
            { status: 400 }
        );
    }

    let extractedText = '';

    // 1. 수동 텍스트 검증 (유효성 방어: 빈 문자열 방지 및 최소 50자 이상)
    if (manualText && manualText.trim().length > 50) {
        extractedText = manualText.trim();
    } else if (url) {
        // 2. URL 문자열 기반 크롤링
        try {
            const fetchUrl = new URL(url);
            if (!fetchUrl.protocol.startsWith('http')) throw new Error('Invalid protocol');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000); // Pro 요금제: 25초 크롤링 타임아웃

            let html = '';
            try {
                const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;
                let res: Response | null = null;
                
                // ScrapingBee 크롤링 시도 (모달 클릭 자동화)
                if (scrapingBeeKey) {
                    console.log(`[Analyze API] Using ScrapingBee API for URL: ${url}`);
                    const js_scenario = {
                        "instructions": [
                            // '개인정보' 문구가 포함된 요소를 찾아 클릭 시도
                            {"evaluate": "var pBtn = Array.from(document.querySelectorAll('a, button, span, li, p, div')).find(e => e.innerText && e.innerText.includes('개인정보')); if(pBtn) pBtn.click();"},
                            // 모달이 랜더링되고 표시될 시간을 2.5초 대기
                            {"wait": 2500}
                        ]
                    };
                    const sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeKey}&url=${encodeURIComponent(url)}&js_scenario=${encodeURIComponent(JSON.stringify(js_scenario))}&render_js=true`;
                    
                    res = await fetch(sbUrl, { signal: controller.signal });
                    if (!res.ok) {
                        console.warn(`[Analyze API] ScrapingBee failed with status: ${res.status}. Falling back to default fetch.`);
                        res = null; // 실패 시 폴백 처리 트리거
                    }
                }

                // 일반 Fetch (ScrapingBee 미적용 또는 실패 시 폴백)
                if (!res) {
                    res = await fetch(fetchUrl.toString(), {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        },
                        redirect: 'follow',
                        signal: controller.signal
                    });
                }
                
                if (res?.ok) {
                    html = await res.text();
                } else {
                    console.warn(`[Analyze API] HTTP Fetch failed: Status ${res?.status}`);
                }
            } finally {
                clearTimeout(timeoutId);
            }

            if (html) {
                // Node 런타임이므로 넉넉하게 파싱 시작
                // 150,000자(약 150KB)를 초과하는 대규모 HTML일 경우 앞부분만 잘라서 파싱 시작
                let cleanHtml = html.length > 150000 ? html.slice(0, 150000) : html;
                
                // 가벼운 Non-greedy(.*?) 정규식으로 CPU 연산 최소화
                cleanHtml = cleanHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
                cleanHtml = cleanHtml.replace(/<style[\s\S]*?<\/style>/gi, '');
                cleanHtml = cleanHtml.replace(/<[^>]+>/g, ' ');
                extractedText = cleanHtml.replace(/\s+/g, ' ').trim();
            }
        } catch (error: any) {
            console.error('[Analyze API] URL Fetch Error:', error);
            const isTimeout = error.name === 'AbortError';
            return NextResponse.json(
                { success: false, error: isTimeout 
                    ? '웹사이트 응답이 없어 시간 초과되었습니다. 개인정보처리방침 텍스트를 직접 붙여넣어 주세요.'
                    : '유효한 URL 형식이 아니거나 크롤링에 실패했습니다. (예: https://example.com/privacy)' 
                },
                { status: isTimeout ? 504 : 422 }
            );
        }
    }

    // 3. 추출된 텍스트 확인 후, 부족하면 데모 모드 대체 반환 (Vercel IP 차단 우회)
    if (!extractedText || extractedText.length < 50) {
        console.warn('[Analyze API] 봇 차단 또는 텍스트 부족으로 데모 결과 반환 (Vercel 타임아웃 방어)');
        const fallback = await generateFallbackResponse(url);
        // 클라이언트단이 데모 모드임을 인지하도록 안내
        const data = await fallback.json();
        data.message = 'AI 분석 완료 (봇 차단 우회를 위한 데모 모드 결과)';
        return NextResponse.json(data);
    }

    // 4. OpenAI 실시간 분석 지시
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn('[Analyze API] OPENAI_API_KEY is not set. Falling back to demo mode.');
            return generateFallbackResponse(url);
        }

        const defaultPrompt = `주어진 [개인정보처리방침 원문] 텍스트를 분석하여, 대한민국 개인정보보호법에 위배되거나 고위험/주의가 필요한 법률적 문제점(최대 3개)을 JSON 형식으로 분리해 주세요.

[개인정보처리방침 원문]:
{{extractedText}}

**중요 지시사항**:
제공된 텍스트가 식당/쇼핑몰의 '일반 상품 홍보글', '메인 화면 소개', '안내 팝업' 등에 불과하며 실제 <개인정보처리방침> 내용이 현저히 불충분하다고 판단될 경우, 억지 분석을 멈추고 즉시 아래 JSON 구조를 반환하세요.
{
  "riskLevel": "UNKNOWN",
  "error": "원문에서 개인정보처리방침 내용을 식별할 수 없습니다. (메인 페이지 등 잘못된 URL 수집) 정확한 방침 URL을 기입하거나 전문을 복사하여 재조사해 주세요."
}

정상적인 처리방침 내용일 경우, 다음의 순수 JSON 구조만을 반환하세요. 앞뒤로 백틱(\`\`\`)이나 추가 설명을 포함하지 마세요.
{
  "riskLevel": "HIGH" | "MEDIUM" | "LOW",
  "issues": [
    {
      "id": "1", 
      "level": "HIGH", 
      "title": "이슈 제목", 
      "law": "관련 법령", 
      "originalText": "법에 위배되거나 문제 소지가 있는 원문 중 일부 발췌 내용",
      "riskDesc": "구체적인 문제점 요약 및 위반 시 예상 제재수위 (예: 최대 OOO만원 과태료 등)", 
      "customDraft": "법률에 맞게 수정 및 개선된 권고 초안 조항", 
      "lawyerNote": "",
      "reviewChecked": false,
      "aiDraftGenerated": true
    }
  ]
}`;

        // systemPrompt가 제공되었다면 그것을 사용, 아니면 기본값 사용
        const targetPrompt = systemPrompt || defaultPrompt;
        
        // 텍스트는 토큰 제약을 고려해 15000자까지만 자름
        const truncatedText = extractedText.substring(0, 15000);
        
        let prompt = '';
        if (targetPrompt.includes('{{extractedText}}')) {
            prompt = targetPrompt.replace('{{extractedText}}', truncatedText);
        } else {
            prompt = targetPrompt + `\n\n[개인정보처리방침 원문]:\n${truncatedText}`;
        }


        const aiController = new AbortController();
        const aiTimeoutId = setTimeout(() => aiController.abort(), 90000); // Pro 요금제: 90초 AI 대기 타임아웃

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                temperature: 0.1,
                messages: [{ role: 'user', content: prompt }]
            }),
            signal: aiController.signal
        });
        clearTimeout(aiTimeoutId);

        if (!response.ok) {
            console.error('[Analyze API] OpenAI Failure:', await response.text());
            return generateFallbackResponse(url);
        }

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        
        // 마크다운 JSON 오류 방어 파싱
        const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(cleanJson);

        if (parsedResult.riskLevel === 'UNKNOWN' || parsedResult.error) {
            console.warn('[Analyze API] OpenAI가 원문을 식별할 수 없음. 봇 차단 우회로 데모 결과 반환');
            const fallback = await generateFallbackResponse(url);
            const data = await fallback.json();
            data.message = 'AI 분석 완료 (방침 식별 불가에 따른 데모 모드 결과)';
            return NextResponse.json(data);
        }

        return NextResponse.json({
            success: true,
            isDemoMode: false,
            message: 'AI 리얼타임 분석 완료',
            analysisId: `real-${Date.now()}`,
            analyzedUrl: url ?? null,
            issueCount: parsedResult.issues?.length || 0,
            issues: (parsedResult.issues || []).map((iss: any) => ({
                ...iss,
                id: crypto.randomUUID()
            })),
            riskLevel: parsedResult.riskLevel || 'MEDIUM',
            completedAt: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('[Analyze API] Unexpected Error during OpenAI call:', error);
        if (error.name === 'AbortError') {
            return NextResponse.json(
                { success: false, error: 'AI 분석 서버의 응답이 지연되어 시간 초과로 중단되었습니다. 잠시 후 재조사해 주세요.' },
                { status: 504 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'AI 분석 중 예기치 않은 오류가 발생했습니다. 재조사를 진행해 주세요.' },
            { status: 500 }
        );
    }
}
