'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, RefreshCw, CheckCircle2, X, Plus, Search,
    Mail, ChevronDown, ChevronUp, AlertTriangle,
    Clock, Eye, Bot, FileEdit, Send, Phone,
    MessageSquare, Activity, RotateCcw, Upload,
    Gavel, CheckSquare, Square, ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { leadStore, Lead, LeadStatus } from '@/lib/leadStore';
import { LAWYERS, SALES_REPS } from '@/lib/mockStore';
import { dripStore, DripMember, DRIP_SEQUENCE, fillTemplate } from '@/lib/dripStore';

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

const STATUS_DESC: Record<LeadStatus, string> = {
    pending: 'AI 분석 대기 중',
    analyzed: '분석 완료, 영업 컨펌 필요',
    sales_confirmed: '영업 컨펌, 변호사 배정 대기',
    lawyer_confirmed: '변호사 배정 완료',
    emailed: '이메일 발송 완료',
    in_contact: '고객 연락 진행 중',
    contracted: '계약 체결 완료',
    failed: '진행 불가',
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
    setLoading, refresh,
}: {
    lead: Lead;
    run: (id: string, fn: () => void) => void;
    confirmingId: string | null; setConfirmingId: (v: string | null) => void;
    confirmRep: string; setConfirmRep: (v: string) => void;
    assigningId: string | null; setAssigningId: (v: string | null) => void;
    assignLawyer: string; setAssignLawyer: (v: string) => void;
    loading: string | null;
    setLoading: (v: string | null) => void;
    refresh: () => void;
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
                onClick={async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setLoading(lead.id);
                    try {
                        // 1) 업체에 훅 이메일 발송 (API가 상태도 emailed로 변경)
                        const res = await fetch('/api/email', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({
                                type: 'company_hook',
                                leadId: lead.id,
                                lawyerNote: lead.lawyerNote ?? '',
                            }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                            alert(`이메일 발송 실패: ${data.error || '알 수 없는 오류'}`);
                        } else {
                            // 2) 영업팀 내부 알림도 발송
                            await fetch('/api/email', {
                                method: 'POST',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'sales_notify',
                                    leadId: lead.id,
                                    lawyerNote: lead.lawyerNote ?? '',
                                }),
                            });
                        }
                    } catch (err) {
                        alert('이메일 발송 중 오류가 발생했습니다.');
                        console.error(err);
                    }
                    setLoading(null);
                    refresh();
                }}
                disabled={loading === lead.id}>
                {loading === lead.id
                    ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                    : <FileEdit className="w-3.5 h-3.5 mr-1" />}
                {loading === lead.id ? '발송 중...' : '이메일 발송'}
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

