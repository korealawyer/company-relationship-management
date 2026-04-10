'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Company, CaseStatus,
    type AutoSettings,
} from '@/lib/types';
import { SALES_REPS } from '@/lib/constants';
import { useAutoSettings, usePaginatedCompanies, useCompanyStats, useCompanyMutations } from '@/hooks/useDataLayer';
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
    columnFilters: Record<string, string[]>;
    setColumnFilter: (k: string, values: string[]) => void;
    selectedId: string | null;
    toast: string;
    setToast: (v: string) => void;
    callResult: string;
    activeCallId: string | null;
    statusFilter: string;
    setStatusFilter: (v: string) => void;
    sortKey: string;
    sortAsc: boolean;
    page: number;
    setPage: (v: number) => void;
    count: number;
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
        rejected: number;
        invalid_site: number;
    };
    newsItems: ReturnType<typeof NewsLeadService.getRelevantNews>;
    // handlers
    selectCompany: (id: string) => void;
    startCall: () => Promise<void>;
    endCall: () => Promise<void>;
    handleCallResult: (r: 'connected' | 'no_answer' | 'callback' | 'rejected' | 'invalid_site') => void;
    confirmCallback: () => void;
    toggleSort: (k: string) => void;
    refresh: () => void;
    deleteCompany: (id: string) => Promise<void>;
}

