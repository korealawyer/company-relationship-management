import { useState, useRef, useCallback } from 'react';
import { CallRecorder, STTService, CallRecordingStore, AudioVisualizer, type CallRecording } from '@/lib/callRecordingService';
import { type Company } from '@/lib/types';
import { getPrimaryPhone } from '../_utils/helpers';

export function useRecording(
  selected: Company | null,
  quickMemo: string,
  callResult: 'connected' | 'no_answer' | 'callback',
  setToast: (msg: string) => void,
  setStep: (s: 'select' | 'record' | 'result') => void,
  refresh: () => void,
) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(16).fill(0));
  const [sttStatus, setSttStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [lastRecording, setLastRecording] = useState<CallRecording | null>(null);

  const recorderRef = useRef(new CallRecorder());
  const visualizerRef = useRef(new AudioVisualizer());
  const waveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    const ok = await recorderRef.current.start();
    if (!ok) { setToast('마이크 접근이 불가합니다'); return; }
    setIsRecording(true); setElapsed(0); setToast('녹음이 시작되었습니다');
    elapsedInterval.current = setInterval(() => setElapsed(s => s + 1), 1000);
    const stream = recorderRef.current.getStream();
    if (stream) {
      visualizerRef.current.connect(stream);
      waveInterval.current = setInterval(() => setWaveformData(visualizerRef.current.getFrequencyData()), 80);
    }
  };

  const stopRecording = async () => {
    if (!selected) return;
    [elapsedInterval, waveInterval].forEach(r => { if (r.current) { clearInterval(r.current); r.current = null; } });
    visualizerRef.current.disconnect();
    const rec = await recorderRef.current.stop();
    setIsRecording(false); setWaveformData(new Array(16).fill(0));
    if (!rec || rec.durationSeconds < 2) { setToast('녹음이 너무 짧습니다 (최소 2초)'); return; }
    setSttStatus('processing'); setStep('result');
    const saved = CallRecordingStore.save({
      companyId: selected.id, companyName: selected.name, salesUserName: '영업팀',
      fileSizeBytes: rec.blob.size, durationSeconds: rec.durationSeconds,
      transcript: '', transcriptSummary: '', callResult, sttStatus: 'processing', sttProvider: 'mock',
      contactName: selected.contactName || '', contactPhone: getPrimaryPhone(selected),
    });
    try {
      // API call
      const stt = await STTService.transcribe(rec.blob, rec.durationSeconds, selected.id);
      const summary = stt.summary;
      const transcript = quickMemo ? `[메모] ${quickMemo}\n\n${stt.transcript}` : stt.transcript;
      CallRecordingStore.updateTranscript(saved.id, transcript, summary, 'completed', stt.audioUrl);
      
      const newCallNote = CallRecordingStore.generateCallNoteText(saved.id, selected.callNote || '');
      if (newCallNote) {
         const { supabaseCompanyStore } = await import('@/lib/supabaseStore');
         await supabaseCompanyStore.update(selected.id, { callNote: newCallNote });
      }

      setSttStatus('completed');
      setLastRecording({ ...saved, transcript, transcriptSummary: summary, sttStatus: 'completed', recordingUrl: stt.audioUrl });
      setToast('✅ 변환 완료 — CRM에 동기화되었습니다');
    } catch (err) {
      console.error(err);
      CallRecordingStore.updateTranscript(saved.id, '', '', 'failed');
      setSttStatus('failed'); setLastRecording({ ...saved, sttStatus: 'failed' });
      setToast('❌ 변환에 실패했습니다. 다시 시도해주세요.');
    }
    refresh();
  };

  const resetRecording = useCallback(() => {
    setSttStatus('idle'); setLastRecording(null); setElapsed(0);
  }, []);

  return { isRecording, elapsed, waveformData, sttStatus, lastRecording, startRecording, stopRecording, resetRecording };
}
