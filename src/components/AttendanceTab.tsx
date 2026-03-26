// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays, Plus, X, Clock, CheckCircle2, XCircle,
    MapPin, ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ATTENDANCE_TYPES, ATTENDANCE_TYPE_COLOR, ATTENDANCE_STATUS_LABEL } from '@/lib/constants';
import { attendanceStore, type AttendanceRecord, type AttendanceType, type AttendanceStatus } from '@/lib/store';

// ── Apply Modal ──
function ApplyModal({ onClose, onSubmit, initial }: {
    onClose: () => void; onSubmit: (data: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
    initial?: { startDate: string; type?: AttendanceType };
}) {
    const [form, setForm] = useState({
        type: initial?.type ?? '연차' as AttendanceType,
        startDate: initial?.startDate ?? new Date().toISOString().slice(0, 10),
        endDate: initial?.startDate ?? new Date().toISOString().slice(0, 10),
        memo: '',
        destination: '',
    });
    const needsDestination = ['출장', '외출', '법원출석'].includes(form.type);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md rounded-2xl p-6"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-black text-lg" style={{ color: '#1e293b' }}>📋 근태 신청</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" style={{ color: '#94a3b8' }} /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold mb-1.5 block" style={{ color: '#b8960a' }}>유형</label>
                        <div className="flex flex-wrap gap-1.5">
                            {ATTENDANCE_TYPES.map(t => (
                                <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                                    className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                                    style={{
                                        background: form.type === t ? ATTENDANCE_TYPE_COLOR[t] + '20' : '#f1f5f9',
                                        color: form.type === t ? ATTENDANCE_TYPE_COLOR[t] : '#64748b',
                                        border: `1px solid ${form.type === t ? ATTENDANCE_TYPE_COLOR[t] + '60' : '#e2e8f0'}`,
                                    }}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>시작일</label>
                            <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                        </div>
                        <div>
                            <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>종료일</label>
                            <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                        </div>
                    </div>
                    {needsDestination && (
                        <div>
                            <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>🗺️ 행선지</label>
                            <input value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))}
                                placeholder="예: 수원지방법원, 의뢰인 사무실"
                                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>메모</label>
                        <textarea value={form.memo} onChange={e => setForm(p => ({ ...p, memo: e.target.value }))} rows={3}
                            placeholder="상세 사유를 입력하세요..."
                            className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                    </div>
                </div>
                <div className="flex gap-2 mt-5">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#f1f5f9', color: '#64748b' }}>취소</button>
                    <button onClick={() => { onSubmit({ userId: 'lawyer1', userName: '김수현 변호사', type: form.type, startDate: form.startDate, endDate: form.endDate, memo: form.memo, destination: form.destination || undefined, status: 'pending' }); onClose(); }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#c9a84c' }}>신청하기</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Quick Destination ──
function QuickDestModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void }) {
    const today = new Date().toISOString().slice(0, 10);
    const [type, setType] = useState<AttendanceType>('외출');
    const [dest, setDest] = useState('');
    const [memo, setMemo] = useState('');
    const quickTypes: AttendanceType[] = ['외출', '법원출석', '출장'];
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-sm rounded-2xl p-5"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <h3 className="font-black text-base mb-4" style={{ color: '#1e293b' }}>📍 행선지 빠른 등록</h3>
                <div className="flex gap-1.5 mb-3">
                    {quickTypes.map(t => (
                        <button key={t} onClick={() => setType(t)} className="text-xs px-3 py-1.5 rounded-xl font-bold flex-1"
                            style={{ background: type === t ? ATTENDANCE_TYPE_COLOR[t] + '20' : '#f1f5f9', color: type === t ? ATTENDANCE_TYPE_COLOR[t] : '#64748b',
                                border: `1px solid ${type === t ? ATTENDANCE_TYPE_COLOR[t] + '60' : '#e2e8f0'}` }}>{t}</button>
                    ))}
                </div>
                <input value={dest} onChange={e => setDest(e.target.value)} placeholder="행선지 (예: 수원지방법원)"
                    className="w-full px-3 py-2 rounded-lg text-sm mb-3" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="메모 (선택)"
                    className="w-full px-3 py-2 rounded-lg text-sm mb-4" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: '#f1f5f9', color: '#64748b' }}>취소</button>
                    <button onClick={() => { if (!dest.trim()) return; onSubmit({ userId: 'lawyer1', userName: '김수현 변호사', type, startDate: today, endDate: today, memo, destination: dest, status: 'pending' }); onClose(); }}
                        className="flex-1 py-2 rounded-xl text-sm font-bold text-white" style={{ background: dest.trim() ? '#c9a84c' : '#94a3b8' }}>등록</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Main AttendanceTab Component ──
export default function AttendanceTab() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [showApply, setShowApply] = useState(false);
    const [showQuickDest, setShowQuickDest] = useState(false);
    const [calMonth, setCalMonth] = useState(new Date());
    const [applyInitial, setApplyInitial] = useState<{ startDate: string; type?: AttendanceType } | undefined>();

    const refresh = useCallback(() => { setRecords([...attendanceStore.getAll()]); }, []);
    useEffect(() => { refresh(); }, [refresh]);

    // Calendar helpers
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().slice(0, 10);

    const dayRecords = (d: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return records.filter(r => r.startDate <= dateStr && r.endDate >= dateStr);
    };

    const prevMonth = () => setCalMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCalMonth(new Date(year, month + 1, 1));

    const handleSubmit = (data: Omit<AttendanceRecord, 'id' | 'createdAt'>) => { attendanceStore.add(data); refresh(); };

    const pendingCount = records.filter(r => r.status === 'pending').length;
    const thisMonthRecords = records.filter(r => { const d = new Date(r.startDate); return d.getFullYear() === year && d.getMonth() === month; });
    const leaveCount = thisMonthRecords.filter(r => ['연차', '반차(오전)', '반차(오후)'].includes(r.type)).length;
    const outCount = thisMonthRecords.filter(r => ['외출', '법원출석', '출장'].includes(r.type)).length;

    const statusIcon = (s: AttendanceStatus) => s === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
        : s === 'rejected' ? <XCircle className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
        : <Clock className="w-3.5 h-3.5" style={{ color: '#d97706' }} />;
    const statusColor = (s: AttendanceStatus) => s === 'approved' ? '#16a34a' : s === 'rejected' ? '#dc2626' : '#d97706';
    const statusBg = (s: AttendanceStatus) => s === 'approved' ? '#f0fdf4' : s === 'rejected' ? '#fef2f2' : '#fffbeb';

    return (
        <div className="pb-16 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#1e293b' }}>
                        <CalendarDays className="w-6 h-6" style={{ color: '#c9a84c' }} />
                        근태 / 행선지 관리
                    </h1>
                    <p className="text-sm mt-0.5 font-medium" style={{ color: '#475569' }}>
                        대기 {pendingCount}건 · 이달 휴가 {leaveCount}건 · 외근 {outCount}건
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setApplyInitial(undefined); setShowQuickDest(true); }}
                        className="text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5"
                        style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b' }}>
                        <MapPin className="w-3.5 h-3.5" />행선지 등록
                    </button>
                    <Button variant="premium" size="sm" onClick={() => { setApplyInitial(undefined); setShowApply(true); }}>
                        <Plus className="w-4 h-4 mr-1" /> 근태 신청
                    </Button>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                    { label: '대기 중', value: pendingCount, accent: '#d97706', icon: Clock },
                    { label: '이달 휴가', value: leaveCount, accent: '#2563eb', icon: CalendarDays },
                    { label: '이달 외근', value: outCount, accent: '#7c3aed', icon: MapPin },
                    { label: '총 신청', value: records.length, accent: '#16a34a', icon: CheckCircle2 },
                ].map(({ label, value, accent, icon: Icon }) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accent + '18' }}>
                                <Icon className="w-3.5 h-3.5" style={{ color: accent }} /></div>
                            <span className="text-[10px] font-bold uppercase" style={{ color: '#94a3b8' }}>{label}</span>
                        </div>
                        <p className="text-xl font-black" style={{ color: accent }}>{value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Calendar + List layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Calendar */}
                <div className="lg:col-span-3">
                    <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        {/* Month nav */}
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4" style={{ color: '#64748b' }} /></button>
                            <h2 className="text-base font-black" style={{ color: '#1e293b' }}>{year}년 {month + 1}월</h2>
                            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronRight className="w-4 h-4" style={{ color: '#64748b' }} /></button>
                        </div>
                        {/* DOW header */}
                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                                <div key={d} className="text-center text-[10px] font-bold py-1" style={{ color: i === 0 ? '#dc2626' : i === 6 ? '#2563eb' : '#94a3b8' }}>{d}</div>
                            ))}
                        </div>
                        {/* Days grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const d = i + 1;
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                const recs = dayRecords(d);
                                const isToday = dateStr === today;
                                const dayOfWeek = new Date(year, month, d).getDay();
                                return (
                                    <button key={d} onClick={() => { setApplyInitial({ startDate: dateStr }); setShowApply(true); }}
                                        className="relative p-1 rounded-lg text-center transition-all hover:bg-slate-50"
                                        style={{
                                            minHeight: 48,
                                            background: isToday ? '#fffbeb' : 'transparent',
                                            border: isToday ? '1.5px solid #c9a84c' : '1px solid transparent',
                                        }}>
                                        <span className="text-xs font-bold block"
                                            style={{ color: dayOfWeek === 0 ? '#dc2626' : dayOfWeek === 6 ? '#2563eb' : '#1e293b' }}>{d}</span>
                                        <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
                                            {recs.slice(0, 3).map(r => (
                                                <span key={r.id} className="w-1.5 h-1.5 rounded-full" style={{ background: ATTENDANCE_TYPE_COLOR[r.type] }} />
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {/* Legend */}
                        <div className="mt-4 flex flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                            {ATTENDANCE_TYPES.map(t => (
                                <span key={t} className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#64748b' }}>
                                    <span className="w-2 h-2 rounded-full" style={{ background: ATTENDANCE_TYPE_COLOR[t] }} />{t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Records List */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <h3 className="font-black text-sm mb-3" style={{ color: '#1e293b' }}>📋 신청 내역</h3>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {records.map(r => (
                                <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="p-3 rounded-xl transition-all hover:shadow-sm"
                                    style={{ background: statusBg(r.status), border: `1px solid ${statusColor(r.status)}20` }}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: ATTENDANCE_TYPE_COLOR[r.type] + '20', color: ATTENDANCE_TYPE_COLOR[r.type] }}>{r.type}</span>
                                            <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                                style={{ background: statusBg(r.status), color: statusColor(r.status), border: `1px solid ${statusColor(r.status)}30` }}>
                                                {statusIcon(r.status)} {ATTENDANCE_STATUS_LABEL[r.status]}
                                            </span>
                                        </div>
                                        {r.status === 'pending' && (
                                            <button onClick={() => { attendanceStore.remove(r.id); refresh(); }}
                                                className="p-1 rounded hover:bg-white"><X className="w-3 h-3" style={{ color: '#94a3b8' }} /></button>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold" style={{ color: '#1e293b' }}>
                                        {r.startDate === r.endDate ? r.startDate : `${r.startDate} ~ ${r.endDate}`}
                                    </p>
                                    {r.destination && (
                                        <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: '#7c3aed' }}>
                                            <MapPin className="w-2.5 h-2.5" />{r.destination}
                                        </p>
                                    )}
                                    {r.memo && <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>{r.memo}</p>}
                                </motion.div>
                            ))}
                            {records.length === 0 && (
                                <div className="text-center py-8" style={{ color: '#94a3b8' }}>
                                    <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">근태 기록이 없습니다</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showApply && <ApplyModal onClose={() => setShowApply(false)} onSubmit={handleSubmit} initial={applyInitial} />}
            </AnimatePresence>
            <AnimatePresence>
                {showQuickDest && <QuickDestModal onClose={() => setShowQuickDest(false)} onSubmit={handleSubmit} />}
            </AnimatePresence>
        </div>
    );
}
