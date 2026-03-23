'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Mail, Eye, EyeOff, AlertCircle, ArrowRight,
    Lock, Building2, Users, ChevronRight, Gavel, BarChart3, Heart
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ROLE_HOME, getSession } from '@/lib/auth';
import { useAuth } from '@/lib/AuthContext';

function setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    if (typeof document !== 'undefined') {
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    }
}

async function requestJwtCookie(session: any) {
    try {
        await fetch('/api/auth/jwt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: session.id, role: session.role, companyId: session.companyId }),
        });
    } catch (e) {
        console.error('JWT 발급 실패', e);
    }
}

type LoginMode = 'staff' | 'client';

// 역할별 레이블
const ROLE_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    super_admin: { icon: <ShieldCheck className="w-4 h-4" />, label: '슈퍼어드민', color: '#e8c87a' },
    admin: { icon: <BarChart3 className="w-4 h-4" />, label: '관리자', color: '#e8c87a' },
    sales: { icon: <Users className="w-4 h-4" />, label: '영업팀', color: '#60a5fa' },
    lawyer: { icon: <Gavel className="w-4 h-4" />, label: '변호사', color: '#a78bfa' },
    litigation: { icon: <Gavel className="w-4 h-4" />, label: '송무팀', color: '#f472b6' },
    counselor: { icon: <Heart className="w-4 h-4" />, label: 'EAP상담사', color: '#4ade80' },  // ← 신규
    client_hr: { icon: <Building2 className="w-4 h-4" />, label: '고객사HR', color: '#fb923c' }, // ← 신규
    general: { icon: <Users className="w-4 h-4" />, label: '총무팀(내부)', color: '#94a3b8' },
    hr: { icon: <Users className="w-4 h-4" />, label: '인사팀(내부)', color: '#94a3b8' },
};


