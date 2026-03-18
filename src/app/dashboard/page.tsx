'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Lock, CheckCircle2, Clock, AlertTriangle,
    Phone, Video, CreditCard, MessageSquare, Star,
    ChevronRight, Shield, Download, Send, X,
    FileText, Scale, Gavel, BadgeCheck, TrendingUp,
    ChevronDown, ChevronUp, Mail, Bell,
    ArrowRight, Zap, Info, Award, Users, Eye,
    Bot, Briefcase, FolderOpen, Settings, HeartHandshake,
    LayoutGrid, Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { store, Company } from '@/lib/mockStore';

// ── 변호사 프로필 데이터 ──────────────────────────────────────
const LAWYERS = [
    {
        id: 'L1', name: '김수현', title: '파트너 변호사',
        specialty: '개인정보보호법·프랜차이즈법 전문',
        bar: '대한변호사협회 제28715호',
        career: ['서울지방변호사회 개인정보보호특별위원', '개인정보보호위원회 자문위원 역임', '프랜차이즈 가맹사업법 ISO 인증 심사위원'],
        cases: 847, rating: 4.9, reviews: 124,
    },
    {
        id: 'L2', name: '박준호', title: '시니어 변호사',
        specialty: '가맹거래법·공정거래법',
        bar: '대한변호사협회 제31204호',
        career: ['공정거래위원회 심사관 출신', '가맹사업 분쟁조정위원회 위원'],
        cases: 512, rating: 4.8, reviews: 89,
    },
];

// ── 고객 여정 단계 ────────────────────────────────────────────
const JOURNEY_STEPS = [
    { id: 'analyzed', label: '분석 완료', desc: '개인정보처리방침 자동 분석', icon: Zap },
    { id: 'lawyer_assigned', label: '변호사 배정', desc: '전담 변호사 배정 완료', icon: Gavel },
    { id: 'reviewing', label: '변호사 검토', desc: '법률 전문가 교차 검증 중', icon: Scale },
    { id: 'lawyer_confirmed', label: '검토 완료', desc: '최종 의견서 작성 완료', icon: BadgeCheck },
    { id: 'consulting', label: '맞춤 자문', desc: '지속 법률 자문 (구독)', icon: MessageSquare },
    { id: 'subscribed', label: '완전 관리', desc: '전방위 법률 리스크 관리', icon: Shield },
];

// ── 신뢰 배지 ────────────────────────────────────────────────
const TRUST_BADGES = [
    { icon: Shield, label: 'SSL 암호화', sub: '256-bit 보안' },
    { icon: Award, label: '변호사법 준수', sub: '법무부 신고 사무소' },
    { icon: BadgeCheck, label: '개보위 자문', sub: '개인정보보호위원회' },
    { icon: Users, label: '847개 기업', sub: '누적 자문 완료' },
];

