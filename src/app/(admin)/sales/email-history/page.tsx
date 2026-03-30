'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Mail, Eye, MousePointerClick, TrendingUp, Clock, ArrowLeft,
    RefreshCw, CheckCircle2, XCircle, Calendar, BarChart3, Zap
} from 'lucide-react';
import Link from 'next/link';
import { leadStore, Lead } from '@/lib/leadStore';
import { LeadScoringService } from '@/lib/leadScoring';

interface EmailRecord {
    leadId: string;
    company: string;
    contactName: string;
    contactEmail: string;
    sentAt: string;
    opens: number;
    clicks: number;
    score: number;
    status: 'sent' | 'opened' | 'clicked' | 'converted';
}

function buildRecords(leads: Lead[]): EmailRecord[] {
    return leads
        .filter(l => l.emailSentAt)
        .map(l => {
            const scoring = LeadScoringService.getScore(l.id);
            const opens = scoring?.openCount ?? 0;
            const clicks = scoring?.clickCount ?? 0;
            let status: EmailRecord['status'] = 'sent';
            if (clicks > 0) status = 'clicked';
            else if (opens > 0) status = 'opened';
            if (l.status === 'contracted') status = 'converted';
            return {
                leadId: l.id,
                company: l.companyName,
                contactName: l.contactName,
                contactEmail: l.contactEmail,
                sentAt: l.emailSentAt!,
                opens,
                clicks,
                score: scoring?.score ?? 0,
                status,
            };
        })
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

const STATUS_BADGE: Record<EmailRecord['status'], { label: string; color: string; bg: string }> = {
    sent:      { label: '발송 완료', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
    opened:    { label: '열람',      color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    clicked:   { label: '클릭',      color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    converted: { label: '계약 전환', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
};

export default function EmailHistoryPage() {
    const [records, setRecords] = useState<EmailRecord[]>([]);
    const [filter, setFilter] = useState<'all' | EmailRecord['status']>('all');
    const [refreshing, setRefreshing] = useState(false);

    const load = () => {
        const leads = leadStore.getAll();
        setRecords(buildRecords(leads));
    };

    useEffect(() => { load(); }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await new Promise(r => setTimeout(r, 600));
        load();
        setRefreshing(false);
    };

    const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);

    const totalSent = records.length;
    const totalOpens = records.reduce((s, r) => s + r.opens, 0);
    const totalClicks = records.reduce((s, r) => s + r.clicks, 0);
    const openRate = totalSent > 0 ? Math.round((records.filter(r => r.opens > 0).length / totalSent) * 100) : 0;
    const clickRate = totalSent > 0 ? Math.round((records.filter(r => r.clicks > 0).length / totalSent) * 100) : 0;
    const convertRate = totalSent > 0 ? Math.round((records.filter(r => r.status === 'converted').length / totalSent) * 100) : 0;

    return (
        <div className="min-h-screen pb-16" style={{ background: '#04091a', color: '#f0f4ff' }}>
            {/* 헤더 */}
            <div className="sticky top-0 z-40 px-6 py-4"
                style={{ background: 'rgba(4,9,26,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/employee">
                            <button className="flex items-center gap-1 text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                <ArrowLeft className="w-4 h-4" /> 리드 목록
                            </button>
                        </Link>
                        <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                        <h1 className="font-black text-lg flex items-center gap-2">
                            <Mail className="w-5 h-5" style={{ color: '#3b82f6' }} />
                            이메일 발송 이력
                        </h1>
                    </div>
                    <button onClick={handleRefresh} disabled={refreshing}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,244,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        새로고침
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
                {/* 집계 KPI */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { label: '총 발송', value: totalSent, icon: Mail, color: '#94a3b8', suffix: '건' },
                        { label: '총 열람', value: totalOpens, icon: Eye, color: '#3b82f6', suffix: '회' },
                        { label: '총 클릭', value: totalClicks, icon: MousePointerClick, color: '#a855f7', suffix: '회' },
                        { label: '오픈율', value: openRate, icon: BarChart3, color: '#fb923c', suffix: '%' },
                        { label: '전환율', value: convertRate, icon: TrendingUp, color: '#4ade80', suffix: '%' },
                    ].map(({ label, value, icon: Icon, color, suffix }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="rounded-xl p-4 text-center"
                            style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20` }}>
                            <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                            <div className="text-xl font-black" style={{ color }}>{value}{suffix}</div>
                            <div className="text-[10px] mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>{label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* 오픈율 시각화 바 */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl p-5"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 className="font-black text-sm mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        이메일 퍼널 분석
                    </h2>
                    <div className="space-y-3">
                        {[
                            { label: '발송 완료', pct: 100, count: totalSent, color: '#94a3b8' },
                            { label: '열람',      pct: openRate, count: records.filter(r => r.opens > 0).length, color: '#3b82f6' },
                            { label: '링크 클릭', pct: clickRate, count: records.filter(r => r.clicks > 0).length, color: '#a855f7' },
                            { label: '계약 전환', pct: convertRate, count: records.filter(r => r.status === 'converted').length, color: '#4ade80' },
                        ].map(({ label, pct, count, color }, i) => (
                            <div key={label}>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span style={{ color: 'rgba(240,244,255,0.6)' }}>{label}</span>
                                    <span className="font-bold" style={{ color }}>{count}건 ({pct}%)</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                                        className="h-full rounded-full"
                                        style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* 필터 */}
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'sent', 'opened', 'clicked', 'converted'] as const).map(f => {
                        const meta = f === 'all' ? { label: '전체', color: '#c9a84c', bg: 'rgba(201,168,76,0.1)' } : STATUS_BADGE[f];
                        return (
                            <button key={f} onClick={() => setFilter(f)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={{
                                    background: filter === f ? meta.bg : 'rgba(255,255,255,0.02)',
                                    color: filter === f ? meta.color : 'rgba(240,244,255,0.4)',
                                    border: `1px solid ${filter === f ? meta.color + '50' : 'rgba(255,255,255,0.08)'}`,
                                }}>
                                {meta.label}
                                {f !== 'all' && (
                                    <span className="ml-1.5" style={{ opacity: 0.7 }}>
                                        {records.filter(r => r.status === f).length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 발송 이력 리스트 */}
                <div className="space-y-3">
                    {filtered.map((rec, i) => {
                        const badge = STATUS_BADGE[rec.status];
                        return (
                            <motion.div key={rec.leadId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                className="rounded-2xl p-5"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="font-black text-sm" style={{ color: '#f0f4ff' }}>{rec.company}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                                style={{ background: badge.bg, color: badge.color }}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {rec.contactEmail}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(rec.sentAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 추적 지표 */}
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="text-center">
                                            <div className="text-sm font-black" style={{ color: '#3b82f6' }}>{rec.opens}</div>
                                            <div className="flex items-center gap-0.5 text-[9px]" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                                <Eye className="w-2.5 h-2.5" /> 열람
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-black" style={{ color: '#a855f7' }}>{rec.clicks}</div>
                                            <div className="flex items-center gap-0.5 text-[9px]" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                                <MousePointerClick className="w-2.5 h-2.5" /> 클릭
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-black" style={{ color: '#4ade80' }}>{rec.score}</div>
                                            <div className="flex items-center gap-0.5 text-[9px]" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                                <TrendingUp className="w-2.5 h-2.5" /> 점수
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-4">
                                    <Link href={`/admin/email-preview?leadId=${rec.leadId}`}>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                                            style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
                                            <Mail className="w-3.5 h-3.5" /> 재발송
                                        </button>
                                    </Link>
                                    {rec.status === 'converted' && (
                                        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#4ade80' }}>
                                            <CheckCircle2 className="w-3.5 h-3.5" /> 계약 전환 완료
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center py-20">
                            <Mail className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(240,244,255,0.15)' }} />
                            <p className="font-bold" style={{ color: 'rgba(240,244,255,0.4)' }}>발송 이력이 없습니다</p>
                            <p className="text-xs mt-1" style={{ color: 'rgba(240,244,255,0.25)' }}>
                                이메일을 발송하면 이곳에서 추적할 수 있습니다
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
