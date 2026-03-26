// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, UserPlus, Loader2, FileText } from 'lucide-react';
import { type PendingClient } from '@/lib/types';
import { LAWYERS, LITIGATION_TYPES, COURTS } from '@/lib/constants';
import { store, PendingClientStore } from '@/lib/store';
import { useLitigations } from '@/hooks/useDataLayer';

export default function PendingClientsPanel({ onConfirm }: { onConfirm: () => void }) {
    const { addLitigation } = useLitigations();
    const [pendings, setPendings] = useState<PendingClient[]>([]);
    const [selId, setSelId] = useState<string | null>(null);
    const [openStep, setOpenStep] = useState<number | null>(0);
    const [showFull, setShowFull] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [assignedLawyer, setAssignedLawyer] = useState<string>(LAWYERS[0] || '');

    const load = () => setPendings(PendingClientStore.getPending());
    useEffect(() => {
        load();
        window.addEventListener('ibs-pending-updated', load);
        return () => window.removeEventListener('ibs-pending-updated', load);
    }, []);

    const selected = pendings.find(p => p.id === selId) ?? pendings[0];

    const handleConfirm = async () => {
        if (!selected) return;
        setConfirming(true);
        const confirmed = PendingClientStore.confirm(selected.id);
        if (confirmed) {
            // 송무 사건 자동 등록
            addLitigation({
                companyId: 'personal',
                companyName: confirmed.clientName,
                caseNo: '',
                court: COURTS[0],
                type: LITIGATION_TYPES[0],
                opponent: '',
                claimAmount: 0,
                status: 'preparing',
                assignedLawyer: assignedLawyer,
                deadlines: [],
                notes: `📋 접수 경위: ${confirmed.channel === 'recording' ? '녹음 접수' : confirmed.channel === 'intake_url' ? 'URL 접수' : '회의 접수'}
연락처: ${confirmed.clientPhone}

📝 AI 요약:
${confirmed.summarySteps.map(s => s.replace(/\*\*/g, '')).join('\n')}

📃 전체 녹취록:
${confirmed.transcript}`,
                result: '',
                resultNote: '',
            });
        }
        load();
        setSelId(null);
        setConfirming(false);
        setAssignedLawyer(LAWYERS[0] || '');
        onConfirm();
    };

    const handleReject = () => {
        if (!selected) return;
        PendingClientStore.reject(selected.id);
        load();
        setSelId(null);
    };

    const CHANNEL_ICON: Record<string, string> = { recording: '🎙️', intake_url: '🔗', meeting: '👥' };
    const CHANNEL_LABEL: Record<string, string> = { recording: '녹음 접수', intake_url: 'URL 접수', meeting: '회의 녹음' };

    if (pendings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-16">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-bold text-sm" style={{ color: '#64748b' }}>대기중인 의뢰인이 없습니다</p>
                <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>🎙️ 녹음 버튼으로 새 의뢰인을 접수하세요</p>
            </div>
        );
    }

    return (
        <div className="flex h-full" style={{ height: 'calc(100vh - 8rem)' }}>
            {/* 목록 */}
            <div className="w-72 flex-shrink-0 overflow-y-auto border-r" style={{ borderColor: '#e5e7eb', background: '#f8f9fc' }}>
                {pendings.map(p => (
                    <div key={p.id}
                        onClick={() => { setSelId(p.id); setOpenStep(0); setShowFull(false); }}
                        className="p-3 cursor-pointer border-b transition-all"
                        style={{
                            borderColor: '#f1f5f9',
                            background: (selected?.id === p.id) ? '#fffbeb' : '#fff',
                            borderLeft: (selected?.id === p.id) ? '3px solid #b8960a' : '3px solid transparent',
                        }}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{CHANNEL_ICON[p.channel]}</span>
                            <span className="text-sm font-black" style={{ color: '#1e293b' }}>{p.clientName}</span>
                            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                style={{ background: '#fef3c7', color: '#92400e' }}>대기중</span>
                        </div>
                        <p className="text-xs" style={{ color: '#64748b' }}>{CHANNEL_LABEL[p.channel]} · {p.category}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>
                            {new Date(p.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                ))}
            </div>

            {/* 상세 패널 */}
            {selected && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{CHANNEL_ICON[selected.channel]}</span>
                                <h2 className="text-lg font-black" style={{ color: '#1e293b' }}>{selected.clientName}</h2>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                                {CHANNEL_LABEL[selected.channel]} · {selected.category} · {selected.clientPhone || '연락처 없음'}
                            </p>
                        </div>
                    </div>

                    {/* 단계별 요약 (노션 AI 스타일) */}
                    <div>
                        <p className="text-xs font-black mb-2 uppercase tracking-wider" style={{ color: '#94a3b8' }}>🤖 AI 분석 요약</p>
                        <div className="space-y-2">
                            {selected.summarySteps.map((step, i) => (
                                <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                                    <button className="w-full flex items-center justify-between px-4 py-3 text-left"
                                        style={{ background: openStep === i ? '#f8faff' : '#fff' }}
                                        onClick={() => setOpenStep(openStep === i ? null : i)}>
                                        <span className="text-sm font-bold" style={{ color: '#1e293b' }}>{step.split(':')[0]}</span>
                                        {openStep === i ? <ChevronUp className="w-4 h-4" style={{ color: '#94a3b8' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#94a3b8' }} />}
                                    </button>
                                    <AnimatePresence>
                                        {openStep === i && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                <p className="px-4 pb-3 text-xs leading-relaxed" style={{ color: '#475569' }}>
                                                    {step.replace(/\*\*/g, '').split(':').slice(1).join(':').trim()}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 전체 녹취록 토글 */}
                    {selected.transcript && (
                        <div>
                            <button onClick={() => setShowFull(s => !s)}
                                className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                                style={{ color: '#94a3b8' }}>
                                <FileText className="w-3.5 h-3.5" />
                                {showFull ? '녹취록 접기' : '전체 녹취록 보기'}
                                {showFull ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            <AnimatePresence>
                                {showFull && (
                                    <motion.pre
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        className="text-xs rounded-xl p-3 whitespace-pre-wrap overflow-y-auto max-h-48"
                                        style={{ background: '#f8f9fc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                        {selected.transcript}
                                    </motion.pre>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* 담당 변호사 배정 */}
                    <div className="pt-4 mt-2" style={{ borderTop: '1px dashed #e2e8f0' }}>
                        <label className="flex items-center gap-1.5 text-xs font-black mb-2" style={{ color: '#b8960a' }}>
                            <UserPlus className="w-4 h-4" />
                            담당 변호사 사전 배정
                        </label>
                        <div className="relative">
                            <select
                                value={assignedLawyer}
                                onChange={(e) => setAssignedLawyer(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 rounded-xl text-sm font-bold outline-none cursor-pointer appearance-none transition-all block"
                                style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }}
                            >
                                {LAWYERS.map((lawyer) => (
                                    <option key={lawyer} value={lawyer}>{lawyer}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4" style={{ color: '#94a3b8' }}>
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* 컨펌 버튼 */}
                    <div className="flex gap-3 pt-5">
                        <button onClick={handleReject}
                            className="flex-1 py-3 rounded-xl text-sm font-bold"
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                            ❌ 거절
                        </button>
                        <button onClick={handleConfirm} disabled={confirming}
                            className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center"
                            style={{ background: confirming ? '#94a3b8' : 'linear-gradient(135deg,#16a34a,#22c55e)' }}>
                            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : '✅ 컨펌 → 사건 및 송무 자동 등록'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
