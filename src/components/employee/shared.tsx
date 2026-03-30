// @ts-nocheck
import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Clock, Eye, Mail, Star, FileText, Zap, Save } from 'lucide-react';
import { Company, CaseStatus } from '@/lib/types';
import { STATUS_COLOR, STATUS_TEXT, STATUS_LABEL, LAWYERS } from '@/lib/constants';
import { useCompanies } from '@/hooks/useDataLayer';
import { useAuth } from '@/lib/AuthContext';
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
    const { updateCompany } = useCompanies();

    if (s === 'pending') return (
        <Button variant="premium" size="sm" onClick={() => run(c.id, () => updateCompany(c.id, { status: 'crawling' }))}>
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
                    <Button variant="premium" size="sm" onClick={() => run(c.id, () => { updateCompany(c.id, { status: 'reviewing', assignedLawyer: assignLawyer }); setAssigningId(null); })}>배정</Button>
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
            <Button variant="premium" size="sm" onClick={() => run(c.id, () => updateCompany(c.id, { status: 'emailed' }))} disabled={loading === c.id}>
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
        <Button variant="premium" size="sm" onClick={() => run(c.id, () => updateCompany(c.id, { status: 'contract_sent' }))} disabled={loading === c.id}>
            <FileText className="w-3.5 h-3.5 mr-1" />
            {loading === c.id ? '발송 중...' : '계약서 발송'}
        </Button>
    );
    if (s === 'contract_sent') return (
        <Button variant="outline" size="sm" onClick={() => run(c.id, () => updateCompany(c.id, { status: 'contract_signed', currentStage: '가입/온보딩' }))} disabled={loading === c.id}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {loading === c.id ? '처리 중...' : '서명 확인'}
        </Button>
    );
    if (s === 'contract_signed') return (
        <Button variant="premium" size="sm" onClick={() => run(c.id, () => updateCompany(c.id, { plan: 'standard' }))} disabled={loading === c.id}>
            <Star className="w-3.5 h-3.5 mr-1" />
            {loading === c.id ? '처리 중...' : '구독 확정'}
        </Button>
    );
    return <span className="text-xs font-medium" style={{ color: T.faint }}>—</span>;
}

export function ExpandedRow({ c, refresh }: { c: Company; refresh: () => void }) {
    const { updateCompany } = useCompanies();
    const { user } = useAuth();
    const [privacyUrl, setPrivacyUrl] = useState(c.privacyUrl || '');
    const [privacyText, setPrivacyText] = useState(c.privacyPolicyText || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await updateCompany(c.id, {
            privacyUrl,
            privacyPolicyText: privacyText,
        });
        refresh();
        setTimeout(() => setSaving(false), 500);
    };

    const inputStyle = {
        background: T.card, border: `1px solid ${T.border}`, color: T.body,
        outline: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, width: '100%'
    };
    const taStyle = { ...inputStyle, resize: 'none' as const, lineHeight: '1.6' };

    return (
        <tr>
            <td colSpan={11}>
                <div className="px-6 py-4" style={{ background: '#f8fafc', borderTop: `1px solid ${T.border}` }}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold mb-1.5 block" style={{ color: T.sub }}>🔗 개인정보 처리방침 URL</label>
                            <input
                                value={privacyUrl}
                                onChange={e => setPrivacyUrl(e.target.value)}
                                placeholder="https://example.com/privacy (없으면 비워두세요)"
                                style={inputStyle}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold mb-1.5 block" style={{ color: T.sub }}>📝 방침 원문 텍스트 (전문)</label>
                            <textarea
                                value={privacyText}
                                onChange={e => setPrivacyText(e.target.value)}
                                placeholder="방침 전문 텍스트를 붙여넣으세요..."
                                rows={8}
                                style={taStyle}
                            />
                        </div>

                        {(user?.role === 'super_admin' || user?.role === 'admin') && (
                            <div className="col-span-2 mt-2 p-3 rounded-lg border" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                                <label className="text-xs font-black mb-1.5 block" style={{ color: '#dc2626' }}>🔧 상태 강제 변경 (Admin)</label>
                                <select
                                    value={c.status}
                                    onChange={async (e) => {
                                        await updateCompany(c.id, { status: e.target.value as CaseStatus });
                                        refresh();
                                    }}
                                    className="w-full text-xs px-3 py-2 rounded-lg border outline-none font-bold bg-white"
                                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                                >
                                    {Object.entries(STATUS_LABEL).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="col-span-2 mt-1">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                style={{
                                    background: saving ? '#dcfce7' : '#eef2ff',
                                    color: saving ? '#16a34a' : '#4f46e5',
                                    border: `1px solid ${saving ? '#86efac' : '#c7d2fe'}`,
                                    opacity: saving ? 0.8 : 1
                                }}
                            >
                                <Save className="w-4 h-4" /> {saving ? '저장됨' : '정보 저장 및 자동 분석 봇 트리거'}
                            </button>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    );
}
