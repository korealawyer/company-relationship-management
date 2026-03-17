'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2, Sparkles, Building2, Users, Calendar,
    Upload, LayoutDashboard, ArrowRight, PartyPopper,
    Rocket, Shield, MessageSquare, Star,
} from 'lucide-react';
import Link from 'next/link';

/* ── 온보딩 체크리스트 ────────────────────────────────────── */
interface OnboardingStep {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    href: string;
    buttonLabel: string;
    color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'company',
        icon: Building2,
        title: '회사 정보 설정',
        description: '법인명, 사업자등록번호, 담당자 연락처 등 기본 정보를 입력해 주세요.',
        href: '/settings',
        buttonLabel: '정보 입력하기',
        color: '#c9a84c',
    },
    {
        id: 'invite',
        icon: Users,
        title: '팀원 초대하기',
        description: '함께 사용할 팀원을 초대하세요. 역할별 권한이 자동 부여됩니다.',
        href: '/company-hr',
        buttonLabel: '팀원 초대',
        color: '#2563eb',
    },
    {
        id: 'consultation',
        icon: Calendar,
        title: '첫 상담 예약',
        description: '전담 변호사와의 첫 상담을 예약하세요. 화상 또는 방문 상담이 가능합니다.',
        href: '/consultation',
        buttonLabel: '상담 예약',
        color: '#7c3aed',
    },
    {
        id: 'documents',
        icon: Upload,
        title: '문서 업로드',
        description: '검토가 필요한 계약서, 취업규칙 등을 업로드해 주세요. AI가 사전 분석합니다.',
        href: '/my-documents',
        buttonLabel: '문서 업로드',
        color: '#059669',
    },
    {
        id: 'dashboard',
        icon: LayoutDashboard,
        title: '대시보드 둘러보기',
        description: '사건 관리, AI 계약서 검토, 실시간 챗봇 등 모든 기능을 확인해 보세요.',
        href: '/dashboard',
        buttonLabel: '둘러보기',
        color: '#d97706',
    },
];

/* ── 기능 하이라이트 ──────────────────────────────────────── */
const FEATURES_HIGHLIGHT = [
    { icon: Shield, label: '개인정보 진단', desc: 'AI 기반 처리방침 분석' },
    { icon: MessageSquare, label: '법률 챗봇', desc: '24시간 AI 상담' },
    { icon: Star, label: '전담 변호사', desc: '48시간 내 배정' },
];

