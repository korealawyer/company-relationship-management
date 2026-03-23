// src/lib/callRecordingService.ts — 통화 녹음 + STT 자동 변환 서비스
// MediaRecorder API (브라우저 마이크 녹음) → Mock STT → CRM 자동 입력

import { store, type Company } from './mockStore';

/* ══════════════════════════════════════════════════════════════
   타입 정의
   ══════════════════════════════════════════════════════════════ */

export interface CallRecording {
    id: string;
    companyId: string;
    companyName: string;
    salesUserId?: string;
    salesUserName?: string;
    recordingUrl?: string;
    fileSizeBytes: number;
    durationSeconds: number;
    transcript: string;
    transcriptSummary: string;
    callResult: 'connected' | 'no_answer' | 'callback';
    sttStatus: 'pending' | 'processing' | 'completed' | 'failed';
    sttProvider: 'mock' | 'google' | 'whisper';
    contactName: string;
    contactPhone: string;
    createdAt: string;
    updatedAt: string;
}

/* ══════════════════════════════════════════════════════════════
   1. 브라우저 마이크 녹음 (MediaRecorder API)
   ══════════════════════════════════════════════════════════════ */

export class CallRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private startTime: number = 0;
    private _isRecording = false;

    get isRecording(): boolean {
        return this._isRecording;
    }

    get elapsed(): number {
        if (!this._isRecording || !this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    /** 마이크 권한 요청 + 녹음 시작 */
    async start(): Promise<boolean> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                },
            });

            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: this.getSupportedMimeType(),
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.start(1000); // 1초마다 chunk
            this.startTime = Date.now();
            this._isRecording = true;
            return true;
        } catch (err) {
            console.error('[CallRecorder] 마이크 접근 실패:', err);
            return false;
        }
    }

    /** 녹음 중지 → 오디오 Blob 반환 */
    async stop(): Promise<{ blob: Blob; durationSeconds: number } | null> {
        if (!this.mediaRecorder || !this._isRecording) return null;

        return new Promise((resolve) => {
            this.mediaRecorder!.onstop = () => {
                const blob = new Blob(this.audioChunks, {
                    type: this.getSupportedMimeType(),
                });
                const durationSeconds = Math.floor(
                    (Date.now() - this.startTime) / 1000
                );
                this.cleanup();
                resolve({ blob, durationSeconds });
            };
            this.mediaRecorder!.stop();
        });
    }

    /** 오디오 스트림 반환 (시각화용) */
    getStream(): MediaStream | null {
        return this.stream;
    }

    private cleanup(): void {
        if (this.stream) {
            this.stream.getTracks().forEach((t) => t.stop());
            this.stream = null;
        }
        this.mediaRecorder = null;
        this.audioChunks = [];
        this._isRecording = false;
        this.startTime = 0;
    }

    private getSupportedMimeType(): string {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
        ];
        for (const type of types) {
            if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
        }
        return 'audio/webm';
    }
}

/* ══════════════════════════════════════════════════════════════
   2. STT 서비스 (Mock → 실제 API 교체 가능)
   ══════════════════════════════════════════════════════════════ */

// Mock 통화 스크립트 (데모용)
const MOCK_TRANSCRIPTS: Record<string, string[]> = {
    positive: [
        '안녕하세요, 법률사무소 IBS 영업팀입니다.',
        '네, 저희가 보내드린 개인정보처리방침 진단 보고서 확인하셨나요?',
        '네, 맞습니다. 현재 3가지 법적 리스크가 확인되었는데요.',
        '첫 번째는 수집 항목 법정 기재 누락이고, 두 번째는 제3자 제공 동의 절차 부재입니다.',
        '네, 과태료가 최대 5천만원까지 부과될 수 있어서 사전 대응이 필요합니다.',
        '고객님도 이 부분 인지하고 계셨군요. 그래서 무료 상담을 제안드리려고 합니다.',
        '네, 그러면 다음 주 화요일 오후 2시에 미팅 일정 잡아드리겠습니다.',
        '감사합니다. 그럼 미팅 전에 상세 검토 의견서를 이메일로 보내드리겠습니다.',
        '네, 감사합니다. 좋은 하루 보내세요.',
    ],
    neutral: [
        '안녕하세요, 법률사무소 IBS 영업팀입니다.',
        '네, 개인정보처리방침 관련 법률 검토 결과를 안내드리려고 연락드렸습니다.',
        '현재 법적 리스크 사항이 확인되었는데, 보고서를 검토해 보시겠어요?',
        '네, 이메일로 보내드리겠습니다. 검토 후 연락 주시면 상세 설명 드리겠습니다.',
        '감사합니다. 좋은 하루 되세요.',
    ],
    callback: [
        '안녕하세요, 법률사무소 IBS 영업팀입니다.',
        '네, 개인정보처리방침 관련하여 연락드렸습니다.',
        '아, 지금 회의 중이시군요. 언제 다시 연락드리면 될까요?',
        '네, 내일 오전 10시에 다시 연락드리겠습니다.',
        '감사합니다. 수고하세요.',
    ],
};

