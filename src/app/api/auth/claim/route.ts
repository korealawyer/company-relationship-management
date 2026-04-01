import { NextResponse } from 'next/server';
import { supabaseCompanyStore } from '@/lib/supabaseStore';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { claimId, password, agreeMarketing } = await req.json();

        if (!claimId || !password) {
            return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
        }

        // 1. 해당 리드(Company) 조회
        const company = await supabaseCompanyStore.getById(claimId);
        if (!company) {
            return NextResponse.json({ error: '유효하지 않은 링크이거나 회사를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 2. 고객 이메일 확인
        // DB 테이블의 contact_email 컬럼은 스토어에서 email 또는 contactEmail로 매핑됩니다.
        const targetEmail = company.email || (company as any).contactEmail;
        if (!targetEmail) {
            return NextResponse.json({ error: '담당자 이메일이 등록되지 않았습니다. 담당자 연락처를 먼저 추가해주세요.' }, { status: 400 });
        }

        // 3. Supabase Admin API 호출 (Service Role 필요)
        const sbAdmin = getServiceSupabase()?.auth.admin;
        if (!sbAdmin) {
            return NextResponse.json({ error: '인증 서버(Admin) 접근에 실패했습니다.' }, { status: 500 });
        }

        const userMetaData = { 
            role: 'client_hr', 
            companyId: company.id, 
            companyName: company.name, 
            agreeMarketing,
            updatedFromClaim: true 
        };

        // 4. 먼저 기존 사용자가 있는지 검색
        // (주의: 사용자 수가 매우 많아지면 listUsers에 한계가 있을 수 있으나, 단일 기업 대상으로는 대체로 문제없음.
        // 보다 나은 방법은 email 기반 검색이지만, 공식 js 라이브러리 지원이 제한적일 땐 pagination이나 필터 방식을 씁니다.
        // 현재는 생성 시도 후 중복일 경우 처리하는 방식을 권장합니다.)
        
        let existingUserId = null;
        
        const { data: listRes, error: listErr } = await sbAdmin.listUsers({ perPage: 1000 });
        if (!listErr && listRes.users) {
            const foundUser = listRes.users.find(u => u.email === targetEmail);
            if (foundUser) {
                existingUserId = foundUser.id;
            }
        }

        if (existingUserId) {
            // 사용자 존재 -> 비밀번호 업데이트 처리 (재초대 / 기존 계정 비밀번호 초기화 겸용)
            const { error: updateErr } = await sbAdmin.updateUserById(existingUserId, {
                password: password,
                user_metadata: userMetaData
            });
            if (updateErr) {
                console.error("User update error:", updateErr);
                return NextResponse.json({ error: '비밀번호를 업데이트하는 과정에서 오류가 발생했습니다.' }, { status: 500 });
            }
        } else {
            // 새 사용자 생성
            const { error: createErr } = await sbAdmin.createUser({
                email: targetEmail,
                password: password,
                email_confirm: true,
                user_metadata: userMetaData
            });
            if (createErr) {
                console.error("User create error:", createErr);
                return NextResponse.json({ error: createErr.message || '계정 생성에 실패했습니다.' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, email: targetEmail }, { status: 200 });

    } catch (e: any) {
        console.error("API /auth/claim Error:", e);
        return NextResponse.json({ error: '계정 설정 중 알 수 없는 오류가 발생했습니다.' }, { status: 500 });
    }
}
