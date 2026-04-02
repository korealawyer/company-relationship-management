import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { Client } from '@upstash/qstash';

export const maxDuration = 15; // Publisher는 짧게 유지

export async function POST(request: NextRequest) {
    let body: { url?: string; privacyUrl?: string; homepageUrl?: string; companyId?: string; manualText?: string; systemPrompt?: string; model?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    // 인증 검증
    const auth = await requireSessionFromCookie(request);
    if (!auth.ok) {
        return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }
    // const user = ... wait, we used user?.name later. auth only has userId and role.
    const userId = 'userId' in auth ? auth.userId : null;

    const { companyId, manualText, systemPrompt, model } = body;
    const paramUrl = Object.values(body).find((val: any) => typeof val === 'string' && val.startsWith('http')) as string || '';
    const homepageUrl = body.homepageUrl || paramUrl;
    const privacyUrl = body.privacyUrl || '';

    if (!homepageUrl && !privacyUrl && !companyId && !manualText) {
        return NextResponse.json({ success: false, error: '분석에 필요한 식별 주소나 텍스트가 없습니다.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    if (companyId && supabase) {
        // UI를 pending/crawling 상태로 변경
        await supabase.from('companies').update({ status: 'crawling' }).eq('id', companyId);
        
        // 이벤트 로그 기록
        await supabase.from('auto_logs').insert({
            company_id: companyId,
            company_name: userId || '시스템',
            type: 'ai_analysis',
            label: '분석 요청 접수',
            detail: '백그라운드 큐에 분석 작업을 할당했습니다.',
            created_at: new Date().toISOString()
        });
    }

    const qstashToken = process.env.QSTASH_TOKEN;
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const destinationUrl = `${baseUrl}/api/analyze/worker`;

    // 로컬호스트(개발 환경)에서는 외부 QStash가 localhost로 돌아올 수 없으므로 직접 워커를 비동기 호출합니다.
    if (baseUrl.includes('localhost')) {
        fetch(destinationUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, authName: userId || '시스템', isLocalBypass: true })
        }).catch(e => console.error('[Analyze Publisher] Local invoke error:', e));
        
        console.log(`[Analyze Publisher] Localhost detected. Bypassed QStash and directly invoked worker.`);
        return NextResponse.json({ success: true, message: '로컬 환경 - 백그라운드 분석이 시작되었습니다.' });
    }

    if (!qstashToken) {
        console.error('[Analyze Publisher] QSTASH_TOKEN 이 설정되지 않았습니다.');
        return NextResponse.json({ success: false, error: '서버 환경변수 미설정 (QSTASH_TOKEN).' }, { status: 500 });
    }

    const qstash = new Client({ token: qstashToken });

    try {
        // QStash를 이용한 비동기 작업 발행
        const messageId = await qstash.publishJSON({
            url: destinationUrl,
            body: {
                ...body,
                authName: userId || '시스템'
            },
            retries: 0 // 분석 작업은 재시도 없이 1번만 실패처리
        });

        console.log(`[Analyze Publisher] QStash 백그라운드 작업 발행 성공. messageId: ${messageId.messageId}`);
    } catch (e: any) {
        console.error('[Analyze Publisher] QStash 발행 실패:', e);
        if (companyId && supabase) {
            await supabase.from('companies').update({ status: 'pending' }).eq('id', companyId);
            await supabase.from('auto_logs').insert({
                company_id: companyId,
                company_name: userId || '시스템',
                type: 'ai_analysis',
                label: '요청 실패',
                detail: `QStash 큐 발행 에러: ${e.message}`,
                created_at: new Date().toISOString()
            });
        }
        return NextResponse.json({ success: false, error: '백그라운드 작업 예약에 실패했습니다.' }, { status: 500 });
    }

    // 클라이언트에는 즉각적으로 성공을 응답
    return NextResponse.json({ success: true, message: '분석 작업이 백그라운드에서 시작되었습니다.' });
}
