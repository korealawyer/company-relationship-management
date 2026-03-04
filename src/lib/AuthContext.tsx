'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── 사용자 타입 ───────────────────────────────────────────────
export type RoleType =
    | 'super_admin' | 'admin' | 'sales' | 'lawyer'
    | 'litigation' | 'counselor' | 'client_hr'
    | 'hr' | 'general' | 'finance';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: RoleType;
    companyId?: string;
    companyName?: string;
    plan?: 'basic' | 'pro' | 'premium' | 'none';
    phone?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    loginWithBizNo: (bizNo: string, password: string) => Promise<{ error?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
}

// ── Mock 사용자 데이터 ────────────────────────────────────────
const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
    'admin@ibslaw.co.kr': {
        id: 'u1', email: 'admin@ibslaw.co.kr', name: '김관리자',
        role: 'super_admin', password: 'admin1234',
    },
    'sales@ibslaw.co.kr': {
        id: 'u2', email: 'sales@ibslaw.co.kr', name: '이영업',
        role: 'sales', password: 'sales1234',
    },
    'lawyer@ibslaw.co.kr': {
        id: 'u3', email: 'lawyer@ibslaw.co.kr', name: '박변호사',
        role: 'lawyer', password: 'lawyer1234',
    },
    'litigation@ibslaw.co.kr': {
        id: 'u4', email: 'litigation@ibslaw.co.kr', name: '최송무',
        role: 'litigation', password: 'lit1234',
    },
    'hr@ibslaw.co.kr': {
        id: 'u5', email: 'hr@ibslaw.co.kr', name: '정인사',
        role: 'hr', password: 'hr1234',
    },
    // 고객사 HR (사업자번호로 로그인)
    '123-45-67890': {
        id: 'c1u1', email: 'client@nolboo.co.kr', name: '김HR담당',
        role: 'client_hr', companyId: 'c1', companyName: '(주)놀부NBG',
        plan: 'pro', password: '1234',
    },
};

const AUTH_KEY = 'ibs_auth_v1';

// ── Context ────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
    user: null, loading: true,
    login: async () => ({}),
    loginWithBizNo: async () => ({}),
    logout: () => { },
    isAuthenticated: false,
});

// ── 역할별 리다이렉트 맵 ──────────────────────────────────────
export const ROLE_REDIRECT: Record<RoleType, string> = {
    super_admin: '/admin',
    admin: '/admin',
    sales: '/admin',
    lawyer: '/lawyer',
    litigation: '/litigation',
    client_hr: '/client-portal',
    counselor: '/counselor',
    hr: '/admin',
    general: '/admin',
    finance: '/admin',
};

// ── Provider ───────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(AUTH_KEY);
            if (saved) setUser(JSON.parse(saved));
        } catch { }
        setLoading(false);
    }, []);

    const saveUser = (u: AuthUser | null) => {
        setUser(u);
        if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
        else localStorage.removeItem(AUTH_KEY);
    };

    const login = useCallback(async (email: string, password: string) => {
        const found = MOCK_USERS[email.toLowerCase()];
        if (!found || found.password !== password) return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
        const { password: _, ...authUser } = found;
        saveUser(authUser);
        return {};
    }, []);

    const loginWithBizNo = useCallback(async (bizNo: string, password: string) => {
        const key = bizNo.replace(/[^0-9]/g, '').replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
        const found = MOCK_USERS[key];
        if (!found || found.password !== password) return { error: '사업자번호 또는 비밀번호가 올바르지 않습니다.' };
        const { password: _, ...authUser } = found;
        saveUser(authUser);
        return {};
    }, []);

    const logout = useCallback(() => {
        saveUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithBizNo, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() { return useContext(AuthContext); }

// ── 인증 가드 훅 ───────────────────────────────────────────────
export function useRequireAuth(requiredRoles?: RoleType[]) {
    const { user, loading } = useAuth();

    if (typeof window !== 'undefined' && !loading) {
        if (!user) { window.location.href = '/login'; }
        else if (requiredRoles && !requiredRoles.includes(user.role)) {
            window.location.href = ROLE_REDIRECT[user.role];
        }
    }
    return { user, loading, authorized: !!user && (!requiredRoles || requiredRoles.includes(user.role)) };
}
