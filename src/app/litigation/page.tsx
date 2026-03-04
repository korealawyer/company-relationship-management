'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, Plus, X, CheckCircle2, Clock, AlertTriangle,
    ChevronDown, ChevronUp, Calendar, FileText,
    Gavel,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    store, LitigationCase, LitigationDeadline, LitigationStatus,
    LIT_STATUS_LABEL, LIT_STATUS_COLOR,
    LAWYERS, LITIGATION_TYPES, COURTS,
} from '@/lib/mockStore';

// 라이트 테마용 상태 텍스트 색상
const STATUS_TEXT_MAP: Record<LitigationStatus, string> = {
    preparing: '#64748b', filed: '#2563eb', hearing: '#d97706',
    settlement: '#7c3aed', judgment: '#b8960a', closed: '#16a34a',
};

const STATUSES: LitigationStatus[] = ['preparing', 'filed', 'hearing', 'settlement', 'judgment', 'closed'];

function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
}

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

function CaseCard({ lit, onUpdate }: { lit: LitigationCase; onUpdate: () => void }) {
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

// ── 신규 사건 등록 폼 ─────────────────────────────────────────
function AddCaseModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
    const companies = store.getAll();
    const [form, setForm] = useState({
        companyId: companies[0]?.id ?? '',
        caseNo: '', court: COURTS[0], type: LITIGATION_TYPES[0],
        opponent: '', claimAmount: '', assignedLawyer: LAWYERS[0], notes: '',
    });
    const [deadlines, setDeadlines] = useState<{ label: string; dueDate: string }[]>([
        { label: '소장 접수', dueDate: '' },
    ]);

    const handleAdd = () => {
        const company = companies.find(c => c.id === form.companyId);
        store.addLit({
            companyId: form.companyId, companyName: company?.name ?? '',
            caseNo: form.caseNo, court: form.court, type: form.type,
            opponent: form.opponent, claimAmount: parseInt(form.claimAmount.replace(/,/g, '')) || 0,
            status: 'preparing', assignedLawyer: form.assignedLawyer,
            deadlines: deadlines.filter(d => d.label && d.dueDate).map((d, i) => ({
                id: `d${Date.now()}-${i}`, ...d, completed: false, completedAt: '',
            })),
            notes: form.notes, result: '', resultNote: '',
        });
        onAdd();
        onClose();
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="w-full max-w-2xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-black text-lg" style={{ color: '#1e293b' }}>⚖️ 신규 사건 등록</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100" style={{ color: '#94a3b8' }}><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { k: 'caseNo', l: '사건번호', p: '2026가합12345' },
                        { k: 'opponent', l: '상대방', p: '김○○ / ○○연합회' },
                        { k: 'claimAmount', l: '청구금액 (원)', p: '50000000' },
                    ].map(f => (
                        <div key={f.k}>
                            <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>{f.l}</label>
                            <input value={form[f.k as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                                placeholder={f.p} className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                        </div>
                    ))}
                    {[
                        { k: 'companyId', l: '의뢰인', opts: companies.map(c => ({ v: c.id, l: c.name })) },
                        { k: 'court', l: '법원', opts: COURTS.map(c => ({ v: c, l: c })) },
                        { k: 'type', l: '소송 유형', opts: LITIGATION_TYPES.map(t => ({ v: t, l: t })) },
                        { k: 'assignedLawyer', l: '담당 변호사', opts: LAWYERS.map(l => ({ v: l, l })) },
                    ].map(f => (
                        <div key={f.k}>
                            <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>{f.l}</label>
                            <select value={form[f.k as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                                {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
                <div className="mt-3">
                    <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>사건 메모</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        rows={3} className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                        style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                </div>

                {/* 기한 추가 */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold" style={{ color: '#64748b' }}>📅 기한·일정</p>
                        <button onClick={() => setDeadlines(p => [...p, { label: '', dueDate: '' }])}
                            className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>
                            + 추가
                        </button>
                    </div>
                    <div className="space-y-2">
                        {deadlines.map((d, i) => (
                            <div key={i} className="flex gap-2">
                                <input value={d.label} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                                    placeholder="기한명 (예: 1차 준비서면)" className="flex-1 px-2 py-1.5 rounded-lg text-xs"
                                    style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                <input type="date" value={d.dueDate} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, dueDate: e.target.value } : x))}
                                    className="px-2 py-1.5 rounded-lg text-xs"
                                    style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                {deadlines.length > 1 && (
                                    <button onClick={() => setDeadlines(p => p.filter((_, j) => j !== i))} className="p-1"><X className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} /></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 mt-5">
                    <Button variant="ghost" className="flex-1" onClick={onClose}>취소</Button>
                    <Button variant="premium" className="flex-1" onClick={handleAdd}>
                        <Gavel className="w-4 h-4 mr-1" /> 사건 등록
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── 메인 ─────────────────────────────────────────────────────
export default function LitigationPage() {
    const [cases, setCases] = useState<LitigationCase[]>([]);
    const [filterStatus, setFilterStatus] = useState<LitigationStatus | 'all'>('all');
    const [showAdd, setShowAdd] = useState(false);

    const refresh = useCallback(() => setCases([...store.getLitAll()]), []);
    useEffect(() => { refresh(); const id = setInterval(refresh, 3000); return () => clearInterval(id); }, [refresh]);

    const filtered = filterStatus === 'all' ? cases : cases.filter(c => c.status === filterStatus);
    const totalClaim = cases.reduce((s, c) => s + c.claimAmount, 0);
    const urgentAll = cases.flatMap(c => c.deadlines.filter(d => !d.completed && daysUntil(d.dueDate) <= 7));
    const counts = STATUSES.reduce((a, s) => ({ ...a, [s]: cases.filter(c => c.status === s).length }), {} as Record<string, number>);

    return (
        <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8" style={{ background: '#f8f9fc' }}>
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
