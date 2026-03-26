'use client';
import React from 'react';
import { motion } from 'framer-motion';
import {
    Shield, FileText, Bot, Calendar, Bell, Coins,
    ArrowRight, Phone, CheckCircle2, Lock,
    Zap, Users, Briefcase, MessageSquare, Star,
    ChevronRight, Brain
} from 'lucide-react';
import Link from 'next/link';
import InteractivePortalTour from './InteractivePortalTour';
import { useState } from 'react';
import { useCelebration } from '@/hooks/useCelebration';
import { CelebrationModal } from '@/components/ui/CelebrationModal';

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const FEATURES = [
    { icon: Zap, color: '#c9a84c', title: '서비스 진행 현황 실시간 확인', desc: '법률 자문, 문서 검토, 소송 진행 상황을 클릭 한 번으로 확인. 담당 변호사에게 전화할 필요 없습니다.' },
    { icon: FileText, color: '#818cf8', title: '문서 보관함 & 전자 서명', desc: '계약서·의견서·리포트가 클라우드에 안전하게 저장. 어디서나 찾고 전자 서명까지 완료하세요.' },
    { icon: Bot, color: '#4ade80', title: '24시간 AI 법률 질의·응답', desc: '야간·주말에도 즉시 답변. 민감한 내용은 전담 변호사에게 자동 에스컬레이션됩니다.' },
    { icon: Calendar, color: '#fb923c', title: '기일·미팅 캘린더 연동', desc: '변론기일, 화상 미팅, 서류 제출 기한을 한눈에 관리. iPhone·구글 캘린더와 즉시 동기화.' },
    { icon: Bell, color: '#f472b6', title: '실시간 법무 알림', desc: '사건 상태 변경, 서류 업로드, 납부 기한을 카카오톡·이메일·앱 푸시로 즉시 알림.' },
    { icon: Coins, color: '#60a5fa', title: '청구서 & 구독 관리', desc: '이용 내역·청구서·결제 수단을 한 곳에서 관리. 세금계산서도 자동 발행됩니다.' },
];

const STEPS = [
    { icon: Briefcase, num: '01', title: 'IBS와 계약 체결', desc: '담당 컨설턴트와 상담 후 맞춤 요금제로 계약합니다.' },
    { icon: Users, num: '02', title: '전담팀 배정', desc: '변호사·상담사·노무사로 구성된 전담팀이 즉시 배정됩니다.' },
    { icon: MessageSquare, num: '03', title: '포털 초대 수령', desc: '담당자에게 이메일 초대가 발송되며 계정을 생성합니다.' },
    { icon: Star, num: '04', title: '모든 서비스 이용 시작', desc: '포털에서 실시간으로 모든 법무 서비스를 이용하세요.' },
];

