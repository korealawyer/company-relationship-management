import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';

// Pro ?붽툑???쒖슜: 理쒕? 3遺??덉슜 (湲곕낯 15珥??쒗븳 ?댁젣)
export const maxDuration = 180; // 3遺?export const runtime = 'nodejs'; // Edge ???Node ?섍꼍?쇰줈 ?됰꼮??而댄벂???ъ슜


export async function POST(request: NextRequest) {
    // ?몄쬆 寃利?    // ?몄쬆 寃利?    const auth = await requireSessionFromCookie(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // ?? ?낅젰媛??뚯떛 (try-catch濡?400 ?먮윭 諛⑹?) ??
    let body: { url?: string; privacyUrl?: string; homepageUrl?: string; companyId?: string; manualText?: string; systemPrompt?: string; model?: string; };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: '?섎せ???붿껌 ?뺤떇?낅땲?? JSON Content-Type???뺤씤?섏꽭??' },
            { status: 400 }
        );
    }

    // ?? ?꾩닔 ?뚮씪誘명꽣 寃利???
    const paramUrl = Object.values(body).find(val => typeof val === 'string' && val.startsWith('http')) as string || '';
    const { companyId, manualText, systemPrompt, model } = body as any;
    const homepageUrl = body.homepageUrl || paramUrl;
    const privacyUrl = body.privacyUrl || '';

    if (!homepageUrl && !privacyUrl && !companyId && !manualText) {
        return NextResponse.json(
            { success: false, error: '遺꾩꽍???꾩슂???앸퀎 二쇱냼???섎룞 ?띿뒪??以??섎굹???꾩닔?낅땲??' },
            { status: 400 }
        );
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
                console.log(`[Analyze API] Using scrape.do API for URL: ${target}`);
                let sdUrl = `http://api.scrape.do/?token=${scrapeDoKey}&url=${encodeURIComponent(target)}&render=true`;
                
                if (isPrivacyPolicy) {
                    const playWithBrowser = [
                        {"Action": "Execute", "Execute": "var pBtn = Array.from(document.querySelectorAll('a, button, span, li, p, div')).find(e => e.innerText && e.innerText.includes('媛쒖씤?뺣낫')); if(pBtn) pBtn.click();"},
                        {"Action": "Wait", "Timeout": 2500}
                    ];
                    sdUrl = `http://api.scrape.do/?token=${scrapeDoKey}&url=${encodeURIComponent(target)}&playWithBrowser=${encodeURIComponent(JSON.stringify(playWithBrowser))}&render=true`;
                }

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

                if (isPrivacyPolicy) {
                    const js_scenario = {
                        "instructions": [
                            {"evaluate": "var pBtn = Array.from(document.querySelectorAll('a, button, span, li, p, div')).find(e => e.innerText && e.innerText.includes('媛쒖씤?뺣낫')); if(pBtn) pBtn.click();"},
                            {"wait": 2500}
                        ]
                    };
                    sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeKey}&url=${encodeURIComponent(target)}&js_scenario=${encodeURIComponent(JSON.stringify(js_scenario))}&render_js=true`;
                }

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
        // 遺꾧린 濡쒖쭅
        // Case 2-3: manualText媛 理쒖슦??        if (manualText && manualText.trim().length > 50) {
            extractedText = manualText.trim();
        } 
        // Case 2-2: privacyUrl???덈뒗 寃쎌슦
        else if (privacyUrl && privacyUrl.startsWith('http')) {
            extractedText = await crawlUrl(privacyUrl, true);
        } 
        // Case 2-1: homepageUrl留??덈뒗 寃쎌슦
        else if (homepageUrl && homepageUrl.startsWith('http')) {
            console.log(`[Analyze API] ?덊럹?댁??먯꽌 ?명꽣 ?뺣낫 異붿텧 ?쒕룄 以? ${homepageUrl}`);
            const homeText = await crawlUrl(homepageUrl, false);
            
            // OpenAI濡??ъ뾽?먮쾲?? ?꾪솕踰덊샇, 媛쒖씤?뺣낫痍④툒諛⑹묠 URL 異붿텧
            const apiKey = process.env.OPENAI_API_KEY;
            if (apiKey) {
                const aiController = new AbortController();
                const timeoutId = setTimeout(() => aiController.abort(), 15000); // 15珥??쒗븳
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
                                content: `?ㅼ쓬 ?뱀궗?댄듃 ?댁슜?먯꽌 ?뚯궗 ?명꽣 ?뺣낫瑜?李얠븘 JSON 媛앹껜濡?諛섑솚?? 
                                諛섑솚 ?뺥깭: {"businessNumber": "?ъ뾽?먮쾲??, "phoneNumber": "怨좉컼?쇳꽣 ?꾪솕踰덊샇", "privacyUrl": "媛쒖씤?뺣낫泥섎━諛⑹묠 留곹겕 URL"}
                                留뚯빟 ?대떦 ?뺣낫媛 ?놁쑝硫?鍮?臾몄옄??"")濡?諛섑솚??寃?
                                URL? ?덈? 寃쎈줈(?? https://...)?닿굅???곷? 寃쎈줈(/privacy)?????덉쓬. ?곷?寃쎈줈?쇰㈃ ?먮옒 ?꾨찓??${homepageUrl})??遺숈뿬???덈?寃쎈줈濡?留뚮뱾?댁쨾.
                                ?댁슜???쇰?: ${homeText.slice(homeText.length > 50000 ? homeText.length - 10000 : 0)}` 
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
                        console.log(`[Analyze API] 異붿텧???명꽣 ?뺣낫:`, extractedFooter);
                        
                        // privacyUrl??李얠븯?쇰㈃ ?ㅼ떆 ?щ·留??쒕룄
                        if (extractedFooter.privacyUrl && extractedFooter.privacyUrl.startsWith('http')) {
                           extractedText = await crawlUrl(extractedFooter.privacyUrl, true);
                        } else {
                            throw new Error('?명꽣?먯꽌 媛쒖씤?뺣낫泥섎━諛⑹묠 URL??李얠쓣 ???놁뒿?덈떎.');
                        }
                    }
                } catch(e) {
                    console.warn('[Analyze API] ?명꽣 ?뺣낫 AI 異붿텧 ?먮뒗 ?щ·留??ㅽ뙣:', e);
                } finally {
                    clearTimeout(timeoutId);
                }
            }
        }

        // 寃곌낵 寃利?        if (!extractedText || extractedText.length < 50) {
            console.warn('[Analyze API] ?щ·留??ㅽ뙣 ?먮뒗 ?띿뒪??遺덉땐遺?);
            return NextResponse.json(
                { success: false, error: '?뱁럹?댁??먯꽌 媛쒖씤?뺣낫泥섎━諛⑹묠 ?댁슜???뺤긽?곸쑝濡?遺덈윭?ㅼ? 紐삵뻽?듬땲?? 遊?李⑤떒???섏떖?섍굅???댁슜???덈Т 吏㏃뒿?덈떎. ?꾨Ц ?띿뒪?몃? 吏곸젒 蹂듭궗?섏뿬 ?섎룞?쇰줈 ?낅젰??二쇱꽭??' },
                { status: 422 }
            );
        }

    } catch (error: any) {
        console.error('[Analyze API] URL Fetch Error:', error);
        const isTimeout = error.name === 'AbortError';
        return NextResponse.json(
            { success: false, error: isTimeout 
                ? '?뱀궗?댄듃 ?묐떟???놁뼱 ?쒓컙 珥덇낵?섏뿀?듬땲?? 媛쒖씤?뺣낫泥섎━諛⑹묠 ?띿뒪?몃? 吏곸젒 遺숈뿬?ｌ뼱 二쇱꽭??'
                : '?좏슚??URL ?뺤떇???꾨땲嫄곕굹 ?щ·留곸뿉 ?ㅽ뙣?덉뒿?덈떎. (?? https://example.com/privacy)' 
            },
            { status: isTimeout ? 504 : 422 }
        );
    }

    // 4. OpenAI ?ㅼ떆媛?遺꾩꽍 吏??    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('[Analyze API] OPENAI_API_KEY is not set.');
            return NextResponse.json(
                { success: false, error: 'OpenAI API ?ㅺ? ?ㅼ젙?섏? ?딆븯?듬땲?? 愿由ъ옄?먭쾶 臾몄쓽?섏꽭??' },
                { status: 500 }
            );
        }

        const defaultPrompt = `二쇱뼱吏?[媛쒖씤?뺣낫泥섎━諛⑹묠 ?먮Ц] ?띿뒪?몃? 遺꾩꽍?섏뿬, ??쒕?援?媛쒖씤?뺣낫蹂댄샇踰뺤뿉 ?꾨같?섍굅??怨좎쐞??二쇱쓽媛 ?꾩슂??踰뺣쪧??臾몄젣??理쒕? 3媛???JSON ?뺤떇?쇰줈 遺꾨━??二쇱꽭??

[媛쒖씤?뺣낫泥섎━諛⑹묠 ?먮Ц]:
{{extractedText}}

**以묒슂 吏?쒖궗??*:
?쒓났???띿뒪?멸? ?앸떦/?쇳븨紐곗쓽 '?쇰컲 ?곹뭹 ?띾낫湲', '硫붿씤 ?붾㈃ ?뚭컻', '?덈궡 ?앹뾽' ?깆뿉 遺덇낵?섎ŉ ?ㅼ젣 <媛쒖씤?뺣낫泥섎━諛⑹묠> ?댁슜???꾩???遺덉땐遺꾪븯?ㅺ퀬 ?먮떒??寃쎌슦, ?듭? 遺꾩꽍??硫덉텛怨?利됱떆 ?꾨옒 JSON 援ъ“瑜?諛섑솚?섏꽭??
{
  "riskLevel": "UNKNOWN",
  "error": "?먮Ц?먯꽌 媛쒖씤?뺣낫泥섎━諛⑹묠 ?댁슜???앸퀎?????놁뒿?덈떎. (硫붿씤 ?섏씠吏 ???섎せ??URL ?섏쭛) ?뺥솗??諛⑹묠 URL??湲곗엯?섍굅???꾨Ц??蹂듭궗?섏뿬 ?ъ“?ы빐 二쇱꽭??"
}

?뺤긽?곸씤 泥섎━諛⑹묠 ?댁슜??寃쎌슦, ?ㅼ쓬???쒖닔 JSON 援ъ“留뚯쓣 諛섑솚?섏꽭?? ?욌뮘濡?諛깊떛(\`\`\`)?대굹 異붽? ?ㅻ챸???ы븿?섏? 留덉꽭??
{
  "riskLevel": "HIGH" | "MEDIUM" | "LOW",
  "issues": [
    {
      "id": "1", 
      "level": "HIGH", 
      "title": "?댁뒋 ?쒕ぉ", 
      "law": "愿??踰뺣졊", 
      "originalText": "踰뺤뿉 ?꾨같?섍굅??臾몄젣 ?뚯?媛 ?덈뒗 ?먮Ц 以??쇰? 諛쒖톸 ?댁슜",
      "riskDesc": "援ъ껜?곸씤 臾몄젣???붿빟 諛??꾨컲 ???덉긽 ?쒖옱?섏쐞 (?? 理쒕? OOO留뚯썝 怨쇳깭猷???", 
      "customDraft": "踰뺣쪧??留욊쾶 ?섏젙 諛?媛쒖꽑??沅뚭퀬 珥덉븞 議고빆", 
      "lawyerNote": "",
      "reviewChecked": false,
      "aiDraftGenerated": true
    }
  ]
}`;

        // systemPrompt媛 ?쒓났?섏뿀?ㅻ㈃ 洹멸쾬???ъ슜, ?꾨땲硫?湲곕낯媛??ъ슜
        const targetPrompt = systemPrompt || defaultPrompt;
        
        // ?띿뒪?몃뒗 ?좏겙 ?쒖빟??怨좊젮??15000?먭퉴吏留??먮쫫
        const truncatedText = extractedText.substring(0, 15000);
        
        let prompt = '';
        if (targetPrompt.includes('{{extractedText}}')) {
            prompt = targetPrompt.replace('{{extractedText}}', truncatedText);
        } else {
            prompt = targetPrompt + `\n\n[媛쒖씤?뺣낫泥섎━諛⑹묠 ?먮Ц]:\n${truncatedText}`;
        }


        const aiController = new AbortController();
        const aiTimeoutId = setTimeout(() => aiController.abort(), 90000); // Pro ?붽툑?? 90珥?AI ?湲???꾩븘??
        const targetModel = model || 'gpt-4o-mini';
        let content = '';

        if (targetModel.includes('claude')) {
            // Anthropic API ?몄텧
            const anthropicKey = process.env.ANTHROPIC_API_KEY || apiKey; // ?대갚??            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'x-api-key': anthropicKey
                },
                body: JSON.stringify({
                    model: targetModel === 'claude-3-opus' ? 'claude-3-opus-20240229' : 'claude-3-5-sonnet-20241022',
                    max_tokens: 4096,
                    system: '諛섎뱶???쒖닔 JSON ?뺤떇({ "riskLevel": ..., "issues": [...] })留?諛섑솚?댁빞 ?섎ŉ ?욌뮘??諛깊떛(```)?대굹 遺媛 ?ㅻ챸???덈? ?ы븿?섏? 留덉꽭??',
                    messages: [{ role: 'user', content: prompt }]
                }),
                signal: aiController.signal
            });
            clearTimeout(aiTimeoutId);

            if (!response.ok) {
                console.error('[Analyze API] Anthropic Failure:', await response.text());
                return NextResponse.json(
                    { success: false, error: 'AI 紐⑤뜽(Anthropic) ?몄텧???ㅽ뙣?덉뒿?덈떎. 愿由ъ옄?먭쾶 臾몄쓽?섏꽭??' },
                    { status: 502 }
                );
            }
            const aiData = await response.json();
            content = aiData.content?.[0]?.text || '';
        } else {
            // 湲곕낯 OpenAI API ?몄텧 (gpt-4o, gpt-4o-mini ??
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

            if (!response.ok) {
                console.error('[Analyze API] OpenAI Failure:', await response.text());
                return NextResponse.json(
                    { success: false, error: 'AI 紐⑤뜽(OpenAI) ?몄텧???ㅽ뙣?덉뒿?덈떎. 愿由ъ옄?먭쾶 臾몄쓽?섏꽭??' },
                    { status: 502 }
                );
            }

            const aiData = await response.json();
            content = aiData.choices?.[0]?.message?.content || '';
        }
        
        // 留덊겕?ㅼ슫 JSON ?ㅻ쪟 諛⑹뼱 ?뚯떛
        const cleanJson = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(cleanJson);

        if (parsedResult.riskLevel === 'UNKNOWN' || parsedResult.error) {
            console.warn('[Analyze API] OpenAI媛 ?먮Ц???앸퀎?????놁쓬.');
            return NextResponse.json(
                { success: false, error: parsedResult.error || '?먮Ц?먯꽌 媛쒖씤?뺣낫泥섎━諛⑹묠 ?댁슜???앸퀎?????놁뒿?덈떎. 鍮덉빟???섏씠吏媛 ?섏쭛?섏뿀?????덉쑝?? ?꾨Ц ?띿뒪?몃? ?섎룞?쇰줈 蹂듭궗쨌遺숈뿬?ｊ린 ???ㅼ떆 ?쒕룄??二쇱꽭??' },
                { status: 422 }
            );
        }

        return NextResponse.json({
            success: true,
            isDemoMode: false,
            message: 'AI 由ъ뼹???遺꾩꽍 ?꾨즺',
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
                { success: false, error: 'AI 遺꾩꽍 ?쒕쾭???묐떟??吏?곕릺???쒓컙 珥덇낵濡?以묐떒?섏뿀?듬땲?? ?좎떆 ???ъ“?ы빐 二쇱꽭??' },
                { status: 504 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'AI 遺꾩꽍 以??덇린移??딆? ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎. ?ъ“?щ? 吏꾪뻾??二쇱꽭??' },
            { status: 500 }
        );
    }
}
