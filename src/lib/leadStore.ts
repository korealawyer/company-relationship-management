// lib/leadStore.ts — 영업 리드 전담 저장소
// Phase 1: 로컬 전역 스토어 (Zustand + sessionStorage 영속화)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { calcPrice, getRange } from './pricing';

export type LeadStatus =
    | 'pending'           // 미분석
    | 'analyzed'          // AI 분석 완료
    | 'assigned'          // 변호사 자동 배정
    | 'reviewing'         // 변호사 검토 중
    | 'first_review_completed' // 1차 검토 완료
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

export interface LeadContact {
    id: string;
    name: string;
    role?: string;
    department?: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
}

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
    privacyPolicyText?: string;
    biz?: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    contacts: LeadContact[];
    storeCount: number;
    bizType: string;
    riskScore: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | '';
    issueCount: number;
    status: LeadStatus;
    assignedLawyer?: string;
    analysisId?: string;
    lawyerNote?: string;
    memos: LeadMemo[];
    timeline: LeadTimelineEvent[];
    customScript?: { call?: string; email?: string; lastEditedAt?: string };
    emailSentAt?: string;
    createdAt: string;
    updatedAt: string;
    source: 'excel' | 'manual' | 'crawler';
}

function genId(prefix = 'id'): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeTimeline(events: Omit<LeadTimelineEvent, 'id'>[]): LeadTimelineEvent[] {
    return events.map((e, i) => ({ ...e, id: `t${i}` }));
}