// ── 이슈 카드 ────────────────────────────────────────────────
function IssueCard({ issue, index, locked }: {
    issue: { level: string; law: string; title: string; originalText: string; riskDesc: string; customDraft: string; lawyerNote: string; reviewChecked: boolean };
    index: number; locked?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const levelColor = issue.level === 'HIGH' ? '#f87171' : issue.level === 'MEDIUM' ? '#fb923c' : '#facc15';
    const levelBg = issue.level === 'HIGH' ? 'rgba(248,113,113,0.08)' : issue.level === 'MEDIUM' ? 'rgba(251,146,60,0.08)' : 'rgba(250,204,21,0.08)';

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
            <div className={`rounded-2xl mb-3 overflow-hidden transition-all ${locked ? 'filter blur-sm pointer-events-none select-none' : ''}`}
                style={{ border: `1px solid ${levelColor}25`, background: levelBg }}>
                <button className="w-full text-left p-4" onClick={() => setOpen(o => !o)}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="flex-shrink-0 text-xs font-black px-2 py-0.5 rounded-full"
                                style={{ background: `${levelColor}20`, color: levelColor, border: `1px solid ${levelColor}40` }}>
                                {issue.level === 'HIGH' ? '🔴 위험' : issue.level === 'MEDIUM' ? '🟠 주의' : '🟡 권장'}
                            </span>
                            <div className="min-w-0">
                                <p className="font-bold text-sm truncate" style={{ color: '#111827' }}>{issue.title}</p>
                                <p className="text-[10px] mt-0.5 font-mono truncate" style={{ color: '#9ca3af' }}>{issue.law}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {issue.reviewChecked && <BadgeCheck className="w-4 h-4" style={{ color: '#4ade80' }} />}
                            {open ? <ChevronUp className="w-4 h-4" style={{ color: '#9ca3af' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9ca3af' }} />}
                        </div>
                    </div>
                </button>
                <AnimatePresence>
                    {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <div className="px-4 pb-4 space-y-3">
                                {/* 원문 */}
                                {issue.originalText && (
                                    <div className="p-3 rounded-xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                        <p className="text-[10px] font-bold mb-1.5" style={{ color: '#d1d5db' }}>📄 현행 문구</p>
                                        <p className="text-xs leading-relaxed italic" style={{ color: '#6b7280' }}>{"\""}{issue.originalText}{"\""}</p>
                                    </div>
                                )}
                                {/* 리스크 설명 */}
                                <div className="p-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.12)' }}>
                                    <p className="text-[10px] font-bold mb-1.5" style={{ color: '#f87171' }}>⚠ 법률 리스크</p>
                                    <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{issue.riskDesc}</p>
                                </div>
                                {/* AI 수정 초안 */}
                                {issue.customDraft && (
                                    <div className="p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                                        <p className="text-[10px] font-bold mb-1.5" style={{ color: '#4ade80' }}>✏ 변호사 수정 초안</p>
                                        <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{issue.customDraft}</p>
                                    </div>
                                )}
                                {/* 변호사 노트 */}
                                {issue.lawyerNote && (
                                    <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
                                        <Gavel className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#c9a84c' }} />
                                        <div>
                                            <p className="text-[10px] font-bold mb-1" style={{ color: '#c9a84c' }}>변호사 추가 의견</p>
                                            <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{issue.lawyerNote}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ── 메인 대시보드 ─────────────────────────────────────────────
export default function DashboardPage() {
    const [company] = useState<Company | null>(() => {
        // 로그인된 회사 (mock: 첫 번째 분석 완료 기업)
        const all = store.getAll();
        return all.find(c => c.status !== 'pending' && c.status !== 'crawling') ?? all[0] ?? null;
    });
    const [activeTab, setActiveTab] = useState<'issues' | 'journey' | 'consult' | 'docs'>('issues');
    const [question, setQuestion] = useState('');
    const [questionSent, setQuestionSent] = useState(false);
    const [lawyer] = useState(LAWYERS[0]);
    const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);

    const isPaid = company?.plan === 'standard' || company?.plan === 'premium';
    const pipelineIdx = company ? ['pending', 'crawling', 'analyzed', 'sales_confirmed', 'assigned', 'reviewing', 'lawyer_confirmed', 'emailed', 'client_replied', 'subscribed'].indexOf(company.status) : 0;

    // 여정 단계 계산
    const getJourneyStatus = (stepId: string) => {
        const doneMap: Record<string, boolean> = {
            analyzed: pipelineIdx >= 2,
            lawyer_assigned: !!company?.assignedLawyer,
            reviewing: pipelineIdx >= 5,
            lawyer_confirmed: company?.lawyerConfirmed ?? false,
            consulting: isPaid,
            subscribed: company?.status === 'subscribed',
        };
        return doneMap[stepId] ?? false;
    };
    const currentJourneyStep = JOURNEY_STEPS.findIndex(s => !getJourneyStatus(s.id));

    // mock 이슈 (company.issues가 없으면 기본값)
    const issues = company?.issues?.length ? company.issues : [
        {
            level: 'HIGH', law: '개인정보 보호법 제30조 제1항 제1호', title: '수집 항목 법정 기재 누락',
            originalText: '고객의 개인정보를 수집합니다.',
            riskDesc: '수집하는 개인정보 항목(이름, 연락처, 사업자정보)이 처리방침에 전혀 명시되지 않아 개인정보보호위원회 현장 점검 시 즉시 과태료 부과 대상입니다. 최대 3,000만원 과태료.',
            customDraft: '"수집하는 개인정보 항목: 성명, 휴대전화번호, 이메일, 사업자등록번호 (서비스 제공 및 계약 이행 목적)"',
            lawyerNote: '2024년 개정 개인정보보호법 시행으로 수집 항목 미기재 시 임직원 형사처벌도 가능합니다. 즉시 수정을 권고합니다.',
            reviewChecked: true, aiDraftGenerated: true, id: 'i1'
        },
        {
            level: 'HIGH', law: '개인정보 보호법 제17조 제2항', title: '제3자 제공 동의 절차 부재',
            originalText: '파트너사와 정보를 공유할 수 있습니다.',
            riskDesc: '가맹점 데이터를 마케팅 파트너사에 제공 시 별도 동의를 받아야 하나, 현 방침에 이 절차가 없습니다. 정보 제공 1건당 최대 3,000만원 과태료.',
            customDraft: '제3자 제공 시 "제공받는 자, 제공 목적, 제공 항목, 보유기간"을 별도 고지 후 동의 획득 절차를 명시합니다.',
            lawyerNote: '최근 6개월간 유사 위반으로 5건의 과태료 처분이 있었습니다. 신속한 대응이 필요합니다.',
            reviewChecked: false, aiDraftGenerated: true, id: 'i2'
        },
        {
            level: 'MEDIUM', law: '개인정보 보호법 제30조 제1항 제3호', title: '보유·이용 기간 불명확',
            originalText: '서비스 종료 시까지 보유합니다.',
            riskDesc: '"서비스 종료 시까지"라는 불명확한 표현 사용. 법은 구체적 보유 기간을 요구합니다.',
            customDraft: '"계약 종료 후 5년 (상법 제33조), 세금계산서 관련 5년 (국세기본법 제85조의3)"',
            lawyerNote: '',
            reviewChecked: true, aiDraftGenerated: true, id: 'i3'
        },
        {
            level: 'MEDIUM', law: '개인정보 보호법 제35조·제36조·제37조', title: '정보주체 권리 행사 방법 미기재',
            originalText: '',
            riskDesc: '열람·정정·삭제·처리 정지 요청 방법 및 접수 담당자 정보가 없습니다.',
            customDraft: '"담당부서: 개인정보보호팀 / 연락처: privacy@company.co.kr / 처리 기간: 요청일 10일 이내"',
            lawyerNote: '',
            reviewChecked: false, aiDraftGenerated: false, id: 'i4'
        },
        {
            level: 'LOW', law: '개인정보 보호법 제31조', title: '개인정보 보호책임자 연락처 미흡',
            originalText: '홍길동 (개인정보보호 책임자)',
            riskDesc: '이름만 있고 이메일·전화번호가 없어 민원 처리가 불가능한 상태입니다.',
            customDraft: '"개인정보보호 책임자: 홍길동 / privacy@company.co.kr / 02-0000-0000"',
            lawyerNote: '',
            reviewChecked: false, aiDraftGenerated: false, id: 'i5'
        },
    ];

    const highCount = issues.filter(i => i.level === 'HIGH').length;
    const medCount = issues.filter(i => i.level === 'MEDIUM').length;
    const resolvedCount = issues.filter(i => i.reviewChecked).length;
    const progress = Math.round((resolvedCount / issues.length) * 100);

    return (
        <div className="min-h-screen" style={{ background: '#f8f7f4' }}>

            {/* ── 업그레이드 배너 ── */}
            <AnimatePresence>
                {!isPaid && showUpgradeBanner && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="relative z-40"
                        style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
                            <p className="text-xs" style={{ color: '#92400e' }}>
                                🔒 <strong>HIGH 위험 이슈 {highCount}건</strong> — 구독 후 변호사 수정문구 전체 열람 및 우선 처리
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Link href="/pricing">
                                    <button className="text-xs font-bold px-3 py-1 rounded-lg"
                                        style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#111827' }}>
                                        지금 구독하기
                                    </button>
                                </Link>
                                <button onClick={() => setShowUpgradeBanner(false)}>
                                    <X className="w-4 h-4" style={{ color: '#d1d5db' }} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* ── 상단 헤더 ── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">

                    {/* 회사 정보 */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Building2 className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                <span className="text-xs font-mono" style={{ color: 'rgba(201,168,76,0.6)' }}>
                                    {company?.biz || '123-45-67890'}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                    style={{ background: isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.12)', color: isPaid ? '#4ade80' : '#f87171' }}>
                                    {isPaid ? '✅ 구독 활성' : 'FREE'}
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: '#111827' }}>
                                {company?.name || '(주)놀부NBG'}{' '}
                                <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                    개인정보 진단 리포트
                                </span>
                            </h1>
                            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                                분석일: 2026-02-28 &nbsp;·&nbsp; 담당: {lawyer.name} 변호사 &nbsp;·&nbsp; 이슈 {issues.length}건 발견
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <a href="tel:025551234">
                                <Button variant="ghost" size="sm" className="gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> 전화 상담
                                </Button>
                            </a>
                            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                                style={{ background: '#fff', border: '1px solid #e8e5de', color: '#6b7280' }}>
                                <Download className="w-3.5 h-3.5" /> PDF 다운로드
                            </button>
                            {!isPaid && (
                                <Link href="/pricing">
                                    <Button variant="premium" size="sm" className="gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5" /> 구독 업그레이드
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* ── 리스크 요약 카드 3개 ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                        {[
                            { label: '위험 이슈', count: highCount, color: '#f87171', bg: 'rgba(248,113,113,0.08)', icon: AlertTriangle },
                            { label: '주의 이슈', count: medCount, color: '#fb923c', bg: 'rgba(251,146,60,0.08)', icon: Info },
                            { label: '검토 완료', count: resolvedCount, color: '#4ade80', bg: 'rgba(34,197,94,0.08)', icon: CheckCircle2 },
                            { label: '처리율', count: `${progress}%`, color: '#c9a84c', bg: 'rgba(201,168,76,0.08)', icon: TrendingUp },
                        ].map((s) => (
                            <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
                                <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
                                <p className="text-2xl font-black" style={{ color: s.color }}>{s.count}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── 고객 여정 타임라인 ── */}
                    <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <p className="text-xs font-black mb-4" style={{ color: '#6b7280' }}>📍 현재 진행 단계</p>
                        <div className="flex items-center gap-0 overflow-x-auto pb-1">
                            {JOURNEY_STEPS.map((step, i) => {
                                const done = getJourneyStatus(step.id);
                                const active = i === currentJourneyStep;
                                const locked = !isPaid && i >= 4;
                                const Icon = step.icon;
                                return (
                                    <React.Fragment key={step.id}>
                                        <div className="flex flex-col items-center min-w-[80px]">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-all"
                                                style={{
                                                    background: done ? '#4ade80' : active ? 'linear-gradient(135deg,#e8c87a,#c9a84c)' : '#f3f4f6',
                                                    border: `2px solid ${done ? '#4ade80' : active ? '#c9a84c' : '#e8e5de'}`,
                                                    boxShadow: active ? '0 0 16px rgba(201,168,76,0.3)' : 'none',
                                                }}>
                                                {locked ? <Lock className="w-4 h-4" style={{ color: '#d1d5db' }} /> :
                                                    <Icon className="w-4 h-4" style={{ color: done ? '#111827' : active ? '#111827' : '#d1d5db' }} />}
                                            </div>
                                            <p className="text-[10px] font-bold text-center leading-tight whitespace-nowrap"
                                                style={{ color: done ? '#4ade80' : active ? '#c9a84c' : '#d1d5db' }}>
                                                {step.label}
                                            </p>
                                            {active && (
                                                <span className="text-[9px] mt-0.5 animate-pulse" style={{ color: '#fbbf24' }}>진행 중</span>
                                            )}
                                        </div>
                                        {i < JOURNEY_STEPS.length - 1 && (
                                            <div className="flex-1 h-0.5 min-w-[16px] mx-1 mb-5"
                                                style={{ background: done ? '#4ade80' : '#f3f4f6' }} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* ── 신뢰 배지 ── */}
                <div className="flex flex-wrap gap-3 mb-6">
                    {TRUST_BADGES.map((b) => (
                        <div key={b.label} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                            style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid #e8e5de' }}>
                            <b.icon className="w-3.5 h-3.5" style={{ color: '#c9a84c' }} />
                            <div>
                                <p className="text-[10px] font-black" style={{ color: '#111827' }}>{b.label}</p>
                                <p className="text-[9px]" style={{ color: '#9ca3af' }}>{b.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── 클라이언트 포털 허브 ── */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <LayoutGrid className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <h2 className="font-black text-sm" style={{ color: '#111827' }}>서비스 바로가기</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { href: '/consultation', icon: HeartHandshake, label: '법률 상담', desc: '전문 변호사 상담 요청', color: '#818cf8', badge: null },
                            { href: '/chat', icon: Bot, label: 'AI 법률 챗봇', desc: '24시간 AI 법률 문의', color: '#4ade80', badge: 'NEW' },
                            { href: '/cases', icon: Briefcase, label: '사건 관리', desc: '진행 중인 사건 현황', color: '#fb923c', badge: null },
                            { href: '/documents', icon: FolderOpen, label: '문서 보관함', desc: '계약서·리포트 관리', color: '#60a5fa', badge: null },
                            { href: '/billing', icon: Coins, label: '결제·구독', desc: '청구서·요금제 관리', color: '#c9a84c', badge: null },
                            { href: '/company-hr', icon: Users, label: 'HR 관리', desc: '임직원·가맹점 관리', color: '#f472b6', badge: null },
                            { href: '/notifications', icon: Bell, label: '알림', desc: '법률 이슈 실시간 알림', color: '#a78bfa', badge: '3' },
                            { href: '/settings', icon: Settings, label: '설정', desc: '계정·보안·알림 설정', color: '#94a3b8', badge: null },
                        ].map(item => (
                            <Link key={item.href} href={item.href}>
                                <motion.div whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}
                                    className="relative p-4 rounded-2xl cursor-pointer transition-all h-full"
                                    style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                    {item.badge && (
                                        <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full font-black"
                                            style={{
                                                background: item.badge === 'NEW' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.12)',
                                                color: item.badge === 'NEW' ? '#4ade80' : '#f87171',
                                            }}>
                                            {item.badge}
                                        </span>
                                    )}
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                        style={{ background: `${item.color}12` }}>
                                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                                    </div>
                                    <p className="text-xs font-black mb-0.5" style={{ color: '#111827' }}>{item.label}</p>
                                    <p className="text-[10px]" style={{ color: '#9ca3af' }}>{item.desc}</p>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── 메인 2컬럼 레이아웃 ── */}
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* 왼쪽 — 탭 콘텐츠 */}
                    <div className="lg:col-span-2">
                        {/* 탭 헤더 */}
                        <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            {([
                                { id: 'issues', label: `이슈 리포트 (${issues.length})`, icon: FileText },
                                { id: 'journey', label: '진행 현황', icon: TrendingUp },
                                { id: 'consult', label: '변호사 질문', icon: MessageSquare },
                                { id: 'docs', label: '문서 보관함', icon: Download },
                            ] as { id: typeof activeTab; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[]).map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all"
                                    style={activeTab === tab.id ? {
                                        background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#111827',
                                    } : { color: '#9ca3af' }}>
                                    <tab.icon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:block">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {/* ── 이슈 리포트 탭 ── */}
                            {activeTab === 'issues' && (
                                <motion.div key="issues" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <div>
                                        {issues.map((issue, i) => (
                                            <IssueCard key={issue.id} issue={issue} index={i} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── 진행 현황 탭 ── */}
                            {activeTab === 'journey' && (
                                <motion.div key="journey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <Card>
                                        <p className="font-black text-sm mb-5" style={{ color: '#111827' }}>📋 처리 이력</p>
                                        <div className="space-y-3">
                                            {[
                                                { done: true, at: '2026-02-28 09:12', label: '자동 검토 및 분석 완료', sub: `개인정보처리방침 ${issues.length}건 이슈 탐지`, color: '#60a5fa' },
                                                { done: !!company?.assignedLawyer, at: '2026-02-28 09:45', label: `변호사 배정 완료`, sub: `${lawyer.name} 변호사 담당 배정`, color: '#a78bfa' },
                                                { done: company?.lawyerConfirmed, at: company?.lawyerConfirmedAt || '검토 중', label: '변호사 검토 완료', sub: '최종 의견서 + 수정 초안 작성', color: '#4ade80' },
                                                { done: !!company?.emailSentAt, at: company?.emailSentAt || '—', label: '리포트 이메일 발송', sub: `${company?.email || '이메일'}로 발송`, color: '#fbbf24' },
                                                { done: company?.clientReplied, at: company?.clientRepliedAt || '—', label: '고객 답신 확인', sub: company?.clientReplyNote || '답신 대기 중', color: '#f472b6' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex gap-4 items-start">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                                                            style={{ background: item.done ? `${item.color}18` : '#f3f4f6', border: `2px solid ${item.done ? item.color : '#e8e5de'}` }}>
                                                            {item.done ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: item.color }} /> : <Clock className="w-3.5 h-3.5" style={{ color: '#d1d5db' }} />}
                                                        </div>
                                                        {i < 4 && <div className="w-px h-6 mt-1" style={{ background: item.done ? `${item.color}30` : '#f3f4f6' }} />}
                                                    </div>
                                                    <div className="flex-1 pb-3">
                                                        <p className="text-sm font-bold" style={{ color: item.done ? '#111827' : '#d1d5db' }}>{item.label}</p>
                                                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{item.sub}</p>
                                                        <p className="text-[10px] mt-1 font-mono" style={{ color: '#d1d5db' }}>{item.at}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </motion.div>
                            )}

                            {/* ── 변호사 질문 탭 ── */}
                            {activeTab === 'consult' && (
                                <motion.div key="consult" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <Card>
                                        <h3 className="font-black text-base mb-1" style={{ color: '#111827' }}>변호사에게 직접 질문</h3>
                                        <p className="text-xs mb-5" style={{ color: '#9ca3af' }}>담당 변호사가 48시간 내 답변드립니다.</p>
                                        {!isPaid && (
                                            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl"
                                                style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                                                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#c9a84c' }} />
                                                <span className="text-xs" style={{ color: 'rgba(201,168,76,0.8)' }}>
                                                    무료 회원은 질문 1회 제한. 구독 후 무제한 질문 가능.
                                                </span>
                                            </div>
                                        )}
                                        {questionSent ? (
                                            <div className="text-center py-12">
                                                <CheckCircle2 className="w-14 h-14 mx-auto mb-4" style={{ color: '#4ade80' }} />
                                                <p className="font-black text-lg mb-1" style={{ color: '#4ade80' }}>질문 전달 완료</p>
                                                <p className="text-sm" style={{ color: '#6b7280' }}>
                                                    {lawyer.name} 변호사가 48시간 내 이메일로 답변드립니다.
                                                </p>
                                                <button onClick={() => { setQuestionSent(false); setQuestion(''); }}
                                                    className="mt-4 text-xs"
                                                    style={{ color: 'rgba(201,168,76,0.6)' }}>추가 질문하기</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mb-3 space-y-2">
                                                    {['제17조 관련 파트너사 정보 제공 동의 방법을 알고 싶습니다.', '현재 방침 수정 후 기존 가맹점에 재고지가 필요한가요?', '가맹점 계약서 관련 추가 검토를 의뢰하고 싶습니다.'].map(q => (
                                                        <button key={q} onClick={() => setQuestion(q)}
                                                            className="w-full text-left text-xs px-3 py-2 rounded-xl transition-all hover:opacity-80"
                                                            style={{ background: '#fff', border: '1px solid #e8e5de', color: '#6b7280' }}>
                                                            💬 {q}
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea rows={4} placeholder="질문 내용을 입력해주세요..."
                                                    value={question} onChange={e => setQuestion(e.target.value)}
                                                    className="w-full px-3 py-3 rounded-xl text-sm resize-none mb-3"
                                                    style={{ background: '#fff', border: '1px solid #e8e5de', color: '#111827', outline: 'none' }} />
                                                <Button variant="premium" size="md" className="w-full gap-2"
                                                    onClick={() => question && setQuestionSent(true)}>
                                                    <Send className="w-4 h-4" /> 질문 전송
                                                </Button>
                                            </>
                                        )}
                                    </Card>
                                </motion.div>
                            )}

                            {/* ── 문서 보관함 탭 ── */}
                            {activeTab === 'docs' && (
                                <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <Card>
                                        <h3 className="font-black text-base mb-5" style={{ color: '#111827' }}>📁 문서 보관함</h3>
                                        <div className="space-y-2">
                                            {[
                                                { name: '분석 리포트 v1.0.pdf', size: '2.3MB', date: '2026-02-28', available: true },
                                                { name: '변호사 검토 의견서.pdf', size: '1.8MB', date: '2026-02-28', available: company?.lawyerConfirmed },
                                                { name: '개인정보처리방침 수정안.docx', size: '0.5MB', date: '2026-02-28', available: isPaid },
                                                { name: '가맹점 계약서 이슈 리포트.pdf', size: '3.1MB', date: '—', available: false },
                                            ].map((doc, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                                                    style={{ background: '#fff', border: `1px solid ${doc.available ? '#e8e5de' : '#f3f4f6'}` }}>
                                                    <FileText className="w-5 h-5 flex-shrink-0" style={{ color: doc.available ? '#c9a84c' : '#d1d5db' }} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate" style={{ color: doc.available ? '#111827' : '#d1d5db' }}>{doc.name}</p>
                                                        <p className="text-[10px]" style={{ color: '#d1d5db' }}>{doc.size} · {doc.date}</p>
                                                    </div>
                                                    {doc.available ? (
                                                        <button className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                                                            style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
                                                            <Download className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : (
                                                        <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#d1d5db' }} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── 오른쪽 사이드바 ── */}
                    <div className="space-y-4">

                        {/* 빠른 상담 */}
                        <Card>
                            <p className="font-bold text-sm mb-3" style={{ color: '#111827' }}>⚡ 빠른 상담 연결</p>
                            <div className="space-y-2">
                                <a href="tel:025551234" className="flex items-center gap-3 p-3 rounded-xl w-full transition-all hover:opacity-80"
                                    style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                                    <Phone className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                    <div className="text-left">
                                        <p className="text-xs font-bold" style={{ color: '#111827' }}>전화 상담</p>
                                        <p className="text-[10px]" style={{ color: '#9ca3af' }}>02-555-1234 · 평일 9-18시</p>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: 'rgba(201,168,76,0.4)' }} />
                                </a>
                                <a href="https://calendly.com" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-xl w-full transition-all hover:opacity-80"
                                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                    <Video className="w-4 h-4" style={{ color: '#818cf8' }} />
                                    <div className="text-left">
                                        <p className="text-xs font-bold" style={{ color: '#111827' }}>줌 상담 예약</p>
                                        <p className="text-[10px]" style={{ color: '#9ca3af' }}>30분 무료 · 즉시 예약</p>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: 'rgba(99,102,241,0.4)' }} />
                                </a>
                                <button className="flex items-center gap-3 p-3 rounded-xl w-full transition-all hover:opacity-80"
                                    onClick={() => setActiveTab('consult')}
                                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                                    <Mail className="w-4 h-4" style={{ color: '#4ade80' }} />
                                    <div className="text-left">
                                        <p className="text-xs font-bold" style={{ color: '#111827' }}>이메일 질문</p>
                                        <p className="text-[10px]" style={{ color: '#9ca3af' }}>48시간 내 변호사 직접 답변</p>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: 'rgba(34,197,94,0.3)' }} />
                                </button>
                            </div>
                        </Card>

                        {/* 구독 CTA (미결제) */}
                        {!isPaid && (
                            <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.05))', border: '1px solid rgba(201,168,76,0.25)' }}>
                                <Lock className="w-8 h-8 mx-auto mb-2" style={{ color: '#c9a84c' }} />
                                <p className="font-black text-sm mb-1" style={{ color: '#111827' }}>완전 보호 패키지</p>
                                <p className="text-xs mb-1" style={{ color: '#6b7280' }}>이슈 {issues.length - 2}건 추가 열람</p>
                                <p className="text-xs mb-4" style={{ color: 'rgba(248,113,113,0.8)' }}>
                                    미조치 시 과태료 최대<br /><strong className="text-sm">9,000만원</strong>
                                </p>
                                <Link href="/pricing">
                                    <Button variant="premium" size="md" className="w-full gap-2 mb-2">
                                        <CreditCard className="w-4 h-4" /> Standard 구독
                                    </Button>
                                </Link>
                                <p className="text-[10px]" style={{ color: '#d1d5db' }}>월 490,000원~ · 언제든 해지</p>
                            </div>
                        )}

                        {/* 알림 설정 */}
                        <Card>
                            <div className="flex items-center gap-2 mb-3">
                                <Bell className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                <p className="font-bold text-sm" style={{ color: '#111827' }}>알림 설정</p>
                            </div>
                            {[
                                { label: '변호사 검토 완료 시', on: true },
                                { label: '법령 개정 알림', on: true },
                                { label: '월간 리스크 리포트', on: false },
                            ].map((n, i) => (
                                <div key={i} className="flex items-center justify-between py-2"
                                    style={{ borderBottom: i < 2 ? '1px solid #e8e5de' : 'none' }}>
                                    <span className="text-xs" style={{ color: '#6b7280' }}>{n.label}</span>
                                    <div className="w-8 h-4 rounded-full relative cursor-pointer"
                                        style={{ background: n.on ? '#4ade80' : '#e5e7eb' }}>
                                        <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                                            style={{ left: n.on ? '17px' : '2px' }} />
                                    </div>
                                </div>
                            ))}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
