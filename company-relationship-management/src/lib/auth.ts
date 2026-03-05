// src/lib/auth.ts — 인증 시스템 (localStorage 기반 Mock)
// ⚠️ Phase 3 전환 시: Supabase Auth + JWT로 교체 예정
// 계정 정보 단일 소스: 이 파일이 SSOT (AuthContext.tsx의 MOCK_USERS 참조 금지)

import { NextRequest } from 'next/server';
import { RoleType } from './mockStore';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: RoleType;
    companyId?: string;
    companyName?: string;
    avatar?: string;       // 프로필 이미지 URL
    // ⚠️ passwordHash: Phase 3에서 Supabase Auth 전환 후 완전 제거
    // 현재: 평문 저장 임시 방편 — 절대 프로덕션 배포 금지
    passwordHash?: string;
    loginAt: string;
}


export const AUTH_KEY = 'ibs_auth_v1';
export const SIGNUP_KEY = 'ibs_users_v1';      // 가입한 일반사용자
export const PENDING_KEY = 'ibs_pending_v1';   // 소속 승인 대기

// ── 초대코드 테이블 (본사가 IBS에서 발급) ────────────────────
export const INVITE_CODES: Record<string, { companyId: string; companyName: string; role: RoleType; expires: string }> = {
    'GYOCHON-2026': { companyId: 'c2', companyName: '(주)교촌에프앤비', role: 'client_hr', expires: '2026-12-31' },
    'NOLBOO-2026': { companyId: 'c1', companyName: '(주)놀부NBG', role: 'client_hr', expires: '2026-12-31' },
    'PARIS-2026': { companyId: 'c3', companyName: '(주)파리바게뜨', role: 'client_hr', expires: '2026-12-31' },
    'BHC-2026': { companyId: 'c4', companyName: '(주)bhc치킨', role: 'client_hr', expires: '2026-12-31' },
    'BONJUK-2026': { companyId: 'c5', companyName: '(주)본죽', role: 'client_hr', expires: '2026-12-31' },
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

// ── 소속신청 인터페이스 ────────────────────────────────────────
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

// ── 역할별 Mock 계정 (단일 소스 — SSOT) ──────────────────────────
// ⚠️ Phase 3: Supabase Auth 전환 후 이 블록 전체 제거
// 계정 기준: documents/acount.txt
// AuthContext.tsx에 별도 MOCK_USERS 정의 금지 — 반드시 이 파일만 사용
export const MOCK_ACCOUNTS: Array<{
    email: string;
    password: string; // TODO(Phase 3): bcrypt hash로 교체
    user: AuthUser;
}> = [
        // 내부 직원 계정 (ibslaw.kr 도메인 통일)
        {
            email: 'admin@ibslaw.kr',
            password: 'admin123',
            user: { id: 'u1', name: '관리자', email: 'admin@ibslaw.kr', role: 'super_admin', loginAt: '' },
        },
        {
            email: 'sales@ibslaw.kr',
            password: 'sales123',
            user: { id: 'u2', name: '이민준', email: 'sales@ibslaw.kr', role: 'sales', loginAt: '' },
        },
        {
            email: 'lawyer1@ibslaw.kr',
            password: 'lawyer123',
            user: { id: 'u3', name: '김수현 변호사', email: 'lawyer1@ibslaw.kr', role: 'lawyer', loginAt: '' },
        },
        {
            email: 'lawyer2@ibslaw.kr',
            password: 'lawyer123',
            user: { id: 'u4', name: '이지원 변호사', email: 'lawyer2@ibslaw.kr', role: 'lawyer', loginAt: '' },
        },
        {
            email: 'lit@ibslaw.kr',
            password: 'lit123',
            user: { id: 'u5', name: '박민준', email: 'lit@ibslaw.kr', role: 'litigation', loginAt: '' },
        },
        {
            email: 'hr@ibslaw.kr',
            password: 'hr123',
            user: { id: 'u6', name: 'HR 담당', email: 'hr@ibslaw.kr', role: 'hr', loginAt: '' },
        },
        {
            email: 'counselor@ibslaw.kr',
            password: 'counsel123',
            user: { id: 'u7', name: '이상담 상담사', email: 'counselor@ibslaw.kr', role: 'counselor' as RoleType, loginAt: '' },
        },
        // 고객사 HR 담당자
        {
            email: 'hr@client.com',
            password: 'hr1234',
            user: { id: 'u8', name: '박HR담당', email: 'hr@client.com', role: 'client_hr' as RoleType, companyId: 'c1', companyName: '(주)놀부NBG', loginAt: '' },
        },
    ];

// ── API 라우트용 서버사이드 세션 검증 ──────────────────────────
// middleware.ts의 쿠키 기반 인증을 API 라우트 내부에서 이중 검증하는 헬퍼
// ⚠️ Phase 3: JWT 서명 검증으로 교체 (현재는 쿠키 존재 여부만 확인)
export function requireSessionFromCookie(req: NextRequest): { ok: true; role: string } | { ok: false; status: number; error: string } {
    const sessionCookie = req.cookies.get('ibs_session') || req.cookies.get('ibs_auth');
    if (!sessionCookie?.value) {
        return { ok: false, status: 401, error: '로그인이 필요합니다.' };
    }
    const roleCookie = req.cookies.get('ibs_role');
    if (!roleCookie?.value) {
        return { ok: false, status: 401, error: '역할 정보가 없습니다. 다시 로그인하세요.' };
    }
    return { ok: true, role: roleCookie.value };
}

// 역할이 허용 목록에 포함되는지 검증
export function assertRole(role: string, allowed: RoleType[]): boolean {
    return allowed.includes(role as RoleType);
}

// 역할별 로그인 후 이동 경로
export const ROLE_HOME: Record<RoleType, string> = {
    super_admin: '/admin',
    admin: '/admin',
    sales: '/admin/leads',       // 영업팀 → 리드 목록 직행
    lawyer: '/lawyer',              // 변호사 → 검토 대기 대시보드
    litigation: '/litigation',
    general: '/general',
    hr: '/hr',
    finance: '/admin',
    counselor: '/counselor',
    client_hr: '/company-hr',    // 고객사 HR → EAP 사용현황 포털
};

// ── 세션 CRUD ──────────────────────────────────────────────────
export function getSession(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

export function setSession(user: AuthUser): void {
    if (typeof window === 'undefined') return;
    const u = { ...user, loginAt: new Date().toISOString() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
}

export function clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_KEY);
}

// ── 이메일 로그인 ─────────────────────────────────────────────
// @deprecated loginWithEmailFull 사용 권장 (가입 사용자 포함 검색)
export function loginWithEmail(
    email: string,
    password: string
): { success: true; user: AuthUser } | { success: false; error: string } {
    return loginWithEmailFull(email, password);
}

// ── 사업자번호 로그인 (고객사) ────────────────────────────────
// 실제 배포 시: Supabase 회원 테이블의 해시화된 비밀번호로 교체
const MOCK_BIZ_ACCOUNTS: Record<string, { name: string; ceo: string; password: string }> = {
    '1234567890': { name: '(주)놀부NBG', ceo: '김정래', password: '1234' },
    '2345678901': { name: '(주)교촌에프앤비', ceo: '권원강', password: '1234' },
    '3456789012': { name: '(주)파리바게뜨', ceo: '허영인', password: '1234' },
    '4567890123': { name: '(주)bhc치킨', ceo: '박현종', password: '1234' },
    '5678901234': { name: '(주)본죽', ceo: '김철호', password: '1234' },
};

export function loginWithBiz(
    bizNum: string,
    password: string
): { success: true; user: AuthUser } | { success: false; error: string } {
    const digits = bizNum.replace(/\D/g, '');
    const biz = MOCK_BIZ_ACCOUNTS[digits];
    if (!biz) {
        return { success: false, error: '등록되지 않은 사업자번호입니다.' };
    }
    // 비밀번호 검증: 등록된 비밀번호와 정확히 일치해야 함
    if (biz.password !== password) {
        return { success: false, error: '비밀번호가 올바르지 않습니다.' };
    }
    const user: AuthUser = {
        id: `biz_${digits}`,
        name: biz.ceo,
        email: `${digits}@client.ibslaw.kr`,
        role: 'client_hr' as RoleType,
        companyId: digits,
        companyName: biz.name,
        loginAt: new Date().toISOString(),
    };
    setSession(user);
    return { success: true, user };
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

// ── 가입한 일반 사용자 CRUD ──────────────────────────────────
function loadUsers(): AuthUser[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(SIGNUP_KEY) || '[]'); } catch { return []; }
}
function saveUsers(users: AuthUser[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SIGNUP_KEY, JSON.stringify(users));
}

