// lib/leadScoring.ts — 리드 스코어 자동화 엔진
// 이메일 열람, CTA 클릭, 답장, 미팅 등 이벤트별 점수 체계

export interface TrackingEvent {
    type: 'email_open' | 'cta_click' | 'email_reply' | 'meeting' | 'call_answer';
    at: string;
    leadId: string;
    url?: string;        // cta_click일 때 클릭 URL
    userAgent?: string;  // 열람 기기 정보
}

// ── 점수 체계 ────────────────────────────────────────────
const SCORE_MAP: Record<TrackingEvent['type'], number> = {
    email_open: 10,     // 첫 열람
    cta_click: 20,      // CTA 클릭
    email_reply: 30,    // 이메일 답장
    call_answer: 25,    // 전화 응답
    meeting: 50,        // 미팅 예약
};

// 반복 열람 보너스 (2회 이상)
const REPEAT_OPEN_BONUS = 5;

// ── localStorage 키 ──────────────────────────────────────
const TRACKING_KEY = 'ibs_email_tracking_v1';
const SCORE_KEY = 'ibs_lead_scores_v1';
const PUSH_SUBS_KEY = 'ibs_push_subscriptions_v1';

// ── 추적 이벤트 저장소 ───────────────────────────────────
function loadEvents(): TrackingEvent[] {
    if (typeof window === 'undefined') {
        // 서버사이드: global 메모리 사용
        return (globalThis as any).__ibs_tracking || [];
    }
    try {
        const raw = localStorage.getItem(TRACKING_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveEvents(events: TrackingEvent[]): void {
    if (typeof window === 'undefined') {
        (globalThis as any).__ibs_tracking = events;
        return;
    }
    try { localStorage.setItem(TRACKING_KEY, JSON.stringify(events)); } catch {}
}

// 서버사이드 전용: global 메모리에서 로드/저장
function loadEventsServer(): TrackingEvent[] {
    return (globalThis as any).__ibs_tracking || [];
}

function saveEventsServer(events: TrackingEvent[]): void {
    (globalThis as any).__ibs_tracking = events;
}

// ── 스코어 저장소 ────────────────────────────────────────
interface LeadScoreData {
    leadId: string;
    score: number;
    openCount: number;
    clickCount: number;
    lastOpenAt?: string;
    lastClickAt?: string;
    firstOpenAt?: string;
}

function loadScores(): Record<string, LeadScoreData> {
    if (typeof window === 'undefined') {
        return (globalThis as any).__ibs_scores || {};
    }
    try {
        const raw = localStorage.getItem(SCORE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveScores(scores: Record<string, LeadScoreData>): void {
    if (typeof window === 'undefined') {
        (globalThis as any).__ibs_scores = scores;
        return;
    }
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(scores)); } catch {}
}

// ── Push 구독 저장소 ─────────────────────────────────────
export interface PushSubscriptionData {
    id: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userId?: string;
    createdAt: string;
}

function loadPushSubs(): PushSubscriptionData[] {
    if (typeof window === 'undefined') {
        return (globalThis as any).__ibs_push_subs || [];
    }
    try {
        const raw = localStorage.getItem(PUSH_SUBS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function savePushSubs(subs: PushSubscriptionData[]): void {
    if (typeof window === 'undefined') {
        (globalThis as any).__ibs_push_subs = subs;
        return;
    }
    try { localStorage.setItem(PUSH_SUBS_KEY, JSON.stringify(subs)); } catch {}
}

// ── 메인 서비스 ──────────────────────────────────────────
export const LeadScoringService = {
    /** 이벤트 기록 + 스코어 계산 (서버사이드 호환) */
    recordEvent(event: TrackingEvent): LeadScoreData {
        // 이벤트 저장
        const events = typeof window === 'undefined' ? loadEventsServer() : loadEvents();
        events.push(event);
        if (typeof window === 'undefined') saveEventsServer(events); else saveEvents(events);

        // 스코어 계산
        const scores = loadScores();
        const existing = scores[event.leadId] || {
            leadId: event.leadId,
            score: 0,
            openCount: 0,
            clickCount: 0,
        };

        if (event.type === 'email_open') {
            existing.openCount++;
            existing.lastOpenAt = event.at;
            if (!existing.firstOpenAt) existing.firstOpenAt = event.at;
            // 첫 열람: +10, 이후: +5
            existing.score += existing.openCount === 1 ? SCORE_MAP.email_open : REPEAT_OPEN_BONUS;
        } else if (event.type === 'cta_click') {
            existing.clickCount++;
            existing.lastClickAt = event.at;
            existing.score += SCORE_MAP.cta_click;
        } else {
            existing.score += SCORE_MAP[event.type] || 0;
        }

        scores[event.leadId] = existing;
        saveScores(scores);
        return existing;
    },

    /** 특정 리드 스코어 조회 */
    getScore(leadId: string): LeadScoreData | null {
        const scores = loadScores();
        return scores[leadId] || null;
    },

    /** 전체 스코어 조회 */
    getAllScores(): Record<string, LeadScoreData> {
        return loadScores();
    },

    /** 특정 리드 추적 이벤트 목록 */
    getEvents(leadId: string): TrackingEvent[] {
        const events = typeof window === 'undefined' ? loadEventsServer() : loadEvents();
        return events.filter(e => e.leadId === leadId);
    },

    /** 전체 이벤트 */
    getAllEvents(): TrackingEvent[] {
        return typeof window === 'undefined' ? loadEventsServer() : loadEvents();
    },
};

// ── Push 구독 서비스 ─────────────────────────────────────
export const PushService = {
    /** 구독 등록 */
    subscribe(sub: Omit<PushSubscriptionData, 'id' | 'createdAt'>): PushSubscriptionData {
        const subs = loadPushSubs();
        // 이미 등록된 endpoint 제거 (재등록)
        const filtered = subs.filter(s => s.endpoint !== sub.endpoint);
        const newSub: PushSubscriptionData = {
            ...sub,
            id: `push_${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        filtered.push(newSub);
        savePushSubs(filtered);
        return newSub;
    },

    /** 전체 구독 목록 */
    getAll(): PushSubscriptionData[] {
        return loadPushSubs();
    },

    /** 구독 삭제 */
    unsubscribe(endpoint: string): void {
        const subs = loadPushSubs().filter(s => s.endpoint !== endpoint);
        savePushSubs(subs);
    },
};

// ── 최적 발송 시간 추천 ──────────────────────────────────
export interface OptimalSendTime {
    day: string;
    hour: number;
    reason: string;
    openRate: string;
}

const BIZ_TYPE_SCHEDULES: Record<string, OptimalSendTime[]> = {
    '외식': [
        { day: '화요일', hour: 10, reason: '주초 업무 시작 후 집중도 높음', openRate: '32%' },
        { day: '수요일', hour: 10, reason: '주중 안정적 업무시간', openRate: '29%' },
        { day: '목요일', hour: 14, reason: '오후 업무 재개 시점', openRate: '27%' },
    ],
    '식품': [
        { day: '화요일', hour: 9, reason: '업무 시작 직후 이메일 확인', openRate: '35%' },
        { day: '수요일', hour: 10, reason: '주중 안정적 업무시간', openRate: '31%' },
    ],
    'default': [
        { day: '화요일', hour: 10, reason: '일반 기업 최적 시간대', openRate: '28%' },
        { day: '수요일', hour: 10, reason: '주중 안정적 업무시간', openRate: '26%' },
        { day: '목요일', hour: 10, reason: '주말 전 마지막 집중 시간대', openRate: '24%' },
    ],
};

export function getOptimalSendTimes(bizType: string): OptimalSendTime[] {
    const key = Object.keys(BIZ_TYPE_SCHEDULES).find(k => bizType.includes(k));
    return BIZ_TYPE_SCHEDULES[key || 'default'];
}
