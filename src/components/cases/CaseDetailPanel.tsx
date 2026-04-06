'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Gavel, User, Calendar, TrendingUp, MessageSquare, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useDataLayer';

export type CaseStatus = 'active' | 'pending' | 'won' | 'settled' | 'closed';

export interface LawCase {
    id: string;
    caseNumber: string;
    title: string;
    type: string;
    status: CaseStatus;
    court: string;
    judge: string;
    lawyer: string;
    plaintiff: string;
    defendant: string;
    filedDate: string;
    nextDate: string | null;
    nextEvent: string | null;
    amount: string;
    description: string;
    progress: number;
    updates: { date: string; content: string }[];
}

const STATUS_MAP: Record<CaseStatus, { label: string; color: string; bg: string }> = {
    active: { label: '진행 중', color: '#3b82f6', bg: '#eff6ff' },
    pending: { label: '준비 중', color: '#f59e0b', bg: '#fffbeb' },
    won: { label: '승소', color: '#22c55e', bg: '#f0fdf4' },
    settled: { label: '합의', color: '#8b5cf6', bg: '#f5f3ff' },
    closed: { label: '종결', color: '#6b7280', bg: '#f9fafb' },
};

interface CaseDetailPanelProps {
    selectedCase: LawCase | null;
}

export default function CaseDetailPanel({ selectedCase }: CaseDetailPanelProps) {
    const { notifications } = useNotifications();

    // 1. 해당 사건 연관 알림 필터링
    const caseNotifications = React.useMemo(() => {
        if (!selectedCase) return [];
        return notifications.filter(n =>
            n.href?.includes(selectedCase.id) ||
            n.message?.includes(selectedCase.title)
        );
    }, [notifications, selectedCase]);

    // 2. 임박 기일 알림 자동 생성 (7일 이내 기일)
    const upcomingAlerts = React.useMemo(() => {
        if (!selectedCase || !selectedCase.nextDate) return [];
        const today = new Date();
        const nextDt = new Date(selectedCase.nextDate);
        const diffDays = Math.ceil((nextDt.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays >= 0 && diffDays <= 7) {
            return [{
                type: 'urgent_deadline',
                title: `[기일 임박] ${selectedCase.nextEvent} D-${diffDays}`,
                desc: `다음 기일(${selectedCase.nextDate})이 임박했습니다. 담당 변호사와 긴밀히 소통 부탁드립니다.`
            }];
        }
        return [];
    }, [selectedCase]);

    const hasAlerts = caseNotifications.length > 0 || upcomingAlerts.length > 0;

    return (
        <AnimatePresence>
            {selectedCase && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="lg:col-span-3 space-y-4">
                    {/* 사건 상세 */}
                    <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs font-mono mb-1" style={{ color: '#9ca3af' }}>{selectedCase.caseNumber}</p>
                                <h2 className="text-lg font-black" style={{ color: '#111827' }}>{selectedCase.title}</h2>
                            </div>
                            <span className="text-xs font-black px-3 py-1 rounded-full"
                                style={{ background: STATUS_MAP[selectedCase.status].bg, color: STATUS_MAP[selectedCase.status].color }}>
                                {STATUS_MAP[selectedCase.status].label}
                            </span>
                        </div>
                        <p className="text-sm mb-5" style={{ color: '#6b7280' }}>{selectedCase.description}</p>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: MapPin, label: '관할법원', value: selectedCase.court },
                                { icon: Gavel, label: '재판부', value: selectedCase.judge },
                                { icon: User, label: '원고', value: selectedCase.plaintiff },
                                { icon: User, label: '피고', value: selectedCase.defendant },
                                { icon: Calendar, label: '접수일', value: selectedCase.filedDate },
                                { icon: TrendingUp, label: '청구금액', value: selectedCase.amount },
                            ].map(item => (
                                <div key={item.label} className="p-3 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <item.icon className="w-3 h-3" style={{ color: '#9ca3af' }} />
                                        <span className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>{item.label}</span>
                                    </div>
                                    <p className="text-xs font-bold" style={{ color: '#111827' }}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 다음 기일 */}
                    {selectedCase.nextDate && (
                        <div className="p-5 rounded-2xl flex items-center gap-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#fef3c7' }}>
                                <Calendar className="w-5 h-5" style={{ color: '#92400e' }} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold" style={{ color: '#92400e' }}>다음 기일</p>
                                <p className="text-sm font-black" style={{ color: '#111827' }}>{selectedCase.nextDate}</p>
                                <p className="text-xs" style={{ color: '#92400e' }}>{selectedCase.nextEvent}</p>
                            </div>
                        </div>
                    )}

                    {/* 실시간 알림 패널 */}
                    {hasAlerts && (
                        <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <h3 className="font-black text-sm mb-4" style={{ color: '#111827' }}>🔔 자동 진행 알림</h3>
                            <div className="space-y-3">
                                {upcomingAlerts.map((alert, idx) => (
                                    <div key={`alert-${idx}`} className="p-3 rounded-xl border flex items-start gap-3 bg-amber-50 border-amber-100">
                                        <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 mb-0.5">{alert.title}</p>
                                            <p className="text-xs text-amber-700">{alert.desc}</p>
                                        </div>
                                    </div>
                                ))}

                                {caseNotifications.map((n) => (
                                    <div key={n.id} className="p-3 rounded-xl border flex items-start gap-3 bg-blue-50 border-blue-100">
                                        <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                                            <MessageSquare className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 mb-0.5">{n.title}</p>
                                            <p className="text-xs text-gray-600">{n.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 진행 경과 */}
                    <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <h3 className="font-black text-sm mb-4" style={{ color: '#111827' }}>📋 진행 경과</h3>
                        <div className="space-y-4">
                            {selectedCase.updates.map((u, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2.5 h-2.5 rounded-full mt-1.5"
                                            style={{ background: i === 0 ? '#3b82f6' : '#d1d5db' }} />
                                        {i < selectedCase.updates.length - 1 && (
                                            <div className="w-px flex-1 mt-1" style={{ background: '#e5e7eb' }} />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className="text-[10px] font-mono mb-1" style={{ color: '#9ca3af' }}>{u.date}</p>
                                        <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{u.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </motion.div>
            )}
        </AnimatePresence>
    );
}
