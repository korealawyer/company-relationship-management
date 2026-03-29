'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, AlertTriangle, CheckCircle2, ArrowRight, ChevronDown,
    FileSearch, Lock, Zap, Clock, Scale, AlertCircle, Phone, Sparkles
} from 'lucide-react';
import Link from 'next/link';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };

const RISKS = [
    { label: '개인정보 과다수집', penalty: '과태료 최대 5,000만원', color: '#dc2626', icon: AlertCircle },
    { label: '제3자 제공 미명시', penalty: '과징금 매출액 3% 이하', color: '#d97706', icon: AlertCircle },
    { label: '마케팅 동의 흠결', penalty: '과태료 3,000만원 이하', color: '#7c3aed', icon: AlertCircle },
    { label: '보유기간 미명시', penalty: '과태료 2,000만원 이하', color: '#dc2626', icon: AlertCircle },
];

const STEPS = [
    { icon: FileSearch, color: '#c9a84c', title: '처리방침 URL 입력', desc: '귀사 개인정보처리방침 URL 또는 텍스트를 입력합니다. 5분이면 충분합니다.' },
    { icon: Zap, color: '#818cf8', title: 'AI 자동 분석', desc: '개인정보보호법 최신 법령 기준으로 AI가 즉시 위험 항목을 검출합니다.' },
    { icon: Scale, color: '#34d399', title: '변호사 검토 의견', desc: '10년차 변호사 수준의 구체적 법령 위반 의견과 예상 제재를 제공합니다.' },
    { icon: CheckCircle2, color: '#fb923c', title: '수정 권고안 수령', desc: '구독 시 48시간 내 전문 변호사가 수정본을 완성하여 제공합니다.' },
];

const FAQS = [
    { q: '무료로 무엇을 볼 수 있나요?', a: '고위험·주의 항목 모두 열람 가능합니다. 수정 권고안은 구독 후 열람 가능하며, 구독 전 어떤 내용이 수정될지 미리 확인할 수 있습니다.' },
    { q: '어떤 법령 기준으로 진단하나요?', a: '개인정보보호법 제16·17·21·22·30조, 정보통신망법 제27조의2, 개인정보보호위원회 최신 고시를 기준으로 합니다.' },
    { q: '진단 후 수정까지 얼마나 걸리나요?', a: '구독 즉시 전담 변호사팀이 배정되고, 48시간 내 수정 완료를 보장합니다. 긴급 시 24시간 처리도 가능합니다.' },
    { q: '내 처리방침 내용이 외부에 유출되나요?', a: '진단 내용은 변호사법과 강력한 보안 정책에 의거해 100% 기밀 유지됩니다. 제3자에게 일절 제공되지 않습니다.' },
];

