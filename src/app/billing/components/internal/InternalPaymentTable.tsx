import React from 'react';
import { Search, Receipt } from 'lucide-react';
import { PaymentRecord, PLAN_LABEL, PAY_STATUS_STYLE, T } from '../../types';

interface InternalPaymentTableProps {
    filteredPayments: PaymentRecord[];
    search: string;
    setSearch: (val: string) => void;
    statusFilter: string;
    setStatusFilter: (val: string) => void;
    setToast: (msg: string) => void;
}

export default function InternalPaymentTable({
    filteredPayments,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    setToast,
}: InternalPaymentTableProps) {
    return (
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
                                            {PLAN_LABEL[p.plan] || p.plan}
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
    );
}
