'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Phone, PhoneOff, Building2, Headphones,
    Pause, Play, RefreshCw, X, Send
} from 'lucide-react';
import { Company, type CaseStatus } from '@/lib/types';
import { STATUS_COLOR, STATUS_TEXT, STATUS_LABEL } from '@/lib/constants';
import { type CallRecording } from '@/lib/callRecordingService';
import ScriptTab from './ScriptTab';
import InfoTab from './InfoTab';
import MemoTab from './MemoTab';
import { useAuth } from '@/lib/AuthContext';
import { supabaseCompanyStore } from '@/lib/supabaseStore';

/* ── shared constants (local copy until callPageUtils is extracted) ── */
const C = {
    bg: '#f8f9fc', surface: '#ffffff', card: '#ffffff', cardHover: '#f1f5f9',
    elevated: '#f8fafc', border: '#d1d5db', borderLight: '#e5e7eb',
    heading: '#0f172a', body: '#1e293b', sub: '#475569', muted: '#64748b', faint: '#94a3b8',
    accent: '#4f46e5', accentSoft: '#6366f1', green: '#059669', greenSoft: '#10b981',
    red: '#dc2626', amber: '#d97706', blue: '#2563eb', purple: '#7c3aed',
    cyan: '#0891b2', rowHover: '#f1f5f9',
};

function Badge({ status }: { status: CaseStatus }) {
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"
            style={{ background: STATUS_COLOR[status], color: STATUS_TEXT[status] }}
        >
            {STATUS_LABEL[status]}
        </span>
    );
}

/* ── useTimer return type helper ── */
type UseTimerReturn = {
    sec: number;
    fmt: string;
    running: boolean;
    start: () => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;
};

/* ── Props ── */
export interface InlinePanelProps {
    co: Company;
    isOnCall: boolean;
    onStartCall: () => void;
    onEndCall: () => void;
    onClose: () => void;
    onPass?: () => void;
    timer: UseTimerReturn;
    callResult: string;
    onCallResult: (r: 'connected' | 'no_answer' | 'callback' | 'rejected' | 'invalid_site') => void;
    onRefresh: () => void;
    setToast: (s: string) => void;
    isRecording: boolean;
    sttStatus: string;
    waveformData: number[];
    companyRecordings: CallRecording[];
}

