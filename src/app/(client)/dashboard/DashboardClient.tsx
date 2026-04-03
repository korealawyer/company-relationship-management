'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Phone, Video, CreditCard, MessageSquare,
    Shield, Download, FileText, Briefcase, FolderOpen,
    Settings, HeartHandshake, LayoutGrid, Coins, Bell, Mail,
    ChevronRight, Zap, Bot, Users, MapPin, ExternalLink,
    Clock, CheckCircle2, AlertCircle, X, ArrowRight, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLitigations, useCompanies, useConsultations } from '@/hooks/useDataLayer';
import dataLayer from '@/lib/dataLayer';

const ServiceRequestModal = dynamic(() => import('@/components/ServiceRequestModal').then(mod => mod.ServiceRequestModal), { ssr: false });
const ZoomScheduleModal = dynamic(() => import('@/components/consultation/ZoomScheduleModal'), { ssr: false });
const PortalTour = dynamic(() => import('@/components/PortalTour').then(mod => mod.PortalTour), { ssr: false });
// ── 비로그인 고객용 포털 소개 페이지 ───────────────────────────
export function ClientPortalLanding() {
    const PORTAL_FEATURES = [
        {
            icon: Zap,
            color: '#c9a84c',
            bg: 'rgba(201,168,76,0.08)',
            title: '서비스 진행 현황 실시간 확인',
            desc: '법률 자문, 문서 검토, 소송 진행 상황을 클릭 한 번으로 확인합니다. 담당 변호사에게 전화하지 않아도 됩니다.',
        },
        {
            icon: FileText,
            color: '#818cf8',
            bg: 'rgba(129,140,248,0.08)',
            title: '문서 보관함 & 전자 서명',
            desc: '계약서, 의견서, 리포트가 모두 클라우드에 안전하게 저장됩니다. 어디서나 찾고, 전자 서명까지 완료하세요.',
        },
        {
            icon: Bot,
            color: '#4ade80',
            bg: 'rgba(74,222,128,0.08)',
            title: '24시간 AI 법률 질의·응답',
            desc: '야간·주말에도 즉시 답변 받을 수 있는 AI 법률 상담 채팅봇. 민감한 내용은 전담 변호사에게 자동 에스컬레이션됩니다.',
        },
        {
            icon: Calendar,
            color: '#fb923c',
            bg: 'rgba(251,146,60,0.08)',
            title: '기일·미팅 캘린더 연동',
            desc: '변론기일, 화상 미팅, 서류 제출 기한을 한눈에 관리하고, iPhone·구글 캘린더와 즉시 동기화합니다.',
        },
        {
            icon: Bell,
            color: '#f472b6',
            bg: 'rgba(244,114,182,0.08)',
            title: '실시간 법무 알림',
            desc: '사건 상태 변경, 서류 업로드, 납부 기한 등 중요한 법무 이벤트를 카카오톡·이메일·앱 푸시로 즉시 받습니다.',
        },
        {
            icon: Coins,
            color: '#60a5fa',
            bg: 'rgba(96,165,250,0.08)',
            title: '청구서 & 구독 관리',
            desc: '서비스 이용 내역, 청구서, 결제 수단을 한 곳에서 투명하게 관리합니다. 세금계산서도 자동으로 발행됩니다.',
        },
    ];

    return (
        <div className="min-h-screen" style={{ background: '#04091a', color: '#f0f4ff' }}>
            {/* 히어로 */}
            <div className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
                {/* 배경 glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
                        style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.2), transparent 70%)' }} />
                </div>

                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                        <Shield className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-black" style={{ color: '#c9a84c' }}>IBS 고객 전용 포털</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
                        법무 관리의 모든 것,<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #e8c87a, #c9a84c)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>한 곳에서</span>
                    </h1>
                    <p className="text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed"
                        style={{ color: 'rgba(240,244,255,0.6)' }}>
                        IBS 클라이언트 포털에서 진행 중인 모든 법률 서비스를 실시간으로 확인하고,<br />
                        서류를 관리하며, 담당 변호사와 직접 소통하세요.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/sign-in">
                            <button className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105"
                                style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c87a)', color: '#0a0e1a', boxShadow: '0 10px 40px rgba(201,168,76,0.3)' }}>
                                <ArrowRight className="w-5 h-5" />
                                로그인하고 포털 입장
                            </button>
                        </Link>
                        <Link href="/service">
                            <button className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-white/10"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#f0f4ff' }}>
                                서비스 소개 보기
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* 기능 소개 그리드 */}
            <div className="max-w-5xl mx-auto px-4 pb-24">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ staggerChildren: 0.1 }}
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-3">포털에서 할 수 있는 모든 것</h2>
                        <p style={{ color: 'rgba(240,244,255,0.4)' }}>구독 기업 전담팀이 모든 법무 이슈를 처리하고, 고객님은 포털에서 실시간 확인할 수 있습니다</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
                        {PORTAL_FEATURES.map(({ icon: Icon, color, bg, title, desc }, i) => (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="p-6 rounded-2xl group hover:-translate-y-1 transition-transform duration-300"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                    style={{ background: bg }}>
                                    <Icon className="w-6 h-6" style={{ color }} />
                                </div>
                                <h3 className="font-black text-base mb-2" style={{ color: '#f0f4ff' }}>{title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.5)' }}>{desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* 로그인 CTA 카드 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-10 rounded-3xl text-center"
                        style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}>
                        <h3 className="text-2xl font-black mb-3">이미 IBS 고객이신가요?</h3>
                        <p className="mb-8" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            담당 변호사가 발급한 초대 코드로 포털에 등록하고 모든 서비스를 이용하세요.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/sign-in">
                                <button className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-base transition-all hover:scale-105"
                                    style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c87a)', color: '#0a0e1a' }}>
                                    <ArrowRight className="w-4 h-4" />
                                    포털 로그인
                                </button>
                            </Link>
                            <a href="tel:025988518"
                                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}>
                                <Phone className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                02-598-8518 문의
                            </a>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

