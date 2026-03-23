// src/lib/salesAutomation.ts — 영업 자동화 엔진
// 6가지 자동화 기능을 통합 관리하는 서비스 모듈

import { store, Company } from './mockStore';

/* ══════════════════════════════════════════════════════════════
   1. 콜 스케줄링 자동 큐
   ══════════════════════════════════════════════════════════════ */

export interface CallQueueItem {
    companyId: string;
    companyName: string;
    scheduledAt: string;      // ISO 날짜
    reason: 'no_answer' | 'callback' | 'follow_up' | 'high_risk';
    attempts: number;
    priority: number;         // 1=최고, 5=최저
}

const CALL_QUEUE_KEY = 'ibs_call_queue';

export const CallQueueManager = {
    getQueue(): CallQueueItem[] {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem(CALL_QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    addToQueue(item: Omit<CallQueueItem, 'priority'>): void {
        const queue = this.getQueue();
        const priority = item.reason === 'high_risk' ? 1
            : item.reason === 'callback' ? 2
            : item.reason === 'follow_up' ? 3 : 4;
        queue.push({ ...item, priority });
        queue.sort((a, b) => a.priority - b.priority);
        localStorage.setItem(CALL_QUEUE_KEY, JSON.stringify(queue));
    },

    removeFromQueue(companyId: string): void {
        const queue = this.getQueue().filter(q => q.companyId !== companyId);
        localStorage.setItem(CALL_QUEUE_KEY, JSON.stringify(queue));
    },

    scheduleNoAnswer(company: Company): CallQueueItem {
        const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const item: Omit<CallQueueItem, 'priority'> = {
            companyId: company.id,
            companyName: company.name,
            scheduledAt,
            reason: 'no_answer',
            attempts: (company.callAttempts || 0) + 1,
        };
        this.addToQueue(item);
        return { ...item, priority: 4 };
    },

    scheduleCallback(company: Company, callbackTime: string): CallQueueItem {
        const item: Omit<CallQueueItem, 'priority'> = {
            companyId: company.id,
            companyName: company.name,
            scheduledAt: callbackTime,
            reason: 'callback',
            attempts: (company.callAttempts || 0) + 1,
        };
        this.addToQueue(item);
        return { ...item, priority: 2 };
    },

    getUpcoming(limit = 5): CallQueueItem[] {
        const now = new Date().toISOString();
        return this.getQueue()
            .filter(q => q.scheduledAt <= now || q.reason === 'high_risk')
            .slice(0, limit);
    },

    getPendingCount(): number {
        return this.getQueue().length;
    },
};

/* ══════════════════════════════════════════════════════════════
   2. 이메일 자동 발송
   ══════════════════════════════════════════════════════════════ */

export interface AutoEmailConfig {
    enabled: boolean;
    triggerOnAnalyzed: boolean;    // 분석완료 → 즉시 발송
    autoFollowUp: boolean;         // 팔로업 시퀀스 활성화
}

const EMAIL_CONFIG_KEY = 'ibs_auto_email_config';

export const AutoEmailService = {
    getConfig(): AutoEmailConfig {
        if (typeof window === 'undefined') return { enabled: true, triggerOnAnalyzed: true, autoFollowUp: true };
        const raw = localStorage.getItem(EMAIL_CONFIG_KEY);
        return raw ? JSON.parse(raw) : { enabled: true, triggerOnAnalyzed: true, autoFollowUp: true };
    },

    setConfig(config: Partial<AutoEmailConfig>): void {
        const current = this.getConfig();
        localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify({ ...current, ...config }));
    },

    // 분석 완료 시 자동 이메일 발송 로직 (mock)
    shouldAutoSend(company: Company): boolean {
        const config = this.getConfig();
        return config.enabled && config.triggerOnAnalyzed && company.status === 'analyzed';
    },
};

/* ══════════════════════════════════════════════════════════════
   3. 팔로업 이메일 시퀀스
   ══════════════════════════════════════════════════════════════ */

export interface FollowUpStep {
    step: number;          // 1=D1, 2=D3, 3=D7
    dayOffset: number;     // 발송 후 경과일
    subject: string;
    sentAt?: string;
    opened?: boolean;
    status: 'pending' | 'sent' | 'opened' | 'skipped';
}

// D+1 1회 팔로업만 운영 — 그 이후는 영업팀 수동 판단
export const FOLLOW_UP_SEQUENCE: Omit<FollowUpStep, 'sentAt' | 'opened' | 'status'>[] = [
    { step: 1, dayOffset: 1, subject: '📊 [IBS 법률] 개인정보 리스크 진단 보고서를 확인해주세요' },
];

export const FollowUpService = {
    getSteps(company: Company): FollowUpStep[] {
        const emailSent = company.emailSentAt;
        if (!emailSent) return FOLLOW_UP_SEQUENCE.map(s => ({ ...s, status: 'pending' as const }));

        const sentDate = new Date(emailSent);
        const now = new Date();
        const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

        // 답장을 받았으면 시퀀스 중단
        if (company.clientReplied) {
            return FOLLOW_UP_SEQUENCE.map(s => ({
                ...s,
                status: 'skipped' as const,
                sentAt: daysSinceSent >= s.dayOffset
                    ? new Date(sentDate.getTime() + s.dayOffset * 86400000).toISOString()
                    : undefined,
            }));
        }

        return FOLLOW_UP_SEQUENCE.map(s => {
            if (daysSinceSent >= s.dayOffset) {
                return {
                    ...s,
                    status: 'sent' as const,
                    sentAt: new Date(sentDate.getTime() + s.dayOffset * 86400000).toLocaleDateString('ko-KR'),
                    opened: Math.random() > 0.5,
                };
            }
            return { ...s, status: 'pending' as const };
        });
    },

    getNextStep(company: Company): FollowUpStep | null {
        const steps = this.getSteps(company);
        return steps.find(s => s.status === 'pending') || null;
    },

    getCurrentStep(company: Company): number {
        const steps = this.getSteps(company);
        const sent = steps.filter(s => s.status === 'sent' || s.status === 'opened');
        return sent.length;
    },
};

/* ══════════════════════════════════════════════════════════════
   5. 고위험 기업 우선 알림
   ══════════════════════════════════════════════════════════════ */

export interface RiskAlert {
    id: string;
    companyId: string;
    companyName: string;
    riskScore: number;
    message: string;
    createdAt: string;
    dismissed: boolean;
}

export const RiskAlertService = {
    generateAlerts(companies: Company[]): RiskAlert[] {
        return companies
            .filter(c => c.riskScore >= 70 && !c.callNote)
            .map(c => ({
                id: `alert-${c.id}`,
                companyId: c.id,
                companyName: c.name,
                riskScore: c.riskScore,
                message: `${c.name} 리스크 ${c.riskScore}점 — 즉시 전화 필요`,
                createdAt: new Date().toISOString(),
                dismissed: false,
            }))
            .sort((a, b) => b.riskScore - a.riskScore);
    },

    getUrgentCount(companies: Company[]): number {
        return companies.filter(c => c.riskScore >= 70 && !c.callNote).length;
    },
};

/* ══════════════════════════════════════════════════════════════
   6. AI 메모 요약 + 다음 액션 추천
   ══════════════════════════════════════════════════════════════ */

export interface AIMemoResult {
    summary: string;
    keyPoints: string[];
    nextAction: string;
    nextActionType: 'send_contract' | 'schedule_meeting' | 'follow_up_call' | 'send_email' | 'escalate';
    confidence: number;   // 0~100
}

export const AIMemoService = {
    async analyze(company: Company, memo: string): Promise<AIMemoResult> {
        // Mock AI 분석 (실제 환경에서는 API 호출)
        await new Promise(resolve => setTimeout(resolve, 1200));

        const lowerMemo = memo.toLowerCase();
        const hasPositive = ['긍정', '관심', '좋', '검토', '계약', '가능', '동의', '확인'].some(w => memo.includes(w));
        const hasNegative = ['거절', '불필요', '나중', '다음', '보류', '관심없'].some(w => memo.includes(w));
        const hasCallback = ['콜백', '연락', '다시', '시간'].some(w => memo.includes(w));
        const hasMeeting = ['미팅', '방문', '만남', '상담'].some(w => memo.includes(w));

        let nextAction: string;
        let nextActionType: AIMemoResult['nextActionType'];
        let confidence: number;

        if (hasPositive && !hasNegative) {
            if (hasMeeting) {
                nextAction = '미팅 일정 잡기 — 고객 관심도 높음';
                nextActionType = 'schedule_meeting';
                confidence = 85;
            } else if (['client_replied', 'client_viewed'].includes(company.status)) {
                nextAction = '계약서 발송 추천 — 전환 가능성 높음';
                nextActionType = 'send_contract';
                confidence = 80;
            } else {
                nextAction = '팔로업 이메일 발송 — 관심 유지';
                nextActionType = 'send_email';
                confidence = 70;
            }
        } else if (hasCallback) {
            nextAction = '콜백 예약 — 고객 요청';
            nextActionType = 'follow_up_call';
            confidence = 75;
        } else if (hasNegative) {
            nextAction = '7일 후 재연락 — 시간 확보';
            nextActionType = 'follow_up_call';
            confidence = 40;
        } else {
            nextAction = '팔로업 이메일 발송 — 추가 정보 제공';
            nextActionType = 'send_email';
            confidence = 55;
        }

        // 핵심 키포인트 추출 (mock)
        const sentences = memo.split(/[.!?\n]+/).filter(s => s.trim().length > 3);
        const keyPoints = sentences.length > 0
            ? sentences.slice(0, 3).map(s => s.trim())
            : ['통화 내용 기록됨'];

        const summary = sentences.length > 0
            ? `${company.contactName || '담당자'}와 통화 완료. ${keyPoints[0]}.`
            : `${company.name} 통화 완료 — 상세 내용 기록됨`;

        return { summary, keyPoints, nextAction, nextActionType, confidence };
    },
};

/* ══════════════════════════════════════════════════════════════
   [삭제됨] 뉴스 기반 리드 생성 — 실제 뉴스 API 미연동으로 제거
   ══════════════════════════════════════════════════════════════ */
// 실제 BigKinds / 연합뉴스 API 연동 시 복원 예정
export interface NewsItem {
    id: string;
    title: string;
    source: string;
    date: string;
    category: 'pipc' | 'fine' | 'franchise' | 'regulation';
    summary: string;
    relatedBizTypes: string[];
    urgency: 'high' | 'medium' | 'low';
}

export const NEWS_FEED: NewsItem[] = [];

// NewsLeadService 비활성화 — 실시간 뉴스 API 연동 전까지 사용 안 함
export const NewsLeadService = {
    getRelevantNews(_companies: Company[], _limit = 3): (NewsItem & { matchCount: number })[] { return []; },
    getNewLeadSuggestions(_companies: Company[]): { company: Company; reason: string; newsId: string }[] { return []; },
    getCategoryIcon(_category: NewsItem['category']): string { return '📰'; },
    getUrgencyColor(_urgency: NewsItem['urgency']): string { return '#64748b'; },
};




/* ══════════════════════════════════════════════════════════════
   8. 카카오 알림톡 자동 발송 (이메일 발송 5분 후)
   ══════════════════════════════════════════════════════════════ */

export interface KakaoScheduleItem {
    companyId: string;
    companyName: string;
    contactName: string;
    phone: string;
    template: 'report' | 'followup' | 'remind';
    scheduledAt: string;   // ISO — 발송 예정 시각
    sentAt?: string;       // ISO — 실제 발송 시각
    status: 'scheduled' | 'sending' | 'sent' | 'failed';
}

const KAKAO_SCHEDULE_KEY = 'ibs_kakao_schedule';

export const AutoKakaoService = {
    getAll(): KakaoScheduleItem[] {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem(KAKAO_SCHEDULE_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    _save(items: KakaoScheduleItem[]): void {
        localStorage.setItem(KAKAO_SCHEDULE_KEY, JSON.stringify(items));
    },

    /** 이메일 발송 직후 호출 → 5분 뒤 자동 카카오 예약 */
    scheduleAfterEmail(company: Company): KakaoScheduleItem {
        const items = this.getAll();
        // 중복 방지
        const existing = items.find(i => i.companyId === company.id && i.status === 'scheduled');
        if (existing) return existing;

        const entry: KakaoScheduleItem = {
            companyId: company.id,
            companyName: company.name,
            contactName: company.contactName || '담당자',
            phone: company.contactPhone || company.phone,
            template: 'report',
            scheduledAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5분 뒤
            status: 'scheduled',
        };
        items.push(entry);
        this._save(items);
        return entry;
    },

    /** 예약 시각이 지난 아이템 중 아직 미발송인 것 */
    getPendingSends(): KakaoScheduleItem[] {
        const now = new Date().toISOString();
        return this.getAll().filter(i => i.status === 'scheduled' && i.scheduledAt <= now);
    },

    /** 발송 완료 처리 */
    markSent(companyId: string): void {
        const items = this.getAll().map(i =>
            i.companyId === companyId && i.status === 'scheduled'
                ? { ...i, status: 'sent' as const, sentAt: new Date().toISOString() }
                : i
        );
        this._save(items);
    },

    /** 특정 기업의 카카오 스케줄 상태 */
    getStatus(companyId: string): KakaoScheduleItem | null {
        const items = this.getAll();
        return items.find(i => i.companyId === companyId) || null;
    },

    /** 예약 취소 */
    cancel(companyId: string): void {
        const items = this.getAll().filter(i => i.companyId !== companyId);
        this._save(items);
    },

    /** 남은 시간(초) — 0 이하면 발송 시점 경과 */
    getRemainingSeconds(item: KakaoScheduleItem): number {
        return Math.max(0, Math.floor((new Date(item.scheduledAt).getTime() - Date.now()) / 1000));
    },
};

/* ══════════════════════════════════════════════════════════════
   8. 서명 자동 감지 서비스
   contract_sent 상태 → 일정 시간 후 contract_signed 자동 전환 (시뮬레이션)
   프로덕션: 전자서명 API 웹훅 (모두싸인/카카오페이 서명) 연동
   ══════════════════════════════════════════════════════════════ */

const SIGNATURE_KEY = 'ibs_auto_signature';

export interface SignatureWatch {
    companyId: string;
    companyName: string;
    sentAt: string;
    autoDetectAt: string; // 자동 감지 예정 시각
    status: 'watching' | 'signed' | 'expired';
}

export const AutoSignatureService = {
    _load(): SignatureWatch[] {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(localStorage.getItem(SIGNATURE_KEY) || '[]'); } catch { return []; }
    },
    _save(items: SignatureWatch[]) { localStorage.setItem(SIGNATURE_KEY, JSON.stringify(items)); },

    /** 계약서 발송 시 서명 감시 등록 (30초 후 자동 감지 — 데모용, 프로덕션: 웹훅) */
    watchForSignature(company: Company): SignatureWatch {
        const items = this._load();
        const existing = items.find(i => i.companyId === company.id);
        if (existing) return existing;
        const entry: SignatureWatch = {
            companyId: company.id,
            companyName: company.name,
            sentAt: new Date().toISOString(),
            autoDetectAt: new Date(Date.now() + 30 * 1000).toISOString(), // 30초 후 (데모)
            status: 'watching',
        };
        items.push(entry);
        this._save(items);
        return entry;
    },

    /** 서명 완료된 기업 체크 (폴링) */
    checkSigned(): SignatureWatch[] {
        const now = new Date().toISOString();
        const items = this._load();
        const signed: SignatureWatch[] = [];
        items.forEach(i => {
            if (i.status === 'watching' && i.autoDetectAt <= now) {
                i.status = 'signed';
                signed.push(i);
            }
        });
        if (signed.length > 0) this._save(items);
        return signed;
    },

    getAll(): SignatureWatch[] { return this._load(); },
    getStatus(companyId: string): SignatureWatch | null {
        return this._load().find(i => i.companyId === companyId) || null;
    },
};

/* ══════════════════════════════════════════════════════════════
   9. 구독 자동 전환 서비스
   contract_signed → subscribed 자동 전환 + 온보딩 이메일 발송
   ══════════════════════════════════════════════════════════════ */

export const AutoSubscriptionService = {
    /** 서명 완료 → 구독 자동 전환 */
    convertToSubscribed(companyId: string): void {
        store.update(companyId, {
            status: 'subscribed' as any,
            plan: 'starter',
        });
    },

    /** 온보딩 이메일 발송 시뮬레이션 */
    sendOnboardingEmail(company: Company): string {
        const subject = `[IBS 법률사무소] ${company.name} 서비스 이용 안내`;
        const body = `${company.contactName || '담당자'}님, ${company.name}의 서비스 가입이 완료되었습니다.\n\n` +
            `■ 가입 플랜: Entry\n` +
            `■ 담당 변호사: ${company.assignedLawyer || '배정 예정'}\n` +
            `■ 대시보드: https://ibs-crm.vercel.app/dashboard\n\n` +
            `가입을 환영합니다! 편하신 시간에 대시보드에서 서류를 확인해 주세요.`;
        // 프로덕션: 실제 이메일 API 호출
        console.log(`[Onboarding Email] ${subject}\n${body}`);
        return subject;
    },
};

/* ══════════════════════════════════════════════════════════════
   10. 이메일 열람 감지 + 알림 서비스
   이메일 발송 후 고객 열람 감지 → 영업팀 즉시 알림
   프로덕션: SendGrid/Mailgun 오픈 트래킹 웹훅 연동
   ══════════════════════════════════════════════════════════════ */

const EMAIL_TRACKING_KEY = 'ibs_email_tracking';

export interface EmailTrackEntry {
    companyId: string;
    companyName: string;
    contactName: string;
    emailSentAt: string;
    openedAt: string | null;
    autoOpenAt: string; // 시뮬: 자동 열람 감지 시각
    alerted: boolean;
}

export const EmailTrackingService = {
    _load(): EmailTrackEntry[] {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(localStorage.getItem(EMAIL_TRACKING_KEY) || '[]'); } catch { return []; }
    },
    _save(items: EmailTrackEntry[]) { localStorage.setItem(EMAIL_TRACKING_KEY, JSON.stringify(items)); },

    /** 이메일 발송 시 트래킹 등록 (20초 후 열람 시뮬 — 데모) */
    trackEmail(company: Company): void {
        const items = this._load();
        if (items.find(i => i.companyId === company.id)) return;
        items.push({
            companyId: company.id,
            companyName: company.name,
            contactName: company.contactName || '담당자',
            emailSentAt: new Date().toISOString(),
            openedAt: null,
            autoOpenAt: new Date(Date.now() + 20 * 1000).toISOString(), // 20초 (데모)
            alerted: false,
        });
        this._save(items);
    },

    /** 열람된 이메일 체크 (미알림 건만) */
    checkOpened(): EmailTrackEntry[] {
        const now = new Date().toISOString();
        const items = this._load();
        const opened: EmailTrackEntry[] = [];
        items.forEach(i => {
            if (!i.openedAt && i.autoOpenAt <= now) {
                i.openedAt = now;
            }
            if (i.openedAt && !i.alerted) {
                i.alerted = true;
                opened.push(i);
            }
        });
        if (opened.length > 0) this._save(items);
        return opened;
    },

    getAll(): EmailTrackEntry[] { return this._load(); },
};

/* ══════════════════════════════════════════════════════════════
   11. 전환 확률 예측 서비스
   기업 데이터 기반 전환 가능성 점수 (0~100%)
   ══════════════════════════════════════════════════════════════ */

export const ConversionPredictionService = {
    /** 전환 확률 계산 — 7가지 신호 종합 */
    predict(company: Company): { score: number; factors: string[]; level: 'HOT' | 'WARM' | 'COLD'; urgency: string } {
        let score = 15; // 기본 15%
        const factors: string[] = [];

        // ① 파이프라인 단계 — 핵심 지표 (가중치 최대)
        const stageScores: Record<string, number> = {
            pending: 0, crawling: 0, analyzed: 5, assigned: 8,
            reviewing: 10, lawyer_confirmed: 15, emailed: 20,
            client_logged_in: 35, tour_completed: 45,
            client_viewed: 30, client_replied: 40,
            subscribed: 99,
        };
        const stageBonus = stageScores[company.status] ?? 0;
        if (stageBonus > 0) { score += stageBonus; factors.push(`파이프라인: ${company.status}`); }

        // ② 법적 위험도 (니즈 크기)
        if (company.riskScore >= 80) { score += 20; factors.push(`리스크 ${company.riskScore}점 — 즉각 대응 필요`); }
        else if (company.riskScore >= 60) { score += 12; factors.push(`리스크 ${company.riskScore}점 — 높음`); }
        else if (company.riskScore >= 40) { score += 6; factors.push(`리스크 ${company.riskScore}점 — 중간`); }

        // ③ 이슈 수 (구체적 니즈)
        const issueCount = company.issues?.length || 0;
        if (issueCount >= 7) { score += 12; factors.push(`이슈 ${issueCount}건 — 매우 많음`); }
        else if (issueCount >= 4) { score += 7; factors.push(`이슈 ${issueCount}건`); }
        else if (issueCount >= 2) { score += 3; factors.push(`이슈 ${issueCount}건`); }

        // ④ 고객 반응 (이메일 열람·회신 — 가장 강력한 신호)
        if (company.clientReplied) { score += 20; factors.push('고객 회신 ✅ — 전환 임박'); }
        else if (company.emailSentAt) {
            // 이메일 발송 후 경과 시간 체크
            const hoursSinceSent = (Date.now() - new Date(company.emailSentAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceSent <= 24) { score += 8; factors.push('이메일 발송 24h 이내 — 풋프린트 기간'); }
            else if (hoursSinceSent <= 72) { score += 4; factors.push('이메일 발송 72h 이내'); }
            else { score -= 5; factors.push('이메일 미반응 72h+ — 관심 하락'); }
        }

        // ⑤ 통화 품질 (횟수보다 내용)
        if (company.callNote) {
            const note = company.callNote.toLowerCase();
            const hotWords = ['관심', '계약', '검토', '긍정', '좋아', '가능', '할게'];
            const coldWords = ['거절', '불필요', '관심없', '나중에', '그냥'];
            const hotCount = hotWords.filter(w => note.includes(w)).length;
            const coldCount = coldWords.filter(w => note.includes(w)).length;
            if (hotCount >= 2) { score += 15; factors.push('통화에서 강한 관심 신호'); }
            else if (hotCount === 1) { score += 8; factors.push('통화에서 관심 표현'); }
            if (coldCount >= 1) { score -= 10; factors.push('통화에서 거절 신호 있음'); }
            else if (!hotCount && !coldCount) { score += 3; factors.push('통화 기록 있음'); }
        } else if ((company.callAttempts || 0) >= 3) {
            score -= 8;
            factors.push(`${company.callAttempts}회 시도 미응답 — 관심 낮음`);
        }

        // ⑥ 기업 규모 (LTV 크기)
        if (company.storeCount >= 200) { score += 8; factors.push(`대형 ${company.storeCount}개점 — 높은 MRR`); }
        else if (company.storeCount >= 50) { score += 4; factors.push(`${company.storeCount}개점`); }

        // ⑦ 변호사 컨펌 + AI 의견서 (전문성 신뢰도)
        if (company.lawyerConfirmed && company.aiDraftReady) { score += 5; factors.push('변호사 검토 + AI 의견서 완료'); }
        else if (company.lawyerConfirmed) { score += 3; factors.push('변호사 검토 완료'); }

        score = Math.min(99, Math.max(3, score));
        const level = score >= 70 ? 'HOT' : score >= 40 ? 'WARM' : 'COLD';

        // 긴급도 메시지
        let urgency = '';
        if (level === 'HOT' && company.clientReplied) urgency = '지금 바로 전화하세요!';
        else if (level === 'HOT') urgency = '오늘 안에 전화';
        else if (level === 'WARM' && company.emailSentAt) urgency = '24h 내 팔로업';
        else if (level === 'WARM') urgency = '이번 주 내';
        else urgency = '장기 관리';

        return { score, factors, level, urgency };
    },
};

