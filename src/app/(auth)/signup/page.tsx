'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2,
    Building2, Hash, MessageSquare, ChevronRight, AlertCircle,
    Ticket, Search, Send, X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    signUp, verifyInviteCode, lookupBizAffiliation,
    requestAffiliation, updateSessionAffiliation, INVITE_CODES
} from '@/lib/auth';

// ── 회사 목록 (소속신청용: 이제 useCompanies에서 동적으로 가져옵니다) ──

type Step = 'info' | 'affiliation' | 'done';
type AffMethod = 'code' | 'biz' | 'request' | null;



import { useCompanies } from '@/hooks/useDataLayer';

export default function SignupPage() {
    const router = useRouter();
    const { companies } = useCompanies();
    const dynamicCompanyList = companies ? companies.map(c => ({ id: c.id, name: c.name })) : [];
    
    const [step, setStep] = useState<Step>('info');

    // Step 1 states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pwConfirm, setPwConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [agreeMarketing, setAgreeMarketing] = useState(false);
    const [infoError, setInfoError] = useState('');
    const [infoLoading, setInfoLoading] = useState(false);
    
    // Check duplicates state
    const [bizNumMain, setBizNumMain] = useState('');
    const [emailCheckLoading, setEmailCheckLoading] = useState(false);
    const [bizCheckLoading, setBizCheckLoading] = useState(false);
    const [emailChecked, setEmailChecked] = useState(false);
    const [bizChecked, setBizChecked] = useState(false);

    const checkDuplicateEmail = async () => {
        if (!email) { setInfoError('이메일을 입력해주세요.'); return; }
        setEmailCheckLoading(true); setInfoError('');
        try {
            const res = await fetch('/api/auth/check-duplicate', {
                method: 'POST', body: JSON.stringify({ type: 'email', value: email })
            });
            const data = await res.json();
            if (data.duplicate) { setEmailChecked(false); setInfoError('이미 가입된 이메일입니다.'); }
            else { setEmailChecked(true); setInfoError(''); }
        } catch(e) { setInfoError('이메일 중복 확인 실패'); }
        setEmailCheckLoading(false);
    };

    const checkDuplicateBiz = async () => {
        if (!bizNumMain) { setInfoError('사업자번호를 입력해주세요.'); return; }
        setBizCheckLoading(true); setInfoError('');
        try {
            const res = await fetch('/api/auth/check-duplicate', {
                method: 'POST', body: JSON.stringify({ type: 'bizNum', value: bizNumMain })
            });
            const data = await res.json();
            if (data.duplicate) { setBizChecked(false); setInfoError('해당 사업자번호는 이미 등록되어 있습니다.'); }
            else { setBizChecked(true); setInfoError(''); }
        } catch(e) { setInfoError('사업자번호 중복 확인 실패'); }
        setBizCheckLoading(false);
    };

    const [method, setMethod] = useState<AffMethod>(null);
    const [affResult, setAffResult] = useState<{ companyId: string; companyName: string } | null>(null);
    const [affDone, setAffDone] = useState(false);
    const [modalContent, setModalContent] = useState<'privacy' | 'terms' | 'marketing' | null>(null);

    // Code method
    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [codeLoading, setCodeLoading] = useState(false);

    // Biz method
    const [bizNum, setBizNum] = useState('');
    const [bizError, setBizError] = useState('');

    // Request method
    const [reqCompany, setReqCompany] = useState('');
    const [reqMessage, setReqMessage] = useState('');
    const [reqLoading, setReqLoading] = useState(false);

    const formatBiz = (v: string) => {
        const d = v.replace(/\D/g, '').slice(0, 10);
        if (d.length <= 3) return d;
        if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
        return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
    };

    const goToDashboard = () => {
        const roleHome: Record<string, string> = {
            sales: '/employee', lawyer: '/lawyer', litigation: '/litigation',
            hr: '/employee', finance: '/employee', admin: '/employee',
            super_admin: '/employee', counselor: '/counselor', client_hr: '/dashboard',
        };
        const session = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('ibs_auth_v1') || '{}') : {};
        const homePath = roleHome[session.role] || '/dashboard?onboarding=1';
        router.replace(homePath);
    };

    // ── Step1 제출 ──────────────────────────────────────────────
    const handleInfoSubmit = async () => {
        if (!agreeTerms || !agreePrivacy) { setInfoError('필수 약관에 모두 동의해주세요.'); return; }
        if (!name || !email || !password || !bizNumMain) { setInfoError('모든 항목을 입력해주세요.'); return; }
        if (!emailChecked) { setInfoError('이메일 중복 확인을 진행해주세요.'); return; }
        if (!bizChecked) { setInfoError('사업자번호 중복 확인을 진행해주세요.'); return; }
        if (password !== pwConfirm) { setInfoError('비밀번호가 일치하지 않습니다.'); return; }
        if (password.length < 6) { setInfoError('비밀번호는 6자 이상이어야 합니다.'); return; }
        setInfoLoading(true); setInfoError('');
        await new Promise(r => setTimeout(r, 600));
        const trimmedCode = inviteCode.trim() || undefined;
        const result = await signUp(name, email, password, trimmedCode);
        setInfoLoading(false);
        if (!result.success) { setInfoError(result.error); return; }
        // 초대코드로 내부 직원이 가입한 경우 → 대시보드로 바로 진입
        if (trimmedCode) {
            const codeEntry = INVITE_CODES[trimmedCode.toUpperCase()];
            if (codeEntry?.isInternal) {
                goToDashboard();
                return;
            }
            // 고객사 초대코드인 경우
            setAffResult({ companyId: codeEntry?.companyId || '', companyName: codeEntry?.companyName || '' });
            setAffDone(true);
            goToDashboard();
            return;
        }
        setStep('affiliation');
    };

    // ── 초대코드 인증 ────────────────────────────────────────────
    const handleCode = async () => {
        setCodeLoading(true); setCodeError('');
        await new Promise(r => setTimeout(r, 500));
        const result = verifyInviteCode(code);
        setCodeLoading(false);
        if (!result.valid) { setCodeError(result.error); return; }
        updateSessionAffiliation(result.companyId, result.companyName);
        setAffResult({ companyId: result.companyId, companyName: result.companyName });
        setAffDone(true);
    };

    // ── 사업자번호 인증 ──────────────────────────────────────────
    const handleBiz = async () => {
        setBizError('');
        const result = await lookupBizAffiliation(bizNum);
        if (!result.found) { setBizError(result.error); return; }
        updateSessionAffiliation(result.companyId, result.companyName);
        setAffResult({ companyId: result.companyId, companyName: result.companyName });
        setAffDone(true);
    };

    // ── 소속 신청 ────────────────────────────────────────────────
    const handleRequest = async () => {
        if (!reqCompany) return;
        const company = dynamicCompanyList.find(c => c.id === reqCompany);
        if (!company) return;
        setReqLoading(true);
        await new Promise(r => setTimeout(r, 600));
        requestAffiliation({ name, email, companyId: company.id, companyName: company.name, message: reqMessage });
        setReqLoading(false);
        setAffResult({ companyId: company.id, companyName: company.name });
        setAffDone(true);
    };


    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(35,68,168,0.2) 0%, transparent 65%), #04091a' }}>

            <div className="w-full max-w-md">


                <AnimatePresence mode="wait">

                    {/* ── STEP 1: 기본 정보 ── */}
                    {step === 'info' && (
                        <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="p-7 rounded-2xl space-y-4"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                                <div>
                                    <h1 className="text-lg font-black mb-0.5" style={{ color: '#f0f4ff' }}>회원가입</h1>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.6)' }}>이름 (기업회원은 기업명)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(240,244,255,0.3)' }}><User className="w-4 h-4" /></span>
                                        <input type="text" value={name} onChange={e => { setName(e.target.value); setInfoError(''); }}
                                            className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#f0f4ff' }} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.6)' }}>사업자번호</label>
                                    <div className="flex gap-2 relative">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(240,244,255,0.3)' }}><Building2 className="w-4 h-4" /></span>
                                            <input type="text" value={bizNumMain} onChange={e => { setBizNumMain(formatBiz(e.target.value)); setBizChecked(false); setInfoError(''); }}
                                                placeholder="000-00-00000"
                                                className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm"
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#f0f4ff' }} />
                                        </div>
                                        <button onClick={checkDuplicateBiz} disabled={bizCheckLoading || !bizNumMain || bizChecked}
                                            className="px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center min-w-[80px]"
                                            style={{ 
                                                background: bizChecked ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', 
                                                color: bizChecked ? '#4ade80' : 'rgba(240,244,255,0.8)',
                                                border: `1px solid ${bizChecked ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.09)'}`
                                            }}
                                        >
                                            {bizCheckLoading ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" /> : 
                                            bizChecked ? '확인완료' : '중복확인'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.6)' }}>이메일</label>
                                    <div className="flex gap-2 relative">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(240,244,255,0.3)' }}><Mail className="w-4 h-4" /></span>
                                            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailChecked(false); setInfoError(''); }}
                                                placeholder="name@company.com"
                                                className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm"
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#f0f4ff' }} />
                                        </div>
                                        <button onClick={checkDuplicateEmail} disabled={emailCheckLoading || !email || emailChecked}
                                            className="px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center min-w-[80px]"
                                            style={{ 
                                                background: emailChecked ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', 
                                                color: emailChecked ? '#4ade80' : 'rgba(240,244,255,0.8)',
                                                border: `1px solid ${emailChecked ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.09)'}`
                                            }}
                                        >
                                            {emailCheckLoading ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" /> : 
                                            emailChecked ? '확인완료' : '중복확인'}
                                        </button>
                                    </div>
                                </div>

                                {/* 비밀번호 */}
                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.6)' }}>비밀번호</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                        <input type={showPw ? 'text' : 'password'} value={password}
                                            onChange={e => { setPassword(e.target.value); setInfoError(''); }}
                                            placeholder="6자 이상"
                                            className="w-full pl-9 pr-10 py-2.5 rounded-xl outline-none text-sm"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#f0f4ff' }} />
                                        <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.6)' }}>비밀번호 확인</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(240,244,255,0.3)' }} />
                                        <input type="password" value={pwConfirm}
                                            onChange={e => { setPwConfirm(e.target.value); setInfoError(''); }}
                                            placeholder="비밀번호 재입력"
                                            onKeyDown={e => e.key === 'Enter' && handleInfoSubmit()}
                                            className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${pwConfirm && pwConfirm !== password ? '#f87171' : 'rgba(255,255,255,0.09)'}`, color: '#f0f4ff' }} />
                                    </div>
                                </div>

                                {/* 초대코드 (선택) */}
                                <div>
                                    <button onClick={() => setShowInvite(!showInvite)}
                                        className="flex items-center gap-1.5 text-[11px] font-normal mb-1 transition-all"
                                        style={{ color: showInvite ? '#c9a84c' : 'rgba(255,255,255,0.2)' }}>
                                        <Ticket className={`w-3 h-3 ${!showInvite && 'opacity-60'}`} />
                                        {showInvite ? '초대코드 접기' : '내부 직원 / 초대코드가 있으신가요?'}
                                    </button>
                                    {showInvite && (
                                        <div className="relative">
                                            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(201,168,76,0.5)' }} />
                                            <input type="text" value={inviteCode}
                                                onChange={e => { setInviteCode(e.target.value.toUpperCase()); setInfoError(''); }}
                                                placeholder="예: IBS-SALES-2026"
                                                className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm"
                                                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', color: '#e8c87a' }} />
                                            <p className="text-[10px] mt-1" style={{ color: 'rgba(201,168,76,0.4)' }}>초대코드 입력 시 소속 인증 단계를 건너뜁니다</p>
                                        </div>
                                    )}
                                </div>

                                {/* 약관 동의 */}
                                <div className="space-y-0 !mt-2">
                                    <div className="flex items-center justify-between">
                                        <div onClick={() => { setAgreeTerms(!agreeTerms); setInfoError(''); }}
                                             className="flex items-center gap-1.5 text-[11px] font-normal cursor-pointer select-none transition-all" 
                                             style={{ color: agreeTerms ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}>
                                            <CheckCircle2 className={`w-3.5 h-3.5 transition-opacity ${agreeTerms ? 'text-[#c9a84c] opacity-50' : 'opacity-30'}`} />
                                            [필수] IBS 법률사무소 회원 이용약관 동의
                                        </div>
                                        <button 
                                            onClick={() => setModalContent('terms')}
                                            className="text-[10px] hover:underline transition-colors" 
                                            style={{ color: 'rgba(255,255,255,0.15)' }}>보기</button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div onClick={() => { setAgreePrivacy(!agreePrivacy); setInfoError(''); }}
                                             className="flex items-center gap-1.5 text-[11px] font-normal cursor-pointer select-none transition-all" 
                                             style={{ color: agreePrivacy ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}>
                                            <CheckCircle2 className={`w-3.5 h-3.5 transition-opacity ${agreePrivacy ? 'text-[#c9a84c] opacity-50' : 'opacity-30'}`} />
                                            [필수] 개인정보 제3자 제공 및 수집·이용 동의
                                        </div>
                                        <button 
                                            onClick={() => setModalContent('privacy')}
                                            className="text-[10px] hover:underline transition-colors" 
                                            style={{ color: 'rgba(255,255,255,0.15)' }}>보기</button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div onClick={() => { setAgreeMarketing(!agreeMarketing); setInfoError(''); }}
                                             className="flex items-center gap-1.5 text-[11px] font-normal cursor-pointer select-none transition-all" 
                                             style={{ color: agreeMarketing ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}>
                                            <CheckCircle2 className={`w-3.5 h-3.5 transition-opacity ${agreeMarketing ? 'text-[#c9a84c] opacity-50' : 'opacity-30'}`} />
                                            [선택] 마케팅 정보 수신 동의
                                        </div>
                                        <button 
                                            onClick={() => setModalContent('marketing')}
                                            className="text-[10px] hover:underline transition-colors" 
                                            style={{ color: 'rgba(255,255,255,0.15)' }}>보기</button>
                                    </div>
                                </div>

                                {infoError && (
                                    <div className="flex items-center gap-2 text-sm" style={{ color: '#f87171' }}>
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />{infoError}
                                    </div>
                                )}

                                <button onClick={handleInfoSubmit} disabled={infoLoading}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                                    style={{ background: infoLoading ? 'rgba(201,168,76,0.3)' : 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                                    {infoLoading ? '처리 중...' : '회원가입'}
                                </button>

                                <p className="text-xs text-center" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                    이미 계정이 있으신가요? <Link href="/login" style={{ color: '#c9a84c' }}>로그인</Link>
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 2: 소속 인증 ── */}
                    {step === 'affiliation' && !affDone && (
                        <motion.div key="aff" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <div className="p-7 rounded-2xl relative"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                                
                                <button onClick={goToDashboard}
                                    className="absolute top-5 right-5 px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
                                    style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}>
                                    사이트 투어 <ArrowRight className="w-3 h-3" />
                                </button>

                                <div className="mb-6 text-center mt-2">
                                    <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-[#c9a84c]" />
                                    </div>
                                    <h2 className="text-xl font-black mb-1" style={{ color: '#f0f4ff' }}>가입이 완료되었습니다!</h2>
                                    <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>환영합니다. 지금 바로 IBS법률사무소의 서비스를 경험해 보세요.</p>
                                </div>

                                <div className="border-t pt-5 mb-5" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <h3 className="text-sm font-bold mb-1" style={{ color: '#f0f4ff' }}>소속 인증 <span className="text-xs font-normal" style={{ color: 'rgba(240,244,255,0.35)' }}>(선택)</span></h3>
                                    <p className="text-[11px]" style={{ color: 'rgba(240,244,255,0.4)' }}>프랜차이즈 소속이신가요? 인증 시 전용 혜택이 자동 적용됩니다.</p>
                                </div>

                                {/* 방법 선택 */}
                                {!method && (
                                    <div className="space-y-1.5 mb-5 opacity-60 hover:opacity-100 transition-opacity duration-300">
                                        {[
                                            { key: 'code', icon: <Ticket className="w-3.5 h-3.5" />, title: '초대코드 입력', desc: '본사에서 받은 코드를 입력' },
                                            { key: 'biz', icon: <Hash className="w-3.5 h-3.5" />, title: '사업자번호로 검색', desc: '가맹점 사업자번호 입력' },
                                            { key: 'request', icon: <Send className="w-3.5 h-3.5" />, title: '소속 신청 (HR 승인)', desc: '코드 없어도 신청 가능' },
                                        ].map(m => (
                                            <button key={m.key} onClick={() => setMethod(m.key as AffMethod)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-white/5"
                                                style={{ border: `1px solid rgba(255,255,255,0.03)`, color: 'rgba(240,244,255,0.7)' }}>
                                                <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                                                    style={{ background: `rgba(255,255,255,0.04)` }}>
                                                    {m.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-xs">{m.title}</p>
                                                    <p className="text-[10px] opacity-50 mt-0.5">{m.desc}</p>
                                                </div>
                                                <ChevronRight className="w-3 h-3 ml-auto opacity-20 flex-shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* ── 방법 A: 초대코드 ── */}
                                {method === 'code' && (
                                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <button onClick={() => { setMethod(null); setCodeError(''); setCode(''); }}
                                                className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                                <X className="w-4 h-4" />
                                            </button>
                                            <p className="text-sm font-black" style={{ color: '#c9a84c' }}>초대코드 입력</p>
                                        </div>
                                        <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: 'rgba(201,168,76,0.06)', color: 'rgba(201,168,76,0.7)' }}>
                                            테스트 코드: <b>GYOCHON-2026</b> / <b>NOLBOO-2026</b>
                                        </div>
                                        <input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError(''); }}
                                            placeholder="예: GYOCHON-2026"
                                            className="w-full px-4 py-2.5 rounded-xl outline-none text-sm font-mono tracking-wider"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.2)', color: '#f0f4ff' }} />
                                        {codeError && <p className="text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertCircle className="w-3.5 h-3.5" />{codeError}</p>}
                                        <button onClick={handleCode} disabled={codeLoading || !code}
                                            className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                            style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a', opacity: !code ? 0.5 : 1 }}>
                                            {codeLoading ? '확인 중...' : <>코드 인증 <CheckCircle2 className="w-4 h-4" /></>}
                                        </button>
                                    </motion.div>
                                )}

                                {/* ── 방법 B: 사업자번호 ── */}
                                {method === 'biz' && (
                                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <button onClick={() => { setMethod(null); setBizError(''); setBizNum(''); }}
                                                className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                                <X className="w-4 h-4" />
                                            </button>
                                            <p className="text-sm font-black" style={{ color: '#818cf8' }}>사업자번호 조회</p>
                                        </div>
                                        <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: 'rgba(129,140,248,0.06)', color: 'rgba(129,140,248,0.7)' }}>
                                            테스트: <b>123-45-67890</b> (놀부NBG) / <b>999-90-01001</b> (가맹점)
                                        </div>
                                        <input value={bizNum} onChange={e => { setBizNum(formatBiz(e.target.value)); setBizError(''); }}
                                            placeholder="000-00-00000" maxLength={12}
                                            className="w-full px-4 py-2.5 rounded-xl outline-none text-sm font-mono tracking-wider"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(129,140,248,0.2)', color: '#f0f4ff' }} />
                                        {bizError && <p className="text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertCircle className="w-3.5 h-3.5" />{bizError}</p>}
                                        <button onClick={handleBiz} disabled={bizNum.replace(/\D/g, '').length !== 10}
                                            className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                            style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.3)', opacity: bizNum.replace(/\D/g, '').length !== 10 ? 0.5 : 1 }}>
                                            <Search className="w-4 h-4" /> 소속 조회
                                        </button>
                                    </motion.div>
                                )}

                                {/* ── 방법 C: HR 승인 신청 ── */}
                                {method === 'request' && (
                                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <button onClick={() => { setMethod(null); setReqCompany(''); setReqMessage(''); }}
                                                className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                                <X className="w-4 h-4" />
                                            </button>
                                            <p className="text-sm font-black" style={{ color: '#34d399' }}>소속 신청</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.5)' }}>소속 회사 선택</label>
                                            <select value={reqCompany} onChange={e => setReqCompany(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl outline-none text-sm"
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(52,211,153,0.2)', color: reqCompany ? '#f0f4ff' : 'rgba(240,244,255,0.3)' }}>
                                                <option value="">-- 선택하세요 --</option>
                                                {dynamicCompanyList.map(c => <option key={c.id} value={c.id} style={{ background: '#0f1c3f' }}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.5)' }}>메모 (선택)</label>
                                            <textarea value={reqMessage} onChange={e => setReqMessage(e.target.value)}
                                                placeholder="소속 확인을 위한 추가 정보 (직책, 점포명 등)"
                                                rows={2}
                                                className="w-full px-4 py-2.5 rounded-xl outline-none text-sm resize-none"
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(52,211,153,0.2)', color: '#f0f4ff' }} />
                                        </div>
                                        <button onClick={handleRequest} disabled={!reqCompany || reqLoading}
                                            className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', opacity: !reqCompany ? 0.5 : 1 }}>
                                            {reqLoading ? '신청 중...' : <><Send className="w-4 h-4" /> 소속 신청 보내기</>}
                                        </button>
                                    </motion.div>
                                )}


                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 2 완료 (인증/신청 결과) ── */}
                    {step === 'affiliation' && affDone && (
                        <motion.div key="aff-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="p-7 rounded-2xl text-center relative"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                                <button onClick={goToDashboard}
                                    className="absolute top-5 right-5 px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
                                    style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}>
                                    사이트 투어 <ArrowRight className="w-3 h-3" />
                                </button>
                                
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 mt-4" style={{ color: method === 'request' ? '#34d399' : '#c9a84c' }} />
                                <p className="font-black text-lg mb-1" style={{ color: '#f0f4ff' }}>
                                    {method === 'request' ? '소속 신청 완료!' : '소속 인증 완료!'}
                                </p>
                                <p className="text-sm mb-1" style={{ color: '#c9a84c' }}>{affResult?.companyName}</p>
                                {method === 'request' && (
                                    <p className="text-xs mb-4" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                        HR 담당자 승인 후 소속이 자동 적용됩니다.<br />승인 전에도 법률 상담 이용은 가능합니다.
                                    </p>
                                )}
                                {method !== 'request' && (
                                    <p className="text-xs mb-4" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                        본사 지원 멤버십이 자동 적용되었습니다.
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}


                </AnimatePresence>

                {/* ── 약관 / 동의 모달 ── */}
                <AnimatePresence>
                    {modalContent && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setModalContent(null)}
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                                className="relative w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
                                style={{
                                    background: '#04091a', 
                                    border: '1px solid rgba(201,168,76,0.2)',
                                    maxHeight: '80vh'
                                }}
                            >
                                <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <h3 className="font-black text-lg" style={{ color: '#f0f4ff' }}>
                                        {modalContent === 'privacy' && '개인정보 수집 및 처리방침'}
                                        {modalContent === 'terms' && 'IBS 법률사무소 회원 이용약관'}
                                    </h3>
                                    <button 
                                        onClick={() => setModalContent(null)}
                                        className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'rgba(240,244,255,0.6)' }}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(240,244,255,0.7)' }}>
                                    {modalContent === 'privacy' ? `개인정보 수집 및 이용 동의 (필수)

