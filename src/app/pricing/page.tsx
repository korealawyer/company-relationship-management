'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Star, Shield, Gift, Crown,
    Building2, Phone, Sparkles, ArrowRight, Lock,
} from 'lucide-react';
import Link from 'next/link';
import { getCurrentRole, RoleType } from '@/lib/mockStore';

// ── 요금제 데이터 ─────────────────────────────────────────
const PLANS = [
    {
        id: 'basic', name: 'Basic', price: 990000,
        period: '/월', color: '#60a5fa', badge: null,
        features: [
            'AI 법률 챗봇 무제한',
            '법률 자문 3건/월',
            '개인정보 기본 자동 검토',
            '가맹 상담 게시판',
            '5명 임직원 계정',
        ],
        limits: ['전담 변호사 없음', '심리/EAP 미포함'],
    },
    {
        id: 'pro', name: 'Pro', price: 2490000,
        period: '/월', color: '#c9a84c', badge: '가장 인기',
        features: [
            'AI 법률 챗봇 무제한',
            '법률 자문 10건/월',
            '개인정보 전체 자동 검토',
            '가맹 상담 우선 처리',
            '무제한 임직원 계정',
            '계약서 AI 검토 5건/월',
            '월간 법무 리포트',
            'EAP 심리상담 (기본)',
        ],
        limits: [],
    },
    {
        id: 'premium', name: 'Premium', price: 4990000,
        period: '/월', color: '#a78bfa', badge: '최고 서비스',
        features: [
            '모든 Pro 기능 포함',
            '법률 자문 무제한',
            '전담 변호사 지정',
            '계약서 AI 검토 무제한',
            '경영·노무 자문 포함',
            'EAP 심리상담 무제한',
            '소송 관리 대시보드',
            '세금계산서 자동 발행',
            '전용 슬랙 채널 지원',
        ],
        limits: [],
    },
];

const STATS = [
    { value: '1,000+', label: '가맹본부 고객사' },
    { value: '80,000+', label: '누적 자문 건수' },
    { value: '70%', label: '외부 법무 비용 절감' },
    { value: '48h', label: '평균 답변 시간' },
];

