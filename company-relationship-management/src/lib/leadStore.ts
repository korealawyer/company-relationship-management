// lib/leadStore.ts — 영업 리드 전담 저장소
// Phase 3: 인메모리 → localStorage 영속화 (Phase 4: Supabase로 교체)

export type LeadStatus =
    | 'pending'           // 미분석
    | 'analyzed'          // AI 분석 완료
    | 'sales_confirmed'   // 영업팀 컨펌 → 변호사 큐
    | 'lawyer_confirmed'  // 변호사 컨펌 완료
    | 'emailed'           // 이메일 발송 완료
    | 'in_contact'        // 연락 중
    | 'contracted'        // 계약 완료
    | 'failed';           // 실패

export interface LeadMemo {
    id: string;
    createdAt: string;
    author: string;
    content: string;
}

// 담당자 (복수 지원)
export interface LeadContact {
    id: string;
    name: string;
    role?: string;        // 직책
    department?: string; // 부서
    phone?: string;
    email?: string;
    isPrimary: boolean;
}

// 진행 타임라인
export type TimelineEventType = 'status_change' | 'call' | 'email' | 'note' | 'meeting';
export interface LeadTimelineEvent {
    id: string;
    createdAt: string;
    author: string;
    type: TimelineEventType;
    content: string;
    fromStatus?: LeadStatus;
    toStatus?: LeadStatus;
}

export interface Lead {
    id: string;
    companyName: string;
    domain: string;
    privacyUrl: string;
    // 레거시 단일 담당자 (호환성 유지)
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    // 담당자 목록 (신규)
    contacts: LeadContact[];
    storeCount: number;
    bizType: string;
    bizNumber?: string;   // 사업자등록번호
    bizCategory?: string;  // 사업 형태: 프랜차이즈, 제조업, 유통업, 서비스업 등
    riskScore: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | '';
    issueCount: number;
    status: LeadStatus;
    assignedLawyer?: string;
    analysisId?: string;
    lawyerNote?: string;
    memos: LeadMemo[];
    // 타임라인 (신규)
    timeline: LeadTimelineEvent[];
    // 카스톰 스크립트 (신규)
    customScript?: { call?: string; email?: string; lastEditedAt?: string };
    emailSentAt?: string;
    createdAt: string;
    updatedAt: string;
    source: 'excel' | 'manual' | 'crawler';
}

// ── localStorage 키 ─────────────────────────────────────────
const LEAD_STORE_KEY = 'ibs_leads_v1';
const LEAD_HISTORY_KEY = 'ibs_leads_history_v1';
const MAX_HISTORY = 15;

// ── 히스토리 (실행 취소) ──────────────────────────────────────
function pushHistory(): void {
    if (typeof window === 'undefined') return;
    try {
        const current = localStorage.getItem(LEAD_STORE_KEY);
        if (!current) return;
        const history: string[] = JSON.parse(localStorage.getItem(LEAD_HISTORY_KEY) ?? '[]');
        history.push(current);
        if (history.length > MAX_HISTORY) history.shift();
        localStorage.setItem(LEAD_HISTORY_KEY, JSON.stringify(history));
    } catch { /* ignore */ }
}

// ── Mock 초기 데이터 ──────────────────────────────────────
function makeTimeline(events: Omit<LeadTimelineEvent, 'id'>[]): LeadTimelineEvent[] {
    return events.map((e, i) => ({ ...e, id: `t${i}` }));
}

