import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie, assertRole } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/admin/users — 전체 유저 목록
export async function GET(request: NextRequest) {
    const auth = await requireSessionFromCookie(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!assertRole(auth.role, ['super_admin'])) {
        return NextResponse.json({ error: '슈퍼 어드민 권한이 필요합니다.' }, { status: 403 });
    }

    const sb = getServiceSupabase();
    if (!sb) return NextResponse.json({ error: 'Service Role Key가 설정되지 않았습니다.' }, { status: 500 });

    try {
        const { data, error } = await sb.auth.admin.listUsers({ perPage: 200 });
        if (error) throw error;

        const users = (data.users || []).map(u => ({
            id: u.id,
            email: u.email ?? '',
            name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? '',
            role: u.user_metadata?.role ?? 'client_hr',
            companyId: u.user_metadata?.companyId ?? u.user_metadata?.company_id ?? '',
            companyName: u.user_metadata?.companyName ?? u.user_metadata?.company_name ?? '',
            createdAt: u.created_at,
            lastSignIn: u.last_sign_in_at ?? null,
            emailConfirmed: !!u.email_confirmed_at,
        }));

        return NextResponse.json({ success: true, users });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '유저 목록 조회 실패' }, { status: 500 });
    }
}

// PATCH /api/admin/users — 유저 정보 수정 (이름, 역할, 비밀번호 등)
export async function PATCH(request: NextRequest) {
    const auth = await requireSessionFromCookie(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!assertRole(auth.role, ['super_admin'])) {
        return NextResponse.json({ error: '슈퍼 어드민 권한이 필요합니다.' }, { status: 403 });
    }

    const sb = getServiceSupabase();
    if (!sb) return NextResponse.json({ error: 'Service Role Key가 설정되지 않았습니다.' }, { status: 500 });

    try {
        const body = await request.json();
        const { userId, name, role, companyId, companyName, password, email } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId는 필수입니다.' }, { status: 400 });
        }

        // 업데이트할 항목 구성
        const updatePayload: any = {};
        const metadataUpdate: any = {};

        if (name !== undefined) metadataUpdate.name = name;
        if (role !== undefined) metadataUpdate.role = role;
        if (companyId !== undefined) metadataUpdate.companyId = companyId;
        if (companyName !== undefined) metadataUpdate.companyName = companyName;

        if (Object.keys(metadataUpdate).length > 0) {
            updatePayload.user_metadata = metadataUpdate;
        }
        if (password) {
            updatePayload.password = password;
        }
        if (email) {
            updatePayload.email = email;
        }

        const { data, error } = await sb.auth.admin.updateUserById(userId, updatePayload);
        if (error) throw error;

        // public.users 테이블도 동기화
        const syncData: any = {};
        if (name !== undefined) syncData.name = name;
        if (role !== undefined) syncData.role = role;
        if (email) syncData.email = email;
        if (Object.keys(syncData).length > 0) {
            await sb.from('users').update(syncData).eq('id', userId);
        }

        return NextResponse.json({
            success: true,
            message: '유저 정보가 수정되었습니다.',
            user: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name,
                role: data.user.user_metadata?.role,
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '유저 수정 실패' }, { status: 500 });
    }
}

// DELETE /api/admin/users — 유저 삭제
export async function DELETE(request: NextRequest) {
    const auth = await requireSessionFromCookie(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!assertRole(auth.role, ['super_admin'])) {
        return NextResponse.json({ error: '슈퍼 어드민 권한이 필요합니다.' }, { status: 403 });
    }

    const sb = getServiceSupabase();
    if (!sb) return NextResponse.json({ error: 'Service Role Key가 설정되지 않았습니다.' }, { status: 500 });

    try {
        const { userId } = await request.json();
        if (!userId) return NextResponse.json({ error: 'userId는 필수입니다.' }, { status: 400 });

        const { error } = await sb.auth.admin.deleteUser(userId);
        if (error) throw error;

        // public.users에서도 삭제
        await sb.from('users').delete().eq('id', userId);

        return NextResponse.json({ success: true, message: '유저가 삭제되었습니다.' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '유저 삭제 실패' }, { status: 500 });
    }
}
