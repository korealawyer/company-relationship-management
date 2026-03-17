'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard, Download, Receipt, Calendar, CheckCircle2,
    AlertTriangle, ChevronRight, Lock, Shield, ArrowRight,
    Building2, Clock, FileText, Phone, Star,
} from 'lucide-react';
import Link from 'next/link';

/* ── 타입 ───────────────────────────────────────────────── */
interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    plan: string;
    receipt?: string;
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
    paid: { label: '결제 완료', color: '#059669', bg: '#ecfdf5' },
    pending: { label: '결제 대기', color: '#d97706', bg: '#fffbeb' },
    failed: { label: '결제 실패', color: '#dc2626', bg: '#fef2f2' },
};

/* ── 목업 데이터 ──────────────────────────────────────── */
const CURRENT_PLAN = {
    name: 'Pro', price: 2490000, period: '월',
    nextBilling: '2026.04.15', since: '2025.09.15',
    features: ['법률 챗봇 무제한', '법률 자문 10건/월', '개인정보 전체 자동 검토', '무제한 임직원 계정', '계약서 검토 5건/월', '월간 법무 리포트', 'EAP 심리상담 (기본)'],
};

const PAYMENT_METHOD = {
    type: 'card' as const,
    brand: '신한카드',
    last4: '4852',
    expiry: '2027.05',
};

const INVOICES: Invoice[] = [
    { id: 'inv-1', date: '2026.03.15', amount: 2490000, status: 'paid', plan: 'Pro' },
    { id: 'inv-2', date: '2026.02.15', amount: 2490000, status: 'paid', plan: 'Pro' },
    { id: 'inv-3', date: '2026.01.15', amount: 2490000, status: 'paid', plan: 'Pro' },
    { id: 'inv-4', date: '2025.12.15', amount: 2490000, status: 'paid', plan: 'Pro' },
    { id: 'inv-5', date: '2025.11.15', amount: 2490000, status: 'paid', plan: 'Pro' },
    { id: 'inv-6', date: '2025.10.15', amount: 2490000, status: 'paid', plan: 'Pro' },
];

/* ── 구독 전 CTA ───────────────────────────────────────── */
function SubscribeCTA() {
    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                    <CreditCard className="w-10 h-10" style={{ color: '#059669' }} />
                </div>
                <h1 className="text-2xl font-black mb-3" style={{ color: '#111827' }}>결제 관리</h1>
                <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
                    구독을 시작하면 결제 수단, 청구서, 요금제를<br />
                    한 곳에서 편리하게 관리할 수 있습니다.
                </p>
                <div className="space-y-3 max-w-sm mx-auto mb-8">
                    {['결제 수단 등록 및 변경', '월별 청구서·영수증 다운로드', '요금제 업그레이드·다운그레이드'].map(f => (
                        <div key={f} className="flex items-center gap-2 p-3 rounded-xl text-xs"
                            style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#059669' }} />
                            <span style={{ color: '#374151' }}>{f}</span>
                        </div>
                    ))}
                </div>
                <Link href="/pricing">
                    <button className="px-8 py-3 rounded-xl font-bold text-sm"
                        style={{ background: '#111827', color: '#fff' }}>
                        구독 시작하기 →
                    </button>
                </Link>
            </div>
        </div>
    );
}

/* ── 메인 페이지 ───────────────────────────────────────── */
export default function BillingPage() {
    const [isSubscribed] = useState(true);

    if (!isSubscribed) return <SubscribeCTA />;

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-4xl mx-auto px-4">

                {/* 헤더 */}
                <div className="py-8">
                    <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-5 h-5" style={{ color: '#059669' }} />
                        <h1 className="text-2xl font-black" style={{ color: '#111827' }}>결제 관리</h1>
                    </div>
                    <p className="text-sm" style={{ color: '#6b7280' }}>구독, 결제 수단, 청구서를 관리합니다.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-5">
                    {/* 현재 플랜 */}
                    <div className="lg:col-span-2 p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <p className="text-xs font-bold tracking-wider uppercase mb-1" style={{ color: '#c9a84c' }}>현재 플랜</p>
                                <h2 className="text-xl font-black" style={{ color: '#111827' }}>{CURRENT_PLAN.name} 플랜</h2>
                                <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{CURRENT_PLAN.since}부터 이용 중</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black" style={{ color: '#111827' }}>
                                    ₩{CURRENT_PLAN.price.toLocaleString()}<span className="text-sm font-normal" style={{ color: '#9ca3af' }}>/{CURRENT_PLAN.period}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-5">
                            {CURRENT_PLAN.features.map(f => (
                                <div key={f} className="flex items-center gap-1.5 text-xs" style={{ color: '#374151' }}>
                                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#059669' }} />{f}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid #f0ede6' }}>
                            <Link href="/pricing">
                                <button className="px-4 py-2 rounded-xl text-xs font-bold"
                                    style={{ background: '#111827', color: '#fff' }}>
                                    플랜 변경
                                </button>
                            </Link>
                            <button className="px-4 py-2 rounded-xl text-xs font-bold"
                                style={{ background: '#fff', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                구독 해지
                            </button>
                        </div>
                    </div>

                    {/* 결제 수단 & 다음 결제 */}
                    <div className="space-y-4">
                        {/* 다음 결제일 */}
                        <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <p className="text-xs font-bold mb-3" style={{ color: '#6b7280' }}>다음 결제일</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
                                    <Calendar className="w-5 h-5" style={{ color: '#2563eb' }} />
                                </div>
                                <div>
                                    <div className="font-bold" style={{ color: '#111827' }}>{CURRENT_PLAN.nextBilling}</div>
                                    <div className="text-xs" style={{ color: '#6b7280' }}>₩{CURRENT_PLAN.price.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* 결제 수단 */}
                        <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold" style={{ color: '#6b7280' }}>결제 수단</p>
                                <button className="text-[10px] font-bold" style={{ color: '#2563eb' }}>변경</button>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8f7f4', border: '1px solid #f0ede6' }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff' }}>
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm" style={{ color: '#111827' }}>{PAYMENT_METHOD.brand}</div>
                                    <div className="text-xs" style={{ color: '#6b7280' }}>•••• {PAYMENT_METHOD.last4} · {PAYMENT_METHOD.expiry}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 청구 내역 */}
                <div className="mt-6 p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-black" style={{ color: '#111827' }}>청구 내역</h3>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: '#f8f7f4', color: '#374151', border: '1px solid #e8e5de' }}>
                            <Download className="w-3.5 h-3.5" /> 전체 다운로드
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f0ede6' }}>
                                    {['날짜', '플랜', '금액', '상태', ''].map(h => (
                                        <th key={h} className="text-left text-xs font-bold py-3 px-2" style={{ color: '#6b7280' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {INVOICES.map(inv => {
                                    const s = STATUS_STYLE[inv.status];
                                    return (
                                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #f8f7f4' }}>
                                            <td className="py-3 px-2 text-sm" style={{ color: '#111827' }}>{inv.date}</td>
                                            <td className="py-3 px-2 text-sm" style={{ color: '#374151' }}>{inv.plan}</td>
                                            <td className="py-3 px-2 text-sm font-bold" style={{ color: '#111827' }}>₩{inv.amount.toLocaleString()}</td>
                                            <td className="py-3 px-2">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                    style={{ color: s.color, background: s.bg }}>{s.label}</span>
                                            </td>
                                            <td className="py-3 px-2">
                                                <button className="flex items-center gap-1 text-[11px] font-bold" style={{ color: '#2563eb' }}>
                                                    <Receipt className="w-3 h-3" /> 영수증
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