// ── 회원가입 ─────────────────────────────────────────────────
// ⚠️ Phase 3 필수: bcryptjs로 해싱 후 저장. 현재는 mock 전용 평문 저장.
export function signUp(name: string, email: string, password: string): { success: true; user: AuthUser } | { success: false; error: string } {
    // 최소 비밀번호 길이 검증
    if (password.length < 6) {
        return { success: false, error: '비밀번호는 6자 이상이어야 합니다.' };
    }
    const all = loadUsers();
    if (all.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: '이미 가입된 이메일입니다.' };
    }
    const user: AuthUser = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID
            ? `u_${crypto.randomUUID()}`
            : `u_${Date.now()}`,
        name,
        email,
        role: 'client_hr' as RoleType,
        loginAt: new Date().toISOString(),
    };
    // TODO(Phase 3): passwordHash = await bcrypt.hash(password, 12); — 평문 저장 제거
    saveUsers([...all, { ...user, passwordHash: password }]);
    setSession(user);
    return { success: true, user };
}

// ── 이메일 로그인 (가입 사용자 포함) ─────────────────────────
export function loginWithEmailFull(email: string, password: string): { success: true; user: AuthUser } | { success: false; error: string } {
    // 1) 내부 직원 계정 먼저 체크
    const account = MOCK_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
    if (account) {
        const user = { ...account.user, loginAt: new Date().toISOString() };
        setSession(user);
        return { success: true, user };
    }
    // 2) 일반 가입 계정 체크
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (u as AuthUser & { passwordHash?: string }).passwordHash === password);
    if (found) {
        const user = { ...found, loginAt: new Date().toISOString() };
        setSession(user);
        return { success: true, user };
    }
    return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
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

// ── 소속신청 (HR 승인 대기) ───────────────────────────────────
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
    // 승인 시 세션 사용자를 해당 회사 소속으로 업데이트
    const pending = list[idx];
    const users = loadUsers();
    const uIdx = users.findIndex(u => u.email === pending.email);
    if (uIdx !== -1) {
        users[uIdx].companyId = pending.companyId;
        users[uIdx].companyName = pending.companyName;
        saveUsers(users);
    }
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

// 초대코드/사업자번호 인증 후 세션 소속 업데이트
export function updateSessionAffiliation(companyId: string, companyName: string) {
    const session = getSession();
    if (!session) return;
    const updated = { ...session, companyId, companyName };
    setSession(updated);
    // 가입 DB도 업데이트
    const users = loadUsers();
    const idx = users.findIndex(u => u.email === session.email);
    if (idx !== -1) { users[idx].companyId = companyId; users[idx].companyName = companyName; saveUsers(users); }
}