export default function PortalIntroPage() {
    const [isTourOpen, setIsTourOpen] = useState(false);
    const { isCelebrationActive, triggerCelebration, closeCelebration } = useCelebration();

    return (
        <div style={{ background: '#04091a', color: '#f0f4ff', minHeight: '100vh' }}>

            {/* ─── Hero ─── */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-20"
                        style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.2), transparent 70%)' }} />
                    <div className="absolute inset-0 opacity-[0.025]"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
                </div>

                <motion.div initial="hidden" animate="visible" variants={stagger}
                    className="relative z-10 max-w-4xl mx-auto text-center">

                    <motion.div variants={fadeUp}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                        <Shield className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-black" style={{ color: '#c9a84c' }}>IBS 고객 전용 클라이언트 포털</span>
                    </motion.div>

                    <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-black leading-[1.1] mb-8 tracking-tight">
                        법무 관리의 모든 것,<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #e8c87a, #c9a84c)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            filter: 'drop-shadow(0 0 25px rgba(201,168,76,0.3))',
                        }}>한 곳</span>에서 확인하세요
                    </motion.h1>

                    <motion.p variants={fadeUp} className="text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed"
                        style={{ color: 'rgba(240,244,255,0.6)' }}>
                        IBS 구독 고객만을 위한 전용 포털.<br />
                        진행 중인 모든 법률 서비스를 실시간으로 확인하고<br />
                        담당 변호사와 직접 소통하세요.
                    </motion.p>

                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <Link href="/login">
                            <button className="group flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105"
                                style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a', boxShadow: '0 10px 40px rgba(201,168,76,0.3)' }}>
                                <ArrowRight className="w-5 h-5" />포털 로그인
                                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </button>
                        </Link>
                        
                        <button 
                            onClick={() => setIsTourOpen(true)}
                            className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-white/10"
                            style={{ border: '1px solid rgba(201,168,76,0.5)', color: '#c9a84c', background: 'rgba(201,168,76,0.05)' }}>
                            ✨ 포털 투어 시작하기
                        </button>

                        <Link href="/service">
                            <button className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-white/10"
                                style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#f0f4ff' }}>
                                서비스 소개 보기
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </motion.div>

                    {/* 안전 배지 */}
                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm"
                        style={{ color: 'rgba(240,244,255,0.4)' }}>
                        {['256비트 암호화', '변호사법 비밀 보호', '24시간 무중단'].map((t, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                                <span className="font-medium">{t}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ─── 6대 기능 ─── */}
            <section className="py-24 px-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <div className="max-w-5xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center mb-16">
                            <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: '#c9a84c' }}>Portal Features</span>
                            <h2 className="text-3xl md:text-4xl font-black mt-3 mb-4">포털에서 할 수 있는 모든 것</h2>
                            <p style={{ color: 'rgba(240,244,255,0.4)' }}>전담팀이 모든 법무 이슈를 처리하고, 고객님은 포털에서 실시간 확인</p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
                                <motion.div key={title} variants={fadeUp}
                                    className="p-6 rounded-2xl group hover:-translate-y-1 transition-transform duration-300"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                        style={{ background: `${color}12` }}>
                                        <Icon className="w-6 h-6" style={{ color }} />
                                    </div>
                                    <h3 className="font-black text-base mb-2" style={{ color: '#f0f4ff' }}>{title}</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.5)' }}>{desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─── 하이브리드 통합: 제공 서비스 요약 배너 ─── */}
            <section className="py-20 px-4" style={{ background: 'linear-gradient(to right, #04091a, rgba(201,168,76,0.05), #04091a)' }}>
                <div className="max-w-5xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-3xl"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.2)', boxShadow: 'inset 0 0 40px rgba(201,168,76,0.05)' }}>
                            <div className="flex-1">
                                <span className="text-xs font-black tracking-[0.2em] uppercase mb-2 block" style={{ color: '#c9a84c' }}>Premium Services</span>
                                <h3 className="text-2xl md:text-3xl font-black mb-4">어떤 서비스를 관리하나요?</h3>
                                <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                    IBS 포털은 단순한 문서 보관함이 아닙니다. 국내 최고 수준의 프랜차이즈·기업 전문 변호사 그룹이 제공하는 <strong>6대 핵심 법률 서비스</strong>의 커맨드 센터입니다.
                                </p>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {['기업 법률 자문', '개인정보 컴플라이언스', 'EAP 심리상담', '노무·경영 리스크', '송무·분쟁 해결', '법무 뉴스레터'].map(svc => (
                                        <span key={svc} className="text-xs font-bold px-3 py-1.5 rounded-full"
                                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            {svc}
                                        </span>
                                    ))}
                                </div>
                                <Link href="/service">
                                    <button className="flex items-center gap-2 text-sm font-bold transition-all hover:text-white"
                                        style={{ color: '#c9a84c' }}>
                                        IBS 서비스 한눈에 보기 <ArrowRight className="w-4 h-4" />
                                    </button>
                                </Link>
                            </div>
                            <div className="flex-shrink-0 grid grid-cols-2 gap-3">
                                {[
                                    { i: Briefcase, color: '#c9a84c', t: '전문성' },
                                    { i: Shield, color: '#60a5fa', t: '안전함' },
                                    { i: Brain, color: '#a78bfa', t: 'AI 결합' },
                                    { i: Users, color: '#34d399', t: '전담팀' },
                                ].map((stat, idx) => (
                                    <div key={idx} className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-2"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <stat.i className="w-6 h-6" style={{ color: stat.color }} />
                                        <span className="text-xs font-bold" style={{ color: 'rgba(240,244,255,0.7)' }}>{stat.t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─── 이용 방법 ─── */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center mb-16">
                            <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: '#818cf8' }}>How to Start</span>
                            <h2 className="text-3xl md:text-4xl font-black mt-3">
                                포털 이용까지 단 <span style={{ color: '#c9a84c' }}>4단계</span>
                            </h2>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 gap-5">
                            {STEPS.map(({ icon: Icon, num, title, desc }, i) => (
                                <motion.div key={num} variants={fadeUp}
                                    className="flex gap-4 p-6 rounded-2xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-xl"
                                        style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
                                        {num}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base mb-1.5">{title}</h3>
                                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.5)' }}>{desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─── Already a customer CTA ─── */}
            <section className="py-20 px-4" style={{ background: 'rgba(201,168,76,0.04)', borderTop: '1px solid rgba(201,168,76,0.15)' }}>
                <div className="max-w-3xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center">
                            <h2 className="text-3xl md:text-4xl font-black mb-4">이미 IBS 고객이신가요?</h2>
                            <p className="mb-10" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                담당 변호사가 발급한 초대 코드로 포털에 등록하고<br />모든 서비스를 이용하세요.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/login">
                                    <button className="flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105"
                                        style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                                        <ArrowRight className="w-5 h-5" />포털 로그인
                                    </button>
                                </Link>
                                <a href="tel:025988518"
                                    className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all hover:bg-white/10"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff' }}>
                                    <Phone className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                    02-598-8518 문의
                                </a>
                            </div>
                        </motion.div>

                        {/* 신규 문의 링크 */}
                        <motion.div variants={fadeUp} className="mt-10 text-center">
                            <p style={{ color: 'rgba(240,244,255,0.35)' }} className="text-sm mb-3">아직 IBS 고객이 아니신가요?</p>
                            <Link href="/consultation"
                                className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors hover:opacity-70"
                                style={{ color: '#c9a84c' }}>
                                무료 상담 신청하기 <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>
            
            <InteractivePortalTour 
                isOpen={isTourOpen} 
                onClose={() => setIsTourOpen(false)} 
                onComplete={() => {
                    setIsTourOpen(false);
                    triggerCelebration();
                }}
            />
            <CelebrationModal 
                isOpen={isCelebrationActive}
                onClose={closeCelebration}
            />
        </div>
    );
}
