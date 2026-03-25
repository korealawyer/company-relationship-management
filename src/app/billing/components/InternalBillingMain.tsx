'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Coins, RefreshCw, Download, FileText, CheckCircle2,
    Clock, Search, X, Receipt
} from 'lucide-react';
import { store, Company } from '@/lib/mockStore';
import { PaymentRecord, PLAN_PRICE, PLAN_LABEL, PAY_STATUS_STYLE, T } from '../types';

import { BillingKPIs } from './internal/BillingKPIs';
import { SubscribedCompanyList } from './internal/SubscribedCompanyList';
import { PlanRevenueCharts } from './internal/PlanRevenueCharts';
import { exportToExcel } from '@/lib/exportUtils';

export function InternalBillingMain() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [toast, setToast] = useState('');

    // ── 데이터 로드 (mockStore 연동) ─────────────────────────
    const refresh = useCallback(() => {
        const all = store.getAll();
        setCompanies(all);

        // 구독 완료된 기업에서 결제 내역 생성
        const subscribedCompaniesList = all.filter(c => c.status === 'subscribed' || c.plan !== 'none');
        const records: PaymentRecord[] = [];
        subscribedCompaniesList.forEach(c => {
            const price = PLAN_PRICE[c.plan] || 0;
            if (price === 0) return;
            // 최근 6개월 결제 기록 생성
            for (let i = 0; i < 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                records.push({
                    id: `pay-${c.id}-${i}`,
                    companyId: c.id,
                    companyName: c.name,
                    plan: c.plan,
                    amount: price,
                    date: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.15`,
                    status: i === 0 ? 'pending' : 'paid',
                    method: '신한카드 ****4852',
                    invoiceNo: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${c.id.slice(-3)}`,
                });
            }
        });

        // 파이프라인에서 contract_signed / contract_sent 기업은 결제 대기
        const pendingCompaniesList = all.filter(c =>
            ['contract_signed', 'contract_sent'].includes(c.status)
        );
        pendingCompaniesList.forEach(c => {
            const price = PLAN_PRICE['standard']; // 예상 구독료
            records.push({
                id: `pay-pending-${c.id}`,
                companyId: c.id,
                companyName: c.name,
                plan: 'standard',
                amount: price,
                date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
                status: 'pending',
                method: '-',
                invoiceNo: `INV-PENDING-${c.id.slice(-3)}`,
            });
        });

        records.sort((a, b) => b.date.localeCompare(a.date));
        setPayments(records);
    }, []);

    useEffect(() => { refresh(); }, [refresh]);
    useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); } }, [toast]);

    // ── 통계 계산 ───────────────────────────────────────────
    const subscribedCompanies = companies.filter(c => c.status === 'subscribed' && c.plan !== 'none');
    const totalMRR = subscribedCompanies.reduce((s, c) => s + (PLAN_PRICE[c.plan] || 0), 0);
    const totalARR = totalMRR * 12;
    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const overduePayments = payments.filter(p => p.status === 'overdue');
    const totalRevenue = paidPayments.reduce((s, p) => s + p.amount, 0);
    const pendingAmount = pendingPayments.reduce((s, p) => s + p.amount, 0);

    // ── 필터링 (결제 테이블에 사용됨) ─────────────────────────
    /*
    const filteredPayments = payments.filter(p => {
        const matchSearch = p.companyName.includes(search) || p.invoiceNo.includes(search);
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchSearch && matchStatus;
    });
    */

    // ── 플랜별 기업 수 ──────────────────────────────────────
    const planCounts = {
        starter: subscribedCompanies.filter(c => c.plan === 'starter').length,
        standard: subscribedCompanies.filter(c => c.plan === 'standard').length,
        premium: subscribedCompanies.filter(c => c.plan === 'premium').length,
    };

    const contractSentCount = companies.filter(c => c.status === 'contract_sent').length;
    const contractSignedCount = companies.filter(c => c.status === 'contract_signed').length;

    const handleExportExcel = () => {
        if (payments.length === 0) {
            setToast('다운로드할 데이터가 없습니다.');
            return;
        }
        exportToExcel(
            payments,
            [
                { header: '결제일', key: 'date' },
                { header: '청구번호', key: 'invoiceNo' },
                { header: '기업명', key: 'companyName' },
                { header: '플랜', key: p => PLAN_LABEL[p.plan] || p.plan },
                { header: '결제금액', key: 'amount' },
                { header: '상태', key: p => p.status === 'paid' ? '결제완료' : p.status === 'pending' ? '결제대기' : '연체' },
                { header: '결제수단', key: 'method' },
            ],
            `매출리포트_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
        );
    };

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: T.bg }}>
            <div className="max-w-7xl mx-auto px-4">
                {/* 헤더 */}
                <div className="py-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Coins className="w-5 h-5" style={{ color: T.gold }} />
                            <h1 className="text-2xl font-black" style={{ color: T.heading }}>
                                회계팀 · 결제 관리
                            </h1>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                                style={{ background: T.goldBg, color: T.gold, border: `1px solid ${T.gold}30` }}>
                                FINANCE
                            </span>
                        </div>
                        <p className="text-sm" style={{ color: T.muted }}>
                            구독 매출, 결제 현황, 미수금을 실시간으로 추적합니다
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={refresh}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                            style={{ background: T.card, color: T.muted, border: `1px solid ${T.border}` }}>
                            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
                        </button>
                        <button
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}
                            onClick={handleExportExcel}>
                            <Download className="w-3.5 h-3.5" /> 매출 리포트 Excel 다운로드
                        </button>
                    </div>
                </div>

                {/* KPI 부문 */}
                <BillingKPIs 
                    totalMRR={totalMRR}
                    totalARR={totalARR}
                    subscribedCompaniesCount={subscribedCompanies.length}
                    planCounts={planCounts}
                    totalRevenue={totalRevenue}
                    paidPaymentsCount={paidPayments.length}
                    pendingAmount={pendingAmount}
                    pendingPaymentsCount={pendingPayments.length}
                    overduePaymentsCount={overduePayments.length}
                />

                <div className="grid lg:grid-cols-3 gap-5 mb-6">
                    {/* 구독 기업 리스트 */}
                    <SubscribedCompanyList 
                        subscribedCompanies={subscribedCompanies}
                        onSelectCompany={setSelectedCompany}
                    />

                    {/* 매출 차트 / 파이프라인 */}
                    <PlanRevenueCharts 
                        planCounts={planCounts}
                        totalMRR={totalMRR}
                        contractSentCount={contractSentCount}
                        contractSignedCount={contractSignedCount}
                        pendingPaymentsCount={pendingPayments.length}
                    />
                </div>

                {/* 하단 결제 테이블 및 시스템 로그 영역 
                    (향후 PaymentTable.tsx 및 ActivityLog.tsx로 분리 예정)
                */}
                
            </div>

            {/* 기업 상세 사이드패널 */}
            <AnimatePresence>
                {selectedCompany && (
                    <motion.div className="fixed inset-0 z-50 flex justify-end"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedCompany(null)} />
                        <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
                            className="relative w-full max-w-md h-full overflow-y-auto"
                            style={{ background: T.card, borderLeft: `1px solid ${T.border}` }}>
                            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
                                style={{ background: T.card, borderBottom: `1px solid ${T.borderSub}` }}>
                                <h3 className="font-black" style={{ color: T.heading }}>결제 상세</h3>
                                <button onClick={() => setSelectedCompany(null)} className="p-1 rounded hover:bg-gray-100">
                                    <X className="w-5 h-5" style={{ color: T.muted }} />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                {/* 기업 정보 */}
                                <div>
                                    <h4 className="text-lg font-black mb-1" style={{ color: T.heading }}>{selectedCompany.name}</h4>
                                    <p className="text-xs" style={{ color: T.muted }}>{selectedCompany.biz}</p>
                                </div>
                                {/* 구독 정보 */}
                                <div className="p-4 rounded-xl" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                                    <p className="text-[10px] font-bold mb-2" style={{ color: T.gold }}>구독 정보</p>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <p style={{ color: T.faint }}>플랜</p>
                                            <p className="font-bold" style={{ color: T.heading }}>{PLAN_LABEL[selectedCompany.plan]}</p>
                                        </div>
                                        <div>
                                            <p style={{ color: T.faint }}>월 구독료</p>
                                            <p className="font-bold" style={{ color: T.heading }}>₩{(PLAN_PRICE[selectedCompany.plan] || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p style={{ color: T.faint }}>가맹점수</p>
                                            <p className="font-bold" style={{ color: T.heading }}>{selectedCompany.storeCount.toLocaleString()}개</p>
                                        </div>
                                        <div>
                                            <p style={{ color: T.faint }}>담당 변호사</p>
                                            <p className="font-bold" style={{ color: T.heading }}>{selectedCompany.assignedLawyer || '-'}</p>
                                        </div>
                                        <div>
                                            <p style={{ color: T.faint }}>이메일</p>
                                            <p className="font-bold" style={{ color: '#2563eb' }}>{selectedCompany.email}</p>
                                        </div>
                                        <div>
                                            <p style={{ color: T.faint }}>전화</p>
                                            <p className="font-bold" style={{ color: T.heading }}>{selectedCompany.phone}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* 이 기업의 결제 내역 */}
                                <div>
                                    <p className="text-xs font-black mb-2" style={{ color: T.heading }}>결제 이력</p>
                                    {payments.filter(p => p.companyId === selectedCompany.id).map(p => {
                                        const s = PAY_STATUS_STYLE[p.status];
                                        return (
                                            <div key={p.id} className="flex items-center justify-between py-2"
                                                style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                                <div>
                                                    <p className="text-xs font-bold" style={{ color: T.body }}>{p.date}</p>
                                                    <p className="text-[10px]" style={{ color: T.faint }}>{p.invoiceNo}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold" style={{ color: T.heading }}>₩{p.amount.toLocaleString()}</p>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                                        style={{ color: s.color, background: s.bg }}>{s.label}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