// ── 통합 서비스 진행 현황 ──────────────────────────────────────

type ItemType = 'consultation' | 'document' | 'case';
type ItemStatus = 'received' | 'reviewing' | 'completed' | 'pending_action';

interface ServiceItem {
    id: string;
    type: ItemType;
    title: string;
    date: string;
    status: ItemStatus;
    steps: string[];
    currentStep: number;
    href: string;
    urgent?: boolean;
}

const STATUS_META: Record<ItemStatus, { label: string; color: string; bg: string }> = {
    received:       { label: '접수 완료', color: '#2563eb', bg: '#eff6ff' },
    reviewing:      { label: '검토 중',   color: '#d97706', bg: '#fffbeb' },
    completed:      { label: '처리 완료', color: '#16a34a', bg: '#f0fdf4' },
    pending_action: { label: '조치 필요', color: '#dc2626', bg: '#fef2f2' },
};

const TYPE_META: Record<ItemType, { label: string; color: string; gradFrom: string; gradTo: string; icon: React.ElementType }> = {
    consultation: { label: '법률 자문', color: '#1e4fac', gradFrom: '#1e4fac', gradTo: '#3b82f6', icon: HeartHandshake },
    document:     { label: '문서 검토', color: '#7c3aed', gradFrom: '#7c3aed', gradTo: '#a78bfa', icon: FileText },
    case:         { label: '사건 관리', color: '#c2410c', gradFrom: '#c2410c', gradTo: '#fb923c', icon: Briefcase },
};

// Hooks already imported at top of file

