'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, PhoneOff, CheckCircle2, Mail, FileText, Star,
    Clock, Building2, Globe, User, MessageSquare, Send,
    Pause, Play, Volume2, ChevronRight, ChevronDown, ArrowUpDown,
    Search, Eye, ExternalLink, AlertCircle, Copy, Check,
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    store, Company, CaseStatus,
    STATUS_LABEL, STATUS_COLOR, STATUS_TEXT,
    SALES_REPS,
} from '@/lib/mockStore';
import Link from 'next/link';

/* ── 색상 ─────────────────────────────────────────────── */
const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#e2e8f0', borderLight: '#f1f5f9',
    bg: '#f8f9fc', card: '#ffffff', hover: '#f1f5f9',
};

/* ── 통화 가능 상태 ───────────────────────────────────── */
const CALLABLE: CaseStatus[] = [
    'analyzed', 'sales_confirmed', 'lawyer_confirmed',
    'emailed', 'client_replied', 'client_viewed',
    'contract_sent', 'contract_signed',
];

/* ── 필터 칩 정의 ─────────────────────────────────────── */
const FILTER_CHIPS: { key: CaseStatus | 'all'; label: string; color: string }[] = [
    { key: 'all', label: '전체', color: '#475569' },
    { key: 'analyzed', label: '분석완료', color: '#2563eb' },
    { key: 'sales_confirmed', label: '영업컨펌', color: '#7c3aed' },
    { key: 'lawyer_confirmed', label: '변호사컨펌', color: '#059669' },
    { key: 'emailed', label: '이메일발송', color: '#d97706' },
    { key: 'client_replied', label: '답장수신', color: '#db2777' },
    { key: 'client_viewed', label: '리포트열람', color: '#ea580c' },
    { key: 'contract_sent', label: '계약서발송', color: '#0891b2' },
    { key: 'contract_signed', label: '서명완료', color: '#16a34a' },
];

/* ── 정렬 키 ──────────────────────────────────────────── */
type SortKey = 'name' | 'risk' | 'status' | 'none';

/* ── 스크립트 ─────────────────────────────────────────── */
function getScript(c: Company): string {
    const hi = c.contactName ? `${c.contactName} 님` : '담당자님';
    const issues = (c.issues || []).slice(0, 3);
    const issueText = issues.length > 0
        ? issues.map((i, idx) => `  ${idx + 1}. [${i.level}] ${i.title}`).join('\n')
        : '  (분석 결과 대기 중)';
    if (['analyzed', 'sales_confirmed'].includes(c.status))
        return `안녕하세요, ${hi}.\n법률사무소 IBS 영업팀입니다.\n\n${c.name}의 개인정보처리방침을 검토한 결과,\n아래와 같은 법적 리스크가 확인되었습니다:\n\n${issueText}\n\n현재 개인정보보호위원회의 프랜차이즈 업종 집중 점검이\n진행 중인 만큼, 사전 대응을 권고드립니다.\n\n혹시 관련하여 잠시 통화 가능하실까요?`;
    if (['lawyer_confirmed', 'emailed'].includes(c.status))
        return `${hi}, 법률사무소 IBS입니다.\n\n앞서 발송드린 ${c.name} 개인정보 진단 보고서는\n확인하셨을까요?\n\n보고서에 포함된 주요 리스크:\n${issueText}\n\n전담 변호사의 상세 검토 의견이 준비되어 있으니,\n편하신 시간에 미팅을 잡아드릴까요?`;
    if (['client_replied', 'client_viewed'].includes(c.status))
        return `${hi}, 법률사무소 IBS입니다.\n\n보고서를 검토해 주셔서 감사합니다.\n\n현재 계약 진행을 위한 서류가 준비되어 있습니다.\n월 자문 계약의 주요 내용을 안내드릴까요?\n\n• 개인정보처리방침 전면 재작성\n• 분기별 컴플라이언스 점검\n• 사고 발생 시 즉시 대응`;
    return `${hi}, 법률사무소 IBS 영업팀입니다.\n${c.name} 건 관련 안내드리고자 연락드렸습니다.`;
}

