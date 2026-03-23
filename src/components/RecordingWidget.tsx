'use client';
// src/components/RecordingWidget.tsx
// 3가지 모드 통합 녹음 위젯:
//   new_client  → 신규 의뢰인 통화/미팅 녹음 → 대기중 등록
//   meeting     → 기존 고객 회의 녹음 → 사건메모 저장
//   intake_url  → 신규 고객 전용 URL 생성 및 공유

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, StopCircle, Link2, Copy, Check,
    ChevronDown, ChevronUp, FileText, Loader2, X,
    UserPlus, MessageSquare, ExternalLink, Phone
} from 'lucide-react';
import {
    CallRecorder, STTService, AudioVisualizer, formatDuration
} from '@/lib/callRecordingService';
import { registerPendingClient } from '@/lib/pendingClientService';
import { IntakeTokenService } from '@/lib/pendingClientService';
import { personalStore } from '@/lib/mockStore';
import { Button } from '@/components/ui/Button';

/* ── 타입 ─────────────────────────────────────────────────── */
export type RecordingMode = 'new_client' | 'meeting' | 'intake_url';

interface Props {
    mode: RecordingMode;
    onClose: () => void;
    // meeting 모드에서 필요
    litCaseId?: string;
    litCaseName?: string;
    // new_client 모드에서 옵션
    defaultClientName?: string;
    // 현재 사용자 정보
    userId?: string;
    userName?: string;
}

type Phase = 'idle' | 'recording' | 'processing' | 'result' | 'url_ready' | 'done';

const CATEGORY_OPTIONS = ['민사', '형사', '가사', '행정', '개인정보', '가맹계약', '노무', '기타'];

/* ══════════════════════════════════════════════════════════════
   컴포넌트
   ══════════════════════════════════════════════════════════════ */
