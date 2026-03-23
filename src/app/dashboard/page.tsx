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
import { store, Company } from '@/lib/mockStore';
import { useRequireAuth } from '@/lib/AuthContext';
import { getSession } from '@/lib/auth';
import { leadStore } from '@/lib/leadStore';
import { ServiceRequestModal } from '@/components/ServiceRequestModal';


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

const MOCK_ITEMS: ServiceItem[] = [
    {
        id: 's1', type: 'document',
        title: '개인정보처리방침 법률 진단',
        date: '2026.02.28 접수', status: 'reviewing',
        steps: ['접수', '법무 진단', '변호사 검토', '리포트 발송'],
        currentStep: 1, href: '/client-portal',
    },
    {
        id: 's2', type: 'consultation',
        title: '가맹점 계약서 수정 자문',
        date: '2026.03.10 접수', status: 'completed',
        steps: ['접수', '변호사 배정', '검토 완료', '수정본 발송'],
        currentStep: 3, href: '/consultation-history',
    },
    {
        id: 's3', type: 'case',
        title: '가맹점주 손해배상 청구 대응',
        date: '2026.03.15 접수', status: 'reviewing',
        steps: ['사건 접수', '증거 수집', '답변서 작성', '조정·소송'],
        currentStep: 1, href: '/cases', urgent: true,
    },
];

