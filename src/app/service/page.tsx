'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Scale, Shield, Brain, Briefcase, Globe, BarChart3,
    CheckCircle2, ArrowRight, Phone, Star, Building2,
    MessageSquare, FileText, ChevronRight, Sparkles,
    Users, TrendingUp, Award, Zap
} from 'lucide-react';
import Link from 'next/link';

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                let s = 0;
                const inc = end / 80;
                const t = setInterval(() => {
                    s += inc;
                    if (s >= end) { setCount(end); clearInterval(t); }
                    else setCount(Math.floor(s));
                }, 20);
            }
        });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const SERVICES = [
    { icon: Scale, color: '#c9a84c', title: '기업 법률 자문', desc: '가맹계약, 노무, 형사까지 전담 변호사가 24시간 즉각 대응', badge: '핵심' },
    { icon: Shield, color: '#60a5fa', title: '개인정보 컴플라이언스', desc: 'AI 자동 진단 + 48h 수정 완료 보장. 과징금 리스크 제로', badge: '규제 필수' },
    { icon: Brain, color: '#a78bfa', title: 'EAP 심리상담', desc: '익명 보장 24시간 임직원 심리 지원. 조직 건강 리포트 포함', badge: '임직원 복지' },
    { icon: Briefcase, color: '#34d399', title: '노무·경영 리스크', desc: '가맹사업법·공정거래법 위반 예방. 연간 법무 진단 포함', badge: '경영 안전망' },
    { icon: BarChart3, color: '#fb923c', title: '송무·분쟁 해결', desc: '소송·조정·중재. 실시간 사건 포털에서 진행 현황 확인', badge: '사건 관리' },
    { icon: Globe, color: '#f472b6', title: '월간 법무 뉴스레터', desc: '판례·규제 변화 업종별 맞춤 브리핑. 선제 대응 가이드', badge: '기업 복지' },
];

const STATS = [
    { value: 45000, suffix: '+', label: '누적 관리 회원사', icon: Building2, color: '#c9a84c' },
    { value: 80000, suffix: '+', label: '누적 자문 완료', icon: MessageSquare, color: '#818cf8' },
    { value: 1000, suffix: '억+', label: '엑시트 기업 자문', icon: TrendingUp, color: '#34d399' },
    { value: 48, suffix: '시간', label: '자문 답변 보장', icon: CheckCircle2, color: '#f472b6' },
];

const COMPARE = [
    ['월 비용', '법무팀 평균 450만원+', '규모별 맞춤 (70% 절감)'],
    ['응답 속도', '담당자 연결 1~3일', '24시간 즉시 배정'],
    ['전문성', '분야별 별도 선임', '법률·노무·심리 원스톱'],
    ['진행 현황', '전화·메일로 직접 확인', '클라이언트 포털 실시간'],
    ['계약', '장기 계약·위약금', '월 구독, 언제든 해지'],
];