1. 수집하는 개인정보의 항목
- 필수항목: 이름, 이메일, 비밀번호
- 자동수집항목: 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보

2. 개인정보의 수집 및 이용 목적
- 홈페이지 관련 회원 가입의사 확인, 법률 상담 서비스 제공, 법인 확인
- 서비스 제공에 따른 요금 및 서비스 현황 안내
- 불량 회원의 부정 이용 방지와 비인가 사용 방지

3. 개인정보의 보유 및 이용 기간
회원 탈퇴 처리 시까지 보유 및 이용되며, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
- 소비자의 불만 또는 분쟁처리에 관한 기록: 3년
- 대금결제 및 재화 등의 공급에 관한 기록: 5년
- 계약 또는 청약철회 등에 관한 기록: 5년

4. 동의를 거부할 권리 및 거부에 따른 불이익
귀하는 개인정보 수집 및 이용에 동의를 거부할 권리가 있으나, 필수항목 동의 거부 시 회원가입 및 서비스 이용이 제한됩니다.` 
                                      : modalContent === 'marketing' ? `마케팅 정보 수신 동의 (선택)

1. 수집 항목
- 휴대전화번호, 이메일 주소

2. 이용 목적
- 신규 서비스 안내, 프로모션 및 이벤트 정보 제공, 뉴스레터 발송, 서비스 맞춤형 광고 전송

