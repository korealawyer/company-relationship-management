'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, Users, DollarSign, Calendar,
    ArrowUp, ArrowDown, Target, Mail, FileText,
} from 'lucide-react';

const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

// ── Mock 리포트 데이터 ────────────────────────────────────
const MONTHLY_DATA = [
    { month: '2025-10', leads: 42, converted: 8, revenue: 7920000, emailsSent: 120, convRate: 19 },
    { month: '2025-11', leads: 55, converted: 12, revenue: 11880000, emailsSent: 156, convRate: 22 },
    { month: '2025-12', leads: 63, converted: 15, revenue: 14850000, emailsSent: 189, convRate: 24 },
    { month: '2026-01', leads: 71, converted: 18, revenue: 17820000, emailsSent: 213, convRate: 25 },
    { month: '2026-02', leads: 68, converted: 17, revenue: 16830000, emailsSent: 204, convRate: 25 },
    { month: '2026-03', leads: 34, converted: 9, revenue: 8910000, emailsSent: 96, convRate: 26 },
];

const TOP_SOURCES = [
    { name: '공정거래위원회 DB', leads: 89, pct: 38 },
    { name: '웹사이트 상담 신청', leads: 67, pct: 29 },
    { name: '추천/소개', leads: 42, pct: 18 },
    { name: '세미나/웨비나', leads: 21, pct: 9 },
    { name: '기타', leads: 14, pct: 6 },
];

const LAWYER_PERFORMANCE = [
    { name: '유정훈', reviewed: 89, confirmed: 82, avgDays: 1.2 },
    { name: '김수현', reviewed: 67, confirmed: 61, avgDays: 1.5 },
    { name: '박지은', reviewed: 45, confirmed: 40, avgDays: 1.8 },
];

type Period = 'weekly' | 'monthly' | 'quarterly';

