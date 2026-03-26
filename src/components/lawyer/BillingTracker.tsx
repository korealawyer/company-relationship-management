// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { type BillingRecord, SAMPLE_BILLING } from '@/lib/lawyerMockData';
import { exportToExcel } from '@/lib/exportUtils';

export default function BillingTracker() {
    const [records] = useState<BillingRecord[]>(SAMPLE_BILLING);
    const [filter, setFilter] = useState<'all' | '수임료' | '실비'>('all');

    const filtered = filter === 'all' ? records : records.filter(r => r.type === filter);
    const totalCharge = filtered.reduce((s, r) => s + r.chargeAmount + r.chargeVat, 0);
    const totalPaid = filtered.reduce((s, r) => s + r.paidAmount, 0);
    const totalUnpaid = filtered.reduce((s, r) => s + r.unpaidAmount, 0);

    const fmt = (n: number) => n.toLocaleString();

    const handleExportExcel = () => {
        if (filtered.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }
        exportToExcel(
            filtered,
            [
                { header: '청구일', key: r => r.date.slice(5) },
                { header: '의뢰인', key: 'clientName' },
                { header: '사건명', key: 'caseTitle' },
                { header: '상대방', key: 'opponent' },
                { header: '구분', key: 'type' },
                { header: '청구합계', key: r => r.chargeAmount + r.chargeVat },
                { header: '입금합계', key: 'paidAmount' },
                { header: '미수합계', key: 'unpaidAmount' },
            ],
            `청구및미수현황_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
        );
    };

    return (
        <div className="h-full overflow-y-auto p-4 sm:p-6" style={{ background: '#f8f9fc' }}>
            {/* 합계 요약 카드 (로탑 UX: 항상 상단 고정) */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                    { label: '청구합계', value: totalCharge, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                    { label: '입금합계', value: totalPaid, color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
                    { label: '미수합계', value: totalUnpaid, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
                ].map(c => (
                    <div key={c.label} className="p-3 sm:p-4 rounded-xl"
                        style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                        <p className="text-[10px] font-bold mb-1" style={{ color: c.color }}>{c.label}</p>
                        <p className="text-sm sm:text-lg font-black" style={{ color: c.color }}>{fmt(c.value)}원</p>
                    </div>
                ))}
            </div>

            {/* 필터 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                    {(['all', '수임료', '실비'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className="text-xs px-3 py-1.5 rounded-xl font-bold"
                            style={{
                                background: filter === f ? '#1e293b' : '#ffffff',
                                color: filter === f ? '#ffffff' : '#64748b',
                                border: `1px solid ${filter === f ? '#1e293b' : '#e2e8f0'}`,
                            }}>{f === 'all' ? '전체' : f}</button>
                    ))}
                </div>
                <button onClick={handleExportExcel} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold transition-transform hover:scale-105"
                    style={{ background: '#ffffff', color: '#16a34a', border: '1px solid #86efac' }}>
                    📊 엑셀
                </button>
            </div>

            {/* 청구 목록 */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                {/* 헤더 */}
                <div className="hidden sm:grid px-4 py-2.5 text-[10px] font-bold"
                    style={{ gridTemplateColumns: '90px 1fr 80px 100px 100px 100px', borderBottom: '1px solid #f1f5f9', background: '#f8f9fc', color: '#64748b' }}>
                    <span>청구일</span><span>의뢰인 / 사건</span><span>구분</span><span>청구합계</span><span>입금합계</span><span>미수합계</span>
                </div>
                <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                    {filtered.map(r => (
                        <div key={r.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                            {/* 데스크탑 그리드 */}
                            <div className="hidden sm:grid items-center"
                                style={{ gridTemplateColumns: '90px 1fr 80px 100px 100px 100px' }}>
                                <span className="text-xs" style={{ color: '#64748b' }}>{r.date.slice(5)}</span>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{r.clientName}</p>
                                    <p className="text-[10px]" style={{ color: '#94a3b8' }}>{r.caseTitle} / vs {r.opponent}</p>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold w-fit"
                                    style={{ background: r.type === '수임료' ? '#eff6ff' : '#f0fdf4', color: r.type === '수임료' ? '#2563eb' : '#16a34a' }}>
                                    {r.type}
                                </span>
                                <span className="text-sm font-bold" style={{ color: '#374151' }}>{fmt(r.chargeAmount + r.chargeVat)}</span>
                                <span className="text-sm font-bold" style={{ color: '#16a34a' }}>{fmt(r.paidAmount)}</span>
                                <span className="text-sm font-black" style={{ color: r.unpaidAmount > 0 ? '#dc2626' : '#94a3b8' }}>
                                    {r.unpaidAmount > 0 ? fmt(r.unpaidAmount) : '완납'}
                                </span>
                            </div>
                            {/* 모바일 카드 */}
                            <div className="sm:hidden">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                            style={{ background: r.type === '수임료' ? '#eff6ff' : '#f0fdf4', color: r.type === '수임료' ? '#2563eb' : '#16a34a' }}>{r.type}</span>
                                        <span className="text-xs font-bold" style={{ color: '#1e293b' }}>{r.clientName}</span>
                                    </div>
                                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>{r.date.slice(5)}</span>
                                </div>
                                <p className="text-[10px] mb-2" style={{ color: '#94a3b8' }}>{r.caseTitle}</p>
                                <div className="flex gap-3">
                                    <div><p className="text-[10px]" style={{ color: '#64748b' }}>청구</p><p className="text-xs font-bold" style={{ color: '#374151' }}>{fmt(r.chargeAmount + r.chargeVat)}</p></div>
                                    <div><p className="text-[10px]" style={{ color: '#64748b' }}>입금</p><p className="text-xs font-bold" style={{ color: '#16a34a' }}>{fmt(r.paidAmount)}</p></div>
                                    <div><p className="text-[10px]" style={{ color: '#64748b' }}>미수</p><p className="text-xs font-black" style={{ color: r.unpaidAmount > 0 ? '#dc2626' : '#94a3b8' }}>{r.unpaidAmount > 0 ? fmt(r.unpaidAmount) : '완납'}</p></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
