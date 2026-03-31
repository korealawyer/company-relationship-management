'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Search, CheckCircle2, Phone, Mail, BarChart3, Gavel,
    ChevronDown, ChevronUp, Sparkles, Activity, Clock, AlertTriangle,
    TrendingUp, Users, Crown, Shield, FileText, Send, Edit3, Trash2,
    Calendar, MessageSquare, MoreHorizontal, Download, Filter, X, Check
} from 'lucide-react';
import Link from 'next/link';
import { DocumentWidget } from '@/components/DocumentWidget';
import type { Company } from '@/lib/types';
import { useCompanies } from '@/hooks/useDataLayer';
import { AdminCompanyEditModal } from '@/components/admin/AdminCompanyEditModal';

/* ── 상수 ──────────────────────────────────────────────────── */

const PLAN_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    premium:  { label: 'Premium',  color: '#92400e', bg: 'bg-amber-50',    border: 'border-amber-200', icon: Crown },
    standard: { label: 'Standard', color: '#3730a3', bg: 'bg-indigo-50',   border: 'border-indigo-200', icon: Shield },
    starter:  { label: 'Starter',  color: '#166534', bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: Sparkles },
    none:     { label: '미구독',    color: '#64748b', bg: 'bg-slate-50',    border: 'border-slate-200', icon: Users },
};

const STATUS_META: Record<string, { label: string; dot: string }> = {
    active:    { label: '활성',     dot: 'bg-emerald-500' },
    pending:   { label: '검토 중',  dot: 'bg-amber-500' },
    suspended: { label: '정지',     dot: 'bg-red-500' },
    trial:     { label: '트라이얼', dot: 'bg-indigo-500' },
    analyzed:  { label: '분석완료', dot: 'bg-cyan-500' },
    lawyer_review: { label: '변호사검토', dot: 'bg-purple-500' },
    lawyer_confirmed: { label: '변호사컨펌', dot: 'bg-blue-500' },
    assigned:  { label: '배정완료', dot: 'bg-teal-500' },
    emailed:   { label: '발송완료', dot: 'bg-sky-500' },
};

/* ── 헬스 스코어 계산 ──────────────────────────────────────── */

function calcHealthScore(c: Company): { score: number; label: string; color: string; bg: string } {
    let score = 100;

    // 최근 활동 기반 감점
    const lastActivity = getLastActivityDate(c);
    if (lastActivity) {
        const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000);
        if (daysSince > 60) score -= 30;
        else if (daysSince > 30) score -= 15;
        else if (daysSince > 14) score -= 5;
    } else {
        score -= 20; // 활동 기록 없음
    }

    // 이슈 기반 감점
    if (c.issues?.length >= 5) score -= 20;
    else if (c.issues?.length >= 3) score -= 10;

    // 플랜 미구독 감점
    if (!c.plan || c.plan === 'none') score -= 15;

    // 위험도 기반 감점
    if (c.riskLevel === 'HIGH') score -= 10;

    // 메모/통화 없으면 감점
    if (!c.memos || c.memos.length === 0) score -= 5;
    if (!c.lastCallAt) score -= 5;

    score = Math.max(0, Math.min(100, score));

    if (score >= 80) return { score, label: '건강', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    if (score >= 50) return { score, label: '주의', color: 'text-amber-700', bg: 'bg-amber-100' };
    return { score, label: '위험', color: 'text-red-700', bg: 'bg-red-100' };
}