export default function ReportsPage() {
    const [period, setPeriod] = useState<Period>('monthly');
    const latest = MONTHLY_DATA[MONTHLY_DATA.length - 1];
    const prev = MONTHLY_DATA[MONTHLY_DATA.length - 2];
    const leadDelta = prev ? Math.round(((latest.leads - prev.leads) / prev.leads) * 100) : 0;
    const revDelta = prev ? Math.round(((latest.revenue - prev.revenue) / prev.revenue) * 100) : 0;
    const maxLeads = Math.max(...MONTHLY_DATA.map(d => d.leads));

    return (
        <div className="min-h-screen py-8 px-4" style={{ background: T.bg }}>
            <div className="max-w-6xl mx-auto">

                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: T.heading }}>
                            <BarChart3 className="w-6 h-6" style={{ color: '#6366f1' }} />
                            리포트 & 분석
                        </h1>
                        <p className="text-sm mt-1" style={{ color: T.muted }}>리드 퍼널, 전환율, 매출 추이를 분석합니다</p>
                    </div>
                    <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                        {(['weekly', 'monthly', 'quarterly'] as Period[]).map(p => (
                            <button key={p} onClick={() => setPeriod(p)}
                                className="px-4 py-2 text-xs font-bold transition-all"
                                style={{
                                    background: period === p ? '#6366f1' : T.card,
                                    color: period === p ? '#fff' : T.muted,
                                }}>
                                {p === 'weekly' ? '주간' : p === 'monthly' ? '월간' : '분기'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI 요약 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { icon: Users, label: '이번 달 리드', value: latest.leads, delta: leadDelta, color: '#6366f1' },
                        { icon: Target, label: '전환율', value: `${latest.convRate}%`, delta: latest.convRate - (prev?.convRate ?? 0), color: '#10b981' },
                        { icon: DollarSign, label: '매출', value: `₩${(latest.revenue / 10000).toFixed(0)}만`, delta: revDelta, color: '#f59e0b' },
                        { icon: Mail, label: '이메일 발송', value: latest.emailsSent, delta: 0, color: '#8b5cf6' },
                    ].map(({ icon: Icon, label, value, delta, color }) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                                    <Icon className="w-4 h-4" style={{ color }} />
                                </div>
                                <span className="text-xs font-bold" style={{ color: T.muted }}>{label}</span>
                            </div>
                            <div className="text-2xl font-black" style={{ color: T.heading }}>{value}</div>
                            {delta !== 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                    {delta > 0
                                        ? <ArrowUp className="w-3 h-3" style={{ color: '#4ade80' }} />
                                        : <ArrowDown className="w-3 h-3" style={{ color: '#f87171' }} />}
                                    <span className="text-xs font-bold" style={{ color: delta > 0 ? '#4ade80' : '#f87171' }}>{Math.abs(delta)}%</span>
                                    <span className="text-xs" style={{ color: T.faint }}>전월 대비</span>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* 리드 추이 차트 (CSS) */}
                    <div className="md:col-span-2 p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                        <h2 className="font-black text-base mb-4 flex items-center gap-2" style={{ color: T.heading }}>
                            <TrendingUp className="w-4 h-4" style={{ color: '#6366f1' }} />
                            리드 & 전환 추이
                        </h2>
                        <div className="flex items-end gap-3 h-48">
                            {MONTHLY_DATA.map(d => (
                                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-bold" style={{ color: '#6366f1' }}>{d.leads}</span>
                                    <div className="w-full rounded-t-lg relative" style={{
                                        height: `${(d.leads / maxLeads) * 100}%`,
                                        background: `linear-gradient(to top, #6366f1, #818cf8)`,
                                        minHeight: 4,
                                    }}>
                                        <div className="absolute bottom-0 left-0 w-full rounded-t-lg" style={{
                                            height: `${(d.converted / d.leads) * 100}%`,
                                            background: '#4ade80',
                                            minHeight: 2,
                                        }} />
                                    </div>
                                    <span className="text-[10px]" style={{ color: T.faint }}>{d.month.split('-')[1]}월</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 mt-3 justify-center">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: '#6366f1' }} /><span className="text-xs" style={{ color: T.muted }}>리드</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: '#4ade80' }} /><span className="text-xs" style={{ color: T.muted }}>전환</span></div>
                        </div>
                    </div>

                    {/* 유입 경로 */}
                    <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                        <h3 className="font-black text-sm mb-3" style={{ color: T.heading }}>리드 유입 경로</h3>
                        {TOP_SOURCES.map(s => (
                            <div key={s.name} className="mb-3">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs font-medium" style={{ color: T.body }}>{s.name}</span>
                                    <span className="text-xs font-bold" style={{ color: '#6366f1' }}>{s.pct}%</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full" style={{ background: T.borderSub }}>
                                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: '#6366f1' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 변호사 퍼포먼스 */}
                <div className="mt-6 p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                    <h2 className="font-black text-base mb-4 flex items-center gap-2" style={{ color: T.heading }}>
                        <FileText className="w-4 h-4" style={{ color: '#f59e0b' }} />
                        변호사 실적
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: `2px solid ${T.borderSub}` }}>
                                    {['변호사', '검토 건수', '컨펌', '컨펌률', '평균 소요일'].map(h => (
                                        <th key={h} className="py-2 px-3 text-left text-xs font-bold" style={{ color: T.muted }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {LAWYER_PERFORMANCE.map(l => (
                                    <tr key={l.name} style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                        <td className="py-3 px-3 font-bold" style={{ color: T.body }}>{l.name} 변호사</td>
                                        <td className="py-3 px-3" style={{ color: T.sub }}>{l.reviewed}</td>
                                        <td className="py-3 px-3" style={{ color: T.sub }}>{l.confirmed}</td>
                                        <td className="py-3 px-3">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                                                background: '#d1fae5', color: '#065f46',
                                            }}>{Math.round((l.confirmed / l.reviewed) * 100)}%</span>
                                        </td>
                                        <td className="py-3 px-3" style={{ color: T.sub }}>{l.avgDays}일</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
