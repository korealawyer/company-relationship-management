'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, User, CreditCard, Lock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STEPS = ['사업자 정보', '담당자 정보', '플랜 선택', '계정 설정', '완료'];
const PLANS = [
    { id: 'basic', name: 'Basic', price: 990000, color: '#60a5fa' },
    { id: 'pro', name: 'Pro', price: 2490000, color: '#c9a84c', popular: true },
    { id: 'premium', name: 'Premium', price: 4990000, color: '#a78bfa' },
];

interface InputRowProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    type?: string;
}

function InputRow({ label, value, onChange, placeholder, type = 'text' }: InputRowProps) {
    return (
        <div>
            <label className="block text-sm font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.7)' }}>{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }} />
        </div>
    );
}

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [biz, setBiz] = useState({ bizNo: '', companyName: '', ceoName: '', address: '' });
    const [contact, setContact] = useState({ name: '', title: '', email: '', phone: '' });
    const [selectedPlan, setSelectedPlan] = useState('pro');
    const [account, setAccount] = useState({ password: '', confirm: '' });

    const lookupBizNo = async () => {
        if (biz.bizNo.replace(/[^0-9]/g, '').length !== 10) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        // Phase 2: 국세청 API 조회
        setBiz(p => ({ ...p, companyName: '(주)테스트가맹본부', ceoName: '홍길동', address: '서울시 강남구 테헤란로 123' }));
        setLoading(false);
    };

    const nextStep = async () => {
        if (step === 4) {
            // 완료 → 로그인 페이지
            await new Promise(r => setTimeout(r, 1000));
            router.push('/login');
            return;
        }
        if (step === 2) {
            setLoading(true);
            await new Promise(r => setTimeout(r, 800)); // Phase 2: KCP 결제
            setLoading(false);
        }
        setStep(s => s + 1);
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-4" style={{ background: '#04091a' }}>
            <div className="max-w-xl mx-auto">
                {/* 헤더 */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black" style={{ color: '#f0f4ff' }}>가맹본부 가입</h1>
                    <p className="text-sm mt-2" style={{ color: 'rgba(240,244,255,0.4)' }}>5분이면 완료됩니다</p>
                </div>

                {/* 스텝 인디케이터 */}
                <div className="flex items-center justify-between mb-10 px-2">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className="flex flex-col items-center gap-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all`}
                                    style={{
                                        background: i < step ? '#4ade80' : i === step ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.05)',
                                        color: i < step ? '#0a0e1a' : i === step ? '#c9a84c' : 'rgba(240,244,255,0.3)',
                                        border: i === step ? '1px solid rgba(201,168,76,0.5)' : 'none',
                                    }}>
                                    {i < step ? '✓' : i + 1}
                                </div>
                                <span className="text-[10px] hidden md:block" style={{ color: i === step ? '#c9a84c' : 'rgba(240,244,255,0.3)' }}>{s}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className="flex-1 h-0.5 mx-1" style={{ background: i < step ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.06)' }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* 카드 */}
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="p-8 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

                    {step === 0 && (
                        <div className="space-y-4">
                            <h2 className="font-black text-lg mb-6" style={{ color: '#c9a84c' }}>
                                <Building2 className="w-5 h-5 inline mr-2" />사업자 정보
                            </h2>
                            <div className="flex gap-2">
                                <input value={biz.bizNo} onChange={e => setBiz(p => ({ ...p, bizNo: e.target.value }))}
                                    placeholder="사업자등록번호 (10자리)"
                                    className="flex-1 px-4 py-3 rounded-xl outline-none text-sm"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }} />
                                <button onClick={lookupBizNo} disabled={loading}
                                    className="px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap"
                                    style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '조회'}
                                </button>
                            </div>
                            {biz.companyName && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="p-4 rounded-xl" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                                    <p className="text-sm font-bold" style={{ color: '#4ade80' }}>✓ 조회 완료</p>
                                    <p className="text-sm mt-1" style={{ color: 'rgba(240,244,255,0.7)' }}>{biz.companyName} · 대표 {biz.ceoName}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>{biz.address}</p>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="font-black text-lg mb-6" style={{ color: '#c9a84c' }}>
                                <User className="w-5 h-5 inline mr-2" />담당자 정보
                            </h2>
                            <InputRow label="이름" value={contact.name} onChange={(v: string) => setContact(p => ({ ...p, name: v }))} placeholder="홍길동" />
                            <InputRow label="직함" value={contact.title} onChange={(v: string) => setContact(p => ({ ...p, title: v }))} placeholder="HR 팀장" />
                            <InputRow label="이메일" value={contact.email} onChange={(v: string) => setContact(p => ({ ...p, email: v }))} placeholder="contact@company.co.kr" type="email" />
                            <InputRow label="연락처" value={contact.phone} onChange={(v: string) => setContact(p => ({ ...p, phone: v }))} placeholder="010-1234-5678" />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="font-black text-lg mb-6" style={{ color: '#c9a84c' }}>
                                <CreditCard className="w-5 h-5 inline mr-2" />플랜 선택 & 결제
                            </h2>
                            {PLANS.map(p => (
                                <div key={p.id} onClick={() => setSelectedPlan(p.id)}
                                    className="p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                                    style={{ background: selectedPlan === p.id ? `${p.color}12` : 'rgba(255,255,255,0.03)', border: `2px solid ${selectedPlan === p.id ? p.color : 'rgba(255,255,255,0.08)'}` }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: p.color, background: selectedPlan === p.id ? p.color : 'transparent' }} />
                                        <span className="font-black" style={{ color: p.color }}>{p.name}</span>
                                        {p.popular && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${p.color}20`, color: p.color }}>추천</span>}
                                    </div>
                                    <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>{p.price.toLocaleString()}원/월</span>
                                </div>
                            ))}
                            <div className="p-4 rounded-xl mt-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-xs" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                    💳 다음 단계에서 KCP 결제창이 열립니다. 카드·계좌이체·세금계산서 모두 지원.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="font-black text-lg mb-6" style={{ color: '#c9a84c' }}>
                                <Lock className="w-5 h-5 inline mr-2" />비밀번호 설정
                            </h2>
                            <InputRow label="비밀번호" value={account.password} onChange={(v: string) => setAccount(p => ({ ...p, password: v }))} placeholder="8자 이상" type="password" />
                            <InputRow label="비밀번호 확인" value={account.confirm} onChange={(v: string) => setAccount(p => ({ ...p, confirm: v }))} placeholder="동일하게 입력" type="password" />
                            {account.password && account.confirm && account.password !== account.confirm && (
                                <p className="text-xs" style={{ color: '#f87171' }}>비밀번호가 일치하지 않습니다.</p>
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-8">
                            <CheckCircle2 className="w-20 h-20 mx-auto mb-6" style={{ color: '#4ade80' }} />
                            <h2 className="text-2xl font-black mb-2" style={{ color: '#4ade80' }}>가입 완료!</h2>
                            <p className="text-sm mb-6" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                {biz.companyName || '고객사'}님, 환영합니다.<br />
                                담당 변호사 배정 완료 알림이 카카오톡으로 발송됩니다.
                            </p>
                            <div className="p-4 rounded-xl text-left" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                                <p className="text-xs font-bold mb-2" style={{ color: '#4ade80' }}>다음 단계</p>
                                {['임직원 계정 초대 이메일 발송 완료', '가맹점 연결 설정 (고객사 포털에서 가능)', '담당 변호사 배정 완료 후 1영업일 내 연락'].map(t => (
                                    <p key={t} className="text-xs mt-1" style={{ color: 'rgba(240,244,255,0.7)' }}>✓ {t}</p>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    <button onClick={nextStep} disabled={loading}
                        className="w-full py-4 rounded-xl font-black text-base mt-8 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : step === 4 ? '고객사 포털 접속' : '다음 단계'}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
