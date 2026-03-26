import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { store, LitigationCase, LitigationDeadline, LIT_STATUS_COLOR, LIT_STATUS_LABEL } from '@/lib/store';
import { generateAiMemoSummary } from '@/lib/automationEngine';
import { STATUS_TEXT_MAP, STATUSES, daysUntil } from '@/app/litigation/constants';

function DeadlineBadge({ d }: { d: LitigationDeadline }) {
    const days = daysUntil(d.dueDate);
    const urgent = !d.completed && days <= 7;
    const overdue = !d.completed && days < 0;
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
                background: d.completed ? '#f0fdf4' : overdue ? '#fef2f2' : urgent ? '#fffbeb' : '#f8fafc',
                border: `1px solid ${d.completed ? '#86efac' : overdue ? '#fca5a5' : urgent ? '#fde68a' : '#e2e8f0'}`,
            }}>
            {d.completed
                ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#16a34a' }} />
                : overdue
                    ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#dc2626' }} />
                    : urgent
                        ? <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#d97706' }} />
                        : <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />}
            <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: d.completed ? '#16a34a' : overdue ? '#dc2626' : urgent ? '#d97706' : '#1e293b' }}>
                    {d.label}
                </p>
                <p className="text-[10px]" style={{ color: '#94a3b8' }}>
                    {d.dueDate}
                    {!d.completed && !overdue && <span style={{ color: urgent ? '#d97706' : '#94a3b8' }}> ({days}일 남음)</span>}
                    {overdue && <span style={{ color: '#dc2626' }}> (D+{Math.abs(days)} 초과)</span>}
                    {d.completed && d.completedAt && <span style={{ color: '#94a3b8' }}> · 완료 {d.completedAt}</span>}
                </p>
            </div>
        </div>
    );
}

