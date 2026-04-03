import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Company } from '@/lib/types';
import { PIPELINE, SALES_REPS, LAWYERS } from '@/lib/constants';
import { RiskBadge } from '@/components/crm/SlidePanel';
import { T, StatusBadge, StepCell, ActionButton, ExpandedRow } from './shared';

interface TableViewProps {
    filtered: Company[];
    refresh: () => void;
}

export default function TableView({ filtered, refresh }: TableViewProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [confirmRep, setConfirmRep] = useState(SALES_REPS[0]);
    const [loading, setLoading] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

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

    const handleSort = (title: string) => {
        if (title === '액션') return;
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === title && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key: title, direction });
    };

    const sortedData = useMemo(() => {
        let sortableItems = [...filtered];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof Company];
                let bValue: any = b[sortConfig.key as keyof Company];

                if (sortConfig.key === '위험도') {
                    const riskOrder: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
                    aValue = riskOrder[a.riskLevel as string] || 0;
                    bValue = riskOrder[b.riskLevel as string] || 0;
                } else if (sortConfig.key === '기업명') {
                    aValue = a.name;
                    bValue = b.name;
                } else if (sortConfig.key === '가맹점수') {
                    aValue = a.storeCount;
                    bValue = b.storeCount;
                } else if (sortConfig.key === '상태') {
                    aValue = PIPELINE.indexOf(a.status);
                    bValue = PIPELINE.indexOf(b.status);
                } else if (sortConfig.key === '법률분석') {
                    aValue = PIPELINE.indexOf(a.status) >= PIPELINE.indexOf('analyzed') ? 1 : 0;
                    bValue = PIPELINE.indexOf(b.status) >= PIPELINE.indexOf('analyzed') ? 1 : 0;
                } else if (sortConfig.key === '영업컨펌') {
                    aValue = a.salesConfirmed ? 1 : 0;
                    bValue = b.salesConfirmed ? 1 : 0;
                } else if (sortConfig.key === '변호사배정') {
                     aValue = a.assignedLawyer ? 1 : 0;
                     bValue = b.assignedLawyer ? 1 : 0;
                } else if (sortConfig.key === '변호사컨펌') {
                    aValue = a.lawyerConfirmed ? 1 : 0;
                    bValue = b.lawyerConfirmed ? 1 : 0;
                } else if (sortConfig.key === '이메일') {
                    aValue = a.emailSentAt ? 1 : 0;
                    bValue = b.emailSentAt ? 1 : 0;
                } else if (sortConfig.key === '답장') {
                    aValue = a.clientReplied ? 1 : 0;
                    bValue = b.clientReplied ? 1 : 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filtered, sortConfig]);

    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ background: '#f8f9fc', borderBottom: `2px solid ${T.border}` }}>
                            {['기업명', '위험도', '가맹점수', '상태', '법률분석', '영업컨펌', '변호사배정', '변호사컨펌', '이메일', '답장', '액션'].map(h => (
                                <th key={h} 
                                    className={`py-3 px-3 text-left text-xs font-black whitespace-nowrap tracking-wide ${h !== '액션' ? 'cursor-pointer select-none hover:bg-slate-100 transition-colors' : ''}`}
                                    style={{ color: '#b8960a' }}
                                    onClick={() => h !== '액션' && handleSort(h)}>
                                    <div className="flex items-center gap-1">
                                        {h}
                                        {h !== '액션' && (
                                            <div className="flex flex-col opacity-50 ml-0.5">
                                                <ChevronUp className={`w-2.5 h-2.5 -mb-1 ${sortConfig?.key === h && sortConfig.direction === 'asc' ? 'opacity-100 text-black' : 'opacity-30'}`} strokeWidth={3} />
                                                <ChevronDown className={`w-2.5 h-2.5 ${sortConfig?.key === h && sortConfig.direction === 'desc' ? 'opacity-100 text-black' : 'opacity-30'}`} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((c: Company) => (
                            <React.Fragment key={c.id}>
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
                                        <StepCell done={!!c.emailSentAt} label="발송완료" active={c.status === 'lawyer_confirmed'} />
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
                                <td colSpan={11} className="text-center py-16" style={{ color: T.faint }}>
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
