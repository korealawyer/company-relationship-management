'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Phone, PhoneOff, Building2, Headphones,
    Pause, Play, RefreshCw, X,
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
    timer: UseTimerReturn;
    callResult: string;
    onCallResult: (r: 'connected' | 'no_answer' | 'callback') => void;
    onRefresh: () => void;
    setToast: (s: string) => void;
    isRecording: boolean;
    sttStatus: string;
    waveformData: number[];
    companyRecordings: CallRecording[];
}

/* ── Component ── */
export default function InlinePanel({
    co, isOnCall, onStartCall, onEndCall, onClose,
    timer, callResult, onCallResult, onRefresh, setToast,
    isRecording, sttStatus, waveformData, companyRecordings,
}: InlinePanelProps) {
    const { user } = useAuth();
    const [tab, setTab] = useState<'script' | 'info' | 'memo' | 'recordings'>('script');
    const [manualCaller, setManualCaller] = useState(user?.name || '영업담당자');
    const [localResult, setLocalResult] = useState<string | null>(null);

    useEffect(() => {
        if (user?.name && manualCaller === '영업담당자') {
            setManualCaller(user.name);
        }
    }, [user]);

    const handleManualLog = async (res: 'connected' | 'no_answer' | 'callback') => {
        try {
            setLocalResult(res);
            
            // --- 즉각적인 UI 반영 (Optimistic UI) ---
            co.lastCallResult = res;
            co.lastCallAt = new Date().toISOString();
            co.lastCalledBy = manualCaller;
            
            // --- 백그라운드 DB 저장 (UI 딜레이 제거) ---
            supabaseCompanyStore.update(co.id, {
                lastCallResult: res,
                lastCallAt: co.lastCallAt,
                lastCalledBy: manualCaller,
                callAttempts: (co.callAttempts || 0) + 1,
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
                    transcript: `수동 상태 변경: ${res === 'connected' ? '연결됨' : res === 'no_answer' ? '부재중' : '콜백요청'}`,
                    transcriptSummary: '수동 통화 기록',
                    callResult: res,
                    sttStatus: 'completed',
                    sttProvider: 'mock',
                    contactName: co.contactName || '',
                    contactPhone: co.contactPhone || co.phone,
                });
            });
            
            setToast(`✅ 수동 기록됨: ${res === 'connected' ? '연결됨' : res === 'no_answer' ? '부재중' : '콜백'}`);
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

    const handleResultAction = (res: 'connected' | 'no_answer' | 'callback', nextAction?: 'review' | 'memo') => {
        // 1. 콜 이력 로깅
        if (isOnCall) {
            onCallResult(res);
        } else {
            handleManualLog(res);
        }
        
        // 2. 후속 액션 진행 
        if (nextAction === 'memo') {
            setTab('memo');
        } else if (nextAction === 'review') {
            setToast('✅ 변호사 검토 요청이 접수되었습니다. (API 연동 준비중)');
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
                            <div className="flex flex-col gap-4 h-full">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 shrink-0">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">📊 스마트 기업 상세정보</h3>
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
                                        <div className="grid grid-cols-[56px_1fr] gap-x-2 gap-y-2 items-start mt-1">
                                            {co.issues.map((iss, j) => (
                                                <React.Fragment key={j}>
                                                    <div className="text-center pt-[1px]">
                                                        <span
                                                            className="inline-block text-[8px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap w-full"
                                                            style={{
                                                                background: iss.level === 'HIGH' ? '#fef2f2' : '#fffbeb',
                                                                color: iss.level === 'HIGH' ? '#dc2626' : '#92400e',
                                                            }}
                                                        >
                                                            {iss.level}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] leading-relaxed" style={{ color: C.body }}>
                                                        {iss.title}
                                                    </span>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500">발견된 이슈가 없습니다.</div>
                                    )}
                                </div>
                            </div>

                            {/* Col 2: 메모 & AI 분석 */}
                            <div className="flex flex-col gap-4 h-full">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col flex-1">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">📝 메모&요약</h3>
                                    <MemoTab co={co} onRefresh={onRefresh} setToast={setToast} />
                                </div>
                            </div>

                            {/* Col 3: 스크립트 & 통화 제어 */}
                            <div className="flex flex-col gap-4 h-full">

                                {/* 통화 제어 내역 및 수동 기록 */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col shrink-0 min-h-[150px]">
                                    <div className="flex flex-col gap-3 mb-3 border-b border-gray-100 pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-[11px] font-bold text-gray-800">🎙️ 통화 제어 ({companyRecordings.length})</h3>
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
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-500">담당자:</span>
                                                <input 
                                                    value={manualCaller} 
                                                    onChange={e => setManualCaller(e.target.value)}
                                                    className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 w-[80px] bg-white text-slate-700 outline-none focus:border-indigo-400"
                                                />
                                            </div>
                                            
                                            {/* 5버튼 레이아웃 */}
                                            <div className="flex flex-col gap-1.5 mt-1">
                                                <div className="flex gap-1.5">
                                                    <button 
                                                        onClick={() => handleResultAction('connected')}
                                                        className={`flex-1 px-1 py-1 rounded text-[10px] font-bold transition-all border
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'connected' ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                                                    >
                                                        ✅ 연결
                                                    </button>
                                                    <button 
                                                        onClick={() => handleResultAction('connected', 'review')}
                                                        className={`flex-1 px-1 py-1 rounded text-[10px] font-bold transition-all border
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'connected' ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                                                    >
                                                        📄 연결(검토)
                                                    </button>
                                                    <button 
                                                        onClick={() => handleResultAction('connected', 'memo')}
                                                        className={`flex-1 px-1 py-1 rounded text-[10px] font-bold transition-all border
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'connected' ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                                                    >
                                                        📝 연결(메모)
                                                    </button>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button 
                                                        onClick={() => handleResultAction('no_answer', 'memo')}
                                                        className={`flex-1 px-1 py-1 rounded text-[10px] font-bold transition-all border
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'no_answer' ? 'bg-rose-600 text-white border-rose-700 shadow-sm' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'}`}
                                                    >
                                                        📵 부재(메모)
                                                    </button>
                                                    <button 
                                                        onClick={() => handleResultAction('callback', 'memo')}
                                                        className={`flex-1 px-1 py-1 rounded text-[10px] font-bold transition-all border
                                                            ${(isOnCall ? callResult : (localResult || co.lastCallResult)) === 'callback' ? 'bg-amber-600 text-white border-amber-700 shadow-sm' : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'}`}
                                                    >
                                                        🔄 콜백(메모)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col flex-1">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">📞 통화 스크립트</h3>
                                    <ScriptTab co={co} setToast={setToast} />
                                </div>
                            </div>


                                                        </div>
                        </div>
                    </div>
            </td>
        </motion.tr>
    );
}