export const INITIAL_LEADS: Lead[] = [
    {
        id: 'lead_001', companyName: '(주)샐러디', domain: 'saladday.co.kr',
        privacyUrl: 'https://saladday.co.kr/privacy',
        contactName: '김마케팅', contactEmail: 'marketing@saladday.co.kr', contactPhone: '02-1234-5678',
        contacts: [{ id: 'c1', name: '김마케팅', role: '마케팅 팀장', department: '마케팅팀', phone: '02-1234-5678', email: 'marketing@saladday.co.kr', isPrimary: true }],
        storeCount: 180, bizType: '외식(샐러드)', riskScore: 78, riskLevel: 'HIGH', issueCount: 4, status: 'analyzed',
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
        contactName: '이운영', contactEmail: 'ops@megacoffee.net', contactPhone: '02-2345-6789',
        contacts: [{ id: 'c2', name: '이운영', role: '운영 이사', department: '운영본부', phone: '02-2345-6789', email: 'ops@megacoffee.net', isPrimary: true }],
        storeCount: 2800, bizType: '외식(카페)', riskScore: 65, riskLevel: 'MEDIUM', issueCount: 2, status: 'lawyer_confirmed',
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
        contactName: '최법무', contactEmail: 'legal@bbq.co.kr', contactPhone: '02-3456-7890',
        contacts: [{ id: 'c3', name: '최법무', role: '법무 담당', department: '법무팀', phone: '02-3456-7890', email: 'legal@bbq.co.kr', isPrimary: true }],
        storeCount: 1800, bizType: '외식(치킨)', riskScore: 82, riskLevel: 'HIGH', issueCount: 5, status: 'assigned',
        memos: [],
        timeline: makeTimeline([
            { createdAt: '2026-03-01T08:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
            { createdAt: '2026-03-01T09:30:00Z', author: '시스템', type: 'status_change', content: 'AI 분석 완료', fromStatus: 'pending', toStatus: 'analyzed' },
            { createdAt: '2026-03-01T11:00:00Z', author: '이민준', type: 'status_change', content: '변호사 배정', fromStatus: 'analyzed', toStatus: 'assigned' },
        ]),
        createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-03-01T11:00:00Z', source: 'excel'
    },
    {
        id: 'lead_004', companyName: '(주)파리바게뜨', domain: 'paris.co.kr',
        privacyUrl: 'https://paris.co.kr/privacy',
        contactName: '정담당', contactEmail: 'info@paris.co.kr', contactPhone: '02-4567-8901',
        contacts: [{ id: 'c4', name: '정담당', role: '담당자', department: '총무팀', phone: '02-4567-8901', email: 'info@paris.co.kr', isPrimary: true }],
        storeCount: 3400, bizType: '식품(베이커리)', riskScore: 45, riskLevel: 'MEDIUM', issueCount: 1, status: 'emailed',
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
        contactName: '홍기획', contactEmail: 'plan@kyochon.com', contactPhone: '02-5678-9012',
        contacts: [{ id: 'c5', name: '홍기획', role: '기획 팀장', department: '전략기획팀', phone: '02-5678-9012', email: 'plan@kyochon.com', isPrimary: true }],
        storeCount: 1200, bizType: '외식(치킨)', riskScore: 91, riskLevel: 'HIGH', issueCount: 6, status: 'pending',
        memos: [],
        timeline: makeTimeline([
            { createdAt: '2026-03-02T07:00:00Z', author: '시스템', type: 'status_change', content: '리드 생성', toStatus: 'pending' },
        ]),
        createdAt: '2026-03-02T07:00:00Z', updatedAt: '2026-03-02T07:00:00Z', source: 'excel'
    },
];

interface LeadStoreState {
    leads: Lead[];
    add: (leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'memos' | 'timeline' | 'contacts'>[]) => Lead[];
    update: (id: string, patch: Partial<Lead>) => void;
    updateStatus: (id: string, nextStatus: LeadStatus, author?: string) => void;
    addMemo: (id: string, memo: Omit<LeadMemo, 'id' | 'createdAt'>) => void;
    addTimelineEvent: (id: string, event: Omit<LeadTimelineEvent, 'id'>) => void;
    updateContact: (leadId: string, contact: LeadContact) => void;
    saveScript: (id: string, script: { call?: string; email?: string }) => void;
}

export const useLeadStore = create<LeadStoreState>()(
    persist(
        (set, get) => ({
            leads: INITIAL_LEADS,
            add: (leadsData) => {
                const now = new Date().toISOString();
                const newLeads = leadsData.map((l) => ({
                    ...(l as unknown as Lead),
                    id: genId('lead'),
                    memos: [],
                    contacts: [],
                    timeline: [{ id: genId('t'), createdAt: now, author: '시스템', type: 'status_change' as TimelineEventType, content: '리드 생성', toStatus: l.status }],
                    createdAt: now,
                    updatedAt: now,
                }));
                set({ leads: [...newLeads, ...get().leads] });
                return newLeads;
            },
            update: (id, patch) => {
                set({
                    leads: get().leads.map(l => l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l)
                });
            },
            updateStatus: (id, nextStatus, author = '영업팀') => {
                set({
                    leads: get().leads.map(l => {
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
                    })
                });
            },
            addMemo: (id, memo) => {
                const now = new Date().toISOString();
                set({
                    leads: get().leads.map(l => {
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
                    })
                });
            },
            addTimelineEvent: (id, event) => {
                set({
                    leads: get().leads.map(l => {
                        if (l.id !== id) return l;
                        return { ...l, timeline: [...l.timeline, { ...event, id: genId('t') }], updatedAt: new Date().toISOString() };
                    })
                });
            },
            updateContact: (leadId, contact) => {
                set({
                    leads: get().leads.map(l => {
                        if (l.id !== leadId) return l;
                        const exists = l.contacts.find(c => c.id === contact.id);
                        const contacts = exists ? l.contacts.map(c => c.id === contact.id ? contact : c) : [...l.contacts, contact];
                        return { ...l, contacts, updatedAt: new Date().toISOString() };
                    })
                });
            },
            saveScript: (id, script) => {
                set({
                    leads: get().leads.map(l => l.id === id ? { ...l, customScript: { ...l.customScript, ...script, lastEditedAt: new Date().toISOString() }, updatedAt: new Date().toISOString() } : l)
                });
            }
        }),
        {
            name: 'ibs_leads_v2', // 변경된 키
            storage: createJSONStorage(() => {
                // Ensure SSR completely ignores sessionStorage logic
                if (typeof window !== 'undefined') return sessionStorage;
                return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
            }),
        }
    )
);

// 레거시 하위 호환성을 위한 래퍼 (서버 동작 시 빈/초기 배열 반환)
export const leadStore = {
    getAll: () => useLeadStore.getState().leads,
    getById: (id: string) => useLeadStore.getState().leads.find(l => l.id === id),
    add: (leads: Parameters<LeadStoreState['add']>[0]) => useLeadStore.getState().add(leads),
    update: (id: string, patch: Partial<Lead>) => useLeadStore.getState().update(id, patch),
    updateStatus: (id: string, nextStatus: LeadStatus, author: string = '영업팀') => useLeadStore.getState().updateStatus(id, nextStatus, author),
    addMemo: (id: string, memo: Omit<LeadMemo, 'id' | 'createdAt'>) => useLeadStore.getState().addMemo(id, memo),
    addTimelineEvent: (id: string, event: Omit<LeadTimelineEvent, 'id'>) => useLeadStore.getState().addTimelineEvent(id, event),
    updateContact: (leadId: string, contact: LeadContact) => useLeadStore.getState().updateContact(leadId, contact),
    saveScript: (id: string, script: { call?: string; email?: string }) => useLeadStore.getState().saveScript(id, script),
};

export function calcSubscription(storeCount: number) {
    const monthly = calcPrice(storeCount);
    const annual = monthly * 12;
    const rangeId = getRange(storeCount);
    const rangeLabel: Record<string, string> = { entry: 'Entry', growth: 'Growth', scale: 'Scale', enterprise: 'Enterprise' };
    return { plan: rangeLabel[rangeId] || 'Entry', monthly, annual };
}