function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from') || '';
    const { login: authLogin, loginWithBizNo: authLoginBiz } = useAuth();

    const [mode, setMode] = useState<LoginMode>('staff');

    // 이미 로그인돼 있으면 홈으로
    useEffect(() => {
        const session = getSession();
        if (session) {
            router.replace(ROLE_HOME[session.role] || '/');
        }
    }, [router]);

    // Staff login state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Client login state
    const [bizNum, setBizNum] = useState('');
    const [bizPassword, setBizPassword] = useState('');
    const [showBizPw, setShowBizPw] = useState(false);
    const [bizError, setBizError] = useState('');
    const [bizLoading, setBizLoading] = useState(false);

    const formatBizNum = (v: string) => {
        const d = v.replace(/\D/g, '').slice(0, 10);
        if (d.length <= 3) return d;
        if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
        return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
    };

    const handleStaffLogin = async () => {
        if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
        setLoading(true); setError('');
        await new Promise(r => setTimeout(r, 700));
        const result = await authLogin(email, password);
        if (!result.error) {
            const session = getSession();
            if (session) {
                setCookie('ibs_session', session.id, 1);
                setCookie('ibs_role', session.role, 1);
                await requestJwtCookie(session);
                const dest = from || ROLE_HOME[session.role] || '/';
                setLoading(false);
                router.replace(dest);
            }
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    const handleClientLogin = async () => {
        if (!bizNum || !bizPassword) { setBizError('사업자번호와 비밀번호를 입력해주세요.'); return; }
        setBizLoading(true); setBizError('');
        await new Promise(r => setTimeout(r, 800));
        const result = await authLoginBiz(bizNum, bizPassword);
        if (!result.error) {
            const session = getSession();
            if (session) {
                setCookie('ibs_session', session.id, 1);
                setCookie('ibs_role', session.role, 1);
                await requestJwtCookie(session);
                setBizLoading(false);
                router.replace(from || '/dashboard');
            }
        } else {
            setBizError(result.error);
            setBizLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-12 relative"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(35,68,168,0.22) 0%, transparent 65%), #04091a' }}
        >
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">

                    <h1 className="text-2xl font-black mb-1" style={{ color: '#f0f4ff' }}>IBS 법률사무소</h1>
                    <p className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>플랫폼 로그인</p>
                </motion.div>

                {/* Mode Toggle */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {([
                            { key: 'staff', label: '내부 직원', icon: <Users className="w-4 h-4" /> },
                            { key: 'client', label: '고객사 로그인', icon: <Building2 className="w-4 h-4" /> },
                        ] as { key: LoginMode; label: string; icon: React.ReactNode }[]).map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => { setMode(tab.key); setError(''); setBizError(''); }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
                                style={{
                                    background: mode === tab.key ? 'linear-gradient(135deg,#e8c87a,#c9a84c)' : 'transparent',
                                    color: mode === tab.key ? '#04091a' : 'rgba(240,244,255,0.5)',
                                }}
                            >
                                {tab.icon}{tab.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, x: mode === 'staff' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: mode === 'staff' ? 20 : -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>

                            {/* ── Staff Login ── */}
                            {mode === 'staff' && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-black mb-0.5" style={{ color: '#f0f4ff' }}>직원 로그인</h2>
                                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>법인 이메일과 비밀번호를 입력하세요.</p>
                                    </div>

                                    {/* Role Quick-Login Badges — 개발 환경에서만 표시 */}
                                    {process.env.NODE_ENV === 'development' && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(240,244,255,0.25)' }}>
                                                [DEV] 역할선택 — 선택하면 즉시 로그인
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { email: 'admin@ibslaw.kr', pw: 'admin123', role: 'super_admin', dest: '/admin/leads' },
                                                    { email: 'lawyer1@ibslaw.kr', pw: 'lawyer123', role: 'lawyer', dest: '/lawyer' },
                                                    { email: 'sales@ibslaw.kr', pw: 'sales123', role: 'sales', dest: '/admin/leads' },
                                                    { email: 'counselor@ibslaw.kr', pw: 'counsel123', role: 'counselor', dest: '/counselor' },
                                                    { email: 'lit@ibslaw.kr', pw: 'lit123', role: 'litigation', dest: '/litigation' },
                                                ].map((h) => {
                                                    const ri = ROLE_ICONS[h.role];
                                                    return (
                                                        <button
                                                            key={h.email}
                                                            onClick={async () => {
                                                                setLoading(true); setError('');
                                                                await new Promise(r => setTimeout(r, 400));
                                                                const result = await authLogin(h.email, h.pw);
                                                                if (!result.error) {
                                                                    const session = getSession();
                                                                    if (session) {
                                                                        setCookie('ibs_session', session.id, 1);
                                                                        setCookie('ibs_role', session.role, 1);
                                                                        await requestJwtCookie(session);
                                                                    }
                                                                    router.replace(h.dest);
                                                                } else {
                                                                    setError(result.error);
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                            style={{
                                                                background: `${ri?.color}12`,
                                                                border: `1px solid ${ri?.color}30`,
                                                                color: ri?.color || '#f0f4ff'
                                                            }}
                                                        >
                                                            <span className="flex-shrink-0">{ri?.icon}</span>
                                                            <div className="min-w-0">
                                                                <div className="font-black text-[11px]">{ri?.label}</div>
                                                                <div className="text-[9px] truncate opacity-50" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                                                    {h.dest.replace('/', '')}
                                                                </div>
                                                            </div>
                                                            <ArrowRight className="w-3 h-3 ml-auto flex-shrink-0 opacity-40" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative flex items-center gap-2" style={{ color: 'rgba(240,244,255,0.15)' }}>
                                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                                        <span className="text-[10px]">또는 직접 입력</span>
                                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'rgba(240,244,255,0.7)' }}>이메일</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                            <input
                                                className="input-navy"
                                                style={{ paddingLeft: '2.25rem' }}
                                                type="email"
                                                placeholder="name@ibslaw.kr"
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleStaffLogin()}
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'rgba(240,244,255,0.7)' }}>비밀번호</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                            <input
                                                className="input-navy"
                                                style={{ paddingLeft: '2.25rem', paddingRight: '2.75rem' }}
                                                type={showPw ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleStaffLogin()}
                                            />
                                            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(240,244,255,0.35)' }}>
                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-sm" style={{ color: '#f87171' }}>
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleStaffLogin}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                                        style={{
                                            background: loading ? 'rgba(201,168,76,0.3)' : 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                            color: '#04091a',
                                            opacity: loading ? 0.8 : 1,
                                        }}
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                로그인 중...
                                            </span>
                                        ) : (<>로그인 <ArrowRight className="w-4 h-4" /></>)}
                                    </button>
                                </div>
                            )}

                            {/* ── Client Login ── */}
                            {mode === 'client' && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-black mb-0.5" style={{ color: '#f0f4ff' }}>고객사 로그인</h2>
                                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>사업자번호와 발급받은 비밀번호를 입력하세요.</p>
                                    </div>

                                    {/* Quick client login */}
                                    <button
                                        onClick={async () => {
                                            setBizLoading(true); setBizError('');
                                            await new Promise(r => setTimeout(r, 500));
                                            const result = await authLoginBiz('123-45-67890', '1234');
                                            if (!result.error) {
                                                const session = getSession();
                                                if (session) {
                                                    setCookie('ibs_session', session.id, 1);
                                                    setCookie('ibs_role', session.role, 1);
                                                    await requestJwtCookie(session);
                                                }
                                                router.replace('/client-portal');
                                            } else { setBizError(result.error); setBizLoading(false); }
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all hover:scale-[1.01]"
                                        style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: '#c9a84c' }}
                                    >
                                        <Building2 className="w-4 h-4 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <div className="font-black">고객사 테스트 로그인 ((주)놀부NBG)</div>
                                            <div className="text-[10px] opacity-50">123-45-67890 · 비번 1234 → 고객 포털</div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 flex-shrink-0 ml-auto" />
                                    </button>

                                    <div className="relative flex items-center gap-2" style={{ color: 'rgba(240,244,255,0.15)' }}>
                                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                                        <span className="text-[10px]">또는 직접 입력</span>
                                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                                    </div>

                                    {/* Biz number */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'rgba(240,244,255,0.7)' }}>사업자등록번호</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                            <input
                                                className="input-navy font-mono tracking-wider"
                                                style={{ paddingLeft: '2.25rem' }}
                                                placeholder="000-00-00000"
                                                value={bizNum}
                                                onChange={(e) => { setBizNum(formatBizNum(e.target.value)); setBizError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleClientLogin()}
                                                maxLength={12}
                                            />
                                        </div>
                                    </div>

                                    {/* Biz Password */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'rgba(240,244,255,0.7)' }}>비밀번호</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                            <input
                                                className="input-navy"
                                                style={{ paddingLeft: '2.25rem', paddingRight: '2.75rem' }}
                                                type={showBizPw ? 'text' : 'password'}
                                                placeholder="발급받은 비밀번호"
                                                value={bizPassword}
                                                onChange={(e) => { setBizPassword(e.target.value); setBizError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleClientLogin()}
                                            />
                                            <button onClick={() => setShowBizPw(!showBizPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(240,244,255,0.35)' }}>
                                                {showBizPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {bizError && (
                                        <div className="flex items-center gap-2 text-sm" style={{ color: '#f87171' }}>
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{bizError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleClientLogin}
                                        disabled={bizLoading}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                                        style={{
                                            background: bizLoading ? 'rgba(201,168,76,0.3)' : 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                            color: '#04091a',
                                        }}
                                    >
                                        {bizLoading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                확인 중...
                                            </span>
                                        ) : (<>나의 리포트 보기 <ChevronRight className="w-4 h-4" /></>)}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Footer */}
                <p className="text-center text-xs mt-5" style={{ color: 'rgba(240,244,255,0.3)' }}>
                    계정이 없으신가요?{' '}
                    <a href="/signup" style={{ color: '#c9a84c' }}>회원가입</a>
                    {' '}· © 2026 IBS 법률사무소
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#04091a' }}>
                <div className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>로딩 중...</div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
