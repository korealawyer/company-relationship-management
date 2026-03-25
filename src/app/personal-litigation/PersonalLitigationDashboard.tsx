'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, Plus, X, CheckCircle2, Clock, AlertTriangle, DollarSign,
    ChevronDown, ChevronUp, Calendar, FileText, User, Users,
    Gavel, Search, LayoutGrid, List, Filter, RotateCcw, TrendingUp,
    ChevronRight, Archive, Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    personalStore, PersonalLitigation, PersonalLitStatus, PersonalClient,
    PersonalLitType, PersonalLitDeadline,
    PERSONAL_LIT_STATUS_LABEL, PERSONAL_LIT_STATUS_COLOR, PERSONAL_LIT_STATUS_TEXT,
    PERSONAL_LIT_STATUSES, PERSONAL_LIT_TYPES, LAWYERS, COURTS,
} from '@/lib/mockStore';

const formatMoney = (n: number) => n >= 100000000 ? `${(n / 100000000).toFixed(1)}억` : n >= 10000 ? `${(n / 10000).toFixed(0)}만원` : `${n.toLocaleString()}원`;
function daysUntil(dateStr: string) { return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000); }

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
function DetailPanel({ lit, onClose, onUpdate }: { lit: PersonalLitigation; onClose: () => void; onUpdate: () => void }) {
    const [editNote, setEditNote] = useState(lit.notes);
    const [editResult, setEditResult] = useState(lit.result);
    const [editResultNote, setEditResultNote] = useState(lit.resultNote);
    const [saving, setSaving] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);

    const saveNotes = () => {
        setSaving(true);
        personalStore.update(lit.id, { notes: editNote, result: editResult as PersonalLitigation['result'], resultNote: editResultNote });
        setTimeout(() => { setSaving(false); onUpdate(); }, 400);
    };
    const toggleDeadline = (d: PersonalLitDeadline) => { personalStore.toggleDeadline(lit.id, d.id); onUpdate(); };
    const changeStatus = (s: PersonalLitStatus) => { personalStore.update(lit.id, { status: s }); onUpdate(); };

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
                            style={{ background: PERSONAL_LIT_STATUS_COLOR[lit.status], color: PERSONAL_LIT_STATUS_TEXT[lit.status] }}>{PERSONAL_LIT_STATUS_LABEL[lit.status]}</span>
                    </div>
                    <h2 className="font-black text-lg truncate" style={{ color: '#1e293b' }}><User className="w-4 h-4 inline mr-1" style={{ color: '#2563eb' }} />{lit.clientName}</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" style={{ color: '#94a3b8' }} /></button>
            </div>
            <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { l: '소송유형', v: lit.type }, { l: '법원', v: lit.court },
                        { l: '소송상 지위', v: lit.role }, { l: '담당변호사', v: lit.assignedLawyer },
                        { l: '청구금액', v: lit.claimAmount > 0 ? formatMoney(lit.claimAmount) : '—' },
                        { l: '다음 기일', v: lit.nextHearingDate || '—' },
                    ].map(({ l, v }) => (
                        <div key={l} className="p-3 rounded-xl" style={{ background: '#f8f9fc', border: '1px solid #f1f5f9' }}>
                            <p className="text-[10px] font-bold mb-0.5" style={{ color: '#94a3b8' }}>{l}</p>
                            <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{v}</p>
                        </div>
                    ))}
                </div>
                {/* Client Portal Invite */}
                <div className="p-3 rounded-xl" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                    <div className="flex flex-col gap-2">
                        <div>
                            <p className="text-xs font-bold mb-0.5" style={{ color: '#6d28d9' }}>📱 의뢰인 안심 포털 구축</p>
                            <p className="text-[10px]" style={{ color: '#8b5cf6' }}>의뢰인 전용 포털 초대장을 발송하세요.</p>
                        </div>
                        <button onClick={() => alert('포털 초대장이 발송되었습니다.')} className="w-full px-3 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 flex items-center justify-center" style={{ background: '#7c3aed', color: '#ffffff', boxShadow: '0 2px 4px rgba(124,58,237,0.3)' }}>초대장 발송</button>
                    </div>
                </div>
                {/* Opponent info */}
                <div className="p-3 rounded-xl" style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#be123c' }}>⚔️ 상대방</p>
                    <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{lit.opponent}</p>
                    {lit.opponentLawyer && <p className="text-xs" style={{ color: '#64748b' }}>대리인: {lit.opponentLawyer}</p>}
                </div>
                {/* Cost info */}
                <div className="p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#16a34a' }}>💰 비용</p>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs"><span style={{ color: '#64748b' }}>수임료</span><span className="font-bold" style={{ color: '#1e293b' }}>{formatMoney(lit.legalFee)}</span></div>
                        <div className="flex justify-between text-xs"><span style={{ color: '#64748b' }}>인지대/송달료</span><span className="font-bold" style={{ color: '#1e293b' }}>{formatMoney(lit.courtFee)}</span></div>
                        <div className="border-t pt-1 mt-1 flex justify-between text-xs" style={{ borderColor: '#bbf7d0' }}>
                            <span className="font-bold" style={{ color: '#16a34a' }}>합계</span>
                            <span className="font-black" style={{ color: '#16a34a' }}>{formatMoney(lit.legalFee + lit.courtFee)}</span>
                        </div>
                    </div>
                </div>
                {/* Status Change */}
                <div>
                    <p className="text-xs font-bold mb-2" style={{ color: '#64748b' }}>⚡ 사건 상태</p>
                    <div className="flex flex-wrap gap-1">
                        {PERSONAL_LIT_STATUSES.map(s => (
                            <button key={s} onClick={() => changeStatus(s)} className="text-[10px] px-2 py-1 rounded-full font-bold transition-all"
                                style={{ background: lit.status === s ? PERSONAL_LIT_STATUS_COLOR[s] : '#f1f5f9', color: lit.status === s ? PERSONAL_LIT_STATUS_TEXT[s] : '#64748b',
                                    border: `1px solid ${lit.status === s ? PERSONAL_LIT_STATUS_TEXT[s] + '40' : '#e2e8f0'}` }}>{PERSONAL_LIT_STATUS_LABEL[s]}</button>
                        ))}
                    </div>
                </div>
                {/* Deadlines */}
                <div>
                    <p className="text-xs font-bold mb-2" style={{ color: '#94a3b8' }}>📅 기한·일정 ({lit.deadlines.filter(d => d.completed).length}/{lit.deadlines.length})</p>
                    <div className="space-y-2">
                        {lit.deadlines.map(d => {
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
                                            <p className="text-xs font-bold flex items-center gap-1" style={{ color: d.completed ? '#16a34a' : overdue ? '#dc2626' : (d.isFixed && !d.completed ? '#dc2626' : '#1e293b') }}>
                                                {d.isFixed && <span className="text-[10px]">🔴</span>}
                                                {d.label}
                                            </p>
                                            <p className="text-[10px]" style={{ color: '#94a3b8' }}>{d.dueDate}</p>
                                        </div>
                                        {d.isFixed && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">불변기일</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                {/* Documents */}
                {lit.documents.length > 0 && (
                    <div>
                        <p className="text-xs font-bold mb-2" style={{ color: '#94a3b8' }}>📄 문서 ({lit.documents.length})</p>
                        <div className="space-y-1">
                            {lit.documents.map(doc => (
                                <div key={doc.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0' }}>
                                    <FileText className="w-3 h-3" style={{ color: '#94a3b8' }} />
                                    <span className="text-xs flex-1 truncate" style={{ color: '#1e293b' }}>{doc.name}</span>
                                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>{doc.addedAt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                        {(['', '승소', '일부승소', '패소', '합의', '취하', '각하'] as const).map(r => (
                            <button key={r} onClick={() => setEditResult(r)} className="text-[10px] px-2 py-1 rounded-lg font-bold transition-all"
                                style={{ background: editResult === r ? (r === '승소' || r === '일부승소' ? '#dcfce7' : r === '패소' || r === '각하' ? '#fef2f2' : '#eff6ff') : '#f1f5f9',
                                    color: editResult === r ? (r === '승소' || r === '일부승소' ? '#16a34a' : r === '패소' || r === '각하' ? '#dc2626' : '#2563eb') : '#64748b',
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
                    {lit.status === 'closed' && <button onClick={() => { personalStore.restore(lit.id); onUpdate(); }} className="text-sm px-4 py-2.5 rounded-xl font-bold"
                        style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd' }}><RotateCcw className="w-3.5 h-3.5 inline mr-1" />복원</button>}
                </div>
            </div>
        </motion.div>
        <AnimatePresence>
            {showCloseModal && <CloseModal ids={[lit.id]} onClose={() => setShowCloseModal(false)}
                onConfirm={(reason) => { personalStore.close(lit.id, reason); setShowCloseModal(false); onUpdate(); }} />}
        </AnimatePresence>
        </>
    );
}

// ── AddCaseModal ──
function AddCaseModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
    const clients = personalStore.getClients();
    const [isNewClient, setIsNewClient] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', birthYear: 1990, address: '', memo: '' });
    const [form, setForm] = useState({
        clientId: clients[0]?.id ?? '', caseNo: '', court: COURTS[0], type: PERSONAL_LIT_TYPES[0] as PersonalLitType,
        role: '원고' as PersonalLitigation['role'], opponent: '', opponentLawyer: '', claimAmount: '',
        assignedLawyer: LAWYERS[0], legalFee: '', courtFee: '', notes: '', nextHearingDate: '',
    });
    const [deadlines, setDeadlines] = useState<{ label: string; dueDate: string; isFixed?: boolean }[]>([{ label: '소장 접수', dueDate: '', isFixed: false }]);

    const handleAdd = () => {
        let clientId = form.clientId; let clientName = clients.find(c => c.id === clientId)?.name ?? '';
        if (isNewClient && newClient.name) { const nc = personalStore.addClient(newClient); clientId = nc.id; clientName = nc.name; }
        personalStore.add({
            clientId, clientName, caseNo: form.caseNo, court: form.court, type: form.type, role: form.role,
            opponent: form.opponent, opponentLawyer: form.opponentLawyer,
            claimAmount: parseInt(form.claimAmount.replace(/,/g, '')) || 0,
            status: 'consulting', assignedLawyer: form.assignedLawyer,
            deadlines: deadlines.filter(d => d.label && d.dueDate).map((d, i) => ({ id: `pd${Date.now()}-${i}`, ...d, completed: false, completedAt: '' })),
            documents: [], notes: form.notes, result: '', resultNote: '',
            legalFee: parseInt((form.legalFee || '0').replace(/,/g, '')) || 0,
            courtFee: parseInt((form.courtFee || '0').replace(/,/g, '')) || 0,
            nextHearingDate: form.nextHearingDate,
        });
        onAdd(); onClose();
    };
    const inputStyle = { background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' };
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="w-full max-w-2xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-black text-lg" style={{ color: '#1e293b' }}>⚖️ 개인 소송 등록</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100" style={{ color: '#94a3b8' }}><X className="w-5 h-5" /></button>
                </div>
                {/* Client selection */}
                <div className="mb-4 p-4 rounded-xl" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-3 mb-3">
                        <p className="text-xs font-bold" style={{ color: '#2563eb' }}>👤 의뢰인</p>
                        <button onClick={() => setIsNewClient(!isNewClient)} className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: isNewClient ? '#dbeafe' : '#f1f5f9', color: isNewClient ? '#2563eb' : '#64748b' }}>
                            {isNewClient ? '기존 의뢰인 선택' : '+ 신규 의뢰인'}</button>
                    </div>
                    {isNewClient ? (
                        <div className="grid grid-cols-2 gap-2">
                            {[{ k: 'name', l: '이름', p: '홍길동' }, { k: 'phone', l: '연락처', p: '010-0000-0000' },
                              { k: 'email', l: '이메일', p: 'email@email.com' }, { k: 'address', l: '주소', p: '서울시 강남구' }].map(f => (
                                <div key={f.k}><label className="text-[10px] font-bold mb-0.5 block" style={{ color: '#64748b' }}>{f.l}</label>
                                    <input value={newClient[f.k as keyof typeof newClient] as string}
                                        onChange={e => setNewClient(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.p}
                                        className="w-full px-2 py-1.5 rounded-lg text-xs" style={{ ...inputStyle, background: '#ffffff' }} /></div>
                            ))}
                        </div>
                    ) : (
                        <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm" style={{ ...inputStyle, background: '#ffffff' }}>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                        </select>
                    )}
                </div>
                {/* Case info */}
                <div className="grid grid-cols-2 gap-3">
                    {[{ k: 'caseNo', l: '사건번호', p: '2026가합12345' }, { k: 'opponent', l: '상대방', p: '홍○○' },
                      { k: 'opponentLawyer', l: '상대방 대리인', p: '법무법인 ○○' }, { k: 'claimAmount', l: '청구금액 (원)', p: '50000000' },
                      { k: 'legalFee', l: '수임료 (원)', p: '3000000' }, { k: 'courtFee', l: '인지대/송달료 (원)', p: '500000' }
                    ].map(f => (
                        <div key={f.k}><label className="text-xs font-bold mb-1 block" style={{ color: '#1e40af' }}>{f.l}</label>
                            <input value={form[f.k as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                                placeholder={f.p} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                    ))}
                    {[{ k: 'court', l: '법원', opts: COURTS.map(c => ({ v: c, l: c })) },
                      { k: 'type', l: '소송 유형', opts: PERSONAL_LIT_TYPES.map(t => ({ v: t, l: t })) },
                      { k: 'role', l: '소송상 지위', opts: ['원고', '피고', '고소인', '피고소인', '신청인', '피신청인'].map(r => ({ v: r, l: r })) },
                      { k: 'assignedLawyer', l: '담당 변호사', opts: LAWYERS.map(l => ({ v: l, l })) }
                    ].map(f => (
                        <div key={f.k}><label className="text-xs font-bold mb-1 block" style={{ color: '#1e40af' }}>{f.l}</label>
                            <select value={form[f.k as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                                {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
                    ))}
                    <div><label className="text-xs font-bold mb-1 block" style={{ color: '#1e40af' }}>다음 기일</label>
                        <input type="date" value={form.nextHearingDate} onChange={e => setForm(p => ({ ...p, nextHearingDate: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                </div>
                <div className="mt-3"><label className="text-xs font-bold mb-1 block" style={{ color: '#1e40af' }}>사건 메모</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3}
                        className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={inputStyle} /></div>
                {/* Deadlines */}
                <div className="mt-4"><div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: '#64748b' }}>📅 기한·일정</p>
                    <button onClick={() => setDeadlines(p => [...p, { label: '', dueDate: '', isFixed: false }])} className="text-xs px-2 py-1 rounded-lg font-semibold"
                        style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>+ 추가</button>
                </div>
                <div className="space-y-2">{deadlines.map((d, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <select
                            value={['변론기일', '준비기일', '소장 접수'].includes(d.label) ? d.label : (d.label ? '기타' : '')}
                            onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, label: e.target.value === '기타' ? '' : e.target.value } : x))}
                            className="w-28 px-2 py-1.5 rounded-lg text-xs" style={inputStyle}
                        >
                            <option value="">선택</option>
                            <option value="소장 접수">소장 접수</option>
                            <option value="변론기일">변론기일</option>
                            <option value="준비기일">준비기일</option>
                            <option value="기타">직접 입력</option>
                        </select>
                        {(!['변론기일', '준비기일', '소장 접수'].includes(d.label) || d.label === '기타') && (
                            <input value={d.label} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                                placeholder="기한명" className="flex-1 px-2 py-1.5 rounded-lg text-xs" style={inputStyle} />
                        )}
                        <input type="date" value={d.dueDate} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, dueDate: e.target.value } : x))}
                            className="px-2 py-1.5 rounded-lg text-xs min-w-[110px]" style={inputStyle} />
                        <label className="flex items-center gap-1 text-[10px] font-bold shrink-0 cursor-pointer">
                            <input type="checkbox" checked={d.isFixed || false} onChange={e => setDeadlines(p => p.map((x, j) => j === i ? { ...x, isFixed: e.target.checked } : x))} className="accent-red-500 w-3.5 h-3.5" />
                            <span className={d.isFixed ? "text-red-500" : "text-slate-500"}>불변기일</span>
                        </label>
                        {deadlines.length > 1 && <button onClick={() => setDeadlines(p => p.filter((_, j) => j !== i))} className="p-1"><X className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} /></button>}
                    </div>
                ))}</div></div>
                <div className="flex gap-2 mt-5">
                    <Button variant="ghost" className="flex-1" onClick={onClose}>취소</Button>
                    <Button variant="premium" className="flex-1" onClick={handleAdd}><Gavel className="w-4 h-4 mr-1" /> 사건 등록</Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Client Summary Card (sidebar) ──
function ClientSummaryCard({ client, cases, isActive, onClick }: { client: PersonalClient; cases: PersonalLitigation[]; isActive: boolean; onClick: () => void }) {
    const active = cases.filter(c => c.status !== 'closed').length;
    const totalFee = cases.reduce((s, c) => s + c.legalFee + c.courtFee, 0);
    return (
        <button onClick={onClick} className="p-3 rounded-xl text-left transition-all w-full"
            style={{ background: isActive ? '#eff6ff' : '#ffffff', border: `1.5px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
                boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.15)' : '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: isActive ? '#3b82f6' : '#e5e7eb', color: isActive ? '#ffffff' : '#64748b' }}>{client.name[0]}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#1e293b' }}>{client.name}</p>
                    <p className="text-[10px]" style={{ color: '#94a3b8' }}>{client.phone}</p>
                </div>
            </div>
            <div className="flex gap-2 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#f0f4f8', color: '#475569' }}>{cases.length}건</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: active > 0 ? '#fff7ed' : '#f0fdf4', color: active > 0 ? '#ea580c' : '#16a34a' }}>진행 {active}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#f0fdf4', color: '#16a34a' }}>{formatMoney(totalFee)}</span>
            </div>
        </button>
    );
}

// ── Main Page ──
export default function PersonalLitigationPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const [cases, setCases] = useState<PersonalLitigation[]>([]);
    const [clients, setClients] = useState<PersonalClient[]>([]);
    const [filterStatus, setFilterStatus] = useState<PersonalLitStatus | 'all'>('all');
    const [filterClient, setFilterClient] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
    const [caseTab, setCaseTab] = useState<'active' | 'closed'>('active');
    const [showAdd, setShowAdd] = useState(false);
    const [selectedCase, setSelectedCase] = useState<PersonalLitigation | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkClose, setShowBulkClose] = useState(false);

    const refresh = useCallback(() => {
        const allC = [...personalStore.getAll()];
        setCases(allC);
        setClients([...personalStore.getClients()]);
        if (selectedCase) { const u = allC.find(c => c.id === selectedCase.id); u ? setSelectedCase(u) : setSelectedCase(null); }
    }, [selectedCase]);
    useEffect(() => { refresh(); const id = setInterval(refresh, 3000); return () => clearInterval(id); }, [refresh]);

    const activeCases = cases.filter(c => c.status !== 'closed');
    const closedCases = cases.filter(c => c.status === 'closed');
    const baseCases = caseTab === 'active' ? activeCases : closedCases;

    const filtered = baseCases
        .filter(c => filterStatus === 'all' || c.status === filterStatus)
        .filter(c => filterClient === 'all' || c.clientId === filterClient)
        .filter(c => { if (!searchQuery) return true; const q = searchQuery.toLowerCase();
            return c.caseNo.toLowerCase().includes(q) || c.clientName.toLowerCase().includes(q) || c.opponent.toLowerCase().includes(q); });

    const totalCases = cases.length;
    const urgentDeadlines = activeCases.flatMap(c => c.deadlines.filter(d => !d.completed && daysUntil(d.dueDate) <= 7));
    const totalCost = cases.reduce((s, c) => s + c.legalFee + c.courtFee, 0);
    const totalClaim = cases.reduce((s, c) => s + c.claimAmount, 0);
    const statusCounts = PERSONAL_LIT_STATUSES.reduce((a, s) => ({ ...a, [s]: baseCases.filter(c => c.status === s).length }), {} as Record<string, number>);
    const clientCases = clients.map(cl => ({ client: cl, cases: cases.filter(c => c.clientId === cl.id) }));
    const toggleSelect = (id: string) => { setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

    return (
        <div className={isEmbedded ? "pb-16" : "min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8"} style={{ background: isEmbedded ? 'transparent' : '#f8f9fc' }}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#1e293b' }}>
                            <Scale className="w-6 h-6" style={{ color: '#2563eb' }} />개인 소송 관리
                        </h1>
                        <p className="text-sm mt-0.5 font-medium" style={{ color: '#475569' }}>
                            의뢰인 {clients.length}명 · 총 {totalCases}건 · 진행중 {activeCases.length}건
                            {urgentDeadlines.length > 0 && <span style={{ color: '#d97706' }}> · ⚠ 긴급 기한 {urgentDeadlines.length}건</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && caseTab === 'active' && (
                            <button onClick={() => setShowBulkClose(true)} className="text-xs px-3 py-2 rounded-xl font-bold"
                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                <Archive className="w-3.5 h-3.5 inline mr-1" />일괄 종결 ({selectedIds.size})</button>
                        )}
                        <Button variant="premium" size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> 신규 사건</Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <KpiCard icon={Briefcase} label="전체 사건" value={totalCases} sub={`진행 ${activeCases.length} / 종결 ${closedCases.length}`} accent="#2563eb" />
                    <KpiCard icon={AlertTriangle} label="긴급 기한" value={urgentDeadlines.length} sub="7일 이내 마감" accent="#ea580c" />
                    <KpiCard icon={TrendingUp} label="총 청구금액" value={formatMoney(totalClaim)} sub={`${cases.filter(c => c.claimAmount > 0).length}건 금전소송`} accent="#2563eb" />
                    <KpiCard icon={DollarSign} label="총 비용" value={formatMoney(totalCost)} sub={`수임료 ${formatMoney(cases.reduce((s, c) => s + c.legalFee, 0))}`} accent="#16a34a" />
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
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="사건번호, 의뢰인, 상대방 검색..."
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
                    {[{ v: 'all', l: `전체 ${baseCases.length}` }, ...PERSONAL_LIT_STATUSES.filter(s => caseTab === 'active' ? s !== 'closed' : s === 'closed')
                        .map(s => ({ v: s, l: `${PERSONAL_LIT_STATUS_LABEL[s]} ${statusCounts[s] || 0}` }))].map(item => (
                        <button key={item.v} onClick={() => setFilterStatus(item.v as PersonalLitStatus | 'all')}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                            style={{ background: filterStatus === item.v ? '#eff6ff' : '#ffffff', color: filterStatus === item.v ? '#2563eb' : '#475569',
                                border: `1px solid ${filterStatus === item.v ? '#bfdbfe' : '#d1d5db'}` }}>{item.l}</button>
                    ))}
                </div>

                {/* Main layout with sidebar */}
                <div className="flex gap-5">
                    {/* Sidebar: client cards */}
                    <div className="hidden lg:block w-56 flex-shrink-0 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>
                            <Users className="w-3.5 h-3.5 inline mr-1" /> 의뢰인 ({clients.length})</p>
                        <button onClick={() => setFilterClient('all')} className="w-full px-3 py-2 rounded-xl text-xs font-bold text-left transition-all"
                            style={{ background: filterClient === 'all' ? '#eff6ff' : '#ffffff', color: filterClient === 'all' ? '#2563eb' : '#475569',
                                border: `1.5px solid ${filterClient === 'all' ? '#3b82f6' : '#e5e7eb'}` }}>전체 보기 ({totalCases}건)</button>
                        {clientCases.map(({ client, cases: cc }) => (
                            <ClientSummaryCard key={client.id} client={client} cases={cc} isActive={filterClient === client.id}
                                onClick={() => setFilterClient(filterClient === client.id ? 'all' : client.id)} />
                        ))}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile client filter */}
                        <div className="lg:hidden mb-4">
                            <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-sm font-bold" style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                                <option value="all">전체 의뢰인 ({totalCases}건)</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({cases.filter(x => x.clientId === c.id).length}건)</option>)}
                            </select>
                        </div>

                        {/* Case Grid/List */}
                        {viewMode === 'card' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <AnimatePresence>
                                    {filtered.map(lit => {
                                        const urgentDl = lit.deadlines.filter(d => !d.completed && daysUntil(d.dueDate) <= 7);
                                        const doneCount = lit.deadlines.filter(d => d.completed).length;
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
                                                                    style={{ background: PERSONAL_LIT_STATUS_COLOR[lit.status], color: PERSONAL_LIT_STATUS_TEXT[lit.status] }}>
                                                                    {PERSONAL_LIT_STATUS_LABEL[lit.status]}</span>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#f0f9ff', color: '#0284c7' }}>{lit.role}</span>
                                                                {urgentDl.length > 0 && <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                                                    style={{ background: '#fffbeb', color: '#d97706' }}><AlertTriangle className="w-2.5 h-2.5" /> D-{Math.min(...urgentDl.map(d => daysUntil(d.dueDate)))}</span>}
                                                            </div>
                                                            <h3 className="font-black text-sm truncate" style={{ color: '#1e293b' }}>
                                                                <User className="w-3 h-3 inline mr-1" style={{ color: '#2563eb' }} />{lit.clientName}</h3>
                                                            <p className="text-xs truncate" style={{ color: '#64748b' }}>{lit.type} · vs {lit.opponent}</p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            {lit.claimAmount > 0 && <p className="text-sm font-black" style={{ color: '#1e40af' }}>{formatMoney(lit.claimAmount)}</p>}
                                                            <p className="text-[10px]" style={{ color: '#94a3b8' }}>{lit.court}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="flex-1 h-1 rounded-full" style={{ background: '#e5e7eb' }}>
                                                            <div className="h-1 rounded-full" style={{ width: `${lit.deadlines.length > 0 ? (doneCount / lit.deadlines.length) * 100 : 0}%`, background: 'linear-gradient(90deg,#60a5fa,#2563eb)' }} />
                                                        </div>
                                                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>{doneCount}/{lit.deadlines.length}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#f0fdf4', color: '#16a34a' }}>💰 {formatMoney(lit.legalFee + lit.courtFee)}</span>
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
                                    <div className="col-span-2">의뢰인</div>
                                    <div className="col-span-2">유형/상대방</div>
                                    <div className="col-span-1">상태</div>
                                    <div className="col-span-1">청구액</div>
                                    <div className="col-span-1">변호사</div>
                                    <div className="col-span-2">비용</div>
                                </div>
                                {filtered.map(lit => (
                                    <div key={lit.id} onClick={() => setSelectedCase(lit)}
                                        className="grid grid-cols-12 gap-2 px-4 py-3 items-center cursor-pointer transition-all hover:bg-slate-50"
                                        style={{ borderBottom: '1px solid #f1f5f9', background: selectedIds.has(lit.id) ? '#eff6ff' : 'transparent' }}>
                                        {caseTab === 'active' && <div className="col-span-1"><input type="checkbox" checked={selectedIds.has(lit.id)} onClick={e => e.stopPropagation()} onChange={() => toggleSelect(lit.id)} className="w-3.5 h-3.5 rounded accent-blue-600" /></div>}
                                        <div className={caseTab === 'active' ? 'col-span-2' : 'col-span-3'}><span className="text-xs font-mono" style={{ color: '#64748b' }}>{lit.caseNo}</span></div>
                                        <div className="col-span-2"><p className="text-xs font-bold truncate" style={{ color: '#1e293b' }}>{lit.clientName}</p></div>
                                        <div className="col-span-2"><p className="text-xs truncate" style={{ color: '#64748b' }}>{lit.type} · {lit.opponent}</p></div>
                                        <div className="col-span-1"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: PERSONAL_LIT_STATUS_COLOR[lit.status], color: PERSONAL_LIT_STATUS_TEXT[lit.status] }}>{PERSONAL_LIT_STATUS_LABEL[lit.status]}</span></div>
                                        <div className="col-span-1"><span className="text-xs font-bold" style={{ color: '#1e40af' }}>{lit.claimAmount > 0 ? formatMoney(lit.claimAmount) : '—'}</span></div>
                                        <div className="col-span-1"><span className="text-[10px]" style={{ color: '#7c3aed' }}>{lit.assignedLawyer.replace(' 변호사', '')}</span></div>
                                        <div className="col-span-2"><span className="text-[10px]" style={{ color: '#16a34a' }}>{formatMoney(lit.legalFee + lit.courtFee)}</span></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {filtered.length === 0 && (
                            <div className="text-center py-16" style={{ color: '#94a3b8' }}>
                                <Scale className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">{caseTab === 'closed' ? '종결된 사건이 없습니다' : '해당 조건의 사건이 없습니다'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals */}
                <AnimatePresence>{showAdd && <AddCaseModal onClose={() => setShowAdd(false)} onAdd={refresh} />}</AnimatePresence>
                <AnimatePresence>{selectedCase && <DetailPanel lit={selectedCase} onClose={() => setSelectedCase(null)} onUpdate={refresh} />}</AnimatePresence>
                <AnimatePresence>{showBulkClose && <CloseModal ids={Array.from(selectedIds)} onClose={() => setShowBulkClose(false)}
                    onConfirm={(reason) => { selectedIds.forEach(id => personalStore.close(id, reason)); setSelectedIds(new Set()); setShowBulkClose(false); refresh(); }} />}</AnimatePresence>
            </div>
        </div>
    );
}
