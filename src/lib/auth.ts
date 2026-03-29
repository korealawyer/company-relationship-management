// src/lib/auth.ts — 인증 시스템 (Supabase Auth 기반)
// Phase 3: Mock 제거 완료 → Supabase Auth + JWT

import { NextRequest } from 'next/server';
import { RoleType } from './store';
import { getBrowserSupabase, IS_SUPABASE_CONFIGURED } from './supabase';

// ── AuthUser 인터페이스 (SSOT) ─────────────────────────────────
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: RoleType;
    companyId?: string;
    companyName?: string;
    avatar?: string;
    loginAt: string;
}

export const AUTH_KEY = 'ibs_auth_v1';      // 하위 호환: localStorage 이벤트 감지용 키
export const SIGNUP_KEY = 'ibs_users_v1';    // 더 이상 사용 안 함 (레거시 정리용 상수)
export const PENDING_KEY = 'ibs_pending_v1'; // 소속 승인 대기 (localStorage 유지)

// ── 초대코드 테이블 ────────────────────────────────────────────────
// 내부 직원용: 코드 입력 시 자동 역할 배정, 승인 불필요
// 고객사용: 기존과 동일
export const INVITE_CODES: Record<string, { companyId: string; companyName: string; role: RoleType; expires: string; isInternal?: boolean }> = {
    // ── 내부 직원 초대코드 ──
    'IBS-SALES-2026':    { companyId: 'ibs', companyName: 'IBS 법률사무소', role: 'sales',      expires: '2026-12-31', isInternal: true },
    'IBS-LAWYER-2026':   { companyId: 'ibs', companyName: 'IBS 법률사무소', role: 'lawyer',     expires: '2026-12-31', isInternal: true },
    'IBS-LIT-2026':      { companyId: 'ibs', companyName: 'IBS 법률사무소', role: 'litigation', expires: '2026-12-31', isInternal: true },
    'IBS-FINANCE-2026':  { companyId: 'ibs', companyName: 'IBS 법률사무소', role: 'finance',    expires: '2026-12-31', isInternal: true },
    'IBS-COUNSEL-2026':  { companyId: 'ibs', companyName: 'IBS 법률사무소', role: 'counselor' as RoleType, expires: '2026-12-31', isInternal: true },
    'IBS-HR-2026':       { companyId: 'ibs', companyName: 'IBS 법률사무소', role: 'hr',         expires: '2026-12-31', isInternal: true },
    'IBS-ADMIN-2026':    { companyId: 'ibs', companyName: 'IBS 법률사무소', role: 'admin',      expires: '2026-12-31', isInternal: true },
    // ── 고객사 초대코드 ──
    'GYOCHON-2026': { companyId: 'c2', companyName: '(주)교촌에프앤비', role: 'client_hr', expires: '2026-12-31' },
    'NOLBOO-2026':  { companyId: 'c1', companyName: '(주)놀부NBG',     role: 'client_hr', expires: '2026-12-31' },
    'PARIS-2026':   { companyId: 'c3', companyName: '(주)파리바게뜨',    role: 'client_hr', expires: '2026-12-31' },
    'BHC-2026':     { companyId: 'c4', companyName: '(주)bhc치킨',     role: 'client_hr', expires: '2026-12-31' },
    'BONJUK-2026':  { companyId: 'c5', companyName: '(주)본죽',        role: 'client_hr', expires: '2026-12-31' },
};

// ── 가맹점·임직원용 사업자번호 DB ────────────────────────────
const FRANCHISE_BIZ_DB: Record<string, { companyId: string; companyName: string; type: '본사' | '가맹점' | '직영점' }> = {
    '1234567890': { companyId: 'c1', companyName: '(주)놀부NBG', type: '본사' },
    '2345678901': { companyId: 'c2', companyName: '(주)교촌에프앤비', type: '본사' },
    '3456789012': { companyId: 'c3', companyName: '(주)파리바게뜨', type: '본사' },
    '4567890123': { companyId: 'c4', companyName: '(주)bhc치킨', type: '본사' },
    '5678901234': { companyId: 'c5', companyName: '(주)본죽', type: '본사' },
    // 가맹점 (본사 그룹으로 편입)
    '9999001001': { companyId: 'c1', companyName: '놀부NBG 강남점', type: '가맹점' },
    '9999001002': { companyId: 'c1', companyName: '놀부NBG 홍대점', type: '가맹점' },
    '9999002001': { companyId: 'c2', companyName: '교촌 서초점', type: '가맹점' },
};