/* ── Component ── */
export default function InlinePanel({
    co, isOnCall, onStartCall, onEndCall, onClose, onPass,
    timer, callResult, onCallResult, onRefresh, setToast,
    isRecording, sttStatus, waveformData, companyRecordings,
}: InlinePanelProps) {
    const { user } = useAuth();
    const [tab, setTab] = useState<'script' | 'info' | 'memo' | 'recordings'>('script');
    const [manualCaller, setManualCaller] = useState(user?.name || '영업담당자');
    const [localResult, setLocalResult] = useState<string | null>(null);

    // 메모 작성 관련 상태
    const authorName = user?.name || '알 수 없음';
    const [note, setNote] = useState('');
    const [savingMemo, setSavingMemo] = useState(false);
    const [memoRefreshTrigger, setMemoRefreshTrigger] = useState(0);

    const saveMemo = async () => {
        if (!note.trim() || savingMemo) return;
        setSavingMemo(true);
        try {
            const res = await fetch('/api/memos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: co.id,
                    author: authorName,
                    content: note.trim(),
                }),
            });
            if (res.ok) {
                setNote('');
                setToast('💾 메모 저장 및 요약 진행 중...');
                setMemoRefreshTrigger(prev => prev + 1);
                onRefresh();
            } else {
                const err = await res.json();
                setToast(`⚠️ 저장 실패: ${err.error}`);
            }
        } catch {
            setToast('⚠️ 저장 실패');
        } finally {
            setSavingMemo(false);
        }
    };

    useEffect(() => {
        if (user?.name && manualCaller === '영업담당자') {
            setManualCaller(user.name);
        }
    }, [user]);

    const handleManualLog = async (res: 'connected' | 'no_answer' | 'callback' | 'rejected' | 'invalid_site' | 'no_homepage' | 'promo_only' | 'no_policy', nextAction?: 'review' | 'memo' | 'alarm' | 'pass') => {
        try {
            setLocalResult(res);
            
            // --- 즉각적인 UI 반영 (Optimistic UI) ---
            co.lastCallResult = res as any;
            co.lastCallAt = new Date().toISOString();
            co.lastCalledBy = manualCaller;
            
            let extraUpdate: any = {};
            if (nextAction === 'review' && co.status === 'analyzed') {
                extraUpdate = { status: 'reviewing' };
                co.status = 'reviewing';
            } else if (res === 'rejected' || res === 'invalid_site' || res === 'no_homepage' || res === 'promo_only' || res === 'no_policy') {
                extraUpdate = { status: res };
                co.status = res as unknown as 'pending'; // Hack to satisfy TS temporarily, pessimistic UI will correct it if needed, or optimistic will use it directly.
            }
            
            // --- 백그라운드 DB 저장 (UI 딜레이 제거) ---
            supabaseCompanyStore.update(co.id, {
                lastCallResult: res,
                lastCallAt: co.lastCallAt,
                lastCalledBy: manualCaller,
                callAttempts: (co.callAttempts || 0) + 1,
                ...extraUpdate
            }).catch(e => {
                console.error('Manual log failed:', e);
                setToast('❌ 기록 저장 실패');
                setLocalResult(null); // 실패 시 원복
            });

            // --- 통화 내역(RecordingsTab)에도 수동 이력 추가 ---
            import('@/lib/callRecordingService').then(({ CallRecordingStore }) => {
                CallRecordingStore.save({
                    companyId: co.id,
                    companyName: co.name,
                    salesUserName: manualCaller,
                    fileSizeBytes: 0,
                    durationSeconds: 0,
                    transcript: `수동 상태 변경: ${res === 'connected' ? '연결됨' : res === 'no_answer' ? '부재중' : res === 'callback' ? '콜백요청' : res === 'rejected' ? '거절' : res === 'no_homepage' ? '홈페이지 없음' : res === 'promo_only' ? '홍보 전용' : res === 'no_policy' ? '동의서 없음' : '사이트 이상'}`,
                    transcriptSummary: '수동 통화 기록',
                    callResult: res as 'connected'|'no_answer'|'callback', // DB type may still need to be compatible, but keeping as res for now.
                    sttStatus: 'completed',
                    sttProvider: 'mock',
                    contactName: co.contactName || '',
                    contactPhone: co.contactPhone || co.phone,
                });
            });
            
            setToast(`✅ 수동 기록됨: ${res === 'connected' ? '연결됨' : res === 'no_answer' ? '부재중' : res === 'callback' ? '콜백' : res === 'rejected' ? '거절' : res === 'no_homepage' ? '홈페이지 없음' : res === 'promo_only' ? '홍보 전용' : res === 'no_policy' ? '동의서 없음' : '사이트 이상'}`);
            onRefresh(); // 부모 컴포넌트에 즉시 리렌더링 트리거
        } catch(e) {
            setToast('❌ 기록 처리 오류');
            setLocalResult(null);
        }
    };

    const handleResetCallData = async () => {
        if (!confirm('정말로 이 기업의 통화 기록(상태, 시도 횟수)을 초기화하시겠습니까?')) return;
        try {
            await supabaseCompanyStore.update(co.id, {
                lastCallResult: null,
                lastCallAt: null,
                lastCalledBy: null,
                callAttempts: 0,
            } as any);
            
            // UI optimistic update
            co.lastCallResult = undefined;
            co.lastCallAt = undefined;
            co.lastCalledBy = undefined;
            co.callAttempts = 0;
            
            setLocalResult(null);
            setToast('✅ 통화 기록이 초기화되었습니다.');
            onRefresh();
        } catch (e) {
            console.error('Reset log failed:', e);
            setToast('❌ 초기화 오류');
        }
    };

    const handleResultAction = (res: 'connected' | 'no_answer' | 'callback' | 'rejected' | 'invalid_site' | 'no_homepage' | 'promo_only' | 'no_policy', nextAction?: 'review' | 'memo' | 'alarm' | 'pass') => {
        // 1. 콜 이력 로깅
        if (isOnCall) {
            onCallResult(res as Parameters<typeof onCallResult>[0]);
        } else {
            handleManualLog(res, nextAction);
        }
        
        // 2. 후속 액션 진행 
        if (nextAction === 'memo') {
            setTab('memo');
        } else if (nextAction === 'review') {
            setToast('✅ 변호사 검토 요청이 접수되었습니다. (자동 메일 발송 준비)');
        } else if (nextAction === 'alarm') {
            setToast('⏰ 24시간 후 재연락 알람이 설정되었습니다.');
        } else if (nextAction === 'pass') {
            setToast('⏭️ 다음 기업으로 넘어갑니다.');
            if (onPass) onPass();
            else onClose();
        }
    };

    // Reset local result when company changes
    useEffect(() => { setLocalResult(null); }, [co.id]);

    // Reset tab when company changes
    useEffect(() => { setTab('script'); }, [co.id]);

    return (
        <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
        >
            <td colSpan={12} className="p-0">
                <div style={{
                    background: isOnCall ? '#f0fdf4' : '#f8fafc',
                    borderTop: `2px solid ${isOnCall ? '#059669' : '#4f46e5'}`,
                    borderBottom: `2px solid ${isOnCall ? '#a7f3d0' : '#c7d2fe'}`,
                }}>


                    {/* ── 통합 콘텐츠 대시보드 ── */}
                    <div className="px-5 py-4" style={{ maxHeight: 800, overflowY: 'auto', background: C.bg }}>
                        <div className="grid grid-cols-3 gap-6 items-stretch">
                            {/* Col 1: 스마트 기업 상세정보, 위험도, 주요 이슈 */}
                            <div className="flex flex-col gap-4 h-full min-w-0">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 shrink-0">
                                    <InfoTab co={co} onRefresh={onRefresh} setToast={setToast} />
                                </div>
                                
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 shrink-0">
                                    <p className="text-[10px] font-bold mb-1" style={{ color: C.heading }}>위험도</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${co.riskScore}%`,
                                                    background: co.riskScore >= 70 ? '#dc2626' : co.riskScore >= 40 ? '#d97706' : '#059669'
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-black" style={{ color: co.riskScore >= 70 ? '#dc2626' : co.riskScore >= 40 ? '#92400e' : '#065f46' }}>
                                            {co.riskScore}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 shrink-0">
                                    <h3 className="text-[10px] font-bold text-red-600 mb-2">🚨 발생 이슈</h3>
                                    {co.issues && co.issues.length > 0 ? (
                                        <div className="flex flex-col gap-2 mt-1">
                                            {co.issues.map((iss, j) => (
                                                <div key={j} className="flex items-start gap-2">
                                                    <span
                                                        className="inline-block flex-shrink-0 text-[8px] px-1.5 py-0.5 rounded font-bold text-center w-[56px] mt-[3px]"
                                                        style={{
                                                            background: iss.level === 'HIGH' ? '#fef2f2' : '#fffbeb',
                                                            color: iss.level === 'HIGH' ? '#dc2626' : '#92400e',
                                                        }}
                                                    >
                                                        {iss.level}
                                                    </span>
                                                    <span className="text-[11px] leading-relaxed break-words flex-1" style={{ color: C.body }}>
                                                        {iss.title}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500">발견된 이슈가 없습니다.</div>
                                    )}
                                </div>
                            </div>

                            {/* Col 2: 스크립트 & 통화 제어 (원래 Col 3) */}
                            <div className="flex flex-col gap-4 h-full min-w-0">

                                {/* 통화 제어 내역 및 수동 기록 */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col shrink-0 min-h-[150px]">
                                    <div className="flex flex-col gap-3 mb-3 border-b border-gray-100 pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-[11px] font-bold text-gray-800">🎙️ 통화 결과 ({companyRecordings.length})</h3>
                                                {user?.role === 'super_admin' && (
                                                    <button onClick={handleResetCallData}
                                                        className="px-1.5 py-0.5 rounded text-[10px] font-bold border bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                                        title="통화 상태 초기화"
                                                    >
                                                        <RefreshCw className="w-2.5 h-2.5 inline mr-0.5" />초기화
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!isOnCall ? (
                                                    <button onClick={onStartCall}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black hover:scale-105 transition-transform"
                                                        style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                                                        <Phone className="w-3 h-3" />통화 시작
                                                    </button>
                                                ) : <>
                                                    <button onClick={timer.running ? timer.pause : timer.resume}
                                                        className="p-1.5 rounded-lg"
                                                        style={{ background: '#f8f9fc', border: `1px solid ${C.borderLight}` }}>
                                                        {timer.running
                                                            ? <Pause className="w-3 h-3" style={{ color: C.sub }} />
                                                            : <Play className="w-3 h-3" style={{ color: '#059669' }} />}
                                                    </button>
                                                    <button onClick={onEndCall}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black animate-pulse"
                                                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                                        <PhoneOff className="w-3 h-3" />녹음 종료
                                                    </button>
                                                </>}
                                            </div>
                                        </div>

                                        {/* 연락 기록(수동/자동 겸용) */}
                                        <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100 gap-2">

                                            
                                            {/* 3단 분리 버튼 레이아웃 */}
                                            <div className="flex flex-col gap-1.5 mt-1">
                                                {/* 1열: 메일, 콜백 */}
                                                <div className="flex gap-1.5">
                                                    <button 
                                                        onClick={() => handleResultAction('connected', 'review')}
                                                        className={`flex-1 px-1 py-1 rounded text-[10px] font-bold transition-all border
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'connected' ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                                                    >
                                                        ✅ 메일 요청
                                                    </button>
                                                    <button 
                                                        onClick={() => handleResultAction('callback', 'alarm')}
                                                        className={`flex-1 px-1 py-1 rounded text-[10px] font-bold transition-all border
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'callback' ? 'bg-amber-600 text-white border-amber-700 shadow-sm' : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'}`}
                                                    >
                                                        🔄 콜백
                                                    </button>
                                                </div>

                                                {/* 2열: 거절, 부재 */}
                                                <div className="flex gap-1.5">
                                                    <button 
                                                        onClick={() => handleResultAction('rejected')}
                                                        className={`flex-1 px-1 py-1 rounded text-[10px] font-bold transition-all border
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'rejected' ? 'bg-slate-700 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                                                    >
                                                        ❌ 거절
                                                    </button>
                                                    <button 
                                                        onClick={() => handleResultAction('no_answer', 'alarm')}
                                                        className={`flex-1 px-1 py-1 rounded text-[10px] font-bold transition-all border
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'no_answer' ? 'bg-rose-600 text-white border-rose-700 shadow-sm' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'}`}
                                                    >
                                                        📵 부재(24h)
                                                    </button>
                                                </div>

                                                <div className="h-[1px] bg-slate-200/50 my-0.5"></div>

                                                {/* 3열: 사이트 문제 (패스) */}
                                                <div className="flex gap-1.5">
                                                    <button 
                                                        onClick={() => handleResultAction('no_homepage')}
                                                        className={`flex-1 px-0.5 py-1 rounded text-[10px] font-bold transition-all border
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'no_homepage' ? 'bg-gray-400 text-white border-gray-500 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                                    >
                                                        ⚠️ 홈페이지 없음
                                                    </button>
                                                    <button 
                                                        onClick={() => handleResultAction('promo_only')}
                                                        className={`flex-1 px-0.5 py-1 rounded text-[10px] font-bold transition-all border
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'promo_only' ? 'bg-gray-400 text-white border-gray-500 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                                    >
                                                        ⚠️ 홍보페이지만 있음
                                                    </button>
                                                    <button 
                                                        onClick={() => handleResultAction('no_policy')}
                                                        className={`flex-1 px-0.5 py-1 rounded text-[10px] font-bold transition-all border leading-tight flex items-center justify-center text-center
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'no_policy' ? 'bg-gray-400 text-white border-gray-500 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                                    >
                                                        <span>⚠️ 홈페이지 있음<br/>(방침 없음)</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── 메모 입력 (이동됨) ── */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 shrink-0">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">✍️ 메모 입력</h3>
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="새 메모를 입력하세요 (이슈 및 특이사항 등)"
                                            className="w-full rounded-xl text-[14px] p-3 font-medium leading-relaxed"
                                            style={{
                                                background: C.surface,
                                                border: `1px solid ${C.borderLight}`,
                                                color: C.body,
                                                outline: 'none',
                                                resize: 'none',
                                                minHeight: 80,
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                    e.preventDefault();
                                                    saveMemo();
                                                }
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={saveMemo}
                                                disabled={!note.trim() || savingMemo}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-opacity"
                                                style={{
                                                    background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                                                    opacity: (note.trim() && !savingMemo) ? 1 : 0.5,
                                                }}
                                            >
                                                <Send className="w-3.5 h-3.5" />{savingMemo ? '저장중...' : '메모 저장'}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-right mt-1" style={{ color: C.faint }}>
                                            Ctrl+Enter로 자동 저장 및 요약 진행
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col flex-1">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">📞 통화 스크립트</h3>
                                    <ScriptTab co={co} setToast={setToast} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 h-full min-w-0">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col flex-1">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">📝 메모&요약</h3>
                                    <MemoTab co={co} onRefresh={onRefresh} setToast={setToast} refreshTrigger={memoRefreshTrigger} />
                                </div>
                            </div>


                                                        </div>
                        </div>
                    </div>
            </td>
        </motion.tr>
    );
}
