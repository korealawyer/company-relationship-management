'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Scale, Briefcase, CheckCircle2, TrendingUp, Calendar, Globe, Search
} from 'lucide-react';

import { LawCase, CaseStatus } from '@/types/cases';

const getCases = (companyName: string): LawCase[] => [];

import CourtSearchPanel from '@/components/cases/CourtSearchPanel';
import KpiCard from '@/components/cases/KpiCard';
import CaseList from '@/components/cases/CaseList';
import CaseDetailPanel from '@/components/cases/CaseDetailPanel';

export function CasesClient({ initialUser }: { initialUser: any }) {
    const [selectedCase, setSelectedCase] = useState<LawCase | null>(null);
    const [filterStatus, setFilterStatus] = useState<CaseStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const companyName = initialUser?.companyName || '(주)기업명';
    const CASES = getCases(companyName);

    const [courtSearchOpen, setCourtSearchOpen] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 8;

    const filtered = CASES.filter(c => {
        if (filterStatus !== 'all' && c.status !== filterStatus) return false;
        if (searchQuery && !c.title.includes(searchQuery) && !c.caseNumber.includes(searchQuery)) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery]);

    const activeCount = CASES.filter(c => c.status === 'active').length;
    const wonCount = CASES.filter(c => c.status === 'won').length;
    const totalAmount = '58억 4,100만원';

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ background: '#f8f7f4' }}>
            <div className="max-w-6xl mx-auto px-4">
                {/* 헤더 */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Scale className="w-5 h-5" style={{ color: '#c9a84c' }} />
                                <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>{companyName || '기업명'}</span>
                            </div>
                            <h1 className="text-2xl font-black" style={{ color: '#111827' }}>
                                소송 관리 <span style={{ color: '#c9a84c' }}>대시보드</span>
                            </h1>
                            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                                진행 중 {activeCount}건 · 총 {CASES.length}건 · 담당: 김수현·박준호 변호사
                            </p>
                        </div>
                        <button onClick={() => setCourtSearchOpen(!courtSearchOpen)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-md"
                            style={courtSearchOpen
                                ? { background: '#111827', color: '#fff' }
                                : { background: '#fff', color: '#111827', border: '1px solid #e8e5de' }
                            }>
                            <Globe className="w-4 h-4" style={{ color: courtSearchOpen ? '#c9a84c' : '#3b82f6' }} />
                            대법원 사건검색
                        </button>
                    </div>
                </motion.div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <KpiCard icon={Briefcase} label="진행 중 소송" value={activeCount} sub="변론기일 예정 2건" color="#3b82f6" />
                    <KpiCard icon={CheckCircle2} label="승소/합의" value={`${wonCount + 1}건`} sub="승소율 66.7%" color="#22c55e" />
                    <KpiCard icon={TrendingUp} label="청구/회수 총액" value={totalAmount} sub="확정 회수 8,700만원" color="#c9a84c" />
                    <KpiCard icon={Calendar} label="다음 기일" value="3/25" sub="행정법원 증인신문" color="#f59e0b" />
                </div>

                {/* 대법원 나의사건검색 패널 */}
                <CourtSearchPanel isOpen={courtSearchOpen} onClose={() => setCourtSearchOpen(false)} />

                {/* 필터 + 검색 */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="flex gap-1 p-1 rounded-xl flex-1" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        {([
                            { key: 'all', label: '전체' },
                            { key: 'active', label: '진행 중' },
                            { key: 'pending', label: '준비 중' },
                            { key: 'won', label: '승소' },
                            { key: 'settled', label: '합의' },
                        ] as { key: CaseStatus | 'all'; label: string }[]).map(f => (
                            <button key={f.key} onClick={() => setFilterStatus(f.key as CaseStatus | 'all')}
                                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                                style={filterStatus === f.key
                                    ? { background: '#111827', color: '#fff' }
                                    : { color: '#6b7280' }
                                }>
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                        <input
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="사건번호 · 사건명 검색"
                            className="pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none w-full sm:w-56"
                            style={{ background: '#fff', border: '1px solid #e8e5de', color: '#111827' }}
                        />
                    </div>
                </div>

                {/* 소송 리스트 + 디테일 */}
                <div className="grid lg:grid-cols-5 gap-5">
                    <CaseList 
                        paginated={paginated}
                        filteredCount={filtered.length}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={PAGE_SIZE}
                        selectedCase={selectedCase}
                        onSelectCase={setSelectedCase}
                        onPageChange={setCurrentPage}
                        isDetailViewActive={!!selectedCase}
                    />
                    <CaseDetailPanel selectedCase={selectedCase} />
                </div>
            </div>
        </div>
    );
}