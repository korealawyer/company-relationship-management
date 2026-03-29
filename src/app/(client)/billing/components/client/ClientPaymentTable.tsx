import React from 'react';
import { Download, Receipt } from 'lucide-react';
import { T, PaymentRecord, PAY_STATUS_STYLE } from '../../types';

interface Props {
    setToast: (msg: string) => void;
    myPayments: PaymentRecord[];
}

export default function ClientPaymentTable({ setToast, myPayments }: Props) {
    return (
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
    );
}
