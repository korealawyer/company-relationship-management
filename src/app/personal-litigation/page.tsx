'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, Plus, X, CheckCircle2, Clock, AlertTriangle,
    ChevronDown, ChevronUp, Calendar, FileText, User, Phone,
    Mail, MapPin, Gavel, DollarSign, Users, TrendingUp,
    Briefcase, Filter, ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    personalStore,
    PersonalLitigation, PersonalLitStatus, PersonalClient,
    PERSONAL_LIT_STATUS_LABEL, PERSONAL_LIT_STATUS_COLOR, PERSONAL_LIT_STATUS_TEXT,
    PERSONAL_LIT_STATUSES, PERSONAL_LIT_TYPES, PersonalLitType,
    LAWYERS, COURTS,
} from '@/lib/mockStore';

// ── 유틸 ──────────────────────────────────────────────────────
function daysUntil(dateStr: string) {
    if (!dateStr) return 999;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
}
function formatMoney(v: number) {
    if (v === 0) return '—';
    if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억원`;
    if (v >= 10000) return `${(v / 10000).toLocaleString()}만원`;
    return `${v.toLocaleString()}원`;
}

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, accent }: {
    icon: React.ElementType; label: string; value: string | number;
    sub?: string; accent: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5"
            style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
                    <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <div>
                    <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>{label}</p>
                    <p className="text-xl font-black" style={{ color: '#1e293b' }}>{value}</p>
                    {sub && <p className="text-[10px] font-medium" style={{ color: accent }}>{sub}</p>}
                </div>
            </div>
        </motion.div>
    );
}

// ── Deadline Badge ────────────────────────────────────────────
function DeadlineBadge({ d, onToggle }: { d: PersonalLitigation['deadlines'][0]; onToggle: () => void }) {
    const days = daysUntil(d.dueDate);
    const urgent = !d.completed && days <= 7;
    const overdue = !d.completed && days < 0;
    return (
        <button onClick={onToggle} className="flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left transition-all hover:scale-[1.01]"
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
        </button>
    );
}

// ── Case Card ─────────────────────────────────────────────────
function CaseCard({ lit, onRefresh }: { lit: PersonalLitigation; onRefresh: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const [editNote, setEditNote] = useState(lit.notes);
    const [editResult, setEditResult] = useState(lit.result);
    const [editResultNote, setEditResultNote] = useState(lit.resultNote);
    const [saving, setSaving] = useState(false);

    const urgentDeadlines = lit.deadlines.filter(d => !d.completed && daysUntil(d.dueDate) <= 7);
    const doneCount = lit.deadlines.filter(d => d.completed).length;

    const saveAll = () => {
        setSaving(true);
        personalStore.update(lit.id, {
            notes: editNote,
            result: editResult as PersonalLitigation['result'],
            resultNote: editResultNote,
        });
        setTimeout(() => { setSaving(false); onRefresh(); }, 400);
    };

    const changeStatus = (s: PersonalLitStatus) => {
        personalStore.update(lit.id, { status: s });
        onRefresh();
    };

    const toggleDeadline = (d: PersonalLitigation['deadlines'][0]) => {
        personalStore.toggleDeadline(lit.id, d.id);
        onRefresh();
    };

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} layout>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e7eb', background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {/* 헤더 */}
                <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                    {lit.caseNo}
                                </span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                    style={{ background: PERSONAL_LIT_STATUS_COLOR[lit.status], color: PERSONAL_LIT_STATUS_TEXT[lit.status] }}>
                                    {PERSONAL_LIT_STATUS_LABEL[lit.status]}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                    style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd' }}>
                                    {lit.role}
                                </span>
                                {urgentDeadlines.length > 0 && (
                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                                        <AlertTriangle className="w-3 h-3" /> D-{Math.min(...urgentDeadlines.map(d => daysUntil(d.dueDate)))}
                                    </span>
                                )}
                                {lit.result && (
                                    <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                                        style={{
                                            background: lit.result === '승소' || lit.result === '일부승소' ? '#dcfce7' : lit.result === '패소' || lit.result === '각하' ? '#fef2f2' : '#fffbeb',
                                            color: lit.result === '승소' || lit.result === '일부승소' ? '#16a34a' : lit.result === '패소' || lit.result === '각하' ? '#dc2626' : '#b8960a',
                                        }}>
                                        {lit.result}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-black text-base" style={{ color: '#1e293b' }}>
                                <span className="inline-flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" style={{ color: '#c9a84c' }} />
                                    {lit.clientName}
                                </span>
                            </h3>
                            <p className="text-sm" style={{ color: '#64748b' }}>{lit.type} · vs {lit.opponent}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            {lit.claimAmount > 0 && (
                                <p className="text-lg font-black" style={{ color: '#b8960a' }}>
                                    {formatMoney(lit.claimAmount)}
                                </p>
                            )}
                            <p className="text-xs" style={{ color: '#94a3b8' }}>{lit.court}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#7c3aed' }}>{lit.assignedLawyer}</p>
                            {lit.nextHearingDate && (
                                <p className="text-[10px] mt-1 font-bold" style={{ color: '#ea580c' }}>
                                    다음 기일: {lit.nextHearingDate}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 기한 프로그레스 */}
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: '#e5e7eb' }}>
                            <div className="h-1.5 rounded-full transition-all"
                                style={{ width: `${lit.deadlines.length > 0 ? (doneCount / lit.deadlines.length) * 100 : 0}%`, background: 'linear-gradient(90deg,#c9a84c,#e8c87a)' }} />
                        </div>
                        <span className="text-xs" style={{ color: '#94a3b8' }}>{doneCount}/{lit.deadlines.length}</span>
                        {/* 비용 미리보기 */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            💰 {formatMoney(lit.legalFee + lit.courtFee)}
                        </span>
                        <button onClick={() => setExpanded(e => !e)} className="p-1 rounded-lg transition-all hover:bg-slate-100"
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
                            <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4" style={{ background: '#f8f9fc' }}>
                                {/* Col 1: 기한 */}
                                <div>
                                    <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                                        📅 기한·일정
                                    </p>
                                    <div className="space-y-2">
                                        {lit.deadlines.map(d => (
                                            <DeadlineBadge key={d.id} d={d} onToggle={() => toggleDeadline(d)} />
                                        ))}
                                        {lit.deadlines.length === 0 && (
                                            <p className="text-xs" style={{ color: '#94a3b8' }}>기한이 없습니다</p>
                                        )}
                                    </div>

                                    {/* 문서 목록 */}
                                    {lit.documents.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-xs font-bold mb-2" style={{ color: '#94a3b8' }}>
                                                📄 문서 ({lit.documents.length})
                                            </p>
                                            <div className="space-y-1">
                                                {lit.documents.map(doc => (
                                                    <div key={doc.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                                                        <FileText className="w-3 h-3" style={{ color: '#94a3b8' }} />
                                                        <span className="text-xs flex-1 truncate" style={{ color: '#1e293b' }}>{doc.name}</span>
                                                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>{doc.addedAt}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Col 2: 상태·비용 */}
                                <div>
                                    <p className="text-xs font-bold mb-2" style={{ color: '#64748b' }}>⚡ 사건 상태</p>
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {PERSONAL_LIT_STATUSES.map(s => (
                                            <button key={s}
                                                onClick={() => changeStatus(s)}
                                                className="text-[10px] px-2 py-1 rounded-full font-bold transition-all"
                                                style={{
                                                    background: lit.status === s ? PERSONAL_LIT_STATUS_COLOR[s] : '#f1f5f9',
                                                    color: lit.status === s ? PERSONAL_LIT_STATUS_TEXT[s] : '#64748b',
                                                    border: `1px solid ${lit.status === s ? PERSONAL_LIT_STATUS_TEXT[s] + '40' : '#e2e8f0'}`,
                                                }}>
                                                {PERSONAL_LIT_STATUS_LABEL[s]}
                                            </button>
                                        ))}
                                    </div>

                                    {/* 상대방 정보 */}
                                    <div className="mb-4 p-3 rounded-xl" style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
                                        <p className="text-xs font-bold mb-1" style={{ color: '#be123c' }}>⚔️ 상대방</p>
                                        <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{lit.opponent}</p>
                                        {lit.opponentLawyer && (
                                            <p className="text-xs" style={{ color: '#64748b' }}>대리인: {lit.opponentLawyer}</p>
                                        )}
                                    </div>

                                    {/* 비용 */}
                                    <div className="p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                        <p className="text-xs font-bold mb-2" style={{ color: '#16a34a' }}>💰 비용</p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span style={{ color: '#64748b' }}>수임료</span>
                                                <span className="font-bold" style={{ color: '#1e293b' }}>{formatMoney(lit.legalFee)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span style={{ color: '#64748b' }}>인지대/송달료</span>
                                                <span className="font-bold" style={{ color: '#1e293b' }}>{formatMoney(lit.courtFee)}</span>
                                            </div>
                                            <div className="border-t pt-1 mt-1 flex justify-between text-xs" style={{ borderColor: '#bbf7d0' }}>
                                                <span className="font-bold" style={{ color: '#16a34a' }}>합계</span>
                                                <span className="font-black" style={{ color: '#16a34a' }}>{formatMoney(lit.legalFee + lit.courtFee)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 3: 메모·결과 */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-bold mb-1" style={{ color: '#64748b' }}>📝 사건 메모</p>
                                        <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={4}
                                            className="w-full text-xs p-2.5 rounded-lg resize-none"
                                            style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold mb-1" style={{ color: '#64748b' }}>🏆 결과</p>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {['', '승소', '일부승소', '패소', '합의', '취하', '각하'].map(r => (
                                                <button key={r}
                                                    onClick={() => setEditResult(r as PersonalLitigation['result'])}
                                                    className="text-[10px] px-2 py-1 rounded-lg font-bold transition-all"
                                                    style={{
                                                        background: editResult === r ? (r === '승소' || r === '일부승소' ? '#dcfce7' : r === '패소' || r === '각하' ? '#fef2f2' : '#fffbeb') : '#f1f5f9',
                                                        color: editResult === r ? (r === '승소' || r === '일부승소' ? '#16a34a' : r === '패소' || r === '각하' ? '#dc2626' : '#b8960a') : '#64748b',
                                                        border: `1px solid ${editResult === r ? '#d1d5db' : '#e2e8f0'}`,
                                                    }}>{r || '미정'}</button>
                                            ))}
                                        </div>
                                        <textarea value={editResultNote} onChange={e => setEditResultNote(e.target.value)} rows={2}
                                            placeholder="결과 메모..."
                                            className="w-full text-xs p-2.5 rounded-lg resize-none"
                                            style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                    <button onClick={saveAll}
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

// ── 신규 사건 등록 모달 ───────────────────────────────────────
function AddCaseModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
    const clients = personalStore.getClients();
    const [isNewClient, setIsNewClient] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', birthYear: 1990, address: '', memo: '' });
    const [form, setForm] = useState({
        clientId: clients[0]?.id ?? '',
        caseNo: '', court: COURTS[0], type: PERSONAL_LIT_TYPES[0] as PersonalLitType,
        role: '원고' as PersonalLitigation['role'],
        opponent: '', opponentLawyer: '',
        claimAmount: '', assignedLawyer: LAWYERS[0],
        legalFee: '', courtFee: '', notes: '', nextHearingDate: '',
    });
    const [deadlines, setDeadlines] = useState<{ label: string; dueDate: string }[]>([
        { label: '소장 접수', dueDate: '' },
    ]);

    const handleAdd = () => {
        let clientId = form.clientId;
        let clientName = clients.find(c => c.id === clientId)?.name ?? '';

        if (isNewClient && newClient.name) {
            const nc = personalStore.addClient(newClient);
            clientId = nc.id;
            clientName = nc.name;
        }

        personalStore.add({
            clientId, clientName,
            caseNo: form.caseNo, court: form.court,
            type: form.type, role: form.role,
            opponent: form.opponent, opponentLawyer: form.opponentLawyer,
            claimAmount: parseInt(form.claimAmount.replace(/,/g, '')) || 0,
            status: 'consulting', assignedLawyer: form.assignedLawyer,
            deadlines: deadlines.filter(d => d.label && d.dueDate).map((d, i) => ({
                id: `pd${Date.now()}-${i}`, ...d, completed: false, completedAt: '',
            })),
            documents: [],
            notes: form.notes,
            result: '', resultNote: '',
            legalFee: parseInt((form.legalFee || '0').replace(/,/g, '')) || 0,
            courtFee: parseInt((form.courtFee || '0').replace(/,/g, '')) || 0,
            nextHearingDate: form.nextHearingDate,
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
                    <h2 className="font-black text-lg" style={{ color: '#1e293b' }}>⚖️ 개인 소송 등록</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100" style={{ color: '#94a3b8' }}><X className="w-5 h-5" /></button>
                </div>

                {/* 의뢰인 선택 */}
                <div className="mb-4 p-4 rounded-xl" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-3 mb-3">
                        <p className="text-xs font-bold" style={{ color: '#c9a84c' }}>👤 의뢰인</p>
                        <button onClick={() => setIsNewClient(!isNewClient)}
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: isNewClient ? '#dbeafe' : '#f1f5f9', color: isNewClient ? '#2563eb' : '#64748b', border: `1px solid ${isNewClient ? '#93c5fd' : '#e2e8f0'}` }}>
                            {isNewClient ? '기존 의뢰인 선택' : '+ 신규 의뢰인'}
                        </button>
                    </div>
                    {isNewClient ? (
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { k: 'name', l: '이름', p: '홍길동' },
                                { k: 'phone', l: '연락처', p: '010-0000-0000' },
                                { k: 'email', l: '이메일', p: 'email@email.com' },
                                { k: 'address', l: '주소', p: '서울시 강남구' },
                            ].map(f => (
                                <div key={f.k}>
                                    <label className="text-[10px] font-bold mb-0.5 block" style={{ color: '#64748b' }}>{f.l}</label>
                                    <input value={newClient[f.k as keyof typeof newClient] as string}
                                        onChange={e => setNewClient(p => ({ ...p, [f.k]: e.target.value }))}
                                        placeholder={f.p} className="w-full px-2 py-1.5 rounded-lg text-xs"
                                        style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                        </select>
                    )}
                </div>

                {/* 사건 정보 */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { k: 'caseNo', l: '사건번호', p: '2026가합12345' },
                        { k: 'opponent', l: '상대방', p: '홍○○ / ○○건설' },
                        { k: 'opponentLawyer', l: '상대방 대리인', p: '법무법인 ○○' },
                        { k: 'claimAmount', l: '청구금액 (원)', p: '50000000' },
                        { k: 'legalFee', l: '수임료 (원)', p: '3000000' },
                        { k: 'courtFee', l: '인지대/송달료 (원)', p: '500000' },
                    ].map(f => (
                        <div key={f.k}>
                            <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>{f.l}</label>
                            <input value={form[f.k as keyof typeof form] as string}
                                onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                                placeholder={f.p} className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                        </div>
                    ))}
                    {[
                        { k: 'court', l: '법원', opts: COURTS.map(c => ({ v: c, l: c })) },
                        { k: 'type', l: '소송 유형', opts: PERSONAL_LIT_TYPES.map(t => ({ v: t, l: t })) },
                        { k: 'role', l: '소송상 지위', opts: ['원고', '피고', '고소인', '피고소인', '신청인', '피신청인'].map(r => ({ v: r, l: r })) },
                        { k: 'assignedLawyer', l: '담당 변호사', opts: LAWYERS.map(l => ({ v: l, l })) },
                    ].map(f => (
                        <div key={f.k}>
                            <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>{f.l}</label>
                            <select value={form[f.k as keyof typeof form] as string}
                                onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                                {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                            </select>
                        </div>
                    ))}
                    <div>
                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>다음 기일</label>
                        <input type="date" value={form.nextHearingDate}
                            onChange={e => setForm(p => ({ ...p, nextHearingDate: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                    </div>
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

// ── 의뢰인 요약 카드 ─────────────────────────────────────────
function ClientSummaryCard({ client, cases, isActive, onClick }: {
    client: PersonalClient; cases: PersonalLitigation[];
    isActive: boolean; onClick: () => void;
}) {
    const active = cases.filter(c => c.status !== 'closed').length;
    const totalFee = cases.reduce((s, c) => s + c.legalFee + c.courtFee, 0);
    return (
        <button onClick={onClick}
            className="p-3 rounded-xl text-left transition-all w-full"
            style={{
                background: isActive ? '#fffbeb' : '#ffffff',
                border: `1.5px solid ${isActive ? '#c9a84c' : '#e5e7eb'}`,
                boxShadow: isActive ? '0 2px 8px rgba(201,168,76,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
            }}>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: isActive ? '#c9a84c' : '#e5e7eb', color: isActive ? '#ffffff' : '#64748b' }}>
                    {client.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#1e293b' }}>{client.name}</p>
                    <p className="text-[10px]" style={{ color: '#94a3b8' }}>{client.phone}</p>
                </div>
            </div>
            <div className="flex gap-2 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#f0f4f8', color: '#475569' }}>
                    {cases.length}건
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: active > 0 ? '#fff7ed' : '#f0fdf4', color: active > 0 ? '#ea580c' : '#16a34a' }}>
                    진행 {active}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                    {formatMoney(totalFee)}
                </span>
            </div>
        </button>
    );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function PersonalLitigationPage() {
    const [cases, setCases] = useState<PersonalLitigation[]>([]);
    const [clients, setClients] = useState<PersonalClient[]>([]);
    const [filterStatus, setFilterStatus] = useState<PersonalLitStatus | 'all'>('all');
    const [filterClient, setFilterClient] = useState<string>('all');
    const [showAdd, setShowAdd] = useState(false);

    const refresh = useCallback(() => {
        setCases([...personalStore.getAll()]);
        setClients([...personalStore.getClients()]);
    }, []);

    useEffect(() => { refresh(); const id = setInterval(refresh, 3000); return () => clearInterval(id); }, [refresh]);

    // 필터링
    const filtered = cases
        .filter(c => filterStatus === 'all' || c.status === filterStatus)
        .filter(c => filterClient === 'all' || c.clientId === filterClient);

    // KPI 계산
    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status !== 'closed').length;
    const urgentDeadlines = cases.flatMap(c => c.deadlines.filter(d => !d.completed && daysUntil(d.dueDate) <= 7));
    const totalCost = cases.reduce((s, c) => s + c.legalFee + c.courtFee, 0);
    const totalClaim = cases.reduce((s, c) => s + c.claimAmount, 0);
    const statusCounts = PERSONAL_LIT_STATUSES.reduce((a, s) => ({ ...a, [s]: cases.filter(c => c.status === s).length }), {} as Record<string, number>);

    // 의뢰인별 사건 그룹
    const clientCases = clients.map(cl => ({
        client: cl,
        cases: cases.filter(c => c.clientId === cl.id),
    }));

    return (
        <div className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8" style={{ background: '#f8f9fc' }}>
            <div className="max-w-6xl mx-auto">

                {/* 헤더 */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#1e293b' }}>
                            <Scale className="w-6 h-6" style={{ color: '#c9a84c' }} />
                            개인 소송 관리
                        </h1>
                        <p className="text-sm mt-0.5 font-medium" style={{ color: '#475569' }}>
                            의뢰인 {clients.length}명 · 총 {totalCases}건 · 진행중 {activeCases}건
                            {urgentDeadlines.length > 0 && <span style={{ color: '#d97706' }}> · ⚠ 긴급 기한 {urgentDeadlines.length}건</span>}
                        </p>
                    </div>
                    <Button variant="premium" size="sm" onClick={() => setShowAdd(true)}>
                        <Plus className="w-4 h-4 mr-1" /> 신규 사건
                    </Button>
                </div>

                {/* KPI 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <KpiCard icon={Briefcase} label="전체 사건" value={totalCases}
                        sub={`진행 ${activeCases} / 종결 ${totalCases - activeCases}`} accent="#c9a84c" />
                    <KpiCard icon={AlertTriangle} label="긴급 기한" value={urgentDeadlines.length}
                        sub="7일 이내 마감" accent="#ea580c" />
                    <KpiCard icon={TrendingUp} label="총 청구금액" value={formatMoney(totalClaim)}
                        sub={`${cases.filter(c => c.claimAmount > 0).length}건 금전소송`} accent="#2563eb" />
                    <KpiCard icon={DollarSign} label="총 비용" value={formatMoney(totalCost)}
                        sub={`수임료 ${formatMoney(cases.reduce((s, c) => s + c.legalFee, 0))}`} accent="#16a34a" />
                </div>

                {/* 긴급 기한 배너 */}
                {urgentDeadlines.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
                        <div className="rounded-xl p-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4" style={{ color: '#d97706' }} />
                                <span className="text-sm font-black" style={{ color: '#d97706' }}>⚠ 7일 이내 기한 {urgentDeadlines.length}건</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {cases.flatMap(c => c.deadlines
                                    .filter(d => !d.completed && daysUntil(d.dueDate) <= 7)
                                    .map(d => {
                                        const overdue = daysUntil(d.dueDate) < 0;
                                        return (
                                            <div key={d.id} className="px-3 py-1.5 rounded-lg"
                                                style={{ background: overdue ? '#fef2f2' : '#fef3c7', border: `1px solid ${overdue ? '#fca5a5' : '#fde68a'}` }}>
                                                <p className="text-xs font-bold" style={{ color: overdue ? '#dc2626' : '#92400e' }}>{c.clientName}</p>
                                                <p className="text-[10px] font-semibold" style={{ color: overdue ? '#dc2626' : '#92400e' }}>
                                                    {d.label} · {d.dueDate}
                                                    {overdue ? ` (D+${Math.abs(daysUntil(d.dueDate))})` : ` (D-${daysUntil(d.dueDate)})`}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 본문 레이아웃: 사이드바 (의뢰인) + 메인 (사건 목록) */}
                <div className="flex gap-5">
                    {/* 사이드: 의뢰인 카드 */}
                    <div className="hidden lg:block w-56 flex-shrink-0 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>
                            <Users className="w-3.5 h-3.5 inline mr-1" /> 의뢰인 ({clients.length})
                        </p>
                        <button onClick={() => setFilterClient('all')}
                            className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left transition-all"
                            style={{
                                background: filterClient === 'all' ? '#fffbeb' : '#ffffff',
                                color: filterClient === 'all' ? '#b8960a' : '#475569',
                                border: `1.5px solid ${filterClient === 'all' ? '#c9a84c' : '#e5e7eb'}`,
                            }}>
                            전체 보기 ({totalCases}건)
                        </button>
                        {clientCases.map(({ client, cases: cc }) => (
                            <ClientSummaryCard key={client.id} client={client} cases={cc}
                                isActive={filterClient === client.id}
                                onClick={() => setFilterClient(filterClient === client.id ? 'all' : client.id)} />
                        ))}
                    </div>

                    {/* 메인 콘텐츠 */}
                    <div className="flex-1 min-w-0">
                        {/* 모바일 의뢰인 필터 */}
                        <div className="lg:hidden mb-4">
                            <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-sm font-bold"
                                style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                                <option value="all">전체 의뢰인 ({totalCases}건)</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({cases.filter(x => x.clientId === c.id).length}건)</option>)}
                            </select>
                        </div>

                        {/* 상태 필터 */}
                        <div className="mb-4 flex flex-wrap gap-1.5">
                            {[{ v: 'all', l: `전체 ${cases.length}` }, ...PERSONAL_LIT_STATUSES.map(s => ({ v: s, l: `${PERSONAL_LIT_STATUS_LABEL[s]} ${statusCounts[s] || 0}` }))].map(item => {
                                const active = filterStatus === item.v;
                                return (
                                    <button key={item.v}
                                        onClick={() => setFilterStatus(item.v as PersonalLitStatus | 'all')}
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
                                    <CaseCard key={lit.id} lit={lit} onRefresh={refresh} />
                                ))}
                            </AnimatePresence>
                            {filtered.length === 0 && (
                                <div className="text-center py-16" style={{ color: '#94a3b8' }}>
                                    <Scale className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">해당 조건의 사건이 없습니다</p>
                                    <p className="text-xs mt-1">신규 사건을 등록하거나 필터를 변경해보세요</p>
                                </div>
                            )}
                        </div>
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
