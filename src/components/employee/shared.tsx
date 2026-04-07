// @ts-nocheck
import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Clock, Eye, Mail, Star, FileText, Zap, Save, AlertTriangle, RotateCcw } from 'lucide-react';
import { Company, CaseStatus } from '@/lib/types';
import { STATUS_COLOR, STATUS_TEXT, STATUS_LABEL, LAWYERS } from '@/lib/constants';
import { useCompanies, useUsers } from '@/hooks/useDataLayer';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/Button';
import { getPromptConfig } from '@/lib/prompts/privacy';
import dataLayer from '@/lib/dataLayer';
import { mutate as globalMutate } from 'swr';

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

// ==========================================
// 공통 AI 통합 분석 함수
// ==========================================
export async function executeAiAnalysis({
    c, 
    updateCompany, 
    mutate, 
    setErrorMsg, 
    setAnalyzing,
    privacyUrl,
    privacyText,
    additionalPayload = {},
    onSuccess
}: {
    c: Company;
    updateCompany: any;
    mutate: any;
    setErrorMsg: (msg: string | null) => void;
    setAnalyzing: (val: boolean) => void;
    privacyUrl: string;
    privacyText: string;
    additionalPayload?: Partial<Company>;
    onSuccess?: (data: any) => void;
}) {
    setErrorMsg(null);
    setAnalyzing(true);

    // 클라이언트 fetch 타임아웃 — 서버 무응답 시 무한 대기 방지 (120초)
    const clientAbort = new AbortController();
    const clientTimeout = setTimeout(() => clientAbort.abort(), 120_000);

    try {
        await updateCompany(c.id, { 
            privacyUrl,
            privacyPolicyText: privacyText,
            ...additionalPayload,
            status: 'crawling' 
        });
        await mutate();

        const promptConfig = getPromptConfig();
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                companyId: c.id, 
                homepageUrl: c.url,
                privacyUrl: privacyUrl, 
                manualText: privacyText,
                systemPrompt: promptConfig.analyzePrompt,
                model: promptConfig.model
            }),
            signal: clientAbort.signal
        });

        // 서버 에러 응답(502, 504 등)일 때 JSON 파싱 실패 방어
        let data: any;
        try {
            data = await res.json();
        } catch {
            throw new Error(`서버 응답 파싱 실패 (HTTP ${res.status}). Vercel 서버 로그를 확인하세요.`);
        }
        
        if (!res.ok || !data.success) {
            setErrorMsg(data.error || '알 수 없는 오류');
            try { await updateCompany(c.id, { status: 'pending' }); } catch {}
            try {
                await dataLayer.auto.addLog({
                    type: 'ai_analysis',
                    label: '분석 실패',
                    companyName: c.name,
                    detail: data?.error || '알 수 없는 오류'
                });
            } catch {}
        } else {
            const payload: any = { 
                status: 'analyzed',
                issues: data.issues || [],
                issueCount: data.issueCount || 0,
                riskLevel: data.riskLevel || 'MEDIUM'
            };
            if (data.rawText) {
                payload.privacyPolicyText = data.rawText;
            }
            if (data.extractedDetails) {
                if (data.extractedDetails.businessNumber) payload.businessRegNumber = data.extractedDetails.businessNumber;
                if (data.extractedDetails.phoneNumber) payload.supportPhone = data.extractedDetails.phoneNumber;
                if (data.extractedDetails.privacyUrl) payload.privacyUrl = data.extractedDetails.privacyUrl;
            }
            await updateCompany(c.id, payload);
            try {
                await dataLayer.auto.addLog({
                    type: 'ai_analysis',
                    label: '분석 완료',
                    companyName: c.name,
                    detail: `발견된 이슈 ${data.issueCount || 0}건 (${data.riskLevel || 'MEDIUM'})`
                });
            } catch {}
            
            if (onSuccess) onSuccess(data);
        }
    } catch (err: any) {
        const isTimeout = err.name === 'AbortError';
        const msg = isTimeout 
            ? '서버 응답 시간 초과 (2분). 네트워크 상태를 확인하거나 잠시 후 재시도해 주세요.'
            : `분석 중 에러 발생: ${err.message}`;
        setErrorMsg(msg);
        try { await updateCompany(c.id, { status: 'pending' }); } catch {}
        try {
            await dataLayer.auto.addLog({
                type: 'ai_analysis',
                label: isTimeout ? '분석 시간 초과' : '분석 중단됨',
                companyName: c.name,
                detail: err.message || '네트워크 에러 발생'
            });
        } catch {}
    } finally {
        clearTimeout(clientTimeout);
        setAnalyzing(false);
        try { await mutate(); } catch {}
        globalMutate('auto-logs');
    }
}

