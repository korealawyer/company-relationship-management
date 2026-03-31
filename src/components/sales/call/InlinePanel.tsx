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
                    {/* ── 패널 헤더 ── */}
                    <div className="flex items-center justify-between px-5 py-2" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isOnCall ? '#ecfdf5' : '#eef2ff' }}>
                                {isOnCall
                                    ? <Headphones className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                                    : <Building2 className="w-3.5 h-3.5" style={{ color: '#4f46e5' }} />}
                            </div>
                            <span className="text-sm font-black" style={{ color: C.heading }}>{co.name}</span>
                            <span className="text-xs" style={{ color: C.sub }}>
                                {co.contactName || '담당자'} · <a
                                    href={`tel:${(co.contactPhone || co.phone).replace(/[^0-9+]/g, '')}`}
                                    className="underline hover:text-indigo-600"
                                    onClick={e => e.stopPropagation()}
                                >{co.contactPhone || co.phone}</a>
                            </span>
                            <Badge status={co.status} />

                            {isOnCall && <>
                                {/* 타이머 */}
                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg ml-1" style={{ background: '#ecfdf5' }}>
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#059669' }} />
                                    <span className="font-mono text-base font-black" style={{ color: '#059669' }}>{timer.fmt}</span>
                                </div>

                                {/* 녹음 인디케이터 + 파형 */}
                                {isRecording && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg ml-1" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
                                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#dc2626' }} />
                                        <span className="text-[10px] font-bold" style={{ color: '#dc2626' }}>REC</span>
                                        <div className="flex items-end gap-px h-4">
                                            {waveformData.slice(0, 8).map((v, i) => (
                                                <div key={i} className="w-[2px] rounded-full transition-all duration-100"
                                                    style={{ height: `${Math.max(2, v / 16)}px`, background: '#dc2626', opacity: 0.6 + v / 500 }} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* STT 변환중 */}
                                {sttStatus === 'processing' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg ml-1" style={{ background: '#f3e8ff', border: '1px solid #d8b4fe' }}>
                                        <RefreshCw className="w-3 h-3 animate-spin" style={{ color: '#7c3aed' }} />
                                        <span className="text-[10px] font-bold" style={{ color: '#7c3aed' }}>STT 변환중</span>
                                    </div>
                                )}

                                {/* 통화 결과 버튼 */}
                                {[
                                    { k: 'connected' as const, l: '✅연결', c: '#059669', bg: '#ecfdf5', bd: '#a7f3d0' },
                                    { k: 'no_answer' as const, l: '📵부재', c: '#92400e', bg: '#fffbeb', bd: '#fde68a' },
                                    { k: 'callback' as const, l: '📋콜백', c: '#4f46e5', bg: '#eef2ff', bd: '#c7d2fe' },
                                ].map(r => (
                                    <button key={r.k} onClick={() => onCallResult(r.k)}
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold"
                                        style={{
                                            background: callResult === r.k ? r.bg : '#f8f9fc',
                                            color: callResult === r.k ? r.c : C.faint,
                                            border: `1px solid ${callResult === r.k ? r.bd : C.borderLight}`,
                                        }}>
                                        {r.l}
                                    </button>
                                ))}
                            </>}
                        </div>

                        {/* 오른쪽: 통화 버튼 */}
                        <div className="flex items-center gap-2">
                            {/* 통화 시작 / 종료 */}
                            {!isOnCall ? (
                                <button onClick={onStartCall}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black hover:scale-105 transition-transform"
                                    style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                                    <Phone className="w-3.5 h-3.5" />통화 시작
                                </button>
                            ) : <>
                                <button onClick={timer.running ? timer.pause : timer.resume}
                                    className="p-2 rounded-lg"
                                    style={{ background: '#f8f9fc', border: `1px solid ${C.borderLight}` }}>
                                    {timer.running
                                        ? <Pause className="w-3.5 h-3.5" style={{ color: C.sub }} />
                                        : <Play className="w-3.5 h-3.5" style={{ color: '#059669' }} />}
                                </button>
                                <button onClick={onEndCall}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black"
                                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                    <PhoneOff className="w-3.5 h-3.5" />종료
                                </button>
                            </>}

                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
                                <X className="w-4 h-4" style={{ color: C.faint }} />
                            </button>
                        </div>
                    </div>

                    {/* ── 통합 콘텐츠 대시보드 ── */}
                    <div className="px-5 py-4" style={{ maxHeight: 800, overflowY: 'auto', background: C.bg }}>
                        <div className="grid grid-cols-[1fr_250px_minmax(400px,1.5fr)] gap-6 items-stretch">
                            {/* 좌측: 스크립트 */}
                            <div className="flex flex-col gap-4 h-full">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col flex-1">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">📞 통화 스크립트</h3>
                                    <ScriptTab co={co} setToast={setToast} />
                                </div>
                            </div>
                            
                            {/* 중앙 (원래 우측): 위험도, 이슈 & 액션 (임시 영역), 통화 녹음 */}
                            <div className="flex flex-col gap-4 h-full">
                                {/* 위험도 */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
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

                                {/* 주요 이슈 */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <h3 className="text-[11px] font-bold text-gray-800 mb-3">🎙️ 통화 녹음 ({companyRecordings.length})</h3>
                                    <RecordingsTab companyRecordings={companyRecordings} />
                                </div>
                            </div>
                            
                            {/* 우측 (원래 중앙): 상세정보 + 메모 */}
                            <div className="flex flex-col gap-4 h-full">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 shrink-0">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">📊 스마트 기업 상세정보</h3>
                                    <InfoTab co={co} onRefresh={onRefresh} setToast={setToast} />
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col flex-1">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">📝 메모 & AI 분석</h3>
                                    <MemoTab co={co} onRefresh={onRefresh} setToast={setToast} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </td>
        </motion.tr>
    );
}