3. 보유 및 이용 기간
- 동의 철회 시 또는 회원 탈퇴 시까지

4. 동의 거부 안내
- 마케팅 정보 수신 동의를 거부하실 수 있으며, 거부하셔도 기본 서비스 이용에는 제한이 없습니다. 단, 이벤트 안내 및 맞춤형 혜택 정보 제공은 제한될 수 있습니다.`
                                      : 
`IBS 법률사무소 회원 이용약관


제1조(목적)

본 약관은 IBS공동법률사무소(대표변호사 유정훈, 이하 ‘IBS’라 합니다)가 운영하는 법률, 송무 및 회원 서비스 등 이용과 관련하여 IBS와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)

1. 회원 : 본 약관에 동의하고 IBS 홈페이지에 회원으로 가입하여 서비스를 이용하는 기업 또는 기업 담당자 및 개인을 의미합니다.
2. 회원 계정 : 회원이 IBS 홈페이지에 로그인하기 위하여 사용하는 이메일 기반 계정을 의미합니다.
3. 이용계약 : 회원이 본 약관에 동의하고 IBS가 이를 승인함으로써 체결되는 서비스 이용 계약을 의미합니다.
4. 법률 리포트 : IBS가 기업의 업종, 경영환경 및 법률 환경을 분석하여 제공하는 법률 관련 보고서를 의미합니다.

