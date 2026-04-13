import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Company, CaseStatus } from '@/lib/types';
import { PIPELINE, SALES_REPS, LAWYERS, STATUS_LABEL } from '@/lib/constants';
import { RiskBadge } from '@/components/crm/SlidePanel';
import { T, StatusBadge, StepCell, ActionButton, ExpandedRow } from './shared';

interface TableViewProps {
    filtered: Company[];
    refresh: () => void;
    sortBy: string;
    sortAsc: boolean;
    onSort: (key: string) => void;
    updateBulk?: (companiesList: Partial<Company>[]) => Promise<{ success: number; skipped: number }>;
    showToast?: (msg: string) => void;
}

export default function TableView({ filtered, refresh, sortBy, sortAsc, onSort, updateBulk, showToast }: TableViewProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [confirmRep, setConfirmRep] = useState(SALES_REPS[0]);
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const run = async (key: string, fn: () => Promise<void> | void) => {
        setLoading(key);
        try {
            await fn();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(null);
            refresh();
        }
    };

    const sortedData = filtered; // Sorting is now done server-side

    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            {selectedIds.length > 0 && updateBulk && (
                <div className="bg-blue-50/50 border-b border-blue-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3" style={{ background: '#eff6ff' }}>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black" style={{ color: '#1e3a8a' }}>
                            {selectedIds.length}개 선택됨
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select 
                            id="bulkStatusSelect"
                            className="px-2.5 py-1.5 text-xs font-bold rounded-lg border outline-none"
                            style={{ background: '#ffffff', borderColor: '#bfdbfe', color: '#1e3a8a' }}
                        >
                            <option value="">일괄 상태 변경...</option>
                            {Object.entries(STATUS_LABEL).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                        <button 
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                            style={{ background: '#2563eb', color: '#ffffff', boxShadow: '0 2px 8px rgba(37,99,235,0.2)' }}
                            disabled={loading === 'bulk'}
                            onClick={async () => {
                                const selectEl = document.getElementById('bulkStatusSelect') as HTMLSelectElement;
                                const newStatus = selectEl.value;
                                if (!newStatus) return alert('변경할 상태를 선택해주세요.');
                                
                                const updates = selectedIds.map(id => ({ id, status: newStatus as CaseStatus }));
                                setLoading('bulk');
                                try {
                                    await updateBulk(updates);
                                    setSelectedIds([]);
                                    if(showToast) showToast('선택한 항목의 상태가 일괄 변경되었습니다.');
                                } catch(e) {
                                    alert('상태 변경 중 오류가 발생했습니다.');
                                } finally {
                                    setLoading(null);
                                    refresh();
                                }
                            }}
                        >
                            {loading === 'bulk' ? '적용 중...' : '적용'}
                        </button>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ background: '#f8f9fc', borderBottom: `2px solid ${T.border}` }}>
                            <th className="py-3 px-3 text-center w-10">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    checked={sortedData.length > 0 && selectedIds.length === sortedData.length}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(sortedData.map(c => c.id));
                                        else setSelectedIds([]);
                                    }}
                                />
                            </th>
                            {['기업명', '위험도', '가맹점수', '상태', '법률분석', '영업컨펌', '변호사배정', '변호사컨펌', '이메일', '답장', '액션'].map(h => (
                                <th key={h} 
                                    className={`py-3 px-3 text-left text-xs font-black whitespace-nowrap tracking-wide ${h !== '액션' ? 'cursor-pointer select-none hover:bg-slate-100 transition-colors' : ''}`}
                                    style={{ color: '#b8960a' }}
                                    onClick={() => h !== '액션' && onSort(h)}>
                                    <div className="flex items-center gap-1">
                                        {h}
                                        {h !== '액션' && (
                                            <div className="flex flex-col opacity-50 ml-0.5">
                                                <ChevronUp className={`w-2.5 h-2.5 -mb-1 ${sortBy === h && sortAsc ? 'opacity-100 text-black' : 'opacity-30'}`} strokeWidth={3} />
                                                <ChevronDown className={`w-2.5 h-2.5 ${sortBy === h && !sortAsc ? 'opacity-100 text-black' : 'opacity-30'}`} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((c: Company, idx) => (
                            <React.Fragment key={c.id || idx}>
                                <tr
                                    className="transition-colors cursor-pointer"
                                    style={{ borderBottom: `1px solid ${T.borderSub}` }}
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.closest('button') || target.closest('a') || target.closest('select')) {
                                            return;
                                        }
                                        setExpandedId(expandedId === c.id ? null : c.id);
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = T.rowHover)}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                                    <td className="py-3.5 px-3 text-center w-10">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={selectedIds.includes(c.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedIds([...selectedIds, c.id]);
                                                else setSelectedIds(selectedIds.filter(id => id !== c.id));
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)} className="p-0.5 rounded hover:bg-slate-200 transition-colors">
                                                {expandedId === c.id
                                                    ? <ChevronUp className="w-3.5 h-3.5" style={{ color: T.muted }} />
                                                    : <ChevronDown className="w-3.5 h-3.5" style={{ color: T.muted }} />}
                                            </button>
                                            <div className="cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                                                <p className="font-bold text-xs hover:underline" style={{ color: T.body }}>{c.name}</p>
                                                <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>{c.bizType || c.biz}</p>
                                            </div>
                                            {c.source === 'crawler' && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>
                                                    자동수집
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="py-3.5 px-3"><RiskBadge level={c.riskLevel} /></td>
                                    <td className="py-3.5 px-3"><span className="text-xs font-black" style={{ color: T.body }}>{c.storeCount.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-3"><StatusBadge status={c.status} /></td>
                                    <td className="py-3.5 px-3">
                                        <StepCell done={PIPELINE.indexOf(c.status) >= PIPELINE.indexOf('analyzed')}
                                            label={`이슈 ${c.issues.length}건`} active={c.status === 'crawling'} />
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <StepCell done={c.salesConfirmed} label={c.salesConfirmedBy || '컨펌'} active={c.status === 'analyzed'} />
                                        {c.salesConfirmedAt && <p className="text-[9px] mt-0.5 font-medium" style={{ color: T.faint }}>{c.salesConfirmedAt}</p>}
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <StepCell done={!!c.assignedLawyer} label={c.assignedLawyer || '배정 대기'} active={c.status === 'analyzed'} />
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <StepCell done={c.lawyerConfirmed} label="컨펌 완료" active={['assigned', 'reviewing'].includes(c.status)} />
                                        {c.lawyerConfirmedAt && <p className="text-[9px] mt-0.5 font-medium" style={{ color: T.faint }}>{c.lawyerConfirmedAt}</p>}
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <StepCell done={!!c.emailSentAt} label="발송완료" active={['first_review_completed', 'lawyer_confirmed'].includes(c.status)} />
                                        {c.emailSentAt && <p className="text-[9px] mt-0.5 font-medium" style={{ color: T.faint }}>{c.emailSentAt}</p>}
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <StepCell done={c.clientReplied} label="답장 수신" active={c.status === 'emailed'} />
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <ActionButton c={c} run={run}
                                            confirmingId={confirmingId} setConfirmingId={setConfirmingId}
                                            confirmRep={confirmRep} setConfirmRep={setConfirmRep}
                                            loading={loading} refresh={refresh}
                                            onRequireExpansion={() => setExpandedId(c.id)} />
                                    </td>
                                </tr>
                                {expandedId === c.id && <ExpandedRow key={`exp-${c.id}`} c={c} refresh={refresh} />}
                            </React.Fragment>
                        ))}
                        {sortedData.length === 0 && (
                            <tr>
                                <td colSpan={12} className="text-center py-16" style={{ color: T.faint }}>
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="font-medium">검색 결과가 없습니다</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
