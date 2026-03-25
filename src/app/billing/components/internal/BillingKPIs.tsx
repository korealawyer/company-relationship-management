import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Building2, CircleDollarSign, AlertTriangle } from 'lucide-react';
import { formatW, T } from '../../types';

interface BillingKPIsProps {
    totalMRR: number;
    totalARR: number;
    subscribedCompaniesCount: number;
    planCounts: { starter: number; standard: number; premium: number };
    totalRevenue: number;
    paidPaymentsCount: number;
    pendingAmount: number;
    pendingPaymentsCount: number;
    overduePaymentsCount: number;
}

export function BillingKPIs({
    totalMRR,
    totalARR,
    subscribedCompaniesCount,
    planCounts,
    totalRevenue,
    paidPaymentsCount,
    pendingAmount,
    pendingPaymentsCount,
    overduePaymentsCount
}: BillingKPIsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
                { label: '월간 매출 (MRR)', value: `₩${formatW(totalMRR)}`, icon: TrendingUp, color: '#059669', bg: '#ecfdf5', sub: `ARR ₩${formatW(totalARR)}` },
                { label: '구독 기업 수', value: `${subscribedCompaniesCount}개`, icon: Building2, color: '#2563eb', bg: '#eff6ff', sub: `Starter ${planCounts.starter} · Standard ${planCounts.standard} · Premium ${planCounts.premium}` },
                { label: '총 수금액', value: `₩${formatW(totalRevenue)}`, icon: CircleDollarSign, color: T.gold, bg: T.goldBg, sub: `결제 완료 ${paidPaymentsCount}건` },
                { label: '미수금 / 대기', value: `₩${formatW(pendingAmount)}`, icon: AlertTriangle, color: pendingPaymentsCount > 0 ? '#d97706' : '#059669', bg: pendingPaymentsCount > 0 ? '#fffbeb' : '#ecfdf5', sub: `${pendingPaymentsCount}건 대기${overduePaymentsCount > 0 ? ` · ${overduePaymentsCount}건 연체` : ''}` },
            ].map((kpi, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold" style={{ color: T.muted }}>{kpi.label}</p>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: kpi.bg }}>
                            <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                        </div>
                    </div>
                    <div className="text-xl font-black mb-1" style={{ color: T.heading }}>{kpi.value}</div>
                    <p className="text-[10px]" style={{ color: T.faint }}>{kpi.sub}</p>
                </motion.div>
            ))}
        </div>
    );
}