export function ActionButton({
    c, run, confirmingId, setConfirmingId, confirmRep, setConfirmRep,
    loading, refresh, onRequireExpansion
}: {
    c: Company; run: (k: string, fn: () => Promise<void> | void) => void;
    confirmingId: string | null; setConfirmingId: (v: string | null) => void;
    confirmRep: string; setConfirmRep: (v: string) => void;
    loading: string | null; refresh: () => void;
    onRequireExpansion?: () => void;
}) {
    const s = c.status;
    const selectStyle = { background: T.card, border: `1px solid ${T.border}`, color: T.body, borderRadius: 6, padding: '2px 6px', fontSize: 12 };
    const { updateCompany, mutate } = useCompanies();
    const { users } = useUsers();
    const lawyerList = users?.filter(u => u.role === 'lawyer').map(u => u.name);
    const finalLawyers = lawyerList && lawyerList.length > 0 ? lawyerList : LAWYERS;
    const [analyzing, setAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // 공통 로직으로 추출된 분석 함수 호출
    const triggerAnalysis = async () => {
        if (analyzing) return;

        if (!c.privacyUrl && !c.privacyPolicyText) {
            alert('개인정보처리방침 URL이나 전문 텍스트를 기입해야 합니다. 상세 보기에서 직접 입력해주세요.');
            if (onRequireExpansion) onRequireExpansion();
            return;
        }

        await executeAiAnalysis({
            c,
            updateCompany,
            mutate,
            setErrorMsg,
            setAnalyzing,
            privacyUrl: c.privacyUrl || '',
            privacyText: c.privacyPolicyText || ''
        });
    };

    if (s === 'pending' || s === 'crawling') {
        if (s === 'pending' && errorMsg) {
            return (
                <div className="flex flex-col items-center gap-1.5">
                    <span 
                        className="text-[11px] font-bold flex text-center flex-col items-center max-w-[120px]" 
                        style={{ color: '#dc2626' }}
                        title={errorMsg}
                    >
                        <div className="flex items-center"><AlertTriangle className="w-3.5 h-3.5 mr-1" />분석 실패</div>
                        <span className="text-[9px] font-normal mt-0.5 truncate w-full" title={errorMsg}>{errorMsg}</span>
                    </span>
                    <button
                        onClick={() => setErrorMsg(null)}
                        className="text-[10px] px-2 py-0.5 rounded font-bold transition-colors w-full"
                        style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}
                    >
                        <RotateCcw className="w-3 h-3 inline mr-0.5" />초기화
                    </button>
                </div>
            );
        }
        
        const isAnalyzing = analyzing || s === 'crawling';
        
        return (
            <div className="flex flex-col items-center gap-1">
                <Button 
                    variant="premium" 
                    size="sm" 
                    onClick={triggerAnalysis} 
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? (
                        <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> 분석 중...</>
                    ) : (
                        <><Zap className="w-3.5 h-3.5 mr-1" /> 법률 분석</>
                    )}
                </Button>
                
                {/* crawling 상태가 너무 오래 지속될 경우 강제 초기화할 수 있는 작은 버튼 */}
                {s === 'crawling' && (
                    <button
                        onClick={async () => {
                            await updateCompany(c.id, { status: 'pending' });
                            await mutate();
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded font-medium mt-1 hover:underline"
                        style={{ color: T.faint }}
                        title="분석이 멈춘 경우 상태를 초기화합니다"
                    >
                        상태 강제 초기화
                    </button>
                )}
            </div>
        );
    }
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
    const [name, setName] = useState(c.name || '');
    const [url, setUrl] = useState(c.url || c.domain || '');
    const [biz, setBiz] = useState(c.biz || '');
    const [contactName, setContactName] = useState(c.contactName || '');
    const [contactPhone, setContactPhone] = useState(c.contactPhone || c.phone || '');
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
                name,
                url,
                biz,
                contactName,
                contactPhone,
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

    // 분석 트리거 (공통 로직 사용)
    const handleAnalyze = async () => {
        if (analyzing) return;
        await executeAiAnalysis({
            c,
            updateCompany,
            mutate,
            setErrorMsg,
            setAnalyzing,
            privacyUrl,
            privacyText,
            additionalPayload: {
                callNote,
                clientReplyNote,
                // 현재 ExpandedRow 폼의 기본 정보도 같이 저장하려면 여기서 추가할 수 있습니다.
            },
            onSuccess: (data) => {
                if (data.rawText) {
                    setPrivacyText(data.rawText); // 화면 즉시 업데이트
                }
            }
        });
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
                        
                        {/* 기업 기본 정보 영역 */}
                        <div className="col-span-2 space-y-4 pb-4 border-b border-slate-200">
                            <h4 className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
                                🏢 기업 상세 정보
                            </h4>
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block" style={{ color: T.sub }}>기업명</label>
                                    <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                                </div>
                                <div>
                                    <div className="flex items-end justify-between mb-1.5 h-[18px]">
                                        <label className="text-xs font-bold leading-none" style={{ color: T.sub }}>홈페이지</label>
                                        {url && (
                                            <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded transition-colors font-medium flex items-center justify-center leading-none h-[14px]" onClick={(e) => e.stopPropagation()}>
                                                접속하기 ↗
                                            </a>
                                        )}
                                    </div>
                                    <input value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block" style={{ color: T.sub }}>사업자번호</label>
                                    <input value={biz} onChange={e => setBiz(e.target.value)} style={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block" style={{ color: T.sub }}>담당자명</label>
                                    <input value={contactName} onChange={e => setContactName(e.target.value)} style={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block" style={{ color: T.sub }}>연락처</label>
                                    <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={inputStyle} />
                                </div>
                            </div>
                        </div>

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
                                <div className="flex items-end justify-between mb-1.5 h-[18px]">
                                    <label className="text-xs font-bold leading-none flex items-center gap-1.5" style={{ color: T.sub }}>🔗 개인정보 처리방침 URL</label>
                                    {privacyUrl && (
                                        <a href={privacyUrl.startsWith('http') ? privacyUrl : `https://${privacyUrl}`} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded transition-colors font-medium flex items-center justify-center leading-none h-[14px]" onClick={(e) => e.stopPropagation()}>
                                            접속하기 ↗
                                        </a>
                                    )}
                                </div>
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
                                className="flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
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
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAnalyze}
                                            className="flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}
                                        >
                                            <AlertTriangle className="w-4 h-4" /> 
                                            {errorMsg.includes('크롤링') ? '크롤링 오류 (재시도)' : errorMsg.includes('AI') ? 'AI 분석 오류 (재시도)' : '분석 오류 (재시도)'}
                                        </button>
                                        <button
                                            onClick={() => setErrorMsg(null)}
                                            className="px-4 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors bg-white hover:bg-slate-50 border border-slate-300 shadow-sm text-slate-700"
                                        >
                                            <RotateCcw className="w-4 h-4" /> 초기화
                                        </button>
                                    </div>
                                    <div className="text-[11px] font-medium p-2 rounded bg-red-50 text-red-600 border border-red-100">
                                        {errorMsg}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing || (!privacyUrl && !privacyText)}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
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
