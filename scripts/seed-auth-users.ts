/**
 * scripts/seed-auth-users.ts
 *
 * Supabase Auth에 테스트 계정 4개를 생성합니다.
 * 실행: npx ts-node --project tsconfig.json --skip-project scripts/seed-auth-users.ts
 *
 * 필요 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (← Supabase 대시보드 → Settings → API)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.');
    console.error('   .env.local에 SUPABASE_SERVICE_ROLE_KEY를 추가하세요.');
    console.error('   (Supabase 대시보드 → Project Settings → API → service_role key)');
    process.exit(1);
}

// Service Role 클라이언트 (Admin API 사용)
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

interface SeedAccount {
    email: string;
    password: string;
    name: string;
    role: string;
    companyId?: string;
    companyName?: string;
}

const SEED_ACCOUNTS: SeedAccount[] = [
    {
        email: 'admin@ibslaw.kr',
        password: 'admin123',
        name: '관리자',
        role: 'super_admin',
    },
    {
        email: 'sales@ibslaw.kr',
        password: 'sales123',
        name: '이민준',
        role: 'sales',
    },
    {
        email: 'lawyer1@ibslaw.kr',
        password: 'lawyer123',
        name: '김수현 변호사',
        role: 'lawyer',
    },
    {
        email: 'hr@client.com',
        password: 'hr1234',
        name: '박HR담당',
        role: 'client_hr',
        companyId: 'c1',
        companyName: '(주)놀부NBG',
    },
    {
        email: 'personal@client.com',
        password: 'personal123',
        name: '김개인',
        role: 'personal_client',
    },
    {
        email: 'ceo@client.com',
        password: 'ceo1234',
        name: '이대표',
        role: 'client_hr',
        companyName: '(주)스타트업',
    },
    {
        email: 'finance@ibslaw.kr',
        password: 'finance123',
        name: '이회계',
        role: 'finance',
    },
    {
        email: 'personal2@client.com',
        password: 'personal1234',
        name: '박개인',
        role: 'personal_client',
    },
    {
        email: 'litigation@ibslaw.kr',
        password: 'litigation123',
        name: '최송무',
        role: 'litigation',
    },
];

async function seed() {
    console.log('🌱 Supabase Auth 시드 시작...\n');

    for (const account of SEED_ACCOUNTS) {
        // 이미 존재하는 계정인지 확인
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const exists = existingUsers?.users?.find(u => u.email === account.email);

        if (exists) {
            // 이미 존재 → user_metadata 업데이트
            console.log(`⚠️  ${account.email} 이미 존재 → metadata 업데이트`);
            const { error } = await supabase.auth.admin.updateUserById(exists.id, {
                user_metadata: {
                    name: account.name,
                    role: account.role,
                    ...(account.companyId && { companyId: account.companyId }),
                    ...(account.companyName && { companyName: account.companyName }),
                },
            });
            if (error) {
                console.error(`   ❌ 업데이트 실패: ${error.message}`);
            } else {
                console.log(`   ✅ 업데이트 완료 (role: ${account.role})`);
            }
            
            // Sync to public.users
            await supabase.from('users').upsert({
                id: exists.id,
                email: account.email,
                name: account.name,
                role: account.role || 'client_hr',
            });
        } else {
            // 신규 생성
            const { data, error } = await supabase.auth.admin.createUser({
                email: account.email,
                password: account.password,
                email_confirm: true, // 이메일 확인 없이 바로 활성화
                user_metadata: {
                    name: account.name,
                    role: account.role,
                    ...(account.companyId && { companyId: account.companyId }),
                    ...(account.companyName && { companyName: account.companyName }),
                },
            });

            if (error) {
                console.error(`❌ ${account.email} 생성 실패: ${error.message}`);
            } else {
                console.log(`✅ ${account.email} 생성 완료`);
                console.log(`   ID: ${data.user?.id}`);
                console.log(`   role: ${account.role}`);
                
                // Sync to public.users
                await supabase.from('users').upsert({
                    id: data.user!.id,
                    email: account.email,
                    name: account.name,
                    role: account.role || 'client_hr',
                });
            }
        }
        console.log('');
    }

    console.log('🎉 시드 완료!');
    console.log('\n테스트 계정:');
    console.log('  admin@ibslaw.kr     / admin123    → super_admin');
    console.log('  sales@ibslaw.kr     / sales123    → sales');
    console.log('  lawyer1@ibslaw.kr   / lawyer123   → lawyer');
    console.log('  hr@client.com       / hr1234      → client_hr (놀부NBG)');
    console.log('  ceo@client.com      / ceo1234     → client_hr ((주)스타트업)');
    console.log('  personal@client.com / personal123 → personal_client (개인회원)');
    console.log('  personal2@client.com/ personal1234→ personal_client (개인회원)');
    console.log('  finance@ibslaw.kr   / finance123  → finance (회계팀)');
    console.log('  litigation@ibslaw.kr/ litigation123→ litigation (송무팀)');
}

seed().catch(console.error);
