// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, Plus, X, CheckCircle2, Clock, AlertTriangle, Building,
    ChevronDown, ChevronUp, Calendar, FileText, Users,
    Gavel, Search, LayoutGrid, List, Filter, RotateCcw, TrendingUp,
    ChevronRight, Archive, Briefcase, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LitigationCase, LitigationDeadline, LitigationStatus } from '@/lib/types';
import { LIT_STATUS_LABEL, LIT_STATUS_COLOR, LAWYERS, LITIGATION_TYPES, COURTS } from '@/lib/constants';
import { store } from '@/lib/store';
import { getAiSummary, generateAiMemoSummary } from '@/lib/automationEngine';
import { STATUS_TEXT_MAP, STATUSES, daysUntil } from './constants';
import { useLitigations } from '@/hooks/useDataLayer';

const formatMoney = (n: number) => n >= 100000000 ? `${(n / 100000000).toFixed(1)}억` : n >= 10000 ? `${(n / 10000).toFixed(0)}만원` : `${n.toLocaleString()}원`;

// ── KPI Card ──
function KpiCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string | number; sub: string; accent: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accent + '18' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{label}</span>
            </div>
            <p className="text-xl font-black" style={{ color: accent }}>{value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>{sub}</p>
        </motion.div>
    );
}

// ── Close Modal ──
function CloseModal({ ids, onClose, onConfirm }: { ids: string[]; onClose: () => void; onConfirm: (reason: string) => void }) {
    const [reason, setReason] = useState('');
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md rounded-2xl p-6"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <h3 className="font-black text-lg mb-4" style={{ color: '#1e293b' }}>📦 사건 종결 처리 ({ids.length}건)</h3>
                <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>종결 사유</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="종결 사유를 입력하세요..."
                    className="w-full px-3 py-2 rounded-lg text-sm resize-none mb-4"
                    style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: '#f1f5f9', color: '#64748b' }}>취소</button>
                    <button onClick={() => reason.trim() && onConfirm(reason)} className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
                        style={{ background: reason.trim() ? '#16a34a' : '#94a3b8' }}>종결 처리</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Slide-out Detail Panel ──