export default function PrivacyReportPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [url, setUrl] = useState('');

    return (
        <div style={{ minHeight: '100vh', background: '#f8f7f4' }}>

            {/* ─── Hero (다크) ─── */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden"
                style={{ background: '#04091a', color: '#f0f4ff' }}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full opacity-20"
                        style={{ background: 'radial-gradient(ellipse, rgba(220,38,38,0.2), transparent 70%)' }} />
                    <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[50%] rounded-full opacity-15"
                        style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.15), transparent 70%)' }} />
                </div>

                <motion.div initial="hidden" animate="visible" variants={stagger}
                    className="relative z-10 max-w-4xl mx-auto text-center">

                    <motion.div variants={fadeUp}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                        style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}>
                        <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
                        <span className="text-sm font-black" style={{ color: '#ef4444' }}>지금 당장 점검이 필요합니다</span>
                    </motion.div>

                    <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-black leading-[1.1] mb-8 tracking-tight">
                        개인정보처리방침<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #ef4444, #f97316)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>위반 리스크</span>를<br />
                        AI가 즉시 진단합니다
                    </motion.h1>

                    <motion.p variants={fadeUp} className="text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed"
                        style={{ color: 'rgba(240,244,255,0.6)' }}>
                        개인정보보호법 위반 시 <strong className="text-white font-bold">최대 매출액 3% 과징금</strong>이 부과됩니다.<br />
                        10년차 변호사 수준의 AI가 처리방침을 즉시 분석하고<br />실질적인 수정 방향을 제시합니다.
                    </motion.p>

                    {/* URL 입력 */}
                    <motion.div variants={fadeUp} className="max-w-2xl mx-auto mb-8">
                        <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                            <input
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://your-company.co.kr/privacy"
                                className="flex-1 bg-transparent px-4 py-3 text-base outline-none"
                                style={{ color: '#f0f4ff' }}
                            />
                            <Link href={url ? `/privacy-report/result?url=${encodeURIComponent(url)}` : '/privacy-report/result'}>
                                <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-base transition-all hover:scale-105 whitespace-nowrap"
                                    style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                                    <Sparkles className="w-4 h-4" />진단 시작
                                </button>
                            </Link>
                        </div>
                        <p className="text-xs mt-3" style={{ color: 'rgba(240,244,255,0.35)' }}>
                            <Lock className="w-3 h-3 inline mr-1" />입력 내용은 변호사법에 따라 100% 기밀 유지됩니다
                        </p>
                    </motion.div>

                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm"
                        style={{ color: 'rgba(240,244,255,0.5)' }}>
                        {['즉시 무료 분석', '5개 핵심 이슈 진단', '48h 수정 완료 보장'].map((t, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" style={{ color: '#4ade80' }} />
                                <span className="font-medium">{t}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ─── 리스크 경고 ─── */}
            <section className="py-20 px-4" style={{ background: '#fff' }}>
                <div className="max-w-4xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ color: '#111827' }}>
                                방치하면 <span style={{ color: '#dc2626' }}>억대 제재</span>로 이어집니다
                            </h2>
                            <p style={{ color: '#6b7280' }}>프랜차이즈 기업이 가장 많이 적발되는 4가지 위반 유형</p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {RISKS.map(({ label, penalty, color, icon: Icon }) => (
                                <motion.div key={label} variants={fadeUp}
                                    className="flex items-center gap-4 p-5 rounded-2xl"
                                    style={{ background: `${color}07`, border: `1px solid ${color}20` }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${color}15` }}>
                                        <Icon className="w-5 h-5" style={{ color }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-sm mb-0.5" style={{ color: '#111827' }}>{label}</p>
                                        <p className="text-xs font-bold" style={{ color }}>{penalty}</p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: color }} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─── 진단 프로세스 ─── */}
            <section className="py-24 px-4" style={{ background: '#f8f7f4' }}>
                <div className="max-w-4xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center mb-16">
                            <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: '#c9a84c' }}>How it works</span>
                            <h2 className="text-3xl md:text-4xl font-black mt-3" style={{ color: '#111827' }}>
                                단 <span style={{ color: '#c9a84c' }}>4단계</span>로 법적 리스크를 해소합니다
                            </h2>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {STEPS.map(({ icon: Icon, color, title, desc }, i) => (
                                <motion.div key={title} variants={fadeUp}
                                    className="flex gap-4 p-6 rounded-2xl"
                                    style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-lg"
                                        style={{ background: `${color}12`, color, border: `1px solid ${color}22` }}>
                                        0{i + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base mb-1.5" style={{ color: '#111827' }}>{title}</h3>
                                        <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─── FAQ ─── */}
            <section className="py-20 px-4" style={{ background: '#fff' }}>
                <div className="max-w-2xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center mb-12">
                            <h2 className="text-3xl font-black" style={{ color: '#111827' }}>자주 묻는 질문</h2>
                        </motion.div>

                        <div className="space-y-3">
                            {FAQS.map(({ q, a }, i) => (
                                <motion.div key={i} variants={fadeUp}
                                    className="rounded-2xl overflow-hidden"
                                    style={{ border: '1px solid #e5e7eb' }}>
                                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-gray-50">
                                        <span className="font-black text-sm" style={{ color: '#111827' }}>{q}</span>
                                        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ml-4 ${openFaq === i ? 'rotate-180' : ''}`}
                                            style={{ color: '#9ca3af' }} />
                                    </button>
                                    <AnimatePresence>
                                        {openFaq === i && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                                                <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: '#6b7280', borderTop: '1px solid #f3f4f6' }}>
                                                    <div className="pt-4">{a}</div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="py-20 px-4" style={{ background: '#04091a' }}>
                <div className="max-w-2xl mx-auto text-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                                <Clock className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                <span className="text-sm font-bold" style={{ color: '#c9a84c' }}>지금 무료로 시작하세요</span>
                            </div>
                            <h2 className="text-4xl font-black mb-4 text-white">
                                귀사의 개인정보처리방침,<br />몇 가지 위반이 있을까요?
                            </h2>
                            <p className="mb-10" style={{ color: 'rgba(240,244,255,0.45)' }}>예상보다 많은 위반이 발견될 수 있습니다. 지금 바로 확인하세요.</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/privacy-report/result">
                                    <button className="flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105"
                                        style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a', boxShadow: '0 10px 40px rgba(201,168,76,0.3)' }}>
                                        <Sparkles className="w-5 h-5" />무료 진단 시작
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </Link>
                                <a href="tel:025988518"
                                    className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all hover:bg-white/10"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#f0f4ff' }}>
                                    <Phone className="w-5 h-5" style={{ color: '#c9a84c' }} />
                                    02-598-8518
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
