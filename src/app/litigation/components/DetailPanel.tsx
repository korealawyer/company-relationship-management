// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Clock, AlertTriangle, Calendar, Archive, RotateCcw } from 'lucide-react';
import { store, LitigationCase, LitigationDeadline, LIT_STATUS_COLOR, LIT_STATUS_LABEL } from '@/lib/mockStore';
import { getAiSummary, generateAiMemoSummary } from '@/lib/automationEngine';

import CloseModal from './CloseModal';
import { STATUS_TEXT_MAP, STATUSES, daysUntil } from '../constants';

export default function DetailPanel({ lit, onClose, onUpdate }: { lit: LitigationCase; onClose: () => void; onUpdate: () => void }) {
    const [editNote, setEditNote] = useState(lit.notes);
    const [editResult, setEditResult] = useState(lit.result);
    const [editResultNote, setEditResultNote] = useState(lit.resultNote);
    const [saving, setSaving] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);

    const saveNotes = () => {
        setSaving(true);
        store.updateLit(lit.id, { notes: editNote, result: editResult as LitigationCase['result'], resultNote: editResultNote });
        if (editNote.trim()) generateAiMemoSummary(lit.id, editNote);
        setTimeout(() => { setSaving(false); onUpdate(); }, 400);
    };
    const toggleDeadline = (d: LitigationDeadline) => {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        store.updateDeadline(lit.id, d.id, { completed: !d.completed, completedAt: !d.completed ? now : '' });
        onUpdate();
    };

    return (
        <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={onClose} />
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[520px] overflow-y-auto"
            style={{ background: '#ffffff', boxShadow: '-8px 0 30px rgba(0,0,0,0.1)' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
                style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#f1f5f9', color: '#64748b' }}>{lit.caseNo}</span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ background: LIT_STATUS_COLOR[lit.status], color: STATUS_TEXT_MAP[lit.status] }}>
                            {LIT_STATUS_LABEL[lit.status]}
                        </span>
                    </div>
                    <h2 className="font-black text-lg truncate" style={{ color: '#1e293b' }}>{lit.companyName}</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" style={{ color: '#94a3b8' }} /></button>
            </div>

            <div className="p-5 space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { l: '소송유형', v: lit.type }, { l: '법원', v: lit.court },
                        { l: '상대방', v: lit.opponent || '—' }, { l: '담당변호사', v: lit.assignedLawyer },
                        { l: '청구금액', v: lit.claimAmount > 0 ? `${(lit.claimAmount / 100000000).toFixed(1)}억원` : '—' },
                        { l: '등록일', v: lit.createdAt?.split('T')[0] || '—' },
                    ].map(({ l, v }) => (
                        <div key={l} className="p-3 rounded-xl" style={{ background: '#f8f9fc', border: '1px solid #f1f5f9' }}>
                            <p className="text-[10px] font-bold mb-0.5" style={{ color: '#94a3b8' }}>{l}</p>
                            <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{v}</p>
                        </div>
                    ))}
                </div>

                {/* Status Change */}
                <div>
                    <p className="text-xs font-bold mb-2" style={{ color: '#64748b' }}>⚡ 사건 상태</p>
                    <div className="flex flex-wrap gap-1">
                        {STATUSES.map(s => (
                            <button key={s} onClick={() => { store.updateLit(lit.id, { status: s }); onUpdate(); }}
                                className="text-[10px] px-2 py-1 rounded-full font-bold transition-all"
                                style={{
                                    background: lit.status === s ? LIT_STATUS_COLOR[s] : '#f1f5f9',
                                    color: lit.status === s ? STATUS_TEXT_MAP[s] : '#64748b',
                                    border: `1px solid ${lit.status === s ? STATUS_TEXT_MAP[s] + '40' : '#e2e8f0'}`,
                                }}>{LIT_STATUS_LABEL[s]}</button>
                        ))}
                    </div>
                </div>

                {/* Deadlines */}
                <div>
                    <p className="text-xs font-bold mb-2" style={{ color: '#94a3b8' }}>📅 기한·일정 ({lit.deadlines.filter(d => d.completed).length}/{lit.deadlines.length})</p>
                    <div className="space-y-2">
                        {lit.deadlines.map(d => {
                            const days = daysUntil(d.dueDate);
                            const urgent = !d.completed && days <= 7;
                            const overdue = !d.completed && days < 0;
                            return (
                                <button key={d.id} onClick={() => toggleDeadline(d)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left transition-all hover:scale-[1.01]"
                                    style={{
                                        background: d.completed ? '#f0fdf4' : overdue ? '#fef2f2' : urgent ? '#fffbeb' : '#f8fafc',
                                        border: `1px solid ${d.completed ? '#86efac' : overdue ? '#fca5a5' : urgent ? '#fde68a' : '#e2e8f0'}`,
                                    }}>
                                    {d.completed ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#16a34a' }} />
                                        : overdue ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#dc2626' }} />
                                        : urgent ? <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#d97706' }} />
                                        : <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />}
                                    <div className="flex-1">
                                        <p className="text-xs font-bold" style={{ color: d.completed ? '#16a34a' : overdue ? '#dc2626' : urgent ? '#d97706' : '#1e293b' }}>{d.label}</p>
                                        <p className="text-[10px]" style={{ color: '#94a3b8' }}>
                                            {d.dueDate}
                                            {!d.completed && !overdue && <span style={{ color: urgent ? '#d97706' : '#94a3b8' }}> ({days}일 남음)</span>}
                                            {overdue && <span style={{ color: '#dc2626' }}> (D+{Math.abs(days)} 초과)</span>}
                                            {d.completed && d.completedAt && <span> · 완료 {d.completedAt}</span>}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <p className="text-xs font-bold mb-1" style={{ color: '#64748b' }}>📝 사건 메모</p>
                    <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={4}
                        className="w-full text-xs p-2.5 rounded-lg resize-none"
                        style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                </div>

                {/* Result */}
                <div>
                    <p className="text-xs font-bold mb-1" style={{ color: '#64748b' }}>🏆 결과</p>
                    <div className="flex gap-1 mb-2">
                        {(['', '승소', '패소', '합의', '취하'] as const).map(r => (
                            <button key={r} onClick={() => setEditResult(r)}
                                className="text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all"
                                style={{
                                    background: editResult === r ? (r === '승소' ? '#dcfce7' : r === '패소' ? '#fef2f2' : '#fffbeb') : '#f1f5f9',
                                    color: editResult === r ? (r === '승소' ? '#16a34a' : r === '패소' ? '#dc2626' : '#b8960a') : '#64748b',
                                    border: `1px solid ${editResult === r ? '#d1d5db' : '#e2e8f0'}`,
                                }}>{r || '미정'}</button>
                        ))}
                    </div>
                    <textarea value={editResultNote} onChange={e => setEditResultNote(e.target.value)} rows={2}
                        placeholder="결과 메모..." className="w-full text-xs p-2.5 rounded-lg resize-none"
                        style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                </div>

                {/* AI Summary */}
                {(() => {
                    const aiSummary = getAiSummary(lit.id);
                    return aiSummary ? (
                        <div className="p-3 rounded-lg" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                            <p className="text-[10px] font-bold mb-1" style={{ color: '#0284c7' }}>🤖 AI 자동 요약</p>
                            <pre className="text-xs whitespace-pre-wrap" style={{ color: '#0369a1', fontFamily: 'inherit' }}>{aiSummary}</pre>
                        </div>
                    ) : null;
                })()}

                {/* Save + Close buttons */}
                <div className="flex gap-2">
                    <button onClick={saveNotes} className="flex-1 text-sm py-2.5 rounded-xl font-bold"
                        style={{ background: saving ? '#dcfce7' : '#fffbeb', color: saving ? '#16a34a' : '#b8960a', border: `1px solid ${saving ? '#86efac' : '#fde68a'}` }}>
                        {saving ? '✓ 저장됨' : '💾 저장'}
                    </button>
                    {lit.status !== 'closed' && (
                        <button onClick={() => setShowCloseModal(true)} className="text-sm px-4 py-2.5 rounded-xl font-bold"
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                            <Archive className="w-3.5 h-3.5 inline mr-1" />종결
                        </button>
                    )}
                    {lit.status === 'closed' && (
                        <button onClick={() => { store.restoreLit(lit.id); onUpdate(); }}
                            className="text-sm px-4 py-2.5 rounded-xl font-bold"
                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd' }}>
                            <RotateCcw className="w-3.5 h-3.5 inline mr-1" />복원
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
        <AnimatePresence>
            {showCloseModal && <CloseModal ids={[lit.id]} onClose={() => setShowCloseModal(false)}
                onConfirm={(reason) => { store.closeLit(lit.id, reason); setShowCloseModal(false); onUpdate(); }} />}
        </AnimatePresence>
        </>
    );
}
