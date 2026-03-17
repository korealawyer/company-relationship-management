'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, Users, Mail, CreditCard, BarChart3,
    Building2, Clock
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

const KPI_CARDS = [
    { label: '총 분석 건수', value: '1,240', delta: '+18% 이번달', color: '#b8960a', icon: BarChart3 },
    { label: '총 로그인 수', value: '387', delta: '+23% 이번달', color: '#2563eb', icon: Users },
    { label: '2차 전환율', value: '31.2%', delta: '+4.1%p 이번달', color: '#16a34a', icon: TrendingUp },
    { label: '월 구독 MRR', value: '₩28.4M', delta: '+₩3.2M 이번달', color: '#7c3aed', icon: CreditCard },
];

const FUNNEL = [
    { label: '이메일 발송', value: 1240, pct: 100 },
    { label: '이메일 클릭', value: 620, pct: 50 },
    { label: '랜딩 조회', value: 450, pct: 36.3 },
    { label: '로그인', value: 387, pct: 31.2 },
    { label: '상담 신청', value: 142, pct: 11.5 },
    { label: '결제 완료', value: 48, pct: 3.9 },
];

const MONTHLY = [
    { month: '9월', reports: 62, logins: 18, contracts: 2 },
    { month: '10월', reports: 98, logins: 31, contracts: 5 },
    { month: '11월', reports: 145, logins: 52, contracts: 9 },
    { month: '12월', reports: 189, logins: 78, contracts: 14 },
    { month: '1월', reports: 241, logins: 98, contracts: 19 },
    { month: '2월', reports: 505, logins: 110, contracts: 48 },
];

const CUSTOMERS = [
    { name: '(주)놀부NBG', status: '로그인', plan: 'FREE', stage: '1차', lawyer: '김수현', lastSeen: '2시간 전' },
    { name: '(주)교촌에프앤비', status: '구독 중', plan: 'STANDARD', stage: '2차', lawyer: '이민지', lastSeen: '1일 전' },
    { name: '맥도날드코리아', status: '구독 중', plan: 'PREMIUM', stage: '3차', lawyer: '박준호', lastSeen: '3시간 전' },
    { name: '㈜롯데리아', status: '로그인', plan: 'FREE', stage: '1차', lawyer: '김수현', lastSeen: '3일 전' },
    { name: '㈜공차코리아', status: '이메일 발송', plan: 'FREE', stage: '—', lawyer: '대기', lastSeen: '—' },
    { name: '㈜봉구스밥버거', status: '로그인', plan: 'FREE', stage: '1차', lawyer: '이민지', lastSeen: '5일 전' },
];

function FunnelBar({ item, maxVal }: { item: typeof FUNNEL[number]; maxVal: number }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-24 text-right text-xs font-semibold" style={{ color: '#64748b' }}>{item.label}</div>
            <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 h-8 rounded-lg overflow-hidden relative" style={{ background: '#f1f5f9' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(item.value / maxVal) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="h-full rounded-lg flex items-center px-3"
                        style={{ background: 'linear-gradient(90deg, #c9a84c, #e8c87a)' }}
                    >
                        <span className="text-xs font-bold" style={{ color: '#78350f' }}>{item.value.toLocaleString()}</span>
                    </motion.div>
                </div>
                <div className="w-14 text-right text-xs font-bold" style={{ color: '#b8960a' }}>{item.pct}%</div>
            </div>
        </div>
    );
}

