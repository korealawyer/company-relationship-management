'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Shield, Brain, Briefcase, TrendingUp, CheckCircle2, ArrowRight, Phone, Star, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const SERVICES = [
    { icon: Scale, color: '#c9a84c', title: '법률 자문', desc: '가맹계약, 노동법, 개인정보보호법, 형사 사건 등 전문 변호사의 즉각적인 법률 지원' },
    { icon: Brain, color: '#818cf8', title: 'EAP 심리상담', desc: '임직원 정신건강 지원 프로그램. 24시간 위기 지원, 스트레스 관리, PHQ/GAD 자가진단' },
    { icon: Briefcase, color: '#34d399', title: '경영·노무 자문', desc: '공정거래법, 가맹사업법 컴플라이언스, 인사노무 리스크 관리, 계약서 검토' },
];

const PROCESS_STEPS = [
    { n: '01', title: '무료 상담 신청', desc: '하단 폼 또는 전화로 30분 무료 도입 상담 신청' },
    { n: '02', title: '니즈 분석', desc: '담당 컨설턴트가 가맹 구조·규모·리스크 영역 파악' },
    { n: '03', title: '플랜 제안', desc: '맞춤 플랜 제안 + 계약조건 협의 (최소 1개월 약정)' },
    { n: '04', title: '온보딩', desc: '관리자 계정 발급, 임직원 초대, 가맹점 연결 설정' },
    { n: '05', title: '운영 시작', desc: '즉시 24시간 법률·심리 지원 시작, 전담 변호사 배정' },
];

import { PRICE_RANGES, INCLUDED_SERVICES } from '@/lib/pricing';

const TIERS = PRICE_RANGES.map(r => ({
    name: r.name, price: r.priceRange, color: r.color,
    features: [`${r.storeRange} 매장`, ...INCLUDED_SERVICES.slice(0, 3)],
}));

interface LeadForm { name: string; company: string; phone: string; email: string; size: string; }

