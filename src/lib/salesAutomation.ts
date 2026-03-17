// src/lib/salesAutomation.ts — 영업 자동화 엔진
// 6가지 자동화 기능을 통합 관리하는 서비스 모듈

import { Company } from './mockStore';

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

export const FOLLOW_UP_SEQUENCE: Omit<FollowUpStep, 'sentAt' | 'opened' | 'status'>[] = [
    { step: 1, dayOffset: 1, subject: '📊 진단 보고서가 도착했습니다' },
    { step: 2, dayOffset: 3, subject: '📋 보고서를 확인하셨나요?' },
    { step: 3, dayOffset: 7, subject: '🤝 무료 상담 예약 안내' },
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
   7. 뉴스 기반 리드 생성
   ══════════════════════════════════════════════════════════════ */

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

export const NEWS_FEED: NewsItem[] = [
    {
        id: 'news-1',
        title: '개인정보위, 프랜차이즈 업종 집중 점검 착수',
        source: '개인정보보호위원회',
        date: '2026-03-17',
        category: 'pipc',
        summary: '2026년 상반기 프랜차이즈 업종 대상 개인정보 처리실태 집중 점검. 위반 시 최대 5억원 과태료.',
        relatedBizTypes: ['치킨', '커피', '외식', '편의점', '베이커리'],
        urgency: 'high',
    },
    {
        id: 'news-2',
        title: '치킨 프랜차이즈 A사, 개인정보 유출로 3억원 과징금',
        source: '연합뉴스',
        date: '2026-03-15',
        category: 'fine',
        summary: '고객 18만명 개인정보 유출. 암호화 미비·접근통제 부재가 원인. 동종 업계 주의 필요.',
        relatedBizTypes: ['치킨', '외식'],
        urgency: 'high',
    },
    {
        id: 'news-3',
        title: '공정위, 가맹사업법 개정안 입법예고',
        source: '공정거래위원회',
        date: '2026-03-14',
        category: 'regulation',
        summary: '가맹점사업자 정보공개서 기재사항 강화. 위반 시 가맹사업 등록 취소 가능.',
        relatedBizTypes: ['치킨', '커피', '외식', '편의점', '베이커리', '피자'],
        urgency: 'medium',
    },
    {
        id: 'news-4',
        title: '카페 프랜차이즈 고객정보 관리 실태 점검 결과',
        source: '한국소비자원',
        date: '2026-03-12',
        category: 'pipc',
        summary: '주요 커피 프랜차이즈 10곳 중 7곳이 개인정보처리방침 미비. 앱 수집 정보 과다 지적.',
        relatedBizTypes: ['커피'],
        urgency: 'medium',
    },
    {
        id: 'news-5',
        title: '중소 프랜차이즈 개인정보 보호 가이드 배포',
        source: 'KISA',
        date: '2026-03-10',
        category: 'regulation',
        summary: '중소규모 프랜차이즈 대상 개인정보 보호 자가진단 체크리스트 및 가이드 배포.',
        relatedBizTypes: ['치킨', '커피', '외식', '편의점', '베이커리', '피자'],
        urgency: 'low',
    },
];

export const NewsLeadService = {
    getRelevantNews(companies: Company[], limit = 3): (NewsItem & { matchCount: number })[] {
        const bizTypes = new Set(companies.map(c => c.bizType).filter(Boolean));
        return NEWS_FEED
            .map(news => ({
                ...news,
                matchCount: news.relatedBizTypes.filter(bt => bizTypes.has(bt)).length,
            }))
            .filter(n => n.matchCount > 0 || n.urgency === 'high')
            .sort((a, b) => {
                if (a.urgency !== b.urgency) {
                    const order = { high: 0, medium: 1, low: 2 };
                    return order[a.urgency] - order[b.urgency];
                }
                return b.matchCount - a.matchCount;
            })
            .slice(0, limit);
    },

    getNewLeadSuggestions(companies: Company[]): { company: Company; reason: string; newsId: string }[] {
        const suggestions: { company: Company; reason: string; newsId: string }[] = [];
        for (const company of companies) {
            for (const news of NEWS_FEED) {
                if (news.urgency === 'high' && news.relatedBizTypes.includes(company.bizType)) {
                    if (!company.callNote && company.riskScore >= 50) {
                        suggestions.push({
                            company,
                            reason: `📰 ${news.title} → ${company.bizType} 업종 긴급 대응 필요`,
                            newsId: news.id,
                        });
                    }
                }
            }
        }
        return suggestions.slice(0, 5);
    },

    getCategoryIcon(category: NewsItem['category']): string {
        switch (category) {
            case 'pipc': return '🛡️';
            case 'fine': return '💰';
            case 'franchise': return '🏢';
            case 'regulation': return '📋';
        }
    },

    getUrgencyColor(urgency: NewsItem['urgency']): string {
        switch (urgency) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#3b82f6';
        }
    },
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