export default function SalesPage() {
    const [activeIdx, setActiveIdx] = useState<number | null>(null);

    return (
        <div style={{ background: '#04091a', color: '#f0f4ff', minHeight: '100vh' }}>

            {/* ─── Hero ─── */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-5%] w-[55%] h-[70%] rounded-full opacity-25"
                        style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.18), transparent 70%)' }} />
                    <div className="absolute top-[40%] right-[-15%] w-[45%] h-[60%] rounded-full opacity-15"
                        style={{ background: 'radial-gradient(ellipse, rgba(96,165,250,0.15), transparent 70%)' }} />
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
                </div>

                <motion.div initial="hidden" animate="visible" variants={stagger}
                    className="relative z-10 max-w-5xl mx-auto text-center">

                    <motion.div variants={fadeUp}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                        <Award className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-black" style={{ color: '#c9a84c' }}>한국 1위 가맹사업 전문 법률 플랫폼</span>
                    </motion.div>

                    <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black leading-[1.08] mb-8 tracking-tight">
                        기업의 법률·경영을<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #e8c87a, #c9a84c, #a38031)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            filter: 'drop-shadow(0 0 30px rgba(201,168,76,0.3))',
                        }}>하나의 플랫폼</span>으로
                    </motion.h1>

                    <motion.p variants={fadeUp} className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light leading-relaxed"
                        style={{ color: 'rgba(240,244,255,0.65)' }}>
                        법률 자문 · 개인정보 컴플라이언스 · EAP 심리상담 · 소송 관리<br />
                        <strong className="font-bold text-white">외부 로펌 대비 70% 절감</strong>하는 통합 법무 인프라
                    </motion.p>

                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Link href="/consultation">
                            <button className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105"
                                style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a', boxShadow: '0 10px 40px rgba(201,168,76,0.3)' }}>
                                <Sparkles className="w-5 h-5" />무료 진단 받기
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </button>
                        </Link>
                        <a href="tel:025988518"
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-white/10"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#f0f4ff' }}>
                            <Phone className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            02-598-8518
                        </a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                        {STATS.map(({ value, suffix, label, icon: Icon, color }) => (
                            <div key={label} className="p-5 rounded-2xl text-center hover:-translate-y-1 transition-transform"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="flex justify-center mb-2">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                                        <Icon className="w-4 h-4" style={{ color }} />
                                    </div>
                                </div>
                                <div className="text-2xl font-black mb-1" style={{ color }}>
                                    <CountUp end={value} suffix={suffix} />
                                </div>
                                <div className="text-xs font-medium" style={{ color: 'rgba(240,244,255,0.45)' }}>{label}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ─── 6대 서비스 ─── */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center mb-16">
                            <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: '#c9a84c' }}>All-in-One Legal Platform</span>
                            <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4">
                                6가지 전문 서비스,<br /><span style={{ color: '#c9a84c' }}>단 하나의 구독</span>으로
                            </h2>
                            <p style={{ color: 'rgba(240,244,255,0.4)' }}>클릭하여 상세 내용 확인</p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {SERVICES.map(({ icon: Icon, color, title, desc, badge }, i) => (
                                <motion.div key={title} variants={fadeUp}
                                    onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                                    className="p-6 rounded-2xl cursor-pointer transition-all duration-300"
                                    style={{
                                        background: activeIdx === i ? `${color}0d` : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${activeIdx === i ? color + '40' : 'rgba(255,255,255,0.07)'}`,
                                        transform: activeIdx === i ? 'translateY(-4px)' : undefined,
                                        boxShadow: activeIdx === i ? `0 20px 40px ${color}15` : undefined,
                                    }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl" style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
                                            <Icon className="w-6 h-6" style={{ color }} />
                                        </div>
                                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                                            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                            {badge}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black mb-2" style={{ color }}>{title}</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.6)' }}>{desc}</p>
                                    <div className="flex items-center gap-1 mt-4 text-xs font-bold" style={{ color: color + '80' }}>
                                        {activeIdx === i ? '접기' : '자세히 보기'}
                                        <ChevronRight className={`w-3 h-3 transition-transform ${activeIdx === i ? 'rotate-90' : ''}`} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─── 하이브리드 통합: 포털 프리뷰 섹션 ─── */}
            <section className="py-24 px-4 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #04091a, rgba(201,168,76,0.03))' }}>
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                            <motion.div variants={fadeUp}>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-bold"
                                    style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
                                    <Sparkles className="w-3.5 h-3.5" /> Client Portal
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black mb-6 leading-[1.2]">
                                    이 모든 서비스를<br />
                                    <span style={{ color: '#c9a84c' }}>단 하나의 포털</span>에서 통합 관리
                                </h2>
                                <p className="text-lg leading-relaxed mb-8" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                    변호사에게 일일이 전화할 필요가 없습니다. 실시간 사건 진행 현황부터 AI 법률 질의응답, 문서 보관함까지 완벽히 디지털화된 경험을 누리세요.
                                </p>
                                
                                <ul className="space-y-4 mb-10">
                                    {[
                                        { text: '실시간 진행 현황 24/7 트래킹 및 카카오톡 알림', icon: BarChart3 },
                                        { text: '언제든 꺼내보는 100% 클라우드 문서 보관함 & 전자서명', icon: FileText },
                                        { text: '야간에도 즉답하는 AI 원격 지원 대기', icon: Brain }
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.1)' }}>
                                                <item.icon className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                            </div>
                                            <span className="font-medium" style={{ color: 'rgba(240,244,255,0.8)' }}>{item.text}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link href="/portal">
                                    <button className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all hover:-translate-y-1"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.3)', color: '#f0f4ff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                        포털 기능 투어하기
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: '#c9a84c' }} />
                                    </button>
                                </Link>
                            </motion.div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                            className="relative">
                            {/* 포털 대시보드 하이라이트 UI Mockup */}
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a' }}>
                                {/* Browser Header */}
                                <div className="h-10 px-4 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div>
                                </div>
                                {/* Mock UI Content */}
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="w-32 h-6 rounded bg-white/10" />
                                        <div className="w-10 h-10 rounded-full bg-gold-400/20 flex items-center justify-center shrink-0">
                                            <Shield className="w-5 h-5 text-gold-500" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="text-xs text-white/40 mb-2">진행 중인 사건</div>
                                            <div className="text-3xl font-black text-white">4건</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="text-xs text-white/40 mb-2">이번 달 업데이트</div>
                                            <div className="text-3xl font-black text-emerald-400">12건</div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { t: '근로계약서 양식 검토 완료', d: '방금 전', state: '완료', color: 'bg-emerald-500' },
                                            { t: '가맹점 모집 브로셔 2차 내용 확인', d: '1시간 전', state: '검토 중', color: 'bg-amber-500' },
                                            { t: '월간 법무 동향 리포트 발행', d: '어제', state: '참고', color: 'bg-blue-500' },
                                        ].map((log, n) => (
                                            <div key={n} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${log.color}`} />
                                                    <span className="text-sm text-white/80">{log.t}</span>
                                                </div>
                                                <span className="text-xs text-white/40">{log.d}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* 빛 번짐 그라데이션 */}
                                <div className="absolute top-[20%] left-[50%] w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                                    style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.1), transparent 50%)' }} />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── 비교표 ─── */}
            <section className="py-20 px-4" style={{ background: 'rgba(255,255,255,0.012)' }}>
                <div className="max-w-4xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black mb-3">
                                왜 <span style={{ color: '#c9a84c' }}>IBS</span>를 선택할까요?
                            </h2>
                            <p style={{ color: 'rgba(240,244,255,0.45)' }}>기존 법무팀·개별 법무법인 대비 압도적 차이</p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden"
                            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="grid grid-cols-3">
                                {['구분', '기존 방식', 'IBS 플랫폼'].map((h, i) => (
                                    <div key={h} className="px-5 py-4 text-sm font-black text-center"
                                        style={{
                                            background: i === 2 ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                                            color: i === 2 ? '#c9a84c' : 'rgba(240,244,255,0.5)',
                                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                                        }}>{h}</div>
                                ))}
                            </div>
                            {COMPARE.map(([label, before, after], i) => (
                                <div key={label} className="grid grid-cols-3"
                                    style={{ borderBottom: i < COMPARE.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                                    <div className="px-5 py-4 text-xs font-bold" style={{ color: 'rgba(240,244,255,0.5)', background: 'rgba(255,255,255,0.01)' }}>{label}</div>
                                    <div className="px-5 py-4 text-xs text-center" style={{ color: 'rgba(240,244,255,0.35)' }}>✕ {before}</div>
                                    <div className="px-5 py-4 text-xs font-bold text-center"
                                        style={{ background: 'rgba(201,168,76,0.05)', color: '#c9a84c' }}>
                                        ✓ {after}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="py-24 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                                style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}>
                                <Zap className="w-4 h-4" style={{ color: '#4ade80' }} />
                                <span className="text-sm font-bold" style={{ color: '#4ade80' }}>신청 후 1영업일 내 연락</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black mb-4">지금 바로<br />무료 진단 받기</h2>
                            <p className="mb-12" style={{ color: 'rgba(240,244,255,0.45)' }}>법무팀 없이도 체계적인 법률 관리가 가능합니다</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/consultation">
                                    <button className="flex items-center gap-3 px-10 py-4.5 rounded-2xl font-black text-lg transition-all hover:scale-105"
                                        style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a', boxShadow: '0 10px 40px rgba(201,168,76,0.3)' }}>
                                        <Sparkles className="w-5 h-5" />상담 신청하기
                                    </button>
                                </Link>
                                <a href="tel:025988518"
                                    className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-white/10"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff' }}>
                                    <Phone className="w-5 h-5" style={{ color: '#c9a84c' }} />
                                    02-598-8518
                                </a>
                            </div>
                            <p className="mt-4 text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>평일 09:00 - 18:00</p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
