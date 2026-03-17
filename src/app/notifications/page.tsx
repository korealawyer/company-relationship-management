'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, FileText, CreditCard, MessageSquare, UserCheck,
    CheckCircle2, Clock, AlertTriangle, Shield, Scale,
    ChevronRight, Trash2, Check, Filter, X, Lock,
    ArrowRight, Star,
} from 'lucide-react';
import Link from 'next/link';

/* ── 타입 ───────────────────────────────────────────────── */
type NotiType = 'document' | 'payment' | 'consultation' | 'member' | 'system';
type NotiStatus = 'unread' | 'read';

interface Notification {
    id: string;
    type: NotiType;
    title: string;
    message: string;
    date: string;
    status: NotiStatus;
    href?: string;
    actionLabel?: string;
}

const TYPE_META: Record<NotiType, { icon: React.ElementType; color: string; label: string }> = {
    document: { icon: FileText, color: '#2563eb', label: '문서' },
    payment: { icon: CreditCard, color: '#059669', label: '결제' },
    consultation: { icon: MessageSquare, color: '#7c3aed', label: '상담' },
    member: { icon: UserCheck, color: '#d97706', label: '멤버' },
    system: { icon: Bell, color: '#6b7280', label: '시스템' },
};

/* ── 목업 알림 데이터 ──────────────────────────────────── */
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1', type: 'document', status: 'unread',
        title: '개인정보처리방침 진단 리포트 완료',
        message: '김수현 변호사가 4건의 법적 위험을 발견했습니다. 즉시 확인이 필요합니다.',
        date: '2026.03.16 14:30', href: '/client-portal', actionLabel: '리포트 열람',
    },
    {
        id: 'n2', type: 'payment', status: 'unread',
        title: '3월 구독료 결제 완료',
        message: 'Pro 플랜 월 구독료 2,490,000원이 정상 결제되었습니다.',
        date: '2026.03.15 09:00', href: '/billing', actionLabel: '영수증 확인',
    },
    {
        id: 'n3', type: 'consultation', status: 'unread',
        title: '가맹계약서 검토 답변 도착',
        message: '이지원 변호사가 독소조항 3건에 대한 검토 의견을 제출했습니다.',
        date: '2026.03.14 16:45', href: '/my-documents', actionLabel: '답변 확인',
    },
    {
        id: 'n4', type: 'member', status: 'read',
        title: '소속 가입 신청 1건',
        message: '김가맹점주님이 소속 가입을 신청했습니다. 확인 후 승인해주세요.',
        date: '2026.03.13 11:20', href: '/company-hr', actionLabel: '승인하기',
    },
    {
        id: 'n5', type: 'document', status: 'read',
        title: '취업규칙 검토 완료',
        message: '근로기준법 적합성 검토가 완료되었습니다. 6건의 수정 권고사항이 있습니다.',
        date: '2026.03.10 10:00', href: '/my-documents',
    },
    {
        id: 'n6', type: 'system', status: 'read',
        title: '월간 법무 리포트 발행',
        message: '2월 법무 서비스 이용 현황 리포트가 발행되었습니다.',
        date: '2026.03.01 09:00', href: '/company-hr',
    },
    {
        id: 'n7', type: 'payment', status: 'read',
        title: '결제 수단 만료 예정',
        message: '등록된 신용카드가 다음 달에 만료됩니다. 결제 수단을 업데이트해주세요.',
        date: '2026.02.28 09:00', href: '/billing', actionLabel: '카드 변경',
    },
    {
        id: 'n8', type: 'consultation', status: 'read',
        title: '법률 상담 접수 확인',
        message: '접수번호 IBS-2026-384291 건 상담이 접수되었습니다. 48시간 내 답변 예정입니다.',
        date: '2026.02.25 14:10',
    },
];