// ── 확장 행: 상세정보 + 메모 + 타임라인 ──────────────────────────────────
function ExpandedRow({ lead, refresh }: { lead: Lead; refresh: () => void }) {
    const [newMemo, setNewMemo] = useState('');
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        companyName: lead.companyName,
        bizNumber: lead.bizNumber || '',
        contactName: lead.contactName,
        contactEmail: lead.contactEmail,
        contactPhone: lead.contactPhone,
        storeCount: String(lead.storeCount),
        bizType: lead.bizType,
        bizCategory: lead.bizCategory || '',
        domain: lead.domain,
        privacyUrl: lead.privacyUrl,
    });
    const taStyle = { background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none', borderRadius: 8, padding: '8px 12px', resize: 'none' as const, fontSize: 12, lineHeight: '1.6', width: '100%' };
    const inputStyle = { background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, width: '100%' };
    const labelStyle = { color: T.muted, fontSize: 11, fontWeight: 700 as const, marginBottom: 4, display: 'block' as const };

    const handleAddMemo = () => {
        if (!newMemo.trim()) return;
        leadStore.addMemo(lead.id, { author: '영업팀', content: newMemo });
        refresh();
        setNewMemo('');
    };

    const handleSave = () => {
        leadStore.update(lead.id, {
            companyName: form.companyName,
            bizNumber: form.bizNumber || undefined,
            contactName: form.contactName,
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone,
            storeCount: parseInt(form.storeCount) || 0,
            bizType: form.bizType,
            bizCategory: form.bizCategory || undefined,
            domain: form.domain,
            privacyUrl: form.privacyUrl,
        });
        setEditing(false);
        refresh();
    };

    const sorted = [...lead.timeline].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    const F = (key: keyof typeof form) => editing
        ? <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
        : <span className="text-xs" style={{ color: T.body }}>{form[key] || '—'}</span>;

    return (
        <tr>
            <td colSpan={14}>
                <div className="px-6 py-4 max-h-[500px] overflow-y-auto" style={{ background: '#f1f5f9', borderTop: `1px solid ${T.border}` }}>
                    {/* 상세 정보 */}
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: T.sub }}>
                            <FileEdit className="w-3.5 h-3.5" />업체 상세 정보
                        </p>
                        <div className="flex items-center gap-2">
                            {editing ? (
                                <>
                                    <button onClick={() => setEditing(false)} className="px-3 py-1 rounded-lg text-xs font-bold"
                                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.sub }}>취소</button>
                                    <button onClick={handleSave} className="px-3 py-1 rounded-lg text-xs font-bold"
                                        style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4f46e5' }}>저장</button>
                                </>
                            ) : (
                                <button onClick={() => setEditing(true)} className="px-3 py-1 rounded-lg text-xs font-bold"
                                    style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b8960a' }}>✏️ 수정</button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-3 mb-4 p-4 rounded-xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                        <div><label style={labelStyle}>회사명</label>{F('companyName')}</div>
                        <div><label style={labelStyle}>사업자번호</label>{F('bizNumber')}</div>
                        <div><label style={labelStyle}>담당자</label>{F('contactName')}</div>
                        <div><label style={labelStyle}>이메일</label>{F('contactEmail')}</div>
                        <div><label style={labelStyle}>전화번호</label>{F('contactPhone')}</div>
                        <div><label style={labelStyle}>가맹점수</label>{F('storeCount')}</div>
                        <div><label style={labelStyle}>업종</label>{F('bizType')}</div>
                        <div><label style={labelStyle}>사업형태</label>{F('bizCategory')}</div>
                        <div><label style={labelStyle}>도메인</label>{F('domain')}</div>
                        <div><label style={labelStyle}>개인정보URL</label>{F('privacyUrl')}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* 메모 */}
                        <div>
                            <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: T.sub }}>
                                <MessageSquare className="w-3.5 h-3.5" />메모
                            </p>
                            <div className="flex gap-1.5">
                                <textarea value={newMemo} onChange={e => setNewMemo(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddMemo())}
                                    rows={5} placeholder="메모 입력 후 Enter..." style={taStyle} />
                                <button onClick={handleAddMemo} className="px-3 rounded-lg text-xs font-bold self-stretch"
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
                            <div className="space-y-1.5">
                                {sorted.length === 0 && <p className="text-xs" style={{ color: T.faint }}>이력 없음</p>}
                                {sorted.map(e => (
                                    <div key={e.id} className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                                        style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                                        <span style={{ color: '#4f46e5', fontWeight: 700 }}>{e.author}</span>
                                        <span style={{ color: T.body }}>{e.content}</span>
                                        <span className="ml-auto shrink-0" style={{ color: T.faint }}>
                                            {new Date(e.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {new Date(e.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
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
    const [filterRisk, setFilterRisk] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [tab, setTab] = useState<'leads' | 'drip'>('leads');
    const [slidePanel, setSlidePanel] = useState<{ lead: Lead; tab: 'clause' | 'email' } | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
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
    const [uploadMsg, setUploadMsg] = useState('');
    const excelInputRef = useRef<HTMLInputElement>(null);

    const refresh = useCallback(() => setLeads([...leadStore.getAll()]), []);
    useEffect(() => { const id = setInterval(refresh, 2000); return () => clearInterval(id); }, [refresh]);

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

    // ── CSV/엑셀 업로드 ──────────────────────────────────────
    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target?.result as string;
                const lines = text.split(/\r?\n/).filter(Boolean);
                if (lines.length < 2) { setUploadMsg('데이터가 없습니다.'); return; }
                const rows = lines.slice(1).map(line => {
                    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                    return {
                        companyName: cols[0] ?? '',
                        contactName: cols[1] ?? '',
                        contactEmail: cols[2] ?? '',
                        contactPhone: cols[3] ?? '',
                        storeCount: parseInt(cols[4]) || 0,
                        bizType: cols[5] ?? '기타',
                        domain: cols[6] ?? '',
                        privacyUrl: cols[7] ?? '',
                    };
                }).filter(r => r.companyName);
                if (rows.length === 0) { setUploadMsg('유효한 행이 없습니다.'); return; }
                const now = new Date().toISOString();
                const genId = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                const newLeads: Lead[] = rows.map(r => ({
                    id: genId('lead'),
                    companyName: r.companyName,
                    domain: r.domain, privacyUrl: r.privacyUrl,
                    contactName: r.contactName, contactEmail: r.contactEmail, contactPhone: r.contactPhone,
                    contacts: [], storeCount: r.storeCount, bizType: r.bizType,
                    riskScore: 0, riskLevel: '' as const, issueCount: 0, status: 'pending' as LeadStatus,
                    memos: [],
                    timeline: [{ id: genId('t'), createdAt: now, author: '시스템', type: 'status_change' as const, content: 'CSV 업로드', toStatus: 'pending' as LeadStatus }],
                    createdAt: now, updatedAt: now, source: 'excel' as const,
                }));
                const existing = leadStore.getAll();
                localStorage.setItem('ibs_leads_v1', JSON.stringify([...newLeads, ...existing]));
                refresh();
                setUploadMsg(`✅ ${rows.length}건 업로드 완료`);
                setTimeout(() => setUploadMsg(''), 3000);
            } catch {
                setUploadMsg('파일 파싱 오류. CSV 형식을 확인해주세요.');
            }
            e.target.value = '';
        };
        reader.readAsText(file, 'UTF-8');
    };

    const filteredRaw = leads.filter(l => {
        const q = search.toLowerCase();
        return (l.companyName.toLowerCase().includes(q) || l.contactEmail.toLowerCase().includes(q) || l.contactName.toLowerCase().includes(q))
            && (filterStatus === 'all' || l.status === filterStatus)
            && (filterRisk === 'all' || l.riskLevel === filterRisk);
    });

    // 정렬
    const SORT_MAP: Record<string, (a: Lead, b: Lead) => number> = {
        '회사명': (a, b) => a.companyName.localeCompare(b.companyName, 'ko'),
        '사업형태': (a, b) => (a.bizCategory ?? '').localeCompare(b.bizCategory ?? '', 'ko'),
        '위험도': (a, b) => { const o: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }; return (o[a.riskLevel] ?? 0) - (o[b.riskLevel] ?? 0); },
        '이슈': (a, b) => a.issueCount - b.issueCount,
        '가맹점': (a, b) => a.storeCount - b.storeCount,
        '상태': (a, b) => PIPELINE.indexOf(a.status) - PIPELINE.indexOf(b.status),
    };

    const filtered = sortKey && SORT_MAP[sortKey]
        ? [...filteredRaw].sort((a, b) => {
            const cmp = SORT_MAP[sortKey](a, b);
            return sortDir === 'asc' ? cmp : -cmp;
        })
        : filteredRaw;

    const counts = Object.fromEntries(PIPELINE.map(s => [s, leads.filter(l => l.status === s).length]));
    const needsAction = leads.filter(l => ['analyzed', 'lawyer_confirmed'].includes(l.status));
    const kpiCards = [
        { label: '전체 리드', value: leads.length, bg: '#eff6ff', color: '#2563eb' },
        { label: '위험 건수', value: leads.filter(l => l.riskLevel === 'HIGH').length, bg: '#fef2f2', color: '#dc2626' },
        { label: '신규 대기', value: leads.filter(l => l.status === 'pending').length, bg: '#fffbeb', color: '#d97706' },
        { label: '계약 완료', value: leads.filter(l => l.status === 'contracted').length, bg: '#f0fdf4', color: '#16a34a' },
    ];

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
                <div className="flex gap-2 items-center">
                    {uploadMsg && <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>{uploadMsg}</span>}
                    <Link href="/employee/upload"
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                        style={{ background: T.card, color: T.sub, border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <Upload className="w-3.5 h-3.5" />엑셀 업로드
                    </Link>
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

            {/* KPI 카드 */}
            <div className="grid grid-cols-4 gap-3 mb-5">
                {kpiCards.map(k => (
                    <div key={k.label} className="p-4 flex items-center gap-3 rounded-xl"
                        style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black"
                            style={{ background: k.bg, color: k.color }}>
                            {k.value}
                        </div>
                        <span className="text-sm font-semibold" style={{ color: T.sub }}>{k.label}</span>
                    </div>
                ))}
            </div>

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
                <div className="flex gap-1 min-w-max items-center">
                    <button onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={{ background: filterStatus === 'all' ? '#fffbeb' : T.card, border: `1px solid ${filterStatus === 'all' ? '#fde68a' : T.border}`, color: filterStatus === 'all' ? '#b8960a' : T.sub }}>
                        전체 <span>{leads.length}</span>
                    </button>
                    {PIPELINE.map((s, i) => (
                        <React.Fragment key={s}>
                            <ChevronDown className="w-3 h-3 -rotate-90 flex-shrink-0" style={{ color: T.faint }} />
                            <button onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                                style={{ background: filterStatus === s ? STATUS_COLOR[s] : T.card, border: `1px solid ${filterStatus === s ? STATUS_TEXT[s] + '60' : T.border}`, color: filterStatus === s ? STATUS_TEXT[s] : T.sub }}>
                                {STATUS_LABEL[s]} <span>{counts[s] ?? 0}</span>
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* 검색 + 위험도 필터 */}
            <div className="mb-4 flex gap-3 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.faint }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="회사명, 담당자명, 이메일 검색..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium"
                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
                </div>
                <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs font-bold"
                    style={{ background: T.card, border: `1px solid ${T.border}`, color: T.sub, outline: 'none' }}>
                    <option value="all">위험도 전체</option>
                    <option value="HIGH">🔴 위험</option>
                    <option value="MEDIUM">🟡 주의</option>
                    <option value="LOW">🟢 양호</option>
                </select>
                <div className="flex items-center gap-2">
                    <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="px-2 py-2 rounded-xl text-xs font-bold"
                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none' }}>
                        {[10, 20, 50, 100].map(n => (
                            <option key={n} value={n}>{n}개씩</option>
                        ))}
                    </select>
                    <span className="text-xs whitespace-nowrap" style={{ color: T.faint }}>
                        {filtered.length}건 중 {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–{Math.min(currentPage * pageSize, filtered.length)}
                    </span>
                </div>
            </div>

            {/* 일괄 변호사 배정 툴바 */}
            {selected.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 border"
                    style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                    <CheckSquare className="w-5 h-5" style={{ color: '#b8960a' }} />
                    <span className="font-bold text-sm" style={{ color: '#b8960a' }}>{selected.size}개 선택됨</span>
                    <div className="h-5 w-px bg-slate-200" />
                    {LAWYERS.map(l => (
                        <button key={l} onClick={() => {
                            selected.forEach(id => leadStore.update(id, { assignedLawyer: l }));
                            refresh();
                            setSelected(new Set());
                        }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white hover:bg-slate-50 transition-colors"
                            style={{ color: '#475569', borderColor: '#e2e8f0' }}>
                            {l} 배정
                        </button>
                    ))}
                    <button onClick={() => setSelected(new Set())} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100" style={{ color: '#94a3b8' }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 탭 전환 */}
            <div className="flex gap-1 mb-4">
                {([['leads', '📋 리드 목록'], ['drip', '📧 드립 캠페인']] as const).map(([k, label]) => (
                    <button key={k} onClick={() => setTab(k)}
                        className="px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                        style={{ background: tab === k ? T.card : 'transparent', color: tab === k ? T.body : T.faint, boxShadow: tab === k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', border: tab === k ? `1px solid ${T.border}` : '1px solid transparent' }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* 리드 목록 탭 */}
            {tab === 'leads' && (
                <>
                    {/* 테이블 */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: '#f8f9fc', borderBottom: `2px solid ${T.border}` }}>
                                        <th className="py-3 px-2 w-8">
                                            <button onClick={() => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(l => l.id)))}>
                                                {selected.size === filtered.length && filtered.length > 0
                                                    ? <CheckSquare className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                                    : <Square className="w-4 h-4" style={{ color: T.faint }} />}
                                            </button>
                                        </th>
                                        {['회사명', '사업형태', '위험도', '이슈', '가맹점', '상태', '영업컨펌', '변호사', '최신이력', '이메일', '빠른작업', '액션'].map(h => {
                                            const sortable = ['회사명', '사업형태', '위험도', '이슈', '가맹점', '상태'].includes(h);
                                            return (
                                                <th key={h}
                                                    className={`py-3 px-3 text-left text-xs font-black whitespace-nowrap tracking-wide ${sortable ? 'cursor-pointer select-none hover:bg-amber-50' : ''}`}
                                                    style={{ color: '#b8960a' }}
                                                    onClick={() => {
                                                        if (!sortable) return;
                                                        if (sortKey === h) {
                                                            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                        } else {
                                                            setSortKey(h);
                                                            setSortDir('asc');
                                                        }
                                                    }}>
                                                    <span className="inline-flex items-center gap-1">
                                                        {h}
                                                        {sortable && (
                                                            sortKey === h
                                                                ? (sortDir === 'asc'
                                                                    ? <ChevronUp className="w-3 h-3" />
                                                                    : <ChevronDown className="w-3 h-3" />)
                                                                : <ArrowUpDown className="w-3 h-3 opacity-30" />
                                                        )}
                                                    </span>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const totalPages = Math.ceil(filtered.length / pageSize);
                                        const start = (currentPage - 1) * pageSize;
                                        const paginated = filtered.slice(start, start + pageSize);
                                        return paginated.map((lead: Lead) => (
                                            <React.Fragment key={lead.id}>
                                                <tr className="cursor-pointer transition-colors" style={{ borderBottom: `1px solid ${T.borderSub}` }}
                                                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                                                    onMouseEnter={e => (e.currentTarget.style.background = T.rowHover)}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                                                    {/* 체크박스 */}
                                                    <td className="py-3.5 px-2">
                                                        <button onClick={(e) => {
                                                            e.stopPropagation();
                                                            const s = new Set(selected);
                                                            s.has(lead.id) ? s.delete(lead.id) : s.add(lead.id);
                                                            setSelected(s);
                                                        }}>
                                                            {selected.has(lead.id)
                                                                ? <CheckSquare className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                                                : <Square className="w-4 h-4" style={{ color: T.faint }} />}
                                                        </button>
                                                    </td>

                                                    {/* 회사명 */}
                                                    <td className="py-3.5 px-3">
                                                        <div>
                                                            <p className="font-bold text-xs" style={{ color: T.body }}>{lead.companyName}</p>
                                                            <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>{lead.contactName} · {lead.contactEmail}</p>
                                                        </div>
                                                    </td>

                                                    {/* 사업형태 */}
                                                    <td className="py-3.5 px-3">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                                                            background: lead.bizCategory === '프랜차이즈' ? '#eff6ff' : lead.bizCategory === '유통업' ? '#f0fdf4' : lead.bizCategory === '직영' ? '#faf5ff' : '#f8f9fc',
                                                            color: lead.bizCategory === '프랜차이즈' ? '#2563eb' : lead.bizCategory === '유통업' ? '#16a34a' : lead.bizCategory === '직영' ? '#7c3aed' : T.muted,
                                                        }}>{lead.bizCategory || '미분류'}</span>
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

                                                    {/* 최신 이력 */}
                                                    <td className="py-3.5 px-3" style={{ maxWidth: 160 }}>
                                                        {lead.timeline.length > 0 ? (
                                                            <p className="text-xs truncate" style={{ color: T.sub, maxWidth: 160 }}
                                                                title={[...lead.timeline].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].content}>
                                                                {[...lead.timeline].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].content}
                                                            </p>
                                                        ) : (
                                                            <span className="text-xs" style={{ color: T.faint }}>—</span>
                                                        )}
                                                    </td>

                                                    {/* 이메일 */}
                                                    <td className="py-3.5 px-3">
                                                        <StepCell
                                                            done={!!lead.emailSentAt}
                                                            label="발송완료"
                                                            active={lead.status === 'lawyer_confirmed'} />
                                                    </td>



                                                    {/* 빠른 작업 */}
                                                    <td className="py-3.5 px-3">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={e => { e.stopPropagation(); setSlidePanel({ lead, tab: 'clause' }); }}
                                                                className="p-2.5 rounded-xl hover:bg-indigo-100 transition-colors border"
                                                                style={{ background: '#eef2ff', borderColor: '#c7d2fe' }}
                                                                title="조문 검토">
                                                                <Gavel className="w-5 h-5" style={{ color: '#6366f1' }} />
                                                            </button>
                                                            <button
                                                                onClick={e => { e.stopPropagation(); setSlidePanel({ lead, tab: 'email' }); }}
                                                                className="p-2.5 rounded-xl hover:bg-amber-100 transition-colors border"
                                                                style={{ background: '#fffbeb', borderColor: '#fde68a' }}
                                                                title="이메일 발송">
                                                                <Mail className="w-5 h-5" style={{ color: '#d97706' }} />
                                                            </button>
                                                        </div>
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
                                                                loading={loading} setLoading={setLoading} refresh={refresh} />
                                                        }
                                                    </td>
                                                </tr>
                                                {expandedId === lead.id && <ExpandedRow key={`exp-${lead.id}`} lead={lead} refresh={refresh} />}
                                            </React.Fragment>
                                        ));
                                    })()}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={12} className="text-center py-16" style={{ color: T.faint }}>
                                            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="font-medium">검색 결과가 없습니다</p>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 페이지 전환 */}
                        {filtered.length > 0 && Math.ceil(filtered.length / pageSize) > 1 && (
                            <div className="flex items-center justify-center py-3" style={{ borderTop: `1px solid ${T.borderSub}` }}>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-30"
                                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body }}>
                                        ← 이전
                                    </button>
                                    {Array.from({ length: Math.ceil(filtered.length / pageSize) }, (_, i) => i + 1).slice(
                                        Math.max(0, currentPage - 3), currentPage + 2
                                    ).map(p => (
                                        <button key={p} onClick={() => setCurrentPage(p)}
                                            className="w-8 h-8 rounded-lg text-xs font-bold transition-colors"
                                            style={{
                                                background: p === currentPage ? '#fffbeb' : 'transparent',
                                                border: p === currentPage ? '1px solid #fde68a' : '1px solid transparent',
                                                color: p === currentPage ? '#b8960a' : T.muted,
                                            }}>
                                            {p}
                                        </button>
                                    ))}
                                    <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filtered.length / pageSize), p + 1))}
                                        disabled={currentPage >= Math.ceil(filtered.length / pageSize)}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-30"
                                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body }}>
                                        다음 →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )
            }

            {/* 드립 캠페인 탭 */}
            {
                tab === 'drip' && (
                    <DripCampaignTab />
                )
            }

            {/* 슬라이드 패널 */}
            <AnimatePresence>
                {slidePanel && (
                    <motion.div className="fixed inset-0 z-40 flex"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* 오버레이 */}
                        <div className="flex-1" style={{ background: 'rgba(15,23,42,0.3)' }}
                            onClick={() => setSlidePanel(null)} />
                        {/* 패널 */}
                        <motion.div className="h-full flex flex-col"
                            style={{ width: '82vw', background: T.card, borderLeft: `1px solid ${T.border}`, boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
                            {/* 헤더 */}
                            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                                <div>
                                    <h3 className="text-sm font-black" style={{ color: T.heading }}>{slidePanel.lead.companyName}</h3>
                                    <p className="text-xs mt-0.5" style={{ color: T.muted }}>{slidePanel.lead.contactName} · {slidePanel.lead.contactEmail}</p>
                                </div>
                                <button onClick={() => setSlidePanel(null)} className="p-1.5 rounded-lg hover:bg-slate-100" style={{ color: T.muted }}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {/* 탭 */}
                            <div className="flex gap-1 px-6 pt-3">
                                {([['clause', '📋 조문 검토'], ['email', '📧 이메일 미리보기']] as const).map(([k, label]) => (
                                    <button key={k} onClick={() => setSlidePanel({ ...slidePanel, tab: k })}
                                        className="px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                                        style={{ background: slidePanel.tab === k ? '#eef2ff' : 'transparent', color: slidePanel.tab === k ? '#4f46e5' : T.faint, border: slidePanel.tab === k ? '1px solid #c7d2fe' : '1px solid transparent' }}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                            {/* iframe 콘텐츠 */}
                            <div className="flex-1 p-4">
                                {slidePanel.tab === 'clause' && (
                                    <iframe
                                        src={`/lawyer/privacy-review?leadId=${slidePanel.lead.id}&company=${encodeURIComponent(slidePanel.lead.companyName)}&embed=true`}
                                        className="w-full h-full rounded-xl border"
                                        style={{ borderColor: T.border }} />
                                )}
                                {slidePanel.tab === 'email' && (
                                    <iframe
                                        src={`/admin/email-preview?leadId=${slidePanel.lead.id}&company=${encodeURIComponent(slidePanel.lead.companyName)}&embed=true`}
                                        className="w-full h-full rounded-xl border"
                                        style={{ borderColor: T.border }} />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
        </div >
    );
}

// ── 드립 캠페인 탭 컴포넌트 ──────────────────────────────────
const DRIP_STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
    active: { label: '진행중', bg: '#dbeafe', color: '#2563eb' },
    paused: { label: '일시중지', bg: '#fef3c7', color: '#d97706' },
    completed: { label: '완료', bg: '#dcfce7', color: '#16a34a' },
    converted: { label: '전환(결제)', bg: '#f3e8ff', color: '#9333ea' },
};

const EMAIL_TYPE_ICON: Record<string, string> = {
    legal_tip: '📋', case_study: '📊', risk_alert: '⚠️', cta: '🎯',
};

function DripCampaignTab() {
    const [members, setMembers] = useState<DripMember[]>(() => dripStore.getAll());
    const [filter, setFilter] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [sending, setSending] = useState<string | null>(null);

    const refresh = () => setMembers(dripStore.getAll());
    const pending = dripStore.getPendingEmails();
    const totalSteps = DRIP_SEQUENCE.length;

    const filtered = filter === 'all' ? members : members.filter(m => m.dripStatus === filter);
    const stats = {
        total: members.length,
        active: members.filter(m => m.dripStatus === 'active').length,
        completed: members.filter(m => m.dripStatus === 'completed').length,
        converted: members.filter(m => m.dripStatus === 'converted').length,
    };

    const handleSend = async (memberId: string, day: number) => {
        setSending(`${memberId}_${day}`);
        // 시뮬레이션: 실제로는 /api/drip/send 호출
        await new Promise(r => setTimeout(r, 800));
        dripStore.markSent(memberId, day);
        refresh();
        setSending(null);
    };

    const [nowMs] = useState(() => Date.now());
    const getDaysSinceJoin = (joinedAt: string) => Math.floor((nowMs - new Date(joinedAt).getTime()) / 86400000);

    return (
        <div className="space-y-4">
            {/* 통계 카드 */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: '전체 멤버', value: stats.total, bg: '#f1f5f9', border: '#e2e8f0', color: '#475569' },
                    { label: '진행중', value: stats.active, bg: '#dbeafe', border: '#93c5fd', color: '#2563eb' },
                    { label: '시퀀스 완료', value: stats.completed, bg: '#dcfce7', border: '#86efac', color: '#16a34a' },
                    { label: '전환(결제)', value: stats.converted, bg: '#f3e8ff', border: '#c4b5fd', color: '#9333ea' },
                ].map(c => (
                    <div key={c.label} className="px-5 py-4 rounded-2xl" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                        <p className="text-xs font-bold mb-1" style={{ color: c.color }}>{c.label}</p>
                        <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
                    </div>
                ))}
            </div>

            {/* 대기 이메일 알림 */}
            {pending.length > 0 && (
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#d97706' }} />
                    <span className="text-sm font-bold" style={{ color: '#92400e' }}>
                        발송 대기 이메일 <strong>{pending.length}건</strong>이 있습니다.
                    </span>
                    <button onClick={async () => {
                        for (const p of pending) {
                            await handleSend(p.member.id, p.email.day);
                        }
                    }} className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: '#fbbf24', color: '#78350f' }}>
                        <Send className="w-3 h-3 inline mr-1" />전체 발송
                    </button>
                </div>
            )}

            {/* 필터 + 테이블 */}
            <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                {/* 필터 */}
                <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                    {[
                        { key: 'all', label: '전체' },
                        { key: 'active', label: '진행중' },
                        { key: 'completed', label: '완료' },
                        { key: 'converted', label: '전환' },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                            style={{
                                background: filter === f.key ? '#fffbeb' : 'transparent',
                                border: filter === f.key ? '1px solid #fde68a' : '1px solid transparent',
                                color: filter === f.key ? '#b8960a' : T.muted,
                            }}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* 테이블 */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: '#f8f9fc', borderBottom: `2px solid ${T.border}` }}>
                                <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>회사명</th>
                                <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>담당자</th>
                                <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>가입일</th>
                                <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>경과일</th>
                                <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>진행률</th>
                                <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>상태</th>
                                <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: T.faint }}>등록된 멤버가 없습니다.</td></tr>
                            )}
                            {filtered.map(m => {
                                const days = getDaysSinceJoin(m.joinedAt);
                                const progress = m.sentDays.length;
                                const statusInfo = DRIP_STATUS_LABEL[m.dripStatus] ?? DRIP_STATUS_LABEL.active;
                                const isExpanded = expandedId === m.id;

                                return (
                                    <React.Fragment key={m.id}>
                                        <tr className="transition-colors hover:bg-slate-50 cursor-pointer"
                                            style={{ borderBottom: `1px solid ${T.borderSub}` }}
                                            onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                                            <td className="py-3 px-4 font-bold" style={{ color: T.heading }}>{m.companyName}</td>
                                            <td className="py-3 px-4" style={{ color: T.sub }}>{m.contactName}<br /><span className="text-xs" style={{ color: T.faint }}>{m.contactEmail}</span></td>
                                            <td className="py-3 px-4 text-xs" style={{ color: T.sub }}>{new Date(m.joinedAt).toLocaleDateString('ko-KR')}</td>
                                            <td className="py-3 px-4 font-bold" style={{ color: T.body }}>D+{days}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                                                        <div className="h-full rounded-full transition-all" style={{
                                                            width: `${(progress / totalSteps) * 100}%`,
                                                            background: progress === totalSteps ? '#16a34a' : 'linear-gradient(90deg, #c9a84c, #e8c87a)',
                                                        }} />
                                                    </div>
                                                    <span className="text-xs font-bold" style={{ color: T.sub }}>{progress}/{totalSteps}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button className="text-xs font-bold px-3 py-1 rounded-lg"
                                                    style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                                                    onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : m.id); }}>
                                                    <Eye className="w-3 h-3 inline mr-1" />{isExpanded ? '접기' : '상세'}
                                                </button>
                                            </td>
                                        </tr>
                                        {/* 확장 행: 이메일 시퀀스 상세 */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={7}>
                                                    <div className="px-6 py-4" style={{ background: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
                                                        <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: T.sub }}>
                                                            <Mail className="w-3.5 h-3.5" />이메일 시퀀스 ({totalSteps}단계)
                                                        </p>
                                                        <div className="space-y-2">
                                                            {DRIP_SEQUENCE.map(email => {
                                                                const sent = m.sentDays.includes(email.day);
                                                                const canSend = !sent && email.day <= days && m.dripStatus === 'active';
                                                                const isSending = sending === `${m.id}_${email.day}`;
                                                                return (
                                                                    <div key={email.day} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs"
                                                                        style={{
                                                                            background: sent ? '#f0fdf4' : canSend ? '#fffbeb' : T.card,
                                                                            border: `1px solid ${sent ? '#bbf7d0' : canSend ? '#fde68a' : T.borderSub}`,
                                                                        }}>
                                                                        <span className="shrink-0 w-12 font-bold" style={{ color: T.sub }}>D+{email.day}</span>
                                                                        <span className="shrink-0">{EMAIL_TYPE_ICON[email.contentType] || '📧'}</span>
                                                                        <span className="flex-1 font-medium truncate" style={{ color: T.body }}>{email.subject.replace(/\{[^}]+\}/g, '…')}</span>
                                                                        {sent ? (
                                                                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                                                                <CheckCircle2 className="w-3 h-3" />발송완료
                                                                            </span>
                                                                        ) : canSend ? (
                                                                            <button onClick={e => { e.stopPropagation(); handleSend(m.id, email.day); }}
                                                                                disabled={!!isSending}
                                                                                className="shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold disabled:opacity-50"
                                                                                style={{ background: '#fbbf24', color: '#78350f' }}>
                                                                                {isSending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                                                                {isSending ? '발송중...' : '발송'}
                                                                            </button>
                                                                        ) : (
                                                                            <span className="shrink-0 text-xs font-medium" style={{ color: T.faint }}>
                                                                                <Clock className="w-3 h-3 inline mr-0.5" />D+{email.day} 대기
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {/* 전환 버튼 */}
                                                        {m.dripStatus === 'active' && !m.subscribed && (
                                                            <div className="mt-3 flex justify-end">
                                                                <button onClick={e => { e.stopPropagation(); dripStore.markSubscribed(m.id); refresh(); }}
                                                                    className="px-4 py-2 rounded-xl text-xs font-black"
                                                                    style={{ background: 'linear-gradient(135deg, #e8c87a, #c9a84c)', color: '#04091a' }}>
                                                                    ✨ 결제 전환 처리
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
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
        </div>
    );
}
