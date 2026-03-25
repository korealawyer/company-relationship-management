import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Clock, Eye, Mail, Star, FileText, Zap } from 'lucide-react';
import { Company, CaseStatus, STATUS_COLOR, STATUS_TEXT, STATUS_LABEL, LAWYERS, store } from '@/lib/mockStore';
import { Button } from '@/components/ui/Button';

export const T = {
    heading: '#0f172a',
    body: '#1e293b',
    sub: '#475569',
    muted: '#64748b',
    faint: '#94a3b8',
    border: '#d1d5db',
    borderSub: '#e5e7eb',
    bg: '#f8f9fc',
    card: '#ffffff',
    rowHover: '#f1f5f9',
};

export function StatusBadge({ status }: { status: CaseStatus }) {
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
            style={{ background: STATUS_COLOR[status], color: STATUS_TEXT[status] }}>
            {status === 'crawling' && <RefreshCw className="w-3 h-3 animate-spin" />}
            {STATUS_LABEL[status]}
        </span>
    );
}

export function StepCell({ done, label, active }: { done: boolean; label: string; active?: boolean }) {
    if (done) return (
        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#16a34a' }}>
            <CheckCircle2 className="w-3 h-3" /> {label}
        </span>
    );
    if (active) return (
        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#d97706' }}>
            <Clock className="w-3 h-3 animate-pulse" /> {label}
        </span>
    );
    return <span className="text-[10px] font-medium" style={{ color: T.faint }}>—</span>;
}

export function ActionButton({
    c, run, confirmingId, setConfirmingId, confirmRep, setConfirmRep,
    assigningId, setAssigningId, assignLawyer, setAssignLawyer, loading, refresh,
}: {
    c: Company; run: (k: string, fn: () => void) => void;
    confirmingId: string | null; setConfirmingId: (v: string | null) => void;
    confirmRep: string; setConfirmRep: (v: string) => void;
    assigningId: string | null; setAssigningId: (v: string | null) => void;
    assignLawyer: string; setAssignLawyer: (v: string) => void;
    loading: string | null; refresh: () => void;
}) {
    const s = c.status;
    const selectStyle = { background: T.card, border: `1px solid ${T.border}`, color: T.body, borderRadius: 6, padding: '2px 6px', fontSize: 12 };

    if (s === 'pending') return (
        <Button variant="premium" size="sm" onClick={() => run(c.id, () => store.triggerAI(c.id))}>
            <Zap className="w-3.5 h-3.5 mr-1" /> 법률 분석
        </Button>
    );
    if (s === 'crawling') return (
        <span className="text-xs flex items-center gap-1 font-semibold" style={{ color: '#d97706' }}>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 분석 중...
        </span>
    );
    if (s === 'analyzed') return (
        <>
            {assigningId === c.id ? (
                <div className="flex items-center gap-1.5">
                    <select value={assignLawyer} onChange={e => setAssignLawyer(e.target.value)} style={selectStyle}>
                        {LAWYERS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <Button variant="premium" size="sm" onClick={() => run(c.id, () => { store.assignLawyer(c.id, assignLawyer); setAssigningId(null); })}>배정</Button>
                    <button onClick={() => setAssigningId(null)} className="text-xs font-bold" style={{ color: T.muted }}>✕</button>
                </div>
            ) : (
                <Button variant="outline" size="sm" onClick={() => setAssigningId(c.id)}>변호사 배정</Button>
            )}
        </>
    );
    if (s === 'assigned' || s === 'reviewing') return (
        <span className="text-xs flex items-center gap-1 font-semibold" style={{ color: '#d97706' }}>
            <Eye className="w-3.5 h-3.5" /> 변호사 검토 중
        </span>
    );
    if (s === 'lawyer_confirmed') return (
        <div className="flex items-center gap-1.5">
            <Button variant="premium" size="sm" onClick={() => run(c.id, () => store.sendEmail(c.id))} disabled={loading === c.id}>
                <Mail className="w-3.5 h-3.5 mr-1" />
                {loading === c.id ? '발송 중...' : '이메일 발송'}
            </Button>
            <button onClick={() => window.open(`/privacy-report?company=${encodeURIComponent(c.name)}`, '_blank')}
                className="text-[10px] font-bold px-2 py-1 rounded"
                style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                미리보기
            </button>
        </div>
    );
    if (s === 'emailed') return (
        <span className="text-xs flex items-center gap-1 font-semibold" style={{ color: '#16a34a' }}>
            <Mail className="w-3.5 h-3.5" /> 발송 완료
        </span>
    );
    if (s === 'client_replied' || s === 'client_viewed') return (
        <Button variant="premium" size="sm" onClick={() => run(c.id, () => store.sendContract(c.id, 'email'))} disabled={loading === c.id}>
            <FileText className="w-3.5 h-3.5 mr-1" />
            {loading === c.id ? '발송 중...' : '계약서 발송'}
        </Button>
    );
    if (s === 'contract_sent') return (
        <Button variant="outline" size="sm" onClick={() => run(c.id, () => store.signContract(c.id))} disabled={loading === c.id}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {loading === c.id ? '처리 중...' : '서명 확인'}
        </Button>
    );
    if (s === 'contract_signed') return (
        <Button variant="premium" size="sm" onClick={() => run(c.id, () => store.subscribe(c.id, 'standard'))} disabled={loading === c.id}>
            <Star className="w-3.5 h-3.5 mr-1" />
            {loading === c.id ? '처리 중...' : '구독 확정'}
        </Button>
    );
    return <span className="text-xs font-medium" style={{ color: T.faint }}>—</span>;
}

export function ExpandedRow({ c, refresh }: { c: Company; refresh: () => void }) {
    const [note, setNote] = useState(c.callNote);
    const [reply, setReply] = useState(c.clientReplyNote);
    const taStyle = { background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none', borderRadius: 8, padding: '8px 12px', resize: 'none' as const, fontSize: 12, lineHeight: '1.6', width: '100%' };

    return (
        <tr>
            <td colSpan={10}>
                <div className="px-6 py-4 grid grid-cols-2 gap-6"
                    style={{ background: '#f1f5f9', borderTop: `1px solid ${T.border}` }}>
                    <div>
                        <p className="text-xs font-bold mb-1.5" style={{ color: T.sub }}>📞 통화 메모</p>
                        <textarea value={note} onChange={e => setNote(e.target.value)}
                            onBlur={() => { store.update(c.id, { callNote: note }); refresh(); }}
                            rows={2} placeholder="통화 내용 메모..." style={taStyle} />
                    </div>
                    <div>
                        <p className="text-xs font-bold mb-1.5" style={{ color: T.sub }}>
                            📩 클라이언트 답장
                            {c.clientReplied && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#fce7f3', color: '#be185d' }}>답장 수신</span>}
                        </p>
                        <textarea value={reply} onChange={e => setReply(e.target.value)}
                            onBlur={() => { store.update(c.id, { clientReplyNote: reply }); refresh(); }}
                            rows={2} placeholder="클라이언트 답장 내용..." style={taStyle} />
                    </div>
                </div>
            </td>
        </tr>
    );
}
