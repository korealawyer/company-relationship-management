'use client';
import React, { useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Home, Sparkles, Calendar, Shield, Phone } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const NEXT_STEPS = [
    { num: 1, text: '신청 확인 이메일 발송 (5분 내)', done: true },
    { num: 2, text: '입금 확인 후 계정 활성화', done: false },
    { num: 3, text: '전담 변호사 배정 (48시간 내)', done: false },
    { num: 4, text: '온보딩 가이드 발송 및 서비스 시작', done: false },
];

function SuccessContent() {
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan') || 'Pro';
    const company = searchParams.get('company') || '';

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-16"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,222,128,0.06), #04091a 60%)' }}>

            {/* 배경 파티클 효과 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.div key={i}
                        initial={{ opacity: 0, y: 0, x: `${Math.random() * 100}%` }}
                        animate={{ opacity: [0, 0.6, 0], y: -300 + Math.random() * -200 }}
                        transition={{ delay: i * 0.3, duration: 3 + Math.random() * 2, repeat: Infinity, repeatDelay: Math.random() * 4 }}
                        className="absolute bottom-0 w-1 h-1 rounded-full"
                        style={{ background: '#4ade80', left: `${Math.random() * 100}%` }}
                    />
                ))}
            </div>

            <div className="max-w-lg w-full relative z-10">
                {/* 성공 아이콘 */}
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
                        style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.25), rgba(74,222,128,0.05))', border: '2px solid rgba(74,222,128,0.4)' }}>
                        <CheckCircle2 className="w-12 h-12" style={{ color: '#4ade80' }} />
                    </div>

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h1 className="text-4xl font-black mb-2" style={{ color: '#4ade80' }}>구독 완료!</h1>
                        {company && (
                            <p className="text-base mb-1" style={{ color: '#f0f4ff' }}>
                                <span style={{ color: '#c9a84c' }}>{company}</span>님,
                            </p>
                        )}
                        <p className="text-base" style={{ color: 'rgba(240,244,255,0.7)' }}>
                            <strong style={{ color: '#c9a84c' }}>{plan} 플랜</strong> 구독 신청이 완료되었습니다
                        </p>
                    </motion.div>
                </motion.div>

                {/* 다음 단계 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-2xl p-6 mb-5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h2 className="font-black text-sm mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: '#818cf8' }} />
                        다음 단계
                    </h2>
                    <div className="space-y-3">
                        {NEXT_STEPS.map(({ num, text, done }) => (
                            <div key={num} className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                                    style={{
                                        background: done ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
                                        color: done ? '#4ade80' : 'rgba(240,244,255,0.4)',
                                        border: `1px solid ${done ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                    }}>
                                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : num}
                                </div>
                                <span className="text-sm" style={{ color: done ? '#f0f4ff' : 'rgba(240,244,255,0.55)' }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* 입금 계좌 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="rounded-2xl p-5 mb-5"
                    style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)' }}>
                    <p className="text-xs font-black mb-3 flex items-center gap-1.5" style={{ color: '#c9a84c' }}>
                        <Sparkles className="w-3.5 h-3.5" /> 입금 안내
                    </p>
                    <div className="space-y-1.5 text-sm">
                        {[
                            ['은행', '국민은행'],
                            ['계좌번호', '123-456-789012'],
                            ['예금주', '법률사무소 IBS'],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                                <span style={{ color: 'rgba(240,244,255,0.4)' }}>{k}</span>
                                <span className="font-bold" style={{ color: '#e8c87a' }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* 보안 & 고객지원 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-4 mb-6 text-xs"
                    style={{ color: 'rgba(240,244,255,0.4)' }}>
                    <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" style={{ color: '#4ade80' }} /> SSL 보안</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} /> 02-1234-5678</span>
                </motion.div>

                {/* CTA 버튼 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="flex flex-col gap-3">
                    <Link href="/dashboard">
                        <button className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#04091a', boxShadow: '0 6px 24px rgba(201,168,76,0.3)' }}>
                            고객 포털 바로가기 <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                    <Link href="/login">
                        <button className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,244,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            로그인 페이지로
                        </button>
                    </Link>
                    <Link href="/">
                        <button className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5"
                            style={{ color: 'rgba(240,244,255,0.35)' }}>
                            <Home className="w-3.5 h-3.5" /> 홈으로
                        </button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

export default function SubscribeSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#04091a' }}>
                <div className="text-sm" style={{ color: '#4ade80' }}>로딩 중...</div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
