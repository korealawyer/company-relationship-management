'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, Plus, X, CheckCircle2, Clock, AlertTriangle,
    Calendar, Lock, Gavel, Eye, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    store, LitigationCase, LitigationDeadline, LitigationStatus,
    LIT_STATUS_LABEL, LIT_STATUS_COLOR,
    LAWYERS, LITIGATION_TYPES, COURTS,
} from '@/lib/mockStore';
import { getSession } from '@/lib/auth';

// ── 색상 시스템 (영업 CRM 통일) ─────────────────────────────
const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

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
                style={{ background: T.card, border: `1px solid ${T.borderSub}`, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-black text-lg" style={{ color: T.body }}>⚖️ 신규 사건 등록</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100" style={{ color: T.faint }}><X className="w-5 h-5" /></button>
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
                                style={{ background: T.bg, border: `1px solid ${T.borderSub}`, color: T.body }} />
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
                                style={{ background: T.bg, border: `1px solid ${T.borderSub}`, color: T.body }}>
                                {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
                <div className="mt-3">
                    <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>사건 메모</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        rows={3} className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                        style={{ background: T.bg, border: `1px solid ${T.borderSub}`, color: T.body }} />
                </div>
                {/* 기한 추가 */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold" style={{ color: T.muted }}>📅 기한·일정</p>
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
                                    style={{ background: T.bg, border: `1px solid ${T.borderSub}`, color: T.body }} />
                                <input type="date" value={d.dueDate} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, dueDate: e.target.value } : x))}
                                    className="px-2 py-1.5 rounded-lg text-xs"
                                    style={{ background: T.bg, border: `1px solid ${T.borderSub}`, color: T.body }} />
                                {deadlines.length > 1 && (
                                    <button onClick={() => setDeadlines(p => p.filter((_, j) => j !== i))} className="p-1"><X className="w-3.5 h-3.5" style={{ color: T.faint }} /></button>
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
    const [cases, setCases] = useState<LitigationCase[]>(() => [...store.getLitAll()]);
    const [filterStatus, setFilterStatus] = useState<LitigationStatus | 'all'>('all');
    const [showAdd, setShowAdd] = useState(false);
    const [userRole] = useState<string>(() => getSession()?.role ?? '');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const refresh = useCallback(() => setCases([...store.getLitAll()]), []);
    useEffect(() => {
        const id = setInterval(refresh, 30_000);
        return () => clearInterval(id);
    }, [refresh]);

    const readOnly = userRole === 'sales';

    const filtered = (filterStatus === 'all' ? cases : cases.filter(c => c.status === filterStatus))
        .filter(c => !search || c.companyName.includes(search) || c.caseNo.includes(search) || c.opponent.includes(search));
    const totalClaim = cases.reduce((s, c) => s + c.claimAmount, 0);
    const urgentAll = cases.flatMap(c => c.deadlines.filter(d => !d.completed && daysUntil(d.dueDate) <= 7));
    const counts = STATUSES.reduce((a, s) => ({ ...a, [s]: cases.filter(c => c.status === s).length }), {} as Record<string, number>);

    // 확장 행에서 기한 토글
    const toggleDeadline = (litId: string, d: LitigationDeadline) => {
        if (readOnly) return;
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        store.updateDeadline(litId, d.id, { completed: !d.completed, completedAt: !d.completed ? now : '' });
        refresh();
    };

    // 확장 행에서 상태 변경
    const changeStatus = (litId: string, status: LitigationStatus) => {
        store.updateLit(litId, { status });
        refresh();
    };

    // 통계
    const stats = [
        { label: '전체 사건', value: cases.length, color: '#b8960a', bg: '#fffbeb', border: '#fde68a' },
        { label: '진행 중', value: cases.filter(c => !['closed'].includes(c.status)).length, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
        { label: '긴급 기한', value: urgentAll.length, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
        { label: '청구액 합계', value: `${(totalClaim / 100000000).toFixed(1)}억`, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    ];

    return (
        <div className="min-h-screen" style={{ background: T.bg }}>
            <div className="max-w-7xl mx-auto px-6 py-6 pt-24 space-y-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black" style={{ color: T.heading }}>송무팀 사건 관리</h1>
                        <p className="text-xs mt-0.5" style={{ color: T.muted }}>
                            IBS 법률사무소 · 총 {cases.length}건
                            {urgentAll.length > 0 && <span style={{ color: '#d97706' }}> · ⚠ 긴급 기한 {urgentAll.length}건</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.faint }} />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="회사명·사건번호·상대방 검색..."
                                className="pl-9 pr-4 py-2 rounded-xl outline-none text-sm w-56"
                                style={{ background: T.card, border: `1px solid ${T.border}`, color: T.heading }} />
                        </div>
                        {!readOnly ? (
                            <Button variant="premium" size="sm" onClick={() => setShowAdd(true)}>
                                <Plus className="w-4 h-4 mr-1" /> 신규 사건
                            </Button>
                        ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                                style={{ background: '#fef9ec', border: '1px solid #fde68a', color: '#d97706' }}>
                                <Lock className="w-3.5 h-3.5" />읽기 전용
                            </div>
                        )}
                    </div>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-4 gap-3">
                    {stats.map(c => (
                        <div key={c.label} className="px-5 py-4 rounded-2xl" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                            <p className="text-xs font-bold mb-1" style={{ color: c.color }}>{c.label}</p>
                            <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* 긴급 기한 배너 */}
                {urgentAll.length > 0 && (
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
                )}

                {/* 상태 필터 탭 */}
                <div className="flex gap-2">
                    {[{ v: 'all' as const, l: `전체 ${cases.length}` }, ...STATUSES.map(s => ({ v: s, l: `${LIT_STATUS_LABEL[s]} ${counts[s] || 0}` }))].map(item => (
                        <button key={item.v}
                            onClick={() => setFilterStatus(item.v as LitigationStatus | 'all')}
                            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                            style={{
                                background: filterStatus === item.v ? '#fffbeb' : 'transparent',
                                border: filterStatus === item.v ? '1px solid #fde68a' : '1px solid transparent',
                                color: filterStatus === item.v ? '#b8960a' : T.muted,
                            }}>
                            {item.l}
                        </button>
                    ))}
                </div>

                {/* 테이블 */}
                <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ background: '#f8f9fc', borderBottom: `2px solid ${T.border}` }}>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>사건번호</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>의뢰인</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>유형</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>상대방</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>법원</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>상태</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>청구액</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>기한</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>액션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr><td colSpan={9} className="text-center py-12 text-sm" style={{ color: T.faint }}>등록된 사건이 없습니다.</td></tr>
                                )}
                                {filtered.map(lit => {
                                    const isExpanded = expandedId === lit.id;
                                    const urgentDeadlines = lit.deadlines.filter(d => !d.completed && daysUntil(d.dueDate) <= 7);
                                    const doneCount = lit.deadlines.filter(d => d.completed).length;

                                    return (
                                        <React.Fragment key={lit.id}>
                                            <tr className="transition-colors cursor-pointer hover:bg-slate-50"
                                                style={{ borderBottom: `1px solid ${T.borderSub}` }}
                                                onClick={() => setExpandedId(isExpanded ? null : lit.id)}>
                                                <td className="py-3 px-4">
                                                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#f1f5f9', color: T.muted }}>
                                                        {lit.caseNo || '미등록'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        {urgentDeadlines.length > 0 && <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#d97706' }} />}
                                                        <span className="font-bold" style={{ color: T.heading }}>{lit.companyName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-xs" style={{ color: T.sub }}>{lit.type}</td>
                                                <td className="py-3 px-4 text-xs" style={{ color: T.sub }}>{lit.opponent}</td>
                                                <td className="py-3 px-4 text-xs" style={{ color: T.sub }}>{lit.court}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold"
                                                            style={{ background: LIT_STATUS_COLOR[lit.status], color: STATUS_TEXT_MAP[lit.status] }}>
                                                            {LIT_STATUS_LABEL[lit.status]}
                                                        </span>
                                                        {lit.result && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                                style={{
                                                                    background: lit.result === '승소' ? '#dcfce7' : lit.result === '패소' ? '#fef2f2' : '#fffbeb',
                                                                    color: lit.result === '승소' ? '#16a34a' : lit.result === '패소' ? '#dc2626' : '#b8960a',
                                                                }}>
                                                                {lit.result}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 font-bold text-sm" style={{ color: '#b8960a' }}>
                                                    {(lit.claimAmount / 100000000).toFixed(1)}억
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-16 h-1.5 rounded-full" style={{ background: '#e5e7eb' }}>
                                                            <div className="h-1.5 rounded-full" style={{
                                                                width: `${lit.deadlines.length > 0 ? (doneCount / lit.deadlines.length) * 100 : 0}%`,
                                                                background: 'linear-gradient(90deg,#c9a84c,#e8c87a)',
                                                            }} />
                                                        </div>
                                                        <span className="text-[10px] font-medium" style={{ color: T.faint }}>{doneCount}/{lit.deadlines.length}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button className="text-xs font-bold px-3 py-1 rounded-lg"
                                                        style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                                                        onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : lit.id); }}>
                                                        <Eye className="w-3 h-3 inline mr-1" />{isExpanded ? '접기' : '상세'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* 확장 행: 기한 + 메모 + 상태변경 + 결과 */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={9}>
                                                        <CaseExpandedRow lit={lit} readOnly={readOnly} onToggleDeadline={toggleDeadline} onChangeStatus={changeStatus} onRefresh={refresh} />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 등록 모달 */}
                <AnimatePresence>
                    {showAdd && <AddCaseModal onClose={() => setShowAdd(false)} onAdd={refresh} />}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ── 확장 행 컴포넌트 ─────────────────────────────────────────
function CaseExpandedRow({ lit, readOnly, onToggleDeadline, onChangeStatus, onRefresh }: {
    lit: LitigationCase; readOnly: boolean;
    onToggleDeadline: (litId: string, d: LitigationDeadline) => void;
    onChangeStatus: (litId: string, status: LitigationStatus) => void;
    onRefresh: () => void;
}) {
    const [editNote, setEditNote] = useState(lit.notes);
    const [editResult, setEditResult] = useState(lit.result);
    const [editResultNote, setEditResultNote] = useState(lit.resultNote);
    const [saving, setSaving] = useState(false);

    const saveNotes = () => {
        setSaving(true);
        store.updateLit(lit.id, { notes: editNote, result: editResult as LitigationCase['result'], resultNote: editResultNote });
        setTimeout(() => { setSaving(false); onRefresh(); }, 400);
    };

    return (
        <div className="px-6 py-4 grid grid-cols-2 gap-6" style={{ background: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
            {/* 좌: 기한 + 상태 */}
            <div>
                <p className="text-xs font-bold mb-3" style={{ color: T.sub }}>📅 기한·일정 관리</p>
                <div className="space-y-2">
                    {lit.deadlines.map(d => (
                        <button key={d.id} onClick={() => onToggleDeadline(lit.id, d)} className="w-full text-left">
                            <DeadlineBadge d={d} />
                        </button>
                    ))}
                    {lit.deadlines.length === 0 && <p className="text-xs" style={{ color: T.faint }}>기한이 없습니다</p>}
                </div>
                <div className="mt-4">
                    <p className="text-xs font-bold mb-2" style={{ color: T.muted }}>사건 상태</p>
                    {readOnly ? (
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: '#fef9ec', border: '1px solid #fde68a' }}>
                            <Lock className="w-3.5 h-3.5" style={{ color: '#d97706' }} />
                            <span className="text-xs font-bold" style={{ color: '#d97706' }}>영업팀은 상태를 변경할 수 없습니다</span>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {STATUSES.map(s => (
                                <button key={s}
                                    onClick={() => onChangeStatus(lit.id, s)}
                                    className="text-[10px] px-2 py-1 rounded-full font-bold transition-all"
                                    style={{
                                        background: lit.status === s ? LIT_STATUS_COLOR[s] : '#f1f5f9',
                                        color: lit.status === s ? STATUS_TEXT_MAP[lit.status] : T.muted,
                                        border: `1px solid ${lit.status === s ? STATUS_TEXT_MAP[lit.status] + '40' : '#e2e8f0'}`,
                                    }}>
                                    {LIT_STATUS_LABEL[s]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-3 text-xs" style={{ color: T.faint }}>
                    <span className="font-medium">담당: </span>
                    <span className="font-bold" style={{ color: '#7c3aed' }}>{lit.assignedLawyer}</span>
                </div>
            </div>
            {/* 우: 메모 + 결과 */}
            <div className="space-y-3">
                <div>
                    <p className="text-xs font-bold mb-1" style={{ color: T.muted }}>📝 사건 메모</p>
                    <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={4}
                        className="w-full text-xs p-2.5 rounded-lg resize-none"
                        style={{ background: T.card, border: `1px solid ${T.borderSub}`, color: T.body }} />
                </div>
                <div>
                    <p className="text-xs font-bold mb-1" style={{ color: T.muted }}>🏆 결과</p>
                    <div className="flex gap-1 mb-2">
                        {['', '승소', '패소', '합의', '취하'].map(r => (
                            <button key={r}
                                onClick={() => setEditResult(r as LitigationCase['result'])}
                                className="text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all"
                                style={{
                                    background: editResult === r ? (r === '승소' ? '#dcfce7' : r === '패소' ? '#fef2f2' : '#fffbeb') : '#f1f5f9',
                                    color: editResult === r ? (r === '승소' ? '#16a34a' : r === '패소' ? '#dc2626' : '#b8960a') : T.muted,
                                    border: `1px solid ${editResult === r ? T.border : '#e2e8f0'}`,
                                }}>{r || '미정'}</button>
                        ))}
                    </div>
                    <textarea value={editResultNote} onChange={e => setEditResultNote(e.target.value)} rows={2}
                        placeholder="결과 메모..."
                        className="w-full text-xs p-2.5 rounded-lg resize-none"
                        style={{ background: T.card, border: `1px solid ${T.borderSub}`, color: T.body }} />
                </div>
                <button onClick={saveNotes}
                    disabled={readOnly}
                    className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: saving ? '#dcfce7' : '#fffbeb', color: saving ? '#16a34a' : '#b8960a', border: `1px solid ${saving ? '#86efac' : '#fde68a'}` }}>
                    {saving ? '✓ 저장됨' : readOnly ? '🔒 저장 불가' : '저장'}
                </button>
            </div>
        </div>
    );
}
