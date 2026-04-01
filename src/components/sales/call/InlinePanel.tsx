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
import RecordingsTab from './RecordingsTab';

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
    const [tab, setTab] = useState<'script' | 'info' | 'memo' | 'recordings'>('script');

    // Reset tab when company changes
    useEffect(() => { setTab('script'); }, [co.id]);

    return (
        <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
        >
            <td colSpan={10} className="p-0">
                <div style={{
                    background: isOnCall ? '#f0fdf4' : '#f8fafc',
                    borderTop: `2px solid ${isOnCall ? '#059669' : '#4f46e5'}`,
                    borderBottom: `2px solid ${isOnCall ? '#a7f3d0' : '#c7d2fe'}`,
                }}>


                    {/* ── 통합 콘텐츠 대시보드 ── */}
                    <div className="px-5 py-4" style={{ maxHeight: 800, overflowY: 'auto', background: C.bg }}>
                        <div className="grid grid-cols-3 gap-6 items-stretch">
                            {/* Col 1: 스크립트 */}
                            <div className="flex flex-col gap-4 h-full">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col flex-1">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">📞 통화 스크립트</h3>
                                    <ScriptTab co={co} setToast={setToast} />
                                </div>
                            </div>
                            
                            {/* Col 2: 메모 & AI 분석 */}
                            <div className="flex flex-col gap-4 h-full">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col flex-1">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">📝 메모 & AI 분석</h3>
                                    <MemoTab co={co} onRefresh={onRefresh} setToast={setToast} />
                                </div>
                            </div>

                            {/* Col 3: 스마트 기업 상세정보, 위험도, 주요 이슈, 통화 녹음 */}
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

                                {/* 통화 녹음 내역 */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col flex-1 shrink-0 min-h-[150px]">
                                    <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                        <h3 className="text-[11px] font-bold text-gray-800">🎙️ 통화 녹음 ({companyRecordings.length})</h3>
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
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black"
                                                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                                    <PhoneOff className="w-3 h-3" />종료
                                                </button>
                                            </>}
                                        </div>
                                    </div>
                                    <RecordingsTab companyRecordings={companyRecordings} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </td>
        </motion.tr>
    );
}