제3조 (회사 정보의 제공)
IBS는 다음 정보를 홈페이지에 게시합니다.
- 상호
- 대표자
- 사업자등록번호
- 주소
- 연락처
- 이메일
- 개인정보 보호책임자

제4조 (약관의 효력 및 변경)

1. 본 약관은 홈페이지에 게시하거나 기타 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. IBS는 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다.
3. 약관이 변경되는 경우 적용일자 및 변경 사유를 명시하여 시행일 7일 이전에 공지합니다.
4. 회원에게 불리한 내용이 변경되는 경우에는 시행일 30일 전에 공지합니다.

제5조 (회원가입)
회원가입 절차는 다음과 같습니다.
1. 기업 정보 입력
2. 이용약관 및 개인정보 처리방침 동의
3. 이메일로 임시 비밀번호 발송에 따른 홈페이지 로그인
4. 마케팅 정보 수신 동의 (선택)

제6조 (회원계정의 관리)

1. 회원은 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.
2. 회원은 계정을 제3자에게 양도, 대여 또는 공유할 수 없습니다.
3. 계정 도용을 인지한 경우 즉시 IBS에 통지하여야 합니다.
4. 회원의 관리 소홀로 발생한 문제에 대해서 IBS는 책임을 지지 않습니다.

제7조 (회원정보의 변경)