export default function RecordingWidget({
    mode, onClose, litCaseId, litCaseName,
    defaultClientName = '', userId = 'user1', userName = '변호사',
}: Props) {
    const [phase, setPhase] = useState<Phase>(mode === 'intake_url' ? 'idle' : 'idle');
    const [elapsed, setElapsed] = useState(0);
    const [bars, setBars] = useState<number[]>(new Array(16).fill(2));
    const [clientName, setClientName] = useState(defaultClientName);
    const [clientPhone, setClientPhone] = useState('');
    const [category, setCategory] = useState('민사');
    const [transcript, setTranscript] = useState('');
    const [steps, setSteps] = useState<string[]>([]);
    const [openStep, setOpenStep] = useState<number | null>(0);
    const [showFull, setShowFull] = useState(false);
    const [intakeUrl, setIntakeUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [manualText, setManualText] = useState('');
    const [inputTab, setInputTab] = useState<'record' | 'text'>('record');

    const recorder = useRef(new CallRecorder());
    const vizRef    = useRef(new AudioVisualizer());
    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
    const vizTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
    const duration  = useRef(0);

    // 파형 애니메이션
    const startViz = useCallback((stream: MediaStream) => {
        vizRef.current.connect(stream);
        vizTimer.current = setInterval(() => {
            setBars(vizRef.current.getFrequencyData());
        }, 80);
    }, []);

    const stopAll = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (vizTimer.current) clearInterval(vizTimer.current);
        vizRef.current.disconnect();
    }, []);

    useEffect(() => () => stopAll(), [stopAll]);

    /* ── 녹음 시작 ── */
    const handleStartRecording = async () => {
        setErrorMsg('');
        const ok = await recorder.current.start();
        if (!ok) { setErrorMsg('마이크 접근 권한이 필요합니다.'); return; }
        const stream = recorder.current.getStream();
        if (stream) startViz(stream);
        setPhase('recording');
        setElapsed(0);
        timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    };

    /* ── 녹음 중지 ── */
    const handleStopRecording = async () => {
        stopAll();
        setPhase('processing');
        const result = await recorder.current.stop();
        if (!result) { setPhase('idle'); setErrorMsg('녹음 처리 실패'); return; }
        duration.current = result.durationSeconds;

        // STT
        const { transcript: t } = await STTService.transcribe(
            result.blob, result.durationSeconds, 'connected'
        );
        const summarySteps = await STTService.summarizeSteps(t, clientName || '의뢰인', category);

        setTranscript(t);
        setSteps(summarySteps);
        setPhase('result');
    };

    /* ── 글 입력 처리 ── */
    const handleTextSubmit = async () => {
        if (!manualText.trim()) return;
        setPhase('processing');
        const summarySteps = await STTService.summarizeSteps(manualText, clientName || '의뢰인', category);
        setTranscript(manualText);
        setSteps(summarySteps);
        setPhase('result');
    };

    /* ── 대기중 등록 (채널 A) ── */
    const handleRegisterPending = async () => {
        setPhase('processing');
        await registerPendingClient({
            channel: 'recording',
            clientName: clientName || '미확인 의뢰인',
            clientPhone,
            category,
            transcript,
            recordingDuration: duration.current,
            sourcePortal: 'lawyer',
            sourceUserId: userId,
            sourceUserName: userName,
        });
        setPhase('done');
    };

    /* ── 사건메모 저장 (채널 C) ── */
    const handleSaveMeetingNote = async () => {
        if (!litCaseId) return;
        setPhase('processing');
        const dateStr = new Date().toLocaleString('ko-KR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        const noteSection = [
            `\n──── 🎙️ 회의 녹음 (${dateStr}, ${formatDuration(duration.current)}) ────`,
            transcript,
            steps.map(s => s.replace(/\*\*/g, '')).join('\n'),
        ].join('\n');
        const cases = personalStore.getAll();
        const lit = cases.find(c => c.id === litCaseId);
        if (lit) {
            personalStore.update(litCaseId, { notes: (lit.notes || '') + noteSection });
        }
        setPhase('done');
    };

    /* ── URL 생성 (채널 B) ── */
    const handleGenerateUrl = () => {
        const token = IntakeTokenService.generate(userId, userName, 'lawyer');
        const url = IntakeTokenService.buildUrl(token.token);
        setIntakeUrl(url);
        setPhase('url_ready');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(intakeUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    /* ── 색상 ── */
    const accent = mode === 'new_client' ? '#10b981' : mode === 'meeting' ? '#6366f1' : '#f59e0b';
    const modeLabel = mode === 'new_client' ? '신규 의뢰인 접수' : mode === 'meeting' ? '회의 녹음' : '전용 URL 생성';
    const modeIcon = mode === 'new_client' ? <UserPlus className="w-4 h-4" /> : mode === 'meeting' ? <Phone className="w-4 h-4" /> : <Link2 className="w-4 h-4" />;

    const iS = { background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="w-full max-w-lg rounded-2xl overflow-hidden"
                style={{ background: '#fff', maxHeight: '90vh', overflowY: 'auto' }}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-4"
                    style={{ background: accent, color: '#fff' }}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                        {modeIcon} {modeLabel}
                    </div>
                    <button onClick={onClose} className="opacity-80 hover:opacity-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* ── PHASE: idle / URL 모드 ── */}
                    {phase === 'idle' && mode !== 'intake_url' && (
                        <>
                            {/* 클라이언트 정보 */}
                            {(mode === 'new_client') && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>의뢰인 이름</label>
                                        <input value={clientName} onChange={e => setClientName(e.target.value)}
                                            placeholder="김○○" className="w-full px-3 py-2 rounded-lg text-sm" style={iS} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>연락처</label>
                                        <input value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                                            placeholder="010-0000-0000" className="w-full px-3 py-2 rounded-lg text-sm" style={iS} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>사건 분류</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg text-sm" style={iS}>
                                            {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                            {mode === 'meeting' && litCaseName && (
                                <div className="px-3 py-2 rounded-xl text-sm font-semibold"
                                    style={{ background: '#f0f4ff', color: '#6366f1' }}>
                                    📁 {litCaseName}
                                </div>
                            )}
                            {/* 입력 탭 */}
                            <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
                                {['record', 'text'].map(t => (
                                    <button key={t} onClick={() => setInputTab(t as 'record' | 'text')}
                                        className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                                        style={inputTab === t ? { background: '#fff', color: accent, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' } : { color: '#94a3b8' }}>
                                        {t === 'record' ? '🎙️ 녹음' : '✍️ 글 작성'}
                                    </button>
                                ))}
                            </div>
                            {inputTab === 'record' ? (
                                <button onClick={handleStartRecording}
                                    className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                                    style={{ background: accent }}>
                                    <Mic className="w-5 h-5" /> 녹음 시작
                                </button>
                            ) : (
                                <>
                                    <textarea value={manualText} onChange={e => setManualText(e.target.value)}
                                        rows={5} placeholder="상담 내용을 직접 입력하세요..."
                                        className="w-full px-3 py-2 rounded-xl text-sm resize-none" style={iS} />
                                    <button onClick={handleTextSubmit}
                                        className="w-full py-3 rounded-xl font-bold text-white"
                                        style={{ background: accent }}>
                                        <MessageSquare className="w-4 h-4 inline mr-1" /> AI 분석하기
                                    </button>
                                </>
                            )}
                            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
                        </>
                    )}

                    {/* ── PHASE: recording ── */}
                    {phase === 'recording' && (
                        <div className="text-center space-y-4">
                            <div className="flex items-end justify-center gap-0.5 h-12">
                                {bars.map((h, i) => (
                                    <motion.div key={i}
                                        animate={{ height: Math.max(4, h / 3) }}
                                        className="w-1.5 rounded-full"
                                        style={{ background: accent, minHeight: 4 }}
                                        transition={{ duration: 0.08 }}
                                    />
                                ))}
                            </div>
                            <p className="text-2xl font-black tabular-nums" style={{ color: accent }}>
                                {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                            </p>
                            <p className="text-xs" style={{ color: '#94a3b8' }}>녹음 중... 완료 시 버튼을 누르세요</p>
                            <button onClick={handleStopRecording}
                                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full font-bold text-white"
                                style={{ background: '#ef4444' }}>
                                <StopCircle className="w-5 h-5" /> 녹음 완료
                            </button>
                        </div>
                    )}

                    {/* ── PHASE: processing ── */}
                    {phase === 'processing' && (
                        <div className="text-center py-6 space-y-3">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin" style={{ color: accent }} />
                            <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>AI가 내용을 분석하고 있습니다...</p>
                            <div className="space-y-1">
                                {['음성 → 텍스트 변환 중', '법적 쟁점 분석 중', '단계별 요약 생성 중'].map((s, i) => (
                                    <p key={i} className="text-xs" style={{ color: '#94a3b8' }}>✓ {s}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── PHASE: result ── */}
                    {phase === 'result' && (
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
                    )}

                    {/* ── PHASE: intake_url (채널 B) ── */}
                    {mode === 'intake_url' && phase !== 'url_ready' && phase !== 'done' && (
                        <div className="space-y-4">
                            <p className="text-sm" style={{ color: '#64748b' }}>
                                신규 의뢰인에게 보낼 전용 접수 URL을 생성합니다.<br/>
                                의뢰인이 URL로 접속하면 녹음 또는 글로 사연을 전달할 수 있습니다.
                            </p>
                            <div className="rounded-xl p-4 space-y-2" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                                <p className="text-xs font-bold" style={{ color: '#b8960a' }}>📤 공유 방법</p>
                                <p className="text-xs" style={{ color: '#78716c' }}>문자 · 카카오톡 · 이메일로 URL 전달 → 의뢰인이 접속 → 내용 제출 → 포탈에 자동 알람</p>
                            </div>
                            <button onClick={handleGenerateUrl}
                                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                                style={{ background: accent }}>
                                <Link2 className="w-5 h-5" /> 전용 URL 생성
                            </button>
                        </div>
                    )}

                    {/* ── PHASE: url_ready ── */}
                    {phase === 'url_ready' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <span className="text-xs flex-1 break-all font-mono" style={{ color: '#16a34a' }}>{intakeUrl}</span>
                                <button onClick={handleCopy} className="shrink-0 p-1">
                                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" style={{ color: '#94a3b8' }} />}
                                </button>
                            </div>
                            <p className="text-xs text-center" style={{ color: '#94a3b8' }}>✅ URL 복사 후 의뢰인에게 전달하세요. 7일간 유효합니다.</p>
                            <div className="flex gap-2">
                                <a href={`https://wa.me/?text=${encodeURIComponent('법률 상담 접수: ' + intakeUrl)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex-1 py-2 rounded-xl text-xs font-bold text-center"
                                    style={{ background: '#f1f5f9', color: '#64748b' }}>
                                    카카오/문자 공유
                                </a>
                                <button onClick={handleCopy}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
                                    style={{ background: accent }}>
                                    {copied ? '✅ 복사됨!' : '🔗 URL 복사'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── PHASE: done ── */}
                    {phase === 'done' && (
                        <div className="text-center py-6 space-y-3">
                            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl"
                                style={{ background: `${accent}20` }}>✅</div>
                            <p className="font-black" style={{ color: '#1e293b' }}>
                                {mode === 'new_client' ? '대기중 의뢰인으로 등록됨' : '사건 메모에 저장됨'}
                            </p>
                            <p className="text-sm" style={{ color: '#94a3b8' }}>
                                {mode === 'new_client' ? '변호사 포탈 "대기중 의뢰인" 탭에서 확인 후 컨펌하세요.' : '사건 메모 탭에서 AI 요약 내용을 확인하세요.'}
                            </p>
                            <button onClick={onClose}
                                className="px-6 py-2.5 rounded-xl font-bold text-white mx-auto"
                                style={{ background: accent }}>
                                닫기
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
