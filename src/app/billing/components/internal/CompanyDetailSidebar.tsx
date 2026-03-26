import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Company } from '@/lib/store';
import { PaymentRecord, PLAN_LABEL, PLAN_PRICE, PAY_STATUS_STYLE, T } from '../../types';

interface CompanyDetailSidebarProps {
    selectedCompany: Company | null;
    setSelectedCompany: (company: Company | null) => void;
    payments: PaymentRecord[];
}

export default function CompanyDetailSidebar({
    selectedCompany,
    setSelectedCompany,
    payments,
}: CompanyDetailSidebarProps) {
    return (
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
                                        <p className="font-bold" style={{ color: T.heading }}>{PLAN_LABEL[selectedCompany.plan] || selectedCompany.plan}</p>
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
    );
}
