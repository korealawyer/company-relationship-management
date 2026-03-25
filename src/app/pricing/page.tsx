'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Star, Shield, Gift, Crown,
    Building2, Phone, Sparkles, ArrowRight, Lock,
    ChevronRight, Zap, FileText, Scale, Clock, ChevronDown, CreditCard, BadgeCheck, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { calcPrice, PRICE_RANGES, INCLUDED_SERVICES, formatPriceMan } from '@/lib/pricing';

// Import Consultation Components
import OrderModal from '../consultation/components/OrderModal';
import { SERVICES } from '../consultation/constants';
import CostComparison from '../consultation/components/CostComparison';

const STATS = [
    { value: '1,000억+', label: '엑시트 기업 자문' },
    { value: '80,000+', label: '누적 법률 자문 완료' },
    { value: '70%', label: '외부 법무 비용 평균 절감' },
    { value: '48h', label: '100% 답변 시간 보장' },
];

const faqs = [
    { q: '결제 후 얼마나 걸리나요?', a: '결제 완료 즉시 담당 변호사가 배정됩니다. 서비스별로 명시된 시간(24~48시간) 내에 고품질의 서면 답변을 보장합니다. 기한 초과 시에는 100% 전액 환불을 보장합니다.' },
    { q: '정기 구독 서비스랑은 무엇이 다른가요?', a: '단건 문의는 당장 필요한 사안에 대해서만 개별로 의뢰하고 비용을 지불하는 방식입니다. 만약 월 7건 이상 정기적인 자문이 필요하시다면 최대 60% 이상 저렴한 구독 플랜을 추천드립니다. 단건 고객님이 추후 구독으로 전환하실 경우 첫 달 할인 쿠폰을 발급해 드립니다.' },
    { q: '지금 당장 문서가 없어도 상담이 가능한가요?', a: '네, 가능합니다. 우선 현재의 상황과 궁금하신 점을 텍스트로 남겨주시면 담당 변호사가 전체적인 현황을 파악한 뒤 추가로 필요한 서류 목록을 안내해 드립니다.' },
    { q: '마음에 안 들면 환불되나요?', a: '네. 검토 결과물이 전달되기 전이라면 언제든 전액 환불이 가능합니다. 결과물 수령 후라도 부족한 부분이 있다면 변호사와 직접 논의하여 추가적인 보완을 무료로 진행해 드립니다.' },
    { q: '상담 내용에 대한 보안은 어떻게 유지되나요?', a: 'IBS 법률사무소의 모든 변호사들은 법률이 정하는 엄격한 비밀유지 의무를 준수합니다. 남겨주신 내용과 첨부 파일은 담당 변호사 외에는 절대 열람할 수 없으며 강력한 보안 시스템 내에 안전하게 보관됩니다.' },
];