/* ── 메인 페이지 ─────────────────────────────────────────── */
export default function WelcomePage() {
    const [completed, setCompleted] = useState<Record<string, boolean>>({});

    const toggleComplete = (id: string) => {
        setCompleted(p => ({ ...p, [id]: !p[id] }));
    };

    const completedCount = Object.values(completed).filter(Boolean).length;
    const progressPercent = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);

    return (
        <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: '#04091a' }}>
            <div className="max-w-3xl mx-auto">

                {/* 환영 히어로 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                        style={{
                            background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(34,197,94,0.1))',
                            border: '2px solid rgba(201,168,76,0.3)',
                        }}
                    >
                        <PartyPopper className="w-10 h-10" style={{ color: '#e8c87a' }} />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-black mb-3"
                        style={{ color: '#f0f4ff' }}
                    >
                        환영합니다! 🎉
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-base mb-2"
                        style={{ color: 'rgba(240,244,255,0.6)' }}
                    >
                        법률사무소 IBS의 기업 맞춤형 법률 서비스가 시작됩니다
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-sm"
                        style={{ color: 'rgba(240,244,255,0.35)' }}
                    >
                        아래 5단계를 완료하면 모든 서비스를 바로 이용할 수 있습니다
                    </motion.p>
                </motion.div>

                {/* 진행률 바 */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl p-5 mb-6"
                    style={{
                        background: 'rgba(13,27,62,0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Rocket className="w-4 h-4" style={{ color: '#c9a84c' }} />
                            <span className="text-sm font-black" style={{ color: '#f0f4ff' }}>온보딩 진행률</span>
                        </div>
                        <span className="text-sm font-black" style={{ color: '#c9a84c' }}>
                            {completedCount}/{ONBOARDING_STEPS.length} 완료 ({progressPercent}%)
                        </span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{
                                background: progressPercent === 100
                                    ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                    : 'linear-gradient(90deg, #c9a84c, #e8c87a)',
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                    {progressPercent === 100 && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs font-bold mt-2 text-center"
                            style={{ color: '#4ade80' }}
                        >
                            🎉 모든 온보딩 단계를 완료했습니다! 대시보드에서 서비스를 이용해 보세요.
                        </motion.p>
                    )}
                </motion.div>

                {/* 체크리스트 */}
                <div className="space-y-3 mb-8">
                    {ONBOARDING_STEPS.map((step, i) => {
                        const Icon = step.icon;
                        const done = !!completed[step.id];
                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                                className="rounded-2xl p-5 transition-all"
                                style={{
                                    background: done
                                        ? 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(13,27,62,0.6))'
                                        : 'rgba(13,27,62,0.6)',
                                    border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                    opacity: done ? 0.75 : 1,
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    {/* 번호/체크 */}
                                    <button
                                        onClick={() => toggleComplete(step.id)}
                                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                                        style={{
                                            background: done ? 'rgba(34,197,94,0.15)' : `${step.color}15`,
                                            border: `2px solid ${done ? 'rgba(34,197,94,0.4)' : step.color + '30'}`,
                                        }}
                                    >
                                        {done ? (
                                            <CheckCircle2 className="w-5 h-5" style={{ color: '#4ade80' }} />
                                        ) : (
                                            <span className="text-sm font-black" style={{ color: step.color }}>{i + 1}</span>
                                        )}
                                    </button>

                                    {/* 내용 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon className="w-4 h-4" style={{ color: done ? '#4ade80' : step.color }} />
                                            <h3 className="font-bold text-sm"
                                                style={{
                                                    color: done ? 'rgba(240,244,255,0.5)' : '#f0f4ff',
                                                    textDecoration: done ? 'line-through' : 'none',
                                                }}>
                                                {step.title}
                                            </h3>
                                            {done && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                    style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>완료</span>
                                            )}
                                        </div>
                                        <p className="text-xs mb-3" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                            {step.description}
                                        </p>
                                        {!done && (
                                            <Link href={step.href}>
                                                <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all hover:opacity-80"
                                                    style={{ background: `${step.color}15`, color: step.color, border: `1px solid ${step.color}30` }}>
                                                    {step.buttonLabel} <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* 주요 기능 안내 */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="rounded-2xl p-6 mb-8"
                    style={{
                        background: 'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(13,27,62,0.6))',
                        border: '1px solid rgba(201,168,76,0.2)',
                    }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-black" style={{ color: '#c9a84c' }}>
                            이용 가능한 주요 기능
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {FEATURES_HIGHLIGHT.map(f => {
                            const FIcon = f.icon;
                            return (
                                <div key={f.label} className="text-center p-4 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <FIcon className="w-6 h-6 mx-auto mb-2" style={{ color: '#c9a84c' }} />
                                    <p className="text-xs font-black mb-0.5" style={{ color: '#f0f4ff' }}>{f.label}</p>
                                    <p className="text-[10px]" style={{ color: 'rgba(240,244,255,0.35)' }}>{f.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* 대시보드 이동 CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="flex flex-col gap-3"
                >
                    <Link href="/dashboard">
                        <button className="w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3"
                            style={{
                                background: 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                color: '#04091a',
                                boxShadow: '0 6px 30px rgba(201,168,76,0.4)',
                            }}>
                            <LayoutDashboard className="w-5 h-5" />
                            대시보드로 이동하기
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                    <Link href="/chat">
                        <button className="w-full py-3.5 rounded-xl font-bold text-sm"
                            style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.25)' }}>
                            🤖 AI 법률 챗봇과 대화하기
                        </button>
                    </Link>
                </motion.div>

                {/* 도움말 */}
                <div className="text-center mt-8">
                    <p className="text-xs" style={{ color: 'rgba(240,244,255,0.25)' }}>
                        도움이 필요하시면 <span style={{ color: '#c9a84c' }}>support@ibs-law.co.kr</span>로 문의하세요
                    </p>
                </div>
            </div>
        </div>
    );
}