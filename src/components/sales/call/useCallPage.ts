'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Company, CaseStatus,
    type AutoSettings,
} from '@/lib/types';
import { SALES_REPS } from '@/lib/constants';
import { useCompanies, useAutoSettings } from '@/hooks/useDataLayer';
import {
    CallQueueManager, AutoEmailService, FollowUpService,
    RiskAlertService, AIMemoService, NewsLeadService, AutoKakaoService,
    AutoSignatureService, AutoSubscriptionService, EmailTrackingService, ConversionPredictionService,
    type AIMemoResult, type CallQueueItem, type RiskAlert, type KakaoScheduleItem, NEWS_FEED,
} from '@/lib/salesAutomation';
import {
    CallRecorder, STTService, CallRecordingStore, AudioVisualizer,
    formatDuration, type CallRecording,
} from '@/lib/callRecordingService';
import { useTimer, CALLABLE } from '@/lib/callPageUtils';

/* ── Return type ─────────────────────────────────────────────────── */
export interface UseCallPageReturn {
    // state
    companies: Company[];
    search: string;
    setSearch: (v: string) => void;
    selectedId: string | null;
    toast: string;
    setToast: (v: string) => void;
    callResult: string;
    activeCallId: string | null;
    statusFilter: CaseStatus | 'all' | 'my_calls_today';
    setStatusFilter: (v: CaseStatus | 'all' | 'my_calls_today') => void;
    sortKey: 'risk' | 'name' | 'status' | 'contactName' | 'salesRep' | 'phone' | 'conversion' | 'issue' | 'memo' | 'franchiseType';
    sortAsc: boolean;
    showNews: boolean;
    setShowNews: (v: boolean) => void;
    riskAlerts: RiskAlert[];
    callQueue: CallQueueItem[];
    showCallbackModal: boolean;
    setShowCallbackModal: (v: boolean) => void;
    callbackTime: string;
    setCallbackTime: (v: string) => void;
    kakaoTarget: Company | null;
    setKakaoTarget: (v: Company | null) => void;
    kakaoTemplate: number;
    setKakaoTemplate: (v: number) => void;
    kakaoSending: boolean;
    setKakaoSending: (v: boolean) => void;
    kakaoStatuses: Record<string, KakaoScheduleItem>;
    autoSettings: AutoSettings | null;
    contractPreviewTarget: Company | null;
    setContractPreviewTarget: (v: Company | null) => void;
    timer: ReturnType<typeof useTimer>;
    isRecording: boolean;
    sttStatus: string;
    waveformData: number[];
    recordingCounts: Record<string, number>;
    // computed
    filtered: Company[];
    statusCounts: Record<string, number>;
    selected: Company | null;
    calledCount: number;
    highRiskCount: number;
    todayStats: {
        total: number;
        connected: number;
        no_answer: number;
        callback: number;
    };
    newsItems: ReturnType<typeof NewsLeadService.getRelevantNews>;
    // handlers
    selectCompany: (id: string) => void;
    startCall: () => Promise<void>;
    endCall: () => Promise<void>;
    handleCallResult: (r: 'connected' | 'no_answer' | 'callback' | 'rejected' | 'invalid_site') => void;
    confirmCallback: () => void;
    toggleSort: (k: 'risk' | 'name' | 'status' | 'contactName' | 'salesRep' | 'phone' | 'conversion' | 'issue' | 'memo' | 'franchiseType') => void;
    refresh: () => void;
}

