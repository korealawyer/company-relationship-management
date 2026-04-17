// @ts-nocheck
'use client';
import React from 'react';
import Link from 'next/link';
import { Mail, FileText, CheckCircle2, ExternalLink, Search, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import { Company, type CaseStatus } from '@/lib/types';
import { useCompanies } from '@/hooks/useDataLayer';
import { executeAiAnalysis } from '@/components/employee/shared';
import { useAuth } from '@/lib/AuthContext';
import { STATUS_LABEL } from '@/lib/constants';

/* ── CRM 라이트 색상 (공유 상수 추출 전 임시 로컬 복사) ─────── */
const C = {
    surface: '#ffffff',
    border: '#d1d5db',
    borderLight: '#e5e7eb',
    heading: '#0f172a',
    body: '#1e293b',
    sub: '#475569',
    faint: '#94a3b8',
};

import EditableField from '@/components/crm/EditableField';

/* ── Props ───────────────────────────────────────────────── */
export interface InfoTabProps {
    co: Company;
    onRefresh: () => void;
    setToast: (s: string) => void;
}

/* ── Component ───────────────────────────────────────────── */
export default function InfoTab({ co, onRefresh, setToast }: InfoTabProps) {
    const { updateCompany, mutate } = useCompanies();
    const { user } = useAuth();
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
    const adminOrSales = isAdmin || user?.role === 'sales';
    const [analyzing, setAnalyzing] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

    // 1500ms Batch Debounce & Unmount Flush Queue 전략
    const [pendingChanges, setPendingChanges] = React.useState<Record<string, any>>({});
    const pendingChangesRef = React.useRef(pendingChanges);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        pendingChangesRef.current = pendingChanges;
    }, [pendingChanges]);

    const flushQueue = async () => {
        const changes = { ...pendingChangesRef.current };
        if (Object.keys(changes).length === 0) return;
        
        // 플러시 중임을 큐에서 제거
        pendingChangesRef.current = {};
        setPendingChanges({});
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        try {
            // SWR Local Mutate (Bandwidth 절약, Echo Loop 회피를 위해 revalidate: false 적용)
            const newCo = { ...co, ...changes };
            mutate('companies-cache-key', (currentData: any) => {
                // 이 부분은 useDataLayer의 구현에 따라 다름. updateCompany 내부에 mutate가 있다면 그걸 씀.
                if (!currentData?.data) return currentData;
                return {
                    ...currentData,
                    data: currentData.data.map((c: any) => c.id === co.id ? newCo : c)
                };
            }, { revalidate: false });

            // DB Patch Fire-and-forget (try-catch로 감싸서 실패시 에러 띄움)
            await updateCompany(co.id, changes);
            
            // onRefresh(mutate) 제거 (Echo 루프 방지 및 서버 과부하 방지)
        } catch (e) {
            setToast('일부 변경사항 저장에 실패했습니다.');
            // 실패 시 롤백 로직이 SWR 글로벌에 들어있어야 하지만, 여기선 강제 리프레시로 복구
            onRefresh();
        }
    };

    React.useEffect(() => {
        if (Object.keys(pendingChanges).length > 0) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                flushQueue();
            }, 1500);
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [pendingChanges]);

    // Unmount (가비지 컬렉션) 시 무조건 배출 - App Router 환경
    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (Object.keys(pendingChangesRef.current).length > 0) {
                flushQueue();
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            flushQueue();
        };
    }, []);

    const handleAnalyze = async () => {
        if (analyzing) return;
        await executeAiAnalysis({
            c: co,
            updateCompany,
            mutate,
            setErrorMsg,
            setAnalyzing,
            privacyUrl: co.privacyUrl || '',
            privacyText: co.privacyPolicyText || '',
            onSuccess: () => {
                setToast('AI 분석이 완료되었습니다.');
                onRefresh();
            }
        });
    };

    return (
        <div className="flex flex-col gap-3">
            {/* ── 기업 정보 ── */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <p className="text-[14px] font-black" style={{ color: C.heading }}>📋 기업 정보 (클릭하여 수정)</p>
                    <div className="flex items-center gap-2">
                        {co.name && (
                            <a href={`https://search.naver.com/search.naver?query=${encodeURIComponent(co.name + ' 사이트')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[12px] font-bold text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded-lg">
                                <Search className="w-3.5 h-3.5" title="기업명 검색" /> 네이버 검색
                            </a>
                        )}
                        {(co.domain || co.url) && (
                            <a href={(co.domain || co.url).startsWith('http') ? (co.domain || co.url) : `http://${co.domain || co.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[12px] font-bold text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                                <ExternalLink className="w-3.5 h-3.5" title="홈페이지 바로가기" /> 홈페이지로 이동
                            </a>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        // 핵심 3개 필드(name, biz, assignedLawyer)만 isAdmin 체크 유지, 나머지 전부 adminOrSales 오픈.
                        { l: '기업명', v: co.name || '', field: isAdmin ? 'name' : undefined, placeholder: '기업명' },
                        { l: '사업자', v: co.biz || '', field: isAdmin ? 'biz' : undefined, placeholder: '사업자번호' },
                        { l: '대표', v: co.ceo || '', field: adminOrSales ? 'ceo' : undefined, placeholder: '대표명' },
                        { l: '담당자', v: co.contactName || '', field: adminOrSales ? 'contactName' : undefined, placeholder: '이름 입력' },
                        { l: '이메일', v: co.contactEmail || co.email || '', field: adminOrSales ? 'contactEmail' : undefined, placeholder: '이메일 입력' },
                        { l: '전화', v: co.contactPhone || co.phone || '', field: adminOrSales ? 'contactPhone' : undefined, placeholder: '전화번호 입력' },
                        { l: '홈페이지', v: co.domain || co.url || '', field: adminOrSales ? 'domain' : undefined, placeholder: '홈페이지 주소', isUrl: true },
                        { l: '매장수', v: String(co.storeCount || 0), field: adminOrSales ? 'storeCount' : undefined, placeholder: '매장수', isNumber: true },
                        { l: '업종', v: co.bizType || '', field: adminOrSales ? 'bizType' : undefined, placeholder: '업종명' },
                        { l: '변호사', v: co.assignedLawyer || '', field: isAdmin ? 'assignedLawyer' : undefined, placeholder: '미배정' },
                        { l: '개인정보 URL', v: co.privacyUrl || '', field: adminOrSales ? 'privacyUrl' : undefined, placeholder: '방침 URL', isUrl: true },
                        { l: '개인정보 전문', v: co.privacyPolicyText || '', field: adminOrSales ? 'privacyPolicyText' : undefined, placeholder: '전문 내역 복사본' },
                    ].map((i) => {
                        // 현재 입력창에 띄울 값(Debounce 중첩 감안)
                        const displayVal = (i.field && pendingChanges[i.field] !== undefined) 
                            ? pendingChanges[i.field] 
                            : i.v;

                        return (
                        <div
                            key={i.l}
                            className="px-2.5 py-2 rounded-lg min-w-0"
                            style={{ background: C.surface, border: `1px solid ${C.borderLight}` }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="text-[11px] font-bold" style={{ color: C.faint }}>{i.l}</div>
                                {i.isUrl && i.v && (
                                    <a href={(i.v as string).startsWith('http') ? (i.v as string) : `http://${i.v}`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-3.5 h-3.5 text-blue-500 hover:text-blue-700" title="홈페이지 바로가기" />
                                    </a>
                                )}
                            </div>
                            <div className="text-[13px] font-medium truncate" style={{ color: i.field ? '#2563eb' : C.body }}>
                                {i.field ? (
                                    <EditableField 
                                        value={String(displayVal)} 
                                        onChange={async v => {
                                            const finalV = i.isNumber ? (parseInt(v, 10) || 0) : v;
                                            setPendingChanges(prev => ({
                                                ...prev,
                                                [i.field as string]: finalV
                                            }));
                                            // EditableField의 loading/success 상태를 위해 일단 immediately resolve.
                                            return Promise.resolve();
                                        }}
                                        placeholder={i.placeholder}
                                    />
                                ) : (
                                    String(displayVal) || '—'
                                )}
                            </div>
                        </div>
                    )})}
                </div>

                {/* ── 어드민: 상태값 강제 변경 ── */}
                {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-red-100 justify-end">
                        <p className="text-[12px] font-black" style={{ color: '#dc2626' }}>🔧 상태 강제 변경 (Admin)</p>
                        <select
                            value={co.status}
                            onChange={(e) => {
                                updateCompany(co.id, { status: e.target.value as CaseStatus });
                                onRefresh();
                                setToast('슈퍼 관리자 권한으로 상태가 변경되었습니다.');
                            }}
                            className="text-[12px] px-2 py-1.5 rounded-lg border outline-none font-bold min-w-[120px]"
                            style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}
                        >
                            {Object.entries(STATUS_LABEL).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* ── 어드민: 개인정보 재분석 ── */}
                {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-blue-100 items-end">
                        <div className="flex items-center gap-2">
                            <p className="text-[12px] font-black" style={{ color: '#2563eb' }}>⚡ 개인정보처리방침 강제 재분석 (Super Admin)</p>
                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing || (!co.privacyUrl && !co.privacyPolicyText)}
                                className="text-[12px] px-3 py-1.5 rounded-lg border outline-none font-bold min-w-[120px] transition-colors flex items-center justify-center gap-1.5"
                                style={{ 
                                    background: analyzing ? '#dbeafe' : '#eff6ff', 
                                    borderColor: analyzing ? '#bfdbfe' : '#dbeafe', 
                                    color: analyzing ? '#3b82f6' : '#2563eb',
                                    opacity: (!co.privacyUrl && !co.privacyPolicyText) ? 0.5 : 1,
                                    cursor: (!co.privacyUrl && !co.privacyPolicyText) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {analyzing ? (
                                    <><RefreshCw className="w-3.5 h-3.5 animate-spin"/> 분석 중...</>
                                ) : (
                                    <><Zap className="w-3.5 h-3.5"/> 재분석 실행</>
                                )}
                            </button>
                        </div>
                        {errorMsg && (
                            <div className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {errorMsg}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
