import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Calendar, Scale } from 'lucide-react';
import { getDynamicStatus } from '@/constants/cases';

export type CaseStatus = 'active' | 'pending' | 'won' | 'settled' | 'closed';

export interface LawCase {
    id: string;
    caseNumber: string;
    title: string;
    type: string;
    status: CaseStatus;
    court: string;
    judge: string;
    lawyer: string;
    plaintiff: string;
    defendant: string;
    filedDate: string;
    nextDate: string | null;
    nextEvent: string | null;
    amount: string;
    description: string;
    progress: number;
    updates: { date: string; content: string }[];
}

export interface CaseListItemProps {
    c: LawCase;
    index: number;
    isSelected: boolean;
    onSelectCase: (c: LawCase | null) => void;
}

export const CaseListItem = React.memo(({ c, index, isSelected, onSelectCase }: CaseListItemProps) => {
    const s = useMemo(() => getDynamicStatus(c as any), [c]);
    const handleToggle = useCallback(() => {
        onSelectCase(isSelected ? null : c);
    }, [isSelected, c, onSelectCase]);

    return (
        <motion.button
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={handleToggle}
            className="w-full text-left p-5 rounded-2xl transition-all hover:shadow-md"
            style={{
                background: isSelected ? '#111827' : '#fff',
                border: `1px solid ${isSelected ? '#111827' : '#e8e5de'}`,
            }}>
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.twClass || ''}`}
                        style={{ ...(!s.twClass && { background: isSelected ? `${s.color}30` : s.bg, color: s.color }) }}>
                        {s.label}
                    </span>
                    <span className="text-[10px] font-mono"
                        style={{ color: isSelected ? '#9ca3af' : '#9ca3af' }}>
                        {c.caseNumber}
                    </span>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0"
                    style={{ color: isSelected ? '#9ca3af' : '#d1d5db' }} />
            </div>
            <p className="font-bold text-sm mb-1"
                style={{ color: isSelected ? '#fff' : '#111827' }}>
                {c.title}
            </p>
            <p className="text-xs mb-3"
                style={{ color: isSelected ? '#9ca3af' : '#6b7280' }}>
                {c.type} · {c.lawyer}
            </p>
            {/* 진행률 바 */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full"
                    style={{ background: isSelected ? 'rgba(255,255,255,0.1)' : '#f3f4f6' }}>
                    <div className="h-full rounded-full transition-all"
                        style={{
                            width: `${c.progress}%`,
                            background: c.status === 'won' ? '#22c55e' : c.status === 'settled' ? '#8b5cf6' : 'linear-gradient(90deg,#c9a84c,#e8c87a)',
                        }} />
                </div>
                <span className="text-[10px] font-bold"
                    style={{ color: isSelected ? '#c9a84c' : '#9ca3af' }}>
                    {c.progress}%
                </span>
            </div>
            {c.nextDate && (
                <div className="flex items-center gap-1.5 mt-3 text-[10px]"
                    style={{ color: isSelected ? '#fbbf24' : '#f59e0b' }}>
                    <Calendar className="w-3 h-3" />
                    다음 기일: {c.nextDate} ({c.nextEvent})
                </div>
            )}
        </motion.button>
    );
});
CaseListItem.displayName = 'CaseListItem';

export interface CaseListProps {
    paginated: LawCase[];
    filteredCount: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
    selectedCase: LawCase | null;
    onSelectCase: (c: LawCase | null) => void;
    onPageChange: (page: number) => void;
    isDetailViewActive?: boolean;
}

export const CaseList = React.memo(({
    paginated,
    filteredCount,
    currentPage,
    totalPages,
    pageSize,
    selectedCase,
    onSelectCase,
    onPageChange,
    isDetailViewActive = false
}: CaseListProps) => {
    return (
        <div className={`space-y-3 ${isDetailViewActive ? 'lg:col-span-2' : 'lg:col-span-5'}`}>
            {paginated.map((c, i) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                    <CaseListItem 
                        key={c.id} 
                        c={c} 
                        index={i} 
                        isSelected={isSelected} 
                        onSelectCase={onSelectCase} 
                    />
                );
            })}
            
            {filteredCount === 0 && (
                <div className="text-center py-16 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    <Scale className="w-10 h-10 mx-auto mb-3" style={{ color: '#d1d5db' }} />
                    <p className="text-sm font-bold" style={{ color: '#9ca3af' }}>검색 결과가 없습니다</p>
                </div>
            )}

            {/* 페이지네이션 */}
            {filteredCount > pageSize && (
                <div className="flex items-center justify-between pt-4 mt-2 px-1"
                    style={{ borderTop: '1px solid #e8e5de' }}>
                    <span className="text-xs" style={{ color: '#9ca3af' }}>
                        총 {filteredCount}건 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredCount)}건
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg transition-all disabled:opacity-30"
                            style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <ChevronLeft className="w-4 h-4" style={{ color: '#6b7280' }} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => onPageChange(p)}
                                className="w-9 h-9 rounded-lg text-xs font-bold transition-all"
                                style={currentPage === p
                                    ? { background: '#111827', color: '#fff' }
                                    : { background: '#fff', color: '#6b7280', border: '1px solid #e8e5de' }
                                }>
                                {p}
                            </button>
                        ))}
                        <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg transition-all disabled:opacity-30"
                            style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <ChevronRight className="w-4 h-4" style={{ color: '#6b7280' }} />
                        </button>
                    </div>
                    <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>
                        {currentPage} / {totalPages} 페이지
                    </span>
                </div>
            )}
        </div>
    );
});
CaseList.displayName = 'CaseList';

export default CaseList;