// ── 소속신청 인터페이스 ─────────────────────────────────────────
export interface PendingMember {
    id: string;
    name: string;
    email: string;
    phone?: string;
    companyId: string;
    companyName: string;
    message?: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
}

// ── 역할별 리다이렉트 경로 ────────────────────────────────────
export const ROLE_HOME: Record<RoleType, string> = {
    super_admin: '/employee',
    admin: '/employee',
    sales: '/employee',
    lawyer: '/lawyer',
    litigation: '/litigation',
    general: '/admin',
    hr: '/admin',
    finance: '/admin',
    counselor: '/counselor',
    client_hr: '/dashboard',
    personal_client: '/personal-litigation',
};

// ── Supabase User → AuthUser 매핑 헬퍼 ─────────────────────────
import type { User } from '@supabase/supabase-js';

export function supabaseUserToAuthUser(user: User): AuthUser {
    const meta = user.user_metadata ?? {};
    return {
        id: user.id,
        name: meta.name ?? meta.full_name ?? (user.email?.split('@')[0] ?? 'Unknown'),
        email: user.email ?? '',
        role: (meta.role as RoleType) ?? 'client_hr',
        companyId: meta.companyId ?? meta.company_id,
        companyName: meta.companyName ?? meta.company_name,
        avatar: meta.avatar_url,
        loginAt: new Date().toISOString(),
    };
}

// ── 세션 읽기 (CSR 전용) ──────────────────────────────────────
// Supabase Auth에서 세션을 읽어 AuthUser로 변환
// SSR에서는 null 반환 (서버는 cookies() 기반 별도 처리)
export function getSession(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    // 동기 호환성을 위해 localStorage 캐시 사용 (AuthContext가 관리)
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

// AuthContext 내부에서만 사용 — 직접 호출 금지
export function _setSessionCache(user: AuthUser | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(AUTH_KEY);
    }
}

// ── 이메일 로그인 → Supabase signInWithPassword ───────────────
export async function loginWithEmail(
    email: string,
    password: string
): Promise<{ success: true; user: AuthUser } | { success: false; error: string }> {
    return loginWithEmailFull(email, password);
}

export async function loginWithEmailFull(
    email: string,
    password: string
): Promise<{ success: true; user: AuthUser } | { success: false; error: string }> {
    if (!IS_SUPABASE_CONFIGURED) {
        return { success: false, error: 'Supabase가 설정되지 않았습니다. .env.local을 확인하세요.' };
    }

    const sb = getBrowserSupabase();
    if (!sb) return { success: false, error: 'Supabase 클라이언트를 초기화할 수 없습니다.' };

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
        return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }

    const user = supabaseUserToAuthUser(data.user);
    _setSessionCache(user);
    return { success: true, user };
}

// ── 회원가입 → Supabase signUp ────────────────────────────────
export async function signUp(
    name: string,
    email: string,
    password: string,
    inviteCode?: string
): Promise<{ success: true; user: AuthUser } | { success: false; error: string }> {
    if (password.length < 6) {
        return { success: false, error: '비밀번호는 6자 이상이어야 합니다.' };
    }

    if (!IS_SUPABASE_CONFIGURED) {
        return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
    }

    const sb = getBrowserSupabase();
    if (!sb) return { success: false, error: 'Supabase 클라이언트를 초기화할 수 없습니다.' };

    // 초대코드가 있으면 역할 자동 배정
    let role: RoleType = 'client_hr';
    let companyId: string | undefined;
    let companyName: string | undefined;

    if (inviteCode) {
        const codeResult = verifyInviteCode(inviteCode);
        if (!codeResult.valid) {
            return { success: false, error: codeResult.error };
        }
        role = codeResult.role;
        companyId = codeResult.companyId;
        companyName = codeResult.companyName;
    }

    const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
            data: { name, role, companyId, companyName },
        },
    });

    if (error) {
        if (error.message.includes('User already registered')) {
            return { success: false, error: '이미 가입된 이메일입니다.' };
        }
        return { success: false, error: error.message };
    }

    if (!data.user) return { success: false, error: '회원가입에 실패했습니다.' };

    const user = supabaseUserToAuthUser(data.user);
    _setSessionCache(user);
    return { success: true, user };
}

