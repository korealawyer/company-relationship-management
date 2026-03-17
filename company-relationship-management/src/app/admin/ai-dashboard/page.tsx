'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Brain, Zap, DollarSign, Clock, TrendingUp, RefreshCw,
    AlertTriangle, CheckCircle2, BarChart3, Activity, Cpu, Trash2,
} from 'lucide-react';

// ── 색상 시스템 ────────────────────────────────────────────
const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

interface UsageSummary {
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    totalTokensIn: number;
    totalTokensOut: number;
    totalCostUSD: number;
    avgDurationMs: number;
    byEndpoint: Record<string, { calls: number; tokens: number; cost: number }>;
    byProvider: Record<string, { calls: number; tokens: number; cost: number }>;
    recentCalls: Array<{
        endpoint: string; provider: string; model: string;
        tokensIn: number; tokensOut: number; costUSD: number;
        durationMs: number; success: boolean; timestamp: string;
    }>;
}

interface Briefing {
    highlights: string[];
    actionItems: string[];
    summary: string;
}

// ── 통계 카드 ──────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-xs font-bold" style={{ color: T.muted }}>{label}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: T.heading }}>{value}</div>
            {sub && <p className="text-xs mt-1" style={{ color: T.faint }}>{sub}</p>}
        </motion.div>
    );
}