const INITIAL_LEADS: Lead[] = [
    {
        id: 'lead_001', companyName: '(주)샐러디', domain: 'saladday.co.kr',
        privacyUrl: 'https://saladday.co.kr/privacy',
        contactName: '김마케팅', contactEmail: 'dhk@ibslaw.co.kr', contactPhone: '02-1234-5678',
        contacts: [{ id: 'c1', name: '김마케팅', role: '마케팅 팀장', department: '마케팅팀', phone: '02-1234-5678', email: 'dhk@ibslaw.co.kr', isPrimary: true }],
        storeCount: 180, bizType: '외식(샐러드)', bizCategory: '프랜차이즈', riskScore: 78, riskLevel: 'HIGH', issueCount: 4, status: 'analyzed',
        memos: [],
        timeline: makeTimeline([
            { createdAt: '2026-03-01T09:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
            { createdAt: '2026-03-01T10:00:00Z', author: '시스템', type: 'status_change', content: 'AI 분석 완료', fromStatus: 'pending', toStatus: 'analyzed' },
        ]),
        createdAt: '2026-03-01T09:00:00Z', updatedAt: '2026-03-01T10:00:00Z', source: 'excel'
    },
    {
        id: 'lead_002', companyName: '(주)메가커피', domain: 'megacoffee.net',
        privacyUrl: 'https://megacoffee.net/privacy',
        contactName: '이운영', contactEmail: 'dhk@ibslaw.co.kr', contactPhone: '02-2345-6789',
        contacts: [{ id: 'c2', name: '이운영', role: '운영 이사', department: '운영본부', phone: '02-2345-6789', email: 'dhk@ibslaw.co.kr', isPrimary: true }],
        storeCount: 2800, bizType: '외식(카페)', bizCategory: '프랜차이즈', riskScore: 65, riskLevel: 'MEDIUM', issueCount: 2, status: 'lawyer_confirmed',
        emailSentAt: '2026-03-01T14:00:00Z',
        memos: [{ id: 'm1', createdAt: '2026-03-01T14:00:00Z', author: '박영업', content: '이메일 발송 완료. 담당자 회신 대기.' }],
        timeline: makeTimeline([
            { createdAt: '2026-02-28T09:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
            { createdAt: '2026-02-28T11:00:00Z', author: '시스템', type: 'status_change', content: 'AI 분석 완료', fromStatus: 'pending', toStatus: 'analyzed' },
            { createdAt: '2026-03-01T10:00:00Z', author: '박영업', type: 'status_change', content: '변호사 컨펌 완료', fromStatus: 'analyzed', toStatus: 'lawyer_confirmed' },
            { createdAt: '2026-03-01T14:00:00Z', author: '박영업', type: 'email', content: '이메일 발송 완료. 담당자 회신 대기.' },
        ]),
        createdAt: '2026-02-28T09:00:00Z', updatedAt: '2026-03-01T14:00:00Z', source: 'excel'
    },
    {
        id: 'lead_003', companyName: '(주)BBQ치킨', domain: 'bbq.co.kr',
        privacyUrl: 'https://bbq.co.kr/privacy',
        contactName: '최법무', contactEmail: 'dhk@ibslaw.co.kr', contactPhone: '02-3456-7890',
        contacts: [{ id: 'c3', name: '최법무', role: '법무 담당', department: '법무팀', phone: '02-3456-7890', email: 'dhk@ibslaw.co.kr', isPrimary: true }],
        storeCount: 1800, bizType: '외식(치킨)', bizCategory: '프랜차이즈', riskScore: 82, riskLevel: 'HIGH', issueCount: 5, status: 'sales_confirmed',
        memos: [],
        timeline: makeTimeline([
            { createdAt: '2026-03-01T08:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
            { createdAt: '2026-03-01T09:30:00Z', author: '시스템', type: 'status_change', content: 'AI 분석 완료', fromStatus: 'pending', toStatus: 'analyzed' },
            { createdAt: '2026-03-01T11:00:00Z', author: '이민준', type: 'status_change', content: '영업 컨펌', fromStatus: 'analyzed', toStatus: 'sales_confirmed' },
        ]),
        createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-03-01T11:00:00Z', source: 'excel'
    },
    {
        id: 'lead_004', companyName: '(주)파리바게뜨', domain: 'paris.co.kr',
        privacyUrl: 'https://paris.co.kr/privacy',
        contactName: '정담당', contactEmail: 'dhk@ibslaw.co.kr', contactPhone: '02-4567-8901',
        contacts: [{ id: 'c4', name: '정담당', role: '담당자', department: '총무팀', phone: '02-4567-8901', email: 'dhk@ibslaw.co.kr', isPrimary: true }],
        storeCount: 3400, bizType: '식품(베이커리)', bizCategory: '프랜차이즈', riskScore: 45, riskLevel: 'MEDIUM', issueCount: 1, status: 'emailed',
        emailSentAt: '2026-02-28T10:00:00Z',
        memos: [
            { id: 'm2', createdAt: '2026-02-28T15:00:00Z', author: '이영업', content: '전화 연결. 법무팀에 전달한다고 함.' },
            { id: 'm3', createdAt: '2026-03-01T09:00:00Z', author: '이영업', content: '2차 이메일 발송.' }
        ],
        timeline: makeTimeline([
            { createdAt: '2026-02-27T09:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
            { createdAt: '2026-02-27T11:00:00Z', author: '시스템', type: 'status_change', content: 'AI 분석 완료', fromStatus: 'pending', toStatus: 'analyzed' },
            { createdAt: '2026-02-28T10:00:00Z', author: '이영업', type: 'email', content: '1차 이메일 발송' },
            { createdAt: '2026-02-28T15:00:00Z', author: '이영업', type: 'call', content: '전화 연결. 법무팀 전달 예정' },
            { createdAt: '2026-03-01T09:00:00Z', author: '이영업', type: 'email', content: '2차 이메일 발송' },
        ]),
        createdAt: '2026-02-27T09:00:00Z', updatedAt: '2026-03-01T09:00:00Z', source: 'excel'
    },
    {
        id: 'lead_005', companyName: '(주)교촌치킨', domain: 'kyochon.com',
        privacyUrl: 'https://kyochon.com/privacy',
        contactName: '홍기획', contactEmail: 'dhk@ibslaw.co.kr', contactPhone: '02-5678-9012',
        contacts: [{ id: 'c5', name: '홍기획', role: '기획 팀장', department: '전략기획팀', phone: '02-5678-9012', email: 'dhk@ibslaw.co.kr', isPrimary: true }],
        storeCount: 1200, bizType: '외식(치킨)', bizCategory: '프랜차이즈', riskScore: 91, riskLevel: 'HIGH', issueCount: 6, status: 'pending',
        memos: [],
        timeline: makeTimeline([
            { createdAt: '2026-03-02T07:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
        ]),
        createdAt: '2026-03-02T07:00:00Z', updatedAt: '2026-03-02T07:00:00Z', source: 'excel'
    },
    {
        id: 'lead_006', companyName: '(주)투썸플레이스', domain: 'twosome.co.kr',
        privacyUrl: 'https://twosome.co.kr/privacy',
        contactName: '한카페', contactEmail: 'han@twosome.co.kr', contactPhone: '02-6789-0123',
        contacts: [{ id: 'c6', name: '한카페', role: '법무 담당', department: '법무팀', phone: '02-6789-0123', email: 'han@twosome.co.kr', isPrimary: true }],
        storeCount: 1600, bizType: '카페', bizCategory: '프랜차이즈', riskScore: 72, riskLevel: 'HIGH', issueCount: 3, status: 'analyzed',
        memos: [],
        timeline: makeTimeline([
            { createdAt: '2026-03-03T08:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
            { createdAt: '2026-03-03T09:30:00Z', author: '시스템', type: 'status_change', content: 'AI 분석 완료', fromStatus: 'pending', toStatus: 'analyzed' },
        ]),
        createdAt: '2026-03-03T08:00:00Z', updatedAt: '2026-03-03T09:30:00Z', source: 'excel'
    },
    {
        id: 'lead_007', companyName: '(주)올리브영', domain: 'oliveyoung.co.kr',
        privacyUrl: 'https://oliveyoung.co.kr/privacy',
        contactName: '박리테일', contactEmail: 'park@oliveyoung.co.kr', contactPhone: '02-7890-1234',
        contacts: [{ id: 'c7', name: '박리테일', role: '컴플라이언스 매니저', department: '준법감시팀', phone: '02-7890-1234', email: 'park@oliveyoung.co.kr', isPrimary: true }],
        storeCount: 1300, bizType: '뷰티/리테일', bizCategory: '유통업', riskScore: 55, riskLevel: 'MEDIUM', issueCount: 2, status: 'in_contact',
        emailSentAt: '2026-02-25T09:00:00Z',
        memos: [
            { id: 'm4', createdAt: '2026-03-01T14:00:00Z', author: '이영업', content: '담당자 미팅 일정 조율 중.' },
        ],
        timeline: makeTimeline([
            { createdAt: '2026-02-24T09:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
            { createdAt: '2026-02-25T09:00:00Z', author: '이영업', type: 'email', content: '이메일 발송' },
            { createdAt: '2026-03-01T14:00:00Z', author: '이영업', type: 'call', content: '전화 연결. 미팅 일정 조율' },
        ]),
        createdAt: '2026-02-24T09:00:00Z', updatedAt: '2026-03-01T14:00:00Z', source: 'excel'
    },
    {
        id: 'lead_008', companyName: '(주)이디야커피', domain: 'ediya.com',
        privacyUrl: 'https://ediya.com/privacy',
        contactName: '윤프랜차이즈', contactEmail: 'yoon@ediya.com', contactPhone: '02-8901-2345',
        contacts: [{ id: 'c8', name: '윤프랜차이즈', role: '가맹사업팀장', department: '가맹사업팀', phone: '02-8901-2345', email: 'yoon@ediya.com', isPrimary: true }],
        storeCount: 3200, bizType: '카페', bizCategory: '프랜차이즈', riskScore: 38, riskLevel: 'MEDIUM', issueCount: 1, status: 'contracted',
        emailSentAt: '2026-02-20T09:00:00Z',
        memos: [
            { id: 'm5', createdAt: '2026-02-28T11:00:00Z', author: '김변호사', content: '계약서 최종 검토 완료.' },
        ],
        timeline: makeTimeline([
            { createdAt: '2026-02-18T09:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
            { createdAt: '2026-02-20T09:00:00Z', author: '이영업', type: 'email', content: '이메일 발송' },
            { createdAt: '2026-02-28T11:00:00Z', author: '김변호사', type: 'note', content: '계약 체결 완료' },
        ]),
        createdAt: '2026-02-18T09:00:00Z', updatedAt: '2026-02-28T11:00:00Z', source: 'excel'
    },
    {
        id: 'lead_009', companyName: '(주)맘스터치', domain: 'momstouch.co.kr',
        privacyUrl: 'https://momstouch.co.kr/privacy',
        contactName: '서햄버거', contactEmail: 'seo@momstouch.co.kr', contactPhone: '02-9012-3456',
        contacts: [{ id: 'c9', name: '서햄버거', role: '운영팀장', department: '운영팀', phone: '02-9012-3456', email: 'seo@momstouch.co.kr', isPrimary: true }],
        storeCount: 1400, bizType: '외식(버거)', bizCategory: '프랜차이즈', riskScore: 85, riskLevel: 'HIGH', issueCount: 5, status: 'sales_confirmed',
        memos: [],
        timeline: makeTimeline([
            { createdAt: '2026-03-01T10:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
            { createdAt: '2026-03-01T12:00:00Z', author: '시스템', type: 'status_change', content: 'AI 분석 완료', fromStatus: 'pending', toStatus: 'analyzed' },
            { createdAt: '2026-03-02T09:00:00Z', author: '이영업', type: 'status_change', content: '영업 컨펌', fromStatus: 'analyzed', toStatus: 'sales_confirmed' },
        ]),
        createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-02T09:00:00Z', source: 'crawler'
    },
    {
        id: 'lead_010', companyName: '(주)스타벅스코리아', domain: 'starbucks.co.kr',
        privacyUrl: 'https://starbucks.co.kr/privacy',
        contactName: '조커피', contactEmail: 'cho@starbucks.co.kr', contactPhone: '02-0123-4567',
        contacts: [{ id: 'c10', name: '조커피', role: '법무실장', department: '법무실', phone: '02-0123-4567', email: 'cho@starbucks.co.kr', isPrimary: true }],
        storeCount: 1900, bizType: '카페', bizCategory: '직영', riskScore: 25, riskLevel: 'LOW', issueCount: 0, status: 'emailed',
        emailSentAt: '2026-03-02T14:00:00Z',
        memos: [],
        timeline: makeTimeline([
            { createdAt: '2026-02-28T10:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
            { createdAt: '2026-03-02T14:00:00Z', author: '이영업', type: 'email', content: '이메일 발송' },
        ]),
        createdAt: '2026-02-28T10:00:00Z', updatedAt: '2026-03-02T14:00:00Z', source: 'excel'
    },
    {
        id: 'lead_011', companyName: '(주)본죽', domain: 'bonif.co.kr',
        privacyUrl: 'https://bonif.co.kr/privacy',
        contactName: '강건강', contactEmail: 'kang@bonif.co.kr', contactPhone: '02-1234-0000',
        contacts: [{ id: 'c11', name: '강건강', role: '대표이사', department: '경영지원실', phone: '02-1234-0000', email: 'kang@bonif.co.kr', isPrimary: true }],
        storeCount: 900, bizType: '외식(죽)', bizCategory: '프랜차이즈', riskScore: 68, riskLevel: 'HIGH', issueCount: 4, status: 'lawyer_confirmed',
        assignedLawyer: '김변호사',
        memos: [
            { id: 'm6', createdAt: '2026-03-03T16:00:00Z', author: '김변호사', content: '조문 검토 완료. 문제 조항 4건 확인.' },
        ],
        timeline: makeTimeline([
            { createdAt: '2026-02-26T11:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
            { createdAt: '2026-02-26T13:00:00Z', author: '시스템', type: 'status_change', content: 'AI 분석 완료', fromStatus: 'pending', toStatus: 'analyzed' },
            { createdAt: '2026-02-27T10:00:00Z', author: '이영업', type: 'status_change', content: '영업 컨펌', fromStatus: 'analyzed', toStatus: 'sales_confirmed' },
            { createdAt: '2026-03-03T16:00:00Z', author: '김변호사', type: 'status_change', content: '변호사 컨펌', fromStatus: 'sales_confirmed', toStatus: 'lawyer_confirmed' },
        ]),
        createdAt: '2026-02-26T11:00:00Z', updatedAt: '2026-03-03T16:00:00Z', source: 'crawler'
    },
];

// ── localStorage 기반 영속 저장소 ─────────────────────────
function loadLeads(): Lead[] {
    if (typeof window === 'undefined') return [...INITIAL_LEADS];
    try {
        const raw = localStorage.getItem(LEAD_STORE_KEY);
        if (!raw) {
            // 최초 로드: 초기 데이터 저장
            localStorage.setItem(LEAD_STORE_KEY, JSON.stringify(INITIAL_LEADS));
            return [...INITIAL_LEADS];
        }
        return JSON.parse(raw) as Lead[];
    } catch {
        return [...INITIAL_LEADS];
    }
}

function saveLeads(leads: Lead[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(LEAD_STORE_KEY, JSON.stringify(leads));
    } catch (e) {
        console.error('[leadStore] localStorage 저장 실패:', e);
    }
}

// ── UUID 기반 ID 생성 (Date.now() 충돌 방지) ─────────────
function genId(prefix = 'id'): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}_${crypto.randomUUID()}`;
    }
    // 폴백: Date.now() + 랜덤 접미사
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const leadStore = {
    getAll: () => loadLeads(),
    getById: (id: string) => loadLeads().find(l => l.id === id),
    canUndo: (): boolean => {
        if (typeof window === 'undefined') return false;
        try {
            const h: string[] = JSON.parse(localStorage.getItem(LEAD_HISTORY_KEY) ?? '[]');
            return h.length > 0;
        } catch { return false; }
    },
    undo: (): Lead[] | null => {
        if (typeof window === 'undefined') return null;
        try {
            const h: string[] = JSON.parse(localStorage.getItem(LEAD_HISTORY_KEY) ?? '[]');
            if (h.length === 0) return null;
            const prev = h.pop()!;
            localStorage.setItem(LEAD_HISTORY_KEY, JSON.stringify(h));
            localStorage.setItem(LEAD_STORE_KEY, prev);
            return JSON.parse(prev) as Lead[];
        } catch { return null; }
    },
    add: (leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'memos' | 'timeline' | 'contacts'>[]) => {
        const now = new Date().toISOString();
        const newLeads: Lead[] = leads.map((l) => ({
            ...l,
            id: genId('lead'),
            memos: [],
            contacts: [],
            timeline: [{ id: genId('t'), createdAt: now, author: '시스템', type: 'status_change' as TimelineEventType, content: '리드 생성', toStatus: l.status }],
            createdAt: now,
            updatedAt: now,
        }));
        const all = loadLeads();
        const updated = [...newLeads, ...all];
        saveLeads(updated);
        return newLeads;
    },
    update: (id: string, patch: Partial<Lead>) => {
        pushHistory();
        const all = loadLeads().map(l => l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l);
        saveLeads(all);
    },
    updateStatus: (id: string, nextStatus: LeadStatus, author: string = '영업팀') => {
        pushHistory();
        const all = loadLeads().map(l => {
            if (l.id !== id) return l;
            const event: LeadTimelineEvent = {
                id: genId('t'),
                createdAt: new Date().toISOString(),
                author,
                type: 'status_change',
                content: `상태 변경`,
                fromStatus: l.status,
                toStatus: nextStatus,
            };
            return { ...l, status: nextStatus, timeline: [...l.timeline, event], updatedAt: new Date().toISOString() };
        });
        saveLeads(all);
    },
    addMemo: (id: string, memo: Omit<LeadMemo, 'id' | 'createdAt'>) => {
        pushHistory();
        const now = new Date().toISOString();
        const all = loadLeads().map(l => {
            if (l.id !== id) return l;
            const newMemo = { ...memo, id: genId('m'), createdAt: now };
            const event: LeadTimelineEvent = {
                id: genId('t'),
                createdAt: now,
                author: memo.author,
                type: 'note',
                content: memo.content,
            };
            return { ...l, memos: [...l.memos, newMemo], timeline: [...l.timeline, event], updatedAt: now };
        });
        saveLeads(all);
    },
    addTimelineEvent: (id: string, event: Omit<LeadTimelineEvent, 'id'>) => {
        const all = loadLeads().map(l => {
            if (l.id !== id) return l;
            return { ...l, timeline: [...l.timeline, { ...event, id: genId('t') }], updatedAt: new Date().toISOString() };
        });
        saveLeads(all);
    },
    updateContact: (leadId: string, contact: LeadContact) => {
        const all = loadLeads().map(l => {
            if (l.id !== leadId) return l;
            const exists = l.contacts.find(c => c.id === contact.id);
            const contacts = exists ? l.contacts.map(c => c.id === contact.id ? contact : c) : [...l.contacts, contact];
            return { ...l, contacts, updatedAt: new Date().toISOString() };
        });
        saveLeads(all);
    },
    saveScript: (id: string, script: { call?: string; email?: string }) => {
        const all = loadLeads().map(l => l.id === id ? { ...l, customScript: { ...l.customScript, ...script, lastEditedAt: new Date().toISOString() }, updatedAt: new Date().toISOString() } : l);
        saveLeads(all);
    },
};

// 구독료 계산 (가맹점수 기준)
export function calcSubscription(storeCount: number) {
    if (storeCount <= 10) return { plan: 'Basic', monthly: 99000, annual: 990000 };
    if (storeCount <= 50) return { plan: 'Standard', monthly: 297000, annual: 2970000 };
    if (storeCount <= 200) return { plan: 'Pro', monthly: 594000, annual: 5940000 };
    return { plan: 'Enterprise', monthly: 990000, annual: 9900000 };
}
