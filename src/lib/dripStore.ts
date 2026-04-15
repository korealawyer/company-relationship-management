// lib/dripStore.ts — 미결제 회원 드립 캠페인 자동화
// Phase 1: 로컬 전역 스토어 (Zustand + sessionStorage 영속화)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type DripStatus = 'active' | 'paused' | 'completed' | 'converted';

export interface DripEmail {
    day: number;
    subject: string;
    previewText: string;
    contentType: 'legal_tip' | 'case_study' | 'risk_alert' | 'cta';
    content: string;
    ctaText: string;
    ctaUrl: string;
}

export interface DripMember {
    id: string;
    leadId: string;
    companyName: string;
    contactEmail: string;
    contactName: string;
    bizRegNo: string;
    tempPassword: string;
    joinedAt: string;
    subscribed: boolean;
    subscribedAt?: string;
    dripStatus: DripStatus;
    sentDays: number[];
    lastSentAt?: string;
    riskLevel: string;
    issueCount: number;
}

export const DRIP_SEQUENCE: DripEmail[] = [
    {
        day: 1,
        subject: '📋 [IBS 법률] {company}님, 개인정보 침해 과징금 계산해보셨나요?',
        previewText: '최근 3개월 과징금 부과 사례 분석',
        contentType: 'legal_tip',
        content: `안녕하세요, {contactName}님.
        
IBS 법률사무소입니다. 귀사의 개인정보처리방침 검토 결과를 확인하셨나요?

**최근 과징금 실제 사례**
• A 프랜차이즈 본부 → 제3자 제공 미고지 → 과징금 2,400만원
• B 식품 프랜차이즈 → 수집항목 과다 → 시정명령 + 과태료 500만원
• C 카페 체인 → 처리방침 미갱신 → 행정처분 경고

귀사의 리스크 점수는 **{riskScore}점({riskLevel})** 입니다.
가장 빨리 수정해야 할 항목 1가지를 무료로 안내해 드립니다.`,
        ctaText: '무료 1:1 법률 상담 예약',
        ctaUrl: '/landing?cid={leadId}',
    },
    {
        day: 4,
        subject: '⚠️ 개인정보보호법 2024년 개정 — 귀사에 해당되는 항목',
        previewText: '프랜차이즈 본부 필수 체크 3가지',
        contentType: 'risk_alert',
        content: `{contactName}님, 안녕하세요.

2024년 개인정보보호법 주요 개정사항 중 **프랜차이즈 본부**에 직접 영향을 미치는 3가지입니다.

1. **가맹점 개인정보 공동 처리** — 가맹점과의 처리방침 동기화 의무화
2. **마케팅 수신 동의 재확인** — 기존 회원도 1년마다 재동의 필요
3. **개인정보 보호책임자(CPO) 지정** — 일정 규모 이상 필수

귀사({company}, 가맹점 {storeCount}개)는 세 항목 모두 해당됩니다.`,
        ctaText: '개정사항 전문 분석 받기',
        ctaUrl: '/landing?cid={leadId}',
    },
    {
        day: 8,
        subject: '📊 동종업계 {bizType} 개인정보 관리 현황 리포트',
        previewText: '업계 1위 기업은 어떻게 관리하고 있을까요?',
        contentType: 'case_study',
        content: `{contactName}님, 안녕하세요.

{bizType} 업계의 개인정보 관리 수준을 분석했습니다.

**상위 30% 기업의 특징**
✅ 처리방침 연 2회 검토·갱신
✅ 가맹점 교육 연 1회 시행
✅ 개인정보 보호 담당자 전담 지정
✅ 법률 자문 계약 체결

**하위 30% 기업의 특징**
❌ 처리방침 3년 이상 미갱신
❌ 가맹점 별도 처리방침 없음
❌ 민원 접수 후 사후 대응

귀사는 현재 어느 위치에 계신가요?`,
        ctaText: '업계 상위 30% 합류하기',
        ctaUrl: '/pricing',
    },
    {
        day: 14,
        subject: '🎁 2주 기념 — 귀사 맞춤 처리방침 수정안 초안 제공',
        previewText: '변호사가 직접 검토한 수정 초안을 드립니다',
        contentType: 'cta',
        content: `{contactName}님, 안녕하세요.

귀사의 개인정보처리방침 검토 요청 후 2주가 지났습니다.

저희 IBS 법률사무소에서 **귀사 맞춤 수정안 초안**을 무료로 제공해 드리겠습니다.

포함 내용:
• 제1조 수집항목 수정안 (과다수집 제거)
• 제3자 제공 현황 표 (신규 작성)
• 마케팅 동의 분리 조항 (신규)

구독 계약 없이도 초안은 무료입니다.
이후 월 구독으로 지속 관리해 드립니다.`,
        ctaText: '수정안 초안 무료 수령',
        ctaUrl: '/landing?cid={leadId}&action=draft',
    },
    {
        day: 21,
        subject: '📞 마지막 제안 — 100만원 이하 법률 관리 솔루션',
        previewText: '가맹점 {storeCount}개 기준 월 {monthlyFee}원',
        contentType: 'cta',
        content: `{contactName}님, 안녕하세요.

개인정보 침해 과징금이 **평균 1,800만원**인 것 알고 계셨나요?

IBS 구독 서비스로 월 {monthlyFee}원에 관리하시면:
• 처리방침 연 2회 검토·수정
• 가맹점 법률 Q&A 무제한
• 민원 접수 시 즉시 대응
• 신규 법령 개정 자동 알림

**이번 달 신규 가입 시 첫 달 무료** 혜택을 드립니다.`,
        ctaText: '첫 달 무료로 시작하기',
        ctaUrl: '/pricing',
    },
    {
        day: 30,
        subject: '✉️ 마지막 법률 자료 — 개인정보 자가점검 체크리스트',
        previewText: '20개 항목 자가점검표 (PDF 포함)',
        contentType: 'legal_tip',
        content: `{contactName}님, 안녕하세요.

한 달간 보내드린 법률 자료가 도움이 되셨으면 합니다.
마지막으로, 직접 활용하실 수 있는 **자가점검 체크리스트 20항목**을 드립니다.

□ 처리방침 최근 1년 이내 갱신
□ 수집항목 필수/선택 분리
□ 제3자 제공 현황 명시
□ 만 14세 미만 아동 별도 동의
□ 보유기간 항목별 명시
... (총 20항목)

언제든 도움이 필요하시면 연락 주세요.
구독을 결정하시면 지금 바로 전담 변호사가 배정됩니다.`,
        ctaText: '전담 변호사 배정받기',
        ctaUrl: '/pricing',
    },
];

