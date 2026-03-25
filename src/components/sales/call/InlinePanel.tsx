'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Phone, PhoneOff, Building2, Headphones,
    Pause, Play, RefreshCw, X,
} from 'lucide-react';
import { Company, STATUS_COLOR, STATUS_TEXT, STATUS_LABEL, type CaseStatus } from '@/lib/mockStore';
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

                        {/* 오른쪽: 탭 + 통화 버튼 */}
                        <div className="flex items-center gap-2">
                            {/* 탭 네비게이션 */}
                            {([
                                { k: 'script' as const, l: '📞 스크립트' },
                                { k: 'info' as const, l: '📊 회사정보' },
                                { k: 'memo' as const, l: '📝 메모' },
                                { k: 'recordings' as const, l: `🎙️ 녹음 (${companyRecordings.length})` },
                            ] as const).map(t => (
                                <button key={t.k} onClick={() => setTab(t.k)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold"
                                    style={{
                                        background: tab === t.k ? '#eef2ff' : 'transparent',
                                        color: tab === t.k ? '#4f46e5' : C.muted,
                                        border: `1px solid ${tab === t.k ? '#c7d2fe' : 'transparent'}`,
                                    }}>
                                    {t.l}
                                </button>
                            ))}

                            <div className="w-px h-5 mx-1" style={{ background: C.borderLight }} />

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

                    {/* ── 탭 콘텐츠 ── */}
                    <div className="px-5 py-3" style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {tab === 'script' && (
                            <ScriptTab co={co} setToast={setToast} />
                        )}
                        {tab === 'info' && (
                            <InfoTab co={co} onRefresh={onRefresh} setToast={setToast} />
                        )}
                        {tab === 'memo' && (
                            <MemoTab co={co} onRefresh={onRefresh} setToast={setToast} />
                        )}
                        {tab === 'recordings' && (
                            <RecordingsTab companyRecordings={companyRecordings} />
                        )}
                    </div>
                </div>
            </td>
        </motion.tr>
    );
}