/* ── Hook ────────────────────────────────────────────────────────── */
export function useCallPage(userName: string = ''): UseCallPageReturn {
    const { companies: dbCompanies, updateCompany } = useCompanies();
    const { settings: dbSettings } = useAutoSettings();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [toast, setToast] = useState('');
    const [callResult, setCallResult] = useState<'connected' | 'no_answer' | 'callback' | 'rejected' | 'invalid_site' | ''>('');
    const [activeCallId, setActiveCallId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all' | 'my_calls_today'>('all');
    const [sortKey, setSortKey] = useState<'risk' | 'name' | 'status' | 'contactName' | 'salesRep' | 'phone' | 'conversion' | 'issue' | 'memo' | 'franchiseType'>('risk');
    const [sortAsc, setSortAsc] = useState(false);
    const [showNews, setShowNews] = useState(false);
    const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
    const [callQueue, setCallQueue] = useState<CallQueueItem[]>([]);
    const [showCallbackModal, setShowCallbackModal] = useState(false);
    const [callbackTime, setCallbackTime] = useState('');
    const [kakaoTarget, setKakaoTarget] = useState<Company | null>(null);
    const [kakaoTemplate, setKakaoTemplate] = useState(0);
    const [kakaoSending, setKakaoSending] = useState(false);
    const [kakaoStatuses, setKakaoStatuses] = useState<Record<string, KakaoScheduleItem>>({});
    const [autoSettings, setAutoSettings] = useState<AutoSettings | null>(null);
    const [contractPreviewTarget, setContractPreviewTarget] = useState<Company | null>(null);
    const timer = useTimer();

    // ── 🎙️ 녹음 상태 ──
    const recorderRef = useRef<CallRecorder>(new CallRecorder());
    const visualizerRef = useRef<AudioVisualizer>(new AudioVisualizer());
    const [isRecording, setIsRecording] = useState(false);
    const [sttStatus, setSttStatus] = useState<string>('');
    const [waveformData, setWaveformData] = useState<number[]>(new Array(16).fill(0));
    const [recordingCounts, setRecordingCounts] = useState<Record<string, number>>({});
    const waveformInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    /* ── refresh ── */
    const refresh = useCallback(() => {
        setCompanies(dbCompanies.filter(c => CALLABLE.includes(c.status)));
        const counts: Record<string, number> = {};
        const allRecs = CallRecordingStore.getAll();
        allRecs.forEach(r => { counts[r.companyId] = (counts[r.companyId] || 0) + 1; });
        setRecordingCounts(counts);
        setAutoSettings(dbSettings || null);
    }, [dbCompanies, dbSettings]);

    /* ── effects ── */
    useEffect(() => { refresh(); const id = setInterval(refresh, 2000); return () => clearInterval(id); }, [refresh]);
    useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);
    useEffect(() => { if (companies.length > 0) { setRiskAlerts(RiskAlertService.generateAlerts(companies)); setCallQueue(CallQueueManager.getQueue()); } }, [companies]);

    // 🎙️ 모바일 음성 메모 실시간 동기화 리스너
    useEffect(() => {
        let bc: BroadcastChannel | null = null;
        try {
            bc = new BroadcastChannel('ibs-recordings');
            bc.onmessage = (e) => { if (e.data?.type === 'voice-memo-sync') { refresh(); setToast('🎙️ 모바일 음성 메모 수신됨'); } };
        } catch { /* BroadcastChannel 미지원 */ }
        const onStorage = (e: StorageEvent) => { if (e.key === 'ibs_call_recordings') refresh(); };
        const onCustom = () => refresh();
        window.addEventListener('storage', onStorage);
        window.addEventListener('voice-memo-sync', onCustom);
        return () => { bc?.close(); window.removeEventListener('storage', onStorage); window.removeEventListener('voice-memo-sync', onCustom); };
    }, [refresh]);

    // 이메일 발송 상태인 기업에 카카오 자동 예약 + 이메일 트래킹
    useEffect(() => {
        companies.forEach(c => {
            if (['emailed', 'client_viewed', 'client_replied'].includes(c.status)) {
                const existing = AutoKakaoService.getStatus(c.id);
                if (!existing) AutoKakaoService.scheduleAfterEmail(c);
                if (c.status === 'emailed') EmailTrackingService.trackEmail(c);
            }
        });
    }, [companies]);

    // 2초마다 자동화 상태 업데이트 (데모성 자동 상태 변경 로직은 주석 처리)
    useEffect(() => {
        const poll = setInterval(() => {
            const map: Record<string, KakaoScheduleItem> = {};
            AutoKakaoService.getAll().forEach(k => { map[k.companyId] = k; });
            setKakaoStatuses(map);

            /* 
            // 사용자의 요청("멋대로 움직이는거 같아")으로 인해, 
            // 이메일 열람, 서명 감지, 카카오 발송이 "시간 지나면 자동으로" 처리되던 데모 로직을 방지합니다.
            
            const pending = AutoKakaoService.getPendingSends();
            pending.forEach(p => {
                AutoKakaoService.markSent(p.companyId);
                setToast(`💬 카카오 알림톡 자동 발송 → ${p.companyName}`);
            });

            const signed = AutoSignatureService.checkSigned();
            signed.forEach(s => {
                updateCompany(s.companyId, { status: 'contract_signed' });
                setToast(`✍️ 전자서명 자동 감지 → ${s.companyName}`);
                setTimeout(() => {
                    const co = dbCompanies.find(c => c.id === s.companyId);
                    if (co) {
                        AutoSubscriptionService.convertToSubscribed(s.companyId);
                        AutoSubscriptionService.sendOnboardingEmail(co);
                        setToast(`🎉 구독 자동 전환 + 온보딩 이메일 → ${s.companyName}`);
                        refresh();
                    }
                }, 2000);
                refresh();
            });

            const opened = EmailTrackingService.checkOpened();
            opened.forEach(o => {
                setToast(`👁️ 이메일 열람 감지! → ${o.companyName} (${o.contactName}님) — 지금 전화하세요!`);
                updateCompany(o.companyId, { status: 'client_viewed' as any });
                refresh();
            });
            */
        }, 2000);
        return () => clearInterval(poll);
    }, [refresh, dbCompanies, updateCompany, setToast]);

    /* ── computed ── */
    const isToday = (dateStr?: string) => dateStr && dateStr.startsWith(new Date().toISOString().split('T')[0]);

    const filtered = companies.filter(c => {
        if (statusFilter === 'my_calls_today') {
            return isToday(c.lastCallAt) && c.lastCalledBy === userName;
        }
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.biz.includes(q) || (c.contactName || '').includes(q);
    }).sort((a, b) => {
        let d = 0;
        if (sortKey === 'risk') d = (b.riskScore || 0) - (a.riskScore || 0);
        else if (sortKey === 'name') d = a.name.localeCompare(b.name);
        else if (sortKey === 'franchiseType') d = (a.franchiseType?.trim() || '').localeCompare(b.franchiseType?.trim() || '');
        else if (sortKey === 'status') d = CALLABLE.indexOf(a.status) - CALLABLE.indexOf(b.status);
        else if (sortKey === 'contactName') d = (a.contactName || '').localeCompare(b.contactName || '');
        else if (sortKey === 'salesRep') d = (a.lastCalledBy || '').localeCompare(b.lastCalledBy || '');
        else if (sortKey === 'phone') d = ((a.contactPhone || a.phone || '')).localeCompare(b.contactPhone || b.phone || '');
        else if (sortKey === 'conversion') d = ConversionPredictionService.predict(b).score - ConversionPredictionService.predict(a).score;
        else if (sortKey === 'issue') d = (b.issues?.length || 0) - (a.issues?.length || 0);
        else if (sortKey === 'memo') {
            const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            d = tB - tA;
        }
        return sortAsc ? -d : d;
    });

    const statusCounts: Record<string, number> = { all: companies.length };
    companies.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });

    const todayCalls = companies.filter(c => isToday(c.lastCallAt) && c.lastCalledBy === userName);
    const todayStats = {
        total: todayCalls.length,
        connected: todayCalls.filter(c => c.lastCallResult === 'connected').length,
        no_answer: todayCalls.filter(c => c.lastCallResult === 'no_answer').length,
        callback: todayCalls.filter(c => c.lastCallResult === 'callback').length,
    };

    const selected = companies.find(c => c.id === selectedId) || null;
    const calledCount = companies.filter(c => c.callNote).length;
    const highRiskCount = companies.filter(c => c.riskScore >= 70).length;
    const newsItems = NewsLeadService.getRelevantNews(companies);

    /* ── handlers ── */
    const selectCompany = (id: string) => {
        if (selectedId === id) { setSelectedId(null); return; }
        setSelectedId(id); setCallResult('');
    };

    const startCall = async () => {
        if (!selectedId) return;
        setActiveCallId(selectedId); setCallResult(''); timer.start();
        const started = await recorderRef.current.start();
        if (started) {
            setIsRecording(true);
            setToast('🎙️ 녹음 시작 — 마이크 연결됨');
            const stream = recorderRef.current.getStream();
            if (stream) {
                visualizerRef.current.connect(stream);
                waveformInterval.current = setInterval(() => {
                    setWaveformData(visualizerRef.current.getFrequencyData());
                }, 100);
            }
        } else {
            setToast('⚠️ 마이크 접근 불가 — 녹음 없이 통화 진행');
        }
    };

    const handleCallResult = (r: 'connected' | 'no_answer' | 'callback' | 'rejected' | 'invalid_site') => {
        setCallResult(r);
        setToast(r === 'connected' ? '✅ 연결됨' : r === 'no_answer' ? '📵 부재중' : r === 'callback' ? '📋 콜백요청' : r === 'rejected' ? '❌ 거절' : '⚠️ 사이트 이상(패스)');
    };

    const endCall = async () => {
        if (!selected) return;
        const result = callResult || 'connected';
        updateCompany(selected.id, { 
            lastCallResult: result as any, 
            lastCallAt: new Date().toISOString(), 
            lastCalledBy: userName,
            callAttempts: (selected.callAttempts || 0) + 1 
        });
        if (result === 'no_answer') { CallQueueManager.scheduleNoAnswer(selected); setToast('📵 부재중 → 24시간 후 자동 재배치'); }
        else if (result === 'callback') { setShowCallbackModal(true); }
        else if (result === 'rejected' || result === 'invalid_site') { CallQueueManager.removeFromQueue(selected.id); }
        else { CallQueueManager.removeFromQueue(selected.id); if (selected.status === 'analyzed') updateCompany(selected.id, { status: 'lawyer_confirmed', assignedLawyer: SALES_REPS[0] }); }

        if (isRecording) {
            if (waveformInterval.current) { clearInterval(waveformInterval.current); waveformInterval.current = null; }
            visualizerRef.current.disconnect();
            const recResult = await recorderRef.current.stop();
            setIsRecording(false);
            setWaveformData(new Array(16).fill(0));

            if (recResult && recResult.durationSeconds > 2) {
                setSttStatus('processing');
                setToast('🔄 STT 음성 → 텍스트 변환 중...');

                const savedRec = CallRecordingStore.save({
                    companyId: selected.id,
                    companyName: selected.name,
                    salesUserName: '영업팀',
                    fileSizeBytes: recResult.blob.size,
                    durationSeconds: recResult.durationSeconds,
                    transcript: '',
                    transcriptSummary: '',
                    callResult: result as 'connected' | 'no_answer' | 'callback',
                    sttStatus: 'processing',
                    sttProvider: 'mock',
                    contactName: selected.contactName || '',
                    contactPhone: selected.contactPhone || selected.phone,
                });

                try {
                    // Send to actual API server
                    const sttResult = await STTService.transcribe(recResult.blob, recResult.durationSeconds, selected.id);
                    
                    CallRecordingStore.updateTranscript(
                        savedRec.id, 
                        sttResult.transcript, 
                        sttResult.summary, 
                        'completed',
                        sttResult.audioUrl
                    );
                    
                    const newCallNote = CallRecordingStore.generateCallNoteText(savedRec.id, selected.callNote || '');
                    if (newCallNote) {
                        await updateCompany(selected.id, { callNote: newCallNote });
                    }
                    
                    setSttStatus('completed');
                    setToast(`✅ 녹취록 자동 입력 완료 — ${selected.name}`);
                } catch (err: any) {
                    console.error('STT API Error:', err);
                    CallRecordingStore.updateTranscript(savedRec.id, '', '', 'failed');
                    setSttStatus('failed');
                    setToast('⚠️ STT 변환 실패');
                }

                refresh();
                setTimeout(() => setSttStatus(''), 3000);
            }
        }

        setActiveCallId(null); timer.reset(); setCallResult(''); refresh();
        if (result !== 'callback') {
            const idx = filtered.findIndex(co => co.id === selected.id);
            const next = filtered[idx + 1];
            if (next) setTimeout(() => { setSelectedId(next.id); }, 400);
            else setSelectedId(null);
        }
    };

    const confirmCallback = () => {
        if (selected && callbackTime) {
            CallQueueManager.scheduleCallback(selected, callbackTime);
            setToast(`📋 콜백 예약: ${new Date(callbackTime).toLocaleString('ko-KR')}`);
            setShowCallbackModal(false); setCallbackTime('');
        }
    };

    const toggleSort = (k: typeof sortKey) => {
        if (sortKey === k) setSortAsc(!sortAsc);
        else { setSortKey(k); setSortAsc(false); }
    };

    return {
        // state
        companies,
        search, setSearch,
        selectedId,
        toast, setToast,
        callResult,
        activeCallId,
        statusFilter, setStatusFilter,
        sortKey,
        sortAsc,
        showNews, setShowNews,
        riskAlerts,
        callQueue,
        showCallbackModal, setShowCallbackModal,
        callbackTime, setCallbackTime,
        kakaoTarget, setKakaoTarget,
        kakaoTemplate, setKakaoTemplate,
        kakaoSending, setKakaoSending,
        kakaoStatuses,
        autoSettings,
        contractPreviewTarget, setContractPreviewTarget,
        timer,
        isRecording,
        sttStatus,
        waveformData,
        recordingCounts,
        // computed
        filtered,
        statusCounts,
        selected,
        calledCount,
        highRiskCount,
        todayStats,
        newsItems,
        // handlers
        selectCompany,
        startCall,
        endCall,
        handleCallResult,
        confirmCallback,
        toggleSort,
        refresh,
    };
}
