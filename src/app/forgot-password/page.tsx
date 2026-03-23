'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Lock, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import Link from 'next/link';

type Step = 'input' | 'sent' | 'done';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<Step>('input');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) { setError('이메일을 입력해주세요.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('올바른 이메일 형식을 입력해주세요.'); return; }

        setLoading(true); setError('');
        // 실제 구현 시 API 호출로 교체
        await new Promise(r => setTimeout(r, 1500));
        setLoading(false);
        setStep('sent');
    };

    const L = {
        bg: '#f8f9fc',
        card: '#ffffff',
        heading: '#0f172a',
        sub: '#475569',
        muted: '#64748b',
        faint: '#94a3b8',
        border: '#e2e8f0',
        borderLight: '#f1f5f9',
        gold: '#b8960a',
        goldLight: '#fef9e7',
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative"
            style={{ background: `linear-gradient(135deg, ${L.bg} 0%, #eef2ff 50%, ${L.goldLight} 100%)` }}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,150,10,0.06), transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.04), transparent 70%)' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* 로고 */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                        style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', boxShadow: '0 4px 16px rgba(184,150,10,0.25)' }}>
                        <KeyRound className="w-6 h-6" style={{ color: '#0f172a' }} />
                    </div>
                    <h1 className="text-2xl font-black mb-1" style={{ color: L.heading }}>비밀번호 찾기</h1>
                    <p className="text-sm" style={{ color: L.muted }}>IBS 법률사무소 플랫폼</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    style={{ background: L.card, border: `1px solid ${L.border}`, borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

                    <AnimatePresence mode="wait">
                        {step === 'input' && (
                            <motion.div key="input" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                                <h2 className="text-lg font-black mb-1" style={{ color: L.heading }}>이메일 인증</h2>
                                <p className="text-xs mb-6" style={{ color: L.muted }}>
                                    가입하신 이메일 주소를 입력하면 임시 비밀번호를 발송해 드립니다.
                                </p>
                                <form onSubmit={handleSend} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5" style={{ color: L.sub }}>이메일</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: L.faint }} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => { setEmail(e.target.value); setError(''); }}
                                                placeholder="name@company.co.kr"
                                                style={{
                                                    width: '100%', padding: '10px 14px 10px 38px',
                                                    background: L.borderLight, border: `1px solid ${error ? '#dc2626' : L.border}`,
                                                    borderRadius: 12, fontSize: 14, color: L.heading, outline: 'none',
                                                }}
                                            />
                                        </div>
                                        {error && (
                                            <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: '#dc2626' }}>
                                                <AlertCircle className="w-3.5 h-3.5" /> {error}
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                                        style={{
                                            background: loading ? 'rgba(201,168,76,0.3)' : 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                            color: '#0f172a',
                                            boxShadow: loading ? 'none' : '0 2px 12px rgba(184,150,10,0.25)',
                                        }}>
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                발송 중...
                                            </span>
                                        ) : <>임시 비밀번호 발송 <ArrowRight className="w-4 h-4" /></>}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 'sent' && (
                            <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }} className="text-center py-4">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{ background: 'rgba(74,198,80,0.1)', border: '2px solid rgba(74,198,80,0.3)' }}>
                                    <CheckCircle2 className="w-8 h-8" style={{ color: '#22c55e' }} />
                                </div>
                                <h2 className="text-xl font-black mb-2" style={{ color: L.heading }}>이메일 발송 완료</h2>
                                <p className="text-sm mb-1" style={{ color: L.sub }}>
                                    <strong style={{ color: L.gold }}>{email}</strong>
                                </p>
                                <p className="text-sm mb-6" style={{ color: L.muted }}>
                                    위 주소로 임시 비밀번호를 발송했습니다.<br />
                                    메일함을 확인해 주세요. (스팸 폴더 포함)
                                </p>
                                <div className="rounded-xl p-4 mb-4 text-left"
                                    style={{ background: L.borderLight, border: `1px solid ${L.border}` }}>
                                    <p className="text-xs font-bold mb-2" style={{ color: L.sub }}>🔑 임시 비밀번호 안내</p>
                                    <p className="text-xs" style={{ color: L.muted }}>
                                        로그인 후 반드시 설정 → 비밀번호 변경에서 새 비밀번호로 변경해 주세요.
                                    </p>
                                </div>
                                <p className="text-xs" style={{ color: L.faint }}>
                                    이메일이 오지 않으면{' '}
                                    <button onClick={() => setStep('input')} className="font-bold" style={{ color: L.gold }}>
                                        다시 시도
                                    </button>하거나 관리자에게 문의하세요.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <div className="text-center mt-5">
                    <p className="text-xs" style={{ color: L.faint }}>
                        비밀번호가 기억나셨나요?{' '}
                        <Link href="/login" className="font-bold" style={{ color: L.gold }}>
                            로그인으로 이동
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
