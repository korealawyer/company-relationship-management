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

// ── 회사 목록 (소속신청용) ────────────────────────────────────
const COMPANY_LIST = [
    { id: 'c1', name: '(주)놀부NBG' },
    { id: 'c2', name: '(주)교촌에프앤비' },
    { id: 'c3', name: '(주)파리바게뜨' },
    { id: 'c4', name: '(주)bhc치킨' },
    { id: 'c5', name: '(주)본죽' },
];

type Step = 'info' | 'affiliation' | 'done';
type AffMethod = 'code' | 'biz' | 'request' | null;

function StepDot({ n, current, done }: { n: number; current: number; done: boolean }) {
    const active = n === current;
    const passed = done || n < current;
    return (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all`}
            style={{
                background: passed ? '#c9a84c' : active ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)',
                color: passed ? '#04091a' : active ? '#c9a84c' : 'rgba(240,244,255,0.3)',
                border: active ? '2px solid #c9a84c' : '2px solid transparent',
            }}>
            {passed && !active ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
        </div>
    );
}

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('info');

    // Step 1 states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pwConfirm, setPwConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [infoError, setInfoError] = useState('');
    const [infoLoading, setInfoLoading] = useState(false);

    // Step 2 states
    const [method, setMethod] = useState<AffMethod>(null);
    const [affResult, setAffResult] = useState<{ companyId: string; companyName: string } | null>(null);
    const [affDone, setAffDone] = useState(false);

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

    // ── Step1 제출 ──────────────────────────────────────────────
    const handleInfoSubmit = async () => {
        if (!name || !email || !password) { setInfoError('모든 항목을 입력해주세요.'); return; }
        if (password !== pwConfirm) { setInfoError('비밀번호가 일치하지 않습니다.'); return; }
        if (password.length < 6) { setInfoError('비밀번호는 6자 이상이어야 합니다.'); return; }
        setInfoLoading(true); setInfoError('');
        await new Promise(r => setTimeout(r, 600));
        const result = signUp(name, email, password);
        setInfoLoading(false);
        if (!result.success) { setInfoError(result.error); return; }
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
    const handleBiz = () => {
        setBizError('');
        const result = lookupBizAffiliation(bizNum);
        if (!result.found) { setBizError(result.error); return; }
        updateSessionAffiliation(result.companyId, result.companyName);
        setAffResult({ companyId: result.companyId, companyName: result.companyName });
        setAffDone(true);
    };

    // ── 소속 신청 ────────────────────────────────────────────────
    const handleRequest = async () => {
        if (!reqCompany) return;
        const company = COMPANY_LIST.find(c => c.id === reqCompany);
        if (!company) return;
        setReqLoading(true);
        await new Promise(r => setTimeout(r, 600));
        requestAffiliation({ name, email, companyId: company.id, companyName: company.name, message: reqMessage });
        setReqLoading(false);
        setAffResult({ companyId: company.id, companyName: company.name });
        setAffDone(true);
    };

    const currentStep = step === 'info' ? 1 : step === 'affiliation' ? 2 : 3;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(35,68,168,0.2) 0%, transparent 65%), #04091a' }}>

            <div className="w-full max-w-md">
                {/* 로고 */}
                <div className="text-center mb-6">
                    <Link href="/" className="inline-flex items-center gap-2.5 group">
                        <div className="rounded-xl flex items-center justify-center font-black text-sm"
                            style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a', width: 44, height: 44 }}>
                            IBS
                        </div>
                        <div className="text-left">
                            <p className="font-black text-base" style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>법률사무소</p>
                            <p className="text-[9px] tracking-widest" style={{ color: 'rgba(201,168,76,0.5)' }}>IBS LAW FIRM</p>
                        </div>
                    </Link>
                </div>

                {/* 스텝 표시 */}
                <div className="flex items-center justify-center gap-2 mb-7">
                    <StepDot n={1} current={currentStep} done={currentStep > 1} />
                    <div className="flex-1 h-px max-w-[40px]" style={{ background: currentStep > 1 ? '#c9a84c' : 'rgba(255,255,255,0.08)' }} />
                    <StepDot n={2} current={currentStep} done={currentStep > 2} />
                    <div className="flex-1 h-px max-w-[40px]" style={{ background: currentStep > 2 ? '#c9a84c' : 'rgba(255,255,255,0.08)' }} />
                    <StepDot n={3} current={currentStep} done={false} />
                    <div className="ml-3 text-xs" style={{ color: 'rgba(240,244,255,0.35)' }}>
                        {step === 'info' ? '기본 정보' : step === 'affiliation' ? '소속 인증' : '가입 완료'}
                    </div>
                </div>

                <AnimatePresence mode="wait">

                    {/* ── STEP 1: 기본 정보 ── */}
                    {step === 'info' && (
                        <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="p-7 rounded-2xl space-y-4"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                                <div>
                                    <h1 className="text-lg font-black mb-0.5" style={{ color: '#f0f4ff' }}>회원가입</h1>
                                    <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>이름, 이메일, 비밀번호를 입력해주세요.</p>
                                </div>

                                {[
                                    { label: '이름', icon: <User className="w-4 h-4" />, value: name, set: setName, type: 'text', ph: '홍길동' },
                                    { label: '이메일', icon: <Mail className="w-4 h-4" />, value: email, set: setEmail, type: 'email', ph: 'name@company.com' },
                                ].map(f => (
                                    <div key={f.label}>
                                        <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.6)' }}>{f.label}</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(240,244,255,0.3)' }}>{f.icon}</span>
                                            <input type={f.type} value={f.value} onChange={e => { f.set(e.target.value); setInfoError(''); }}
                                                placeholder={f.ph}
                                                className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm"
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#f0f4ff' }} />
                                        </div>
                                    </div>
                                ))}

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

                                {infoError && (
                                    <div className="flex items-center gap-2 text-sm" style={{ color: '#f87171' }}>
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />{infoError}
                                    </div>
                                )}

                                <button onClick={handleInfoSubmit} disabled={infoLoading}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                                    style={{ background: infoLoading ? 'rgba(201,168,76,0.3)' : 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                                    {infoLoading ? '처리 중...' : <>다음 단계 <ArrowRight className="w-4 h-4" /></>}
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
                            <div className="p-7 rounded-2xl"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                                <div className="mb-5">
                                    <h2 className="text-lg font-black mb-0.5" style={{ color: '#f0f4ff' }}>소속 인증 <span className="text-sm font-normal" style={{ color: 'rgba(240,244,255,0.35)' }}>(선택)</span></h2>
                                    <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>프랜차이즈 소속이면 인증하면 혜택이 자동 적용됩니다.<br />소속 없으면 건너뛰고 바로 이용하실 수 있어요.</p>
                                </div>

                                {/* 방법 선택 */}
                                {!method && (
                                    <div className="space-y-2 mb-5">
                                        {[
                                            { key: 'code', icon: <Ticket className="w-4 h-4" />, title: '초대코드 입력', desc: '본사에서 받은 코드를 입력', color: '#c9a84c' },
                                            { key: 'biz', icon: <Hash className="w-4 h-4" />, title: '사업자번호로 검색', desc: '가맹점 사업자번호 입력', color: '#818cf8' },
                                            { key: 'request', icon: <Send className="w-4 h-4" />, title: '소속 신청 (HR 승인)', desc: '코드 없어도 신청 가능', color: '#34d399' },
                                        ].map(m => (
                                            <button key={m.key} onClick={() => setMethod(m.key as AffMethod)}
                                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all hover:scale-[1.01]"
                                                style={{ background: `${m.color}08`, border: `1px solid ${m.color}20`, color: m.color }}>
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: `${m.color}15` }}>
                                                    {m.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-sm">{m.title}</p>
                                                    <p className="text-[11px] opacity-60 mt-0.5">{m.desc}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 ml-auto opacity-40 flex-shrink-0" />
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
                                                {COMPANY_LIST.map(c => <option key={c.id} value={c.id} style={{ background: '#0f1c3f' }}>{c.name}</option>)}
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

                                {/* 건너뛰기 */}
                                <button onClick={() => setStep('done')}
                                    className="w-full py-2 text-xs transition-all"
                                    style={{ color: 'rgba(240,244,255,0.3)' }}>
                                    소속 없음 — 건너뛰고 바로 이용하기 →
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 2 완료 (인증/신청 결과) ── */}
                    {step === 'affiliation' && affDone && (
                        <motion.div key="aff-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="p-7 rounded-2xl text-center"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: method === 'request' ? '#34d399' : '#c9a84c' }} />
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
                                <button onClick={() => setStep('done')}
                                    className="w-full py-3 rounded-xl font-bold text-sm"
                                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                                    가입 완료 →
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 3: 완료 ── */}
                    {step === 'done' && (
                        <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="p-7 rounded-2xl text-center"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)' }}>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)' }}>
                                    <CheckCircle2 className="w-8 h-8" style={{ color: '#04091a' }} />
                                </div>
                                <h2 className="text-xl font-black mb-2" style={{ color: '#f0f4ff' }}>가입 완료!</h2>
                                <p className="text-sm mb-6" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                    환영합니다, <span style={{ color: '#c9a84c' }}>{name}</span>님.<br />
                                    법률 문의를 바로 시작해보세요.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => router.replace('/chat')}
                                        className="w-full py-3 rounded-xl font-bold text-sm"
                                        style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                                        법률 문의 시작하기 →
                                    </button>
                                    <button onClick={() => router.replace('/client-portal')}
                                        className="w-full py-2.5 rounded-xl text-sm"
                                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,244,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        고객 포털 보기
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