export default function CaseCard({ lit, onUpdate }: { lit: LitigationCase; onUpdate: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const [editNote, setEditNote] = useState(lit.notes);
    const [editResult, setEditResult] = useState(lit.result);
    const [editResultNote, setEditResultNote] = useState(lit.resultNote);
    const [saving, setSaving] = useState(false);

    const urgentDeadlines = lit.deadlines.filter(d => !d.completed && daysUntil(d.dueDate) <= 7);
    const doneCount = lit.deadlines.filter(d => d.completed).length;

    const saveNotes = () => {
        setSaving(true);
        store.updateLit(lit.id, { notes: editNote, result: editResult as LitigationCase['result'], resultNote: editResultNote });
        if (editNote.trim()) {
            generateAiMemoSummary(lit.id, editNote);
        }
        setTimeout(() => { setSaving(false); onUpdate(); }, 400);
    };

    const toggleDeadline = (d: LitigationDeadline) => {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        store.updateDeadline(lit.id, d.id, { completed: !d.completed, completedAt: !d.completed ? now : '' });
        onUpdate();
    };

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e7eb', background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {/* 헤더 */}
                <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-mono px-2 py-0.5 rounded"
                                    style={{ background: '#f1f5f9', color: '#64748b' }}>
                                    {lit.caseNo}
                                </span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                    style={{ background: LIT_STATUS_COLOR[lit.status], color: STATUS_TEXT_MAP[lit.status] }}>
                                    {LIT_STATUS_LABEL[lit.status]}
                                </span>
                                {urgentDeadlines.length > 0 && (
                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                                        <AlertTriangle className="w-3 h-3" /> D-{Math.min(...urgentDeadlines.map(d => daysUntil(d.dueDate)))}
                                    </span>
                                )}
                                {lit.result && (
                                    <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                                        style={{ background: lit.result === '승소' ? '#dcfce7' : lit.result === '패소' ? '#fef2f2' : '#fffbeb', color: lit.result === '승소' ? '#16a34a' : lit.result === '패소' ? '#dc2626' : '#b8960a' }}>
                                        {lit.result}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-black text-base" style={{ color: '#1e293b' }}>{lit.companyName}</h3>
                            <p className="text-sm" style={{ color: '#64748b' }}>{lit.type} · vs {lit.opponent}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-lg font-black" style={{ color: '#b8960a' }}>
                                {(lit.claimAmount / 100000000).toFixed(1)}억원
                            </p>
                            <p className="text-xs" style={{ color: '#94a3b8' }}>{lit.court}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#7c3aed' }}>{lit.assignedLawyer}</p>
                        </div>
                    </div>

                    {/* 기한 미리보기 */}
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: '#e5e7eb' }}>
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${lit.deadlines.length > 0 ? (doneCount / lit.deadlines.length) * 100 : 0}%`, background: 'linear-gradient(90deg,#c9a84c,#e8c87a)' }} />
                        </div>
                        <span className="text-xs" style={{ color: '#94a3b8' }}>{doneCount}/{lit.deadlines.length} 기한완료</span>
                        <button onClick={() => setExpanded(e => !e)} className="p-1 rounded-lg transition-all"
                            style={{ color: '#94a3b8' }}>
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* 확장 패널 */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                            style={{ borderTop: '1px solid #e5e7eb' }}>
                            <div className="px-5 py-4 grid grid-cols-2 gap-4" style={{ background: '#f8f9fc' }}>
                                {/* 기한 목록 */}
                                <div>
                                    <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                                        📅 기한·일정 관리
                                    </p>
                                    <div className="space-y-2">
                                        {lit.deadlines.map(d => (
                                            <button key={d.id} onClick={() => toggleDeadline(d)} className="w-full text-left">
                                                <DeadlineBadge d={d} />
                                            </button>
                                        ))}
                                        {lit.deadlines.length === 0 && (
                                            <p className="text-xs" style={{ color: '#94a3b8' }}>기한이 없습니다</p>
                                        )}
                                    </div>
                                    {/* 상태 변경 */}
                                    <div className="mt-4">
                                        <p className="text-xs font-bold mb-2" style={{ color: '#64748b' }}>사건 상태</p>
                                        <div className="flex flex-wrap gap-1">
                                            {STATUSES.map(s => (
                                                <button key={s}
                                                    onClick={() => { store.updateLit(lit.id, { status: s }); onUpdate(); }}
                                                    className="text-[10px] px-2 py-1 rounded-full font-bold transition-all"
                                                    style={{
                                                        background: lit.status === s ? LIT_STATUS_COLOR[s] : '#f1f5f9',
                                                        color: lit.status === s ? STATUS_TEXT_MAP[s] : '#64748b',
                                                        border: `1px solid ${lit.status === s ? STATUS_TEXT_MAP[s] + '40' : '#e2e8f0'}`,
                                                    }}>
                                                    {LIT_STATUS_LABEL[s]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 메모 및 결과 */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-bold mb-1" style={{ color: '#64748b' }}>📝 사건 메모</p>
                                        <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={4}
                                            className="w-full text-xs p-2.5 rounded-lg resize-none"
                                            style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold mb-1" style={{ color: '#64748b' }}>🏆 결과</p>
                                        <div className="flex gap-1 mb-2">
                                            {['', '승소', '패소', '합의', '취하'].map(r => (
                                                <button key={r}
                                                    onClick={() => setEditResult(r as LitigationCase['result'])}
                                                    className="text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all"
                                                    style={{
                                                        background: editResult === r ? (r === '승소' ? '#dcfce7' : r === '패소' ? '#fef2f2' : '#fffbeb') : '#f1f5f9',
                                                        color: editResult === r ? (r === '승소' ? '#16a34a' : r === '패소' ? '#dc2626' : '#b8960a') : '#64748b',
                                                        border: `1px solid ${editResult === r ? '#d1d5db' : '#e2e8f0'}`,
                                                    }}>{r || '미정'}</button>
                                            ))}
                                        </div>
                                        <textarea value={editResultNote} onChange={e => setEditResultNote(e.target.value)} rows={2}
                                            placeholder="결과 메모..."
                                            className="w-full text-xs p-2.5 rounded-lg resize-none"
                                            style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                    <button onClick={saveNotes}
                                        className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                        style={{ background: saving ? '#dcfce7' : '#fffbeb', color: saving ? '#16a34a' : '#b8960a', border: `1px solid ${saving ? '#86efac' : '#fde68a'}` }}>
                                        {saving ? '✓ 저장됨' : '저장'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
