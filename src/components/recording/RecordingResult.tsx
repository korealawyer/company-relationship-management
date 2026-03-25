import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { RecordingMode } from '../RecordingWidget';

export interface RecordingResultProps {
    steps: string[];
    transcript: string;
    onClose: () => void;
    mode: RecordingMode;
    accent: string;
    handleRegisterPending: () => void;
    handleSaveMeetingNote: () => void;
}

export function RecordingResult({
    steps, transcript, onClose, mode, accent, handleRegisterPending, handleSaveMeetingNote
}: RecordingResultProps) {
    const [openStep, setOpenStep] = useState<number | null>(0);
    const [showFull, setShowFull] = useState(false);

    return (
        <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-wider pb-1"
                style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
                🤖 AI 분석 결과 (노션 회의록 스타일)
            </p>
            {/* 단계별 요약 아코디언 */}
            <div className="space-y-2">
                {steps.map((step, i) => (
                    <div key={i} className="rounded-xl overflow-hidden"
                        style={{ border: '1px solid #e2e8f0' }}>
                        <button
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                            style={{ background: openStep === i ? '#f8faff' : '#fff' }}
                            onClick={() => setOpenStep(openStep === i ? null : i)}
                        >
                            <span className="text-sm font-bold" style={{ color: '#1e293b' }}>
                                {step.split(':')[0]}
                            </span>
                            {openStep === i ? <ChevronUp className="w-4 h-4" style={{ color: '#94a3b8' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#94a3b8' }} />}
                        </button>
                        <AnimatePresence>
                            {openStep === i && (
                                <motion.div
                                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                    className="overflow-hidden">
                                    <p className="px-4 pb-3 text-xs leading-relaxed"
                                        style={{ color: '#475569' }}>
                                        {step.replace(/\*\*/g, '').split(':').slice(1).join(':').trim()}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
            {/* 전체 녹취록 토글 */}
            <button onClick={() => setShowFull(s => !s)}
                className="flex items-center gap-1.5 text-xs font-semibold"
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
                        {transcript}
                    </motion.pre>
                )}
            </AnimatePresence>
            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-1">
                <button onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: '#f1f5f9', color: '#64748b' }}>
                    취소
                </button>
                {mode === 'new_client' && (
                    <button onClick={handleRegisterPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: accent }}>
                        🔔 대기중 등록
                    </button>
                )}
                {mode === 'meeting' && (
                    <button onClick={handleSaveMeetingNote}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: accent }}>
                        💾 사건메모 저장
                    </button>
                )}
            </div>
        </div>
    );
}
