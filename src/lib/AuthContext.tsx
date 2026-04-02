'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { RoleType } from './store';
import type { Session } from '@supabase/supabase-js';
import {
    loginWithEmailFull,
    clearSession,
    _setSessionCache,
    supabaseUserToAuthUser,
    type AuthUser,
} from './auth';
import { getBrowserSupabase, IS_SUPABASE_CONFIGURED } from './supabase';

export type { RoleType, AuthUser };

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    loginWithBizNo: (bizNo: string, password: string) => Promise<{ error?: string }>;
    loginWithPersonalEmail: (email: string, password: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

// ── Context ────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
    user: null, loading: true,
    login: async () => ({}),
    loginWithBizNo: async () => ({}),
    loginWithPersonalEmail: async () => ({}),
    logout: async () => { },
    isAuthenticated: false,
});

// ── 역할별 리다이렉트 맵 ─────────────────────────────────────
export const ROLE_REDIRECT: Record<RoleType, string> = {
    super_admin: '/admin',
    admin: '/admin',
    sales: '/employee',
    lawyer: '/lawyer',
    litigation: '/litigation',
    client_hr: '/dashboard',
    counselor: '/counselor',
    hr: '/admin',
    general: '/admin',
    finance: '/finance',
    personal_client: '/personal-litigation',
};

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sb = getBrowserSupabase();

        if (!sb || !IS_SUPABASE_CONFIGURED) {
            // Supabase 미설정 — 로컬 캐시에서 읽기 (개발 폴백)
            try {
                const raw = localStorage.getItem('ibs_auth_v1');
                if (raw) setUser(JSON.parse(raw) as AuthUser);
            } catch { }
            setLoading(false);
            return;
        }

        // ── 초기 세션 로드 ─────────────────────────────────────
        sb.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            if (session?.user) {
                const u = supabaseUserToAuthUser(session.user);
                setUser(u);
                _setSessionCache(u);
            } else {
                setUser(null);
                _setSessionCache(null);
            }
            setLoading(false);
        });

        // ── 세션 변경 구독 (탭간 동기화 포함) ─────────────────
        const { data: { subscription } } = sb.auth.onAuthStateChange((_event: string, session: Session | null) => {
            if (session?.user) {
                const u = supabaseUserToAuthUser(session.user);
                setUser(u);
                _setSessionCache(u);
            } else {
                setUser(null);
                _setSessionCache(null);
            }
            // 초기 로드 후 변경 → loading 해제
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // ── 이메일 로그인 ──────────────────────────────────────────
    const login = useCallback(async (email: string, password: string) => {
        const result = await loginWithEmailFull(email, password);
        if (result.success) {
            setUser(result.user);
            return {};
        }
        return { error: result.error };
    }, []);

    // ── 사업자번호 로그인 (이메일 맵핑) ──────────────────────────────────────
    const loginWithBizNo = useCallback(async (bizNo: string, password: string) => {
        const cleanBizNo = bizNo.replace(/\D/g, '');
        const emailToLogin = bizNo.includes('@') ? bizNo : (cleanBizNo.length > 0 ? `${cleanBizNo}@client.ibsbase.com` : bizNo);
        const result = await loginWithEmailFull(emailToLogin, password);
        if (result.success) {
            setUser(result.user);
            return {};
        }
        return { error: result.error };
    }, []);

    // ── 개인회원 로그인 (이메일 맵핑) ──────────────────────────────────────────
    const loginWithPersonalEmail = useCallback(async (email: string, password: string) => {
        const result = await loginWithEmailFull(email, password);
        if (result.success) {
            setUser(result.user);
            return {};
        }
        return { error: result.error };
    }, []);

    // ── 로그아웃 ──────────────────────────────────────────────
    const logout = useCallback(async () => {
        await clearSession();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithBizNo, loginWithPersonalEmail, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() { return useContext(AuthContext); }

// ── 인증 가드 훅 ──────────────────────────────────────────────
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
