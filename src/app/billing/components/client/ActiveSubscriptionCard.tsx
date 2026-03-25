import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, TrendingUp, CreditCard, Wallet, Calendar } from 'lucide-react';
import Link from 'next/link';
import { T, PaymentRecord } from '../../types';

interface Props {
    setToast: (msg: string) => void;
    plan: {
        name: string;
        price: number;
        color: string;
        features: string[];
    };
    contractDate: string;
    nextPayDate: string;
    myPayments: PaymentRecord[];
}

export default function ActiveSubscriptionCard({ setToast, plan, contractDate, nextPayDate, myPayments }: Props) {
    return (
        <>
            {/* 현재 플랜 카드 */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl mb-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <p className="text-xs font-bold mb-2" style={{ color: T.muted }}>현재 구독 플랜</p>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black" style={{ color: plan.color }}>{plan.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{ background: '#ecfdf5', color: '#059669' }}>활성</span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: T.faint }}>계약일: {contractDate} · 다음 결제: {nextPayDate}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold" style={{ color: T.muted }}>월 구독료</p>
                        <p className="text-xl font-black" style={{ color: T.heading }}>₩{plan.price.toLocaleString()}</p>
                        <p className="text-[10px]" style={{ color: T.faint }}>VAT 별도</p>
                    </div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: T.bg, border: `1px solid ${T.borderSub}` }}>
                    <p className="text-xs font-bold mb-2" style={{ color: T.gold }}>포함 서비스</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {plan.features.map(f => (
                            <div key={f} className="flex items-center gap-1.5 text-xs" style={{ color: T.body }}>
                                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#059669' }} />
                                {f}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <Link href="/pricing">
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                            style={{ background: T.goldBg, color: T.gold, border: `1px solid ${T.gold}30` }}>
                            <TrendingUp className="w-3.5 h-3.5" /> 플랜 업그레이드
                        </button>
                    </Link>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}
                        onClick={() => setToast('결제 수단 변경은 고객센터(02-598-8518)로 문의해 주세요.')}>
                        <CreditCard className="w-3.5 h-3.5" /> 결제 수단 변경
                    </button>
                </div>
            </motion.div>

            {/* 결제 요약 KPI */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: '총 결제 금액', value: `₩${(myPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)).toLocaleString()}`, icon: Wallet, color: '#059669', bg: '#ecfdf5' },
                    { label: '결제 완료', value: `${myPayments.filter(p => p.status === 'paid').length}건`, icon: CheckCircle2, color: '#2563eb', bg: '#eff6ff' },
                    { label: '다음 결제일', value: nextPayDate, icon: Calendar, color: T.gold, bg: T.goldBg },
                ].map((kpi, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="p-4 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold" style={{ color: T.muted }}>{kpi.label}</p>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                                <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                            </div>
                        </div>
                        <p className="text-lg font-black" style={{ color: T.heading }}>{kpi.value}</p>
                    </motion.div>
                ))}
            </div>
        </>
    );
}