/* ── Hook ────────────────────────────────────────────────────────── */
export function useCallPage(userId: string = '', userName: string = ''): UseCallPageReturn {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortKey, setSortKey] = useState<string>('risk_score');
    const [sortAsc, setSortAsc] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [sortKey, sortAsc, statusFilter]);

    const { companies: dbCompanies, count } = usePaginatedCompanies({
        page, limit: 50, search: debouncedSearch, status: statusFilter === 'all' || statusFilter === 'my_calls_today' ? undefined : statusFilter,
        sortBy: sortKey === 'name' ? 'name' : sortKey === 'risk' ? 'risk_score' : 'created_at', sortAsc
    });
    const { stats: dbStats } = useCompanyStats();
    const { updateCompany, deleteCompany } = useCompanyMutations();
    const { settings: dbSettings } = useAutoSettings();
    const companies = useMemo(() => {
        let list = dbCompanies;
        
        // 프론트엔드 실시간 격리 로직 (낙관적 UI 업데이트 대응)
        if (statusFilter !== 'rejected' && statusFilter !== 'invalid_site') {
            list = list.filter(c => c.status !== 'rejected' && c.status !== 'invalid_site');
        }

        return list;
    }, [dbCompanies, statusFilter]);
    const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [toast, setToast] = useState('');
    const [callResult, setCallResult] = useState<'connected' | 'no_answer' | 'callback' | 'rejected' | 'invalid_site' | ''>('');
    const [activeCallId, setActiveCallId] = useState<string | null>(null);
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
        const counts: Record<string, number> = {};
        const allRecs = CallRecordingStore.getAll();
        allRecs.forEach(r => { counts[r.companyId] = (counts[r.companyId] || 0) + 1; });
        setRecordingCounts(counts);
        setAutoSettings(dbSettings || null);
    }, [dbSettings]);

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

    const isToday = (dateStr?: string) => {
        if (!dateStr) return false;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return new Date(dateStr) >= todayStart;
    };

    // 글로벌 통계를 저장 (페이지네이션과 무관하게 전체 데이터 기준)
    const [globalStats, setGlobalStats] = useState({
        calledCount: 0,
        highRiskCount: 0,
        todayStats: { total: 0, connected: 0, no_answer: 0, callback: 0, rejected: 0, invalid_site: 0 }
    });

    const refreshGlobalStats = useCallback(async () => {
        // useDataLayer.ts 등에서 사용하는 supabase client 획득을 위해
        // 브라우저 환경에서만 동작하도록 처리
        const { getBrowserSupabase } = await import('@/lib/supabase');
        const sb = getBrowserSupabase();
        if (!sb) return;

        try {
            // 통화 메모가 있는(연락된) 카운트
            const { count: cCount } = await sb.from('companies').select('*', { count: 'exact', head: true }).not('call_note', 'is', 'null').not('call_note', 'eq', '');
            
            // 고위험군 카운트
            const { count: hCount } = await sb.from('companies').select('*', { count: 'exact', head: true }).gte('risk_score', 70);

            // 오늘 나의 통화 결과 카운트
            let todayTotal = 0, connected = 0, no_answer = 0, callback = 0, rejected = 0, invalid_site = 0;
            if (userName) {
                const md = new Date();
                md.setHours(0, 0, 0, 0);
                const startOfToday = md.toISOString();

                const { data } = await sb.from('companies')
                    .select('last_call_result')
                    .eq('last_called_by', userName)
                    .gte('last_call_at', startOfToday);
                    
                if (data) {
                    todayTotal = data.length;
                    for (const row of data) {
                        if (row.last_call_result === 'connected') connected++;
                        else if (row.last_call_result === 'no_answer') no_answer++;
                        else if (row.last_call_result === 'callback') callback++;
                        else if (row.last_call_result === 'rejected') rejected++;
                        else if (row.last_call_result === 'invalid_site') invalid_site++;
                    }
                }
            }

            setGlobalStats({
                calledCount: cCount || 0,
                highRiskCount: hCount || 0,
                todayStats: { total: todayTotal, connected, no_answer, callback, rejected, invalid_site }
            });
        } catch (e) {
            console.error('Failed to fetch global stats:', e);
        }
    }, [userName]);

    useEffect(() => {
        refreshGlobalStats();
    }, [refreshGlobalStats]);

    const filtered = companies.filter(c => {
        if (statusFilter === 'my_calls_today') {
            if (!(isToday(c.lastCallAt) && c.lastCalledBy === userName)) return false;
        } else if (statusFilter !== 'all' && c.status !== statusFilter) {
            return false;
        }
        
        const q = search.toLowerCase();
        if (q && !(c.name.toLowerCase().includes(q) || c.biz.includes(q) || (c.contactName || '').includes(q))) {
            return false;
        }

        // Column filters
        for (const [key, selectedValues] of Object.entries(columnFilters)) {
            if (!selectedValues || selectedValues.length === 0) continue;
            
            let val = '';
            // Match the keys passed by the header
            if (key === 'franchiseType') val = c.franchiseType?.trim() || '';
            else if (key === 'status') val = c.status || '';
            else if (key === 'risk') val = String(c.riskScore || 0); // Need to parse risk levels if you format it
            else if (key === 'contactName') val = c.contactName || '';
            else if (key === 'salesRep') val = c.lastCalledBy || '';
            else if (key === 'phone') val = c.contactPhone || c.phone || '';
            else if (key === 'name') val = c.name || '';
            else if (key === 'conversion') val = String(ConversionPredictionService.predict(c).score || 0);
            
            if (!selectedValues.includes(val)) return false;
        }
        
        return true;
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
        
        // 2차 정렬: 동일한 값일 때 순서가 무작위로 뒤섞이는 것(Jumping) 방지
        if (d === 0) {
            d = a.id.localeCompare(b.id);
        }
        
        return sortAsc ? -d : d;
    });

    const statusCounts = dbStats?.statusCounts || { all: dbCompanies.length };

    const selected = companies.find(c => c.id === selectedId) || null;
    const calledCount = globalStats.calledCount;
    const highRiskCount = globalStats.highRiskCount;
    const todayStats = globalStats.todayStats;
    const newsItems = NewsLeadService.getRelevantNews(companies);

    /* ── handlers ── */
    const claimLock = async (companyId: string) => {
        if (!userId) return;
        try {
            await fetch('/api/call-lock/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId, userId, userName })
            });
        } catch(e) { console.error('Failed to claim lock', e); }
    };

    const releaseLock = async (companyId: string) => {
        if (!userId) return;
        try {
            await fetch('/api/call-lock/release', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({ companyId, userId })
            });
        } catch(e) { console.error('Failed to release lock', e); }
    };

    const selectCompany = (id: string | null) => {
        if (selectedId === id) { 
            if (id) releaseLock(id);
            setSelectedId(null); 
            return; 
        }
        if (selectedId) {
            releaseLock(selectedId);
        }
        if (id) {
            claimLock(id);
        }
        setSelectedId(id); setCallResult('');
    };

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (selectedId) {
                releaseLock(selectedId);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (selectedId) {
                releaseLock(selectedId);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, userId, userName]);

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
        
        const patchData: any = { 
            lastCallResult: result as any, 
            lastCallAt: new Date().toISOString(), 
            lastCalledBy: userName,
            callAttempts: (selected.callAttempts || 0) + 1 
        };

        if (result === 'rejected' || result === 'invalid_site') {
            patchData.status = result;
        }

        updateCompany(selected.id, patchData);
        
        if (result === 'no_answer') { CallQueueManager.scheduleNoAnswer(selected); setToast('📵 부재중 → 24시간 후 자동 재배치'); }
        else if (result === 'callback') { setShowCallbackModal(true); }
        else if (result === 'rejected' || result === 'invalid_site') { 
            CallQueueManager.removeFromQueue(selected.id); 
            setToast(result === 'rejected' ? '❌ 거절 처리되었습니다.' : '⚠️ 사이트 이상 분류 완료'); 
        }
        else { 
            CallQueueManager.removeFromQueue(selected.id); 
            if (selected.status === 'analyzed') updateCompany(selected.id, { status: 'reviewing', assignedLawyer: SALES_REPS[0] }); 
        }

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
            setTimeout(() => { selectCompany(null); }, 400);
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

    const setColumnFilter = (k: string, values: string[]) => {
        setColumnFilters(prev => ({ ...prev, [k]: values }));
    };

    return {
        // state
        companies,
        search, setSearch,
        columnFilters, setColumnFilter,
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
        page, setPage, count,
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
        deleteCompany,
    };
}