export default function SalesPage() {
    const [form, setForm] = useState<LeadForm>({ name: '', company: '', phone: '', email: '', size: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // 홈페이지 폼 → CRM 자동 등록 + AI 분석 트리거
        // dynamic import: SSR prerender 시 localStorage 접근 방지
        const { store } = await import('@/lib/mockStore');
        const sizeNum = parseInt(form.size?.replace(/[^0-9]/g, '') || '0') || 0;
        const companies = store.add({
            name: form.company || '(미입력)',
            biz: '', url: '', email: form.email, phone: form.phone,
            storeCount: sizeNum, status: 'pending',
            assignedLawyer: '', issues: [],
            salesConfirmed: false, salesConfirmedAt: '', salesConfirmedBy: '',
            lawyerConfirmed: false, lawyerConfirmedAt: '', emailSentAt: '', emailSubject: '',
            clientReplied: false, clientRepliedAt: '', clientReplyNote: '',
            loginCount: 0, callNote: '', plan: 'none',
            autoMode: true, aiDraftReady: false, source: 'manual',
            riskScore: 0, riskLevel: '', issueCount: 0,
            bizType: '', domain: '', privacyUrl: '',
            contactName: form.name, contactEmail: form.email, contactPhone: form.phone,
            callAttempts: 0, timeline: [],
        } as any);
        // AI 분석 자동 트리거
        const newCompany = companies?.[companies.length - 1];
        if (newCompany?.id) {
            setTimeout(() => store.triggerAI(newCompany.id), 500);
        }
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen" style={{ background: '#04091a', color: '#f0f4ff' }}>
            {/* 히어로 */}
            <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.08), transparent)' }} />
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                        <Star className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-bold" style={{ color: '#c9a84c' }}>가맹사업 전문 1등 로펌 리테이너 플랫폼</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
                        법률·경영·심리,<br />
                        <span style={{ color: '#c9a84c' }}>하나의 플랫폼</span>으로<br />
                        해결합니다
                    </h1>
                    <p className="text-xl mb-8" style={{ color: 'rgba(240,244,255,0.6)' }}>
                        1,000+ 가맹본부 · 45,000명 임직원 · 80,000건+ 자문 · 자문사 1,000억 엑시트 지원
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="#contact">
                            <button className="px-8 py-4 rounded-xl font-black text-lg"
                                style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                                무료 상담 신청 →
                            </button>
                        </a>
                        <Link href="/pricing">
                            <button className="px-8 py-4 rounded-xl font-bold text-lg"
                                style={{ background: 'rgba(255,255,255,0.05)', color: '#f0f4ff', border: '1px solid rgba(255,255,255,0.1)' }}>
                                요금제 보기
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* 실적 수치 */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { v: '1,000+', l: '가맹본부 고객사' },
                        { v: '45,000명', l: '자문 임직원 수' },
                        { v: '80,000건+', l: '누적 법률 자문' },
                        { v: '70%', l: '법무비용 절감율' },
                    ].map(({ v, l }) => (
                        <div key={l} className="text-center p-6 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="text-2xl font-black" style={{ color: '#c9a84c' }}>{v}</div>
                            <div className="text-xs mt-1" style={{ color: 'rgba(240,244,255,0.5)' }}>{l}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 서비스 3종 */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-black text-center mb-12">
                        단순 법률이 아닌,<br /><span style={{ color: '#c9a84c' }}>조직 전체를 지원</span>하는 플랫폼
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {SERVICES.map(({ icon: Icon, color, title, desc }, i) => (
                            <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl"
                                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}25` }}>
                                <div className="p-3 rounded-xl inline-flex mb-4" style={{ background: `${color}15` }}>
                                    <Icon className="w-6 h-6" style={{ color }} />
                                </div>
                                <h3 className="text-lg font-black mb-2" style={{ color }}>{title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.6)' }}>{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 요금제 요약 */}
            <section className="py-16 px-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <div className="max-w-4xl mx-auto text-center mb-10">
                    <h2 className="text-3xl font-black mb-3">투명한 구독 요금제</h2>
                    <p style={{ color: 'rgba(240,244,255,0.5)' }}>위약금 없이 언제든 플랜 변경 가능</p>
                </div>
                <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
                    {TIERS.map(({ name, price, color, features }) => (
                        <div key={name} className="p-6 rounded-2xl text-center"
                            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}30` }}>
                            <div className="font-black text-xl mb-1" style={{ color }}>{name}</div>
                            <div className="text-2xl font-black mb-4" style={{ color: '#f0f4ff' }}>{price}<span className="text-sm font-normal opacity-50">/월</span></div>
                            {features.map(f => (
                                <div key={f} className="text-sm mb-1" style={{ color: 'rgba(240,244,255,0.7)' }}>✓ {f}</div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="text-center mt-6">
                    <Link href="/pricing">
                        <button className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: '#c9a84c' }}>
                            상세 요금제 비교 <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </div>
            </section>

            {/* 도입 프로세스 */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black text-center mb-12">도입 프로세스</h2>
                    <div className="relative">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ background: 'rgba(201,168,76,0.2)' }} />
                        <div className="space-y-8">
                            {PROCESS_STEPS.map(({ n, title, desc }, i) => (
                                <motion.div key={n} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-6 pl-4">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                                        style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}>
                                        {n}
                                    </div>
                                    <div className="pt-2">
                                        <div className="font-black mb-1" style={{ color: '#f0f4ff' }}>{title}</div>
                                        <div className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>{desc}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 도입 신청 폼 */}
            <section id="contact" className="py-20 px-4" style={{ background: 'rgba(201,168,76,0.03)' }}>
                <div className="max-w-xl mx-auto">
                    <h2 className="text-3xl font-black text-center mb-2">무료 도입 상담 신청</h2>
                    <p className="text-center text-sm mb-10" style={{ color: 'rgba(240,244,255,0.5)' }}>
                        신청 후 1영업일 내 담당 컨설턴트가 연락드립니다
                    </p>
                    {submitted ? (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12">
                            <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#4ade80' }} />
                            <h3 className="text-2xl font-black mb-2" style={{ color: '#4ade80' }}>신청 완료!</h3>
                            <p style={{ color: 'rgba(240,244,255,0.6)' }}>1영업일 내 담당자가 연락드립니다.</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {[
                                { key: 'name', label: '담당자 이름', placeholder: '홍길동' },
                                { key: 'company', label: '회사명', placeholder: '(주)프랜차이즈' },
                                { key: 'phone', label: '연락처', placeholder: '010-1234-5678' },
                                { key: 'email', label: '이메일', placeholder: 'contact@company.co.kr' },
                            ].map(({ key, label, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-sm font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.7)' }}>{label}</label>
                                    <input
                                        value={form[key as keyof LeadForm]}
                                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        required
                                        className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-sm font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.7)' }}>가맹점 수</label>
                                <select value={form.size} onChange={e => setForm(p => ({ ...p, size: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}>
                                    <option value="">선택해 주세요</option>
                                    <option value="~50">50개 미만</option>
                                    <option value="50~200">50~200개</option>
                                    <option value="200~500">200~500개</option>
                                    <option value="500+">500개 이상</option>
                                </select>
                            </div>
                            <button type="submit"
                                className="w-full py-4 rounded-xl font-black text-lg mt-2"
                                style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                                무료 상담 신청하기
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </div>
    );
}
