'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// ── 인증 SSOT: auth.ts만 참조 (이 파일에 별도 계정 목록 금지) ──
import { loginWithEmailFull, loginWithBiz, signUp as authSignUp, clearSession, getSession, setSession, AUTH_KEY, ROLE_HOME, type AuthUser } from './auth';
import type { RoleType } from './mockStore';

export type { RoleType, AuthUser };

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    loginWithBizNo: (bizNo: string, password: string) => Promise<{ error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ error?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
}

// AUTH_KEY는 auth.ts에서 import (중복 정의 제거)

// ── Context ───────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
    user: null, loading: true,
    login: async () => ({}),
    loginWithBizNo: async () => ({}),
    signup: async () => ({}),
    logout: () => { },
    isAuthenticated: false,
});

// ── 역할별 리다이렉트 맵 (SSOT: auth.ts ROLE_HOME 단일 소스) ──────
export const ROLE_REDIRECT = ROLE_HOME;

// ── Provider ──────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
    // lazy initializer로 초기 세션 로드 (useEffect 내 setState 회피)
    const [user, setUser] = useState<AuthUser | null>(() => {
        try { return getSession(); } catch { return null; }
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
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

    // SEC-FIX #9: 로그인/회원가입 성공 후 JWT httpOnly 쿠키 발급
    // middleware.ts가 ibs_jwt 쿠키로 인증 → 쿠키 없으면 보호 경로 접근 불가
    const issueJwtCookie = async (user: AuthUser) => {
        try {
            await fetch('/api/auth/jwt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: user.id,
                    role: user.role,
                    companyId: user.companyId || '',
                }),
            });
        } catch (err) {
            console.warn('[auth] JWT 쿠키 발급 실패 — localStorage 세션으로 동작:', err);
        }
    };

    // ── auth.ts SSOT 함수 위임 (서버 인증 연동) ───────────────────────────────────
    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'staff', email, password })
            });
            const data = await res.json();
            if (data.success) {
                saveUser(data.user);
                setSession(data.user);
                return {};
            }
            return { error: data.error };
        } catch {
            return { error: '서버 오류가 발생했습니다.' };
        }
    }, []);

    const loginWithBizNo = useCallback(async (bizNo: string, password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'client', bizNum: bizNo, bizPassword: password })
            });
            const data = await res.json();
            if (data.success) {
                saveUser(data.user);
                setSession(data.user);
                return {};
            }
            return { error: data.error };
        } catch {
            return { error: '서버 오류가 발생했습니다.' };
        }
    }, []);

    const signup = useCallback(async (name: string, email: string, password: string) => {
        // Mock 로컬 전용 가입: 서버 JWT 미발급 (Phase 3에서 실제 DB 연동 필요)
        const result = authSignUp(name, email, password);
        if (result.success) {
            saveUser(result.user);
            console.warn('[auth] Mock 회원가입은 서버 Auth 연동 불가 (Phase 3 예정)');
            return {};
        }
        return { error: result.error };
    }, []);

    const logout = useCallback(async () => {
        clearSession();
        // QA-FIX #18: httpOnly 쿠키는 document.cookie로 삭제 불가
        // 서버사이드 로그아웃 API 호출하여 쿠키 만료 처리
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
            // 네트워크 오류 시에도 클라이언트 세션은 정리
            console.warn('[auth] 로그아웃 API 호출 실패 — 클라이언트 세션만 정리');
        }
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithBizNo, signup, logout, isAuthenticated: !!user }}>
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
    }, [user, loading, router, requiredRoles]);

    return {
        user,
        loading,
        authorized: !!user && (!requiredRoles || requiredRoles.includes(user.role)),
    };
}
