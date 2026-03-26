'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, Plus, X, CheckCircle2, Clock, AlertTriangle,
    ChevronDown, ChevronUp, Calendar, FileText,
    Gavel,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LitigationCase, LitigationDeadline, LitigationStatus } from '@/lib/types';
import { LIT_STATUS_LABEL, LIT_STATUS_COLOR, LAWYERS, LITIGATION_TYPES, COURTS } from '@/lib/constants';
import { store } from '@/lib/store';
import { getAutomationStats, getAiSummary, generateAiMemoSummary } from '@/lib/automationEngine';

// 라이트 테마용 상태 텍스트 색상
import { STATUS_TEXT_MAP, STATUSES, daysUntil } from './constants';
import CloseModal from './components/CloseModal';
import DetailPanel from './components/DetailPanel';
import AddCaseModal from './components/AddCaseModal';
import CaseCard from '@/components/cases/CaseCard';

export default function LitigationPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const [cases, setCases] = useState<LitigationCase[]>([]);
    const [filterStatus, setFilterStatus] = useState<LitigationStatus | 'all'>('all');
    const [showAdd, setShowAdd] = useState(false);

    const refresh = useCallback(() => setCases([...store.getLitAll()]), []);
    useEffect(() => { refresh(); const id = setInterval(refresh, 3000); return () => clearInterval(id); }, [refresh]);

    // 자동화 통계
    const [autoStats, setAutoStats] = useState(getAutomationStats());
    useEffect(() => {
        const id = setInterval(() => setAutoStats(getAutomationStats()), 5000);
        return () => clearInterval(id);
    }, []);

    const filtered = filterStatus === 'all' ? cases : cases.filter(c => c.status === filterStatus);
    const totalClaim = cases.reduce((s, c) => s + c.claimAmount, 0);
    const urgentAll = cases.flatMap(c => c.deadlines.filter(d => !d.completed && daysUntil(d.dueDate) <= 7));
    const counts = STATUSES.reduce((a, s) => ({ ...a, [s]: cases.filter(c => c.status === s).length }), {} as Record<string, number>);

    return (
        <div className={isEmbedded ? "pb-16" : "min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8"} style={{ background: isEmbedded ? 'transparent' : '#f8f9fc' }}>
            <div className="max-w-5xl mx-auto">

                {/* 헤더 */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: '#1e293b' }}>송무팀 사건 관리</h1>
                        <p className="text-sm mt-0.5 font-medium" style={{ color: '#475569' }}>
                            총 {cases.length}건 · 청구금액 합계 {(totalClaim / 100000000).toFixed(1)}억원
                            {urgentAll.length > 0 && <span style={{ color: '#d97706' }}> · ⚠ 긴급 기한 {urgentAll.length}건</span>}
                        </p>
                    </div>
                    <Button variant="premium" size="sm" onClick={() => setShowAdd(true)}>
                        <Plus className="w-4 h-4 mr-1" /> 신규 사건
                    </Button>
                </div>

                {/* 긴급 기한 배너 */}
                {urgentAll.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
                        <div className="rounded-xl p-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4" style={{ color: '#d97706' }} />
                                <span className="text-sm font-black" style={{ color: '#d97706' }}>⚠ 7일 이내 기한 {urgentAll.length}건</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {cases.flatMap(c => c.deadlines
                                    .filter(d => !d.completed && daysUntil(d.dueDate) <= 7)
                                    .map(d => (
                                        <div key={d.id} className="px-3 py-1.5 rounded-lg" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                                            <p className="text-xs font-bold" style={{ color: '#92400e' }}>{c.companyName}</p>
                                            <p className="text-[10px] font-semibold" style={{ color: '#92400e' }}>{d.label} · {d.dueDate}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═══ 자동화 현황 대시보드 ═══ */}
                <div className="mb-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                        { label: '기한 알림', count: autoStats.deadlineAlerts, icon: '🔔', color: '#d97706', bg: '#fffbeb' },
                        { label: '청구서 발행', count: autoStats.billingIssued, icon: '📄', color: '#2563eb', bg: '#eff6ff' },
                        { label: '미납 재촉', count: autoStats.overdueReminders, icon: '⚠️', color: '#dc2626', bg: '#fef2f2' },
                        { label: '만족도 설문', count: autoStats.satisfactionSurveys, icon: '📊', color: '#7c3aed', bg: '#f5f3ff' },
                        { label: 'AI 요약', count: autoStats.aiMemoSummaries, icon: '🤖', color: '#0284c7', bg: '#f0f9ff' },
                    ].map((item, i) => (
                        <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-3 rounded-xl" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>{item.label}</span>
                                <span>{item.icon}</span>
                            </div>
                            <p className="text-lg font-black" style={{ color: item.color }}>{item.count}</p>
                            <p className="text-[10px]" style={{ color: '#94a3b8' }}>자동 처리</p>
                        </motion.div>
                    ))}
                </div>

                {/* 자동화 로그 */}
                {autoStats.recentLogs.length > 0 && (
                    <div className="mb-5 rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8f9fc' }}>
                            <h3 className="text-xs font-black flex items-center gap-1.5" style={{ color: '#1e293b' }}>
                                ⚡ 자동화 처리 이력
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                    style={{ background: '#dcfce7', color: '#16a34a' }}>실시간</span>
                            </h3>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {autoStats.recentLogs.map(log => {
                                const typeInfo: Record<string, { emoji: string; color: string; bg: string }> = {
                                    deadline_alert: { emoji: '🔔', color: '#d97706', bg: '#fffbeb' },
                                    auto_billing: { emoji: '📄', color: '#2563eb', bg: '#eff6ff' },
                                    overdue_reminder: { emoji: '⚠️', color: '#dc2626', bg: '#fef2f2' },
                                    satisfaction_survey: { emoji: '📊', color: '#7c3aed', bg: '#f5f3ff' },
                                    ai_memo_summary: { emoji: '🤖', color: '#0284c7', bg: '#f0f9ff' },
                                };
                                const info = typeInfo[log.type] || { emoji: '⚙️', color: '#64748b', bg: '#f1f5f9' };
                                return (
                                    <div key={log.id} className="flex items-start gap-3 px-4 py-2.5"
                                        style={{ borderBottom: '1px solid #f8f9fc' }}>
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                                            style={{ background: info.bg }}>
                                            {info.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold" style={{ color: '#1e293b' }}>{log.label}</span>
                                                {log.companyName && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                                        style={{ background: '#fffbeb', color: '#b8960a' }}>{log.companyName}</span>
                                                )}
                                                {log.channel && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                                        style={{ background: info.bg, color: info.color }}>{log.channel}</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>{log.detail}</p>
                                        </div>
                                        <span className="text-[10px] flex-shrink-0 whitespace-nowrap" style={{ color: '#cbd5e1' }}>{log.at}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 상태 필터 */}
                <div className="mb-5 flex flex-wrap gap-2">
                    {[{ v: 'all', l: `전체 ${cases.length}` }, ...STATUSES.map(s => ({ v: s, l: `${LIT_STATUS_LABEL[s]} ${counts[s] || 0}` }))].map(item => {
                        const active = filterStatus === item.v;
                        return (
                            <button key={item.v}
                                onClick={() => setFilterStatus(item.v as LitigationStatus | 'all')}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                                style={{
                                    background: active ? '#fffbeb' : '#ffffff',
                                    color: active ? '#b8960a' : '#475569',
                                    border: `1px solid ${active ? '#fde68a' : '#d1d5db'}`,
                                }}>
                                {item.l}
                            </button>
                        );
                    })}
                </div>

                {/* 사건 목록 */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map(lit => (
                            <CaseCard key={lit.id} lit={lit} onUpdate={refresh} />
                        ))}
                    </AnimatePresence>
                    {filtered.length === 0 && (
                        <div className="text-center py-16" style={{ color: '#94a3b8' }}>
                            <Scale className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">등록된 사건이 없습니다</p>
                        </div>
                    )}
                </div>

                {/* 등록 모달 */}
                <AnimatePresence>
                    {showAdd && <AddCaseModal onClose={() => setShowAdd(false)} onAdd={refresh} />}
                </AnimatePresence>
            </div>
        </div>
    );
}
