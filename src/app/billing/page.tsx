'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, Download, Receipt, Calendar, CheckCircle2,
    AlertTriangle, ChevronRight, ChevronDown, ChevronUp,
    Building2, Clock, FileText, Phone, Star, TrendingUp,
    Coins, Users, ArrowUpRight, ArrowDownRight, RefreshCw,
    DollarSign, BarChart3, Eye, X, Search, Filter,
    Wallet, PiggyBank, CircleDollarSign, BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';
import {
    store, Company, STATUS_LABEL,
} from '@/lib/mockStore';

/* ── 타입 ───────────────────────────────────────────────── */
interface PaymentRecord {
    id: string;
    companyId: string;
    companyName: string;
    plan: string;
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'overdue';
    method: string;
    invoiceNo: string;
}

const PLAN_PRICE: Record<string, number> = {
    starter: 330000,
    standard: 550000,
    premium: 1100000,
    none: 0,
};

const PLAN_LABEL: Record<string, string> = {
    starter: 'Entry',
    standard: 'Growth',
    premium: 'Scale',
    none: '-',
};

const PAY_STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
    paid: { label: '결제 완료', color: '#059669', bg: '#ecfdf5' },
    pending: { label: '결제 대기', color: '#d97706', bg: '#fffbeb' },
    overdue: { label: '연체', color: '#dc2626', bg: '#fef2f2' },
};

/* ── 테마 ───────────────────────────────────────────────── */
const T = {
    bg: '#f8f7f4', card: '#ffffff', heading: '#111827', body: '#374151',
    muted: '#6b7280', faint: '#9ca3af', border: '#e8e5de', borderSub: '#f0ede6',
    gold: '#c9a84c', goldBg: 'rgba(201,168,76,0.08)',
};

/* ── 금액 포맷 ──────────────────────────────────────────── */
function formatW(n: number) {
    if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
    if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
    return n.toLocaleString();
}

/* ── 메인 컴포넌트 ──────────────────────────────────────── */
import { getSession } from '@/lib/auth';

