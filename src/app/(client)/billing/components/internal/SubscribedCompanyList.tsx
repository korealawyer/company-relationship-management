import React from 'react';
import { BadgeCheck, Wallet } from 'lucide-react';
import { Company } from '@/lib/types';
import { PLAN_LABEL, PLAN_PRICE, T } from '../../types';

interface SubscribedCompanyListProps {
    subscribedCompanies: Company[];
    onSelectCompany: (c: Company) => void;
}

export function SubscribedCompanyList({ subscribedCompanies, onSelectCompany }: SubscribedCompanyListProps) {
    return (
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
                            {subscribedCompanies.map((c: Company) => (
                                <tr key={c.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                                    style={{ borderBottom: `1px solid ${T.borderSub}` }}
                                    onClick={() => onSelectCompany(c)}>
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
    );
}