export const STTService = {
    /**
     * 음성 Blob → 텍스트 변환 (Mock)
     * 프로덕션: Google Cloud Speech-to-Text 또는 OpenAI Whisper API 연동
     */
    async transcribe(
        _audioBlob: Blob,
        durationSeconds: number,
        callResult: string = 'connected'
    ): Promise<{ transcript: string; segments: string[] }> {
        // Mock: 1.5초 딜레이 (실제 STT 처리 시간 시뮬레이션)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        let segments: string[];
        if (callResult === 'callback') {
            segments = MOCK_TRANSCRIPTS.callback;
        } else if (durationSeconds > 120) {
            segments = MOCK_TRANSCRIPTS.positive;
        } else {
            segments = MOCK_TRANSCRIPTS.neutral;
        }

        // 통화 시간에 맞춰 적절한 수의 문장 선택
        const lineCount = Math.max(
            2,
            Math.min(segments.length, Math.ceil(durationSeconds / 20))
        );
        const selected = segments.slice(0, lineCount);

        const transcript = selected
            .map((line, i) => {
                const min = Math.floor((i * durationSeconds) / lineCount / 60);
                const sec = Math.floor(
                    ((i * durationSeconds) / lineCount) % 60
                );
                const ts = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
                return `[${ts}] ${line}`;
            })
            .join('\n');

        return { transcript, segments: selected };
    },

    /** 녹취록 요약 (AIMemoService와 유사) */
    async summarize(
        transcript: string,
        company: Company
    ): Promise<string> {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const lines = transcript.split('\n').filter((l) => l.trim());
        const contactName = company.contactName || '담당자';

        if (transcript.includes('미팅') || transcript.includes('상담')) {
            return `${contactName}와 통화 완료. 미팅 일정 확정 (긍정적 반응). 상세 검토 의견서 발송 예정.`;
        }
        if (transcript.includes('검토') || transcript.includes('이메일')) {
            return `${contactName}와 통화 완료. 보고서 이메일 발송 요청. 추후 회신 대기.`;
        }
        if (transcript.includes('다시 연락') || transcript.includes('콜백')) {
            return `${contactName} 통화 불가 (회의 중). 콜백 예약 완료.`;
        }
        return `${contactName}와 ${lines.length}건 대화. 후속 조치 확인 필요.`;
    },

    /**
     * 노션 AI 회의록 스타일 단계별 요약
     * → ['🗣️ 상황', '⚖️ 법적 쟁점', '📋 다음 조치', '💰 수임료']
     */
    async summarizeSteps(
        transcript: string,
        clientName: string,
        category: string = '법률'
    ): Promise<string[]> {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const lower = transcript.toLowerCase();
        const firstLine = transcript.split('\n')[0]?.replace(/\[\d+:\d+\]\s?/, '').slice(0, 50) ?? '';

        return [
            `🗣️ **상황**: ${clientName}님이 ${category} 관련 법률 상담 요청. "${firstLine}..."`,
            `⚖️ **법적 쟁점**: ${
                lower.includes('손해') ? '손해배상 청구 가능성 있음' :
                lower.includes('계약') ? '계약 위반 여부 검토 필요' :
                lower.includes('개인정보') ? '개인정보보호법 위반 리스크 확인' :
                lower.includes('가맹') ? '가맹사업법 적용 여부 검토' :
                '법적 리스크 정밀 분석 필요'
            }.`,
            `📋 **다음 조치**: ${
                transcript.includes('미팅') || transcript.includes('상담') ?
                '대면 상담 일정 확정 및 의견서 발송 예정' :
                '관련 자료 수집 후 서면 검토 진행'
            }. 수임 여부 최종 결정 필요.`,
            `💰 **수임료 기대**: ${
                category.includes('형사') ? '500만~1,500만원 (사건 경중 반영)' :
                category.includes('가사') ? '300만~800만원 (재산분할 규모 반영)' :
                category.includes('민사') ? '사건 청구금액의 5~10% + 성공보수' :
                '사건 내용 확인 후 산정 예정'
            }.`,
        ];
    },
};

/* ══════════════════════════════════════════════════════════════
   3. 녹음 데이터 저장소 (localStorage + Supabase Write-Through)
   ══════════════════════════════════════════════════════════════ */

const RECORDINGS_KEY = 'ibs_call_recordings';

