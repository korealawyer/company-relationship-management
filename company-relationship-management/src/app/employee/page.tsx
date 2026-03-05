'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, RefreshCw, CheckCircle2, X, Plus, Search,
    Mail, ChevronDown, ChevronUp, AlertTriangle,
    Clock, Eye, Bot, FileEdit, Send,
    MessageSquare, Activity, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { leadStore, Lead, LeadStatus } from '@/lib/leadStore';
import { LAWYERS, SALES_REPS } from '@/lib/mockStore';

// ── 색상 시스템 ────────────────────────────────────────────────
const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff', rowHover: '#f1f5f9',
};

// ── LeadStatus 상수 ────────────────────────────────────────────
const STATUS_LABEL: Record<LeadStatus, string> = {
    pending: '대기',
    analyzed: '분석완료',
    sales_confirmed: '영업컨펌',
    lawyer_confirmed: '변호사컨펌',
    emailed: '발송완료',
    in_contact: '연락중',
    contracted: '계약완료',
    failed: '실패',
};

const STATUS_COLOR: Record<LeadStatus, string> = {
    pending: 'rgba(148,163,184,0.15)',
    analyzed: 'rgba(59,130,246,0.15)',
    sales_confirmed: 'rgba(167,139,250,0.15)',
    lawyer_confirmed: 'rgba(20,184,166,0.15)',
    emailed: 'rgba(34,197,94,0.15)',
    in_contact: 'rgba(236,72,153,0.15)',
    contracted: 'rgba(201,168,76,0.2)',
    failed: 'rgba(239,68,68,0.15)',
};

const STATUS_TEXT: Record<LeadStatus, string> = {
    pending: '#94a3b8', analyzed: '#60a5fa',
    sales_confirmed: '#a78bfa', lawyer_confirmed: '#2dd4bf',
    emailed: '#4ade80', in_contact: '#f472b6',
    contracted: '#c9a84c', failed: '#f87171',
};

const PIPELINE: LeadStatus[] = [
    'pending', 'analyzed', 'sales_confirmed', 'lawyer_confirmed',
    'emailed', 'in_contact', 'contracted',
];

const RISK_LABEL: Record<string, string> = { HIGH: '위험', MEDIUM: '주의', LOW: '양호', '': '분석전' };
const RISK_COLOR: Record<string, string> = { HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#16a34a', '': '#94a3b8' };
const RISK_BG: Record<string, string> = { HIGH: '#fef2f2', MEDIUM: '#fffbeb', LOW: '#dcfce7', '': '#f1f5f9' };

// ── 자동화 설정 (로컬 전용) ─────────────────────────────────────
const AUTO_KEY = 'ibs_employee_auto_v1';
type AutoSettings = { autoAnalyze: boolean; autoSalesConfirm: boolean; autoAssignLawyer: boolean; autoSendEmail: boolean; lawyerRoundRobin: number; };
const DEFAULT_AUTO: AutoSettings = { autoAnalyze: false, autoSalesConfirm: false, autoAssignLawyer: false, autoSendEmail: false, lawyerRoundRobin: 0 };
function loadAuto(): AutoSettings {
    if (typeof window === 'undefined') return DEFAULT_AUTO;
    try { return { ...DEFAULT_AUTO, ...(JSON.parse(localStorage.getItem(AUTO_KEY) ?? '{}')) }; } catch { return DEFAULT_AUTO; }
}
function saveAuto(s: AutoSettings) { localStorage.setItem(AUTO_KEY, JSON.stringify(s)); }

// ── 상태 배지 ──────────────────────────────────────────────────
function StatusBadge({ status }: { status: LeadStatus }) {
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
            style={{ background: STATUS_COLOR[status], color: STATUS_TEXT[status] }}>
            {status === 'analyzed' && <RefreshCw className="w-3 h-3" />}
            {STATUS_LABEL[status]}
        </span>
    );
}

// ── 위험도 배지 ────────────────────────────────────────────────
function RiskBadge({ level }: { level: string }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: RISK_BG[level] ?? RISK_BG[''], color: RISK_COLOR[level] ?? RISK_COLOR[''] }}>
            {RISK_LABEL[level] ?? '—'}
        </span>
    );
}

