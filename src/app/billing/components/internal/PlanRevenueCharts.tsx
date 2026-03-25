import React from 'react';
import { T, PLAN_LABEL, PLAN_PRICE } from '../../types';

interface PlanRevenueChartsProps {
    planCounts: { starter: number; standard: number; premium: number };
    totalMRR: number;
    contractSentCount: number;
    contractSignedCount: number;
    pendingPaymentsCount: number;
}

export function PlanRevenueCharts({
    planCounts,
    totalMRR,
    contractSentCount,
    contractSignedCount,
    pendingPaymentsCount
}: PlanRevenueChartsProps) {
    return (
        <div className="space-y-4">
            {/* 플랜별 매출 분포 */}
            <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <p className="text-xs font-black mb-4" style={{ color: T.muted }}>플랜별 매출 구성</p>
                {(['premium', 'standard', 'starter'] as const).map(plan => {
                    const count = planCounts[plan];
                    const revenue = count * PLAN_PRICE[plan];
                    const pct = totalMRR > 0 ? Math.round((revenue / totalMRR) * 100) : 0;
                    const colors = { premium: T.gold, standard: '#2563eb', starter: '#6b7280' };
                    return (
                        <div key={plan} className="mb-3 last:mb-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold" style={{ color: T.body }}>
                                    {PLAN_LABEL[plan]} ({count}개)
                                </span>
                                <span className="text-xs font-bold" style={{ color: colors[plan] }}>
                                    {pct}%
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full" style={{ background: `${colors[plan]}15` }}>
                                <div className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, background: colors[plan], minWidth: count > 0 ? '4px' : 0 }} />
                            </div>
                            <p className="text-[10px] mt-0.5" style={{ color: T.faint }}>
                                ₩{revenue.toLocaleString()}/월
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* 결제 예정 */}
            <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <p className="text-xs font-black mb-3" style={{ color: T.muted }}>결제 파이프라인</p>
                {[
                    { label: '계약서 발송', count: contractSentCount, color: '#d97706' },
                    { label: '계약 서명 완료', count: contractSignedCount, color: '#059669' },
                    { label: '결제 대기', count: pendingPaymentsCount, color: '#2563eb' },
                ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2"
                        style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                        <span className="text-xs" style={{ color: T.body }}>{item.label}</span>
                        <span className="text-xs font-black px-2 py-0.5 rounded-full"
                            style={{ background: `${item.color}15`, color: item.color }}>
                            {item.count}건
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