function getLastActivityDate(c: Company): string | null {
    const dates: string[] = [];
    if (c.lastCallAt) dates.push(c.lastCallAt);
    if (c.emailSentAt) dates.push(c.emailSentAt);
    if (c.updatedAt) dates.push(c.updatedAt);
    if (c.memos?.length) {
        const sorted = [...c.memos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        dates.push(sorted[0].createdAt);
    }
    if (c.timeline?.length) {
        dates.push(c.timeline[0].createdAt);
    }
    if (dates.length === 0) return null;
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function formatRelativeDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diff === 0) return '오늘';
    if (diff === 1) return '어제';
    if (diff < 7) return `${diff}일 전`;
    if (diff < 30) return `${Math.floor(diff / 7)}주 전`;
    if (diff < 365) return `${Math.floor(diff / 30)}달 전`;
    return `${Math.floor(diff / 365)}년 전`;
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/* ── 탭 상수 ─────────────────────────────────────────────── */
type DetailTab = 'info' | 'activity' | 'docs';
const DETAIL_TABS: { key: DetailTab; label: string; icon: React.ElementType }[] = [
    { key: 'info',     label: '기본 정보',  icon: Building2 },
    { key: 'activity', label: '활동 이력',  icon: Activity },
    { key: 'docs',     label: '문서함',     icon: FileText },
];

/* ══════════════════════════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════════════════════════ */

export default function AdminClientsPage() {
    const { companies, updateCompany, deleteCompany } = useCompanies();
    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState<string>('all_clients');
    const [filterHealth, setFilterHealth] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'stores' | 'plan' | 'health' | 'activity'>('name');
    const [sortAsc, setSortAsc] = useState(true);
    const [expandId, setExpandId] = useState<string | null>(null);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [detailTab, setDetailTab] = useState<DetailTab>('info');
    const [showFilters, setShowFilters] = useState(false);
    const [toast, setToast] = useState('');

    // ── KPI 계산 ─────────────────────────────────────────
    const kpi = useMemo(() => {
        const total = companies.length;
        const subscribers = companies.filter(c => c.plan && c.plan !== 'none');
        const premium = companies.filter(c => c.plan === 'premium').length;
        const standard = companies.filter(c => c.plan === 'standard').length;
        const starter = companies.filter(c => c.plan === 'starter').length;
        const atRisk = companies.filter(c => calcHealthScore(c).score < 50).length;
        const totalStores = companies.reduce((sum, c) => sum + (c.storeCount || 0), 0);
        return { total, subscribers: subscribers.length, premium, standard, starter, atRisk, totalStores };
    }, [companies]);

    // ── 필터 + 정렬 ─────────────────────────────────────
    const filtered = useMemo(() => {
        return companies
            .filter(c => {
                const q = search.toLowerCase();
                const matchSearch = !q || (c.name || '').toLowerCase().includes(q) ||
                    (c.email || '').toLowerCase().includes(q) ||
                    (c.biz || '').toLowerCase().includes(q) ||
                    (c.phone || '').includes(q);

                let matchPlan = false;
                if (filterPlan === 'all_users') matchPlan = true;
                else if (filterPlan === 'all_clients') matchPlan = !!c.plan && c.plan !== 'none';
                else if (filterPlan === 'none') matchPlan = !c.plan || c.plan === 'none';
                else matchPlan = c.plan === filterPlan;

                let matchHealth = true;
                if (filterHealth === 'danger') matchHealth = calcHealthScore(c).score < 50;
                else if (filterHealth === 'warning') { const s = calcHealthScore(c).score; matchHealth = s >= 50 && s < 80; }
                else if (filterHealth === 'healthy') matchHealth = calcHealthScore(c).score >= 80;

                return matchSearch && matchPlan && matchHealth;
            })
            .sort((a, b) => {
                let r = 0;
                if (sortBy === 'name') r = a.name.localeCompare(b.name);
                else if (sortBy === 'stores') r = (a.storeCount || 0) - (b.storeCount || 0);
                else if (sortBy === 'plan') r = (a.plan || '').localeCompare(b.plan || '');
                else if (sortBy === 'health') r = calcHealthScore(a).score - calcHealthScore(b).score;
                else if (sortBy === 'activity') {
                    const da = getLastActivityDate(a) || '1970-01-01';
                    const db = getLastActivityDate(b) || '1970-01-01';
                    r = new Date(da).getTime() - new Date(db).getTime();
                }
                return sortAsc ? r : -r;
            });
    }, [companies, search, filterPlan, filterHealth, sortBy, sortAsc]);

    const toggleSort = useCallback((col: typeof sortBy) => {
        if (sortBy === col) setSortAsc(v => !v);
        else { setSortBy(col); setSortAsc(true); }
    }, [sortBy]);

    // ── 다중 선택 ───────────────────────────────────────
    const allSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));
    const someSelected = selectedIds.size > 0;

    const toggleSelectAll = useCallback(() => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(c => c.id)));
        }
    }, [allSelected, filtered]);

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // ── 토스트 ──────────────────────────────────────────
    React.useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(''), 2500);
        return () => clearTimeout(t);
    }, [toast]);

    // ── 일괄 작업 ───────────────────────────────────────
    const handleBulkDelete = useCallback(() => {
        if (!confirm(`선택된 ${selectedIds.size}개 기업을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
        selectedIds.forEach(id => deleteCompany(id));
        setSelectedIds(new Set());
        setToast(`${selectedIds.size}개 기업이 삭제되었습니다.`);
    }, [selectedIds, deleteCompany]);

    const handleBulkExport = useCallback(() => {
        const rows = filtered.filter(c => selectedIds.has(c.id));
        const headers = ['기업명', '사업자번호', '이메일', '전화번호', '플랜', '매장수', '담당변호사', '상태', '헬스스코어'];
        const csv = [
            headers.join(','),
            ...rows.map(c => [
                c.name, c.biz, c.email, c.phone, c.plan || 'none',
                c.storeCount || 0, c.assignedLawyer || '미배정',
                (STATUS_META[c.status]?.label || c.status), calcHealthScore(c).score,
            ].join(','))
        ].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `고객목록_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setToast('CSV 파일이 다운로드되었습니다.');
    }, [filtered, selectedIds]);

    /* ── Sortable column header ──────────────────────── */
    const SortHeader = ({ col, label, className = '' }: { col: typeof sortBy; label: string; className?: string }) => (
        <button onClick={() => toggleSort(col)}
            className={`flex items-center gap-0.5 text-left hover:text-slate-800 transition-colors ${className}`}>
            {label}
            {sortBy === col ? (sortAsc
                ? <ChevronUp className="w-3 h-3" />
                : <ChevronDown className="w-3 h-3" />
            ) : <span className="w-3 h-3" />}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
            {/* ── 토스트 ───────────────────────────────── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-xl">
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══ KPI 대시보드 카드 ════════════════════════ */}
            <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="font-black text-xl text-slate-800 flex items-center gap-2.5">
                            <Building2 className="w-6 h-6 text-amber-600" />
                            구독 고객 관리
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">총 {kpi.total}개 기업 · 구독 {kpi.subscribers}개사 · 전체 매장 {kpi.totalStores.toLocaleString()}개</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* 전체 고객 */}
                    <button onClick={() => { setFilterPlan('all_users'); setFilterHealth('all'); }}
                        className={`relative p-4 rounded-2xl border transition-all text-left group hover:shadow-md ${filterPlan === 'all_users' ? 'border-slate-400 bg-white ring-2 ring-slate-200' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-slate-100"><Users className="w-4 h-4 text-slate-600" /></div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">전체</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800">{kpi.total}</div>
                    </button>

                    {/* Premium */}
                    <button onClick={() => { setFilterPlan('premium'); setFilterHealth('all'); }}
                        className={`relative p-4 rounded-2xl border transition-all text-left group hover:shadow-md ${filterPlan === 'premium' ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-amber-100"><Crown className="w-4 h-4 text-amber-700" /></div>
                            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Premium</span>
                        </div>
                        <div className="text-2xl font-black text-amber-800">{kpi.premium}</div>
                    </button>

                    {/* Standard */}
                    <button onClick={() => { setFilterPlan('standard'); setFilterHealth('all'); }}
                        className={`relative p-4 rounded-2xl border transition-all text-left group hover:shadow-md ${filterPlan === 'standard' ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-200' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-indigo-100"><Shield className="w-4 h-4 text-indigo-700" /></div>
                            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Standard</span>
                        </div>
                        <div className="text-2xl font-black text-indigo-800">{kpi.standard}</div>
                    </button>

                    {/* Starter */}
                    <button onClick={() => { setFilterPlan('starter'); setFilterHealth('all'); }}
                        className={`relative p-4 rounded-2xl border transition-all text-left group hover:shadow-md ${filterPlan === 'starter' ? 'border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-200' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-emerald-100"><Sparkles className="w-4 h-4 text-emerald-700" /></div>
                            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Starter</span>
                        </div>
                        <div className="text-2xl font-black text-emerald-800">{kpi.starter}</div>
                    </button>

                    {/* 이탈 위험 */}
                    <button onClick={() => { setFilterPlan('all_users'); setFilterHealth('danger'); }}
                        className={`relative p-4 rounded-2xl border transition-all text-left group hover:shadow-md ${filterHealth === 'danger' ? 'border-red-400 bg-red-50/50 ring-2 ring-red-200' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-red-100"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
                            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">이탈 위험</span>
                        </div>
                        <div className="text-2xl font-black text-red-700">{kpi.atRisk}</div>
                    </button>
                </div>
            </div>

            {/* ══ 검색 + 필터 바 ══════════════════════════ */}
            <div className="sticky top-[52px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex gap-3 items-center flex-wrap">
                        {/* 검색 */}
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="기업명, 사업자번호, 이메일, 전화번호..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm bg-white border border-slate-200 text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-sm"
                            />
                        </div>

                        {/* 플랜 필터 */}
                        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
                            className="px-3 py-2.5 rounded-xl text-sm outline-none bg-white border border-slate-200 text-slate-700 shadow-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all">
                            <option value="all_clients">구독 고객 전체</option>
                            <option value="all_users">전체 가입자(리드 포함)</option>
                            <option value="none">단순 가입/미구독</option>
                            <option value="premium">Premium</option>
                            <option value="standard">Standard</option>
                            <option value="starter">Starter</option>
                        </select>

                        {/* 헬스 필터 */}
                        <select value={filterHealth} onChange={e => setFilterHealth(e.target.value)}
                            className="px-3 py-2.5 rounded-xl text-sm outline-none bg-white border border-slate-200 text-slate-700 shadow-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all">
                            <option value="all">헬스: 전체</option>
                            <option value="healthy">🟢 건강 (80+)</option>
                            <option value="warning">🟡 주의 (50-79)</option>
                            <option value="danger">🔴 위험 (50 미만)</option>
                        </select>

                        <span className="text-xs font-bold text-slate-400">{filtered.length}개 결과</span>
                    </div>

                    {/* 일괄 작업 바 */}
                    <AnimatePresence>
                        {someSelected && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden">
                                <div className="flex items-center gap-3 py-2.5 mt-2 border-t border-slate-100">
                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                                        {selectedIds.size}개 선택
                                    </span>
                                    <button onClick={handleBulkExport}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all">
                                        <Download className="w-3.5 h-3.5" /> CSV 내보내기
                                    </button>
                                    <button onClick={handleBulkDelete}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                                        <Trash2 className="w-3.5 h-3.5" /> 일괄 삭제
                                    </button>
                                    <button onClick={() => setSelectedIds(new Set())}
                                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-700 transition-all">
                                        <X className="w-3.5 h-3.5" /> 해제
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ══ 테이블 ══════════════════════════════════ */}
            <div className="max-w-7xl mx-auto px-4 pt-4">
                {/* 컬럼 헤더 */}
                <div className="hidden md:grid grid-cols-[32px_1fr_100px_80px_100px_90px_90px_80px_90px] gap-2 px-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <div className="flex items-center">
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                            className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer" />
                    </div>
                    <SortHeader col="name" label="기업명" />
                    <SortHeader col="plan" label="플랜" />
                    <SortHeader col="stores" label="매장수" />
                    <div>담당 변호사</div>
                    <div>상태</div>
                    <SortHeader col="activity" label="최근 활동" />
                    <SortHeader col="health" label="헬스" />
                    <div className="text-center">액션</div>
                </div>

                {/* 리스트 */}
                <div className="space-y-2">
                    <AnimatePresence>
                        {filtered.map((c, i) => {
                            const pm = PLAN_META[c.plan || 'none'] || PLAN_META.none;
                            const sm = STATUS_META[c.status as string] || { label: c.status || '—', dot: 'bg-slate-400' };
                            const health = calcHealthScore(c);
                            const isExpanded = expandId === c.id;
                            const isSelected = selectedIds.has(c.id);
                            const lastAct = getLastActivityDate(c);
                            const PlanIcon = pm.icon;

                            return (
                                <motion.div key={c.id}
                                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className={`rounded-2xl overflow-hidden bg-white border transition-all ${isSelected ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-300'} ${isExpanded ? 'shadow-lg' : 'shadow-sm'}`}>

                                    {/* ── 메인 행 ──────────────── */}
                                    <div className="px-5 py-3.5">
                                        {/* PC */}
                                        <div className="hidden md:grid grid-cols-[32px_1fr_100px_80px_100px_90px_90px_80px_90px] gap-2 items-center">
                                            {/* 체크박스 */}
                                            <div>
                                                <input type="checkbox" checked={isSelected}
                                                    onChange={() => toggleSelect(c.id)}
                                                    className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer" />
                                            </div>

                                            {/* 기업명 */}
                                            <button className="flex items-center gap-3 min-w-0 text-left"
                                                onClick={() => { setExpandId(isExpanded ? null : c.id); setDetailTab('info'); }}>
                                                <div className={`p-2 rounded-xl flex-shrink-0 ${pm.bg}`}>
                                                    <PlanIcon className="w-4 h-4" style={{ color: pm.color }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-[14px] text-slate-800 truncate">{c.name}</div>
                                                    <div className="text-[11px] text-slate-400 truncate">{c.biz || c.email}</div>
                                                </div>
                                                {isExpanded
                                                    ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                    : <ChevronDown className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                                            </button>

                                            {/* 플랜 */}
                                            <div>
                                                <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border ${pm.bg} ${pm.border}`}
                                                    style={{ color: pm.color }}>
                                                    {pm.label}
                                                </span>
                                            </div>

                                            {/* 매장수 */}
                                            <div className="text-[14px] font-bold text-slate-700">
                                                {(c.storeCount || 0).toLocaleString()}
                                                <span className="text-[10px] text-slate-400 font-normal ml-0.5">개</span>
                                            </div>

                                            {/* 담당 변호사 */}
                                            <div className="text-xs text-slate-600 truncate">
                                                <span className="flex items-center gap-1.5">
                                                    <Gavel className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                    {c.assignedLawyer || <span className="text-slate-300">미배정</span>}
                                                </span>
                                            </div>

                                            {/* 상태 */}
                                            <div>
                                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sm.dot}`} />
                                                    {sm.label}
                                                </span>
                                            </div>

                                            {/* 최근 활동 */}
                                            <div className="text-[11px] text-slate-500 font-medium">{formatRelativeDate(lastAct)}</div>

                                            {/* 헬스 스코어 */}
                                            <div>
                                                <span className={`text-[11px] px-2 py-0.5 rounded-md font-black ${health.bg} ${health.color}`}>
                                                    {health.score}
                                                </span>
                                            </div>

                                            {/* 빠른 액션 */}
                                            <div className="flex items-center justify-center gap-1">
                                                {c.email && (
                                                    <Link href={`/admin/email-preview?company=${encodeURIComponent(c.name)}`}>
                                                        <button title="이메일" className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                                            <Mail className="w-3.5 h-3.5" />
                                                        </button>
                                                    </Link>
                                                )}
                                                <button title="편집" onClick={() => setEditingCompany(c)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all">
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* 모바일 */}
                                        <div className="md:hidden">
                                            <div className="flex items-center gap-3 mb-3">
                                                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(c.id)}
                                                    className="w-4 h-4 rounded accent-amber-500" />
                                                <div className={`p-2 rounded-xl ${pm.bg}`}>
                                                    <PlanIcon className="w-4 h-4" style={{ color: pm.color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm text-slate-800 truncate">{c.name}</div>
                                                    <div className="text-[11px] text-slate-400">{c.email}</div>
                                                </div>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${pm.bg} ${pm.border}`}
                                                    style={{ color: pm.color }}>{pm.label}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3 px-1">
                                                <span>{(c.storeCount || 0).toLocaleString()}개 매장</span>
                                                <span>•</span>
                                                <span className={`font-bold ${health.color}`}>헬스 {health.score}</span>
                                                <span>•</span>
                                                <span>{formatRelativeDate(lastAct)}</span>
                                            </div>
                                            <button onClick={() => { setExpandId(isExpanded ? null : c.id); setDetailTab('info'); }}
                                                className="w-full text-xs font-bold py-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-100">
                                                {isExpanded ? '접기' : '상세 보기'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── 확장 상세 패널 (탭 방식) ── */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden border-t border-slate-100">

                                                {/* 탭 바 */}
                                                <div className="flex gap-0 bg-slate-50 border-b border-slate-100">
                                                    {DETAIL_TABS.map(({ key, label, icon: Icon }) => (
                                                        <button key={key} onClick={() => setDetailTab(key)}
                                                            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold transition-all relative
                                                                ${detailTab === key ? 'text-amber-700 bg-white' : 'text-slate-400 hover:text-slate-700'}`}>
                                                            <Icon className="w-3.5 h-3.5" />
                                                            {label}
                                                            {detailTab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t" />}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="p-5 md:p-6 bg-white">
                                                    {/* 기본 정보 탭 */}
                                                    {detailTab === 'info' && (
                                                        <div className="grid md:grid-cols-3 gap-6 text-sm">
                                                            {/* 연락처 */}
                                                            <div>
                                                                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> 연락처 및 방침</p>
                                                                <div className="space-y-3">
                                                                    {c.phone && (
                                                                        <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-emerald-600 transition-colors">
                                                                            <div className="p-1.5 rounded-md bg-white border border-slate-200"><Phone className="w-3.5 h-3.5 text-emerald-600" /></div>
                                                                            {c.phone}
                                                                        </a>
                                                                    )}
                                                                    <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-blue-600 transition-colors">
                                                                        <div className="p-1.5 rounded-md bg-white border border-slate-200"><Mail className="w-3.5 h-3.5 text-blue-600" /></div>
                                                                        {c.email}
                                                                    </a>
                                                                    {c.url && (
                                                                        <a href={c.url.startsWith('http') ? c.url : `https://${c.url}`} target="_blank" rel="noreferrer"
                                                                            className="flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-indigo-600 transition-colors truncate">
                                                                            <div className="p-1.5 rounded-md bg-white border border-slate-200"><TrendingUp className="w-3.5 h-3.5 text-indigo-600" /></div>
                                                                            {c.url}
                                                                        </a>
                                                                    )}
                                                                    <div className="pt-3 border-t border-slate-100">
                                                                        <p className="text-[11px] font-bold text-slate-500 mb-1.5">개인정보처리방침 URL</p>
                                                                        <input type="text" defaultValue={c.privacyUrl || ''}
                                                                            placeholder="https://example.com/privacy"
                                                                            onBlur={(e) => { if (e.target.value !== (c.privacyUrl || '')) updateCompany(c.id, { privacyUrl: e.target.value }); }}
                                                                            className="w-full px-3 py-2 rounded-xl text-[13px] outline-none bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* 분석 정보 */}
                                                            <div>
                                                                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-slate-400 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> 분석 정보</p>
                                                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                                        <span className="text-[13px] font-medium text-slate-500">현재 플랜</span>
                                                                        <span className="text-[13px] font-bold" style={{ color: pm.color }}>{pm.label}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                                        <span className="text-[13px] font-medium text-slate-500">AI 리스크</span>
                                                                        <span className={`text-[13px] font-bold px-2 py-0.5 rounded-md ${c.riskLevel === 'HIGH' ? 'bg-red-50 text-red-600' : c.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                            {c.riskLevel || '분석 필요'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                                        <span className="text-[13px] font-medium text-slate-500">헬스 스코어</span>
                                                                        <span className={`text-[13px] font-black px-2 py-0.5 rounded-md ${health.bg} ${health.color}`}>{health.score} {health.label}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                                        <span className="text-[13px] font-medium text-slate-500">이슈 건수</span>
                                                                        <span className="text-[13px] font-bold text-slate-700">{c.issues?.length || 0}건</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[13px] font-medium text-slate-500">등록일</span>
                                                                        <span className="text-[13px] text-slate-600">{formatDate(c.createdAt)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* 빠른 실행 */}
                                                            <div>
                                                                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-slate-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> 빠른 실행</p>
                                                                <div className="space-y-2">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <button onClick={() => setEditingCompany(c)}
                                                                            className="px-3 py-2.5 rounded-xl text-[12px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 shadow-sm transition-all flex items-center gap-1.5 justify-center">
                                                                            <Edit3 className="w-3.5 h-3.5" /> 마스터 정보 수정
                                                                        </button>
                                                                        <button onClick={() => { alert('임시 비밀번호 발송 스케줄링됨'); }}
                                                                            className="px-3 py-2.5 rounded-xl text-[12px] font-bold bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center gap-1.5 justify-center">
                                                                            <Shield className="w-3.5 h-3.5" /> PW 초기화
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <Link href={`/admin/email-preview?company=${encodeURIComponent(c.name)}`}>
                                                                            <button className="w-full px-3 py-2.5 rounded-xl text-[12px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100 shadow-sm transition-all flex items-center gap-1.5 justify-center">
                                                                                <Send className="w-3.5 h-3.5" /> 이메일 발송
                                                                            </button>
                                                                        </Link>
                                                                        <Link href="/contracts">
                                                                            <button className="w-full px-3 py-2.5 rounded-xl text-[12px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 shadow-sm transition-all flex items-center gap-1.5 justify-center">
                                                                                <FileText className="w-3.5 h-3.5" /> 계약서 보관함
                                                                            </button>
                                                                        </Link>
                                                                    </div>
                                                                    <div className="h-px bg-slate-100 my-1" />
                                                                    <button onClick={() => {
                                                                        if (confirm(`정말 '${c.name}' 계정을 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                                                                            deleteCompany(c.id);
                                                                        }
                                                                    }}
                                                                        className="w-full px-3 py-2 rounded-xl text-[12px] font-bold bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 shadow-sm transition-all flex items-center gap-1.5 justify-center">
                                                                        <Trash2 className="w-3.5 h-3.5" /> 계정 영구 삭제
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 활동 이력 탭 */}
                                                    {detailTab === 'activity' && (
                                                        <div className="space-y-4">
                                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> 최근 활동 타임라인</p>

                                                            {/* 메모 이력 */}
                                                            {(c.memos && c.memos.length > 0) && (
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> 메모 ({c.memos.length}건)</p>
                                                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                                                        {[...c.memos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(m => (
                                                                            <div key={m.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                                                                                </div>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                        <span className="text-[11px] font-bold text-slate-700">{m.author}</span>
                                                                                        <span className="text-[10px] text-slate-400">{formatDate(m.createdAt)}</span>
                                                                                    </div>
                                                                                    <p className="text-[13px] text-slate-600 line-clamp-2">{m.content}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* 타임라인 이력 */}
                                                            {(c.timeline && c.timeline.length > 0) && (
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500" /> 타임라인 ({c.timeline.length}건)</p>
                                                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                                                        {c.timeline.slice(0, 5).map(t => (
                                                                            <div key={t.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                                                    <Clock className="w-3.5 h-3.5 text-blue-700" />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                        <span className="text-[11px] font-bold text-slate-700">{t.author}</span>
                                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold">{t.type}</span>
                                                                                        <span className="text-[10px] text-slate-400">{formatDate(t.createdAt)}</span>
                                                                                    </div>
                                                                                    <p className="text-[13px] text-slate-600">{t.content}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* 주요 일자 요약 */}
                                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                                <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-500" /> 주요 일자</p>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                                    <div><span className="text-slate-400">최근 통화</span><div className="font-bold text-slate-700 mt-0.5">{formatDate(c.lastCallAt)}</div></div>
                                                                    <div><span className="text-slate-400">이메일 발송</span><div className="font-bold text-slate-700 mt-0.5">{formatDate(c.emailSentAt)}</div></div>
                                                                    <div><span className="text-slate-400">영업 컨펌</span><div className="font-bold text-slate-700 mt-0.5">{formatDate(c.salesConfirmedAt)}</div></div>
                                                                    <div><span className="text-slate-400">계약 서명</span><div className="font-bold text-slate-700 mt-0.5">{formatDate(c.contractSignedAt)}</div></div>
                                                                </div>
                                                            </div>

                                                            {(!c.memos || c.memos.length === 0) && (!c.timeline || c.timeline.length === 0) && (
                                                                <div className="py-10 text-center">
                                                                    <Activity className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                                                                    <p className="text-sm font-bold text-slate-400">기록된 활동이 없습니다</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* 문서함 탭 */}
                                                    {detailTab === 'docs' && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                                                                <h3 className="text-sm font-bold text-slate-800">해당 기업 문서함 (관리자 뷰)</h3>
                                                            </div>
                                                            <div className="h-[400px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                                                <DocumentWidget companyId={c.id} currentUserRole="admin" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {filtered.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
                        <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                        <p className="font-bold text-slate-400 text-sm">
                            {search ? '검색 결과가 없습니다' : '고객 데이터가 없습니다'}
                        </p>
                        <p className="text-xs text-slate-300 mt-1">필터 조건을 변경해보세요</p>
                    </div>
                )}
            </div>

            {/* ── 편집 모달 ─────────────────────────────── */}
            <AdminCompanyEditModal
                isOpen={!!editingCompany}
                company={editingCompany}
                onClose={() => setEditingCompany(null)}
                onSave={updateCompany}
            />
        </div>
    );
}