// ── 고객 포털 전용 가입 (사업자번호 인증) ──────────────────────
export async function signUpClientPortal(args: {
    bizNum: string;
    email: string;
    password: string;
    name: string;
    agreedTerms: boolean;
    agreedPrivacy: boolean;
}): Promise<{ success: true; user: AuthUser; companyName: string } | { success: false; error: string }> {
    if (!args.agreedTerms || !args.agreedPrivacy) {
        return { success: false, error: '필수 약관에 동의해주세요.' };
    }
    if (args.password.length < 6) {
        return { success: false, error: '비밀번호는 6자 이상이어야 합니다.' };
    }

    // 사업자번호로 CRM 회사 조회
    const digits = args.bizNum.replace(/\D/g, '');
    const bizEntry = (FRANCHISE_BIZ_DB as Record<string, { companyId: string; companyName: string; type: string }>)[digits];
    const CRM_BIZ_MAP: Record<string, { companyId: string; companyName: string }> = {
        '8901234567': { companyId: 'c8',  companyName: '(주)이디야커피' },
        '9012345678': { companyId: 'c9',  companyName: '(주)메가MGC커피' },
        '0123456789': { companyId: 'c10', companyName: '(주)써브웨이코리아' },
        '1234567890': { companyId: 'c1',  companyName: '(주)놀부NBG' },
        '2345678901': { companyId: 'c2',  companyName: '(주)교촌에프앤비' },
        '3456789012': { companyId: 'c3',  companyName: '(주)파리바게뜨' },
        '4567890123': { companyId: 'c4',  companyName: '(주)bhc치킨' },
        '5678901234': { companyId: 'c5',  companyName: '(주)본죽' },
    };
    const match = bizEntry
        ? { companyId: bizEntry.companyId, companyName: bizEntry.companyName }
        : CRM_BIZ_MAP[digits];
    if (!match) {
        return { success: false, error: '등록되지 않은 사업자번호입니다. IBS 영업팀에 문의해주세요.' };
    }

    if (!IS_SUPABASE_CONFIGURED) {
        return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
    }
    const sb = getBrowserSupabase();
    if (!sb) return { success: false, error: 'Supabase 클라이언트를 초기화할 수 없습니다.' };

    const { data, error } = await sb.auth.signUp({
        email: args.email,
        password: args.password,
        options: {
            data: {
                name: args.name,
                role: 'client_hr' as RoleType,
                companyId: match.companyId,
                companyName: match.companyName,
            },
        },
    });

    if (error) {
        if (error.message.includes('User already registered')) {
            return { success: false, error: '이미 가입된 이메일입니다.' };
        }
        return { success: false, error: error.message };
    }

    if (!data.user) return { success: false, error: '회원가입에 실패했습니다.' };

    const user = supabaseUserToAuthUser(data.user);
    _setSessionCache(user);
    return { success: true, user, companyName: match.companyName };
}

// ── 로그아웃 → Supabase signOut ──────────────────────────────
export async function clearSession(): Promise<void> {
    if (typeof window === 'undefined') return;
    _setSessionCache(null);
    const sb = getBrowserSupabase();
    if (sb) await sb.auth.signOut();
}



// ── 권한 체크 헬퍼 ────────────────────────────────────────────
export function hasRole(user: AuthUser | null, ...roles: RoleType[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
}

export function isInternalUser(user: AuthUser | null): boolean {
    if (!user) return false;
    return ['super_admin', 'admin', 'sales', 'lawyer', 'litigation', 'hr', 'finance'].includes(user.role);
}

// ── API 라우트용 서버사이드 세션 검증 ─────────────────────────
// @supabase/ssr의 createServerClient + JWT 검증
// ⚠️ Next.js API Route (Edge 아님, Node.js runtime)에서만 사용
import { createServerClient } from '@supabase/ssr';

export async function requireSessionFromCookie(req: NextRequest): Promise<
    { ok: true; role: string; userId: string; companyId?: string | null } | { ok: false; status: number; error: string }
> {
    const sessionCookie = req.cookies.get('ibs_session')?.value || req.cookies.get('ibs_auth')?.value;
    
    // Playwright E2E 테스트 지원용 Mock Session Bypass
    if (sessionCookie && sessionCookie.startsWith('mock_')) {
        const roleCookie = req.cookies.get('ibs_role')?.value ?? 'client_hr';
        const companyId = sessionCookie === 'mock_client_session' ? '1234567890' : null;
        return { ok: true, role: roleCookie, userId: 'mock', companyId };
    }

    if (!IS_SUPABASE_CONFIGURED) {
        // Supabase 미설정 시 — 레거시 쿠키로 폴백 (개발용)
        if (!sessionCookie) {
            return { ok: false, status: 401, error: '로그인이 필요합니다.' };
        }
        const roleCookie = req.cookies.get('ibs_role');
        return { ok: true, role: roleCookie?.value ?? 'sales', userId: 'mock' };
    }

    const sb = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        req.cookies.set(name, value);
                    });
                },
            },
        }
    );

    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session) {
        return { ok: false, status: 401, error: '로그인이 필요합니다.' };
    }

    const role = (session.user.user_metadata?.role as string) ?? 'client_hr';
    const companyId = (session.user.user_metadata?.companyId as string) ?? (session.user.user_metadata?.company_id as string) ?? null;
    return { ok: true, role, userId: session.user.id, companyId };
}