function ServiceProgressPanel() {
    const inProgress = MOCK_ITEMS.filter(i => i.status !== 'completed').length;
    const doneItems  = MOCK_ITEMS.filter(i => i.status === 'completed').length;

    return (
        <Card className="border-none shadow-sm mb-8 overflow-hidden" style={{ background: '#fff' }}>
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
                {MOCK_ITEMS.map((item, idx) => {
                    const tm = TYPE_META[item.type];
                    const sm = STATUS_META[item.status];
                    const Icon = tm.icon;
                    const total = item.steps.length;
                    const pct = Math.round(((item.currentStep + 1) / total) * 100);
                    const stepLabel = `${item.currentStep + 1}/${total}단계 · ${item.steps[item.currentStep]}`;

                    return (
                        <motion.div
                            key={item.id}
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
    { href: '/billing', icon: Coins, label: '결제·구독', desc: '청구서 내역 및 요금제 관리', color: '#c9a84c', badge: null },
    { href: '/company-hr', icon: Users, label: 'HR·가맹점', desc: '임직원 및 가맹점 법무 관리', color: '#f472b6', badge: null },
    { href: '/notifications', icon: Bell, label: '알림 내역', desc: '법무 진행 상황 실시간 알림', color: '#a78bfa', badge: '3' },
    { href: '/settings', icon: Settings, label: '설정', desc: '계정 보안 및 알림 수신 설정', color: '#94a3b8', badge: null },
];

function CalendarWidget({ companyId }: { companyId?: string }) {
    const [events, setEvents] = useState<{ id: string, title: string, date: string, caseName: string, days: number }[]>([]);

    useEffect(() => {
        if (!companyId) return;
        // mockStore.ts에 getLitAll()가 있으므로 접근.
        const cases = (store as any).getLitAll ? (store as any).getLitAll().filter((c: any) => c.companyId === companyId) : [];
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

export default function DashboardPage() {
    const { loading, authorized } = useRequireAuth(['super_admin', 'admin', 'client_hr']);
    const session = typeof window !== 'undefined' ? getSession() : null;
    const [company] = useState<Company | null>(() => {
        const all = store.getAll();
        // 로그인한 사용자의 companyId로 매핑, 없으면 첫 분석 완료 회사
        if (session?.companyId) {
            const match = all.find(c => c.id === session.companyId);
            if (match) return match;
        }
        return all.find(c => c.status !== 'pending' && c.status !== 'crawling') ?? all[0] ?? null;
    });

    const [isRequestModalOpen, setRequestModalOpen] = useState(false);
    const [requestForm, setRequestForm] = useState({ type: 'consultation', title: '', detail: '', urgency: 'normal' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleServiceRequestSubmit = () => {
        if (!requestForm.title.trim()) return alert('제목을 입력해주세요.');
        setIsSubmitting(true);
        
        setTimeout(() => {
            const displayName = session?.companyName || company?.name || '신규 의뢰 업체';
            
            leadStore.add([{
                companyName: displayName,
                domain: company?.url || '',
                privacyUrl: '',
                contactName: (session as any)?.name || company?.contactName || '담당자',
                contactEmail: (session as any)?.email || company?.email || '',
                contactPhone: company?.phone || '',
                storeCount: company?.storeCount || 0,
                bizType: company?.bizType || '',
                riskScore: 0,
                riskLevel: 'LOW',
                issueCount: 0,
                status: 'pending',
                source: 'manual',           
            }]);
            
            const lastLeads = leadStore.getAll();
            const newLead = lastLeads[0]; 
            leadStore.addMemo(newLead.id, {
                author: '클라이언트',
                content: `[신규 의뢰 접수]\n유형: ${requestForm.type}\n제목: ${requestForm.title}\n내용: ${requestForm.detail}\n긴급도: ${requestForm.urgency === 'urgent' ? '긴급' : '보통'}`
            });

            setIsSubmitting(false);
            setRequestModalOpen(false);
            setRequestForm({ type: 'consultation', title: '', detail: '', urgency: 'normal' });
            // Optional: trigger a toast here
        }, 600);
    };

    if (loading || !authorized) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 14, color: '#6b7280' }}>로딩 중...</div>
        </div>
    );

    const isPaid = company?.plan === 'standard' || company?.plan === 'premium';
    const displayName = session?.companyName || company?.name || '(주)놀부NBG';

    return (
        <div className="min-h-screen" style={{ background: '#f8f7f4' }}>
            <div className="max-w-7xl mx-auto px-4 py-10">

                {/* ── 환영 헤더 ── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                <span className="text-sm font-semibold" style={{ color: 'rgba(201,168,76,0.8)' }}>
                                    {company?.biz || '등록된 사업자번호'}
                                </span>
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
                            {!isPaid && (
                                <Link href="/pricing">
                                    <Button variant="outline" size="lg" className="rounded-2xl gap-2 font-bold h-12 px-6 border-gray-300">
                                        <Shield className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                        전방위 법무 보호 구독하기
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── 통합 서비스 진행 현황 ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <ServiceProgressPanel />
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
                            <Card className="p-0 overflow-hidden border-none shadow-sm" style={{ background: '#fff' }}>
                                <div className="divide-y divide-gray-100">
                                    {[
                                        { title: '가맹점 표준 계약서 (2026 개정판) 최종 검토 완료', date: '오늘 오전 10:23', type: '계약서', icon: CheckCircle2, iconColor: '#4ade80' },
                                        { title: '개인정보처리방침 리스크 진단 리포트 (초안)', date: '어제 오후 04:15', type: '리포트', icon: Zap, iconColor: '#f59e0b' },
                                        { title: '월간 법무 동향: 공정위 가맹사업법 단속 강화', date: '3월 20일', type: '뉴스레터', icon: Mail, iconColor: '#6366f1' },
                                    ].map((doc, i) => (
                                        <div key={i} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${doc.iconColor}15` }}>
                                                <doc.icon className="w-5 h-5" style={{ color: doc.iconColor }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate" style={{ color: '#111827' }}>{doc.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                                        {doc.type}
                                                    </span>
                                                    <span className="text-[11px]" style={{ color: '#9ca3af' }}>{doc.date}</span>
                                                </div>
                                            </div>
                                            <Download className="w-4 h-4 flex-shrink-0" style={{ color: '#d1d5db' }} />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* ✨ 우측: 로펌 컨택 및 사이드바 ✨ */}
                    <div className="space-y-6">
                        <CalendarWidget companyId={company?.id} />

                        {/* IBS 로펌 전담 데스크 */}
                        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                            <Card className="border-none shadow-md overflow-hidden relative" style={{ background: '#fff' }}>
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
                                    <Button variant="outline" className="flex-1 gap-1.5 border-gray-200 text-sm font-bold">
                                        <Video className="w-4 h-4" /> 화상 미팅
                                    </Button>
                                    <Button variant="premium" className="flex-1 gap-1.5 shadow-md text-sm font-bold">
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
                                    <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">1</span>
                                </div>
                                <div className="p-3 rounded-xl border border-red-100 bg-red-50 mb-3 flex items-start gap-3">
                                    <div className="mt-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-red-800 mb-1">구독 결제 실패 (재시도 필요)</p>
                                        <p className="text-[10px] text-red-600">등록된 카드의 한도 초과 또는 유효기간 만료가 의심됩니다. 결제 정보를 업데이트해주세요.</p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                                    <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 mb-1">상반기 노무 정기 점검 예약 안내</p>
                                        <p className="text-[10px] text-gray-500">다음 주 중으로 안내 메일이 발송될 예정입니다.</p>
                                    </div>
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

        </div>
    );
}
