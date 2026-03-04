'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, Plus, X, CheckCircle2, Clock, AlertTriangle,
    ChevronDown, ChevronUp, Calendar, Building2, FileText,
    Flag, DollarSign, Gavel, RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    store, LitigationCase, LitigationDeadline, LitigationStatus,
    LIT_STATUS_LABEL, LIT_STATUS_COLOR,
    LAWYERS, LITIGATION_TYPES, COURTS,
} from '@/lib/mockStore';

const STATUS_TEXT_MAP: Record<LitigationStatus, string> = {
    preparing: '#94a3b8', filed: '#60a5fa', hearing: '#fb923c',
    settlement: '#c084fc', judgment: '#c9a84c', closed: '#4ade80',
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
                background: d.completed ? 'rgba(74,222,128,0.08)' : overdue ? 'rgba(239,68,68,0.1)' : urgent ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${d.completed ? 'rgba(74,222,128,0.2)' : overdue ? 'rgba(239,68,68,0.25)' : urgent ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}>
            {d.completed
                ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4ade80' }} />
                : overdue
                    ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#f87171' }} />
                    : urgent
                        ? <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#fbbf24' }} />
                        : <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />}
            <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: d.completed ? '#4ade80' : overdue ? '#f87171' : urgent ? '#fbbf24' : '#f0f4ff' }}>
                    {d.label}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(240,244,255,0.4)' }}>
                    {d.dueDate}
                    {!d.completed && !overdue && <span style={{ color: urgent ? '#fbbf24' : '#94a3b8' }}> ({days}일 남음)</span>}
                    {overdue && <span style={{ color: '#f87171' }}> (D+{Math.abs(days)} 초과)</span>}
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
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,27,62,0.4)' }}>
                {/* 헤더 */}
                <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-mono px-2 py-0.5 rounded"
                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.5)' }}>
                                    {lit.caseNo}
                                </span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                    style={{ background: LIT_STATUS_COLOR[lit.status], color: STATUS_TEXT_MAP[lit.status] }}>
                                    {LIT_STATUS_LABEL[lit.status]}
                                </span>
                                {urgentDeadlines.length > 0 && (
                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                                        <AlertTriangle className="w-3 h-3" /> D-{Math.min(...urgentDeadlines.map(d => daysUntil(d.dueDate)))}
                                    </span>
                                )}
                                {lit.result && (
                                    <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                                        style={{ background: lit.result === '승소' ? 'rgba(74,222,128,0.2)' : lit.result === '패소' ? 'rgba(239,68,68,0.2)' : 'rgba(201,168,76,0.2)', color: lit.result === '승소' ? '#4ade80' : lit.result === '패소' ? '#f87171' : '#c9a84c' }}>
                                        {lit.result}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-black text-base" style={{ color: '#f0f4ff' }}>{lit.companyName}</h3>
                            <p className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>{lit.type} · vs {lit.opponent}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-lg font-black" style={{ color: '#c9a84c' }}>
                                {(lit.claimAmount / 100000000).toFixed(1)}억원
                            </p>
                            <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{lit.court}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#a78bfa' }}>{lit.assignedLawyer}</p>
                        </div>
                    </div>

                    {/* 기한 미리보기 */}
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${lit.deadlines.length > 0 ? (doneCount / lit.deadlines.length) * 100 : 0}%`, background: 'linear-gradient(90deg,#e8c87a,#c9a84c)' }} />
                        </div>
                        <span className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{doneCount}/{lit.deadlines.length} 기한완료</span>
                        <button onClick={() => setExpanded(e => !e)} className="p-1 rounded-lg transition-all"
                            style={{ color: 'rgba(240,244,255,0.4)' }}>
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
                            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="px-5 py-4 grid grid-cols-2 gap-4">
                                {/* 기한 목록 */}
                                <div>
                                    <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                        📅 기한·일정 관리
                                    </p>
                                    <div className="space-y-2">
                                        {lit.deadlines.map(d => (
                                            <button key={d.id} onClick={() => toggleDeadline(d)} className="w-full text-left">
                                                <DeadlineBadge d={d} />
                                            </button>
                                        ))}
                                        {lit.deadlines.length === 0 && (
                                            <p className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>기한이 없습니다</p>
                                        )}
                                    </div>
                                    {/* 상태 변경 */}
                                    <div className="mt-4">
                                        <p className="text-xs font-bold mb-2" style={{ color: 'rgba(240,244,255,0.4)' }}>사건 상태</p>
                                        <div className="flex flex-wrap gap-1">
                                            {STATUSES.map(s => (
                                                <button key={s}
                                                    onClick={() => { store.updateLit(lit.id, { status: s }); onUpdate(); }}
                                                    className="text-[10px] px-2 py-1 rounded-full font-bold transition-all"
                                                    style={{
                                                        background: lit.status === s ? LIT_STATUS_COLOR[s] : 'rgba(255,255,255,0.04)',
                                                        color: lit.status === s ? STATUS_TEXT_MAP[s] : 'rgba(240,244,255,0.4)',
                                                        border: `1px solid ${lit.status === s ? STATUS_TEXT_MAP[s] + '40' : 'rgba(255,255,255,0.06)'}`,
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
                                        <p className="text-xs font-bold mb-1" style={{ color: 'rgba(240,244,255,0.4)' }}>📝 사건 메모</p>
                                        <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={4}
                                            className="w-full text-xs p-2.5 rounded-lg resize-none"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4ff' }} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold mb-1" style={{ color: 'rgba(240,244,255,0.4)' }}>🏆 결과</p>
                                        <div className="flex gap-1 mb-2">
                                            {['', '승소', '패소', '합의', '취하'].map(r => (
                                                <button key={r}
                                                    onClick={() => setEditResult(r as LitigationCase['result'])}
                                                    className="text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all"
                                                    style={{
                                                        background: editResult === r ? (r === '승소' ? 'rgba(74,222,128,0.2)' : r === '패소' ? 'rgba(239,68,68,0.2)' : 'rgba(201,168,76,0.2)') : 'rgba(255,255,255,0.04)',
                                                        color: editResult === r ? (r === '승소' ? '#4ade80' : r === '패소' ? '#f87171' : '#c9a84c') : 'rgba(240,244,255,0.5)',
                                                        border: `1px solid ${editResult === r ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                                                    }}>{r || '미정'}</button>
                                            ))}
                                        </div>
                                        <textarea value={editResultNote} onChange={e => setEditResultNote(e.target.value)} rows={2}
                                            placeholder="결과 메모..."
                                            className="w-full text-xs p-2.5 rounded-lg resize-none"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#f0f4ff' }} />
                                    </div>
                                    <button onClick={saveNotes}
                                        className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                        style={{ background: saving ? 'rgba(74,222,128,0.15)' : 'rgba(201,168,76,0.1)', color: saving ? '#4ade80' : '#c9a84c' }}>
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
            style={{ background: 'rgba(4,9,26,0.9)', backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="w-full max-w-2xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
                style={{ background: '#0d1b3e', border: '1px solid rgba(201,168,76,0.25)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-black text-lg" style={{ color: '#f0f4ff' }}>⚖️ 신규 사건 등록</h2>
                    <button onClick={onClose}><X className="w-5 h-5" style={{ color: 'rgba(240,244,255,0.4)' }} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { k: 'caseNo', l: '사건번호', p: '2026가합12345' },
                        { k: 'opponent', l: '상대방', p: '김○○ / ○○연합회' },
                        { k: 'claimAmount', l: '청구금액 (원)', p: '50000000' },
                    ].map(f => (
                        <div key={f.k}>
                            <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(201,168,76,0.8)' }}>{f.l}</label>
                            <input value={form[f.k as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                                placeholder={f.p} className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4ff' }} />
                        </div>
                    ))}
                    {[
                        { k: 'companyId', l: '의뢰인', opts: companies.map(c => ({ v: c.id, l: c.name })) },
                        { k: 'court', l: '법원', opts: COURTS.map(c => ({ v: c, l: c })) },
                        { k: 'type', l: '소송 유형', opts: LITIGATION_TYPES.map(t => ({ v: t, l: t })) },
                        { k: 'assignedLawyer', l: '담당 변호사', opts: LAWYERS.map(l => ({ v: l, l })) },
                    ].map(f => (
                        <div key={f.k}>
                            <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(201,168,76,0.8)' }}>{f.l}</label>
                            <select value={form[f.k as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'rgba(13,27,62,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4ff' }}>
                                {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
                <div className="mt-3">
                    <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(201,168,76,0.8)' }}>사건 메모</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        rows={3} className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4ff' }} />
                </div>

                {/* 기한 추가 */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold" style={{ color: 'rgba(240,244,255,0.5)' }}>📅 기한·일정</p>
                        <button onClick={() => setDeadlines(p => [...p, { label: '', dueDate: '' }])}
                            className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: '#c9a84c' }}>
                            + 추가
                        </button>
                    </div>
                    <div className="space-y-2">
                        {deadlines.map((d, i) => (
                            <div key={i} className="flex gap-2">
                                <input value={d.label} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                                    placeholder="기한명 (예: 1차 준비서면)" className="flex-1 px-2 py-1.5 rounded-lg text-xs"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#f0f4ff' }} />
                                <input type="date" value={d.dueDate} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, dueDate: e.target.value } : x))}
                                    className="px-2 py-1.5 rounded-lg text-xs"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#f0f4ff' }} />
                                {deadlines.length > 1 && (
                                    <button onClick={() => setDeadlines(p => p.filter((_, j) => j !== i))}><X className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} /></button>
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
        <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8" style={{ background: '#04091a' }}>
            <div className="max-w-5xl mx-auto">

                {/* 헤더 */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: '#f0f4ff' }}>송무팀 사건 관리</h1>
                        <p className="text-sm mt-0.5" style={{ color: 'rgba(240,244,255,0.45)' }}>
                            총 {cases.length}건 · 청구금액 합계 {(totalClaim / 100000000).toFixed(1)}억원
                            {urgentAll.length > 0 && <span style={{ color: '#fbbf24' }}> · ⚠ 긴급 기한 {urgentAll.length}건</span>}
                        </p>
                    </div>
                    <Button variant="premium" size="sm" onClick={() => setShowAdd(true)}>
                        <Plus className="w-4 h-4 mr-1" /> 신규 사건
                    </Button>
                </div>

                {/* 긴급 기한 배너 */}
                {urgentAll.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
                        <div className="rounded-xl p-4" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4" style={{ color: '#fbbf24' }} />
                                <span className="text-sm font-black" style={{ color: '#fbbf24' }}>⚠ 7일 이내 기한 {urgentAll.length}건</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {cases.flatMap(c => c.deadlines
                                    .filter(d => !d.completed && daysUntil(d.dueDate) <= 7)
                                    .map(d => (
                                        <div key={d.id} className="px-3 py-1.5 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                                            <p className="text-xs font-bold" style={{ color: '#fbbf24' }}>{c.companyName}</p>
                                            <p className="text-[10px]" style={{ color: 'rgba(240,244,255,0.6)' }}>{d.label} · {d.dueDate}</p>
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
                                    background: active ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                                    color: active ? '#c9a84c' : 'rgba(240,244,255,0.5)',
                                    border: `1px solid ${active ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.06)'}`,
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
                        <div className="text-center py-16" style={{ color: 'rgba(240,244,255,0.25)' }}>
                            <Scale className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>등록된 사건이 없습니다</p>
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
