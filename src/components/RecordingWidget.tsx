'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, StopCircle, Link2, Copy, Check,
    X, UserPlus, MessageSquare, Phone, Loader2
} from 'lucide-react';
import {
    CallRecorder, STTService, AudioVisualizer, formatDuration
} from '@/lib/callRecordingService';
import { registerPendingClient, IntakeTokenService } from '@/lib/pendingClientService';
import { personalStore, documentStore, DocumentCategory } from '@/lib/mockStore';

import { IntakeForm } from './recording/IntakeForm';
import { RecordingResult } from './recording/RecordingResult';

export type RecordingMode = 'new_client' | 'meeting' | 'intake_url';

interface Props {
    mode: RecordingMode;
    onClose: () => void;
    litCaseId?: string;
    litCaseName?: string;
    defaultClientName?: string;
    userId?: string;
    userName?: string;
}

type Phase = 'idle' | 'recording' | 'processing' | 'result' | 'url_ready' | 'done';

export default function RecordingWidget({
    mode, onClose, litCaseId, litCaseName,
    defaultClientName = '', userId = 'lawyer1', userName = '변호사',
}: Props) {
    const [phase, setPhase] = useState<Phase>(mode === 'intake_url' ? 'idle' : 'idle');
    const [elapsed, setElapsed] = useState(0);
    const [bars, setBars] = useState<number[]>(new Array(16).fill(2));
    
    // IntakeForm states
    const [clientName, setClientName] = useState(defaultClientName);
    const [clientPhone, setClientPhone] = useState('');
    const [category, setCategory] = useState('민사');
    const [files, setFiles] = useState<File[]>([]);
    const [fileData, setFileData] = useState<Record<string, { progress: number, status: string, text?: string, structuredData?: any }>>({});
    
    // Result states
    const [transcript, setTranscript] = useState('');
    const [steps, setSteps] = useState<string[]>([]);
    
    // Other states
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

    const handleStopRecording = async () => {
        stopAll();
        setPhase('processing');
        const result = await recorder.current.stop();
        if (!result) { setPhase('idle'); setErrorMsg('녹음 처리 실패'); return; }
        duration.current = result.durationSeconds;

        const { transcript: t } = await STTService.transcribe(
            result.blob, result.durationSeconds, 'connected'
        );
        const summarySteps = await STTService.summarizeSteps(t, clientName || '의뢰인', category);

        setTranscript(t);
        setSteps(summarySteps);
        setPhase('result');
    };

    const handleTextSubmit = async () => {
        if (!manualText.trim()) return;
        setPhase('processing');
        const summarySteps = await STTService.summarizeSteps(manualText, clientName || '의뢰인', category);
        setTranscript(manualText);
        setSteps(summarySteps);
        setPhase('result');
    };

    const handleFileChange = async (fl: FileList | null) => {
        if (!fl) return;
        const valid = Array.from(fl).filter(f => {
            if (f.size > 10 * 1024 * 1024) { alert(`${f.name}은(는) 10MB 이하만 가능합니다.`); return false; }
            return true;
        });
        setFiles(prev => [...prev, ...valid]);

        const { extractText } = await import('@/lib/ocr/ocrService');
        valid.forEach(async (file) => {
            const key = file.name + file.size;
            setFileData(p => ({ ...p, [key]: { progress: 0, status: 'processing' } }));
            try {
                const result = await extractText(file, {
                    onProgress: (pct) => setFileData(p => ({ ...p, [key]: { progress: pct, status: 'processing' } }))
                });
                setFileData(p => ({ 
                    ...p, 
                    [key]: { progress: 100, status: 'done', text: result.extractedText, structuredData: result.structuredData } 
                }));
                if (result.structuredData && result.structuredData.parties) {
                    sessionStorage.setItem('ibs_ocr_suggestion', JSON.stringify(result.structuredData));
                }
            } catch (err) {
                setFileData(p => ({ ...p, [key]: { progress: 0, status: 'error' } }));
            }
        });
    };

    const handleRegisterPending = async () => {
        setPhase('processing');
        await registerPendingClient({
            channel: 'recording',
            clientName: clientName || '미확인 의뢰인',
            clientPhone,
            category,
            transcript: transcript + (files.length > 0 ? `\n\n📎 첨부파일 ${files.length}건: ${files.map(f => f.name).join(', ')}` : ''),
            recordingDuration: duration.current,
            sourcePortal: 'lawyer',
            sourceUserId: userId,
            sourceUserName: userName,
        });
        if (files.length > 0) {
            files.forEach(file => documentStore.upload({
                companyId: 'pending',
                authorRole: 'lawyer',
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                category: '기타' as DocumentCategory,
                status: '검토 대기',
                url: URL.createObjectURL(file),
                isNewForClient: false,
                isNewForLawyer: true,
            }));
        }
        setPhase('done');
    };

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

    const handleGenerateUrl = () => {
        const token = IntakeTokenService.generate(userId as string, userName as string, 'lawyer');
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
                    {/* ── PHASE: idle ── */}
                    {phase === 'idle' && mode !== 'intake_url' && (
                        <>
                            {mode === 'new_client' && (
                                <IntakeForm 
                                    clientName={clientName} setClientName={setClientName}
                                    clientPhone={clientPhone} setClientPhone={setClientPhone}
                                    category={category} setCategory={setCategory}
                                    files={files} setFiles={setFiles}
                                    fileData={fileData} handleFileChange={handleFileChange}
                                />
                            )}
                            
                            {mode === 'meeting' && litCaseName && (
                                <div className="px-3 py-2 rounded-xl text-sm font-semibold"
                                    style={{ background: '#f0f4ff', color: '#6366f1' }}>
                                    📁 {litCaseName}
                                </div>
                            )}

                            {/* 입력 탭 */}
                            <div className="flex gap-1 p-1 rounded-xl mt-4" style={{ background: '#f1f5f9' }}>
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
                                        className="w-full py-3 rounded-xl font-bold text-white mt-2"
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
                        <RecordingResult 
                            steps={steps} transcript={transcript} onClose={onClose} 
                            mode={mode} accent={accent} 
                            handleRegisterPending={handleRegisterPending} 
                            handleSaveMeetingNote={handleSaveMeetingNote} 
                        />
                    )}

                    {/* ── PHASE: intake_url ── */}
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
