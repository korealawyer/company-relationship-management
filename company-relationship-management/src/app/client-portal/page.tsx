'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, FileText, MessageSquare, AlertTriangle,
    CheckCircle2, ArrowRight, Plus, Shield,
    CreditCard, Star, ChevronRight, Bell, BadgeCheck,
    Lock, Sparkles, Phone,
} from 'lucide-react';
import Link from 'next/link';

// ── 목업 데이터 ────────────────────────────────────────
const MOCK_COMPANY = {
    name: '(주)놀부NBG',
    plan: 'FREE',           // FREE = 1차 무료 분석만
    expiresAt: null,
    lawyer: '유정훈 변호사',
    legalUsed: 0, legalTotal: 0,
};

const MOCK_ISSUES = [
    {
        id: 'i1', level: 'HIGH',
        title: '수집 항목 법정 기재 누락',
        law: '개인정보 보호법 제30조 제1항 제1호',
        desc: '수집하는 개인정보 항목이 처리방침에 명시되지 않아 즉시 과태료 부과 대상입니다.',
        fine: '최대 3,000만원',
        locked: false,
    },
    {
        id: 'i2', level: 'HIGH',
        title: '제3자 제공 동의 절차 부재',
        law: '개인정보 보호법 제17조 제2항',
        desc: '가맹점 데이터를 마케팅 파트너사에 제공 시 별도 동의를 받아야 합니다.',
        fine: '최대 5,000만원',
        locked: false,
    },
    {
        id: 'i3', level: 'MEDIUM',
        title: '보유·이용 기간 불명확',
        law: '개인정보 보호법 제30조 제1항 제3호',
        desc: '구독 후 열람 가능합니다.',
        fine: '시정 권고',
        locked: true,
    },
    {
        id: 'i4', level: 'MEDIUM',
        title: '정보주체 권리 행사 방법 미기재',
        law: '개인정보 보호법 제35조·36조',
        desc: '구독 후 열람 가능합니다.',
        fine: '시정 권고',
        locked: true,
    },
];

const MOCK_NOTICES = [
    { date: '2026-03-01', title: '가맹사업법 시행령 개정 (2026.04.01 시행)', level: 'HIGH' },
    { date: '2026-02-20', title: '개인정보보호법 과징금 상한액 상향 조정', level: 'MEDIUM' },
];

// ── 이슈 레벨 스타일 ──────────────────────────────────
const LEVEL_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
    HIGH: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', label: '⚠ 위험' },
    MEDIUM: { color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)', label: '● 주의' },
    LOW: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)', label: '✓ 양호' },
};

// ── 잠금 아이템 컴포넌트 ──────────────────────────────
function LockedIssueCard() {
    return (
        <div className="p-5 rounded-2xl relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="absolute inset-0 backdrop-blur-[1px]" style={{ background: 'rgba(4,9,26,0.4)', zIndex: 1 }} />
            <div className="relative z-10 flex flex-col items-center justify-center py-4 gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <Lock className="w-5 h-5" style={{ color: '#c9a84c' }} />
                </div>
                <p className="text-sm font-bold text-center" style={{ color: 'rgba(240,244,255,0.7)' }}>
                    상세 내용은 구독 후 열람 가능합니다
                </p>
                <Link href="/pricing">
                    <button className="text-xs font-black px-4 py-2 rounded-lg btn-gold">
                        구독 시작하기 →
                    </button>
                </Link>
            </div>
        </div>
    );
}