/* ── 구독 전 CTA ───────────────────────────────────────── */
function SubscribeCTA() {
    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: '#fff3cd', border: '1px solid #ffeaa7' }}>
                    <Bell className="w-10 h-10" style={{ color: '#c9a84c' }} />
                </div>
                <h1 className="text-2xl font-black mb-3" style={{ color: '#111827' }}>알림 센터</h1>
                <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
                    구독을 시작하면 문서 검토 완료, 변호사 답변, 결제 알림 등<br />
                    중요한 알림을 실시간으로 받을 수 있습니다.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-8">
                    {[
                        { icon: <FileText className="w-4 h-4" />, label: '문서 완료 알림' },
                        { icon: <MessageSquare className="w-4 h-4" />, label: '변호사 답변 알림' },
                        { icon: <CreditCard className="w-4 h-4" />, label: '결제 알림' },
                        { icon: <UserCheck className="w-4 h-4" />, label: '멤버 승인 알림' },
                    ].map(f => (
                        <div key={f.label} className="flex items-center gap-2 p-3 rounded-xl text-xs"
                            style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <span style={{ color: '#c9a84c' }}>{f.icon}</span>
                            <span style={{ color: '#374151' }}>{f.label}</span>
                        </div>
                    ))}
                </div>
                <Link href="/pricing">
                    <button className="px-8 py-3 rounded-xl font-bold text-sm"
                        style={{ background: '#111827', color: '#fff' }}>
                        구독 시작하기 →
                    </button>
                </Link>
            </div>
        </div>
    );
}

/* ── 메인 페이지 ───────────────────────────────────────── */
export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [filterType, setFilterType] = useState<NotiType | 'all'>('all');
    const [isSubscribed] = useState(true); // TODO: 세션에서 구독 상태 가져오기

    if (!isSubscribed) return <SubscribeCTA />;

    const filtered = filterType === 'all' ? notifications : notifications.filter(n => n.type === filterType);
    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    const markRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' as const } : n));
    };
    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));
    };
    const deleteNoti = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-3xl mx-auto px-4">

                {/* 헤더 */}
                <div className="py-8 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Bell className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            <h1 className="text-2xl font-black" style={{ color: '#111827' }}>알림</h1>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                                    style={{ background: '#dc2626', color: '#fff' }}>{unreadCount}</span>
                            )}
                        </div>
                        <p className="text-sm" style={{ color: '#6b7280' }}>문서, 결제, 상담 관련 알림을 확인하세요.</p>
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                            style={{ background: '#fff', color: '#374151', border: '1px solid #e8e5de' }}>
                            <Check className="w-3.5 h-3.5" /> 모두 읽음
                        </button>
                    )}
                </div>

                {/* 필터 */}
                <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
                    <button onClick={() => setFilterType('all')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
                        style={{
                            background: filterType === 'all' ? '#111827' : '#fff',
                            color: filterType === 'all' ? '#fff' : '#6b7280',
                            border: `1px solid ${filterType === 'all' ? '#111827' : '#e8e5de'}`,
                        }}>전체</button>
                    {Object.entries(TYPE_META).map(([key, meta]) => (
                        <button key={key} onClick={() => setFilterType(key as NotiType)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
                            style={{
                                background: filterType === key ? `${meta.color}10` : '#fff',
                                color: filterType === key ? meta.color : '#6b7280',
                                border: `1px solid ${filterType === key ? meta.color + '40' : '#e8e5de'}`,
                            }}>{meta.label}</button>
                    ))}
                </div>

                {/* 알림 리스트 */}
                <div className="space-y-2">
                    <AnimatePresence>
                        {filtered.map((n, i) => {
                            const meta = TYPE_META[n.type];
                            const Icon = meta.icon;
                            return (
                                <motion.div key={n.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="group relative p-4 rounded-2xl transition-all"
                                    style={{
                                        background: n.status === 'unread' ? '#fff' : '#fafaf8',
                                        border: `1px solid ${n.status === 'unread' ? meta.color + '30' : '#e8e5de'}`,
                                        boxShadow: n.status === 'unread' ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                                    }}
                                    onClick={() => markRead(n.id)}
                                >
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: `${meta.color}10` }}>
                                            <Icon className="w-5 h-5" style={{ color: meta.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        {n.status === 'unread' && (
                                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                                                        )}
                                                        <h3 className="font-bold text-sm" style={{ color: '#111827' }}>{n.title}</h3>
                                                    </div>
                                                    <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{n.message}</p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <span className="text-[10px]" style={{ color: '#9ca3af' }}>{n.date.split(' ')[0]}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteNoti(n.id); }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all hover:bg-red-50">
                                                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                                                    </button>
                                                </div>
                                            </div>
                                            {n.actionLabel && n.href && (
                                                <Link href={n.href}>
                                                    <button className="mt-2 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
                                                        style={{ background: `${meta.color}10`, color: meta.color }}>
                                                        {n.actionLabel} <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {filtered.length === 0 && (
                        <div className="text-center py-16 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <Bell className="w-10 h-10 mx-auto mb-3" style={{ color: '#d1d5db' }} />
                            <p className="font-bold text-sm" style={{ color: '#6b7280' }}>알림이 없습니다</p>
                            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>새로운 알림이 오면 여기에 표시됩니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}