/* ── 상태 배지 ─────────────────────────────────────────── */
function Badge({ status }: { status: CaseStatus }) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"
        style={{ background: STATUS_COLOR[status], color: STATUS_TEXT[status] }}>{STATUS_LABEL[status]}</span>;
}

/* ── 리스크 레벨 색상 ──────────────────────────────────── */
function riskColor(score: number) {
    if (score >= 70) return { bar: '#ef4444', text: '#dc2626', bg: '#fef2f2' };
    if (score >= 40) return { bar: '#f59e0b', text: '#d97706', bg: '#fffbeb' };
    return { bar: '#22c55e', text: '#16a34a', bg: '#f0fdf4' };
}

function issueBadge(level: string) {
    if (level === 'HIGH') return { bg: '#fecaca', color: '#dc2626' };
    if (level === 'MEDIUM') return { bg: '#fef3c7', color: '#d97706' };
    return { bg: '#dbeafe', color: '#2563eb' };
}

/* ── 타이머 ────────────────────────────────────────────── */
function useTimer() {
    const [sec, setSec] = useState(0);
    const [running, setRunning] = useState(false);
    const ref = useRef<ReturnType<typeof setInterval> | null>(null);
    const start = useCallback(() => { setSec(0); setRunning(true); }, []);
    const pause = useCallback(() => setRunning(false), []);
    const resume = useCallback(() => setRunning(true), []);
    const reset = useCallback(() => { setSec(0); setRunning(false); }, []);
    useEffect(() => {
        if (running) ref.current = setInterval(() => setSec(s => s + 1), 1000);
        else if (ref.current) clearInterval(ref.current);
        return () => { if (ref.current) clearInterval(ref.current); };
    }, [running]);
    const fmt = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    return { sec, fmt, running, start, pause, resume, reset };
}

/* ══════════════════════════════════════════════════════════
   메인 페이지
   ══════════════════════════════════════════════════════════ */
