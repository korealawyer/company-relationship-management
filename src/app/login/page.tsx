'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Mail, Eye, EyeOff, AlertCircle, ArrowRight,
    Lock, Building2, Users, ChevronRight, Gavel, BarChart3, Heart, KeyRound
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

type LoginMode = 'staff' | 'client';

// 역할별 레이블
const ROLE_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string; dest_label: string }> = {
    super_admin: { icon: <ShieldCheck className="w-4 h-4" />, label: '슈퍼어드민', color: '#b8960a', dest_label: 'CRM 관리' },
    admin: { icon: <BarChart3 className="w-4 h-4" />, label: '관리자', color: '#b8960a', dest_label: 'CRM 관리' },
    sales: { icon: <Users className="w-4 h-4" />, label: '영업팀', color: '#2563eb', dest_label: 'CRM' },
    lawyer: { icon: <Gavel className="w-4 h-4" />, label: '변호사', color: '#7c3aed', dest_label: '검토 대시보드' },
    litigation: { icon: <Gavel className="w-4 h-4" />, label: '송무팀', color: '#db2777', dest_label: '송무 대시보드' },
    counselor: { icon: <Heart className="w-4 h-4" />, label: 'EAP상담사', color: '#059669', dest_label: '상담 현황' },
    client_hr: { icon: <Building2 className="w-4 h-4" />, label: '고객사HR', color: '#ea580c', dest_label: '사용 현황' },
    general: { icon: <Users className="w-4 h-4" />, label: '총무팀(내부)', color: '#64748b', dest_label: '총무' },
    hr: { icon: <Users className="w-4 h-4" />, label: '인사팀(내부)', color: '#64748b', dest_label: '인사' },
};

