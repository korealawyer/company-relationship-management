'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { T, PLAN_PRICE, PLAN_LABEL, PaymentRecord } from '../types';
import { useCompanies } from '@/hooks/useDataLayer';

import NoSubscriptionCard from './client/NoSubscriptionCard';
import ActiveSubscriptionCard from './client/ActiveSubscriptionCard';
import ClientPaymentTable from './client/ClientPaymentTable';

export default function ClientBillingMain() {
    const session = getSession();
    const companyName = session?.companyName || '고객사';
    const companyId = session?.companyId;

    const { companies } = useCompanies();

    const [toast, setToast] = useState('');
    useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); } }, [toast]);

    // 실제 구독 상태 확인
    const company = companyId && companies ? companies.find(c => c.id === companyId) : null;
    const hasSubscription = !!(company && company.plan && company.plan !== 'none' && company.status === 'subscribed');

    const plan = hasSubscription && company
        ? {
            name: PLAN_LABEL[company.plan] || company.plan,
            price: PLAN_PRICE[company.plan] || 0,
            color: company.plan === 'premium' ? '#c9a84c' : company.plan === 'standard' ? '#2563eb' : '#6b7280',
            features: [
                '전담 변호사 배정', '개인정보 진단 리포트', '월간 리스크 모니터링',
                '이메일 법률 자문 (무제한)', '전자계약 관리'
            ]
        }
        : null;

    const nextPayDate = '2026.04.15';
    const contractDate = company?.contractSignedAt || '2026.02.22';

    const myPayments: PaymentRecord[] = (hasSubscription && plan && company) ? [
        { id: 'p1', companyId: company.id, companyName: company.name, plan: company.plan, date: '2026.03.15', amount: plan.price, status: 'paid', method: '신한카드 ****4852', invoiceNo: 'INV-202603-001' },
        { id: 'p2', companyId: company.id, companyName: company.name, plan: company.plan, date: '2026.02.15', amount: plan.price, status: 'paid', method: '신한카드 ****4852', invoiceNo: 'INV-202602-001' },
    ] : [];

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: T.bg }}>
            <div className="max-w-4xl mx-auto px-4">
                {/* 헤더 */}
                <div className="py-6">
                    <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-5 h-5" style={{ color: T.gold }} />
                        <h1 className="text-2xl font-black" style={{ color: T.heading }}>결제 · 구독 관리</h1>
                    </div>
                    <p className="text-sm" style={{ color: T.muted }}>
                        {companyName}의 구독 플랜 및 결제 내역을 관리합니다
                    </p>
                </div>

                {/* ── 구독 없는 경우 / 혹은 플랜 확인 전 (무료 회원) ── */}
                {!hasSubscription || !plan ? (
                    <NoSubscriptionCard setToast={setToast} />
                ) : (
                    /* ── 구독 중인 경우 (유료 회원) ── */
                    <>
                        <ActiveSubscriptionCard
                            setToast={setToast}
                            plan={plan}
                            contractDate={contractDate}
                            nextPayDate={nextPayDate}
                            myPayments={myPayments}
                        />
                        <ClientPaymentTable
                            setToast={setToast}
                            myPayments={myPayments}
                        />
                    </>
                )}

                {/* 고객센터 안내 */}
                <div className="mt-6 p-4 rounded-xl text-center" style={{ background: T.goldBg, border: `1px solid ${T.gold}20` }}>
                    <p className="text-xs" style={{ color: T.muted }}>
                        결제 관련 문의: <strong style={{ color: T.gold }}>02-598-8518</strong> (평일 9-18시) ·
                        이메일: <strong style={{ color: T.gold }}>billing@ibslaw.co.kr</strong>
                    </p>
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-bold z-50"
                        style={{ background: '#111827', color: '#f0f4ff', border: '1px solid rgba(201,168,76,0.3)' }}>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
