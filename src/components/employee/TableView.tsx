import React, { useState } from 'react';
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

    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ background: '#f8f9fc', borderBottom: `2px solid ${T.border}` }}>
                            {['기업명', '위험도', '가맹점수', '상태', '법률분석', '영업컨펌', '변호사배정', '변호사컨펌', '이메일', '답장', '액션'].map(h => (
                                <th key={h} className="py-3 px-3 text-left text-xs font-black whitespace-nowrap tracking-wide"
                                    style={{ color: '#b8960a' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((c: Company) => (
                            <React.Fragment key={c.id}>
                                <tr
                                    className="transition-colors"
                                    style={{ borderBottom: `1px solid ${T.borderSub}` }}
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
                                            loading={loading} refresh={refresh} />
                                    </td>
                                </tr>
                                {expandedId === c.id && <ExpandedRow key={`exp-${c.id}`} c={c} refresh={refresh} />}
                            </React.Fragment>
                        ))}
                        {filtered.length === 0 && (
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