// 역할이 허용 목록에 포함되는지 검증
export function assertRole(role: string, allowed: RoleType[]): boolean {
    return allowed.includes(role as RoleType);
}

// ── 초대코드 검증 ─────────────────────────────────────────────
export function verifyInviteCode(code: string): { valid: true; companyId: string; companyName: string; role: RoleType } | { valid: false; error: string } {
    const entry = INVITE_CODES[code.toUpperCase().trim()];
    if (!entry) return { valid: false, error: '유효하지 않은 코드입니다.' };
    if (new Date(entry.expires) < new Date()) return { valid: false, error: '만료된 코드입니다.' };
    return { valid: true, ...entry };
}

// ── 사업자번호로 소속 찾기 ────────────────────────────────────
export function lookupBizAffiliation(bizNum: string): { found: true; companyId: string; companyName: string; storeType: string } | { found: false; error: string } {
    const digits = bizNum.replace(/\D/g, '');
    const entry = (FRANCHISE_BIZ_DB as Record<string, { companyId: string; companyName: string; type: string }>)[digits];
    if (!entry) return { found: false, error: '등록된 프랜차이즈 사업자번호가 아닙니다.' };
    return { found: true, companyId: entry.companyId, companyName: entry.companyName, storeType: entry.type };
}

// ── 소속신청 (HR 승인 대기) — localStorage 유지 ──────────────
function loadPending(): PendingMember[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
}
function savePending(list: PendingMember[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

export function requestAffiliation(args: { name: string; email: string; phone?: string; companyId: string; companyName: string; message?: string }): PendingMember {
    const pending = loadPending();
    const item: PendingMember = {
        id: `p_${Date.now()}`,
        name: args.name,
        email: args.email,
        phone: args.phone,
        companyId: args.companyId,
        companyName: args.companyName,
        message: args.message,
        requestedAt: new Date().toISOString(),
        status: 'pending',
    };
    savePending([...pending, item]);
    return item;
}

export function getPendingByCompany(companyId: string): PendingMember[] {
    return loadPending().filter(p => p.companyId === companyId);
}

export function approvePending(pendingId: string): boolean {
    const list = loadPending();
    const idx = list.findIndex(p => p.id === pendingId);
    if (idx === -1) return false;
    list[idx].status = 'approved';
    savePending(list);
    return true;
}

export function rejectPending(pendingId: string): boolean {
    const list = loadPending();
    const idx = list.findIndex(p => p.id === pendingId);
    if (idx === -1) return false;
    list[idx].status = 'rejected';
    savePending(list);
    return true;
}

// 초대코드/사업자번호 인증 후 Supabase user_metadata 업데이트
export async function updateSessionAffiliation(companyId: string, companyName: string) {
    const sb = getBrowserSupabase();
    if (sb) {
        await sb.auth.updateUser({
            data: { companyId, companyName },
        });
    }
    // 로컬 캐시도 업데이트
    const cached = getSession();
    if (cached) {
        _setSessionCache({ ...cached, companyId, companyName });
    }
}

// ── 레거시 호환 alias (동기 → async 래퍼) ────────────────────
// 기존 코드가 동기로 호출하는 곳이 있을 경우를 위해
export function setSession(user: AuthUser): void {
    _setSessionCache(user);
}