function DetailPanel({ lit, onClose, onUpdate }: { lit: LitigationCase; onClose: () => void; onUpdate: () => void }) {
    const [editNote, setEditNote] = useState(lit.notes || '');
    const [editResult, setEditResult] = useState(lit.result || '');
    const [editResultNote, setEditResultNote] = useState(lit.resultNote || '');
    const [saving, setSaving] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const { updateLitigation } = useLitigations();

    const saveNotes = () => {
        setSaving(true);
        updateLitigation(lit.id, { notes: editNote, result: editResult as LitigationCase['result'], resultNote: editResultNote });
        if (editNote.trim()) generateAiMemoSummary(lit.id, editNote);
        setTimeout(() => { setSaving(false); onUpdate(); }, 400);
    };

    const toggleDeadline = (d: LitigationDeadline) => {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const updatedDeadlines = lit.deadlines.map(x => x.id === d.id ? { ...x, completed: !x.completed, completedAt: !x.completed ? now : '' } : x);
        updateLitigation(lit.id, { deadlines: updatedDeadlines });
        onUpdate();
    };

    const changeStatus = (s: LitigationStatus) => {
        updateLitigation(lit.id, { status: s });
        onUpdate();
    };

    return (
        <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={onClose} />
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[520px] overflow-y-auto"
            style={{ background: '#ffffff', boxShadow: '-8px 0 30px rgba(0,0,0,0.1)' }}>
            <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#f1f5f9', color: '#64748b' }}>{lit.caseNo}</span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ background: LIT_STATUS_COLOR[lit.status], color: STATUS_TEXT_MAP[lit.status] }}>{LIT_STATUS_LABEL[lit.status]}</span>
                    </div>
                    <h2 className="font-black text-lg truncate" style={{ color: '#1e293b' }}><Building className="w-4 h-4 inline mr-1" style={{ color: '#2563eb' }} />{lit.companyName}</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" style={{ color: '#94a3b8' }} /></button>
            </div>
            <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { l: '소송유형', v: lit.type }, { l: '법원', v: lit.court },
                        { l: '등록일', v: lit.createdAt?.split('T')[0] || '—' }, { l: '담당변호사', v: lit.assignedLawyer },
                        { l: '청구금액', v: lit.claimAmount > 0 ? formatMoney(lit.claimAmount) : '—' },
                        { l: '다음 기일', v: lit.deadlines.filter(d => !d.completed)[0]?.dueDate || '—' },
                    ].map(({ l, v }) => (
                        <div key={l} className="p-3 rounded-xl" style={{ background: '#f8f9fc', border: '1px solid #f1f5f9' }}>
                            <p className="text-[10px] font-bold mb-0.5" style={{ color: '#94a3b8' }}>{l}</p>
                            <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{v}</p>
                        </div>
                    ))}
                </div>
                
                {/* Opponent info */}
                <div className="p-3 rounded-xl flex justify-between" style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
                    <div>
                        <p className="text-xs font-bold mb-1" style={{ color: '#be123c' }}>⚔️ 상대방</p>
                        <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{lit.opponent || '미상'}</p>
                    </div>
                </div>
                
                {/* Status Change */}
                <div>
                    <p className="text-xs font-bold mb-2" style={{ color: '#64748b' }}>⚡ 사건 상태</p>
                    <div className="flex flex-wrap gap-1">
                        {STATUSES.map(s => (
                            <button key={s} onClick={() => changeStatus(s)} className="text-[10px] px-2 py-1 rounded-full font-bold transition-all"
                                style={{ background: lit.status === s ? LIT_STATUS_COLOR[s] : '#f1f5f9', color: lit.status === s ? STATUS_TEXT_MAP[s] : '#64748b',
                                    border: `1px solid ${lit.status === s ? STATUS_TEXT_MAP[s] + '40' : '#e2e8f0'}` }}>{LIT_STATUS_LABEL[s]}</button>
                        ))}
                    </div>
                </div>
                {/* Deadlines */}
                <div>
                    <p className="text-xs font-bold mb-2" style={{ color: '#94a3b8' }}>📅 기한·일정 ({lit.deadlines.filter(d => d.completed).length}/{lit.deadlines.length})</p>
                    <div className="space-y-2">
                        {(lit.deadlines || []).map(d => {
                            const days = daysUntil(d.dueDate); const urgent = !d.completed && days <= 7; const overdue = !d.completed && days < 0;
                            return (
                                <button key={d.id} onClick={() => toggleDeadline(d)} className="flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left transition-all hover:scale-[1.01]"
                                    style={{ background: d.completed ? '#f0fdf4' : overdue ? '#fef2f2' : urgent ? '#fffbeb' : '#f8fafc',
                                        border: `1px solid ${d.completed ? '#86efac' : overdue ? '#fca5a5' : urgent ? '#fde68a' : '#e2e8f0'}` }}>
                                    {d.completed ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#16a34a' }} />
                                        : overdue ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#dc2626' }} />
                                        : urgent ? <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#d97706' }} />
                                        : <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />}
                                    <div className="flex-1 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: d.completed ? '#16a34a' : overdue ? '#dc2626' : '#1e293b' }}>
                                                {d.label}
                                            </p>
                                            <p className="text-[10px]" style={{ color: '#94a3b8' }}>{d.dueDate}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                {/* Documents */}
                {lit.documents && lit.documents.length > 0 && (
                    <div>
                        <p className="text-xs font-bold mb-2" style={{ color: '#94a3b8' }}>📄 문서 ({lit.documents.length})</p>
                        <div className="space-y-1">
                            {lit.documents.map(doc => (
                                <div key={doc.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0' }}>
                                    <FileText className="w-3 h-3" style={{ color: '#94a3b8' }} />
                                    <span className="text-xs flex-1 truncate" style={{ color: '#1e293b' }}>{doc.name}</span>
                                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>{doc.addedAt?.split('T')[0]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
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

                {/* Notes */}
                <div>
                    <p className="text-xs font-bold mb-1" style={{ color: '#64748b' }}>📝 사건 메모</p>
                    <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={4} className="w-full text-xs p-2.5 rounded-lg resize-none"
                        style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                </div>
                {/* Result */}
                <div>
                    <p className="text-xs font-bold mb-1" style={{ color: '#64748b' }}>🏆 결과</p>
                    <div className="flex gap-1 mb-2">
                        {(['', '승소', '패소', '합의', '취하', '각하'] as const).map(r => (
                            <button key={r} onClick={() => setEditResult(r)} className="text-[10px] px-2 py-1 rounded-lg font-bold transition-all"
                                style={{ background: editResult === r ? (r === '승소' ? '#dcfce7' : r === '패소' || r === '각하' ? '#fef2f2' : '#eff6ff') : '#f1f5f9',
                                    color: editResult === r ? (r === '승소' ? '#16a34a' : r === '패소' || r === '각하' ? '#dc2626' : '#2563eb') : '#64748b',
                                    border: `1px solid ${editResult === r ? '#d1d5db' : '#e2e8f0'}` }}>{r || '미정'}</button>
                        ))}
                    </div>
                    <textarea value={editResultNote} onChange={e => setEditResultNote(e.target.value)} rows={2} placeholder="결과 메모..."
                        className="w-full text-xs p-2.5 rounded-lg resize-none" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                </div>
                {/* Action buttons */}
                <div className="flex gap-2">
                    <button onClick={saveNotes} className="flex-1 text-sm py-2.5 rounded-xl font-bold"
                        style={{ background: saving ? '#dcfce7' : '#eff6ff', color: saving ? '#16a34a' : '#2563eb', border: `1px solid ${saving ? '#86efac' : '#bfdbfe'}` }}>
                        {saving ? '✓ 저장됨' : '💾 저장'}</button>
                    {lit.status !== 'closed' && <button onClick={() => setShowCloseModal(true)} className="text-sm px-4 py-2.5 rounded-xl font-bold"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}><Archive className="w-3.5 h-3.5 inline mr-1" />종결</button>}
                    {lit.status === 'closed' && <button onClick={() => { updateLitigation(lit.id, { status: 'preparing' }); onUpdate(); }} className="text-sm px-4 py-2.5 rounded-xl font-bold"
                        style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd' }}><RotateCcw className="w-3.5 h-3.5 inline mr-1" />복원</button>}
                </div>
            </div>
        </motion.div>
        <AnimatePresence>
            {showCloseModal && <CloseModal ids={[lit.id]} onClose={() => setShowCloseModal(false)}
                onConfirm={(reason) => { updateLitigation(lit.id, { status: 'closed', resultNote: reason }); setShowCloseModal(false); onUpdate(); }} />}
        </AnimatePresence>
        </>
    );
}

// ── Company Summary Card (sidebar) ──
function CompanySummaryCard({ companyId, companyName, cases, isActive, onClick }: { companyId: string, companyName: string, cases: LitigationCase[]; isActive: boolean; onClick: () => void }) {
    const active = cases.filter(c => c.status !== 'closed').length;
    return (
        <button onClick={onClick} className="p-3 rounded-xl text-left transition-all w-full"
            style={{ background: isActive ? '#eff6ff' : '#ffffff', border: `1.5px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
                boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.15)' : '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: isActive ? '#3b82f6' : '#e5e7eb', color: isActive ? '#ffffff' : '#64748b' }}>
                    <Building className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#1e293b' }}>{companyName}</p>
                </div>
            </div>
            <div className="flex gap-2 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#f0f4f8', color: '#475569' }}>{cases.length}건</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: active > 0 ? '#fff7ed' : '#f0fdf4', color: active > 0 ? '#ea580c' : '#16a34a' }}>진행 {active}</span>
            </div>
        </button>
    );
}

// ── Main Page ──
export default function LitigationPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const [cases, setCases] = useState<LitigationCase[]>([]);
    const [filterStatus, setFilterStatus] = useState<LitigationStatus | 'all'>('all');
    const [filterCompany, setFilterCompany] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
    const [caseTab, setCaseTab] = useState<'active' | 'closed'>('active');
    const [showAdd, setShowAdd] = useState(false);
    const [selectedCase, setSelectedCase] = useState<LitigationCase | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkClose, setShowBulkClose] = useState(false);
    const { updateLitigation } = useLitigations();

    const refresh = useCallback(() => {
        const allC = [...store.getLitAll()];
        setCases(allC);
        if (selectedCase) { const u = allC.find(c => c.id === selectedCase.id); u ? setSelectedCase(u) : setSelectedCase(null); }
    }, [selectedCase]);

    useEffect(() => { refresh(); const id = setInterval(refresh, 3000); return () => clearInterval(id); }, [refresh]);

    const activeCases = cases.filter(c => c.status !== 'closed');
    const closedCases = cases.filter(c => c.status === 'closed');
    const baseCases = caseTab === 'active' ? activeCases : closedCases;

    const filtered = baseCases
        .filter(c => filterStatus === 'all' || c.status === filterStatus)
        .filter(c => filterCompany === 'all' || c.companyId === filterCompany)
        .filter(c => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return c.caseNo.toLowerCase().includes(q) || c.companyName.toLowerCase().includes(q) || (c.opponent && c.opponent.toLowerCase().includes(q));
        });

    const uniqueCompaniesUnmapped = Array.from(new Set(cases.map(c => c.companyId)));
    const uniqueCompanies = uniqueCompaniesUnmapped.map(id => {
        const c = cases.find(x => x.companyId === id);
        return { id, name: c ? c.companyName : '알 수 없음' };
    });

    const totalCases = cases.length;
    const urgentDeadlines = activeCases.flatMap(c => (c.deadlines || []).filter(d => !d.completed && daysUntil(d.dueDate) <= 7));
    const totalClaim = cases.reduce((s, c) => s + c.claimAmount, 0);
    const statusCounts = STATUSES.reduce((a, s) => ({ ...a, [s]: baseCases.filter(c => c.status === s).length }), {} as Record<string, number>);
    const companyCases = uniqueCompanies.map(comp => ({ company: comp, cases: cases.filter(c => c.companyId === comp.id) }));
    
    const toggleSelect = (id: string) => { setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
    
    const handleBulkClose = (reason: string) => {
        selectedIds.forEach(id => {
            updateLitigation(id, { status: 'closed', resultNote: reason });
        });
        setShowBulkClose(false);
        refresh();
    };

    return (
        <div className={isEmbedded ? "pb-16 p-4 md:p-6" : "min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8"} style={{ background: isEmbedded ? 'transparent' : '#f8f9fc' }}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#1e293b' }}>
                            <Building className="w-6 h-6" style={{ color: '#2563eb' }} />기업 송무 관리
                        </h1>
                        <p className="text-sm mt-0.5 font-medium" style={{ color: '#475569' }}>
                            의뢰사 {uniqueCompanies.length}곳 · 총 {totalCases}건 · 진행중 {activeCases.length}건
                            {urgentDeadlines.length > 0 && <span style={{ color: '#d97706' }}> · ⚠ 긴급 기한 {urgentDeadlines.length}건</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && caseTab === 'active' && (
                            <button onClick={() => setShowBulkClose(true)} className="text-xs px-3 py-2 rounded-xl font-bold"
                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                <Archive className="w-3.5 h-3.5 inline mr-1" />일괄 종결 ({selectedIds.size})</button>
                        )}
                        <Button variant="premium" size="sm" onClick={() => window.alert("기능 준비중(임베디드 UI 대체 사용)")}><Plus className="w-4 h-4 mr-1" /> 신규 사건</Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <KpiCard icon={Briefcase} label="전체 사건" value={totalCases} sub={`진행 ${activeCases.length} / 종결 ${closedCases.length}`} accent="#2563eb" />
                    <KpiCard icon={AlertTriangle} label="긴급 기한" value={urgentDeadlines.length} sub="7일 이내 마감" accent="#ea580c" />
                    <KpiCard icon={TrendingUp} label="총 청구금액" value={formatMoney(totalClaim)} sub={`${cases.filter(c => c.claimAmount > 0).length}건 금전소송`} accent="#2563eb" />
                    <KpiCard icon={Building} label="총 의뢰사" value={`${uniqueCompanies.length}개사`} sub="현재 사건을 진행 중인 사업체" accent="#10b981" />
                </div>

                {/* Active/Closed tabs */}
                <div className="mb-4 flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9', display: 'inline-flex' }}>
                    {[{ k: 'active' as const, l: `진행중 (${activeCases.length})`, icon: Scale },
                      { k: 'closed' as const, l: `종결 (${closedCases.length})`, icon: Archive }].map(({ k, l, icon: Icon }) => (
                        <button key={k} onClick={() => { setCaseTab(k); setFilterStatus('all'); setSelectedIds(new Set()); }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                            style={{ background: caseTab === k ? '#ffffff' : 'transparent', color: caseTab === k ? '#1e293b' : '#64748b',
                                boxShadow: caseTab === k ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                            <Icon className="w-3.5 h-3.5" />{l}</button>
                    ))}
                </div>

                {/* Search + View toggle */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="사건번호, 기업명, 상대방 검색..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                    </div>
                    <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                        <button onClick={() => setViewMode('card')} className="px-3 py-2" style={{ background: viewMode === 'card' ? '#eff6ff' : '#ffffff', color: viewMode === 'card' ? '#2563eb' : '#94a3b8' }}>
                            <LayoutGrid className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('list')} className="px-3 py-2" style={{ background: viewMode === 'list' ? '#eff6ff' : '#ffffff', color: viewMode === 'list' ? '#2563eb' : '#94a3b8' }}>
                            <List className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Status filter pills */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                    {[{ v: 'all', l: `전체 ${baseCases.length}` }, ...STATUSES.filter(s => caseTab === 'active' ? s !== 'closed' : s === 'closed')
                        .map(s => ({ v: s, l: `${LIT_STATUS_LABEL[s]} ${statusCounts[s] || 0}` }))].map(item => (
                        <button key={item.v} onClick={() => setFilterStatus(item.v as LitigationStatus | 'all')}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                            style={{ background: filterStatus === item.v ? '#eff6ff' : '#ffffff', color: filterStatus === item.v ? '#2563eb' : '#475569',
                                border: `1px solid ${filterStatus === item.v ? '#bfdbfe' : '#d1d5db'}` }}>{item.l}</button>
                    ))}
                </div>

                {/* Main layout with sidebar */}
                <div className="flex gap-5">
                    {/* Sidebar: company cards */}
                    <div className="hidden lg:block w-56 flex-shrink-0 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>
                            <Building className="w-3.5 h-3.5 inline mr-1" /> 의뢰사 ({uniqueCompanies.length})</p>
                        <button onClick={() => setFilterCompany('all')} className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left transition-all"
                            style={{ background: filterCompany === 'all' ? '#eff6ff' : '#ffffff', color: filterCompany === 'all' ? '#2563eb' : '#475569',
                                border: `1.5px solid ${filterCompany === 'all' ? '#3b82f6' : '#e5e7eb'}` }}>전체 보기 ({totalCases}건)</button>
                        {companyCases.map(({ company, cases: cc }) => (
                            <CompanySummaryCard key={company.id} companyId={company.id} companyName={company.name} cases={cc} isActive={filterCompany === company.id}
                                onClick={() => setFilterCompany(filterCompany === company.id ? 'all' : company.id)} />
                        ))}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile company filter */}
                        <div className="lg:hidden mb-4">
                            <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-sm font-bold" style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                                <option value="all">전체 의뢰사 ({totalCases}건)</option>
                                {uniqueCompanies.map(c => <option key={c.id} value={c.id}>{c.name} ({cases.filter(x => x.companyId === c.id).length}건)</option>)}
                            </select>
                        </div>

                        {/* Case Grid/List */}
                        {viewMode === 'card' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <AnimatePresence>
                                    {filtered.map(lit => {
                                        const urgentDl = (lit.deadlines || []).filter(d => !d.completed && daysUntil(d.dueDate) <= 7);
                                        const doneCount = (lit.deadlines || []).filter(d => d.completed).length;
                                        const totalDeadlines = (lit.deadlines || []).length;
                                        return (
                                            <motion.div key={lit.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} layout
                                                className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md"
                                                style={{ border: selectedIds.has(lit.id) ? '2px solid #2563eb' : '1px solid #e5e7eb', background: '#ffffff' }}
                                                onClick={() => setSelectedCase(lit)}>
                                                <div className="px-4 py-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                                {caseTab === 'active' && <input type="checkbox" checked={selectedIds.has(lit.id)} onClick={e => e.stopPropagation()} onChange={() => toggleSelect(lit.id)} className="w-3.5 h-3.5 rounded accent-blue-600" />}
                                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#f1f5f9', color: '#64748b' }}>{lit.caseNo}</span>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                                    style={{ background: LIT_STATUS_COLOR[lit.status], color: STATUS_TEXT_MAP[lit.status] }}>
                                                                    {LIT_STATUS_LABEL[lit.status]}</span>
                                                                {urgentDl.length > 0 && <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                                                    style={{ background: '#fffbeb', color: '#d97706' }}><AlertTriangle className="w-2.5 h-2.5" /> D-{Math.min(...urgentDl.map(d => daysUntil(d.dueDate)))}</span>}
                                                            </div>
                                                            <h3 className="font-black text-sm truncate" style={{ color: '#1e293b' }}>
                                                                <Building className="w-3 h-3 inline mr-1" style={{ color: '#2563eb' }} />{lit.companyName}</h3>
                                                            <p className="text-xs truncate" style={{ color: '#64748b' }}>{lit.type} · vs {lit.opponent || '미상'}</p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            {lit.claimAmount > 0 && <p className="text-sm font-black" style={{ color: '#1e40af' }}>{formatMoney(lit.claimAmount)}</p>}
                                                            <p className="text-[10px]" style={{ color: '#94a3b8' }}>{lit.court}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="flex-1 h-1 rounded-full" style={{ background: '#e5e7eb' }}>
                                                            <div className="h-1 rounded-full" style={{ width: `${totalDeadlines > 0 ? (doneCount / totalDeadlines) * 100 : 0}%`, background: 'linear-gradient(90deg,#60a5fa,#2563eb)' }} />
                                                        </div>
                                                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>{doneCount}/{totalDeadlines} 완료</span>
                                                        <ChevronRight className="w-3.5 h-3.5" style={{ color: '#cbd5e1' }} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}>
                                <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold uppercase" style={{ background: '#f8f9fc', color: '#94a3b8', borderBottom: '1px solid #e5e7eb' }}>
                                    {caseTab === 'active' && <div className="col-span-1"></div>}
                                    <div className={caseTab === 'active' ? 'col-span-2' : 'col-span-3'}>사건번호</div>
                                    <div className="col-span-3">의뢰사/상대방</div>
                                    <div className="col-span-2">소송유형</div>
                                    <div className="col-span-2">상태</div>
                                    <div className="col-span-2">청구액</div>
                                </div>
                                {filtered.map(lit => (
                                    <div key={lit.id} onClick={() => setSelectedCase(lit)}
                                        className="grid grid-cols-12 gap-2 px-4 py-3 items-center cursor-pointer transition-all hover:bg-slate-50"
                                        style={{ borderBottom: '1px solid #f1f5f9', background: selectedIds.has(lit.id) ? '#eff6ff' : 'transparent' }}>
                                        {caseTab === 'active' && <div className="col-span-1"><input type="checkbox" checked={selectedIds.has(lit.id)} onClick={e => e.stopPropagation()} onChange={() => toggleSelect(lit.id)} className="w-3.5 h-3.5 rounded accent-blue-600" /></div>}
                                        <div className={caseTab === 'active' ? 'col-span-2' : 'col-span-3'}><span className="text-xs font-mono" style={{ color: '#64748b' }}>{lit.caseNo}</span></div>
                                        <div className="col-span-3">
                                            <p className="text-xs font-bold truncate" style={{ color: '#1e293b' }}>{lit.companyName}</p>
                                            <p className="text-[10px] truncate" style={{ color: '#94a3b8' }}>vs {lit.opponent || '미상'}</p>
                                        </div>
                                        <div className="col-span-2"><p className="text-xs truncate" style={{ color: '#64748b' }}>{lit.type}</p></div>
                                        <div className="col-span-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: LIT_STATUS_COLOR[lit.status], color: STATUS_TEXT_MAP[lit.status] }}>{LIT_STATUS_LABEL[lit.status]}</span></div>
                                        <div className="col-span-2"><span className="text-xs font-bold" style={{ color: '#1e40af' }}>{lit.claimAmount > 0 ? formatMoney(lit.claimAmount) : '—'}</span></div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {filtered.length === 0 && (
                            <div className="text-center py-16" style={{ background: '#ffffff', borderRadius: '1rem', border: '1px solid #e5e7eb' }}>
                                <Scale className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: '#94a3b8' }} />
                                <p className="font-medium" style={{ color: '#64748b' }}>조건에 맞는 사건이 없습니다</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sub Modals & Slide-overs */}
            <AnimatePresence>
                {selectedCase && <DetailPanel lit={selectedCase} onClose={() => setSelectedCase(null)} onUpdate={refresh} />}
                {showBulkClose && <CloseModal ids={Array.from(selectedIds)} onClose={() => setShowBulkClose(false)} onConfirm={handleBulkClose} />}
            </AnimatePresence>
        </div>
    );
}
