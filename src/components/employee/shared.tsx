// @ts-nocheck
import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Clock, Eye, Mail, Star, FileText, Zap, Save, AlertTriangle, RotateCcw } from 'lucide-react';
import { Company, CaseStatus } from '@/lib/types';
import { STATUS_COLOR, STATUS_TEXT, STATUS_LABEL, LAWYERS } from '@/lib/constants';
import { useCompanies, useUsers } from '@/hooks/useDataLayer';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/Button';
import { getPromptConfig } from '@/lib/prompts/privacy';

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
    loading, refresh,
}: {
    c: Company; run: (k: string, fn: () => Promise<void> | void) => void;
    confirmingId: string | null; setConfirmingId: (v: string | null) => void;
    confirmRep: string; setConfirmRep: (v: string) => void;
    loading: string | null; refresh: () => void;
}) {
    const s = c.status;
    const selectStyle = { background: T.card, border: `1px solid ${T.border}`, color: T.body, borderRadius: 6, padding: '2px 6px', fontSize: 12 };
    const { updateCompany, mutate } = useCompanies();
    const { users } = useUsers();
    const lawyerList = users?.filter(u => u.role === 'lawyer').map(u => u.name);
    const finalLawyers = lawyerList && lawyerList.length > 0 ? lawyerList : LAWYERS;
    const [analyzing, setAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // 분석 실행 (run 래퍼 없이 독립 실행하여 경합 방지)
    const triggerAnalysis = async () => {
        if (analyzing) return;
        setErrorMsg(null);
        setAnalyzing(true);
        try {
            await updateCompany(c.id, { status: 'crawling' });
            await mutate(); // SWR 캐시 즉시 갱신

            const promptConfig = getPromptConfig();
            
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    companyId: c.id, 
                    url: c.privacyUrl, 
                    manualText: c.privacyPolicyText,
                    systemPrompt: promptConfig.analyzePrompt
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setErrorMsg(data.error || '알 수 없는 오류');
                await updateCompany(c.id, { status: 'pending' });
            } else {
                // 성공 시 상태 변환과 데이터(데모 포함) 업데이트
                const payload: any = { 
                    status: 'analyzed',
                    issues: data.issues || [],
                    issueCount: data.issueCount || 0,
                    riskLevel: data.riskLevel || 'MEDIUM'
                };
                if (data.rawText) {
                    payload.privacyPolicyText = data.rawText;
                }
                await updateCompany(c.id, payload);
            }
        } catch (err: any) {
            setErrorMsg(`분석 중 에러 발생: ${err.message}`);
            await updateCompany(c.id, { status: 'pending' });
        } finally {
            setAnalyzing(false);
            await mutate(); // 최종 상태 반영
        }
    };

    if (s === 'pending') {
        if (errorMsg) {
            return (
                <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-bold flex items-center" style={{ color: '#dc2626' }}>
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />크롤링 오류
                    </span>
                    <button
                        onClick={() => setErrorMsg(null)}
                        className="text-[10px] px-2 py-0.5 rounded font-bold transition-colors"
                        style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}
                    >
                        <RotateCcw className="w-3 h-3 inline mr-0.5" />초기화
                    </button>
                </div>
            );
        }
        return (
            <Button variant="premium" size="sm" onClick={triggerAnalysis} disabled={analyzing}>
                <Zap className="w-3.5 h-3.5 mr-1" />
                {analyzing ? '분석 요청 중...' : '법률 분석'}
            </Button>
        );
    }
    if (s === 'crawling') return (
        <div className="flex items-center gap-2">
            <span className="text-xs flex items-center gap-1 font-semibold" style={{ color: '#d97706' }}>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 분석 중...
            </span>
            <button
                onClick={async () => {
                    await updateCompany(c.id, { status: 'pending' });
                    await mutate();
                }}
                className="text-[10px] px-2 py-0.5 rounded font-bold"
                style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}
                title="분석이 멈춘 경우 상태를 초기화합니다"
            >
                <RotateCcw className="w-3 h-3 inline mr-0.5" />초기화
            </button>
        </div>
    );
    if (s === 'analyzed') return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => run(c.id, () => updateCompany(c.id, { status: 'reviewing', assignedLawyer: '공통' }))}
            disabled={loading === c.id}
        >
            공통 배정
        </Button>
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
    const { updateCompany, mutate } = useCompanies();
    const { user } = useAuth();
    const [privacyUrl, setPrivacyUrl] = useState(c.privacyUrl || '');
    const [privacyText, setPrivacyText] = useState(c.privacyPolicyText || '');
    const [callNote, setCallNote] = useState(c.callNote || '');
    const [clientReplyNote, setClientReplyNote] = useState(c.clientReplyNote || '');
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // 정보 저장만 (분석 트리거 없음)
    const handleSave = async () => {
        setSaving(true);
        try {
            await updateCompany(c.id, {
                privacyUrl,
                privacyPolicyText: privacyText,
                callNote,
                clientReplyNote,
            });
            await mutate();
        } catch (e: any) {
            alert(`저장 실패: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    // 분석 트리거 (별도 버튼)
    const handleAnalyze = async () => {
        if (analyzing) return;
        // 먼저 현재 폼 데이터 저장
        setErrorMsg(null);
        setAnalyzing(true);
        try {
            await updateCompany(c.id, {
                privacyUrl,
                privacyPolicyText: privacyText,
                callNote,
                clientReplyNote,
                status: 'crawling',
            });
            await mutate();

            const promptConfig = getPromptConfig();

            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    companyId: c.id, 
                    url: privacyUrl, 
                    manualText: privacyText,
                    systemPrompt: promptConfig.analyzePrompt
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setErrorMsg(data.error || '알 수 없는 오류');
                await updateCompany(c.id, { status: 'pending' });
            } else {
                // 성공 시 데이터베이스에 리스크/이슈 저장 (데모 모드 포함)
                const payload: any = { 
                    status: 'analyzed',
                    issues: data.issues || [],
                    issueCount: data.issueCount || 0,
                    riskLevel: data.riskLevel || 'MEDIUM'
                };
                if (data.rawText) {
                    payload.privacyPolicyText = data.rawText;
                    setPrivacyText(data.rawText); // 화면 즉시 업데이트
                }
                await updateCompany(c.id, payload);
            }
        } catch (e: any) {
            setErrorMsg(`분석 요청 실패: ${e.message}`);
            await updateCompany(c.id, { status: 'pending' });
        } finally {
            setAnalyzing(false);
            await mutate();
        }
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
                    <div className="grid grid-cols-2 gap-6">
                        
                        {/* 좌측 렌더링 영역: 기존 통화 기록 등 */}
                        <div className="col-span-2 md:col-span-1 space-y-4">
                            <div>
                                <label className="text-xs font-bold mb-1.5 flex items-center gap-1.5 block" style={{ color: '#475569' }}>📞 통화 메모</label>
                                <textarea
                                    value={callNote}
                                    onChange={e => setCallNote(e.target.value)}
                                    rows={4}
                                    placeholder="통화 내용 메모..."
                                    style={taStyle}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold mb-1.5 flex items-center gap-1.5 block" style={{ color: '#475569' }}>📩 클라이언트 답장</label>
                                <textarea
                                    value={clientReplyNote}
                                    onChange={e => setClientReplyNote(e.target.value)}
                                    rows={4}
                                    placeholder="클라이언트 답장 내용..."
                                    style={taStyle}
                                />
                            </div>
                        </div>

                        {/* 우측 렌더링 영역: 개인정보 처리방침 */}
                        <div className="col-span-2 md:col-span-1 space-y-4 border-slate-200 md:border-l md:pl-6">
                            <div>
                                <label className="text-xs font-bold mb-1.5 block flex items-center gap-1.5" style={{ color: T.sub }}>🔗 개인정보 처리방침 URL</label>
                                <input
                                    value={privacyUrl}
                                    onChange={e => setPrivacyUrl(e.target.value)}
                                    placeholder="https://example.com/privacy (없으면 비워두세요)"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold mb-1.5 block flex items-center gap-1.5" style={{ color: T.sub }}>📝 방침 원문 텍스트 (전문)</label>
                                <textarea
                                    value={privacyText}
                                    onChange={e => setPrivacyText(e.target.value)}
                                    placeholder="방침 전문 텍스트를 붙여넣으세요..."
                                    rows={8}
                                    style={taStyle}
                                />
                            </div>
                        </div>

                        {(user?.role === 'super_admin' || user?.role === 'admin') && (
                            <div className="col-span-2 mt-2 p-3 rounded-lg border" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                                <label className="text-xs font-black mb-1.5 block" style={{ color: '#dc2626' }}>🔧 상태 강제 변경 (Admin)</label>
                                <select
                                    value={c.status}
                                    onChange={async (e) => {
                                        await updateCompany(c.id, { status: e.target.value as CaseStatus });
                                        await mutate();
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

                        <div className="col-span-2 mt-1 flex gap-3">
                            {/* 1) 정보 저장 버튼 */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                style={{
                                    background: saving ? '#dcfce7' : '#eef2ff',
                                    color: saving ? '#16a34a' : '#4f46e5',
                                    border: `1px solid ${saving ? '#86efac' : '#c7d2fe'}`,
                                    opacity: saving ? 0.8 : 1
                                }}
                            >
                                <Save className="w-4 h-4" /> {saving ? '저장 완료 ✓' : '정보 저장'}
                            </button>
                            {/* 2) AI 분석 트리거 버튼 */}
                            {errorMsg && !analyzing ? (
                                <div className="flex-1 flex gap-2">
                                    <button
                                        onClick={handleAnalyze}
                                        className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}
                                    >
                                        <AlertTriangle className="w-4 h-4" /> 크롤링 오류 (재시도)
                                    </button>
                                    <button
                                        onClick={() => setErrorMsg(null)}
                                        className="px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors bg-white hover:bg-slate-50 border border-slate-300 shadow-sm text-slate-700"
                                    >
                                        <RotateCcw className="w-4 h-4" /> 초기화
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing || (!privacyUrl && !privacyText)}
                                    className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                    style={{
                                        background: analyzing ? '#fef3c7' : '#fffbeb',
                                        color: analyzing ? '#d97706' : '#b8960a',
                                        border: `1px solid ${analyzing ? '#fcd34d' : '#fde68a'}`,
                                        opacity: (analyzing || (!privacyUrl && !privacyText)) ? 0.6 : 1,
                                        cursor: (!privacyUrl && !privacyText) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {analyzing
                                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> AI 분석 진행 중...</>
                                        : <><Zap className="w-4 h-4" /> AI 법률 분석 실행</>
                                    }
                                </button>
                            )}
                        </div>
                        {errorMsg && (
                            <div className="col-span-2 flex items-center gap-2 text-[11px] px-4 py-3 rounded-lg font-medium" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                {errorMsg}
                            </div>
                        )}
                        {(!privacyUrl && !privacyText) && !errorMsg && (
                            <div className="col-span-2 flex items-center gap-2 text-[11px] px-3 py-2 rounded-lg" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                분석을 실행하려면 개인정보 처리방침 URL 또는 원문 텍스트를 먼저 입력해 주세요.
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
}
