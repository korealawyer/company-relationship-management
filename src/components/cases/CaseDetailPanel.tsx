'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Gavel, User, Calendar, TrendingUp } from 'lucide-react';

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

                    {/* ── 담당 변호사 & 자동 진행 알림 ── */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        {/* 변호사 헤더 */}
                        <div className="p-4 flex items-center gap-3" style={{ background: '#111827' }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black tracking-tight"
                                style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#111827' }}>
                                IBS
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-white">IBS 법률사무소</p>
                                <p className="text-[10px]" style={{ color: '#9ca3af' }}>사건 진행 자동 알림 · 02-598-8518</p>
                            </div>
                            <div className="px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ background: 'rgba(34,197,94,0.15)' }}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                                <span className="text-[10px] font-bold" style={{ color: '#22c55e' }}>자동 알림 ON</span>
                            </div>
                        </div>

                        {/* 자동 진행 알림 목록 */}
                        <div className="p-4 space-y-2.5">
                            <p className="text-[10px] font-bold mb-3" style={{ color: '#9ca3af' }}>
                                🔔 최근 자동 알림 (변호사 → 의뢰인)
                            </p>
                            {[
                                { time: '오늘 09:00', type: 'action', icon: '📋',
                                  text: '다음 변론기일(4/8) 준비를 위해 관련 판례 3건을 추가 분석 중입니다.' },
                                { time: '03.15 17:30', type: 'doc', icon: '📎',
                                  text: '상대방 의견서 접수. 검토 후 대응 준비서면 초안을 문서함에 공유드릴 예정입니다.' },
                                { time: '03.12 14:00', type: 'alert', icon: '⚡',
                                  text: '피고 측 답변서 제출 완료. 핵심 쟁점: 경업금지 조항 유효성 — 우리 입장 유리합니다.' },
                                { time: '03.10 10:00', type: 'schedule', icon: '📅',
                                  text: '제3차 변론기일이 2026-04-08로 지정되었습니다. 별도 출석은 불필요합니다.' },
                            ].map((n, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="p-3 rounded-xl flex gap-2.5"
                                    style={{ background: i === 0 ? '#fffbeb' : '#f9fafb', border: `1px solid ${i === 0 ? '#fde68a' : '#f3f4f6'}` }}>
                                    <span className="text-sm mt-0.5">{n.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{n.text}</p>
                                        <p className="text-[9px] mt-1" style={{ color: '#9ca3af' }}>{n.time}</p>
                                    </div>
                                    {i === 0 && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md h-fit flex-shrink-0"
                                            style={{ background: '#fef3c7', color: '#92400e' }}>NEW</span>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* 하단 안내 */}
                        <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #f3f4f6', background: '#fafaf8' }}>
                            <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                                진행 상황이 변경되면 자동으로 알림을 보내드립니다
                            </p>
                            <a href="tel:025551234" className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #e8e5de' }}>
                                📞 긴급 연락
                            </a>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