// ── 가맹점/임직원 전용 혜택 화면 ─────────────────────────
function FranchiseeView() {
    const PRO_PLAN = PLANS.find(p => p.id === 'pro')!;
    const benefitItems = [
        { icon: Shield, label: 'AI 법률 챗봇', desc: '24시간 즉시 답변' },
        { icon: CheckCircle2, label: '전담 변호사 자문', desc: '월 10건 무제한 상담' },
        { icon: Building2, label: '개인정보 자동 검토', desc: '리스크 실시간 모니터링' },
        { icon: Sparkles, label: 'EAP 심리상담', desc: '임직원 정신건강 지원' },
        { icon: Crown, label: '계약서 AI 검토', desc: '가맹 계약 리스크 분석' },
        { icon: Gift, label: '월간 법무 리포트', desc: '맞춤 법률 현황 리포트' },
    ];

    return (
        <div className="min-h-screen pt-20" style={{ background: '#04091a', color: '#f0f4ff' }}>
            {/* 헤더 */}
            <div className="text-center py-16 px-4">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
                        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)' }}>
                        <Gift className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-black" style={{ color: '#c9a84c' }}>본사 특별 지원 혜택</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                        귀사 본사에서<br />
                        <span style={{ color: '#c9a84c' }}>프리미엄 법률 서비스를</span><br />
                        전액 지원해 드립니다
                    </h1>
                    <p className="text-lg max-w-xl mx-auto mb-3" style={{ color: 'rgba(240,244,255,0.55)' }}>
                        IBS 법률사무소 Pro 플랜 (정가 월 <strong style={{ color: 'rgba(201,168,76,0.8)' }}>₩{PRO_PLAN.price.toLocaleString()}</strong> 상당)을
                        본사 지원으로 <strong style={{ color: '#4ade80' }}>무료</strong>로 이용하고 계십니다.
                    </p>
                    <p className="text-sm" style={{ color: 'rgba(240,244,255,0.3)' }}>
                        * 이 서비스는 소속 본사의 계약에 의해 제공됩니다
                    </p>
                </motion.div>
            </div>

            {/* 프리미엄 멤버십 카드 */}
            <div className="max-w-4xl mx-auto px-4 pb-12">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="relative rounded-3xl p-8 mb-8 overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(13,27,62,0.8) 100%)',
                            border: '2px solid rgba(201,168,76,0.5)',
                            boxShadow: '0 0 60px rgba(201,168,76,0.1)',
                        }}>
                        {/* 배경 장식 */}
                        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5"
                            style={{ background: 'radial-gradient(circle, #c9a84c, transparent)', transform: 'translate(30%, -30%)' }} />

                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)' }}>
                                        <Crown className="w-6 h-6 text-[#04091a]" />
                                    </div>
                                    <div>
                                        <p className="font-black text-xl" style={{ color: '#e8c87a' }}>본사 지원 Pro 멤버십</p>
                                        <p className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>IBS 법률사무소 · 프리미엄 법률 복지</p>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black" style={{ color: '#4ade80' }}>무료</span>
                                    <span className="text-sm line-through" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                        월 ₩{PRO_PLAN.price.toLocaleString()}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full font-bold"
                                        style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>
                                        본사 100% 지원
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 text-right">
                                <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>연간 절감 금액 (정가 대비)</p>
                                <p className="text-3xl font-black" style={{ color: '#c9a84c' }}>
                                    ₩{(PRO_PLAN.price * 12).toLocaleString()}
                                </p>
                                <p className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>귀사 본사가 지원하는 연간 금액</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 포함 혜택 그리드 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="text-xl font-black mb-6 text-center" style={{ color: '#f0f4ff' }}>
                        지금 바로 이용 가능한 혜택
                    </h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                        {benefitItems.map(({ icon: Icon, label, desc }, i) => (
                            <motion.div key={label}
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25 + i * 0.06 }}
                                className="flex items-start gap-3 p-4 rounded-2xl"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
                                <div className="p-2 rounded-lg flex-shrink-0"
                                    style={{ background: 'rgba(201,168,76,0.12)' }}>
                                    <Icon className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>{label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.45)' }}>{desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="text-center">
                    <Link href="/client-portal">
                        <button className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-lg btn-gold">
                            지금 바로 서비스 이용하기 <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                    <p className="text-xs mt-4" style={{ color: 'rgba(240,244,255,0.25)' }}>
                        법률 자문 · AI 분석 · 심리상담 — 지금 즉시 이용 가능
                    </p>
                </motion.div>

                {/* 잠금 배너 */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    className="mt-10 flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Lock className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(201,168,76,0.4)' }} />
                    <p className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>
                        이 화면은 본사 소속 계정에게만 표시됩니다. 요금제 세부 정보는 가맹본부 계약 페이지에서 확인하세요.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

// ── 일반 / 영업 대상 요금제 화면 ─────────────────────────
function PublicPricingView() {
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
    const [selected, setSelected] = useState<string | null>(null);

    const getPrice = (price: number) => billing === 'yearly' ? Math.round(price * 0.85) : price;

    return (
        <div className="min-h-screen pt-20" style={{ background: '#04091a' }}>
            {/* 히어로 */}
            <div className="text-center py-16 px-4">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                        <Star className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-bold" style={{ color: '#c9a84c' }}>투명한 가격 정책</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                        법률, 이제 구독으로<br />
                        <span style={{ color: '#c9a84c' }}>예측 가능하게</span>
                    </h1>
                    <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(240,244,255,0.5)' }}>
                        외부 로펌 대비 최대 70% 절감. 가맹점·임직원 모두 사용 가능한 통합 리테이너 플랫폼.
                    </p>
                </motion.div>

                {/* 연간/월간 토글 */}
                <div className="flex items-center justify-center gap-3 mt-8">
                    <span className="text-sm" style={{ color: billing === 'monthly' ? '#f0f4ff' : 'rgba(240,244,255,0.4)' }}>월간</span>
                    <button onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
                        className="relative w-14 h-7 rounded-full transition-all"
                        style={{ background: billing === 'yearly' ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.1)' }}>
                        <div className="absolute top-1 w-5 h-5 rounded-full transition-all"
                            style={{ left: billing === 'yearly' ? '33px' : '4px', background: '#c9a84c' }} />
                    </button>
                    <span className="text-sm" style={{ color: billing === 'yearly' ? '#f0f4ff' : 'rgba(240,244,255,0.4)' }}>
                        연간
                        <span className="text-xs px-2 py-0.5 rounded-full ml-1"
                            style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>15% 할인</span>
                    </span>
                </div>
            </div>

            {/* 플랜 카드 */}
            <div className="max-w-6xl mx-auto px-4 pb-12">
                <div className="grid md:grid-cols-3 gap-6">
                    {PLANS.map((plan, i) => (
                        <motion.div key={plan.id}
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative rounded-2xl p-6 cursor-pointer transition-all"
                            onClick={() => setSelected(plan.id)}
                            style={{
                                background: plan.id === 'pro'
                                    ? `linear-gradient(135deg, rgba(201,168,76,0.12), rgba(13,27,62,0.6))`
                                    : 'rgba(255,255,255,0.03)',
                                border: `2px solid ${selected === plan.id ? plan.color : plan.id === 'pro' ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            }}>
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 rounded-full text-xs font-black"
                                        style={{ background: plan.color, color: '#0a0e1a' }}>{plan.badge}</span>
                                </div>
                            )}
                            <div className="mb-4">
                                <h3 className="text-xl font-black" style={{ color: plan.color }}>{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-3xl font-black" style={{ color: '#f0f4ff' }}>
                                        {getPrice(plan.price).toLocaleString()}원
                                    </span>
                                    <span className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>{plan.period}</span>
                                </div>
                                {billing === 'yearly' && (
                                    <p className="text-xs mt-1" style={{ color: '#4ade80' }}>
                                        연 {(plan.price * 0.15 * 12).toLocaleString()}원 절감
                                    </p>
                                )}
                            </div>
                            <ul className="space-y-2 mb-6">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                                        <span style={{ color: 'rgba(240,244,255,0.8)' }}>{f}</span>
                                    </li>
                                ))}
                                {plan.limits.map(l => (
                                    <li key={l} className="flex items-start gap-2 text-sm opacity-40">
                                        <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-center">–</span>
                                        <span style={{ color: 'rgba(240,244,255,0.5)' }}>{l}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/onboarding">
                                <button className="w-full py-3 rounded-xl font-bold text-sm transition-all" style={{
                                    background: plan.id === 'pro' ? 'linear-gradient(135deg,#c9a84c,#e8c87a)' : `${plan.color}20`,
                                    color: plan.id === 'pro' ? '#0a0e1a' : plan.color,
                                    border: `1px solid ${plan.color}40`,
                                }}>
                                    시작하기 →
                                </button>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* 통계 */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.5 } }}
                    className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {STATS.map(({ value, label }) => (
                        <div key={label} className="text-center p-6 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="text-3xl font-black mb-1" style={{ color: '#c9a84c' }}>{value}</div>
                            <div className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>{label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* FAQ */}
                <div className="mt-16 text-center">
                    <p className="text-sm mb-4" style={{ color: 'rgba(240,244,255,0.5)' }}>도입 전 궁금한 점이 있으신가요?</p>
                    <Link href="/sales">
                        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold"
                            style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}>
                            <Phone className="w-4 h-4" /> 무료 도입 상담 신청
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ── 메인 페이지: 역할에 따라 분기 ────────────────────────
export default function PricingPage() {
    const [role, setRole] = useState<RoleType>('super_admin');

    useEffect(() => {
        setRole(getCurrentRole());
    }, []);

    // client_hr = 가맹점주 / 임직원 → 혜택 화면
    // 그 외 → 일반 요금제 화면
    const isFranchisee = role === 'client_hr';

    return (
        <AnimatePresence mode="wait">
            {isFranchisee ? (
                <motion.div key="franchisee"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <FranchiseeView />
                </motion.div>
            ) : (
                <motion.div key="public"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <PublicPricingView />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