function MonthlyBarChart() {
    const maxVal = Math.max(...MONTHLY.map(m => m.reports));
    return (
        <div className="space-y-4">
            {MONTHLY.map((m, i) => (
                <div key={m.month} className="flex items-center gap-3">
                    <div className="w-8 text-right text-xs font-semibold" style={{ color: '#475569' }}>{m.month}</div>
                    <div className="flex-1 space-y-1">
                        <div className="flex gap-1 items-center">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${(m.reports / maxVal) * 100}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: i * 0.05 }}
                                className="h-3 rounded-sm"
                                style={{ background: '#c9a84c' }}
                            />
                            <span className="text-xs font-semibold" style={{ color: '#475569' }}>{m.reports}</span>
                        </div>
                        <div className="flex gap-1 items-center">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${(m.logins / maxVal) * 100}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: i * 0.05 + 0.05 }}
                                className="h-3 rounded-sm"
                                style={{ background: '#60a5fa' }}
                            />
                            <span className="text-xs font-semibold" style={{ color: '#475569' }}>{m.logins}</span>
                        </div>
                        <div className="flex gap-1 items-center">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${(m.contracts / maxVal) * 100}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: i * 0.05 + 0.1 }}
                                className="h-3 rounded-sm"
                                style={{ background: '#4ade80' }}
                            />
                            <span className="text-xs font-semibold" style={{ color: '#475569' }}>{m.contracts}</span>
                        </div>
                    </div>
                </div>
            ))}
            <div className="flex gap-4 pt-2">
                {[{ color: '#c9a84c', label: '분석 건수' }, { color: '#60a5fa', label: '로그인' }, { color: '#4ade80', label: '계약' }].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                        <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                        {l.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AdminPage() {
    const [filter, setFilter] = useState('all');

    const planColor: Record<string, string> = {
        FREE: '#94a3b8', STANDARD: '#b8960a', PREMIUM: '#7c3aed',
    };

    return (
        <div className="min-h-screen px-4 py-8" style={{ background: '#f8f9fc' }}>
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: '#1e293b' }}>
                        관리자 <span style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>KPI 대시보드</span>
                    </h1>
                    <p className="text-sm font-medium" style={{ color: '#475569' }}>영업 퍼널 · 수익 지표 · 고객 현황 — 실시간</p>
                </motion.div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {KPI_CARDS.map((kpi, i) => (
                        <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card light padding="md">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                                        <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                        {kpi.delta}
                                    </span>
                                </div>
                                <div className="text-2xl font-black" style={{ color: '#1e293b' }}>{kpi.value}</div>
                                <div className="text-xs mt-1" style={{ color: '#64748b' }}>{kpi.label}</div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* Funnel Chart */}
                    <Card light padding="lg">
                        <h2 className="font-black text-base mb-6" style={{ color: '#1e293b' }}>
                            영업 퍼널 전환율
                        </h2>
                        <div className="space-y-3">
                            {FUNNEL.map((item) => (
                                <FunnelBar key={item.label} item={item} maxVal={FUNNEL[0].value} />
                            ))}
                        </div>
                        <div className="mt-4 pt-4 text-xs" style={{ borderTop: '1px solid #e5e7eb', color: '#94a3b8' }}>
                            * 이메일 클릭 → 로그인 전환율: <span style={{ color: '#b8960a', fontWeight: 700 }}>31.2%</span> (업계 평균 8.3% 대비 3.8x)
                        </div>
                    </Card>

                    {/* Monthly Bar Chart */}
                    <Card light padding="lg">
                        <h2 className="font-black text-base mb-6" style={{ color: '#1e293b' }}>
                            월간 성장 추이
                        </h2>
                        <MonthlyBarChart />
                    </Card>
                </div>

                {/* Customer Table */}
                <Card light padding="sm">
                    <div className="px-4 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <h2 className="font-black text-base" style={{ color: '#1e293b' }}>고객 현황</h2>
                        <div className="flex gap-2">
                            {['all', 'FREE', 'STANDARD', 'PREMIUM'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className="text-xs px-3 py-1.5 rounded-lg transition-all font-semibold"
                                    style={filter === f ? {
                                        background: 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                        color: '#78350f',
                                        fontWeight: 700,
                                    } : {
                                        background: '#f1f5f9',
                                        color: '#64748b',
                                    }}
                                >
                                    {f === 'all' ? '전체' : f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ background: '#f8f9fc', borderBottom: '2px solid #d1d5db' }}>
                                    {['회사명', '상태', '플랜', '피드백', '담당 변호사', '마지막 활동'].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-black tracking-wide" style={{ color: '#b8960a' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {CUSTOMERS.filter(c => filter === 'all' || c.plan === filter).map((c, i) => (
                                    <tr key={i} className="transition-colors hover:bg-amber-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                                <span className="font-semibold" style={{ color: '#1e293b' }}>{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{
                                                background: c.status === '구독 중' ? '#dcfce7' : '#eff6ff',
                                                color: c.status === '구독 중' ? '#16a34a' : '#2563eb',
                                            }}>{c.status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-bold" style={{ color: planColor[c.plan] }}>{c.plan}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs" style={{ color: c.stage !== '—' ? '#1e293b' : '#94a3b8' }}>
                                            {c.stage !== '—' ? `${c.stage} 완료` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>{c.lawyer}</td>
                                        <td className="px-4 py-3 text-xs font-medium" style={{ color: '#64748b' }}>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {c.lastSeen}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