// ── 메인 ─────────────────────────────────────────────
export default function ClientPortalPage() {
    const [expanded, setExpanded] = useState<string | null>('i1');
    const isFree = MOCK_COMPANY.plan === 'FREE';
    const highCount = MOCK_ISSUES.filter(i => i.level === 'HIGH').length;
    const mediumCount = MOCK_ISSUES.filter(i => i.level === 'MEDIUM').length;

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#04091a', color: '#f0f4ff' }}>
            <div className="max-w-5xl mx-auto px-4">

                {/* ── 무료 분석 완료 배너 ── */}
                {isFree && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-6 rounded-2xl overflow-hidden relative"
                        style={{
                            background: 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(13,27,62,0.9) 100%)',
                            border: '1.5px solid rgba(201,168,76,0.5)',
                        }}>
                        <div className="absolute inset-0 opacity-[0.03]"
                            style={{ background: 'repeating-linear-gradient(45deg, #c9a84c 0, #c9a84c 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
                        <div className="relative px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)' }}>
                                    <Shield className="w-6 h-6 text-[#04091a]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black px-2 py-0.5 rounded-full"
                                            style={{ background: '#c9a84c', color: '#04091a' }}>무료 검토 완료</span>
                                        <span className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>2026-02-28 분석</span>
                                    </div>
                                    <p className="font-black text-lg" style={{ color: '#f0f4ff' }}>
                                        귀사 개인정보처리방침에서 <span style={{ color: '#f87171' }}>위험 {highCount}건</span>, <span style={{ color: '#fb923c' }}>주의 {mediumCount}건</span>이 발견되었습니다
                                    </p>
                                    <p className="text-sm mt-1" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                        담당: {MOCK_COMPANY.lawyer} · 전체 검토 및 수정 지원을 받으시려면 구독이 필요합니다
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                <Link href="/pricing">
                                    <button className="whitespace-nowrap px-6 py-3 rounded-xl font-black text-sm btn-gold flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        지금 구독하기
                                    </button>
                                </Link>
                                <Link href="/sales">
                                    <button className="whitespace-nowrap text-xs text-center font-bold py-1.5"
                                        style={{ color: 'rgba(201,168,76,0.7)' }}>
                                        전화 상담 → 02-555-1234
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── 요약 카드 3개 ── */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: '위험 이슈', value: String(highCount), color: '#f87171', icon: AlertTriangle, sub: '즉시 조치 필요' },
                        { label: '주의 이슈', value: String(mediumCount), color: '#fb923c', icon: Bell, sub: '검토 권장' },
                        { label: '처리 완료', value: '0', color: '#4ade80', icon: CheckCircle2, sub: isFree ? '구독 후 처리' : '완료' },
                    ].map(({ label, value, color, icon: Icon, sub }) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}25` }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-4 h-4" style={{ color }} />
                                <span className="text-xs font-bold" style={{ color: 'rgba(240,244,255,0.5)' }}>{label}</span>
                            </div>
                            <div className="text-3xl font-black mb-1" style={{ color }}>{value}건</div>
                            <p className="text-xs" style={{ color: 'rgba(240,244,255,0.35)' }}>{sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ── 본문 그리드 ── */}
                <div className="grid md:grid-cols-3 gap-6">

                    {/* 이슈 목록 (2/3) */}
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-black text-lg" style={{ color: '#f0f4ff' }}>
                                1차 검토 결과
                                <span className="ml-2 text-sm font-normal" style={{ color: 'rgba(240,244,255,0.35)' }}>
                                    — 2건 무료 공개
                                </span>
                            </h2>
                            {!isFree && (
                                <Link href="/chat">
                                    <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                                        style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
                                        <Plus className="w-3 h-3" /> 상담 추가
                                    </button>
                                </Link>
                            )}
                        </div>

                        <div className="space-y-3">
                            {MOCK_ISSUES.map((issue, idx) => {
                                const ls = LEVEL_STYLE[issue.level];
                                if (issue.locked) return <LockedIssueCard key={issue.id} />;

                                return (
                                    <motion.div key={issue.id} layout
                                        className="rounded-2xl overflow-hidden cursor-pointer"
                                        style={{ background: ls.bg, border: `1.5px solid ${ls.border}` }}
                                        onClick={() => setExpanded(expanded === issue.id ? null : issue.id)}>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-xs font-black px-2 py-0.5 rounded"
                                                            style={{ background: `${ls.color}20`, color: ls.color }}>
                                                            {ls.label}
                                                        </span>
                                                        {issue.fine && (
                                                            <span className="text-xs font-bold"
                                                                style={{ color: issue.level === 'HIGH' ? '#f87171' : '#fb923c' }}>
                                                                과태료 {issue.fine}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-black text-base leading-snug" style={{ color: '#f0f4ff' }}>
                                                        {issue.title}
                                                    </h3>
                                                    <p className="text-xs mt-1" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                                        근거: {issue.law}
                                                    </p>
                                                </div>
                                                <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 transition-transform ${expanded === issue.id ? 'rotate-90' : ''}`}
                                                    style={{ color: 'rgba(240,244,255,0.3)' }} />
                                            </div>

                                            <AnimatePresence>
                                                {expanded === issue.id && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${ls.border}` }}>
                                                            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(240,244,255,0.75)' }}>
                                                                {issue.desc}
                                                            </p>
                                                            {isFree && (
                                                                <div className="flex items-center gap-3 p-3 rounded-xl"
                                                                    style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                                                                    <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: '#c9a84c' }} />
                                                                    <p className="text-xs" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                                                        구독하시면 전담 변호사가 <strong style={{ color: '#c9a84c' }}>직접 수정안</strong>을 작성해 드립니다.
                                                                    </p>
                                                                    <Link href="/pricing" className="flex-shrink-0">
                                                                        <button className="text-xs font-black px-3 py-1.5 rounded-lg btn-gold whitespace-nowrap">
                                                                            구독 →
                                                                        </button>
                                                                    </Link>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* 잠금 안내 */}
                        {isFree && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                                className="mt-4 p-4 rounded-xl text-center"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                    나머지 <strong style={{ color: 'rgba(240,244,255,0.7)' }}>{MOCK_ISSUES.filter(i => i.locked).length}건</strong>의 이슈와 전담 변호사 수정안은
                                </p>
                                <Link href="/pricing">
                                    <button className="mt-2 text-sm font-black px-5 py-2 rounded-lg btn-gold inline-flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" /> 구독 후 열람
                                    </button>
                                </Link>
                            </motion.div>
                        )}
                    </div>

                    {/* 사이드바 (1/3) */}
                    <div className="space-y-5">

                        {/* 담당 변호사 카드 */}
                        <div className="p-5 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h3 className="font-black text-sm mb-4" style={{ color: '#c9a84c' }}>담당 변호사</h3>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
                                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>유</div>
                                <div>
                                    <p className="font-black text-sm" style={{ color: '#f0f4ff' }}>유정훈 변호사</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-current" style={{ color: '#c9a84c' }} />)}
                                        <span className="text-xs ml-1" style={{ color: 'rgba(240,244,255,0.4)' }}>(124)</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs mb-3" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                개인정보보호·프랜차이즈법 전문<br />서울지방변호사회 · 대한법조코리아
                            </p>
                            <a href="tel:02-555-1234">
                                <button className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                                    style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}>
                                    <Phone className="w-4 h-4" /> 전화 상담
                                </button>
                            </a>
                        </div>

                        {/* 구독 혜택 (무료 사용자만) */}
                        {isFree && (
                            <div className="p-5 rounded-2xl relative overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(13,27,62,0.8))',
                                    border: '1.5px solid rgba(201,168,76,0.3)',
                                }}>
                                <h3 className="font-black text-sm mb-3" style={{ color: '#c9a84c' }}>
                                    ✨ 구독하면 받는 혜택
                                </h3>
                                {[
                                    { icon: BadgeCheck, text: '전담 변호사 직접 수정안 제공' },
                                    { icon: Shield, text: '나머지 이슈 전체 열람' },
                                    { icon: FileText, text: '계약서·방침 문서 수정 대행' },
                                    { icon: MessageSquare, text: '월 10건 법률 자문 무제한' },
                                ].map(({ icon: Icon, text }) => (
                                    <div key={text} className="flex items-center gap-2.5 mb-2.5">
                                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                                        <span className="text-xs" style={{ color: 'rgba(240,244,255,0.8)' }}>{text}</span>
                                    </div>
                                ))}
                                <Link href="/pricing">
                                    <button className="w-full mt-2 py-3 rounded-xl font-black text-sm btn-gold flex items-center justify-center gap-2">
                                        <CreditCard className="w-4 h-4" /> 월 99,000원부터 시작
                                    </button>
                                </Link>
                            </div>
                        )}

                        {/* 규제 알림 */}
                        <div className="p-5 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h3 className="font-black text-sm mb-3" style={{ color: '#c9a84c' }}>📢 규제 변경 알림</h3>
                            {MOCK_NOTICES.map(({ date, title, level }) => (
                                <div key={date} className="mb-3 pb-3 last:mb-0 last:pb-0"
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                            style={{
                                                background: level === 'HIGH' ? 'rgba(248,113,113,0.15)' : 'rgba(251,146,60,0.15)',
                                                color: level === 'HIGH' ? '#f87171' : '#fb923c',
                                            }}>
                                            {level}
                                        </span>
                                        <span className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>{date}</span>
                                    </div>
                                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.75)' }}>{title}</p>
                                </div>
                            ))}
                        </div>

                        {/* 빠른 메뉴 */}
                        <div className="p-5 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h3 className="font-black text-sm mb-3" style={{ color: '#c9a84c' }}>빠른 메뉴</h3>
                            {[
                                { href: '/chat', label: '법률 상담 접수', icon: '⚖️' },
                                { href: '/contracts', label: '전자계약 서명', icon: '✍️' },
                                { href: '/pricing', label: '구독 플랜 보기', icon: '🏆' },
                                { href: '/sales', label: '전문 상담 신청', icon: '📞' },
                            ].map(({ href, label, icon }) => (
                                <Link key={href} href={href}>
                                    <div className="flex items-center gap-3 py-2.5 cursor-pointer group border-b"
                                        style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                                        <span className="text-base">{icon}</span>
                                        <span className="text-sm flex-1 group-hover:text-yellow-300 transition-colors"
                                            style={{ color: 'rgba(240,244,255,0.75)' }}>{label}</span>
                                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ color: '#c9a84c' }} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
