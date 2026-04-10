'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Mail, Eye, EyeOff, AlertCircle, ArrowRight,
    Lock, Building2, Users, ChevronRight, Gavel, BarChart3, Heart, KeyRound, UserCircle
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ROLE_HOME, getSession } from '@/lib/auth';
import { useAuth } from '@/lib/AuthContext';

function setCookie(name: string, value: string) {
    if (typeof document !== 'undefined') {
        const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; ${secure} SameSite=Lax; max-age=86400;`;
    }
}

type LoginMode = 'staff' | 'client' | 'personal';

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
    const claimId = searchParams.get('claim');
    const { login: authLogin, loginWithBizNo: authLoginBiz, loginWithPersonalEmail: authLoginPersonal } = useAuth();

    const [mode, setMode] = useState<LoginMode>('client');
    const [showStaffTab, setShowStaffTab] = useState(false);

    const [claimBizNum, setClaimBizNum] = useState('');
    const [claimPw, setClaimPw] = useState('');
    const [claimPwConfirm, setClaimPwConfirm] = useState('');
    const [showClaimPw, setShowClaimPw] = useState(false);
    const [claimError, setClaimError] = useState('');
    const [claimLoading, setClaimLoading] = useState(false);
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [agreeMarketing, setAgreeMarketing] = useState(false);
    const [modalContent, setModalContent] = useState<'privacy' | 'marketing' | null>(null);

    const handleClaimLogin = async () => {
        const cleanBizNum = claimBizNum.replace(/\D/g, '');
        if (!cleanBizNum || cleanBizNum.length < 10) { setClaimError('올바른 개인 사업자 번호(10자리)를 입력해주세요.'); return; }
        if (!claimPw || claimPw !== claimPwConfirm) { setClaimError('비밀번호가 일치하지 않거나 비어있습니다.'); return; }
        if (claimPw.length < 6) { setClaimError('비밀번호는 최소 6자 이상이어야 합니다.'); return; }
        if (!agreePrivacy) { setClaimError('필수 개인정보 수집 및 이용에 동의해주세요.'); return; }
        setClaimLoading(true); setClaimError('');
        try {
            const res = await fetch('/api/auth/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claimId, bizNum: cleanBizNum, password: claimPw, agreeMarketing })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '접근 설정에 실패했습니다.');
            
            const result = await authLoginBiz(cleanBizNum, claimPw);
            if (!result.error) {
                const session = getSession();
                if (session) {
                    // setCookie was moved to inside auth but let's do it safely
                    setCookie('ibs_session', session.id);
                    setCookie('ibs_role', session.role);
                    router.replace(from || '/privacy-analysis');
                } else {
                    router.replace(from || '/privacy-analysis'); // session might be slight delayed
                }
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            setClaimError(e.message);
            setClaimLoading(false);
        }
    };

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

    // Personal login state
    const [personalEmail, setPersonalEmail] = useState('');
    const [personalPassword, setPersonalPassword] = useState('');
    const [showPersonalPw, setShowPersonalPw] = useState(false);
    const [personalError, setPersonalError] = useState('');
    const [personalLoading, setPersonalLoading] = useState(false);

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
                setCookie('ibs_session', session.id);
                setCookie('ibs_role', session.role);
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
                setCookie('ibs_session', session.id);
                setCookie('ibs_role', session.role);
                setBizLoading(false);
                router.replace(from || '/dashboard');
            }
        } else {
            setBizError(result.error);
            setBizLoading(false);
        }
    };

    const handlePersonalLogin = async () => {
        if (!personalEmail || !personalPassword) { setPersonalError('이메일과 비밀번호를 입력해주세요.'); return; }
        setPersonalLoading(true); setPersonalError('');
        await new Promise(r => setTimeout(r, 700));
        const result = await authLoginPersonal(personalEmail, personalPassword);
        if (!result.error) {
            const session = getSession();
            if (session) {
                setCookie('ibs_session', session.id);
                setCookie('ibs_role', session.role);
                setPersonalLoading(false);
                router.replace(from || '/personal-litigation');
            }
        } else {
            setPersonalError(result.error);
            setPersonalLoading(false);
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
                <h1 className="sr-only">IBS 법률사무소 로그인</h1>
                {/* Logo removed per user request */}

                {/* Mode Toggle (Hidden if claimId exists) */}
                {!claimId && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="flex rounded-xl p-1 mb-6" style={{ background: L.borderLight, border: `1px solid ${L.border}` }}>
                            {([
                                { key: 'personal', label: '개인', icon: <UserCircle className="w-4 h-4" /> },
                                { key: 'client',   label: '기업',     icon: <Building2 className="w-4 h-4" /> },
                                ...(showStaffTab ? [{ key: 'staff', label: '내부 직원', icon: <Users className="w-4 h-4" /> }] : []),
                            ] as { key: LoginMode; label: string; icon: React.ReactNode }[]).map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => { setMode(tab.key); setError(''); setBizError(''); setPersonalError(''); }}
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
                )}

                {/* Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={claimId ? 'claim' : mode}
                        initial={{ opacity: 0, x: mode === 'staff' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: mode === 'staff' ? 20 : -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div style={{
                            background: L.card, border: `1px solid ${L.border}`, borderRadius: 16, padding: 28,
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        }}>

                                {/* ── Claim Flow ── */}
                            {claimId && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-black mb-0.5" style={{ color: L.heading }}>초기 비밀번호 및 아이디 설정</h2>
                                        <p className="text-xs" style={{ color: L.muted }}>보안을 위해 본인이 사용할 아이디(사업자 번호)와 비밀번호를 등록해주세요.</p>
                                    </div>
                                    
                                    {/* BizNum ID */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: L.sub }}>개인 사업자 번호 (아이디)</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: L.faint }} />
                                            <input
                                                style={inputStyle}
                                                type="text"
                                                placeholder="숫자만 입력 (예: 1234567890)"
                                                autoComplete="off"
                                                value={claimBizNum}
                                                onChange={(e) => { setClaimBizNum(e.target.value.replace(/\D/g, '')); setClaimError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleClaimLogin()}
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: L.sub }}>새 비밀번호</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: L.faint }} />
                                            <input
                                                style={{ ...inputStyle, paddingRight: '2.75rem' }}
                                                type={showClaimPw ? 'text' : 'password'}
                                                placeholder="6자리 이상 입력"
                                                autoComplete="off"
                                                value={claimPw}
                                                onChange={(e) => { setClaimPw(e.target.value); setClaimError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleClaimLogin()}
                                            />
                                            <button onClick={() => setShowClaimPw(!showClaimPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: L.faint }}>
                                                {showClaimPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Password Confirm */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: L.sub }}>새 비밀번호 확인</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: L.faint }} />
                                            <input
                                                style={{ ...inputStyle, paddingRight: '2.75rem' }}
                                                type={showClaimPw ? 'text' : 'password'}
                                                placeholder="비밀번호 재입력"
                                                autoComplete="off"
                                                value={claimPwConfirm}
                                                onChange={(e) => { setClaimPwConfirm(e.target.value); setClaimError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleClaimLogin()}
                                            />
                                        </div>
                                    </div>

                                    {/* 약관 동의 */}
                                    <div className="space-y-0 pt-1">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none" style={{ color: L.body }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={agreePrivacy}
                                                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                                />
                                                [필수] 개인정보 수집 및 이용 동의
                                            </label>
                                            <button 
                                                onClick={() => setModalContent('privacy')}
                                                className="text-xs font-semibold hover:underline" 
                                                style={{ color: L.gold }}>보기</button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none" style={{ color: L.body }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={agreeMarketing}
                                                    onChange={(e) => setAgreeMarketing(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                                />
                                                [선택] 마케팅 정보 수신 동의
                                            </label>
                                            <button 
                                                onClick={() => setModalContent('marketing')}
                                                className="text-xs font-semibold hover:underline" 
                                                style={{ color: L.gold }}>보기</button>
                                        </div>
                                    </div>

                                    {claimError && (
                                        <div className="flex items-center gap-2 text-sm" style={{ color: '#dc2626' }}>
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{claimError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleClaimLogin}
                                        disabled={claimLoading}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                                        style={{
                                            background: claimLoading ? 'rgba(201,168,76,0.3)' : 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                            color: '#0f172a',
                                            opacity: claimLoading ? 0.8 : 1,
                                            boxShadow: claimLoading ? 'none' : '0 2px 12px rgba(184,150,10,0.25)',
                                        }}
                                    >
                                        {claimLoading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                설정 중...
                                            </span>
                                        ) : (<>설정 완료 및 리포트 보기 <ArrowRight className="w-4 h-4" /></>)}
                                    </button>
                                </div>
                            )}

                            {/* ── Staff Login ── */}
                            {!claimId && mode === 'staff' && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-black mb-0.5" style={{ color: L.heading }}>직원 로그인</h2>
                                        <p className="text-xs" style={{ color: L.muted }}>법인 이메일과 비밀번호를 입력하세요.</p>
                                    </div>

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
                                                autoComplete="off"
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
                            {!claimId && mode === 'client' && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-black mb-0.5" style={{ color: L.heading }}>기업 로그인</h2>
                                        <p className="text-xs" style={{ color: L.muted }}>담당자 이메일과 발급받은 비밀번호를 입력하세요.</p>
                                    </div>

                                    {/* Biz number / Email */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: L.sub }}>
                                            사업자 번호 또는 이메일
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: L.faint }} />
                                            <input
                                                style={inputStyle}
                                                placeholder="사업자 번호 10자리 또는 담당자 이메일"
                                                value={bizNum}
                                                onChange={(e) => { setBizNum(e.target.value); setBizError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleClientLogin()}
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
                                                autoComplete="off"
                                                value={bizPassword}
                                                onChange={(e) => { setBizPassword(e.target.value); setBizError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleClientLogin()}
                                            />
                                            <button onClick={() => setShowBizPw(!showBizPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: L.faint }}>
                                                {showBizPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: L.muted }}>
                                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            이메일(아이디) 저장
                                        </label>
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
                                        ) : (<>로그인 <ArrowRight className="w-4 h-4" /></>)}
                                    </button>
                                </div>
                            )}
                            {/* ── Personal Login ── */}
                            {!claimId && mode === 'personal' && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-black mb-0.5" style={{ color: L.heading }}>개인 로그인</h2>
                                        <p className="text-xs" style={{ color: L.muted }}>가입하신 이메일과 비밀번호를 입력하세요.</p>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: L.sub }}>이메일</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: L.faint }} />
                                            <input
                                                style={inputStyle}
                                                type="email"
                                                placeholder="name@email.com"
                                                value={personalEmail}
                                                onChange={(e) => { setPersonalEmail(e.target.value); setPersonalError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handlePersonalLogin()}
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
                                                type={showPersonalPw ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                autoComplete="off"
                                                value={personalPassword}
                                                onChange={(e) => { setPersonalPassword(e.target.value); setPersonalError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handlePersonalLogin()}
                                            />
                                            <button onClick={() => setShowPersonalPw(!showPersonalPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: L.faint }}>
                                                {showPersonalPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: L.muted }}>
                                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            이메일 저장
                                        </label>
                                        <a href="#" className="text-xs font-medium hover:underline" style={{ color: L.faint }}>비밀번호 찾기</a>
                                    </div>

                                    {personalError && (
                                        <div className="flex items-center gap-2 text-sm" style={{ color: '#dc2626' }}>
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{personalError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handlePersonalLogin}
                                        disabled={personalLoading}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                                        style={{
                                            background: personalLoading ? 'rgba(201,168,76,0.3)' : 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                            color: '#0f172a',
                                            opacity: personalLoading ? 0.8 : 1,
                                            boxShadow: personalLoading ? 'none' : '0 2px 12px rgba(184,150,10,0.25)',
                                        }}
                                    >
                                        {personalLoading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                로그인 중...
                                            </span>
                                        ) : (<>내 사건 보기 <ChevronRight className="w-4 h-4" /></>)}
                                    </button>

                                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: L.borderLight }}>
                                        <p className="text-xs font-medium" style={{ color: L.sub }}>아직 계정이 없으신가요?</p>
                                        <a href="/signup" className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors hover:scale-[1.02] active:scale-[0.98]" 
                                           style={{ color: L.gold, background: L.goldLight, border: `1px solid ${L.goldBorder}` }}>
                                            무료 회원가입
                                        </a>
                                    </div>
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
                        {' '}· © 2026 IBS 법률사무소 ·{' '}
                        <button 
                            onClick={() => { setShowStaffTab(true); setMode('staff'); }}
                            className="hover:underline hover:text-[#94a3b8] transition-colors"
                        >
                            직원 접속
                        </button>
                    </p>
                </div>
            </div>

            {/* Modal for Privacy & Marketing Consent */}
            <AnimatePresence>
                {modalContent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModalContent(null)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: L.borderLight }}>
                                <h3 className="font-bold" style={{ color: L.heading }}>
                                    {modalContent === 'privacy' ? '개인정보 수집 및 이용 동의' : '마케팅 정보 수신 동의'}
                                </h3>
                                <button onClick={() => setModalContent(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                            <div className="p-6 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap" style={{ color: L.body }}>
                                {modalContent === 'privacy' ? 
`IBS 법률사무소 개인정보 처리방침

서문

IBS 법률사무소(대표변호사 유정훈, 이하 ‘IBS’라 합니다)는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령을 준수하며 적법하게 개인정보를 처리하고 안전하게 관리합니다. 이에 「개인정보 보호법」 제30조에 따라 개인정보 처리방침을 다음과 같이 수립·공개합니다.

제1조(개인정보 처리 목적)

IBS는 다음 목적을 위하여 개인정보를 처리합니다.
① 법률 리포트 서비스 제공
- 기업 회원 등록 및 계정 생성
- 이메일을 통한 임시 비밀번호 발송 및 홈페이지 접속 인증
- 법률 리포트 열람 서비스 제공

② 기업 법률 자문 및 분쟁 대응 서비스
- 비즈니스 모델 대응 전략 법률자문
- 경영 의사결정 관련 법률 및 협상 심리 자문
- 가맹점주와의 사전 분쟁 검토
- 소송 및 분쟁 대응 서비스 제공

③ 법률 정보 및 리포트 제공
- 법률 리포트 발송
- 법률 개정 사항 안내
- 업종별 법률 뉴스 제공

④ 마케팅 및 서비스 안내(별도 동의 시)
- 법률 리포트 및 콘텐츠 안내
- 법률 서비스 안내 및 이벤트 정보 제공

제2조(처리하는 개인정보 항목)

IBS는 다음 개인정보를 수집·이용합니다.
- 사업자등록번호
- 상호(법인명)
- 대표자명
- 연락처
- 이메일
- 업종
- 로그인 정보(이메일, 비밀번호)
- 접속기록, IP주소, 쿠키

법률 자문 요청 시 상담 내용 및 분쟁 관련 정보가 추가로 수집될 수 있습니다.

제3조(개인정보의 처리 및 보유 기간)

IBS는 다음 기간 동안 개인정보를 보유 및 이용합니다.
- 법률 리포트 서비스 정보 : 서비스 이용 종료 요청 시까지
- 법률 상담 및 자문 기록 : 상담 종료 후 3년
- 마케팅 수신 동의 정보 : 수신 거부 시까지

단, 관계 법령에 따라 일정 기간 보관이 필요한 경우 해당 법령에 따릅니다.

제4조(개인정보의 제3자 제공)

IBS는 원칙적으로 개인정보를 외부에 제공하지 않습니다. 다만 다음의 경우 예외로 합니다.
- 정보주체의 동의를 받은 경우
- 법률 자문 수행을 위해 담당 변호사에게 제공되는 경우
- 법령에 따라 제공이 요구되는 경우

제5조(개인정보 처리업무의 위탁)

IBS는 서비스 운영을 위하여 일부 업무를 외부 업체에 위탁할 수 있습니다.
- 이메일 발송 시스템 운영
- 홈페이지 유지관리 및 시스템 운영

제6조(개인정보의 파기)

개인정보 보유기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 파기합니다.
전자파일: 복구 불가능한 방법으로 삭제
종이문서: 파쇄 또는 소각

제7조(정보주체의 권리 및 행사방법)

정보주체는 언제든지 다음 권리를 행사할 수 있습니다.
- 개인정보 열람
- 개인정보 정정
- 개인정보 삭제
- 처리 정지 요청
- 법률 리포트 수신 거부

제8조(개인정보 자동 수집 장치)

IBS 홈페이지는 서비스 제공을 위해 쿠키를 사용할 수 있으며 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.

제9조(개인정보 보호책임자)

IBS 법률사무소
이메일: cs@ibslaw.co.kr
전화: 02-598-8518

제10조(시행일)

본 개인정보 처리방침은 2026년 3월 1일부터 시행됩니다.`
                                : 
`마케팅 정보 수신 동의서 (선택)

전문

IBS 법률사무소(이하 ‘IBS’라 합니다)는 법률 리포트, 법률 정보 및 서비스 안내를 제공하기 위하여 아래와 같이 개인정보를 이용하여 마케팅 정보를 발송합니다.

1. 수집 및 이용 목적

- 법률 리포트 및 법률 콘텐츠 안내
- 업종별 법률 정보 및 뉴스 제공
- 기업 경영 및 법률 리스크 관련 정보 제공
- 법률 상담 및 자문 서비스 안내
- 이벤트, 세미나 및 프로모션 안내

2. 이용하는 개인정보 항목

- 회사명(법인명)
- 담당자명
- 연락처(전화번호)
- 이메일

3. 마케팅 정보 제공 방법

- 이메일
- 문자메시지(SMS, LMS, MMS)
- 전화

4. 보유 및 이용 기간

마케팅 정보 수신 동의일로부터 수신 거부 시까지 보유 및 이용합니다.

5. 수신 동의 거부 권리

- 귀하는 마케팅 정보 수신에 대한 동의를 거부할 권리가 있습니다.
- 동의를 거부하더라도 서비스 이용에는 제한이 없습니다.

6. 수신 거부 방법

- 이메일: cs@ibslaw.co.kr
- 전화: 02-598-8518
- 홈페이지 설정

7. 안내사항

- IBS는 관련 법령에 따라 광고성 정보를 전송합니다.
- 광고성 정보 발송 시 발신자 정보 및 수신거부 방법을 명확히 표시합니다.
- 회원의 동의 없이 영리 목적의 광고성 정보를 발송하지 않습니다.

8. 동의 여부

□ 마케팅 정보 수신에 동의합니다. (선택)

-------------------------------------

□ 이메일 수신 동의
□ 문자 수신 동의
□ 전화 수신 동의`
                                }
                            </div>
                            <div className="p-4 border-t flex justify-end" style={{ borderColor: L.borderLight, background: L.bg }}>
                                <button 
                                    onClick={() => setModalContent(null)}
                                    className="px-5 py-2 rounded-lg font-bold text-sm bg-gray-800 text-white hover:bg-gray-700 transition"
                                >
                                    확인
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
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