// ── 워크플로우 단계 셀 ─────────────────────────────────────────
function StepCell({ done, label, active }: { done: boolean; label: string; active?: boolean }) {
    if (done) return <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#16a34a' }}><CheckCircle2 className="w-3 h-3" />{label}</span>;
    if (active) return <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#d97706' }}><Clock className="w-3 h-3 animate-pulse" />{label}</span>;
    return <span className="text-[10px] font-medium" style={{ color: T.faint }}>—</span>;
}

// ── 액션 버튼 ──────────────────────────────────────────────────
function ActionButton({
    lead, run, confirmingId, setConfirmingId, confirmRep, setConfirmRep,
    assigningId, setAssigningId, assignLawyer, setAssignLawyer, loading,
}: {
    lead: Lead;
    run: (id: string, fn: () => void) => void;
    confirmingId: string | null; setConfirmingId: (v: string | null) => void;
    confirmRep: string; setConfirmRep: (v: string) => void;
    assigningId: string | null; setAssigningId: (v: string | null) => void;
    assignLawyer: string; setAssignLawyer: (v: string) => void;
    loading: string | null;
}) {
    const router = useRouter();
    const s = lead.status;
    const selectStyle = { background: T.card, border: `1px solid ${T.border}`, color: T.body, borderRadius: 6, padding: '2px 6px', fontSize: 12 };

    if (s === 'pending') return (
        <Button variant="premium" size="sm" onClick={() => run(lead.id, () => leadStore.updateStatus(lead.id, 'analyzed'))}>
            <Zap className="w-3.5 h-3.5 mr-1" />AI 분석
        </Button>
    );

    if (s === 'analyzed') return (
        <>
            {confirmingId === lead.id ? (
                <div className="flex items-center gap-1.5">
                    <select value={confirmRep} onChange={e => setConfirmRep(e.target.value)} style={selectStyle}>
                        {SALES_REPS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <Button variant="premium" size="sm" onClick={() => run(lead.id, () => { leadStore.updateStatus(lead.id, 'sales_confirmed', confirmRep); setConfirmingId(null); })}>확인</Button>
                    <button onClick={() => setConfirmingId(null)} className="text-xs font-bold" style={{ color: T.muted }}>✕</button>
                </div>
            ) : (
                <Button variant="outline" size="sm" onClick={() => setConfirmingId(lead.id)}>영업 컨펌</Button>
            )}
        </>
    );

    if (s === 'sales_confirmed') return (
        <>
            {assigningId === lead.id ? (
                <div className="flex items-center gap-1.5">
                    <select value={assignLawyer} onChange={e => setAssignLawyer(e.target.value)} style={selectStyle}>
                        {LAWYERS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <Button variant="premium" size="sm" onClick={() => run(lead.id, () => {
                        leadStore.update(lead.id, { assignedLawyer: assignLawyer });
                        leadStore.updateStatus(lead.id, 'lawyer_confirmed', '변호사팀');
                        setAssigningId(null);
                    })}>배정</Button>
                    <button onClick={() => setAssigningId(null)} className="text-xs font-bold" style={{ color: T.muted }}>✕</button>
                </div>
            ) : (
                <Button variant="outline" size="sm" onClick={() => setAssigningId(lead.id)}>변호사 배정</Button>
            )}
        </>
    );

    if (s === 'lawyer_confirmed') return (
        <div className="flex items-center gap-1.5">
            <Button variant="premium" size="sm"
                onClick={() => router.push(`/admin/leads`)}>
                <FileEdit className="w-3.5 h-3.5 mr-1" />이메일 발송
            </Button>
        </div>
    );

    if (s === 'emailed') return (
        <Button variant="outline" size="sm" onClick={() => run(lead.id, () => leadStore.updateStatus(lead.id, 'in_contact'))}>
            <Eye className="w-3.5 h-3.5 mr-1" />연락중 처리
        </Button>
    );

    if (s === 'in_contact') return (
        <Button variant="premium" size="sm" onClick={() => run(lead.id, () => leadStore.updateStatus(lead.id, 'contracted'))}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />계약완료
        </Button>
    );

    if (s === 'contracted') return (
        <span className="text-xs flex items-center gap-1 font-bold" style={{ color: '#c9a84c' }}>
            <CheckCircle2 className="w-3.5 h-3.5" />계약완료
        </span>
    );

    return <span className="text-xs font-medium" style={{ color: T.faint }}>—</span>;
}

// ── 확장 행: 메모 + 타임라인 ──────────────────────────────────
function ExpandedRow({ lead, refresh }: { lead: Lead; refresh: () => void }) {
    const [newMemo, setNewMemo] = useState('');
    const taStyle = { background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none', borderRadius: 8, padding: '8px 12px', resize: 'none' as const, fontSize: 12, lineHeight: '1.6', width: '100%' };
    const handleAddMemo = () => {
        if (!newMemo.trim()) return;
        leadStore.addMemo(lead.id, { author: '영업팀', content: newMemo });
        refresh();
        setNewMemo('');
    };
    const sorted = [...lead.timeline].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    return (
        <tr>
            <td colSpan={10}>
                <div className="px-6 py-4 grid grid-cols-2 gap-6" style={{ background: '#f1f5f9', borderTop: `1px solid ${T.border}` }}>
                    {/* 메모 */}
                    <div>
                        <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: T.sub }}>
                            <MessageSquare className="w-3.5 h-3.5" />메모
                        </p>
                        <div className="space-y-1.5 mb-2 max-h-24 overflow-y-auto">
                            {lead.memos.length === 0 && <p className="text-xs" style={{ color: T.faint }}>메모 없음</p>}
                            {[...lead.memos].reverse().map(m => (
                                <div key={m.id} className="px-3 py-2 rounded-lg text-xs" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                                    <span className="font-bold" style={{ color: '#4f46e5' }}>{m.author}</span>
                                    <span className="ml-2" style={{ color: T.body }}>{m.content}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-1.5">
                            <textarea value={newMemo} onChange={e => setNewMemo(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddMemo())}
                                rows={2} placeholder="메모 입력 후 Enter..." style={taStyle} />
                            <button onClick={handleAddMemo} className="px-3 py-1 rounded-lg text-xs font-bold self-end"
                                style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                                추가
                            </button>
                        </div>
                    </div>
                    {/* 타임라인 */}
                    <div>
                        <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: T.sub }}>
                            <Activity className="w-3.5 h-3.5" />진행 이력
                        </p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {sorted.length === 0 && <p className="text-xs" style={{ color: T.faint }}>이력 없음</p>}
                            {sorted.map(e => (
                                <div key={e.id} className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                                    style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                                    <span style={{ color: '#4f46e5', fontWeight: 700 }}>{e.author}</span>
                                    <span style={{ color: T.body }}>{e.content}</span>
                                    <span className="ml-auto shrink-0" style={{ color: T.faint }}>
                                        {new Date(e.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    );
}

// ── 메인 페이지 ────────────────────────────────────────────────
export default function EmployeePage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', domain: '', storeCount: '' });
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [confirmRep, setConfirmRep] = useState(SALES_REPS[0]);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [assignLawyer, setAssignLawyer] = useState(LAWYERS[0]);
    const [loading, setLoading] = useState<string | null>(null);
    const [autoSettings, setAutoSettings] = useState<AutoSettings>(loadAuto());
    const [showAutoPanel, setShowAutoPanel] = useState(false);
    const [undoVisible, setUndoVisible] = useState(false);
    const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const refresh = useCallback(() => setLeads([...leadStore.getAll()]), []);
    useEffect(() => { refresh(); const id = setInterval(refresh, 2000); return () => clearInterval(id); }, [refresh]);

    const run = (id: string, fn: () => void) => {
        setLoading(id);
        setTimeout(() => { fn(); setLoading(null); refresh(); }, 400);
        // undo 토스트 표시 (5초)
        if (undoTimer) clearTimeout(undoTimer);
        setUndoVisible(true);
        const t = setTimeout(() => setUndoVisible(false), 5000);
        setUndoTimer(t);
    };

    const updateAuto = (patch: Partial<AutoSettings>) => {
        const next = { ...autoSettings, ...patch };
        setAutoSettings(next);
        saveAuto(next);
    };

    const filtered = leads.filter(l => {
        const q = search.toLowerCase();
        return (l.companyName.toLowerCase().includes(q) || l.contactEmail.toLowerCase().includes(q) || l.contactName.toLowerCase().includes(q))
            && (filterStatus === 'all' || l.status === filterStatus);
    });

    const counts = Object.fromEntries(PIPELINE.map(s => [s, leads.filter(l => l.status === s).length]));
    const needsAction = leads.filter(l => ['analyzed', 'lawyer_confirmed'].includes(l.status));

    return (
        <div className="min-h-screen px-4 py-8 max-w-[1600px] mx-auto" style={{ background: T.bg }}>

            {/* 실행 취소 토스트 */}
            <AnimatePresence>
                {undoVisible && (
                    <motion.div
                        key="undo-toast"
                        initial={{ opacity: 0, y: 24, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.95 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
                        style={{ background: '#1e293b', border: '1px solid #334155', minWidth: 240 }}>
                        <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>변경이 적용됐어요</span>
                        <button
                            onClick={() => {
                                leadStore.undo();
                                refresh();
                                setUndoVisible(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                            style={{ background: '#c9a84c', color: '#0a0e1a' }}>
                            <RotateCcw className="w-3.5 h-3.5" />실행 취소
                        </button>
                        <button onClick={() => setUndoVisible(false)} style={{ color: '#64748b' }}>
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black" style={{ color: T.heading }}>📊 영업팀 CRM</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.muted }}>
                        AI 개인정보처리방침 분석 → 영업 컨펌 → 변호사 검토 → 이메일 발송 | {leads.length}개 리드 진행 중
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowAutoPanel(p => !p)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                        style={{
                            background: showAutoPanel ? '#f0fdf4' : T.card, color: showAutoPanel ? '#16a34a' : T.sub,
                            border: `1px solid ${showAutoPanel ? '#86efac' : T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        }}>
                        <Bot className="w-3.5 h-3.5" />AI 자동화
                    </button>
                    <Button variant="premium" size="sm" onClick={() => setShowAdd(true)}>
                        <Plus className="w-4 h-4 mr-1" />리드 등록
                    </Button>
                </div>
            </div>

            {/* AI 자동화 패널 */}
            <AnimatePresence>
                {showAutoPanel && (
                    <motion.div key="auto" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-5">
                        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #86efac', background: T.card, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                            <div className="px-5 py-3 flex items-center gap-2" style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                                <Bot className="w-4 h-4" style={{ color: '#16a34a' }} />
                                <p className="text-sm font-black" style={{ color: '#16a34a' }}>AI 자동화 설정</p>
                            </div>
                            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {([
                                    { k: 'autoAnalyze', l: 'AI 자동 분석', sub: '등록 즉시 분석', color: '#2563eb' },
                                    { k: 'autoSalesConfirm', l: '영업 자동 컨펌', sub: '분석완료 → 즉시 컨펌', color: '#7c3aed' },
                                    { k: 'autoAssignLawyer', l: '변호사 자동 배정', sub: '라운드로빈 자동', color: '#d97706' },
                                    { k: 'autoSendEmail', l: '이메일 자동 발송', sub: '컨펌 즉시 발송', color: '#16a34a' },
                                ] as { k: keyof AutoSettings; l: string; sub: string; color: string }[]).map(item => (
                                    <button key={item.k}
                                        onClick={() => updateAuto({ [item.k]: !autoSettings[item.k] })}
                                        className="p-4 rounded-xl text-left transition-all"
                                        style={{ background: autoSettings[item.k] ? `${item.color}10` : '#f8f9fc', border: `1px solid ${autoSettings[item.k] ? item.color + '40' : T.borderSub}` }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-black" style={{ color: autoSettings[item.k] ? item.color : T.sub }}>{item.l}</p>
                                            <div className="w-9 h-5 rounded-full relative flex-shrink-0" style={{ background: autoSettings[item.k] ? item.color : '#cbd5e1' }}>
                                                <div className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all" style={{ left: autoSettings[item.k] ? '21px' : '3px' }} />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-medium" style={{ color: T.muted }}>{item.sub}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 조치 필요 배너 */}
            {needsAction.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                    <div className="rounded-xl p-4" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} />
                            <p className="text-sm font-black" style={{ color: '#dc2626' }}>조치 필요 — {needsAction.length}건</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {needsAction.map(l => (
                                <span key={l.id} className="text-xs px-2.5 py-1 rounded-full font-bold"
                                    style={{ background: STATUS_COLOR[l.status], color: STATUS_TEXT[l.status] }}>
                                    {l.companyName} · {STATUS_LABEL[l.status]}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 파이프라인 필터 */}
            <div className="mb-5 overflow-x-auto pb-1">
                <div className="flex gap-2 min-w-max">
                    <button onClick={() => setFilterStatus('all')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={{ background: filterStatus === 'all' ? '#fffbeb' : T.card, border: `1px solid ${filterStatus === 'all' ? '#fde68a' : T.border}`, color: filterStatus === 'all' ? '#b8960a' : T.sub }}>
                        전체 <span>{leads.length}</span>
                    </button>
                    {PIPELINE.map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                            style={{ background: filterStatus === s ? STATUS_COLOR[s] : T.card, border: `1px solid ${filterStatus === s ? STATUS_TEXT[s] + '60' : T.border}`, color: filterStatus === s ? STATUS_TEXT[s] : T.sub }}>
                            {STATUS_LABEL[s]} <span>{counts[s] ?? 0}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 검색 */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.faint }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="회사명, 담당자명, 이메일 검색..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
            </div>

            {/* 테이블 */}
            <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: '#f8f9fc', borderBottom: `2px solid ${T.border}` }}>
                                {['회사명', '위험도', '이슈', '가맹점', '상태', '영업컨펌', '변호사', '이메일', '타임라인', '액션'].map(h => (
                                    <th key={h} className="py-3 px-3 text-left text-xs font-black whitespace-nowrap tracking-wide" style={{ color: '#b8960a' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((lead: Lead) => (
                                <React.Fragment key={lead.id}>
                                    <tr className="transition-colors" style={{ borderBottom: `1px solid ${T.borderSub}` }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.rowHover)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                                        {/* 회사명 */}
                                        <td className="py-3.5 px-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                                                    className="p-0.5 rounded hover:bg-slate-200 transition-colors">
                                                    {expandedId === lead.id
                                                        ? <ChevronUp className="w-3.5 h-3.5" style={{ color: T.muted }} />
                                                        : <ChevronDown className="w-3.5 h-3.5" style={{ color: T.muted }} />}
                                                </button>
                                                <div>
                                                    <p className="font-bold text-xs" style={{ color: T.body }}>{lead.companyName}</p>
                                                    <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>{lead.contactName} · {lead.contactEmail}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 위험도 */}
                                        <td className="py-3.5 px-3"><RiskBadge level={lead.riskLevel} /></td>

                                        {/* 이슈 */}
                                        <td className="py-3.5 px-3">
                                            <span className="text-xs font-black" style={{ color: lead.issueCount >= 4 ? '#dc2626' : lead.issueCount >= 2 ? '#d97706' : '#16a34a' }}>
                                                {lead.issueCount}건
                                            </span>
                                        </td>

                                        {/* 가맹점 */}
                                        <td className="py-3.5 px-3">
                                            <span className="text-xs font-black" style={{ color: T.body }}>{lead.storeCount.toLocaleString()}</span>
                                        </td>

                                        {/* 상태 */}
                                        <td className="py-3.5 px-3"><StatusBadge status={lead.status} /></td>

                                        {/* 영업 컨펌 */}
                                        <td className="py-3.5 px-3">
                                            <StepCell
                                                done={['sales_confirmed', 'lawyer_confirmed', 'emailed', 'in_contact', 'contracted'].includes(lead.status)}
                                                label="컨펌"
                                                active={lead.status === 'analyzed'} />
                                        </td>

                                        {/* 변호사 */}
                                        <td className="py-3.5 px-3">
                                            <StepCell
                                                done={['lawyer_confirmed', 'emailed', 'in_contact', 'contracted'].includes(lead.status)}
                                                label={lead.assignedLawyer || '컨펌'}
                                                active={lead.status === 'sales_confirmed'} />
                                        </td>

                                        {/* 이메일 */}
                                        <td className="py-3.5 px-3">
                                            <StepCell
                                                done={!!lead.emailSentAt}
                                                label="발송완료"
                                                active={lead.status === 'lawyer_confirmed'} />
                                        </td>

                                        {/* 타임라인 */}
                                        <td className="py-3.5 px-3">
                                            <span className="text-[10px] font-medium" style={{ color: T.muted }}>
                                                {lead.timeline.length}건
                                            </span>
                                        </td>

                                        {/* 액션 */}
                                        <td className="py-3.5 px-3">
                                            {loading === lead.id
                                                ? <RefreshCw className="w-4 h-4 animate-spin" style={{ color: T.muted }} />
                                                : <ActionButton lead={lead} run={run}
                                                    confirmingId={confirmingId} setConfirmingId={setConfirmingId}
                                                    confirmRep={confirmRep} setConfirmRep={setConfirmRep}
                                                    assigningId={assigningId} setAssigningId={setAssigningId}
                                                    assignLawyer={assignLawyer} setAssignLawyer={setAssignLawyer}
                                                    loading={loading} />
                                            }
                                        </td>
                                    </tr>
                                    {expandedId === lead.id && <ExpandedRow key={`exp-${lead.id}`} lead={lead} refresh={refresh} />}
                                </React.Fragment>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={10} className="text-center py-16" style={{ color: T.faint }}>
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="font-medium">검색 결과가 없습니다</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 리드 등록 모달 */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
                            className="w-full max-w-lg rounded-2xl p-6"
                            style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-black" style={{ color: T.heading }}>리드 등록</h2>
                                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: T.muted }}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { k: 'companyName', l: '회사명 *', ph: '(주)교촌에프앤비' },
                                    { k: 'contactName', l: '담당자명', ph: '김영업' },
                                    { k: 'contactEmail', l: '이메일 *', ph: 'legal@kyochon.com' },
                                    { k: 'contactPhone', l: '전화번호', ph: '02-1234-5678' },
                                    { k: 'domain', l: '홈페이지', ph: 'kyochon.com' },
                                    { k: 'storeCount', l: '가맹점수', ph: '100' },
                                ].map(f => (
                                    <div key={f.k}>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: T.sub }}>{f.l}</label>
                                        <input value={addForm[f.k as keyof typeof addForm]}
                                            onChange={e => setAddForm(p => ({ ...p, [f.k]: e.target.value }))}
                                            placeholder={f.ph}
                                            className="w-full px-3 py-2 rounded-lg text-sm font-medium"
                                            style={{ background: '#f8f9fc', border: `1px solid ${T.border}`, color: T.body, outline: 'none' }} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-5">
                                <Button variant="ghost" className="flex-1" onClick={() => setShowAdd(false)}>취소</Button>
                                <Button variant="premium" className="flex-1" onClick={() => {
                                    if (!addForm.companyName || !addForm.contactEmail) return;
                                    leadStore.add([{
                                        companyName: addForm.companyName,
                                        contactName: addForm.contactName,
                                        contactEmail: addForm.contactEmail,
                                        contactPhone: addForm.contactPhone,
                                        domain: addForm.domain,
                                        privacyUrl: addForm.domain ? `https://${addForm.domain}/privacy` : '',
                                        storeCount: parseInt(addForm.storeCount) || 0,
                                        bizType: '',
                                        riskScore: 0, riskLevel: '',
                                        issueCount: 0,
                                        status: 'pending',
                                        source: 'manual' as const,
                                    }]);
                                    setAddForm({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', domain: '', storeCount: '' });
                                    setShowAdd(false);
                                    refresh();
                                }}>
                                    <Zap className="w-4 h-4 mr-1" />등록
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