function ServiceProgressPanel({ companyId }: { companyId?: string }) {
    const { litigations, isLoading: isLitLoading } = useLitigations();
    const { consultations, isLoading: isConLoading } = useConsultations();

    const items = React.useMemo(() => {
        if (!companyId || isLitLoading || isConLoading) return [];
        
        const myLitigations = (litigations || []).filter((l: any) => l.companyId === companyId);
        const myConsultations = (consultations || []).filter((c: any) => c.companyId === companyId);

        // Convert to ServiceItem
        const lits: ServiceItem[] = myLitigations.map((l: any) => ({
            id: l.id,
            type: 'case',
            title: l.caseName || `${l.opponent} 관련 소송`,
            date: new Date(l.createdAt).toLocaleDateString() + ' 접수',
            status: l.status === 'completed' ? 'completed' : 'reviewing',
            steps: ['사건 접수', '증거 수집', '답변서 작성', '조정·소송'],
            currentStep: l.status === 'completed' ? 3 : 1,
            href: `/cases/${l.id}`,
            urgent: false
        }));

        const cons: ServiceItem[] = myConsultations.map((c: any) => ({
             id: c.id,
             type: c.category === 'contract' ? 'document' : 'consultation',
             title: c.title,
             date: new Date(c.createdAt).toLocaleDateString() + ' 접수',
             status: c.status === 'completed' ? 'completed' : (c.status === 'in_progress' ? 'reviewing' : 'received'),
             steps: ['접수', '변호사 배정', '검토 중', '답변 완료'],
             currentStep: c.status === 'completed' ? 3 : (c.status === 'in_progress' ? 2 : 0),
             href: `/consultation-history`
        }));

        return [...lits, ...cons].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    }, [companyId, litigations, consultations, isLitLoading, isConLoading]);

    const inProgress = items.filter(i => i.status !== 'completed').length;
    const doneItems  = items.filter(i => i.status === 'completed').length;

    return (
        <Card id="tour-summary" className="border-none shadow-sm mb-8 overflow-hidden" style={{ background: '#fff' }}>
            {/* 헤더 */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={16} color="#c9a84c" />
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>서비스 진행 현황</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#d97706', fontWeight: 700, background: '#fffbeb', padding: '2px 10px', borderRadius: 20, border: '1px solid #fcd34d' }}>
                        진행 중 {inProgress}건
                    </span>
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, background: '#f0fdf4', padding: '2px 10px', borderRadius: 20, border: '1px solid #86efac' }}>
                        완료 {doneItems}건
                    </span>
                </div>
            </div>

            {/* 게이지 카드 목록 */}
            <div style={{ padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-sm text-gray-500">진행 중인 진행 현황이 없습니다.</p>
                    </div>
                ) : items.map((item, idx) => {
                    const tm = TYPE_META[item.type];
                    const sm = STATUS_META[item.status];
                    const Icon = tm.icon;
                    const total = item.steps.length;
                    const pct = Math.round(((item.currentStep + 1) / total) * 100);
                    const stepLabel = `${item.currentStep + 1}/${total}단계 · ${item.steps[item.currentStep]}`;

                    return (
                        <motion.div
                            key={item.id}
                            id={idx === 0 ? "tour-timeline" : undefined}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.07 }}
                        >
                            <Link href={item.href}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '14px 16px', borderRadius: 14,
                                    border: '1px solid #f3f4f6',
                                    background: '#fafafa',
                                    cursor: 'pointer',
                                    transition: 'box-shadow 0.2s, border-color 0.2s',
                                }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)';
                                        (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                        (e.currentTarget as HTMLElement).style.borderColor = '#f3f4f6';
                                    }}
                                >
                                    {/* 아이콘 */}
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: `linear-gradient(135deg, ${tm.gradFrom}, ${tm.gradTo})`,
                                    }}>
                                        <Icon size={18} color="#fff" />
                                    </div>

                                    {/* 본문 */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* 제목 행 */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: tm.color, background: `${tm.gradFrom}12`, padding: '1px 7px', borderRadius: 4 }}>{tm.label}</span>
                                            {item.urgent && <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '1px 6px', borderRadius: 4, border: '1px solid #fecaca' }}>⚡ 긴급</span>}
                                            <span style={{ fontSize: 10, fontWeight: 700, color: sm.color, background: sm.bg, padding: '1px 7px', borderRadius: 4, marginLeft: 'auto' }}>{sm.label}</span>
                                        </div>

                                        {/* 제목 */}
                                        <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>

                                        {/* 게이지 바 */}
                                        <div style={{ height: 6, borderRadius: 99, background: '#e5e7eb', marginBottom: 5, overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 + 0.2 }}
                                                style={{
                                                    height: '100%', borderRadius: 99,
                                                    background: item.status === 'completed'
                                                        ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                                                        : `linear-gradient(90deg, ${tm.gradFrom}, ${tm.gradTo})`,
                                                }}
                                            />
                                        </div>

                                        {/* 하단 메타 */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{stepLabel}</span>
                                            <span style={{ fontSize: 10, color: '#9ca3af' }}>{item.date}</span>
                                        </div>
                                    </div>

                                    {/* 퍼센트 + 화살표 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: 4 }}>
                                        <span style={{ fontSize: 16, fontWeight: 900, color: item.status === 'completed' ? '#16a34a' : tm.color }}>{pct}%</span>
                                        <ChevronRight size={13} color="#d1d5db" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </Card>
    );
}

// ── 서비스 퀵 링크 ─────────────────────────────────────────────
const SERVICE_LINKS = [
    { href: '/consultation', icon: HeartHandshake, label: '법률 상담', desc: '분야별 전문 변호사 상담 요청', color: '#818cf8', badge: null },
    { href: '/chat', icon: Bot, label: '24시간 법률 상담', desc: '24시간 무제한 법률 질의·응답', color: '#4ade80', badge: 'NEW' },
    { href: '/cases', icon: Briefcase, label: '사건 관리', desc: '진행 중인 모든 사건 현황', color: '#fb923c', badge: null },
    { href: '/documents', icon: FolderOpen, label: '문서 보관함', desc: '계약서·의견서·리포트 관리', color: '#60a5fa', badge: null },
    { href: '/company-hr', icon: Users, label: 'HR·가맹점', desc: '임직원 및 가맹점 법무 관리', color: '#f472b6', badge: null },
    { href: '/settings', icon: Settings, label: '설정', desc: '계정 보안 및 알림 수신 설정', color: '#94a3b8', badge: null },
];

function CalendarWidget({ companyId }: { companyId?: string }) {
    const { litigations } = useLitigations();
    const [events, setEvents] = useState<{ id: string, title: string, date: string, caseName: string, days: number }[]>([]);

    useEffect(() => {
        if (!companyId || !litigations) return;
        const cases = litigations.filter((c: any) => c.companyId === companyId);
        const allDeadlines = cases.flatMap((c: any) => 
            (c.deadlines || []).filter((d: any) => !d.completed).map((d: any) => ({
                id: d.id,
                title: d.label,
                date: d.dueDate,
                caseName: c.opponent,
                days: Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000)
            }))
        );
        allDeadlines.sort((a: any, b: any) => a.days - b.days);
        setEvents(allDeadlines.slice(0, 5)); // 최대 5개 노출
    }, [companyId]);

    const downloadICS = (e: React.MouseEvent, ev: any) => {
        e.stopPropagation();
        const dateObj = new Date(ev.date);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}${mm}${dd}`;
        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//IBS Law Firm//NONSGML v1.0//EN\nBEGIN:VEVENT\nUID:${new Date().getTime()}@ibslaw.kr\nDTSTAMP:${dateStr}T000000Z\nDTSTART;VALUE=DATE:${dateStr}\nSUMMARY:[IBS법무법인] ${ev.caseName} - ${ev.title}\nDESCRIPTION:사건명: ${ev.caseName}\\n일정: ${ev.title}\\n\\nIBS 법률사무소 클라이언트 포털에서 동기화됨.\nEND:VEVENT\nEND:VCALENDAR`;
        
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `IBS_${ev.title}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (events.length === 0) return null;

    return (
        <Card className="p-5 border-none shadow-md mb-6" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-[15px] flex items-center gap-2" style={{ color: '#111827' }}>
                    <Calendar className="w-4 h-4" style={{ color: '#c9a84c' }} />
                    다가오는 기일/미팅
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>
                    {events.length}건
                </span>
            </div>
            <div className="space-y-3">
                {events.map(ev => (
                    <div key={ev.id} className="p-3 rounded-xl flex items-center justify-between group" style={{ background: '#f8f9fc', border: '1px solid #f1f5f9' }}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${ev.days <= 7 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {ev.days < 0 ? `D+${Math.abs(ev.days)}` : ev.days === 0 ? 'D-Day' : `D-${ev.days}`}
                                </span>
                                <p className="text-xs font-bold" style={{ color: '#111827' }}>{ev.date}</p>
                            </div>
                            <p className="text-sm font-bold truncate" style={{ color: '#374151' }}>{ev.title}</p>
                            <p className="text-[10px] truncate w-40 mt-0.5" style={{ color: '#9ca3af' }}>vs {ev.caseName}</p>
                        </div>
                        <button onClick={(e) => downloadICS(e, ev)} className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-50 flex items-center gap-1.5" title="캘린더에 추가 (.ics)">
                            <Download className="w-3.5 h-3.5" style={{ color: '#4b5563' }} />
                        </button>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function RecentDocumentsWidget({ companyId }: { companyId?: string }) {
    const { consultations } = useConsultations();
    
    const recentDocs = React.useMemo(() => {
        if (!companyId || !consultations) return [];
        const myDocs = consultations
            .filter((c: any) => c.companyId === companyId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
            
        if (myDocs.length === 0) return [];

        return myDocs.map((doc: any) => {
            const isCompleted = doc.status === 'completed';
            return {
                title: doc.title,
                date: new Date(doc.createdAt).toLocaleDateString(),
                type: doc.category === 'contract' ? '계약서' : (doc.category === 'legal_advice' ? '의견서' : '자문'),
                icon: isCompleted ? CheckCircle2 : (doc.category === 'contract' ? FileText : Zap),
                iconColor: isCompleted ? '#4ade80' : (doc.category === 'contract' ? '#60a5fa' : '#f59e0b'),
                href: '/consultation-history'
            };
        });
    }, [companyId, consultations]);

    if (recentDocs.length === 0) {
        return (
            <Card className="p-0 overflow-hidden border-none shadow-sm" style={{ background: '#fff' }}>
                <div className="p-6 text-center">
                    <p className="text-sm text-gray-500">최근 업데이트된 문서가 없습니다.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-0 overflow-hidden border-none shadow-sm" style={{ background: '#fff' }}>
            <div className="divide-y divide-gray-100">
                {recentDocs.map((doc, i) => (
                    <Link key={i} href={doc.href}>
                        <div className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${doc.iconColor}15` }}>
                                <doc.icon className="w-5 h-5" style={{ color: doc.iconColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate group-hover:text-blue-600 transition-colors" style={{ color: '#111827' }}>{doc.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                        {doc.type}
                                    </span>
                                    <span className="text-[11px]" style={{ color: '#9ca3af' }}>{doc.date}</span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#9ca3af' }} />
                        </div>
                    </Link>
                ))}
            </div>
        </Card>
    );
}

function PrivacyReportWidget({ company }: { company: any }) {
    if (!company) return null;

    // Use riskLevel if present, otherwise default based on whether issues exist
    const hasAnalysis = company.issues && company.issues.length > 0;
    const effectiveRiskLevel = company.riskLevel || (hasAnalysis ? 'MEDIUM' : 'LOW');
    const issueCount = company.issues ? company.issues.length : 0;

    const riskColor = effectiveRiskLevel === 'HIGH' ? '#f87171' : effectiveRiskLevel === 'MEDIUM' ? '#fb923c' : '#4ade80';
    const riskBg = effectiveRiskLevel === 'HIGH' ? '#fef2f2' : effectiveRiskLevel === 'MEDIUM' ? '#fffbeb' : '#f0fdf4';
    const riskLabel = effectiveRiskLevel === 'HIGH' ? '고위험' : effectiveRiskLevel === 'MEDIUM' ? '주의' : '양호';

    return (
        <Card className="p-5 border-none shadow-md mb-6" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-[15px] flex items-center gap-2" style={{ color: '#111827' }}>
                    <Shield className="w-4 h-4" style={{ color: riskColor }} />
                    법률 검토 리포트
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: riskBg, color: riskColor }}>
                    {riskLabel}
                </span>
            </div>
            <div className="space-y-3">
                <div className="p-4 rounded-xl" style={{ background: '#f8f9fc', border: '1px solid #f1f5f9' }}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500">발견된 보안·법률 리스크</span>
                        <span className="text-sm font-black text-gray-900">{issueCount}건</span>
                    </div>
                    {/* 이슈 요약 */}
                    {hasAnalysis ? (
                        <div className="space-y-2 mt-3">
                            {company.issues.slice(0, 2).map((issue: any, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: issue.level === 'HIGH' ? '#f87171' : (issue.level === 'MEDIUM' ? '#fb923c' : '#4ade80') }} />
                                    <span className="text-xs font-medium text-gray-700 truncate">{issue.title}</span>
                                </div>
                            ))}
                            {issueCount > 2 && (
                                <p className="text-[10px] text-gray-400 text-center mt-2">+ {issueCount - 2}건의 이슈가 더 있습니다.</p>
                            )}
                        </div>
                    ) : (
                        <div className="mt-3 text-center py-2">
                            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-500" />
                            <p className="text-xs text-gray-500">발견된 주요 취약점이 없습니다.</p>
                        </div>
                    )}
                </div>
                <Link href={`/privacy-analysis`}>
                    <Button variant="outline" className="w-full gap-2 text-xs font-bold mt-2">
                        상세 분석 결과 보기 <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                </Link>
            </div>
        </Card>
    );
}

