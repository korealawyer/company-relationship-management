import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { companyName, contactName, contactEmail, contactPhone, ceoName, bizNumber, planId } = body;

        // 필수 항목 검증
        if (!companyName || !contactEmail || !planId) {
            return NextResponse.json({ error: '필수 입력 항목이 누락되었습니다.' }, { status: 400 });
        }

        // Supabase Service Role 인스턴스 (RLS 무시하고 모두 삽입/조회 가능)
        const supabase = getServiceSupabase();
        
        if (!supabase) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
            return NextResponse.json({ error: '서버 환경 설정 오류: 데이터베이스를 연결할 수 없습니다.' }, { status: 500 });
        }

        // 1. 해당 회사명이나 이메일로 이미 등록된 기업(company)이 있는지 확인
        // 큰따옴표 이스케이프 및 안전한 데이터 조회를 위해 분리된 쿼리 또는 텍스트 검색 사용 (여기서는 name/email 각각 쿼리 실행 후 병합 방식을 권장하지만, 일단 이메일 매칭을 최우선으로 시도)
        const { data: existingCompanies, error: searchError } = await supabase
            .from('companies')
            .select('id, name, email')
            .eq('email', contactEmail);

        if (searchError) {
            console.error('Company search error:', searchError);
            return NextResponse.json({ error: '기업 조회 중 오류 발생' }, { status: 500 });
        }

        let companyId = '';

        // CRM_PLAN_MAP 매핑
        const planMap: Record<string, string> = {
            'plus': 'starter',
            'pro': 'standard',
            'enterprise': 'premium'
        };
        const crmPlan = planMap[planId] || 'standard';

        if (existingCompanies && existingCompanies.length > 0) {
            // 이미 존재하는 기업 매칭
            companyId = existingCompanies[0].id;
            
            // 기업 플랜 업데이트
            const { error: updateError } = await supabase
                .from('companies')
                .update({ plan: crmPlan, status: 'subscribed' })
                .eq('id', companyId);
                
            if (updateError) {
                console.error('Company plan update error:', updateError);
            }
        } else {
            // 기존 기업이 없으면 리드로 신규 생성
            const { data: newCompany, error: createError } = await supabase
                .from('companies')
                .insert([{
                    name: companyName,
                    email: contactEmail,
                    phone: contactPhone || '',
                    biz_type: '일반법인',
                    manager_name: contactName || ceoName || '',
                    plan: crmPlan,
                    status: 'subscribed',
                    source: 'checkout'
                }])
                .select()
                .single();

            if (createError || !newCompany) {
                console.error('Company creation error:', createError);
                return NextResponse.json({ error: '기업 생성 중 오류 발생' }, { status: 500 });
            }
            companyId = newCompany.id;
        }

        // 2. Subscriptions 테이블에 구독 기록 추가 (선택사항이나 기록유지에 좋음)
        // 금액은 대략 planId에 맞춰 기본값 지정
        const amountMap: Record<string, number> = {
            'plus': 299000,
            'pro': 499000,
            'enterprise': 999000
        };
        
        await supabase.from('subscriptions').insert([{
            company_id: companyId,
            plan: crmPlan === 'starter' ? 'basic' : crmPlan,
            amount: amountMap[planId] || 0,
            status: 'active',
            started_at: new Date().toISOString()
        }]);

        // 성공 응답
        return NextResponse.json({ success: true, companyId });

    } catch (err: any) {
        console.error('Checkout API error:', err);
        return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