회원은 언제든지 자신의 회원정보를 열람하고 수정할 수 있으며, 변경하지 않아 발생하는 불이익은 회원의 책임입니다.

제8조 (회원 탈퇴)

회원은 언제든지 홈페이지 또는 이메일을 통해 탈퇴를 요청할 수 있으며 IBS는 지체 없이 탈퇴를 처리합니다.

제9조 (회원의 의무)
회원은 다음 행위를 하여서는 안 됩니다.
1. 타인의 계정 사용
2. 허위 정보 입력
3. 서비스 운영 방해 행위
4. IBS 또는 제3자의 권리를 침해하는 행위
5. 법령 또는 본 약관을 위반하는 행위

제10조 (회원자격 제한 및 정지)

IBS는 약관 위반, 서비스 운영 방해, 불법 행위 또는 타인의 권리 침해가 발생한 경우 회원의 서비스 이용을 제한하거나 회원자격을 정지할 수 있습니다.

제11조 (회원에 대한 통지)

IBS는 이메일, 홈페이지 공지 또는 서비스 알림 등의 방법으로 회원에게 통지할 수 있습니다.

제12조 (개인정보 보호)

IBS는 회원의 개인정보 보호를 위해 개인정보 처리방침을 수립하여 운영하며 개인정보 관련 사항은 개인정보 처리방침에 따릅니다.

제13조 (면책)

IBS는 회원의 귀책 사유, 시스템 장애, 불가항력적 사유 또는 서비스 이용 과정에서 발생한 간접 손해에 대해 책임을 지지 않습니다.

또한 IBS가 제공하는 법률 리포트 및 정보는 일반적인 법률 정보 제공을 목적으로 하며 개별 사건에 대한 법률 자문을 대체하지 않습니다.

제14조 (분쟁 해결 및 관할 법원)

IBS와 회원 간 분쟁이 발생할 경우 상호 협의를 통해 해결하며 협의가 이루어지지 않는 경우 IBS 본점 소재지 관할 법원을 전속 관할로 합니다.

부칙

본 약관은 2026년 3월 1일부터 시행합니다.`
                                    }
                                </div>
                                <div className="p-4 border-t flex justify-end" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                                    <button 
                                        onClick={() => setModalContent(null)}
                                        className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                                        style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}
                                    >
                                        확인
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