export function DashboardClient({ initialUser, initialCompany }: { initialUser: any, initialCompany: any }) {
    const session = initialUser;
    
    // 회사 데이터를 SWR로 백업
    const { companies } = useCompanies();
    
    // 서버에서 넘겨준 초기 initialCompany를 최우선으로, 없으면 SWR 사용
    const [company, setCompany] = useState<any | null>(null);
    
    useEffect(() => {
        if (initialCompany) {
            setCompany(initialCompany);
        } else if (session?.companyId && companies?.length) {
            const match = companies.find((c: any) => c.id === session.companyId);
            if (match) setCompany(match);
            else setCompany(null);
        }
    }, [initialCompany, session?.companyId, companies]);

    const [isRequestModalOpen, setRequestModalOpen] = useState(false);
    const [requestForm, setRequestForm] = useState({ type: 'consultation', title: '', detail: '', urgency: 'normal' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isZoomModalOpen, setZoomModalOpen] = useState(false);
    const [isInquiryModalOpen, setInquiryModalOpen] = useState(false);

    const handleServiceRequestSubmit = async () => {
        if (!requestForm.title.trim()) return alert('제목을 입력해주세요.');
        setIsSubmitting(true);
        
        const displayName = session?.companyName || company?.name || '신규 의뢰 업체';
        
        await dataLayer.consult.create({
            companyId: session?.companyId || 'new-id',
            companyName: displayName,
            branchName: '본점',
            authorName: session?.name || '담당자',
            authorRole: '임직원',
            category: requestForm.type as any,
            title: requestForm.title,
            body: requestForm.detail,
            urgency: requestForm.urgency as any
        });

        setIsSubmitting(false);
        setRequestModalOpen(false);
        setRequestForm({ type: 'consultation', title: '', detail: '', urgency: 'normal' });
    };

    // 비로그인 고객 처리는 이제 상위 Server Component에서 담당합니다.

    const isPaid = company?.plan === 'standard' || company?.plan === 'premium';
    const displayName = session?.companyName || company?.name || '고객';

    return (
        <div className="min-h-screen" style={{ background: '#f8f7f4' }}>
            <PortalTour />
            <div className="max-w-7xl mx-auto px-4 py-10">

                {/* ── 환영 헤더 ── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            {company?.biz && (
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2 className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'rgba(201,168,76,0.8)' }}>
                                        {company.biz}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] px-2.5 py-1 rounded-full font-black tracking-wide"
                                    style={{ background: isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.12)', color: isPaid ? '#4ade80' : '#f87171' }}>
                                    {isPaid ? '✅ VIP 구독 활성' : 'FREE 플랜'}
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ color: '#111827', letterSpacing: '-0.02em' }}>
                                {displayName} 담당자님,<br />
                                환영합니다!
                            </h1>
                            <p className="text-base" style={{ color: '#6b7280' }}>
                                IBS 법률사무소와 함께 비즈니스를 더욱 안전하게 보호하세요.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                                onClick={() => setRequestModalOpen(true)}
                                variant="premium" 
                                size="lg" 
                                className="rounded-2xl gap-2 font-black shadow-lg hover:shadow-xl transition-all h-12 px-6" 
                                style={{ background: 'linear-gradient(135deg, #111827, #374151)' }}>
                                <Zap className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                새 법률 서비스 의뢰하기
                            </Button>
                            <Link href="/company-hr">
                                <Button variant="outline" size="lg" className="rounded-2xl gap-2 font-bold h-12 px-6 border-gray-300">
                                    <Users className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                    임직원·가맹점 멤버 관리
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* ── 통합 서비스 진행 현황 ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <ServiceProgressPanel companyId={company?.id} />
                </motion.div>

                {/* ── 메인 레이아웃 ── */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* ✨ 좌측: 서비스 허브 (메인) ✨ */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <LayoutGrid className="w-5 h-5" style={{ color: '#111827' }} />
                                <h2 className="font-black text-lg" style={{ color: '#111827' }}>서비스 데스크</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {SERVICE_LINKS.map((item, idx) => (
                                    <Link key={item.href} href={item.href}>
                                        <motion.div 
                                            initial={{ opacity: 0, y: 16 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            transition={{ delay: idx * 0.05 }}
                                            whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.06)' }}
                                            className="relative p-5 rounded-2xl cursor-pointer transition-all h-full bg-white flex flex-col items-center text-center"
                                            style={{ border: '1px solid #e8e5de' }}
                                        >
                                            {item.badge && (
                                                <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm"
                                                    style={{
                                                        background: item.badge === 'NEW' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.12)',
                                                        color: item.badge === 'NEW' ? '#16a34a' : '#ef4444',
                                                    }}>
                                                    {item.badge}
                                                </span>
                                            )}
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors"
                                                style={{ background: `${item.color}15` }}>
                                                <item.icon className="w-7 h-7" style={{ color: item.color }} />
                                            </div>
                                            <h3 className="text-sm font-black mb-1.5" style={{ color: '#111827' }}>{item.label}</h3>
                                            <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>{item.desc}</p>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* 최근 문서 / 진행중인 업무 요약 (간단한 To-Do 형태) */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" style={{ color: '#111827' }} />
                                    <h2 className="font-black text-lg" style={{ color: '#111827' }}>최근 업데이트 문서</h2>
                                </div>
                                <button className="text-xs font-bold transition-colors hover:opacity-70" style={{ color: '#c9a84c' }}>
                                    문서 보관함 가기 →
                                </button>
                            </div>
                            <RecentDocumentsWidget companyId={company?.id} />
                        </div>
                    </div>

                    {/* ✨ 우측: 로펌 컨택 및 사이드바 ✨ */}
                    <div className="space-y-6">
                        <PrivacyReportWidget company={company} />
                        <CalendarWidget companyId={company?.id} />

                        {/* IBS 로펌 전담 데스크 */}
                        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                            <Card id="tour-team" className="border-none shadow-md overflow-hidden relative" style={{ background: '#fff' }}>
                                {/* 상단 황금색 그라데이션 포인트 */}
                                <div className="h-1.5 w-full absolute top-0 left-0" style={{ background: 'linear-gradient(90deg, #e8c87a, #c9a84c)' }} />

                                {/* 헤더: 심볼 없이 텍스트만 */}
                                <div className="px-6 pt-7 pb-4 border-b border-gray-100">
                                    <h3 className="font-black text-xl mb-0.5" style={{ color: '#111827' }}>IBS 법률사무소</h3>
                                    <p className="text-xs font-semibold" style={{ color: '#c9a84c' }}>한국 1위 프랜차이즈 전문 로펌</p>
                                </div>

                                <div className="p-5 space-y-4">
                                    {/* 전화 */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#f3f4f6' }}>
                                            <Phone className="w-4 h-4" style={{ color: '#6b7280' }} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold mb-0.5" style={{ color: '#111827' }}>기업 법무 전담 직통번호</p>
                                            <a href="tel:02-598-8518" className="text-lg font-black hover:opacity-80 transition-opacity" style={{ color: '#c9a84c' }}>
                                                02-598-8518
                                            </a>
                                            <p className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>평일 09:00 - 18:00 (점심시간 12:00-13:00)</p>
                                        </div>
                                    </div>

                                    {/* 이메일 */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#f3f4f6' }}>
                                            <Mail className="w-4 h-4" style={{ color: '#6b7280' }} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold mb-0.5" style={{ color: '#111827' }}>전용 이메일 접수</p>
                                            <a href="mailto:info@ibslaw.co.kr" className="text-sm font-medium hover:underline" style={{ color: '#4b5563' }}>
                                                info@ibslaw.co.kr
                                            </a>
                                            <p className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>24시간 접수 가능 (영업일 기준 4시간 내 회신)</p>
                                        </div>
                                    </div>

                                    {/* 주소 — 강조 블록 */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#f3f4f6' }}>
                                            <MapPin className="w-4 h-4" style={{ color: '#6b7280' }} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold mb-2" style={{ color: '#111827' }}>본사</p>
                                            <div className="rounded-xl overflow-hidden border border-gray-100 divide-y divide-gray-100">
                                                <div className="px-3 py-2.5" style={{ background: '#fafaf9' }}>
                                                    <p className="text-xs font-bold leading-tight" style={{ color: '#111827' }}>서울시 서초구 서초대로 272</p>
                                                    <p className="text-xs font-bold leading-tight" style={{ color: '#111827' }}>IBS빌딩</p>
                                                </div>
                                                <div className="px-3 py-2.5" style={{ background: '#fafaf9' }}>
                                                    <p className="text-xs font-bold leading-tight" style={{ color: '#111827' }}>서울시 서초구 서초대로 270</p>
                                                    <p className="text-xs font-bold leading-tight" style={{ color: '#111827' }}>IBS법률상담센터</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 하단 버튼 — 균형 있게 */}
                                <div className="px-5 pb-5 flex gap-2">
                                    <Button variant="outline" className="flex-1 gap-1.5 border-gray-200 text-sm font-bold" onClick={() => setZoomModalOpen(true)}>
                                        <Video className="w-4 h-4" /> 화상 미팅
                                    </Button>
                                    <Button variant="premium" className="flex-1 gap-1.5 shadow-md text-sm font-bold" onClick={() => setInquiryModalOpen(true)}>
                                        <MessageSquare className="w-4 h-4" /> 1:1 문의
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>

                        {/* 리마인더 알림 */}
                        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                            <Card className="border-none shadow-sm" style={{ background: '#fff' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4" style={{ color: '#111827' }} />
                                        <h3 className="font-bold text-sm" style={{ color: '#111827' }}>중요 알림</h3>
                                    </div>
                                    <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-full">0</span>
                                </div>
                                <div className="py-6 text-center">
                                    <p className="text-sm text-gray-500">새로운 알림이 없습니다.</p>
                                </div>
                            </Card>
                        </motion.div>

                    </div>
                </div>

            </div>

            {/* ── 새 법률 서비스 의뢰 모달 ── */}
            <ServiceRequestModal 
                isOpen={isRequestModalOpen} 
                onClose={() => setRequestModalOpen(false)} 
                defaultType="general" 
            />

            {/* ── 화상 미팅 예약 모달 ── */}
            <ZoomScheduleModal isOpen={isZoomModalOpen} onClose={() => setZoomModalOpen(false)} />

            {/* ── 1:1 문의 모달 ── */}
            <AnimatePresence>
                {isInquiryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setInquiryModalOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #c9a84c, #e8c87a)' }} />
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="text-lg font-black" style={{ color: '#111827' }}>1:1 문의</h3>
                                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>편한 방법으로 문의하세요</p>
                                    </div>
                                    <button onClick={() => setInquiryModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                        <X className="w-5 h-5" style={{ color: '#6b7280' }} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <a
                                        href="mailto:info@ibslaw.co.kr"
                                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-yellow-300 hover:bg-yellow-50 transition-all group"
                                    >
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
                                            <Mail className="w-5 h-5" style={{ color: '#6366f1' }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black" style={{ color: '#111827' }}>이메일 문의</p>
                                            <p className="text-xs" style={{ color: '#9ca3af' }}>info@ibslaw.co.kr · 4시간 내 회신</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#c9a84c' }} />
                                    </a>

                                    <a
                                        href="tel:025988518"
                                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-yellow-300 hover:bg-yellow-50 transition-all group"
                                    >
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.1)' }}>
                                            <Phone className="w-5 h-5" style={{ color: '#c9a84c' }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black" style={{ color: '#111827' }}>전화 문의</p>
                                            <p className="text-xs" style={{ color: '#9ca3af' }}>02-598-8518 · 평일 09:00–18:00</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#c9a84c' }} />
                                    </a>

                                    <button
                                        onClick={() => { setInquiryModalOpen(false); setRequestModalOpen(true); }}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-yellow-300 hover:bg-yellow-50 transition-all group text-left"
                                    >
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(74,222,128,0.1)' }}>
                                            <MessageSquare className="w-5 h-5" style={{ color: '#16a34a' }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black" style={{ color: '#111827' }}>온라인 의뢰 접수</p>
                                            <p className="text-xs" style={{ color: '#9ca3af' }}>상담 내용 작성 후 제출</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#c9a84c' }} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
