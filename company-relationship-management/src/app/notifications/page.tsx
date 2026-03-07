'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, CheckCircle2, AlertTriangle, Zap, Users,
    Mail, FileText, Clock, Trash2, Check,
} from 'lucide-react';

const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

interface Notification {
    id: string;
    type: 'lead' | 'status' | 'email' | 'ai' | 'system';
    title: string;
    desc: string;
    time: string;
    read: boolean;
}

const ICON_MAP: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    lead: { icon: Users, color: '#6366f1', bg: '#eef2ff' },
    status: { icon: CheckCircle2, color: '#10b981', bg: '#d1fae5' },
    email: { icon: Mail, color: '#f59e0b', bg: '#fef3c7' },
    ai: { icon: Zap, color: '#8b5cf6', bg: '#f3e8ff' },
    system: { icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
};

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n1', type: 'lead', title: '신규 리드 등록', desc: '(주)BBQ에서 상담 신청이 접수되었습니다', time: '5분 전', read: false },
    { id: 'n2', type: 'ai', title: 'AI 분석 완료', desc: '(주)놀부NBG 개인정보처리방침 분석이 완료되었습니다 (위험 2건)', time: '12분 전', read: false },
    { id: 'n3', type: 'status', title: '상태 변경', desc: '(주)교촌 리드가 "영업컨펌" → "변호사컨펌"으로 변경되었습니다', time: '30분 전', read: false },
    { id: 'n4', type: 'email', title: '드립 이메일 발송', desc: '(주)BHC Day 3 법률 팁 이메일이 성공적으로 발송되었습니다', time: '1시간 전', read: true },
    { id: 'n5', type: 'system', title: '시스템 알림', desc: 'AI API 호출 실패율이 10%를 초과했습니다. 대시보드를 확인해주세요', time: '2시간 전', read: true },
    { id: 'n6', type: 'lead', title: '신규 리드 등록', desc: '(주)파리바게뜨에서 웹사이트를 통해 상담을 요청했습니다', time: '3시간 전', read: true },
    { id: 'n7', type: 'status', title: '계약 체결', desc: '(주)이디야 리드가 "계약 완료" 상태로 전환되었습니다 🎉', time: '5시간 전', read: true },
    { id: 'n8', type: 'ai', title: 'AI 브리핑 생성', desc: '오늘의 AI 브리핑이 준비되었습니다. 3건의 액션 아이템이 있습니다', time: '6시간 전', read: true },
];

type Filter = 'all' | 'unread' | 'lead' | 'ai' | 'email' | 'system';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [filter, setFilter] = useState<Filter>('all');

    const filtered = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'all') return true;
        return n.type === filter;
    });
    const unreadCount = notifications.filter(n => !n.read).length;

    const markRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };
    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };
    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="min-h-screen py-8 px-4" style={{ background: T.bg }}>
            <div className="max-w-3xl mx-auto">

                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: T.heading }}>
                            <Bell className="w-6 h-6" style={{ color: '#f59e0b' }} />
                            알림 센터
                            {unreadCount > 0 && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: '#ef4444', color: '#fff' }}>{unreadCount}</span>
                            )}
                        </h1>
                        <p className="text-sm mt-1" style={{ color: T.muted }}>리드, AI 분석, 이메일 발송 등 주요 이벤트 알림</p>
                    </div>
                    <button onClick={markAllRead}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body }}>
                        <Check className="w-3.5 h-3.5" /> 모두 읽음
                    </button>
                </div>

                {/* 필터 */}
                <div className="flex gap-2 mb-4 flex-wrap">
                    {[
                        { id: 'all', label: '전체' },
                        { id: 'unread', label: `안읽음 (${unreadCount})` },
                        { id: 'lead', label: '리드' },
                        { id: 'ai', label: 'AI' },
                        { id: 'email', label: '이메일' },
                        { id: 'system', label: '시스템' },
                    ].map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id as Filter)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background: filter === f.id ? '#6366f1' : T.card,
                                color: filter === f.id ? '#fff' : T.muted,
                                border: `1px solid ${filter === f.id ? '#6366f1' : T.border}`,
                            }}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* 알림 목록 */}
                <div className="space-y-2">
                    <AnimatePresence>
                        {filtered.map(n => {
                            const meta = ICON_MAP[n.type] ?? ICON_MAP.system;
                            const Icon = meta.icon;
                            return (
                                <motion.div key={n.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100, height: 0 }}
                                    onClick={() => markRead(n.id)}
                                    className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer group transition-colors"
                                    style={{
                                        background: n.read ? T.card : '#fefce8',
                                        border: `1px solid ${n.read ? T.borderSub : '#fde68a'}`,
                                    }}>
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                                        <Icon className="w-4 h-4" style={{ color: meta.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold" style={{ color: T.heading }}>{n.title}</p>
                                            {!n.read && <div className="w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />}
                                        </div>
                                        <p className="text-xs mt-0.5 truncate" style={{ color: T.sub }}>{n.desc}</p>
                                        <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: T.faint }}>
                                            <Clock className="w-3 h-3" /> {n.time}
                                        </p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded transition-opacity"
                                        style={{ color: T.faint }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: T.faint }} />
                            <p className="text-sm" style={{ color: T.muted }}>알림이 없습니다</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
