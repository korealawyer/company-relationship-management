'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, Search, Loader2, Phone, Video, ChevronDown, BadgeCheck, Zap, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ── URL 입력 → AI 분석 플로우 ──────────────────────────────
function UrlAnalyzer() {
    const [url, setUrl] = useState('');
    const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const [issueCount] = useState(() => Math.floor(Math.random() * (6 - 3 + 1)) + 3);

    const STEPS = [
        '검토 진행 중: 홈페이지 개인정보처리방침 확인중...',
        'AI 법률 DB 대조 분석 중...',
        '개인정보보호법 제30조 코린중...',
        '가맹거래법 교차검증 중...',
        '변호사 교차 검토 준비 중...',
    ];
    const [stepIdx, setStepIdx] = useState(0);

    const handleAnalyze = () => {
        if (!url.trim()) return;
        setPhase('loading');
        setProgress(0);
        setStepIdx(0);
        let p = 0;
        let s = 0;
        const iv = setInterval(() => {
            p += Math.random() * 18 + 5;
            if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => setPhase('done'), 400); }
            setProgress(Math.min(p, 100));
            if (p > s * 20 + 15) { s = Math.min(s + 1, STEPS.length - 1); setStepIdx(s); }
        }, 350);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="max-w-2xl mx-auto w-full">
            <AnimatePresence mode="wait">
                {phase === 'idle' && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '16px', padding: '8px 8px 8px 16px' }}>
                            <Search className="w-5 h-5 mt-3 flex-shrink-0 text-gold-60" />
                            <input type="url" placeholder="https://your-franchise.co.kr 입력 — 30초 내 무료 진단"
                                value={url} onChange={e => setUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                                className="flex-1 bg-transparent text-sm outline-none py-2 text-light" />
                            <button onClick={handleAnalyze} className="px-5 py-2.5 rounded-xl font-black text-sm transition-all btn-gold">
                                AI 진단 시작
                            </button>
                        </div>
                        <p className="text-center text-xs mt-2 text-muted-30">URL 미입력 시 블라인드 테스트 버전으로 실행 · 개인정보 수집 없음</p>
                    </motion.div>
                )}
                {phase === 'loading' && (
                    <motion.div key="loading" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="p-6 rounded-2xl" style={{ background: 'rgba(13,27,62,0.8)', border: '1px solid rgba(201,168,76,0.2)' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <Loader2 className="w-5 h-5 animate-spin text-gold" />
                            <span className="text-sm font-bold text-gold-light">분석 진행 중...</span>
                        </div>
                        <div className="h-2 w-full rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <motion.div className="h-2 rounded-full" style={{ background: 'linear-gradient(90deg,#c9a84c,#e8c87a)', width: `${progress}%` }} transition={{ duration: 0.3 }} />
                        </div>
                        <p className="text-xs text-muted-50">{STEPS[stepIdx]}</p>
                    </motion.div>
                )}
                {phase === 'done' && (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        className="p-6 rounded-2xl text-center" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)' }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 text-xs font-bold" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                            <AlertTriangle className="w-3.5 h-3.5" /> AI 분석 완료
                        </div>
                        <p className="font-black text-xl mb-1 text-light">법적 위반 이슈 <span className="text-danger">{issueCount}건</span> 발견</p>
                        <p className="text-sm mb-4 text-muted-50">변호사 교차 검증 리포트는 로그인 후 확인 가능합니다</p>
                        <div className="flex gap-3 justify-center">
                            <Link href="/client-portal">
                                <Button variant="premium" size="md" className="gap-2">
                                    <Lock className="w-4 h-4" /> 로그인하여 전체 리포트 보기 <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                            <button onClick={() => { setPhase('idle'); setUrl(''); }}
                                className="text-sm px-3 py-2 rounded-xl" style={{ color: 'rgba(240,244,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>다시 분석</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── 애니메이션 숫자 카운터 ─────────────────────────────────
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);

    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            setCount(Math.floor(current));
            if (current >= target) clearInterval(timer);
        }, 16);
        return () => clearInterval(timer);
    }, [inView, target]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── 스크롤 진행바 ──────────────────────────────────────────
export function ScrollProgress() {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const onScroll = () => {
            const scrolled = window.scrollY;
            const total = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(total > 0 ? (scrolled / total) * 100 : 0);
        };
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return <div className="scroll-progress" style={{ width: `${progress}%` }} />;
}

// ── Hero 섹션 ──────────────────────────────────────────────
interface HeroSectionProps {
    company: { name: string; issueCount: number; riskLevel: string };
    resolvedParams: { cid?: string };
}

export default function HeroSection({ company, resolvedParams }: HeroSectionProps) {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
            {/* 배경 오브 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div className="absolute w-[600px] h-[600px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(35,68,168,0.3) 0%, transparent 70%)', top: '-10%', left: '-5%' }}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
                    transition={{ duration: 8, repeat: Infinity }} />
                <motion.div className="absolute w-[400px] h-[400px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)', bottom: '10%', right: '5%' }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 2 }} />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
                {resolvedParams.cid && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold bg-gold-15 pill-gold-text"
                        style={{ border: '1px solid rgba(201,168,76,0.4)' }}>
                        <Zap className="w-4 h-4" />
                        {company.name} — 맞춤 분석 리포트
                    </motion.div>
                )}

                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold pill-gold pill-gold-text"
                    style={{ border: '1px solid rgba(201,168,76,0.35)' }}>
                    <BadgeCheck className="w-4 h-4" />
                    한국 프랜차이즈 전문 1등 로펌 · 설립 12년
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight mb-6 text-light">
                    <span className="block">프랜차이즈 본부의</span>
                    <span className="block text-gold-gradient">
                        법률 리스크
                    </span>
                    <span className="block text-[0.75em] text-muted-80" style={{ color: 'rgba(240,244,255,0.9)' }}>
                        AI가 30초 만에 진단합니다
                    </span>
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-lg sm:text-xl mb-8 max-w-3xl mx-auto leading-relaxed text-muted-70">
                    자문 기업 <strong className="text-gold-light">1,000억원 엑시트</strong> 달성 · <strong className="text-gold-light">45,000명</strong> 법률 서비스 제공<br />
                    지금 홈페이지 URL을 입력하면 무료로 법적 리스크를 진단해 드립니다.
                </motion.p>

                <UrlAnalyzer />

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center mt-5 mb-16">
                    <a href="tel:025551234">
                        <Button variant="ghost" size="md" className="gap-2 w-full sm:w-auto">
                            <Phone className="w-4 h-4" /> 전화 상담
                        </Button>
                    </a>
                    <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="md" className="gap-2 w-full sm:w-auto">
                            <Video className="w-4 h-4" /> 줌 상담 예약
                        </Button>
                    </a>
                </motion.div>

                {/* 통계 */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
                    {[
                        { value: 80000, suffix: '+', label: '누적 법률 자문' },
                        { value: 45000, suffix: '명', label: '법률 서비스 회원' },
                        { value: 98, suffix: '%', label: '리스크 해결률' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-2xl sm:text-3xl font-black text-gold">
                                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                            </div>
                            <div className="text-xs mt-1 text-muted-50">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <ChevronDown className="w-6 h-6 text-gold-50" />
                </motion.div>
            </div>
        </section>
    );
}
