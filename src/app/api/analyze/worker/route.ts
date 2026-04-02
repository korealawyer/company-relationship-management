import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { getServiceSupabase } from '@/lib/supabase';

// Pro 요금제 활용: 최대 3분 허용 (기본 15초 제한 해제)
export const maxDuration = 180; // 3분
export const runtime = 'nodejs'; // Edge 대신 Node 환경으로 넉넉한 컴퓨팅 사용

async function handler(request: NextRequest) {
    let body: { url?: string; privacyUrl?: string; homepageUrl?: string; companyId?: string; manualText?: string; systemPrompt?: string; model?: string; authName?: string; };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    const paramUrl = Object.values(body).find((val: any) => typeof val === 'string' && val.startsWith('http')) as string || '';
    const { companyId, manualText, systemPrompt, model, authName } = body as any;
    const homepageUrl = body.homepageUrl || paramUrl;
    const privacyUrl = body.privacyUrl || '';

    // QStash Worker이므로 데이터베이스를 직접 업데이트해야 합니다.
    const supabase = getServiceSupabase();
    if (!supabase) {
        console.error('[Analyze Worker] SUPABASE_SERVICE_ROLE_KEY 미설정.');
        return NextResponse.json({ success: false, error: 'DB 연결 에러' }, { status: 500 });
    }

    // 실패 처리 헬퍼 함수
    const failJob = async (errorMsg: string, statusText: string) => {
        if (companyId) {
            await supabase.from('companies').update({ status: 'pending' }).eq('id', companyId);
            await supabase.from('auto_logs').insert({
                company_id: companyId,
                company_name: authName || '시스템',
                type: 'ai_analysis',
                label: statusText,
                detail: errorMsg,
                created_at: new Date().toISOString()
            });
        }
        return NextResponse.json({ success: false, error: errorMsg }, { status: 200 }); // Retry 방지를 위해 200 반환할 수도 있으나, QStash 실패 처리를 위해선 500 유지. 단, 복구불가 에러는 200으로 떨구는게 맞음.
    };

    if (!homepageUrl && !privacyUrl && !companyId && !manualText) {
        return failJob('분석에 필요한 식별 주소나 텍스트가 없습니다.', '분석 실패');
    }

    let extractedText = '';
    let extractedFooter: any = null;

    async function crawlUrl(target: string, isPrivacyPolicy: boolean): Promise<string> {
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
                console.log(`[Analyze Worker] Using scrape.do API for URL: ${target}`);
                let sdUrl = `http://api.scrape.do/?token=${scrapeDoKey}&url=${encodeURIComponent(target)}&render=true`;
                
                if (isPrivacyPolicy) {
                    const playWithBrowser = [
                        {"Action": "Execute", "Execute": "var pBtn = Array.from(document.querySelectorAll('a, button, span, li, p, div')).find(e => e.innerText && e.innerText.includes('개인정보')); if(pBtn) pBtn.click();"},
                        {"Action": "Wait", "Timeout": 2500}
                    ];
                    sdUrl = `http://api.scrape.do/?token=${scrapeDoKey}&url=${encodeURIComponent(target)}&playWithBrowser=${encodeURIComponent(JSON.stringify(playWithBrowser))}&render=true`;
                }

                try {
                    res = await fetch(sdUrl, { signal: controller.signal });
                    if (!res.ok) res = null;
                } catch (e) { res = null; }
            }
            
            if (!res && scrapingBeeKey) {
                console.log(`[Analyze Worker] Using ScrapingBee API fallback for URL: ${target}`);
                let sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeKey}&url=${encodeURIComponent(target)}&render_js=true`;

                if (isPrivacyPolicy) {
                    const js_scenario = {
                        "instructions": [
                            {"evaluate": "var pBtn = Array.from(document.querySelectorAll('a, button, span, li, p, div')).find(e => e.innerText && e.innerText.includes('개인정보')); if(pBtn) pBtn.click();"},
                            {"wait": 2500}
                        ]
                    };
                    sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeKey}&url=${encodeURIComponent(target)}&js_scenario=${encodeURIComponent(JSON.stringify(js_scenario))}&render_js=true`;
                }

                try {
                    res = await fetch(sbUrl, { signal: controller.signal });
                    if (!res.ok) res = null;
                } catch (e) { res = null; }
            }
            
            if (res?.ok) html = await res.text();
            else throw new Error('Fetch failed in both services');
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
        if (manualText && manualText.trim().length > 50) extractedText = manualText.trim();
        else if (privacyUrl && privacyUrl.startsWith('http')) extractedText = await crawlUrl(privacyUrl, true);
        else if (homepageUrl && homepageUrl.startsWith('http')) {
            console.log(`[Analyze Worker] 홈페이지에서 푸터 정보 추출 시도 중: ${homepageUrl}`);
            const homeText = await crawlUrl(homepageUrl, false);
            const apiKey = process.env.OPENAI_API_KEY;
            
            if (apiKey) {
                const aiController = new AbortController();
                const timeoutId = setTimeout(() => aiController.abort(), 15000); 
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
                        console.log(`[Analyze Worker] 추출된 푸터 정보:`, extractedFooter);
                        
                        if (extractedFooter.privacyUrl && extractedFooter.privacyUrl.startsWith('http')) {
                           extractedText = await crawlUrl(extractedFooter.privacyUrl, true);
                        } else {
                            throw new Error('푸터에서 개인정보처리방침 URL을 찾을 수 없습니다.');
                        }
                    }
                } catch(e) {
                    console.warn('[Analyze Worker] 푸터 정보 AI 추출 또는 크롤링 실패:', e);
                } finally {
                    clearTimeout(timeoutId);
                }
            }
        }

        if (!extractedText || extractedText.length < 50) {
            return failJob('웹페이지에서 개인정보처리방침 내용을 정상적으로 불러오지 못했습니다. 봇 차단이 의심되거나 내용이 너무 짧습니다.', '분석 실패');
        }

    } catch (error: any) {
        console.error('[Analyze Worker] URL Fetch Error:', error);
        return failJob(
            error.name === 'AbortError' 
            ? '웹사이트 응답이 없어 시간 초과되었습니다.' 
            : '유효한 URL 형식이 아니거나 크롤링에 실패했습니다.', 
            '크롤링 중단됨'
        );
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return failJob('OpenAI API 키가 설정되지 않았습니다.', '서버 에러');

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

        const targetPrompt = systemPrompt || defaultPrompt;
        const truncatedText = extractedText.substring(0, 15000);
        let prompt = targetPrompt.includes('{{extractedText}}') 
            ? targetPrompt.replace('{{extractedText}}', truncatedText) 
            : targetPrompt + `\n\n[개인정보처리방침 원문]:\n${truncatedText}`;

        const aiController = new AbortController();
        const aiTimeoutId = setTimeout(() => aiController.abort(), 90000); 

        const targetModel = model || 'gpt-4o-mini';
        let content = '';

        if (targetModel.includes('claude')) {
            const anthropicKey = process.env.ANTHROPIC_API_KEY || apiKey;
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

            if (!response.ok) return failJob('AI 모델(Anthropic) 호출에 실패했습니다.', '분석 실패');
            content = (await response.json()).content?.[0]?.text || '';
        } else {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: targetModel,
                    temperature: 0.1,
                    messages: [{ role: 'user', content: prompt }]
                }),
                signal: aiController.signal
            });
            clearTimeout(aiTimeoutId);

            if (!response.ok) return failJob('AI 모델(OpenAI) 호출에 실패했습니다.', '분석 실패');
            content = (await response.json()).choices?.[0]?.message?.content || '';
        }
        
        const cleanJson = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(cleanJson);

        if (parsedResult.riskLevel === 'UNKNOWN' || parsedResult.error) {
            return failJob(parsedResult.error || '원문에서 개인정보처리방침 내용을 식별할 수 없습니다.', '분석 보류됨');
        }

        // 성공! 회사 데이터 업데이트 및 로그 추가
        if (companyId) {
            const payload: any = { 
                status: 'analyzed',
                issues: (parsedResult.issues || []).map((iss: any) => ({
                    ...iss, id: crypto.randomUUID()
                })),
                issue_count: parsedResult.issues?.length || 0,
                risk_level: parsedResult.riskLevel || 'MEDIUM',
                privacy_url: privacyUrl || extractedFooter?.privacyUrl || homepageUrl || null,
                privacy_policy_text: extractedText,
                updated_at: new Date().toISOString()
            };
            
            if (extractedFooter) {
                if (extractedFooter.businessNumber) payload.biz_no = extractedFooter.businessNumber;
                if (extractedFooter.phoneNumber) payload.contact_phone = extractedFooter.phoneNumber;
            }
            
            await supabase.from('companies').update(payload).eq('id', companyId);
            await supabase.from('auto_logs').insert({
                company_id: companyId,
                company_name: authName || '시스템',
                type: 'ai_analysis',
                label: '분석 완료',
                detail: `발견된 이슈 ${parsedResult.issues?.length || 0}건 (${parsedResult.riskLevel || 'MEDIUM'})`,
                created_at: new Date().toISOString()
            });
        }

        return NextResponse.json({ success: true, message: 'AI 리얼타임 분석 완료' });

    } catch (error: any) {
        console.error('[Analyze Worker] Unexpected Error during OpenAI call:', error);
        return failJob(
            error.name === 'AbortError' ? 'AI 서버 응답 시간 초과로 중단되었습니다.' : '분석 중 예기치 않은 오류가 발생했습니다.',
            '분석 중단됨'
        );
    }
}

// QStash 서명 검증기로 라우트 보호 (로컬 바이패스 포함)
export const POST = async (req: NextRequest) => {
    try {
        const clonedReq = req.clone();
        const body = await clonedReq.json();
        if (body.isLocalBypass) {
            return handler(req);
        }
    } catch (e) {
        // ignore JSON parse error here
    }
    const verify = verifySignatureAppRouter(handler as any);
    return verify(req as any);
};
