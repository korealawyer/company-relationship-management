'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, Users, Phone, Mail,
    FileText, Calendar, DollarSign, Target,
    ArrowUp, ArrowDown, Download, Filter,
    CheckCircle2, Clock, AlertTriangle, Star,
} from 'lucide-react';

/* ── 색상 시스템 (CRM과 동일) ────────────────────────────── */
const T = {
    heading: '#0f172a',
    body: '#1e293b',
    sub: '#475569',
    muted: '#64748b',
    faint: '#94a3b8',
    border: '#d1d5db',
    borderSub: '#e5e7eb',
    bg: '#f8f9fc',
    card: '#ffffff',
};

/* ── 기간 탭 ─────────────────────────────────────────────── */
type Period = 'week' | 'month' | 'quarter';

/* ── 담당자별 성과 데이터 ─────────────────────────────────── */
const REP_PERFORMANCE = [
    { name: '김영업', leads: 45, calls: 128, emails: 67, contracts: 12, revenue: 29_880_000, rate: 26.7 },
    { name: '이세일', leads: 38, calls: 95, emails: 52, contracts: 9, revenue: 22_410_000, rate: 23.7 },
    { name: '박매니', leads: 32, calls: 87, emails: 41, contracts: 8, revenue: 19_920_000, rate: 25.0 },
    { name: '최마케', leads: 28, calls: 74, emails: 35, contracts: 6, revenue: 14_940_000, rate: 21.4 },
];

/* ── 파이프라인 퍼널 데이터 ────────────────────────────────── */
const FUNNEL_DATA = [
    { stage: '리드 수집', count: 143, color: '#94a3b8', width: 100 },
    { stage: 'AI 분석 완료', count: 128, color: '#60a5fa', width: 89 },
    { stage: '영업 컨펌', count: 98, color: '#818cf8', width: 69 },
    { stage: '변호사 배정', count: 76, color: '#c084fc', width: 53 },
    { stage: '이메일 발송', count: 62, color: '#f472b6', width: 43 },
    { stage: '고객 답장', count: 41, color: '#fb923c', width: 29 },
    { stage: '계약 체결', count: 35, color: '#4ade80', width: 24 },
    { stage: '구독 활성', count: 35, color: '#22c55e', width: 24 },
];

/* ── 월별 트렌드 ─────────────────────────────────────────── */
const MONTHLY_TRENDS = [
    { month: '10월', leads: 68, contracts: 15, revenue: 37_350_000 },
    { month: '11월', leads: 82, contracts: 19, revenue: 47_310_000 },
    { month: '12월', leads: 95, contracts: 22, revenue: 54_780_000 },
    { month: '1월', leads: 110, contracts: 28, revenue: 69_720_000 },
    { month: '2월', leads: 125, contracts: 31, revenue: 77_190_000 },
    { month: '3월', leads: 143, contracts: 35, revenue: 87_150_000 },
];

