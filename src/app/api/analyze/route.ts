import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { DEFAULT_PROMPT_CONFIG } from '@/lib/prompts/privacy';

// Pro 요금제 활용: 최대 3분 허용 (기본 15초 제한 해제)
export const maxDuration = 180; // 3분
export const runtime = 'nodejs'; // Edge 대신 Node 환경으로 넉넉한 컴퓨팅 사용


export async function POST(request: NextRequest) {
    // 인증 검증
    const auth = await requireSessionFromCookie(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // ── 입력값 파싱 (try-catch로 400 에러 방지) ──
    let body: { url?: string; privacyUrl?: string; homepageUrl?: string; companyId?: string; manualText?: string; systemPrompt?: string; model?: string; };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: '잘못된 요청 형식입니다. JSON Content-Type을 확인하세요.' },
            { status: 400 }
        );
    }

    // ── 필수 파라미터 검증 ──
    const paramUrl = Object.values(body).find(val => typeof val === 'string' && val.startsWith('http')) as string || '';
    const { companyId, manualText, systemPrompt, model } = body as any;
    
    // "없음" 또는 "미기재" 예외 처리
    const checkMissing = (val?: string) => {
        if (!val || typeof val !== 'string') return false;
        const normalized = val.trim().replace(/\s+/g, '');
        if (normalized === '없음' || normalized === '미기재' || normalized === '방침없음' || normalized === '해당없음') return true;
        if ((normalized.includes('없음') || normalized.includes('미기재') || normalized.includes('제공하지않음') || normalized.includes('미운영') || normalized.includes('확인불가')) && normalized.length < 20) return true;
        if (val.includes('해당 기업은 개인정보 처리방침이 없거나 확인되지 않습니다')) return true;
        return false;
    };

    if (checkMissing(body.privacyUrl) || checkMissing(manualText) || checkMissing(body.homepageUrl)) {
        return NextResponse.json({
            success: true,
            isDemoMode: false,
            message: '빠른 예외 처리 완료 (방침 없음)',
            analysisId: `missing-${Date.now()}`,
            analyzedUrl: null,
            issueCount: 1,
            issues: [{
                id: crypto.randomUUID(),
                title: '개인정보처리방침 누락 (매우 심각)',
                riskDesc: '현재 귀사에 개인정보 처리방침이 존재하지 않거나 공개되어 있지 않습니다. 이는 개인정보보호법 상 가장 치명적인 위반 사항 중 하나로, 민원 발생이나 당국 감사 시 즉각적인 처벌 대상이 되는 매우 위험한 무방비 상태입니다.',
                customDraft: '기본 가이드라인 기반 긴급 제정 초안 도입 권고',
                level: 'HIGH',
                originalText: '없음 / 미기재',
                law: '개인정보 보호법 제30조',
                lawText: '제30조(개인정보 처리방침의 수립 및 공개) ① 개인정보처리자는 개인정보를 처리하는 경우에는 개인정보 처리방침을 정하여야 한다. ② 제1항에 따른 개인정보 처리방침을 수립하거나 변경하는 경우에는 정보주체가 쉽게 확인할 수 있도록 공개하여야 한다.',
                scenario: '이 상태로 개인정보보호위원회 점검이나 고객 민원이 접수되면, 회사 측에서 방어할 수 있는 법적 근거가 단 하나도 없습니다. 그 즉시 1천만 원 이하의 과태료 처분뿐만 아니라, 언론 공표 및 시정명령 등 막대한 금전적·기업 이미지 손실이 발생합니다.',
                penalty: '과태료 1천만원 이하 부과, 시정명령, 위반사실 공표 등 강력한 행정처분',
                recommendation: '[긴급 조치 요망] 지체할 시간이 없습니다. 당장 회사 실정에 맞는 개인정보 처리방침을 제정하여 웹사이트 초기 화면 최하단에 명확한 하이퍼링크로 식별 가능하게 게시해야 합니다.',
                revisionOpinion: '사업을 영위함에 있어 가장 기초적이고 절대로 누락되어서는 안 될 핵심 법적 의무를 위반하고 있는 "매우 치명적인 상황"입니다. 처벌 리스크 방어를 위해 오늘 당장 제정안을 마련해야 합니다.',
                legalBasis: ['개인정보 보호법 제30조 (개인정보 처리방침의 수립 및 공개)', '개인정보 보호법 제75조 (과태료)'],
                lawyerNote: '[법적 위기 경보] 개인정보처리방침 전면 누락은 가벼운 실수가 아닌 명백하고 치명적인 법령 위반입니다. 정보 유출이나 고객과의 작은 분쟁 발생 시에도 회사는 일체의 면책 주장을 할 수 없으며 독박 책임을 지게 됩니다. 모든 업무에 최우선하여 즉결 처리해야 하는 최우선 과제입니다.',
                reviewChecked: false,
                aiDraftGenerated: true
            }],
            riskLevel: 'HIGH',
            rawText: '해당 기업은 개인정보 처리방침이 없거나 확인되지 않습니다 (데이터 상 "없음" 또는 "미기재" 상태).',
            extractedDetails: { ceo: '', companyName: '', address: '', bizNumber: '', email: '' },
            completedAt: new Date().toISOString(),
        });
    }

    // URL 정규화 함수 (`http`가 없으면 `https://` 붙이기)
    const normalizeUrl = (url?: string) => {
        if (!url || typeof url !== 'string') return '';
        url = url.trim();
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
        }
        return url;
    };

    const homepageUrl = normalizeUrl(body.homepageUrl || paramUrl);
    const privacyUrl = normalizeUrl(body.privacyUrl);

    if (!homepageUrl && !privacyUrl && !companyId && !manualText) {
        return NextResponse.json(
            { success: false, error: '분석에 필요한 식별 주소나 수동 텍스트 중 하나는 필수입니다.' },
            { status: 400 }
        );
    }

    let extractedText = '';
    let extractedFooter: any = null;

    async function crawlUrl(target: string): Promise<string> {
        let html = '';
        const fetchUrl = new URL(target);
        if (!fetchUrl.protocol.startsWith('http')) throw new Error('Invalid protocol');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        try {
            const scrapeDoKey = process.env.SCRAPE_DO_API_KEY;
            const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;
            let res: Response | null = null;
            
            if (scrapeDoKey) {
                console.log(`[Analyze API] Using scrape.do API for URL: ${target}`);
                let sdUrl = `http://api.scrape.do/?token=${scrapeDoKey}&url=${encodeURIComponent(target)}&render=true`;

                try {
                    res = await fetch(sdUrl, { signal: controller.signal });
                    if (!res.ok) {
                        console.warn(`[Analyze API] scrape.do failed with status: ${res.status}. Falling back to ScrapingBee.`);
                        res = null;
                    }
                } catch (e) {
                    console.warn(`[Analyze API] scrape.do network error:`, e);
                    res = null;
                }
            }
            
            if (!res && scrapingBeeKey) {
                console.log(`[Analyze API] Using ScrapingBee API fallback for URL: ${target}`);
                let sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeKey}&url=${encodeURIComponent(target)}&render_js=true`;

                try {
                    res = await fetch(sbUrl, { signal: controller.signal });
                    if (!res.ok) {
                        console.warn(`[Analyze API] ScrapingBee failed with status: ${res.status}. No more fallbacks available.`);
                        res = null;
                    }
                } catch (e) {
                    console.warn(`[Analyze API] ScrapingBee network error:`, e);
                    res = null;
                }
            }
            
            if (res?.ok) {
                html = await res.text();
            } else {
                console.warn(`[Analyze API] HTTP Fetch failed: Status ${res?.status}`);
                throw new Error('Fetch failed in both services');
            }
        } finally {
            clearTimeout(timeoutId);
        }

        let cleanHtml = html.length > 200000 ? html.slice(0, 200000) : html;
        cleanHtml = cleanHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
        cleanHtml = cleanHtml.replace(/<style[\s\S]*?<\/style>/gi, '');
        cleanHtml = cleanHtml.replace(/<[^>]+>/g, ' ');
        return cleanHtml.replace(/\s+/g, ' ').trim();
    }

    try {
        // 분기 로직
        // Case 2-3: manualText가 최우선
        if (manualText && manualText.trim().length > 0) {
            extractedText = manualText.trim();
        }
        // Case 2-2: privacyUrl이 있는 경우
        else if (privacyUrl && privacyUrl.startsWith('http')) {
            extractedText = await crawlUrl(privacyUrl);
        } 
        // Case 2-1: homepageUrl만 있는 경우
        else if (homepageUrl && homepageUrl.startsWith('http')) {
            console.log(`[Analyze API] 홈페이지에서 푸터 정보 추출 시도 중: ${homepageUrl}`);
            const homeText = await crawlUrl(homepageUrl);
            
            // OpenAI로 사업자번호, 전화번호, 개인정보취급방침 URL 추출
            const apiKey = process.env.OPENAI_API_KEY;
            if (apiKey) {
                const aiController = new AbortController();
                const timeoutId = setTimeout(() => aiController.abort(), 15000); // 15초 제한
                try {
                    const footerRes = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o-mini',
                            response_format: { type: "json_object" },
                            messages: [{ 
                                role: 'user', 
                                content: `다음 웹사이트 내용에서 회사 푸터 정보를 찾아 JSON 객체로 반환해. 
                                반환 형태: {"businessNumber": "사업자번호", "phoneNumber": "고객센터 전화번호", "privacyUrl": "개인정보처리방침 링크 URL"}
                                만약 해당 정보가 없으면 빈 문자열("")로 반환할 것.
                                URL은 절대 경로(예: https://...)이거나 상대 경로(/privacy)일 수 있음. 상대경로라면 원래 도메인(${homepageUrl})을 붙여서 절대경로로 만들어줘.
                                내용의 일부: ${homeText.slice(homeText.length > 50000 ? homeText.length - 10000 : 0)}` 
                            }]
                        }),
                        signal: aiController.signal
                    });
                    
                    if (footerRes.ok) {
                        const jsonPayload = await footerRes.json();
                        const resultParsed = JSON.parse(jsonPayload.choices[0].message.content);
                        extractedFooter = {
                            businessNumber: resultParsed.businessNumber || "",
                            phoneNumber: resultParsed.phoneNumber || "",
                            privacyUrl: resultParsed.privacyUrl || ""
                        };
                        console.log(`[Analyze API] 추출된 푸터 정보:`, extractedFooter);
                        
                        // privacyUrl을 찾았으면 다시 크롤링 시도
                        if (extractedFooter.privacyUrl && extractedFooter.privacyUrl.startsWith('http')) {
                           extractedText = await crawlUrl(extractedFooter.privacyUrl);
                        } else {
                            throw new Error('푸터에서 개인정보처리방침 URL을 찾을 수 없습니다.');
                        }
                    }
                } catch(e) {
                    console.warn('[Analyze API] 푸터 정보 AI 추출 또는 크롤링 실패:', e);
                } finally {
                    clearTimeout(timeoutId);
                }
            }
        }

        // 결과 검증 (manualText 우선)
        const isMinLengthValid = (manualText && manualText.trim().length > 0) ? extractedText.length >= 5 : extractedText.length >= 50;
        
        if (!extractedText || !isMinLengthValid) {
            console.warn('[Analyze API] 크롤링 실패 또는 텍스트 불충분');
            return NextResponse.json(
                { success: false, error: '웹페이지에서 개인정보처리방침 내용을 정상적으로 불러오지 못했습니다. 봇 차단이 의심되거나 내용이 너무 짧습니다. 전문 텍스트를 직접 복사하여 수동으로 입력해 주세요.' },
                { status: 422 }
            );
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

    // 4. OpenAI 실시간 분석 지시
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('[Analyze API] OPENAI_API_KEY is not set.');
            return NextResponse.json(
                { success: false, error: 'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.' },
                { status: 500 }
            );
        }

        // systemPrompt가 제공되었다면 그것을 사용, 아니면 중앙 프롬프트 설정의 기본값 사용
        const targetPrompt = systemPrompt || DEFAULT_PROMPT_CONFIG.analyzePrompt;
        
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

        const targetModel = model || 'gpt-4o-mini';
        let content = '';

        if (targetModel.includes('claude')) {
            // Anthropic API 호출
            const anthropicKey = process.env.ANTHROPIC_API_KEY;
            if (!anthropicKey) {
                return NextResponse.json({ success: false, error: 'ANTHROPIC_API_KEY가 서버 환경 변수에 설정되지 않았습니다.' }, { status: 500 });
            }
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'x-api-key': anthropicKey
                },
                body: JSON.stringify({
                    model: targetModel === 'claude-3-opus' ? 'claude-3-opus-20240229' : 'claude-3-5-sonnet-20241022',
                    max_tokens: 4096,
                    system: '반드시 순수 JSON 형식({ "riskLevel": ..., "issues": [...] })만 반환해야 하며 앞뒤에 백틱(```)이나 부가 설명을 절대 포함하지 마세요.',
                    messages: [{ role: 'user', content: prompt }]
                }),
                signal: aiController.signal
            });
            clearTimeout(aiTimeoutId);

            if (!response.ok) {
                console.error('[Analyze API] Anthropic Failure:', await response.text());
                return NextResponse.json(
                    { success: false, error: 'AI 모델(Anthropic) 호출에 실패했습니다. 관리자에게 문의하세요.' },
                    { status: 502 }
                );
            }
            const aiData = await response.json();
            content = aiData.content?.[0]?.text || '';
        } else if (targetModel.includes('gemini')) {
            // Google Gemini API 호출
            const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
            if (!geminiKey) {
                 return NextResponse.json({ success: false, error: 'GEMINI_API_KEY가 서버 환경 변수에 설정되지 않았습니다.' }, { status: 500 });
            }
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: '반드시 순수 JSON 형식({ "riskLevel": ..., "issues": [...] })만 반환해야 하며 앞뒤에 백틱(```)이나 부가 설명을 절대 포함하지 마세요.' }]
                    },
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: "application/json"
                    }
                }),
                signal: aiController.signal
            });
            clearTimeout(aiTimeoutId);

            if (!response.ok) {
                console.error('[Analyze API] Gemini Failure:', await response.text());
                return NextResponse.json({ success: false, error: 'AI 모델(Gemini) 호출에 실패했습니다. 관리자에게 문의하세요.' }, { status: 502 });
            }
            const aiData = await response.json();
            content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
            // 기본 OpenAI API 호출 (gpt-4o, gpt-4o-mini 등)
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: targetModel,
                    temperature: 0.1,
                    response_format: { type: "json_object" },
                    messages: [
                        { role: 'system', content: '반드시 JSON 형식의 객체({ "riskLevel": ..., "issues": [...] })만 반환해야 합니다.' },
                        { role: 'user', content: prompt }
                    ]
                }),
                signal: aiController.signal
            });
            clearTimeout(aiTimeoutId);

            if (!response.ok) {
                console.error('[Analyze API] OpenAI Failure:', await response.text());
                return NextResponse.json(
                    { success: false, error: 'AI 모델(OpenAI) 호출에 실패했습니다. 관리자에게 문의하세요.' },
                    { status: 502 }
                );
            }

            const aiData = await response.json();
            content = aiData.choices?.[0]?.message?.content || '';
        }
        
        // 마크다운 JSON 오류 방어 파싱
        let parsedResult;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const cleanJson = jsonMatch ? jsonMatch[0] : content.replace(/```json/gi, '').replace(/```/g, '').trim();
            parsedResult = JSON.parse(cleanJson);
        } catch (e) {
            console.error('[Analyze API] JSON Parse Error:', e, 'Raw Content was:', content);
            return NextResponse.json(
                { success: false, error: 'AI가 반환한 결과를 파싱할 수 없습니다. 재조사를 시도해 주세요.' },
                { status: 502 }
            );
        }

        if (parsedResult.riskLevel === 'UNKNOWN' || parsedResult.error) {
            console.warn('[Analyze API] OpenAI가 원문을 식별할 수 없음.');
            return NextResponse.json(
                { success: false, error: parsedResult.error || '원문에서 개인정보처리방침 내용을 식별할 수 없습니다. 빈약한 페이지가 수집되었을 수 있으니, 전문 텍스트를 수동으로 복사·붙여넣기 후 다시 시도해 주세요.' },
                { status: 422 }
            );
        }

        return NextResponse.json({
            success: true,
            isDemoMode: false,
            message: 'AI 리얼타임 분석 완료',
            analysisId: `real-${Date.now()}`,
            analyzedUrl: privacyUrl || homepageUrl || null,
            issueCount: parsedResult.issues?.length || 0,
            issues: (parsedResult.issues || []).map((iss: any) => ({
                ...iss,
                id: crypto.randomUUID()
            })),
            riskLevel: parsedResult.riskLevel || 'MEDIUM',
            rawText: extractedText,
            extractedDetails: extractedFooter,
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