export default function SalesCallPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [toast, setToast] = useState('');
    const [callNote, setCallNote] = useState('');
    const [callResult, setCallResult] = useState<'connected' | 'no_answer' | 'callback' | ''>('');
    const [activeCallId, setActiveCallId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
    const [sortKey, setSortKey] = useState<SortKey>('none');
    const [sortAsc, setSortAsc] = useState(true);
    const [copiedScript, setCopiedScript] = useState(false);
    const timer = useTimer();

    const refresh = useCallback(() => {
        setCompanies(store.getAll().filter(c => CALLABLE.includes(c.status)));
    }, []);
    useEffect(() => { refresh(); const id = setInterval(refresh, 2000); return () => clearInterval(id); }, [refresh]);
    useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);

    const filtered = companies
        .filter(c => {
            if (statusFilter !== 'all' && c.status !== statusFilter) return false;
            const q = search.toLowerCase();
            return c.name.toLowerCase().includes(q) || c.biz.includes(q) || (c.contactName || '').includes(q);
        })
        .sort((a, b) => {
            if (sortKey === 'none') return 0;
            let cmp = 0;
            if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
            else if (sortKey === 'risk') cmp = (a.riskScore || 0) - (b.riskScore || 0);
            else if (sortKey === 'status') cmp = CALLABLE.indexOf(a.status) - CALLABLE.indexOf(b.status);
            return sortAsc ? cmp : -cmp;
        });

    // 필터별 카운트
    const statusCounts: Record<string, number> = { all: companies.length };
    companies.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });

    const toggleRow = (id: string) => {
        if (expandedId === id) { setExpandedId(null); }
        else { setExpandedId(id); const co = companies.find(c => c.id === id); if (co) setCallNote(co.callNote || ''); setCallResult(''); }
    };

    const startCall = (id: string) => { setActiveCallId(id); setCallResult(''); timer.start(); };

    const handleCallResult = (result: 'connected' | 'no_answer' | 'callback') => {
        setCallResult(result);
        setToast(result === 'connected' ? '✅ 연결됨 — 저장됨' : result === 'no_answer' ? '📵 부재중 — 저장됨' : '📋 콜백요청 — 저장됨');
    };

    const endCall = (c: Company) => {
        store.update(c.id, { callNote: callNote || `통화 완료 (${callResult || 'connected'})` });
        if (c.status === 'analyzed') store.salesConfirm(c.id, SALES_REPS[0]);
        setActiveCallId(null); timer.reset(); setCallResult(''); refresh();
        const curIdx = filtered.findIndex(co => co.id === c.id);
        const next = filtered[curIdx + 1];
        if (next) { setToast(`✅ ${c.name} 완료 → ${next.name}`); setTimeout(() => { setExpandedId(next.id); setCallNote(next.callNote || ''); }, 500); }
        else { setToast(`✅ ${c.name} 완료 — 마지막`); setExpandedId(null); }
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) { setSortAsc(!sortAsc); }
        else { setSortKey(key); setSortAsc(true); }
    };

    const copyScript = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedScript(true);
            setToast('📋 스크립트가 클립보드에 복사되었습니다');
            setTimeout(() => setCopiedScript(false), 2000);
        });
    };

    const SortIcon = ({ col }: { col: SortKey }) => (
        <ArrowUpDown className="w-3 h-3 inline ml-1 cursor-pointer transition-all opacity-40 hover:opacity-100"
            style={{ color: sortKey === col ? '#2563eb' : T.faint, transform: sortKey === col && !sortAsc ? 'scaleY(-1)' : 'none' }}
            onClick={(e) => { e.stopPropagation(); handleSort(col); }} />
    );

    return (
        <div className="min-h-screen" style={{ background: T.bg }}>

            {/* 토스트 */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-bold shadow-xl"
                        style={{ background: '#065f46', color: '#d1fae5', border: '1px solid #34d399' }}>{toast}</motion.div>
                )}
            </AnimatePresence>

            {/* ── 통화 중 상단 바 ─────────────────────── */}
            <AnimatePresence>
                {activeCallId && (() => {
                    const ac = companies.find(c => c.id === activeCallId);
                    if (!ac) return null;
                    return (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="sticky top-[64px] z-30" style={{ background: '#ecfdf5', borderBottom: '1px solid #a7f3d0' }}>
                            <div className="max-w-[1800px] mx-auto px-6 py-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                                    <span className="text-sm font-bold" style={{ color: '#065f46' }}>{ac.name} 통화 중</span>
                                    <span className="font-mono text-xl font-black" style={{ color: '#059669' }}>{timer.fmt}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={timer.running ? timer.pause : timer.resume}
                                        className="p-1.5 rounded-lg" style={{ background: '#d1fae5' }}>
                                        {timer.running ? <Pause className="w-4 h-4" style={{ color: '#059669' }} /> : <Play className="w-4 h-4" style={{ color: '#059669' }} />}
                                    </button>
                                    <button onClick={() => endCall(ac)}
                                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold"
                                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                        <PhoneOff className="w-3.5 h-3.5" /> 통화 종료
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* ── 헤더 ────────────────────────────────── */}
            <div className="max-w-[1800px] mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black flex items-center gap-2" style={{ color: T.heading }}>
                        <Phone className="w-5 h-5" style={{ color: '#2563eb' }} /> 전화 영업
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: T.muted }}>
                        {filtered.length}개 기업 대기 중 · 클릭하여 상세보기
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: T.faint }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="검색"
                            className="pl-9 pr-4 py-2 rounded-lg text-xs" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none', width: 200 }} />
                    </div>
                    <Link href="/employee"><Button variant="outline" size="sm">← CRM</Button></Link>
                </div>
            </div>

            {/* ── 필터 칩 ──────────────────────────────── */}
            <div className="max-w-[1800px] mx-auto px-6 pb-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Filter className="w-3.5 h-3.5 mr-1" style={{ color: T.faint }} />
                    {FILTER_CHIPS.map(chip => {
                        const count = statusCounts[chip.key] || 0;
                        const isActive = statusFilter === chip.key;
                        if (chip.key !== 'all' && count === 0) return null;
                        return (
                            <button key={chip.key} onClick={() => setStatusFilter(chip.key)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                style={{
                                    background: isActive ? `${chip.color}12` : 'transparent',
                                    color: isActive ? chip.color : T.muted,
                                    border: `1px solid ${isActive ? `${chip.color}40` : T.borderLight}`,
                                }}>
                                {chip.label} {count > 0 && <span className="ml-1 text-[9px] opacity-70">{count}</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── 테이블 ──────────────────────────────── */}
            <div className="max-w-[1800px] mx-auto px-6 pb-8">
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}`, background: T.card }}>
                    {/* 헤더 */}
                    <div className="grid items-center text-[10px] font-black tracking-wider uppercase px-5 py-2.5"
                        style={{
                            gridTemplateColumns: '2fr 1.3fr 100px 100px 140px 180px 1fr 100px',
                            background: '#f8f9fc', borderBottom: `2px solid ${T.border}`, color: T.sub,
                        }}>
                        <span className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                            기업명 <SortIcon col="name" />
                        </span>
                        <span>사업자번호</span>
                        <span className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                            상태 <SortIcon col="status" />
                        </span>
                        <span className="cursor-pointer select-none" onClick={() => handleSort('risk')}>
                            리스크 <SortIcon col="risk" />
                        </span>
                        <span>담당자 / 전화</span>
                        <span>핵심 이슈</span>
                        <span>메모</span>
                        <span className="text-center">통화</span>
                    </div>

                    {/* 행 */}
                    {filtered.length === 0 && (
                        <div className="text-center py-16 text-sm" style={{ color: T.muted }}>통화 대상이 없습니다</div>
                    )}
                    {filtered.map((c, i) => {
                        const isExpanded = expandedId === c.id;
                        const isOnCall = activeCallId === c.id;
                        const rc = riskColor(c.riskScore);
                        const topIssues = (c.issues || []).slice(0, 2);

                        return (
                            <div key={c.id}>
                                {/* ─ 메인 행 ─ */}
                                <div
                                    onClick={() => toggleRow(c.id)}
                                    className="grid items-center px-5 py-3 cursor-pointer transition-all"
                                    style={{
                                        gridTemplateColumns: '2fr 1.3fr 100px 100px 140px 180px 1fr 100px',
                                        background: isExpanded ? '#f0f7ff' : isOnCall ? '#ecfdf5' : i % 2 === 0 ? '#fff' : '#fafbfd',
                                        borderBottom: isExpanded ? 'none' : `1px solid ${T.borderLight}`,
                                        borderLeft: isExpanded ? '3px solid #3b82f6' : '3px solid transparent',
                                    }}
                                    onMouseEnter={e => { if (!isExpanded && !isOnCall) e.currentTarget.style.background = T.hover; }}
                                    onMouseLeave={e => { if (!isExpanded && !isOnCall) e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfd'; }}>

                                    {/* 기업명 + 업종 */}
                                    <div className="flex items-center gap-2 min-w-0">
                                        <ChevronRight className="w-3 h-3 flex-shrink-0 transition-transform"
                                            style={{ color: T.faint, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }} />
                                        <div className="min-w-0">
                                            <span className="text-[13px] font-bold block truncate" style={{ color: T.heading }}>{c.name}</span>
                                            <span className="text-[10px] block truncate" style={{ color: T.faint }}>{c.domain || c.url}</span>
                                        </div>
                                    </div>

                                    {/* 사업자번호 */}
                                    <span className="text-xs font-mono" style={{ color: T.muted }}>{c.biz}</span>

                                    {/* 상태 */}
                                    <Badge status={c.status} />

                                    {/* 리스크 — 개선: 점수 없으면 "분석 대기" 표시 */}
                                    <div className="flex items-center gap-1.5">
                                        {c.riskScore > 0 ? (
                                            <>
                                                <div className="w-8 h-1.5 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                                                    <div className="h-full rounded-full" style={{ width: `${c.riskScore}%`, background: rc.bar }} />
                                                </div>
                                                <span className="text-[11px] font-black" style={{ color: rc.text }}>{c.riskScore}</span>
                                            </>
                                        ) : (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold"
                                                style={{ background: '#f1f5f9', color: T.faint, border: '1px solid #e2e8f0' }}>
                                                <Clock className="w-2.5 h-2.5 mr-0.5" /> 분석 대기
                                            </span>
                                        )}
                                    </div>

                                    {/* 담당자 / 전화 — 개선: 없으면 "미등록" 배지 표시 */}
                                    <div className="min-w-0">
                                        {c.contactName ? (
                                            <span className="text-xs font-semibold block truncate" style={{ color: T.body }}>{c.contactName}</span>
                                        ) : (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold"
                                                style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
                                                미등록
                                            </span>
                                        )}
                                        <a href={`tel:${c.contactPhone || c.phone}`} onClick={e => e.stopPropagation()}
                                            className="text-[11px] font-bold underline block truncate" style={{ color: '#2563eb' }}>
                                            {c.contactPhone || c.phone}
                                        </a>
                                    </div>

                                    {/* 핵심 이슈 (2개까지 직접 표시) */}
                                    <div className="flex flex-wrap gap-1 min-w-0">
                                        {topIssues.map((iss, j) => {
                                            const ib = issueBadge(iss.level);
                                            return (
                                                <span key={j} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold truncate max-w-[85px]"
                                                    style={{ background: ib.bg, color: ib.color }}>
                                                    {iss.level === 'HIGH' && <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />}
                                                    <span className="truncate">{iss.title}</span>
                                                </span>
                                            );
                                        })}
                                        {(c.issues || []).length > 2 && (
                                            <span className="text-[9px] font-bold px-1" style={{ color: T.faint }}>+{(c.issues || []).length - 2}</span>
                                        )}
                                    </div>

                                    {/* 메모 미리보기 */}
                                    <span className="text-[11px] truncate" style={{ color: c.callNote ? T.body : T.faint }}>
                                        {c.callNote || '메모 없음'}
                                    </span>

                                    {/* 통화 버튼 */}
                                    <div className="text-center" onClick={e => e.stopPropagation()}>
                                        {isOnCall ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: '#059669' }}>
                                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                                                {timer.fmt}
                                            </span>
                                        ) : (
                                            <button onClick={() => { if (!isExpanded) toggleRow(c.id); startCall(c.id); }}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
                                                style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                                                <Phone className="w-3 h-3" /> 전화
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* ═══ 확장 패널 (좌우 와이드) ═══ */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            style={{ overflow: 'hidden', borderBottom: `1px solid ${T.border}`, borderLeft: '3px solid #3b82f6' }}>
                                            <div className="px-6 py-5" style={{ background: '#f8faff' }}>

                                                {/* 4 컬럼 레이아웃 → 반응형 지원 */}
                                                <div className="grid gap-4" style={{ gridTemplateColumns: '260px 1fr 280px 200px' }}>

                                                    {/* ❶ 기업 연락처 상세 */}
                                                    <div className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                                        <p className="text-[10px] font-black mb-3 uppercase tracking-wider flex items-center gap-1.5"
                                                            style={{ color: T.faint }}>
                                                            <Building2 className="w-3 h-3" /> 기업 상세
                                                        </p>
                                                        <div className="space-y-2.5 text-xs">
                                                            {[
                                                                { icon: User, label: '담당자', val: c.contactName || '미등록' },
                                                                { icon: Phone, label: '전화', val: c.contactPhone || c.phone, href: `tel:${c.contactPhone || c.phone}` },
                                                                { icon: Mail, label: '이메일', val: c.contactEmail || c.email },
                                                                { icon: Globe, label: '도메인', val: c.domain || c.url },
                                                                { icon: Building2, label: '매장수', val: `${c.storeCount}개` },
                                                            ].map(r => (
                                                                <div key={r.label} className="flex items-center gap-2">
                                                                    <r.icon className="w-3 h-3 flex-shrink-0" style={{ color: T.faint }} />
                                                                    <span className="w-10 flex-shrink-0" style={{ color: T.muted }}>{r.label}</span>
                                                                    {r.href ? (
                                                                        <a href={r.href} className="font-bold underline truncate" style={{ color: '#2563eb' }}>{r.val}</a>
                                                                    ) : (
                                                                        <span className="font-semibold truncate" style={{ color: r.val === '미등록' ? '#d97706' : T.body }}>{r.val}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* 리스크 점수 */}
                                                        {c.riskScore > 0 ? (() => {
                                                            const rc2 = riskColor(c.riskScore);
                                                            return (
                                                                <div className="mt-3 rounded-lg p-3" style={{ background: rc2.bg }}>
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-[9px] font-bold" style={{ color: rc2.text }}>위험 점수</span>
                                                                        <span className="text-lg font-black" style={{ color: rc2.text }}>{c.riskScore}</span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                                                        <div className="h-full rounded-full" style={{ width: `${c.riskScore}%`, background: rc2.bar }} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })() : (
                                                            <div className="mt-3 rounded-lg p-3" style={{ background: '#f1f5f9' }}>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-3.5 h-3.5" style={{ color: T.faint }} />
                                                                    <span className="text-[11px] font-bold" style={{ color: T.muted }}>분석 대기 중</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* 전체 이슈 목록 */}
                                                        {c.issues && c.issues.length > 0 && (
                                                            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderLight}` }}>
                                                                <p className="text-[9px] font-black mb-1.5 flex items-center gap-1" style={{ color: '#dc2626' }}>
                                                                    <AlertCircle className="w-2.5 h-2.5" /> 전체 이슈 ({c.issues.length}건)
                                                                </p>
                                                                {c.issues.map((iss, j) => {
                                                                    const ib = issueBadge(iss.level);
                                                                    return (
                                                                        <div key={j} className="flex items-center gap-1.5 text-[11px] py-0.5">
                                                                            <span className="px-1 rounded text-[8px] font-bold flex-shrink-0"
                                                                                style={{ background: ib.bg, color: ib.color }}>{iss.level}</span>
                                                                            <span className="truncate" style={{ color: T.body }}>{iss.title}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ❷ 통화 스크립트 (가장 넓은 영역) */}
                                                    <div className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Volume2 className="w-3.5 h-3.5" style={{ color: '#2563eb' }} />
                                                                <span className="text-[11px] font-black" style={{ color: T.sub }}>통화 스크립트</span>
                                                                <Badge status={c.status} />
                                                            </div>
                                                            {/* 📋 스크립트 복사 버튼 */}
                                                            <button
                                                                onClick={() => copyScript(getScript(c))}
                                                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
                                                                style={{
                                                                    background: copiedScript ? '#ecfdf5' : '#f1f5f9',
                                                                    color: copiedScript ? '#059669' : T.muted,
                                                                    border: `1px solid ${copiedScript ? '#a7f3d0' : T.borderLight}`,
                                                                }}>
                                                                {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                                {copiedScript ? '복사됨' : '복사'}
                                                            </button>
                                                        </div>
                                                        <div className="text-[12.5px] leading-[1.85] whitespace-pre-line" style={{ color: T.body }}>
                                                            {getScript(c)}
                                                        </div>

                                                        {/* 통화 결과 태그 — 개선: 선택 시 즉시 피드백 */}
                                                        <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${T.borderLight}` }}>
                                                            <span className="text-[10px] font-bold" style={{ color: T.faint }}>결과</span>
                                                            {[
                                                                { key: 'connected' as const, label: '✅ 연결됨', c: '#059669', bg: '#ecfdf5', bd: '#a7f3d0' },
                                                                { key: 'no_answer' as const, label: '📵 부재중', c: '#d97706', bg: '#fffbeb', bd: '#fde68a' },
                                                                { key: 'callback' as const, label: '📋 콜백요청', c: '#2563eb', bg: '#eff6ff', bd: '#bfdbfe' },
                                                            ].map(r => (
                                                                <button key={r.key} onClick={() => handleCallResult(r.key)}
                                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all relative"
                                                                    style={{
                                                                        background: callResult === r.key ? r.bg : '#fff',
                                                                        color: callResult === r.key ? r.c : T.faint,
                                                                        border: `1px solid ${callResult === r.key ? r.bd : T.borderLight}`,
                                                                        transform: callResult === r.key ? 'scale(1.05)' : 'scale(1)',
                                                                    }}>
                                                                    {r.label}
                                                                    {callResult === r.key && (
                                                                        <motion.div
                                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
                                                                            style={{ background: r.c }}>
                                                                            <Check className="w-2 h-2 text-white" />
                                                                        </motion.div>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* ❸ 통화 메모 */}
                                                    <div className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                                        <p className="text-[10px] font-black mb-2 flex items-center gap-1.5" style={{ color: T.faint }}>
                                                            <MessageSquare className="w-3 h-3" /> 통화 메모
                                                        </p>
                                                        <textarea value={callNote} onChange={e => setCallNote(e.target.value)}
                                                            placeholder="통화 내용 기록..."
                                                            rows={7} className="w-full rounded-lg text-xs p-3"
                                                            style={{ background: '#f8f9fc', border: `1px solid ${T.borderLight}`, color: T.body, outline: 'none', resize: 'none' }} />
                                                        <button onClick={() => { store.update(c.id, { callNote }); refresh(); setToast('💾 메모 저장'); }}
                                                            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold"
                                                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                                                            <Send className="w-3 h-3" /> 저장
                                                        </button>
                                                    </div>

                                                    {/* ❹ 빠른 액션 */}
                                                    <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                                        <p className="text-[10px] font-black mb-1 flex items-center gap-1.5" style={{ color: T.faint }}>
                                                            ⚡ 빠른 액션
                                                        </p>

                                                        {!isOnCall ? (
                                                            <button onClick={() => startCall(c.id)}
                                                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                                                                style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                                                                <Phone className="w-3.5 h-3.5" /> 전화 걸기
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => endCall(c)}
                                                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                                                                style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                                                <PhoneOff className="w-3.5 h-3.5" /> 종료 + 다음
                                                            </button>
                                                        )}

                                                        {c.status === 'lawyer_confirmed' && (
                                                            <button onClick={() => { store.sendEmail(c.id); refresh(); setToast('✉️ 이메일 발송'); }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold"
                                                                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                                                                <Mail className="w-3.5 h-3.5" /> 이메일 발송
                                                            </button>
                                                        )}
                                                        {(c.status === 'client_replied' || c.status === 'client_viewed') && (
                                                            <button onClick={() => { store.sendContract(c.id, 'email'); refresh(); setToast('📄 계약서 발송'); }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold"
                                                                style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>
                                                                <FileText className="w-3.5 h-3.5" /> 계약서 발송
                                                            </button>
                                                        )}
                                                        {c.status === 'contract_sent' && (
                                                            <button onClick={() => { store.signContract(c.id); refresh(); setToast('✅ 서명 확인'); }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold"
                                                                style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> 서명 확인
                                                            </button>
                                                        )}
                                                        {c.status === 'contract_signed' && (
                                                            <button onClick={() => { store.subscribe(c.id, 'standard'); refresh(); setToast('⭐ 구독 확정'); }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold"
                                                                style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>
                                                                <Star className="w-3.5 h-3.5" /> 구독 확정
                                                            </button>
                                                        )}

                                                        <div className="flex-1" />

                                                        <Link href={`/privacy-report?company=${encodeURIComponent(c.name)}`} target="_blank">
                                                            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold"
                                                                style={{ background: '#f9fafb', color: T.muted, border: `1px solid ${T.borderLight}` }}>
                                                                <ExternalLink className="w-3 h-3" /> 진단 보고서
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {/* 하단 범례 */}
                <div className="mt-3 flex items-center justify-between text-[10px]" style={{ color: T.faint }}>
                    <div className="flex items-center gap-4">
                        <span>행 클릭 → 상세 · <kbd className="px-1 rounded" style={{ background: '#e5e7eb' }}>전화</kbd> 버튼 → 즉시 통화 · 통화 종료 → 자동 다음 기업</span>
                    </div>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                    </span>
                </div>
            </div>
        </div>
    );
}