export const CallRecordingStore = {
    getAll(): CallRecording[] {
        if (typeof window === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem(RECORDINGS_KEY) || '[]');
        } catch {
            return [];
        }
    },

    _save(recordings: CallRecording[]): void {
        localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
        // 실시간 동기화 이벤트 발행 (다른 탭/기기)
        this._dispatchSync();
    },

    /** 동기화 이벤트 발행 */
    _dispatchSync(): void {
        if (typeof window === 'undefined') return;
        // BroadcastChannel (같은 브라우저 다른 탭)
        try {
            const bc = new BroadcastChannel('ibs-recordings');
            bc.postMessage({ type: 'voice-memo-sync', timestamp: Date.now() });
            bc.close();
        } catch { /* BroadcastChannel 미지원 환경 무시 */ }
        // 커스텀 이벤트 (같은 탭)
        window.dispatchEvent(new CustomEvent('voice-memo-sync'));
    },

    /** 새 녹음 저장 */
    save(recording: Omit<CallRecording, 'id' | 'createdAt' | 'updatedAt'>): CallRecording {
        const all = this.getAll();
        const now = new Date().toISOString();
        const entry: CallRecording = {
            ...recording,
            id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            createdAt: now,
            updatedAt: now,
        };
        all.unshift(entry);
        this._save(all);

        // 타임라인에도 기록
        this.addToTimeline(entry);

        return entry;
    },

    /** STT 결과 업데이트 */
    updateTranscript(
        recordingId: string,
        transcript: string,
        summary: string,
        status: CallRecording['sttStatus'] = 'completed'
    ): void {
        const all = this.getAll();
        const rec = all.find((r) => r.id === recordingId);
        if (rec) {
            rec.transcript = transcript;
            rec.transcriptSummary = summary;
            rec.sttStatus = status;
            rec.updatedAt = new Date().toISOString();
            this._save(all);
        }
    },

    /** 기업별 녹음 내역 조회 */
    getByCompany(companyId: string): CallRecording[] {
        return this.getAll().filter((r) => r.companyId === companyId);
    },

    /** 최근 녹음 (전체) */
    getRecent(limit = 10): CallRecording[] {
        return this.getAll().slice(0, limit);
    },

    /** 기업별 녹음 횟수 */
    getCount(companyId: string): number {
        return this.getByCompany(companyId).length;
    },

    /** 타임라인에 녹음 이벤트 추가 */
    addToTimeline(recording: CallRecording): void {
        const company = store.getById(recording.companyId);
        if (!company) return;

        const timelineEvent = {
            id: `tl-${Date.now()}`,
            createdAt: recording.createdAt,
            author: recording.salesUserName || '영업팀',
            type: 'call' as const,
            content: recording.sttStatus === 'completed'
                ? `📞 통화 녹음 (${formatDuration(recording.durationSeconds)}) — ${recording.transcriptSummary || 'STT 변환 완료'}`
                : `📞 통화 녹음 (${formatDuration(recording.durationSeconds)}) — STT 변환 중...`,
        };

        const updatedTimeline = [timelineEvent, ...(company.timeline || [])];
        store.update(recording.companyId, { timeline: updatedTimeline });
    },

    /** CRM callNote에도 자동 반영 */
    syncToCallNote(recordingId: string): void {
        const rec = this.getAll().find((r) => r.id === recordingId);
        if (!rec || !rec.transcript) return;

        const company = store.getById(rec.companyId);
        if (!company) return;

        const dateStr = new Date(rec.createdAt).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const newNote = [
            company.callNote || '',
            '',
            `──── 🎙️ 자동 녹취 (${dateStr}, ${formatDuration(rec.durationSeconds)}) ────`,
            rec.transcript,
            '',
            rec.transcriptSummary
                ? `📌 AI 요약: ${rec.transcriptSummary}`
                : '',
        ]
            .filter(Boolean)
            .join('\n')
            .trim();

        store.update(rec.companyId, { callNote: newNote });
    },
};

/* ── 유틸 ───────────────────────────────────────────────── */

export function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}분 ${s}초`;
}

/* ══════════════════════════════════════════════════════════════
   4. 오디오 시각화 (파형 애니메이션)
   ══════════════════════════════════════════════════════════════ */

export class AudioVisualizer {
    private analyser: AnalyserNode | null = null;
    private dataArray: Uint8Array<ArrayBuffer> | null = null;
    private audioContext: AudioContext | null = null;

    connect(stream: MediaStream): void {
        this.audioContext = new AudioContext();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    }

    /** 현재 주파수 데이터 반환 (0~255 범위, 바 개수 = fftSize/2) */
    getFrequencyData(): number[] {
        if (!this.analyser || !this.dataArray) return new Array(16).fill(0);
        this.analyser.getByteFrequencyData(this.dataArray);
        return Array.from(this.dataArray).slice(0, 16);
    }

    disconnect(): void {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.analyser = null;
        this.dataArray = null;
    }
}