export const INITIAL_MEMBERS: DripMember[] = [
    {
        id: 'drip_001', leadId: 'lead_002', companyName: '(주)메가커피',
        contactEmail: 'ops@megacoffee.net', contactName: '이운영',
        bizRegNo: '12345678901', tempPassword: '[발송 완료 — 저장 안 함]',
        joinedAt: '2026-03-01T14:00:00Z', subscribed: false,
        dripStatus: 'active', sentDays: [1, 4], lastSentAt: '2026-03-05T09:00:00Z',
        riskLevel: 'MEDIUM', issueCount: 2,
    },
    {
        id: 'drip_002', leadId: 'lead_004', companyName: '(주)파리바게뜨',
        contactEmail: 'info@paris.co.kr', contactName: '정담당',
        bizRegNo: '34567890120', tempPassword: '[발송 완료 — 저장 안 함]',
        joinedAt: '2026-02-28T10:00:00Z', subscribed: false,
        dripStatus: 'active', sentDays: [1, 4, 8, 14], lastSentAt: '2026-03-14T09:00:00Z',
        riskLevel: 'MEDIUM', issueCount: 1,
    },
];

interface DripStoreState {
    members: DripMember[];
    register: (data: {
        leadId: string; companyName: string; contactEmail: string; contactName: string;
        bizRegNo: string; riskLevel: string; issueCount: number;
    }) => DripMember;
    markSent: (id: string, day: number) => void;
    markSubscribed: (id: string) => void;
}

export const useDripStore = create<DripStoreState>()(
    persist(
        (set, get) => ({
            members: INITIAL_MEMBERS,
            
            register: (data) => {
                const existing = get().members.find(m => m.leadId === data.leadId);
                if (existing) return existing;

                const tempPw = `IBS${Math.floor(100000 + Math.random() * 900000)}`;
                console.log(`[dripStore] 임시 비밀번호 생성 (발송 전용, 저장 안 함): ${data.contactEmail}`);
                void tempPw;

                const member: DripMember = {
                    id: typeof crypto !== 'undefined' && crypto.randomUUID
                        ? `drip_${crypto.randomUUID()}`
                        : `drip_${Date.now()}`,
                    ...data,
                    bizRegNo: data.bizRegNo.replace(/-/g, ''),
                    tempPassword: '[발송 완료 — 저장 안 함]',
                    joinedAt: new Date().toISOString(),
                    subscribed: false,
                    dripStatus: 'active',
                    sentDays: [],
                };
                set({ members: [...get().members, member] });
                return member;
            },

            markSent: (id, day) => {
                set({
                    members: get().members.map(m => m.id !== id ? m : {
                        ...m,
                        sentDays: [...m.sentDays, day],
                        lastSentAt: new Date().toISOString(),
                    })
                });
            },

            markSubscribed: (id) => {
                set({
                    members: get().members.map(m => m.id !== id ? m : {
                        ...m, subscribed: true, subscribedAt: new Date().toISOString(), dripStatus: 'converted'
                    })
                });
            }
        }),
        {
            name: 'ibs_drip_v2',
            storage: createJSONStorage(() => {
                if (typeof window !== 'undefined') return sessionStorage;
                return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
            }),
        }
    )
);

// 레거시 하위 호환성을 위한 래퍼
export const dripStore = {
    getAll: () => useDripStore.getState().members,
    getById: (id: string) => useDripStore.getState().members.find(m => m.id === id),
    getByLeadId: (leadId: string) => useDripStore.getState().members.find(m => m.leadId === leadId),
    getByBizRegNo: (bizRegNo: string) => {
        const digits = bizRegNo.replace(/-/g, '');
        return useDripStore.getState().members.find(m => m.bizRegNo === digits);
    },
    register: (data: Parameters<DripStoreState['register']>[0]) => useDripStore.getState().register(data),
    markSent: (id: string, day: number) => useDripStore.getState().markSent(id, day),
    markSubscribed: (id: string) => useDripStore.getState().markSubscribed(id),
    
    getPendingEmails: () => {
        const now = Date.now();
        const pending: { member: DripMember; email: DripEmail }[] = [];
        const members = useDripStore.getState().members;
        
        members.filter(m => m.dripStatus === 'active' && !m.subscribed).forEach(member => {
            const daysSinceJoin = Math.floor((now - new Date(member.joinedAt).getTime()) / 86400000);
            DRIP_SEQUENCE.forEach(email => {
                if (email.day <= daysSinceJoin && !member.sentDays.includes(email.day)) {
                    pending.push({ member, email });
                }
            });
        });
        return pending;
    },
};

export function fillTemplate(template: string, vars: Record<string, string>): string {
    return Object.entries(vars).reduce(
        (t, [k, v]) => t.replace(new RegExp(`\\{${k}\\}`, 'g'), v), template
    );
}
