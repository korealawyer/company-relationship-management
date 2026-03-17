'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// ── 인증 SSOT: auth.ts만 참조 (이 파일에 별도 계정 목록 금지) ──
import { loginWithEmailFull, loginWithBiz, clearSession, getSession, type AuthUser } from './auth';
import type { RoleType } from './mockStore';

export type { RoleType, AuthUser };

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    loginWithBizNo: (bizNo: string, password: string) => Promise<{ error?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AUTH_KEY = 'ibs_auth_v1';

// ── Context ───────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
    user: null, loading: true,
    login: async () => ({}),
    loginWithBizNo: async () => ({}),
    logout: () => { },
    isAuthenticated: false,
});

// ── 역할별 리다이렉트 맵 ─────────────────────────────────────────
export const ROLE_REDIRECT: Record<RoleType, string> = {
    super_admin: '/employee',
    admin: '/employee',
    sales: '/employee',
    lawyer: '/lawyer',
    litigation: '/litigation',
    client_hr: '/company-hr',
    counselor: '/counselor',
    hr: '/admin',
    general: '/admin',
    finance: '/admin',
};

// ── Provider ──────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            // auth.ts의 getSession() 활용 — 직접 localStorage 접근 제거
            const saved = getSession();
            if (saved) setUser(saved);
        } catch { }
        setLoading(false);

        // 다른 탭에서 로그인/로그아웃 시 현재 탭도 즉시 반영
        const onStorage = (e: StorageEvent) => {
            if (e.key !== AUTH_KEY) return;
            try {
                setUser(e.newValue ? JSON.parse(e.newValue) : null);
            } catch {
                setUser(null);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const saveUser = (u: AuthUser | null) => {
        setUser(u);
    };

    // ── auth.ts SSOT 함수 위임 ───────────────────────────────────
    const login = useCallback(async (email: string, password: string) => {
        const result = loginWithEmailFull(email, password);
        if (result.success) {
            saveUser(result.user);
            return {};
        }
        return { error: result.error };
    }, []);

    const loginWithBizNo = useCallback(async (bizNo: string, password: string) => {
        const result = loginWithBiz(bizNo, password);
        if (result.success) {
            saveUser(result.user);
            return {};
        }
        return { error: result.error };
    }, []);

    const logout = useCallback(() => {
        clearSession();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithBizNo, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() { return useContext(AuthContext); }

// ── 인증 가드 훅 ─────────────────────────────────────────────────
// window.location 직접 조작 제거 → useRouter() 사용 (App Router 호환)
export function useRequireAuth(requiredRoles?: RoleType[]) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (requiredRoles && !requiredRoles.includes(user.role)) {
            router.replace(ROLE_REDIRECT[user.role] ?? '/');
        }
    }, [user, loading, router]);

    return {
        user,
        loading,
        authorized: !!user && (!requiredRoles || requiredRoles.includes(user.role)),
    };
}