// ── 가맹점/임직원 전용 혜택 화면 (Black Card Premium) ──
function FranchiseeView() {
    const PRO_PLAN = { price: calcPrice(50) };
    const benefitItems = [
        { icon: Shield, label: '법률 챗봇 자동화', desc: '새벽에도 즉시 답변하는 AI 변호사' },
        { icon: CheckCircle2, label: '전담 변호사 다이렉트 자문', desc: '월 10건 무제한 심층 서면 상담' },
        { icon: Building2, label: '개인정보 리스크 모니터링', desc: '과태료 방지 실시간 컴플라이언스 봇' },
        { icon: Sparkles, label: '프리미엄 EAP 심리 케어', desc: '임직원 익명 보장 전문 심리상담 핫라인' },
        { icon: Crown, label: '독소 조항 필터링 분석', desc: '수만 건 빅데이터 기반 가맹 계약 리스크 검토' },
        { icon: Gift, label: '월간 법무 인사이트 리포트', desc: '핵심 쟁점과 개선점 맞춤 현황 리포트 정기 발간' },
    ];

    return (
        <div className="min-h-screen pt-14 pb-24 relative overflow-hidden" style={{ background: '#020611', color: '#f0f4ff' }}>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.15),transparent_70%)] rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,rgba(5,20,50,0.8),transparent_70%)] rounded-full blur-[120px]" />
            </div>

            <div className="text-center pt-8 pb-12 px-4 relative z-10">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
                    <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full mb-8"
                        style={{ background: 'linear-gradient(90deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.02) 100%)', border: '1px solid rgba(201,168,76,0.3)', boxShadow: '0 0 20px rgba(201,168,76,0.1)' }}>
                        <Gift className="w-4 h-4" style={{ color: '#e8c87a' }} />
                        <span className="text-sm font-black uppercase tracking-widest" style={{ color: '#e8c87a' }}>Exclusive Partner Benefit</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
                        소속 본사에서 귀하를 위한<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e8c87a] via-[#c9a84c] to-[#a38031] filter drop-shadow-[0_0_20px_rgba(201,168,76,0.4)]">VVIP 법률 멤버십</span>을<br className="md:hidden"/> 전액 지원합니다.
                    </h1>
                    <p className="text-lg md:text-xl max-w-2xl mx-auto mb-4" style={{ color: 'rgba(240,244,255,0.6)' }}>
                        정가 월 <strong className="font-bold text-white">₩{PRO_PLAN.price.toLocaleString()}</strong> 상당의 <strong className="text-[#c9a84c] font-black">IBS Pro 플랜</strong>이<br className="hidden md:block"/>
                        본사 파트너십을 통해 귀하에게 <strong className="text-green-400 font-black">100% 무료</strong>로 제공되고 있습니다.
                    </p>
                </motion.div>
            </div>

            <div className="max-w-5xl mx-auto px-4 pb-20 relative z-10">
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, type: "spring" }}>
                    <div className="relative rounded-[2.5rem] p-10 md:p-14 mb-16 overflow-hidden transform perspective-1000 group cursor-default"
                        style={{
                            background: 'linear-gradient(135deg, rgba(15,15,15,0.9) 0%, rgba(5,5,5,0.95) 100%)',
                            border: '1px solid rgba(201,168,76,0.4)',
                            boxShadow: '0 30px 60px -15px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1)',
                        }}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[rgba(255,255,255,0.05)] to-transparent translate-x-[-150%] skew-x-[-30deg] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                        <div className="absolute -top-[50%] -right-[20%] w-[80%] h-[150%] bg-[url('/noise.png')] opacity-[0.05] pointer-events-none mix-blend-screen" />
                        <Crown className="absolute -right-10 -bottom-10 w-64 h-64 text-[#c9a84c] opacity-[0.03] pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                            <div className="flex-1 w-full flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(201,168,76,0.2)] relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, #e8c87a 0%, #a38031 100%)' }}>
                                    <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                                    <Crown className="w-10 h-10 text-[#04091a] relative z-10" />
                                </div>
                                <div className="flex flex-col justify-center h-full">
                                    <h2 className="font-black text-2xl md:text-3xl tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#e8c87a] to-[#c9a84c]">
                                        본사 100% 지원 Pro 멤버십
                                    </h2>
                                    <p className="text-sm font-medium tracking-widest uppercase text-white/50 mb-6">
                                        IBS Law Firm • Premium Corporate Care
                                    </p>
                                    <div className="flex items-center justify-center md:justify-start gap-3">
                                        <div className="px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                            <span className="text-green-400 font-bold text-sm">무료 이용 중</span>
                                        </div>
                                        <span className="text-white/30 text-sm font-medium line-through">정가 월 ₩{PRO_PLAN.price.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-full md:w-auto flex flex-col items-center md:items-end p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm relative overflow-hidden">
                                <p className="text-sm font-bold text-white/50 mb-2 uppercase tracking-widest">연간 절감 혜택 총액</p>
                                <p className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-1">
                                    ₩<span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">{(PRO_PLAN.price * 12).toLocaleString()}</span>
                                </p>
                                <p className="text-xs text-[#c9a84c] mt-2 font-medium flex items-center gap-1"><Shield className="w-3.5 h-3.5"/> 파트너십 최상위 플랜 적용</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <div className="text-center mb-12">
                        <span className="text-xs font-bold tracking-[0.2em] text-blue-400/80 uppercase">Included Services</span>
                        <h2 className="text-3xl font-black mt-3 text-white">플랜에 포함된 모든 프리미엄 서비스</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {benefitItems.map(({ icon: Icon, label, desc }, i) => (
                            <motion.div key={label}
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                                className="group flex flex-col p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.15] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-white/5 to-white/2 border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                                    <Icon className="w-6 h-6 text-[#c9a84c]" />
                                </div>
                                <h3 className="font-extrabold text-lg text-white mb-2">{label}</h3>
                                <p className="text-sm text-blue-200/50 leading-relaxed font-medium">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                    className="flex flex-col items-center">
                    <Link href="/dashboard" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-lg bg-gradient-to-r from-white to-gray-200 text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-all flex items-center justify-center gap-3">
                            지금 바로 대시보드 입장하기 <ChevronRight className="w-5 h-5 bg-black text-white rounded-full p-0.5" />
                        </button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

// ── 단건 결제 화면 (Single Case View) ──
function SingleCasePricingView() {
    const [selected, setSelected] = useState<typeof SERVICES[0] | null>(null);
    const [monthlyCount, setMonthlyCount] = useState(3);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 w-full">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-8">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-white mb-2 relative inline-block">
                        어떤 도움이 필요하신가요?
                        <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-gradient-to-r from-[#c9a84c] to-transparent rounded-full" />
                    </h2>
                    <p className="text-blue-200/50 mt-4 font-medium">원하시는 서비스를 선택하고 즉시 검토를 요청하세요.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-white/60">
                    <AlertTriangle className="w-4 h-4 text-[#c9a84c]" /> 메뉴에 없는 사안은 전문의 상담 요청
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {SERVICES.map((svc, i) => (
                    <motion.div key={svc.id}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }}
                        onClick={() => setSelected(svc)}
                        className="group relative p-6 rounded-[2rem] cursor-pointer transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.15] backdrop-blur-md overflow-hidden flex flex-col h-full"
                        style={{
                            boxShadow: svc.popular ? '0 0 40px -10px rgba(201,168,76,0.1)' : 'none',
                            borderColor: svc.popular ? 'rgba(201,168,76,0.3)' : '',
                        }}
                        whileHover={{ y: -5 }}>
                        
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {svc.popular && (
                            <div className="absolute top-5 right-5">
                                <div className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#c9a84c] to-[#e8c87a] text-black shadow-lg">가장 많이 찾아요</div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-5 relative z-10 w-4/5">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: `linear-gradient(135deg, \${svc.color}20, transparent)`, border: `1px solid \${svc.color}40` }}>
                                <svc.icon className="w-6 h-6" style={{ color: svc.color }} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold tracking-[0.2em] mb-1" style={{ color: svc.color }}>{svc.category}</p>
                                <h3 className="font-extrabold text-lg text-white leading-tight">{svc.title}</h3>
                            </div>
                        </div>

                        <p className="text-sm text-blue-200/50 mb-6 font-light leading-relaxed flex-1">
                            {svc.desc}
                        </p>

                        <div className="space-y-2 mb-6 bg-white/5 p-4 rounded-2xl">
                            {svc.includes.map(item => (
                                <li key={item} className="flex items-start gap-2.5 text-[13px] text-white/70 font-medium">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-[1.5px]" style={{ color: svc.color }} />
                                    <span className="leading-snug">{item}</span>
                                </li>
                            ))}
                        </div>

                        <div className="mt-auto pt-5 flex items-end justify-between border-t border-white/5">
                            <div>
                                <p className="text-[#a3a3a3] text-xs font-medium mb-1 line-through opacity-0 group-hover:opacity-100 transition-opacity">표준 수가 ₩{(svc.price * 1.3).toLocaleString()}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-black text-2xl text-white">₩{svc.price.toLocaleString()}</span>
                                </div>
                            </div>
                            <button className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/5 text-white group-hover:bg-white group-hover:text-black">
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
                className="mb-24 mt-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 px-4">
                    <div>
                        <h3 className="font-black text-2xl text-white tracking-tight">
                            꾸준한 자문이 필요하신가요?
                        </h3>
                        <p className="text-blue-200/50 mt-2 font-medium">
                            월 평균 발생할 의뢰 건수를 입력하고 구독 비용과 비교해보세요.
                        </p>
                    </div>
                    <div className="flex items-center bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner">
                        <button onClick={() => setMonthlyCount(Math.max(1, monthlyCount - 1))}
                            className="w-12 h-12 rounded-xl font-medium text-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">-</button>
                        <div className="w-24 text-center px-2 flex flex-col items-center justify-center">
                            <span className="text-xs text-[#c9a84c] font-bold uppercase tracking-widest mb-0.5">예상 건수</span>
                            <span className="font-black text-2xl text-white leading-none">
                                {monthlyCount}<span className="text-sm font-medium text-white/40 ml-1">건</span>
                            </span>
                        </div>
                        <button onClick={() => setMonthlyCount(Math.min(20, monthlyCount + 1))}
                            className="w-12 h-12 rounded-xl font-medium text-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">+</button>
                    </div>
                </div>
                <CostComparison selectedCount={monthlyCount} />
            </motion.div>

            <div className="mb-24 relative">
                <div className="text-center mb-16">
                    <span className="text-xs font-bold tracking-[0.2em] text-[#c9a84c] uppercase">Simple Process</span>
                    <h2 className="text-3xl font-black mt-3 text-white">결제부터 답변 수령까지 단 3단계</h2>
                </div>
                
                <div className="hidden md:block absolute top-[60%] left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />

                <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
                    {[
                        { step: '01', icon: FileText, title: '서비스 신청', desc: '원하는 서비스 선택 후 문서 첨부 및 자세한 요청 사항을 남겨주세요.' },
                        { step: '02', icon: CreditCard, title: '안전한 간편 결제', desc: '의뢰 내용 및 금액 확인 후 간편결제 시스템을 통해 요금을 안전하게 결제합니다.' },
                        { step: '03', icon: Scale, title: '서면 리포트 수령', desc: '담당 변호사가 검토한 프리미엄 법률 의견서를 기한 내 메일로 발송해드립니다.' },
                    ].map(({ step, icon: Icon, title, desc }) => (
                        <div key={step} className="relative flex flex-col items-center text-center group">
                            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-[120%] text-[6rem] font-extrabold text-white/[0.02] select-none pointer-events-none group-hover:text-white/[0.04] transition-colors">{step}</div>
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md group-hover:border-[#c9a84c]/50 group-hover:scale-110 transition-all duration-300">
                                <Icon className="w-8 h-8 text-[#c9a84c]" />
                            </div>
                            <h3 className="font-extrabold text-xl text-white mb-3">{title}</h3>
                            <p className="text-[15px] font-medium text-blue-200/50 leading-relaxed max-w-[280px]">
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-24 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <span className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase">Support</span>
                    <h2 className="text-3xl font-black mt-3 text-white">자주 묻는 질문</h2>
                </div>
                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <motion.div key={idx} layout
                            className="rounded-[2rem] overflow-hidden cursor-pointer backdrop-blur-md bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                            <div className="flex items-center justify-between p-6 sm:px-8">
                                <p className="font-bold text-[15px] text-white/90">{faq.q}</p>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all \${openFaq === idx ? 'bg-[#c9a84c] text-black' : 'bg-white/5 text-white/50'}`}>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 \${openFaq === idx ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                            <AnimatePresence>
                                {openFaq === idx && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                                        <p className="px-6 sm:px-8 pb-8 pt-2 text-[15px] font-medium text-blue-200/60 leading-relaxed">
                                            {faq.a}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selected && <OrderModal service={selected} onClose={() => setSelected(null)} />}
            </AnimatePresence>
        </div>
    );
}

// ── 구독제 화면 (Subscription Pricing View) ──
function SubscriptionPricingView() {
    const [storeCount, setStoreCount] = useState(30);
    const price = calcPrice(storeCount);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full mt-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
                className="rounded-[3rem] p-8 md:p-14 mb-20 relative overflow-hidden backdrop-blur-2xl border border-white/10 shadow-2xl"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(201,168,76,0.02) 100%)' }}>
                <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent opacity-50" />
                
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    <div className="flex-1 w-full">
                        <h3 className="font-black text-2xl text-white mb-2">우리 회사 맞춤 요금 계산</h3>
                        <p className="text-sm font-medium text-blue-200/50 mb-10">슬라이더를 조절하여 관리 대상(가맹점 또는 임직원 수)을 설정하세요.</p>
                        
                        <div className="relative mb-12">
                            <div className="flex items-end justify-between mb-4">
                                <span className="text-sm font-bold text-white/50 uppercase tracking-wider">현재 회사 규모</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e8c87a] to-[#c9a84c]">{storeCount}</span>
                                    <span className="text-xl font-bold text-[#c9a84c]/50">개소</span>
                                </div>
                            </div>
                            
                            <input type="range" min={1} max={200} value={storeCount}
                                onChange={e => setStoreCount(Number(e.target.value))}
                                className="w-full h-3 rounded-full appearance-none cursor-pointer group"
                                style={{ 
                                    background: `linear-gradient(to right, #c9a84c ${(storeCount / 200) * 100}%, rgba(255,255,255,0.05) ${(storeCount / 200) * 100}%)`,
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
                                }} 
                                />
                            <style dangerouslySetInnerHTML={{__html: `
                                input[type=range]::-webkit-slider-thumb {
                                    -webkit-appearance: none;
                                    height: 28px;
                                    width: 28px;
                                    border-radius: 50%;
                                    background: #fff;
                                    cursor: pointer;
                                    border: 4px solid #c9a84c;
                                    box-shadow: 0 0 20px rgba(201,168,76,0.5);
                                    transition: transform 0.1s;
                                }
                                input[type=range]:active::-webkit-slider-thumb {
                                    transform: scale(1.2);
                                }
                            `}} />
                            <div className="flex justify-between text-xs font-bold mt-4 text-white/30 uppercase tracking-widest">
                                <span>Start (1개)</span>
                                <span>Scale (100개)</span>
                                <span>Enterprise (200개+)</span>
                            </div>
                        </div>
                        
                        <p className="text-xs text-center lg:text-left text-white/30 font-medium">✨ 200개소 초과 시 Enterprise 요금제로 자동 전환되며 별도 협의가 진행됩니다. (1년 체결 기준, VAT별도)</p>
                    </div>

                    <div className="w-full lg:w-[400px] flex flex-col gap-4">
                        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-[#0c1324] to-[#040914] border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/10 rounded-full blur-3xl" />
                            <p className="text-xs font-bold text-blue-200/50 uppercase tracking-widest mb-2">프리미엄 월 구독료</p>
                            <div className="flex items-baseline gap-2 mb-6 border-b border-white/5 pb-6">
                                <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">{formatPriceMan(price)}</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/50 font-medium">연납 할인 (10%) 적용 시</span>
                                    <span className="text-white font-bold">{formatPriceMan(price * 12 * 0.9)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/50 font-medium">1개소 당 환산 월 단가</span>
                                    <span className="text-[#c9a84c] font-bold">약 {(Math.round(price / storeCount)).toLocaleString()}원</span>
                                </div>
                            </div>
                        </div>
                        <Link href="/service" className="w-full">
                            <button className="w-full py-5 rounded-2xl font-black text-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c87a] text-black shadow-[0_10px_30px_-10px_rgba(201,168,76,0.5)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                                무료 도입 컨설팅 받기 <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                </div>
            </motion.div>

            <div className="text-center mb-10">
                <span className="text-xs font-bold tracking-[0.2em] text-blue-400/80 uppercase">Service Tiers</span>
                <h2 className="text-3xl font-black mt-3 text-white">모든 플랜에 프리미엄 서비스가 포함됩니다</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-24">
                {PRICE_RANGES.map((range, i) => (
                    <motion.div key={range.id}
                        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
                        className={`relative rounded-[2rem] p-6 text-center bg-white/[0.02] border backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 group
                            ${range.popular ? 'border-[#c9a84c]/30 shadow-[0_0_40px_rgba(201,168,76,0.1)]' : 'border-white/[0.05] hover:border-white/[0.15] hover:bg-white/[0.04]'}`}>
                        
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem] pointer-events-none" />

                        {range.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <span className="px-4 py-1.5 rounded-full text-[11px] font-black bg-gradient-to-r from-[#c9a84c] to-[#e8c87a] text-black shadow-lg uppercase tracking-wider">Most Popular</span>
                            </div>
                        )}
                        <h3 className="text-xl font-bold mb-1" style={{ color: range.color }}>{range.name}</h3>
                        <p className="text-sm font-medium text-white/40 mb-5 relative z-10">규모: {range.storeRange}</p>
                        
                        <div className="py-5 border-y border-white/5 mb-6 relative z-10">
                            <p className="text-3xl font-extrabold text-white/90 tracking-tight">{range.priceRange}<span className="text-xs font-medium text-white/30 ml-1">/월</span></p>
                        </div>

                        <ul className="space-y-4 mb-8 text-left relative z-10">
                            {INCLUDED_SERVICES.map(s => (
                                <li key={s} className="flex items-start gap-3 text-[13px] font-medium text-white/70">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${range.color}20` }}>
                                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: range.color }} />
                                    </div>
                                    <span className="leading-snug">{s}</span>
                                </li>
                            ))}
                        </ul>
                        
                        <div className="relative z-10">
                            <Link href="/login" className="block w-full">
                                <button className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 border
                                    ${range.popular 
                                        ? 'bg-transparent text-[#e8c87a] border-[#e8c87a]/40 hover:bg-[#e8c87a]/10' 
                                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                                    도입 문의하기
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-24">
                {STATS.map(({ value, label }) => (
                    <div key={label} className="text-center p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm hover:bg-white/[0.04] transition-colors">
                        <div className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#e8c87a] to-[#c9a84c] tracking-tighter">{value}</div>
                        <div className="text-xs font-bold text-white/50 uppercase tracking-widest">{label}</div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

// ── 일반 / 영업 대상 요금제 헤더 및 상태 컨테이너 ──
function PublicPricingView() {
    const [viewMode, setViewMode] = useState<'subscription' | 'single'>('subscription');

    const slogans = {
        subscription: {
            titlePre: "회사 규모에 맞춘",
            titleHighlight: "가장 합리적인 비용",
            desc1: "불투명한 법무 비용은 이제 그만.",
            desc2: "IBS의 모든 서비스는 명확한 가격 정책을 기반으로 제공됩니다."
        },
        single: {
            titlePre: "사안의 난이도에 맞춘",
            titleHighlight: "투명한 정찰제 비용",
            desc1: "단발성으로 발생하는 법률 리스크가 걱정이신가요?",
            desc2: "기다림 없이 즉시 검토를 요청하고 정확한 답변을 받아보세요."
        }
    };

    const currentSlogan = slogans[viewMode];

    return (
        <div className="min-h-screen pt-14 pb-24 relative overflow-hidden" style={{ background: '#020611', color: '#f0f4ff' }}>
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0f1f3d] rounded-full mix-blend-screen filter blur-[150px] opacity-60" />
                <div className="absolute top-[40%] left-[-20%] w-[40%] h-[40%] bg-[#211a0d] rounded-full mix-blend-screen filter blur-[150px] opacity-50" />
            </div>

            <div className="text-center pt-8 pb-16 px-4 relative z-10 max-w-4xl mx-auto min-h-[280px] flex flex-col justify-end">
                <AnimatePresence mode="wait">
                    <motion.div key={viewMode} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight text-white">
                            {currentSlogan.titlePre}<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e8c87a] via-[#c9a84c] to-[#a38031] filter drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]">{currentSlogan.titleHighlight}</span>
                        </h1>
                        <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto text-blue-200/60 leading-relaxed max-w-2xl">
                            {currentSlogan.desc1}<br />
                            {currentSlogan.desc2}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="relative z-10 flex justify-center mb-10 w-full px-4 text-center">
                <div className="inline-flex bg-white/5 p-1.5 rounded-[20px] border border-white/10 backdrop-blur-md">
                    <button onClick={() => setViewMode('subscription')} 
                        className={`px-6 sm:px-10 py-3.5 rounded-2xl font-bold text-[15px] transition-all duration-300 ${viewMode === 'subscription' ? 'bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white shadow-lg shadow-[#6366f1]/30 scale-[1.03]' : 'text-white/60 hover:text-white'}`}>
                        정기 구독 (Subscription)
                    </button>
                    <button onClick={() => setViewMode('single')} 
                        className={`px-6 sm:px-10 py-3.5 rounded-2xl font-bold text-[15px] transition-all duration-300 ${viewMode === 'single' ? 'bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white shadow-lg shadow-[#6366f1]/30 scale-[1.03]' : 'text-white/60 hover:text-white'}`}>
                        단건 의뢰 (Single Case)
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'subscription' ? (
                    <motion.div key="sub" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                        <SubscriptionPricingView />
                    </motion.div>
                ) : (
                    <motion.div key="single" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                        <SingleCasePricingView />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── 메인 페이지: 역할에 따라 분기 ────────────────────────
export default function PricingPage() {
    const [isFranchisee, setIsFranchisee] = useState(false);

    useEffect(() => {
        const session = getSession();
        setIsFranchisee(session?.role === 'client_hr');
    }, []);

    return (
        <AnimatePresence mode="wait">
            {isFranchisee ? (
                <motion.div key="franchisee" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                    <FranchiseeView />
                </motion.div>
            ) : (
                <motion.div key="public" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                    <PublicPricingView />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