/* ── 고객사 전용 결제·구독 뷰 ─────────────────────────────── */
function ClientBillingView() {
    const session = getSession();
    const companyName = session?.companyName || '고객사';
    const companyId = session?.companyId;

    const [toast, setToast] = useState('');
    useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); } }, [toast]);

    // 실제 구독 상태 확인: mockStore에서 회사 조회
    const company = companyId ? store.getAll().find(c => c.id === companyId) : null;
    const hasSubscription = company && company.plan && company.plan !== 'none' && company.status === 'subscribed';

    const plan = hasSubscription
        ? { name: PLAN_LABEL[company.plan] || company.plan, price: PLAN_PRICE[company.plan] || 0, color: company.plan === 'premium' ? '#c9a84c' : company.plan === 'standard' ? '#2563eb' : '#6b7280', features: ['전담 변호사 배정', '개인정보 진단 리포트', '월간 리스크 모니터링', '이메일 법률 자문 (무제한)', '전자계약 관리'] }
        : null;

    const nextPayDate = '2026.04.15';
    const contractDate = company?.contractSignedAt || '2026.02.22';

    const myPayments = hasSubscription ? [
        { id: 'p1', date: '2026.03.15', amount: plan!.price, status: 'paid' as const, method: '신한카드 ****4852', invoiceNo: 'INV-202603-001' },
        { id: 'p2', date: '2026.02.15', amount: plan!.price, status: 'paid' as const, method: '신한카드 ****4852', invoiceNo: 'INV-202602-001' },
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

                {/* ── 구독 없는 경우 (무료 회원) ── */}
                {!hasSubscription ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        {/* 구독 없음 안내 카드 */}
                        <div className="p-8 rounded-2xl text-center mb-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                                style={{ background: T.goldBg }}>
                                <Wallet className="w-8 h-8" style={{ color: T.gold }} />
                            </div>
                            <h2 className="text-lg font-black mb-2" style={{ color: T.heading }}>현재 구독 중인 플랜이 없습니다</h2>
                            <p className="text-sm mb-6" style={{ color: T.muted }}>
                                IBS 법률 서비스를 구독하시면 전담 변호사 배정, 월간 리스크 모니터링,<br />
                                이메일 법률 자문 등 프리미엄 법무 인프라를 이용하실 수 있습니다.
                            </p>

                            {/* 플랜 비교 미니 카드 */}
                            <div className="grid grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
                                {[
                                    { name: 'Entry', price: '30~38만', color: '#60a5fa', features: ['무제한 본사 자문', '가맹점 BACKCALL'] },
                                    { name: 'Growth', price: '39~72만', color: '#c9a84c', features: ['무제한 본사 자문', '가맹점 BACKCALL'], popular: true },
                                    { name: 'Scale', price: '72~199만', color: '#a78bfa', features: ['무제한 본사 자문', '가맹점 BACKCALL'] },
                                ].map(p => (
                                    <div key={p.name} className="relative p-4 rounded-xl text-left"
                                        style={{
                                            background: p.popular ? `${p.color}08` : T.bg,
                                            border: `1px solid ${p.popular ? p.color + '40' : T.border}`,
                                        }}>
                                        {p.popular && (
                                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] px-2 py-0.5 rounded-full font-black"
                                                style={{ background: p.color, color: '#fff' }}>추천</span>
                                        )}
                                        <p className="text-xs font-black mb-1" style={{ color: p.color }}>{p.name}</p>
                                        <p className="text-sm font-black mb-2" style={{ color: T.heading }}>₩{p.price}<span className="text-[10px] font-normal" style={{ color: T.faint }}>/월</span></p>
                                        {p.features.map(f => (
                                            <div key={f} className="flex items-center gap-1 text-[10px] mb-0.5" style={{ color: T.body }}>
                                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#059669' }} /> {f}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-center gap-3">
                                <Link href="/pricing">
                                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all hover:scale-105"
                                        style={{ background: 'linear-gradient(135deg, #e8c87a, #c9a84c)', color: '#04091a' }}>
                                        <Star className="w-4 h-4" /> 플랜 선택하기
                                    </button>
                                </Link>
                                <button className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
                                    style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}
                                    onClick={() => setToast('📞 상담 예약: 02-598-8518 (평일 9-18시)')}>
                                    <Phone className="w-4 h-4" /> 도입 상담
                                </button>
                            </div>
                        </div>

                        {/* 결제 내역 없음 */}
                        <div className="rounded-2xl p-8 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                            <Receipt className="w-8 h-8 mx-auto mb-3" style={{ color: T.faint }} />
                            <p className="text-sm font-bold" style={{ color: T.muted }}>결제 내역이 없습니다</p>
                            <p className="text-xs mt-1" style={{ color: T.faint }}>플랜 구독 후 결제 내역이 여기에 표시됩니다</p>
                        </div>
                    </motion.div>
                ) : (
                    /* ── 구독 중인 경우 (유료 회원) ── */
                    <>
                        {/* 현재 플랜 카드 */}
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-2xl mb-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <p className="text-xs font-bold mb-2" style={{ color: T.muted }}>현재 구독 플랜</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-black" style={{ color: plan!.color }}>{plan!.name}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                            style={{ background: '#ecfdf5', color: '#059669' }}>활성</span>
                                    </div>
                                    <p className="text-xs mt-1" style={{ color: T.faint }}>계약일: {contractDate} · 다음 결제: {nextPayDate}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold" style={{ color: T.muted }}>월 구독료</p>
                                    <p className="text-xl font-black" style={{ color: T.heading }}>₩{plan!.price.toLocaleString()}</p>
                                    <p className="text-[10px]" style={{ color: T.faint }}>VAT 별도</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: T.bg, border: `1px solid ${T.borderSub}` }}>
                                <p className="text-xs font-bold mb-2" style={{ color: T.gold }}>포함 서비스</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {plan!.features.map(f => (
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

                        {/* 결제 내역 테이블 */}
                        <div className="rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                <h3 className="font-black flex items-center gap-2" style={{ color: T.heading }}>
                                    <Receipt className="w-4 h-4" style={{ color: '#2563eb' }} />
                                    결제 내역
                                </h3>
                            </div>
                            <table className="w-full">
                                <thead>
                                    <tr style={{ background: '#fafaf8', borderBottom: `1px solid ${T.borderSub}` }}>
                                        {['날짜', '청구서 번호', '금액', '결제수단', '상태', ''].map(h => (
                                            <th key={h} className="text-left text-xs font-black py-3 px-4" style={{ color: T.gold }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {myPayments.map(p => {
                                        const s = PAY_STATUS_STYLE[p.status];
                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors"
                                                style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                                <td className="py-3 px-4 text-xs" style={{ color: T.body }}>{p.date}</td>
                                                <td className="py-3 px-4 text-xs font-mono" style={{ color: T.faint }}>{p.invoiceNo}</td>
                                                <td className="py-3 px-4 text-xs font-bold" style={{ color: T.heading }}>₩{p.amount.toLocaleString()}</td>
                                                <td className="py-3 px-4 text-xs" style={{ color: T.muted }}>{p.method}</td>
                                                <td className="py-3 px-4">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                        style={{ color: s.color, background: s.bg }}>{s.label}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button className="flex items-center gap-1 text-[10px] font-bold"
                                                        style={{ color: '#2563eb' }}
                                                        onClick={() => setToast(`📄 ${p.invoiceNo} 영수증 다운로드`)}>
                                                        <Download className="w-3 h-3" /> 영수증
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
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

/* ── 회계팀(내부) 결제 관리 뷰 ────────────────────────────── */
export default function BillingPage() {
    // 역할 체크: client_hr이면 고객사 전용 뷰 렌더링
    const [role, setRole] = useState<string | null>(null);
    useEffect(() => {
        const s = getSession();
        setRole(s?.role || null);
    }, []);

    if (role === 'client_hr') return <ClientBillingView />;
    return <InternalBillingView />;
}

function InternalBillingView() {
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
        const subscribedCompanies = all.filter(c => c.status === 'subscribed' || c.plan !== 'none');
        const records: PaymentRecord[] = [];
        subscribedCompanies.forEach(c => {
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
        const pendingCompanies = all.filter(c =>
            ['contract_signed', 'contract_sent'].includes(c.status)
        );
        pendingCompanies.forEach(c => {
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

    // ── 필터링 ──────────────────────────────────────────────
    const filteredPayments = payments.filter(p => {
        const matchSearch = p.companyName.includes(search) || p.invoiceNo.includes(search);
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // ── 플랜별 기업 수 ──────────────────────────────────────
    const planCounts = {
        starter: subscribedCompanies.filter(c => c.plan === 'starter').length,
        standard: subscribedCompanies.filter(c => c.plan === 'standard').length,
        premium: subscribedCompanies.filter(c => c.plan === 'premium').length,
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
                            onClick={() => setToast('📥 매출 리포트 Excel 다운로드 (준비중)')}>
                            <Download className="w-3.5 h-3.5" /> 매출 리포트
                        </button>
                    </div>
                </div>

                {/* KPI 카드 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: '월간 매출 (MRR)', value: `₩${formatW(totalMRR)}`, icon: TrendingUp, color: '#059669', bg: '#ecfdf5', sub: `ARR ₩${formatW(totalARR)}` },
                        { label: '구독 기업 수', value: `${subscribedCompanies.length}개`, icon: Building2, color: '#2563eb', bg: '#eff6ff', sub: `Starter ${planCounts.starter} · Standard ${planCounts.standard} · Premium ${planCounts.premium}` },
                        { label: '총 수금액', value: `₩${formatW(totalRevenue)}`, icon: CircleDollarSign, color: T.gold, bg: T.goldBg, sub: `결제 완료 ${paidPayments.length}건` },
                        { label: '미수금 / 대기', value: `₩${formatW(pendingAmount)}`, icon: AlertTriangle, color: pendingPayments.length > 0 ? '#d97706' : '#059669', bg: pendingPayments.length > 0 ? '#fffbeb' : '#ecfdf5', sub: `${pendingPayments.length}건 대기${overduePayments.length > 0 ? ` · ${overduePayments.length}건 연체` : ''}` },
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

                {/* 구독 기업 현황 */}
                <div className="grid lg:grid-cols-3 gap-5 mb-6">
                    {/* 구독 기업 리스트 */}
                    <div className="lg:col-span-2 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                            <h3 className="font-black flex items-center gap-2" style={{ color: T.heading }}>
                                <BadgeCheck className="w-4 h-4" style={{ color: '#059669' }} />
                                구독 기업 현황
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{ background: '#ecfdf5', color: '#059669' }}>
                                {subscribedCompanies.length}개 활성
                            </span>
                        </div>
                        <div className="p-4">
                            {subscribedCompanies.length === 0 ? (
                                <div className="text-center py-12">
                                    <Wallet className="w-10 h-10 mx-auto mb-3" style={{ color: T.faint }} />
                                    <p className="text-sm font-bold" style={{ color: T.muted }}>구독 기업이 없습니다</p>
                                    <p className="text-xs mt-1" style={{ color: T.faint }}>CRM에서 구독 완료 시 자동으로 표시됩니다</p>
                                </div>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                            {['기업명', '플랜', '월 구독료', '가맹점수', '계약일', '상태'].map(h => (
                                                <th key={h} className="text-left py-2.5 px-2 font-black" style={{ color: T.gold }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subscribedCompanies.map(c => (
                                            <tr key={c.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                                                style={{ borderBottom: `1px solid ${T.borderSub}` }}
                                                onClick={() => setSelectedCompany(c)}>
                                                <td className="py-3 px-2 font-bold" style={{ color: T.heading }}>{c.name}</td>
                                                <td className="py-3 px-2">
                                                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px]"
                                                        style={{
                                                            background: c.plan === 'premium' ? T.goldBg : c.plan === 'standard' ? '#eff6ff' : '#f8f7f4',
                                                            color: c.plan === 'premium' ? T.gold : c.plan === 'standard' ? '#2563eb' : T.muted,
                                                        }}>
                                                        {PLAN_LABEL[c.plan]}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 font-bold" style={{ color: T.heading }}>
                                                    ₩{(PLAN_PRICE[c.plan] || 0).toLocaleString()}
                                                </td>
                                                <td className="py-3 px-2" style={{ color: T.body }}>{c.storeCount.toLocaleString()}개</td>
                                                <td className="py-3 px-2" style={{ color: T.muted }}>{c.contractSignedAt || c.updatedAt?.slice(0, 10) || '-'}</td>
                                                <td className="py-3 px-2">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                        style={{ background: '#ecfdf5', color: '#059669' }}>
                                                        활성
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* 매출 대비 플랜 분포 */}
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
                                { label: '계약서 발송', count: companies.filter(c => c.status === 'contract_sent').length, color: '#d97706' },
                                { label: '계약 서명 완료', count: companies.filter(c => c.status === 'contract_signed').length, color: '#059669' },
                                { label: '결제 대기', count: pendingPayments.length, color: '#2563eb' },
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
                </div>

                {/* 결제 내역 테이블 */}
                <div className="rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                        <h3 className="font-black flex items-center gap-2" style={{ color: T.heading }}>
                            <Receipt className="w-4 h-4" style={{ color: '#2563eb' }} />
                            결제 내역
                        </h3>
                        <div className="flex items-center gap-2">
                            {/* 검색 */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: T.faint }} />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="기업명 또는 청구서 번호"
                                    className="pl-8 pr-3 py-1.5 rounded-lg text-xs w-48 outline-none"
                                    style={{ background: T.bg, color: T.body, border: `1px solid ${T.border}` }} />
                            </div>
                            {/* 필터 */}
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer"
                                style={{ background: T.bg, color: T.body, border: `1px solid ${T.border}` }}>
                                <option value="all">전체</option>
                                <option value="paid">결제 완료</option>
                                <option value="pending">결제 대기</option>
                                <option value="overdue">연체</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: '#fafaf8', borderBottom: `1px solid ${T.borderSub}` }}>
                                    {['날짜', '기업명', '청구서 번호', '플랜', '금액', '결제수단', '상태', ''].map(h => (
                                        <th key={h} className="text-left text-xs font-black py-3 px-3" style={{ color: T.gold }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-sm" style={{ color: T.muted }}>
                                            결제 내역이 없습니다
                                        </td>
                                    </tr>
                                ) : filteredPayments.map(p => {
                                    const s = PAY_STATUS_STYLE[p.status];
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors"
                                            style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                            <td className="py-3 px-3 text-xs" style={{ color: T.body }}>{p.date}</td>
                                            <td className="py-3 px-3 text-xs font-bold" style={{ color: T.heading }}>{p.companyName}</td>
                                            <td className="py-3 px-3 text-xs font-mono" style={{ color: T.faint }}>{p.invoiceNo}</td>
                                            <td className="py-3 px-3">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                    style={{ background: '#eff6ff', color: '#2563eb' }}>
                                                    {PLAN_LABEL[p.plan]}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-xs font-bold" style={{ color: T.heading }}>
                                                ₩{p.amount.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-3 text-xs" style={{ color: T.muted }}>{p.method}</td>
                                            <td className="py-3 px-3">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                    style={{ color: s.color, background: s.bg }}>
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <button className="flex items-center gap-1 text-[10px] font-bold"
                                                    style={{ color: '#2563eb' }}
                                                    onClick={() => setToast(`📄 ${p.invoiceNo} 영수증 다운로드`)}>
                                                    <Receipt className="w-3 h-3" /> 영수증
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredPayments.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: `1px solid ${T.borderSub}`, background: '#fafaf8' }}>
                            <span className="text-[10px]" style={{ color: T.faint }}>
                                총 {filteredPayments.length}건
                            </span>
                            <span className="text-xs font-bold" style={{ color: T.heading }}>
                                합계: ₩{filteredPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* 자동화 로그 (결제 관련) */}
                <div className="mt-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <div className="px-6 py-4" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                        <h3 className="font-black flex items-center gap-2" style={{ color: T.heading }}>
                            <Clock className="w-4 h-4" style={{ color: T.gold }} />
                            최근 활동 로그
                        </h3>
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto">
                        {store.getLogs().filter(l =>
                            ['auto_email', 'auto_confirm', 'setting_change'].includes(l.type) &&
                            (l.label.includes('계약') || l.label.includes('구독') || l.label.includes('이관') || l.label.includes('이메일'))
                        ).slice(0, 10).map(log => (
                            <div key={log.id} className="flex items-start gap-3 py-2.5"
                                style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{
                                        background: log.type === 'auto_confirm' ? '#ecfdf5' : '#eff6ff',
                                        color: log.type === 'auto_confirm' ? '#059669' : '#2563eb',
                                    }}>
                                    {log.type === 'auto_confirm' ? <CheckCircle2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold" style={{ color: T.heading }}>{log.label}</span>
                                        {log.companyName && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                                style={{ background: T.goldBg, color: T.gold }}>{log.companyName}</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] mt-0.5" style={{ color: T.faint }}>{log.detail}</p>
                                </div>
                                <span className="text-[10px] flex-shrink-0" style={{ color: T.faint }}>{log.at}</span>
                            </div>
                        ))}
                        {store.getLogs().filter(l =>
                            ['auto_email', 'auto_confirm'].includes(l.type) &&
                            (l.label.includes('계약') || l.label.includes('구독') || l.label.includes('이관') || l.label.includes('이메일'))
                        ).length === 0 && (
                            <div className="text-center py-8">
                                <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: T.faint }} />
                                <p className="text-xs" style={{ color: T.muted }}>결제 관련 활동 로그가 없습니다</p>
                            </div>
                        )}
                    </div>
                </div>
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

            {/* 토스트 */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99] px-5 py-3 rounded-xl text-xs font-bold shadow-xl"
                        style={{ background: '#111827', color: '#fff' }}>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