export default function AIDashboardPage() {
    const [usage, setUsage] = useState<UsageSummary | null>(null);
    const [briefing, setBriefing] = useState<Briefing | null>(null);
    const [loading, setLoading] = useState(true);
    const [briefLoading, setBriefLoading] = useState(false);

    const fetchUsage = useCallback(async () => {
        try {
            const res = await fetch('/api/ai-usage');
            if (res.ok) setUsage(await res.json());
        } catch { /* silent */ }
    }, []);

    const fetchBriefing = useCallback(async () => {
        setBriefLoading(true);
        try {
            const res = await fetch('/api/ai-brief');
            if (res.ok) setBriefing(await res.json());
        } catch { /* silent */ }
        setBriefLoading(false);
    }, []);

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchUsage(), fetchBriefing()]);
            setLoading(false);
        };
        init();
    }, [fetchUsage, fetchBriefing]);

    const handleReset = async () => {
        if (!confirm('AI 사용량 로그를 초기화하시겠습니까?')) return;
        await fetch('/api/ai-usage', { method: 'DELETE' });
        fetchUsage();
    };

    const successRate = usage ? (usage.totalCalls > 0 ? Math.round((usage.successCalls / usage.totalCalls) * 100) : 100) : 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
                <RefreshCw className="w-6 h-6 animate-spin" style={{ color: T.muted }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4" style={{ background: T.bg }}>
            <div className="max-w-6xl mx-auto">

                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: T.heading }}>
                            <Brain className="w-6 h-6" style={{ color: '#8b5cf6' }} />
                            AI 현황 대시보드
                        </h1>
                        <p className="text-sm mt-1" style={{ color: T.muted }}>AI 사용량, 비용, 브리핑을 한 눈에 확인합니다</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { fetchUsage(); fetchBriefing(); }}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body }}>
                            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
                        </button>
                        <button onClick={handleReset}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                            style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                            <Trash2 className="w-3.5 h-3.5" /> 초기화
                        </button>
                    </div>
                </div>

                {/* 통계 카드 그리드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard icon={Zap} label="총 API 호출" value={usage?.totalCalls ?? 0} sub={`성공 ${usage?.successCalls ?? 0} / 실패 ${usage?.failedCalls ?? 0}`} color="#6366f1" />
                    <StatCard icon={DollarSign} label="총 비용 (USD)" value={`$${(usage?.totalCostUSD ?? 0).toFixed(4)}`} sub="예상 비용" color="#10b981" />
                    <StatCard icon={BarChart3} label="총 토큰" value={((usage?.totalTokensIn ?? 0) + (usage?.totalTokensOut ?? 0)).toLocaleString()} sub={`입력 ${(usage?.totalTokensIn ?? 0).toLocaleString()} / 출력 ${(usage?.totalTokensOut ?? 0).toLocaleString()}`} color="#f59e0b" />
                    <StatCard icon={Clock} label="평균 응답 시간" value={`${((usage?.avgDurationMs ?? 0) / 1000).toFixed(1)}s`} sub={`성공률 ${successRate}%`} color="#8b5cf6" />
                </div>

                <div className="grid md:grid-cols-3 gap-6">

                    {/* AI 브리핑 (2/3) */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-black text-base flex items-center gap-2" style={{ color: T.heading }}>
                                    <Activity className="w-4 h-4" style={{ color: '#f59e0b' }} />
                                    오늘의 AI 브리핑
                                </h2>
                                <button onClick={fetchBriefing} disabled={briefLoading}
                                    className="text-xs font-bold px-3 py-1.5 rounded-lg"
                                    style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
                                    {briefLoading ? '생성 중...' : '다시 생성'}
                                </button>
                            </div>

                            {briefing ? (
                                <>
                                    {briefing.summary && (
                                        <p className="text-sm mb-4 leading-relaxed" style={{ color: T.body }}>{briefing.summary}</p>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-xs font-black mb-2 flex items-center gap-1" style={{ color: T.muted }}>
                                                <TrendingUp className="w-3.5 h-3.5" /> 주요 하이라이트
                                            </h3>
                                            <div className="space-y-2">
                                                {briefing.highlights.map((h, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm" style={{ color: T.body }}>
                                                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#4ade80' }} />
                                                        <span>{h}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black mb-2 flex items-center gap-1" style={{ color: T.muted }}>
                                                <AlertTriangle className="w-3.5 h-3.5" /> 액션 아이템
                                            </h3>
                                            <div className="space-y-2">
                                                {briefing.actionItems.map((a, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm" style={{ color: T.body }}>
                                                        <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
                                                        <span>{a}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm" style={{ color: T.faint }}>브리핑을 생성하려면 &quot;다시 생성&quot; 버튼을 클릭하세요.</p>
                            )}
                        </div>

                        {/* 최근 호출 기록 */}
                        <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                            <h2 className="font-black text-base mb-4 flex items-center gap-2" style={{ color: T.heading }}>
                                <Cpu className="w-4 h-4" style={{ color: '#6366f1' }} />
                                최근 API 호출 기록
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                            {['엔드포인트', 'Provider', '토큰(IN/OUT)', '비용', '시간', '상태'].map(h => (
                                                <th key={h} className="py-2 px-2 text-left font-bold" style={{ color: T.muted }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(usage?.recentCalls ?? []).slice(0, 10).map((c, i) => (
                                            <tr key={i} style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                                <td className="py-2 px-2 font-bold" style={{ color: T.body }}>{c.endpoint}</td>
                                                <td className="py-2 px-2" style={{ color: T.sub }}>
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                        style={{
                                                            background: c.provider === 'claude' ? '#fef3c7' : c.provider === 'openai' ? '#d1fae5' : '#dbeafe',
                                                            color: c.provider === 'claude' ? '#92400e' : c.provider === 'openai' ? '#065f46' : '#1e40af',
                                                        }}>
                                                        {c.provider}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-2" style={{ color: T.sub }}>{c.tokensIn}/{c.tokensOut}</td>
                                                <td className="py-2 px-2" style={{ color: T.sub }}>${c.costUSD.toFixed(4)}</td>
                                                <td className="py-2 px-2" style={{ color: T.sub }}>{(c.durationMs / 1000).toFixed(1)}s</td>
                                                <td className="py-2 px-2">
                                                    {c.success
                                                        ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                                                        : <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                        {(usage?.recentCalls ?? []).length === 0 && (
                                            <tr><td colSpan={6} className="py-8 text-center" style={{ color: T.faint }}>아직 호출 기록이 없습니다</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 사이드바 (1/3) */}
                    <div className="space-y-4">
                        {/* Provider별 사용량 */}
                        <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                            <h3 className="font-black text-sm mb-3" style={{ color: T.heading }}>Provider별 사용량</h3>
                            {Object.entries(usage?.byProvider ?? {}).map(([prov, data]) => (
                                <div key={prov} className="mb-3 pb-3" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold" style={{ color: T.body }}>{prov}</span>
                                        <span className="text-xs" style={{ color: T.muted }}>{data.calls}회</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full" style={{ background: T.borderSub }}>
                                        <div className="h-full rounded-full" style={{
                                            width: `${usage ? Math.min(100, (data.calls / Math.max(1, usage.totalCalls)) * 100) : 0}%`,
                                            background: prov === 'claude' ? '#c9a84c' : prov === 'openai' ? '#10a37f' : '#4285f4',
                                        }} />
                                    </div>
                                    <p className="text-[10px] mt-1" style={{ color: T.faint }}>${data.cost.toFixed(4)} · {data.tokens.toLocaleString()} tokens</p>
                                </div>
                            ))}
                            {Object.keys(usage?.byProvider ?? {}).length === 0 && (
                                <p className="text-xs" style={{ color: T.faint }}>데이터 없음</p>
                            )}
                        </div>

                        {/* Endpoint별 사용량 */}
                        <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                            <h3 className="font-black text-sm mb-3" style={{ color: T.heading }}>Endpoint별 호출</h3>
                            {Object.entries(usage?.byEndpoint ?? {}).sort(([, a], [, b]) => b.calls - a.calls).map(([ep, data]) => (
                                <div key={ep} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                    <span className="text-xs font-medium truncate max-w-[120px]" style={{ color: T.body }}>{ep}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold" style={{ color: '#6366f1' }}>{data.calls}</span>
                                        <span className="text-[10px]" style={{ color: T.faint }}>${data.cost.toFixed(4)}</span>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(usage?.byEndpoint ?? {}).length === 0 && (
                                <p className="text-xs" style={{ color: T.faint }}>데이터 없음</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