// 라이트 테마 색상
const L = {
    bg: '#f8f9fc',
    card: '#ffffff',
    heading: '#0f172a',
    body: '#1e293b',
    sub: '#475569',
    muted: '#64748b',
    faint: '#94a3b8',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    gold: '#b8960a',
    goldLight: '#fef9e7',
    goldBorder: '#fde68a',
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
                setBizLoading(false);
                router.replace(from || '/dashboard');
            }
        } else {
            setBizError(result.error);
            setBizLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px 10px 38px',
        background: L.borderLight, border: `1px solid ${L.border}`,
        borderRadius: 12, fontSize: 14, color: L.body, outline: 'none',
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-12 relative"
            style={{ background: `linear-gradient(135deg, ${L.bg} 0%, #eef2ff 50%, #fef9e7 100%)` }}
        >
            {/* Subtle decorative circles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,150,10,0.06) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 70%)' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">

                    <h1 className="text-2xl font-black mb-1" style={{ color: L.heading }}>IBS 법률사무소</h1>
                    <p className="text-sm" style={{ color: L.muted }}>플랫폼 로그인</p>
                </motion.div>

                {/* Mode Toggle */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex rounded-xl p-1 mb-6" style={{ background: L.borderLight, border: `1px solid ${L.border}` }}>
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
                                    color: mode === tab.key ? '#0f172a' : L.muted,
                                    boxShadow: mode === tab.key ? '0 2px 8px rgba(184,150,10,0.2)' : 'none',
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
                        <div style={{
                            background: L.card, border: `1px solid ${L.border}`, borderRadius: 16, padding: 28,
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        }}>

                            {/* ── Staff Login ── */}
                            {mode === 'staff' && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-black mb-0.5" style={{ color: L.heading }}>직원 로그인</h2>
                                        <p className="text-xs" style={{ color: L.muted }}>법인 이메일과 비밀번호를 입력하세요.</p>
                                    </div>

                                    {/* Role Quick-Login Badges — 개발 환경에서만 표시 */}
                                    {process.env.NODE_ENV === 'development' && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: L.faint }}>
                                                [DEV] 역할선택 — 선택하면 즉시 로그인
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { email: 'admin@ibslaw.kr', pw: 'admin123', role: 'super_admin', dest: '/employee' },
                                                    { email: 'lawyer1@ibslaw.kr', pw: 'lawyer123', role: 'lawyer', dest: '/lawyer' },
                                                    { email: 'sales@ibslaw.kr', pw: 'sales123', role: 'sales', dest: '/employee' },
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
                                                                    }
                                                                    router.replace(h.dest);
                                                                } else {
                                                                    setError(result.error);
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                            style={{
                                                                background: `${ri?.color}08`,
                                                                border: `1px solid ${ri?.color}25`,
                                                                color: ri?.color || L.body
                                                            }}
                                                        >
                                                            <span className="flex-shrink-0">{ri?.icon}</span>
                                                            <div className="min-w-0">
                                                                <div className="font-black text-[11px]">{ri?.label}</div>
                                                                <div className="text-[9px] truncate" style={{ color: L.faint }}>
                                                                    {ri?.dest_label}
                                                                </div>
                                                            </div>
                                                            <ArrowRight className="w-3 h-3 ml-auto flex-shrink-0 opacity-40" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative flex items-center gap-2" style={{ color: L.faint }}>
                                        <div className="flex-1 h-px" style={{ background: L.border }} />
                                        <span className="text-[10px]">또는 직접 입력</span>
                                        <div className="flex-1 h-px" style={{ background: L.border }} />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: L.sub }}>이메일</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: L.faint }} />
                                            <input
                                                style={inputStyle}
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
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: L.sub }}>비밀번호</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: L.faint }} />
                                            <input
                                                style={{ ...inputStyle, paddingRight: '2.75rem' }}
                                                type={showPw ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleStaffLogin()}
                                            />
                                            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: L.faint }}>
                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-sm" style={{ color: '#dc2626' }}>
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleStaffLogin}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                                        style={{
                                            background: loading ? 'rgba(201,168,76,0.3)' : 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                            color: '#0f172a',
                                            opacity: loading ? 0.8 : 1,
                                            boxShadow: loading ? 'none' : '0 2px 12px rgba(184,150,10,0.25)',
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

                                    {/* 비밀번호 찾기 */}
                                    <div className="text-center">
                                        <button className="text-xs font-medium flex items-center gap-1 mx-auto" style={{ color: L.muted }}
                                            onClick={() => alert('관리자에게 문의하세요: admin@ibslaw.kr')}>
                                            <KeyRound className="w-3 h-3" /> 비밀번호를 잊으셨나요?
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Client Login ── */}
                            {mode === 'client' && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-black mb-0.5" style={{ color: L.heading }}>고객사 로그인</h2>
                                        <p className="text-xs" style={{ color: L.muted }}>사업자번호와 발급받은 비밀번호를 입력하세요.</p>
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
                                                }
                                                router.replace('/dashboard');
                                            } else { setBizError(result.error); setBizLoading(false); }
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all hover:scale-[1.01]"
                                        style={{ background: L.goldLight, border: `1px solid ${L.goldBorder}`, color: L.gold }}
                                    >
                                        <Building2 className="w-4 h-4 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <div className="font-black">고객사 테스트 로그인 ((주)놀부NBG)</div>
                                            <div className="text-[10px]" style={{ color: L.muted }}>123-45-67890 · 비번 1234 → 고객 포털</div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 flex-shrink-0 ml-auto" />
                                    </button>

                                    <div className="relative flex items-center gap-2" style={{ color: L.faint }}>
                                        <div className="flex-1 h-px" style={{ background: L.border }} />
                                        <span className="text-[10px]">또는 직접 입력</span>
                                        <div className="flex-1 h-px" style={{ background: L.border }} />
                                    </div>

                                    {/* Biz number */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: L.sub }}>사업자등록번호</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: L.faint }} />
                                            <input
                                                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.06em' }}
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
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: L.sub }}>비밀번호</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: L.faint }} />
                                            <input
                                                style={{ ...inputStyle, paddingRight: '2.75rem' }}
                                                type={showBizPw ? 'text' : 'password'}
                                                placeholder="발급받은 비밀번호"
                                                value={bizPassword}
                                                onChange={(e) => { setBizPassword(e.target.value); setBizError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleClientLogin()}
                                            />
                                            <button onClick={() => setShowBizPw(!showBizPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: L.faint }}>
                                                {showBizPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {bizError && (
                                        <div className="flex items-center gap-2 text-sm" style={{ color: '#dc2626' }}>
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{bizError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleClientLogin}
                                        disabled={bizLoading}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                                        style={{
                                            background: bizLoading ? 'rgba(201,168,76,0.3)' : 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                            color: '#0f172a',
                                            boxShadow: bizLoading ? 'none' : '0 2px 12px rgba(184,150,10,0.25)',
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

                {/* Security & Footer */}
                <div className="text-center mt-5 space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-[10px]" style={{ color: L.faint }}>
                        <Lock className="w-3 h-3" /> 안전한 암호화 로그인
                    </div>
                    <p className="text-xs" style={{ color: L.faint }}>
                        계정이 없으신가요?{' '}
                        <a href="/signup" className="font-bold" style={{ color: L.gold }}>회원가입</a>
                        {' '}· © 2026 IBS 법률사무소
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fc' }}>
                <div className="text-sm" style={{ color: '#64748b' }}>로딩 중...</div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