/* ── 메인 페이지 ─────────────────────────────────────────── */
export default function ReportsPage() {
    const [period, setPeriod] = useState<Period>('month');
    const [downloading, setDownloading] = useState(false);

    const kpiCards = [
        { icon: Users, label: '신규 리드', value: '143', change: '+18.3%', up: true, color: '#2563eb', sub: '전월 대비' },
        { icon: Target, label: '계약 전환율', value: '24.5%', change: '+2.1%p', up: true, color: '#22c55e', sub: '목표 20%' },
        { icon: DollarSign, label: '월 매출', value: '87,150,000원', change: '+12.9%', up: true, color: '#c9a84c', sub: '전월 대비' },
        { icon: Phone, label: '전화 완료', value: '384건', change: '+24건', up: true, color: '#7c3aed', sub: '이번 달' },
    ];

    const handleDownload = async () => {
        setDownloading(true);
        await new Promise(r => setTimeout(r, 1500));
        setDownloading(false);
        alert('📥 리포트가 다운로드되었습니다. (Mock)');
    };

    return (
        <div className="min-h-screen px-4 py-8 max-w-[1400px] mx-auto" style={{ background: T.bg }}>

            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: T.heading }}>
                        <BarChart3 className="w-6 h-6" style={{ color: '#c9a84c' }} />
                        영업 성과 리포트
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: T.muted }}>2026년 3월 기준 · 실시간 업데이트</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* 기간 필터 */}
                    {(['week', 'month', 'quarter'] as Period[]).map(p => {
                        const labels: Record<Period, string> = { week: '주간', month: '월간', quarter: '분기' };
                        return (
                            <button key={p} onClick={() => setPeriod(p)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={{
                                    background: period === p ? '#eff6ff' : T.card,
                                    color: period === p ? '#2563eb' : T.sub,
                                    border: `1px solid ${period === p ? '#93c5fd' : T.border}`,
                                }}>
                                {labels[p]}
                            </button>
                        );
                    })}
                    <button onClick={handleDownload} disabled={downloading}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{ background: '#111827', color: '#fff' }}>
                        <Download className="w-3.5 h-3.5" />
                        {downloading ? '다운로드 중...' : 'PDF 다운로드'}
                    </button>
                </div>
            </div>

            {/* KPI 카드 */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {kpiCards.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i }}
                            className="rounded-2xl p-5"
                            style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: `${kpi.color}10` }}>
                                    <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                                </div>
                                <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full`}
                                    style={{
                                        background: kpi.up ? '#dcfce7' : '#fef2f2',
                                        color: kpi.up ? '#16a34a' : '#dc2626',
                                    }}>
                                    {kpi.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                    {kpi.change}
                                </span>
                            </div>
                            <p className="text-xs font-bold mb-0.5" style={{ color: T.muted }}>{kpi.label}</p>
                            <p className="text-xl font-black" style={{ color: T.heading }}>{kpi.value}</p>
                            <p className="text-[10px] mt-1" style={{ color: T.faint }}>{kpi.sub}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* 파이프라인 퍼널 */}
                <div className="rounded-2xl p-5"
                    style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h2 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: T.heading }}>
                        <Target className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        파이프라인 퍼널
                    </h2>
                    <div className="space-y-2.5">
                        {FUNNEL_DATA.map((f, i) => (
                            <div key={f.stage} className="flex items-center gap-3">
                                <span className="text-[11px] font-bold w-20 text-right flex-shrink-0" style={{ color: T.sub }}>
                                    {f.stage}
                                </span>
                                <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: '#f1f5f9' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${f.width}%` }}
                                        transition={{ delay: 0.1 * i, duration: 0.5 }}
                                        className="h-full rounded-lg flex items-center justify-end px-2"
                                        style={{ background: f.color }}
                                    >
                                        <span className="text-[10px] font-black text-white">{f.count}</span>
                                    </motion.div>
                                </div>
                                <span className="text-[10px] font-bold w-10 text-right" style={{ color: T.faint }}>
                                    {f.width}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 월별 트렌드 (바 차트 CSS) */}
                <div className="rounded-2xl p-5"
                    style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h2 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: T.heading }}>
                        <TrendingUp className="w-4 h-4" style={{ color: '#2563eb' }} />
                        월별 성장 트렌드
                    </h2>
                    <div className="flex items-end gap-3 h-44">
                        {MONTHLY_TRENDS.map((m, i) => {
                            const maxRevenue = Math.max(...MONTHLY_TRENDS.map(t => t.revenue));
                            const height = (m.revenue / maxRevenue) * 100;
                            return (
                                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[9px] font-bold" style={{ color: '#c9a84c' }}>
                                        {(m.revenue / 1_000_000).toFixed(0)}M
                                    </span>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ delay: 0.1 * i, duration: 0.5 }}
                                        className="w-full rounded-t-lg"
                                        style={{
                                            background: `linear-gradient(to top, #2563eb, #60a5fa)`,
                                            minHeight: 8,
                                        }}
                                    />
                                    <span className="text-[10px] font-bold" style={{ color: T.muted }}>{m.month}</span>
                                    <span className="text-[9px]" style={{ color: T.faint }}>{m.contracts}건</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-3 pt-3"
                        style={{ borderTop: `1px solid ${T.borderSub}` }}>
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: T.muted }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: '#2563eb' }} /> 매출
                        </span>
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: T.muted }}>
                            <span className="text-[9px] font-bold" style={{ color: '#c9a84c' }}>N</span> 계약 건수
                        </span>
                    </div>
                </div>
            </div>

            {/* 담당자별 성과 테이블 */}
            <div className="rounded-2xl overflow-hidden"
                style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-5 py-4 flex items-center justify-between"
                    style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                    <h2 className="text-sm font-black flex items-center gap-2" style={{ color: T.heading }}>
                        <Users className="w-4 h-4" style={{ color: '#7c3aed' }} />
                        영업 담당자별 성과
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{ background: '#f1f5f9', color: T.muted }}>
                        이번 달 기준
                    </span>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ background: '#f8f9fc' }}>
                            {['순위', '담당자', '리드', '전화', '이메일', '계약 체결', '매출', '전환율'].map(h => (
                                <th key={h} className="py-3 px-4 text-left text-xs font-black whitespace-nowrap"
                                    style={{ color: '#c9a84c' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {REP_PERFORMANCE.map((rep, i) => (
                            <tr key={rep.name}
                                className="transition-colors hover:bg-slate-50"
                                style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                <td className="py-3 px-4">
                                    <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-black"
                                        style={{
                                            background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : i === 2 ? '#fef2f2' : '#f8f9fc',
                                            color: i === 0 ? '#b8960a' : i === 1 ? '#64748b' : i === 2 ? '#dc2626' : T.muted,
                                        }}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                    </span>
                                </td>
                                <td className="py-3 px-4 font-bold" style={{ color: T.body }}>{rep.name}</td>
                                <td className="py-3 px-4 font-bold" style={{ color: T.body }}>{rep.leads}</td>
                                <td className="py-3 px-4" style={{ color: T.sub }}>{rep.calls}</td>
                                <td className="py-3 px-4" style={{ color: T.sub }}>{rep.emails}</td>
                                <td className="py-3 px-4">
                                    <span className="font-black" style={{ color: '#22c55e' }}>{rep.contracts}건</span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="font-black" style={{ color: '#c9a84c' }}>{rep.revenue.toLocaleString()}원</span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                                        style={{
                                            background: rep.rate >= 25 ? '#dcfce7' : '#fef3c7',
                                            color: rep.rate >= 25 ? '#16a34a' : '#b8960a',
                                        }}>
                                        {rep.rate}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="px-5 py-3" style={{ background: '#f8f9fc', borderTop: `1px solid ${T.borderSub}` }}>
                    <div className="flex items-center justify-between text-xs">
                        <span style={{ color: T.muted }}>총계</span>
                        <div className="flex gap-6">
                            <span style={{ color: T.sub }}>리드 <strong>{REP_PERFORMANCE.reduce((s, r) => s + r.leads, 0)}</strong></span>
                            <span style={{ color: T.sub }}>계약 <strong style={{ color: '#22c55e' }}>{REP_PERFORMANCE.reduce((s, r) => s + r.contracts, 0)}건</strong></span>
                            <span style={{ color: T.sub }}>매출 <strong style={{ color: '#c9a84c' }}>{REP_PERFORMANCE.reduce((s, r) => s + r.revenue, 0).toLocaleString()}원</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}