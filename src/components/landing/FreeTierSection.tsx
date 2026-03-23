'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Check, Lock, Sparkles, ArrowRight, BarChart3, MessageCircle,
    FileText, Shield, Brain, Users, BookOpen, Bell,
} from 'lucide-react';
import Link from 'next/link';
import { fadeUp } from '@/lib/landingData';

const FREE_FEATURES = [
    { icon: Brain, label: '법률 챗봇 질문', desc: '월 3회 무료', active: true },
    { icon: Shield, label: '개인정보 기본 진단', desc: '1회 무료 리포트', active: true },
    { icon: Bell, label: '법무 뉴스레터', desc: '주 1회 발송', active: true },
    { icon: BookOpen, label: 'FAQ · 법률 가이드', desc: '전체 열람', active: true },
    { icon: BarChart3, label: '대시보드 미리보기', desc: '샘플 데이터', active: true },
];

const PAID_FEATURES = [
    { icon: MessageCircle, label: '변호사 직접 자문', desc: '무제한', locked: true },
    { icon: FileText, label: '계약서 검토', desc: '무제한', locked: true },
    { icon: BarChart3, label: '월간 법무 리포트', desc: '맞춤 분석', locked: true },
    { icon: Users, label: '팀원 초대 & 관리', desc: '무제한', locked: true },
];

export default function FreeTierSection() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* 헤더 */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm font-bold"
                        style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
                        <Sparkles className="w-4 h-4" /> 무료로 시작하세요
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                        가입만 해도{' '}
                        <span style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            5가지 기능
                        </span>
                        을 무료로
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(240,244,255,0.55)' }}>
                        결제 없이 시작하세요. 플랫폼의 가치를 직접 체험한 후 구독을 결정하실 수 있습니다.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8 mb-14">
                    {/* 무료 기능 */}
                    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        className="p-8 rounded-2xl"
                        style={{ background: 'rgba(74,222,128,0.04)', border: '1.5px solid rgba(74,222,128,0.2)' }}>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="px-3 py-1 rounded-full text-xs font-black" style={{ background: '#4ade80', color: '#052e16' }}>FREE</span>
                            <span className="font-black text-lg" style={{ color: '#f0f4ff' }}>무료 회원</span>
                        </div>
                        <div className="space-y-4">
                            {FREE_FEATURES.map((f, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ background: 'rgba(74,222,128,0.06)' }}>
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(74,222,128,0.12)' }}>
                                        <f.icon className="w-5 h-5" style={{ color: '#4ade80' }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>{f.label}</p>
                                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{f.desc}</p>
                                    </div>
                                    <Check className="w-5 h-5" style={{ color: '#4ade80' }} />
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* 유료 기능 */}
                    <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        className="p-8 rounded-2xl"
                        style={{ background: 'rgba(201,168,76,0.04)', border: '1.5px solid rgba(201,168,76,0.25)' }}>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="px-3 py-1 rounded-full text-xs font-black" style={{ background: '#c9a84c', color: '#0a0e1a' }}>PRO</span>
                            <span className="font-black text-lg" style={{ color: '#f0f4ff' }}>유료 구독</span>
                            <span className="text-xs ml-auto" style={{ color: 'rgba(201,168,76,0.7)' }}>월 33만원~</span>
                        </div>

                        {/* 무료 기능 포함 표시 */}
                        <div className="mb-4 p-3 rounded-xl flex items-center gap-2"
                            style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.1)' }}>
                            <Check className="w-4 h-4" style={{ color: '#4ade80' }} />
                            <span className="text-xs font-bold" style={{ color: '#4ade80' }}>무료 기능 전체 포함</span>
                        </div>

                        <div className="space-y-4 mb-6">
                            {PAID_FEATURES.map((f, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ background: 'rgba(201,168,76,0.06)' }}>
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(201,168,76,0.12)' }}>
                                        <f.icon className="w-5 h-5" style={{ color: '#c9a84c' }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>{f.label}</p>
                                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{f.desc}</p>
                                    </div>
                                    <Lock className="w-4 h-4" style={{ color: 'rgba(201,168,76,0.5)' }} />
                                </div>
                            ))}
                        </div>

                        <Link href="/pricing">
                            <button className="w-full py-3.5 rounded-xl font-black text-sm"
                                style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#04091a' }}>
                                요금제 비교하기 →
                            </button>
                        </Link>
                    </motion.div>
                </div>

                {/* 블러 대시보드 프리뷰 */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="relative rounded-2xl overflow-hidden"
                    style={{ border: '1.5px solid rgba(201,168,76,0.2)' }}>
                    {/* 블러 대시보드 */}
                    <div className="p-8 pb-12" style={{ background: 'rgba(255,255,255,0.02)', filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none' }}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            {[
                                { label: '진행 중 자문', value: '7건', color: '#60a5fa' },
                                { label: '이번 달 리포트', value: '3건', color: '#c9a84c' },
                                { label: '누적 법무비용 절감', value: '₩24,800,000', color: '#4ade80' },
                                { label: '리스크 점수', value: '12점 (안전)', color: '#22c55e' },
                            ].map((s, i) => (
                                <div key={i} className="p-5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
                                    <div className="text-xs" style={{ color: 'rgba(240,244,255,0.5)' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {['최근 자문 내역', '계약서 검토 현황', '법무 비용 추이'].map((title, i) => (
                                <div key={i} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: 140 }}>
                                    <p className="font-bold text-sm mb-3" style={{ color: 'rgba(240,244,255,0.6)' }}>{title}</p>
                                    <div className="space-y-2">
                                        {[1, 2, 3].map(j => (
                                            <div key={j} className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.06)', width: `${80 - j * 15}%` }} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 오버레이 CTA */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ background: 'radial-gradient(ellipse at center, rgba(4,9,26,0.85) 0%, rgba(4,9,26,0.6) 100%)' }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)' }}>
                            <Lock className="w-8 h-8" style={{ color: '#04091a' }} />
                        </div>
                        <h3 className="font-black text-2xl mb-2" style={{ color: '#f0f4ff' }}>구독 시 이 대시보드를</h3>
                        <p className="text-lg mb-1" style={{ color: '#e8c87a' }}>귀사 실제 데이터로 사용합니다</p>
                        <p className="text-sm mb-6" style={{ color: 'rgba(240,244,255,0.4)' }}>실시간 법무 현황 · 비용 분석 · 리스크 추적</p>
                        <Link href="/signup">
                            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-base"
                                style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#04091a' }}>
                                🔓 무료 체험 시작하기 <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
