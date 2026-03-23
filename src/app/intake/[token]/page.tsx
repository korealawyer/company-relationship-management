'use client';
// src/app/intake/[token]/page.tsx
// 신규 고객 전용 접수 페이지 — 로그인 없이 접근 가능
// URL: /intake/[token] (변호사/영업팀이 생성한 전용 링크)

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, StopCircle, Send, ChevronDown, ChevronUp,
    CheckCircle, AlertCircle, Loader2, MessageSquare, Phone
} from 'lucide-react';
import { CallRecorder, AudioVisualizer, STTService, formatDuration } from '@/lib/callRecordingService';
import { IntakeTokenService, registerPendingClient } from '@/lib/pendingClientService';

const CATEGORY_OPTIONS = ['민사', '형사', '가사', '행정', '개인정보', '가맹계약', '노무', '기타'];

export default function IntakePage({ params }: { params: { token: string } }) {
    const { token } = params;

    // 토큰 검증
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const [lawyerName, setLawyerName] = useState('');

    useEffect(() => {
        const info = IntakeTokenService.validate(token);
        if (info) {
            setTokenValid(true);
            setLawyerName(info.userName);
        } else {
            setTokenValid(false);
        }
    }, [token]);

    const [inputTab, setInputTab] = useState<'record' | 'text'>('text');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [category, setCategory] = useState('기타');
    const [manualText, setManualText] = useState('');
    const [phase, setPhase] = useState<'form' | 'recording' | 'processing' | 'done' | 'error'>('form');
    const [elapsed, setElapsed] = useState(0);
    const [bars, setBars] = useState<number[]>(new Array(16).fill(2));
    const [recordedTranscript, setRecordedTranscript] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [duration, setDuration] = useState(0);

    const recorder = useRef(new CallRecorder());
    const viz       = useRef(new AudioVisualizer());
    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
    const vizTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopAll = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (vizTimer.current) clearInterval(vizTimer.current);
        viz.current.disconnect();
    }, []);

    useEffect(() => () => stopAll(), [stopAll]);

    const handleStartRecording = async () => {
        setErrorMsg('');
        const ok = await recorder.current.start();
        if (!ok) { setErrorMsg('마이크 접근 권한이 필요합니다.'); return; }
        const stream = recorder.current.getStream();
        if (stream) {
            viz.current.connect(stream);
            vizTimer.current = setInterval(() => setBars(viz.current.getFrequencyData()), 80);
        }
        setPhase('recording');
        setElapsed(0);
        timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    };

    const handleStopRecording = async () => {
        stopAll();
        setPhase('processing');
        const result = await recorder.current.stop();
        if (!result) { setPhase('error'); setErrorMsg('녹음 처리 중 오류가 발생했습니다.'); return; }
        setDuration(result.durationSeconds);
        const { transcript } = await STTService.transcribe(result.blob, result.durationSeconds);
        setRecordedTranscript(transcript);
        setPhase('form'); // 녹음 완료 후 다시 폼으로 (확인 후 제출)
    };

    const handleSubmit = async () => {
        if (!clientName.trim()) { setErrorMsg('이름을 입력해주세요.'); return; }
        const finalText = inputTab === 'record' ? recordedTranscript : manualText;
        if (!finalText.trim()) { setErrorMsg('내용을 입력하거나 녹음해주세요.'); return; }

        setPhase('processing');

        // 토큰 정보 가져오기
        const tokenInfo = IntakeTokenService.validate(token);
        await registerPendingClient({
            channel: 'intake_url',
            clientName,
            clientPhone,
            category,
            transcript: finalText,
            recordingDuration: inputTab === 'record' ? duration : undefined,
            sourcePortal: 'intake',
            sourceUserId: tokenInfo?.userId,
            sourceUserName: tokenInfo?.userName,
            token,
        });
        IntakeTokenService.markUsed(token);
        setPhase('done');
    };

    const iS = {
        background: '#f8f9fc',
        border: '1px solid #e2e8f0',
        color: '#1e293b',
        borderRadius: '12px',
        padding: '10px 14px',
        width: '100%',
        fontSize: '14px',
    };

    // ── 로딩 중 ──
    if (tokenValid === null) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f4f8' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6366f1' }} />
            </div>
        );
    }

    // ── 토큰 무효 ──
    if (tokenValid === false) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f0f4f8' }}>
                <div className="max-w-sm w-full text-center space-y-4">
                    <AlertCircle className="w-12 h-12 mx-auto" style={{ color: '#ef4444' }} />
                    <h1 className="text-xl font-black" style={{ color: '#1e293b' }}>유효하지 않은 링크</h1>
                    <p className="text-sm" style={{ color: '#64748b' }}>
                        이 접수 링크는 만료되었거나 유효하지 않습니다.<br/>
                        담당 변호사에게 새 링크를 요청해 주세요.
                    </p>
                </div>
            </div>
        );
    }

    // ── 접수 완료 ──
    if (phase === 'done') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-sm w-full text-center space-y-5 p-8 rounded-3xl"
                    style={{ background: '#fff' }}
                >
                    <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl"
                        style={{ background: 'linear-gradient(135deg, #84fab0, #8fd3f4)' }}>
                        ✅
                    </div>
                    <h1 className="text-xl font-black" style={{ color: '#1e293b' }}>접수 완료!</h1>
                    <p className="text-sm" style={{ color: '#64748b' }}>
                        <strong>{clientName}</strong>님의 상담 내용이 정상적으로 접수되었습니다.<br/>
                        담당 변호사가 확인 후 곧 연락드립니다.
                    </p>
                    {clientPhone && (
                        <div className="flex items-center gap-2 justify-center text-sm"
                            style={{ color: '#6366f1' }}>
                            <Phone className="w-4 h-4" />
                            <span>{clientPhone}로 연락 예정</span>
                        </div>
                    )}
                    <p className="text-xs" style={{ color: '#94a3b8' }}>
                        법무법인 IBS · 법률 서비스 플랫폼
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #f0f4ff 0%, #faf5ff 100%)' }}>
            {/* 헤더 */}
            <header className="px-5 py-4 flex items-center gap-3"
                style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>⚖️</div>
                <div>
                    <p className="font-black text-sm" style={{ color: '#1e293b' }}>법률 상담 접수</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>담당: {lawyerName}</p>
                </div>
            </header>

            <main className="flex-1 flex items-start justify-center p-4 pt-6">
                <div className="w-full max-w-md space-y-4">
                    {/* 안내 */}
                    <div className="p-4 rounded-2xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                        <p className="text-sm font-semibold" style={{ color: '#b8960a' }}>
                            📋 이 페이지에서 상담 내용을 작성하거나 녹음으로 전달하실 수 있습니다.
                        </p>
                    </div>

                    {/* 개인정보 */}
                    <div className="p-4 rounded-2xl space-y-3" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                        <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#94a3b8' }}>👤 기본 정보</p>
                        <div>
                            <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>이름 <span style={{ color: '#ef4444' }}>*</span></label>
                            <input value={clientName} onChange={e => setClientName(e.target.value)}
                                placeholder="홍길동" style={iS} />
                        </div>
                        <div>
                            <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>연락처</label>
                            <input value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                                placeholder="010-0000-0000" style={iS} />
                        </div>
                        <div>
                            <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>사건 유형</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} style={iS}>
                                {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* 내용 입력 */}
                    <div className="p-4 rounded-2xl space-y-3" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                        <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#94a3b8' }}>📝 상담 내용</p>
                        {/* 탭 */}
                        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
                            {[{ k: 'text', l: '✍️ 글 작성' }, { k: 'record', l: '🎙️ 녹음' }].map(t => (
                                <button key={t.k} onClick={() => setInputTab(t.k as 'text' | 'record')}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={inputTab === t.k
                                        ? { background: '#fff', color: '#6366f1', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                                        : { color: '#94a3b8' }}>
                                    {t.l}
                                </button>
                            ))}
                        </div>

                        {/* 글 작성 */}
                        {inputTab === 'text' && (
                            <textarea value={manualText} onChange={e => setManualText(e.target.value)}
                                rows={6} placeholder="어떤 법률 문제로 상담을 원하시나요? 자세히 적어주실수록 정확한 도움을 드릴 수 있습니다."
                                style={{ ...iS, resize: 'none', lineHeight: '1.6' }} />
                        )}

                        {/* 녹음 */}
                        {inputTab === 'record' && (
                            <div className="text-center space-y-3">
                                {phase === 'form' && recordedTranscript && (
                                    <div className="p-3 rounded-xl text-left" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                        <p className="text-xs font-bold mb-1" style={{ color: '#16a34a' }}>
                                            ✅ 녹음 완료 ({formatDuration(duration)})
                                        </p>
                                        <p className="text-xs" style={{ color: '#64748b' }}>녹음이 완료되었습니다. 아래에서 제출을 눌러주세요.</p>
                                    </div>
                                )}
                                {phase === 'recording' ? (
                                    <>
                                        <div className="flex items-end justify-center gap-0.5 h-10">
                                            {bars.map((h, i) => (
                                                <motion.div key={i}
                                                    animate={{ height: Math.max(4, h / 4) }}
                                                    className="w-1.5 rounded-full"
                                                    style={{ background: '#6366f1', minHeight: 4 }}
                                                    transition={{ duration: 0.08 }} />
                                            ))}
                                        </div>
                                        <p className="text-xl font-black tabular-nums" style={{ color: '#6366f1' }}>
                                            {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                                        </p>
                                        <button onClick={handleStopRecording}
                                            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full font-bold text-white"
                                            style={{ background: '#ef4444' }}>
                                            <StopCircle className="w-5 h-5" /> 녹음 완료
                                        </button>
                                    </>
                                ) : phase === 'processing' ? (
                                    <div className="py-4">
                                        <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" style={{ color: '#6366f1' }} />
                                        <p className="text-xs" style={{ color: '#94a3b8' }}>처리 중...</p>
                                    </div>
                                ) : (
                                    <button onClick={handleStartRecording}
                                        className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full font-bold text-white"
                                        style={{ background: '#6366f1' }}>
                                        <Mic className="w-5 h-5" />
                                        {recordedTranscript ? '다시 녹음' : '녹음 시작'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: '#ef4444' }}>
                            <AlertCircle className="w-4 h-4" /> {errorMsg}
                        </div>
                    )}

                    {/* 제출 버튼 */}
                    <button
                        onClick={handleSubmit}
                        disabled={phase === 'processing'}
                        className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', fontSize: '15px' }}>
                        {phase === 'processing' ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> 접수 중...</>
                        ) : (
                            <><Send className="w-5 h-5" /> 상담 접수하기</>
                        )}
                    </button>

                    <p className="text-xs text-center" style={{ color: '#94a3b8' }}>
                        법무법인 IBS · 개인정보는 법률 상담 목적으로만 사용됩니다.
                    </p>
                </div>
            </main>
        </div>
    );
}
