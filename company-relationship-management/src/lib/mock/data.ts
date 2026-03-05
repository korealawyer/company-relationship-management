// src/lib/mock/data.ts — 기본(시드) 데이터
// mockStore.ts에서 분리. 테스트/초기 데이터만 포함.

import type { Company, Issue, LitigationCase, AutoSettings } from './types';

// ── AI 초안 (GPT-4o Mock) ─────────────────────────────────────
const AI_DRAFTS: Record<string, string> = {
    i1: `제1조 (수집하는 개인정보 항목)
회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.
• 필수항목: 성명, 연락처(휴대폰번호), 사업자등록번호, 이메일 주소
• 선택항목: 직함, 팀명
• 자동수집: 접속 IP, 쿠키, 서비스 이용기록

[AI 생성 초안 — 변호사 검토 필요]`,
    i2: `제5조 (개인정보의 제3자 제공)
회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
다만, 아래의 경우에는 예외로 합니다.
1. 이용자가 사전에 동의한 경우
2. 법령의 규정에 의거하거나 수사기관의 요청이 있는 경우

파트너사 마케팅 목적의 정보 제공은 별도 동의 절차를 거칩니다.

[AI 생성 초안 — 변호사 검토 필요]`,
    i3: `제6조 (개인정보의 보유 및 이용기간)
회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를
지체 없이 파기합니다.

• 계약 또는 청약철회 등에 관한 기록: 5년
• 소비자 불만 또는 분쟁처리에 관한 기록: 3년
• 서비스 이용기록, 접속로그: 1년

[AI 생성 초안 — 변호사 검토 필요]`,
    i4: `제9조 (정보주체의 권리·의무 및 그 행사방법)
이용자는 회사에 대해 언제든지 다음 각 호의 권리를 행사할 수 있습니다.
1. 개인정보 열람 요구
2. 오류 등이 있을 경우 정정 요구
3. 삭제 요구
4. 처리정지 요구

문의: 개인정보보호 담당자 dhk@ibslaw.co.kr

[AI 생성 초안 — 변호사 검토 필요]`,
};

export const BASE_ISSUES: Issue[] = [
    {
        id: 'i1', level: 'HIGH', law: '개인정보 보호법 제30조 제1항 제1호',
        title: '수집 항목 법정 기재 누락',
        originalText: '(현재 처리방침에 수집 항목 명시 없음)\n이름·연락처·사업자번호 등 수집하나 처리방침에 기재 없음.',
        riskDesc: '수집하는 개인정보 항목 미기재. 과태료 최대 3,000만원.',
        customDraft: AI_DRAFTS.i1, lawyerNote: '', reviewChecked: false, aiDraftGenerated: true,
    },
    {
        id: 'i2', level: 'HIGH', law: '개인정보 보호법 제17조 제2항',
        title: '제3자 제공 동의 절차 부재',
        originalText: '파트너사 마케팅 목적으로 정보를 공유할 수 있습니다.',
        riskDesc: '별도 동의 없이 제3자 제공. 과태료 최대 5,000만원.',
        customDraft: AI_DRAFTS.i2, lawyerNote: '', reviewChecked: false, aiDraftGenerated: true,
    },
    {
        id: 'i3', level: 'MEDIUM', law: '개인정보 보호법 제30조 제1항 제3호',
        title: '보유·이용기간 불명확',
        originalText: '서비스 종료 시까지 보유합니다.',
        riskDesc: '"서비스 종료 시까지"는 불명확. 구체적 기간 필요.',
        customDraft: AI_DRAFTS.i3, lawyerNote: '', reviewChecked: false, aiDraftGenerated: true,
    },
    {
        id: 'i4', level: 'LOW', law: '개인정보 보호법 제35조·36조',
        title: '정보주체 권리 행사 방법 미기재',
        originalText: '(열람·정정·삭제 요청 방법 없음)',
        riskDesc: '열람·정정·삭제 요청 방법 미기재. 시정 권고.',
        customDraft: AI_DRAFTS.i4, lawyerNote: '', reviewChecked: false, aiDraftGenerated: true,
    },
];

function emp(p: Partial<Company>): Company {
    return {
        id: '', name: '', biz: '', url: '', email: '', phone: '',
        storeCount: 0, status: 'pending', assignedLawyer: '', issues: [],
        salesConfirmed: false, salesConfirmedAt: '', salesConfirmedBy: 'AI 자동',
        lawyerConfirmed: false, lawyerConfirmedAt: '',
        emailSentAt: '', emailSubject: '',
        clientReplied: false, clientRepliedAt: '', clientReplyNote: '',
        loginCount: 0, callNote: '', plan: 'none',
        autoMode: true, aiDraftReady: false, source: 'crawler',
        paymentVerified: false, paymentVerifiedAt: '',
        createdAt: '', updatedAt: '',
        ...p,
    };
}

export const DEFAULT_COMPANIES: Company[] = [
    emp({
        id: 'c1', name: '(주)놀부NBG', biz: '123-45-67890',
        url: 'https://nolboo.co.kr', email: 'legal@nolboo.co.kr', phone: '02-1234-5678',
        storeCount: 420, status: 'sales_confirmed', assignedLawyer: '',
        issues: BASE_ISSUES.map(i => ({ ...i })),
        salesConfirmed: true, salesConfirmedAt: '2026-02-27 09:30', salesConfirmedBy: 'AI 자동',
        callNote: '대표이사 직접 통화. 이슈 공감. 이메일 요청.',
        aiDraftReady: true, createdAt: '2026-02-25', updatedAt: '2026-02-27',
    }),
    emp({
        id: 'c2', name: '(주)교촌에프앤비', biz: '234-56-78901',
        url: 'https://kyochon.com', email: 'cs@kyochon.com', phone: '02-2345-6789',
        storeCount: 1200, status: 'analyzed',
        issues: BASE_ISSUES.slice(0, 2).map(i => ({ ...i })),
        aiDraftReady: true, createdAt: '2026-02-26', updatedAt: '2026-02-26',
    }),
    emp({
        id: 'c3', name: '(주)파리바게뜨', biz: '345-67-89012',
        url: 'https://paris.co.kr', email: 'info@paris.co.kr', phone: '02-3456-7890',
        storeCount: 3500, status: 'reviewing', assignedLawyer: '이지원 변호사',
        issues: BASE_ISSUES.map(i => ({ ...i })),
        salesConfirmed: true, salesConfirmedAt: '2026-02-26 14:00', salesConfirmedBy: 'AI 자동',
        callNote: '법무팀 담당자 연결됨.',
        aiDraftReady: true, createdAt: '2026-02-24', updatedAt: '2026-02-27',
    }),
    emp({
        id: 'c4', name: '(주)bhc치킨', biz: '456-78-90123',
        url: 'https://bhc.co.kr', email: 'legal@bhc.co.kr', phone: '02-4567-8901',
        storeCount: 1800, status: 'lawyer_confirmed', assignedLawyer: '김수현 변호사',
        issues: BASE_ISSUES.map(i => ({ ...i, reviewChecked: true })),
        salesConfirmed: true, salesConfirmedAt: '2026-02-20 10:00', salesConfirmedBy: 'AI 자동',
        lawyerConfirmed: true, lawyerConfirmedAt: '2026-02-27 16:30',
        callNote: '구독 긍정적.',
        aiDraftReady: true, createdAt: '2026-02-19', updatedAt: '2026-02-27',
    }),
    emp({
        id: 'c5', name: '(주)본죽', biz: '567-89-01234',
        url: 'https://bonjuk.co.kr', email: 'info@bonjuk.co.kr', phone: '02-5678-9012',
        storeCount: 1100, status: 'client_replied', assignedLawyer: '박민준 변호사',
        issues: BASE_ISSUES.map(i => ({ ...i, reviewChecked: true })),
        salesConfirmed: true, salesConfirmedAt: '2026-02-21', salesConfirmedBy: 'AI 자동',
        lawyerConfirmed: true, lawyerConfirmedAt: '2026-02-23 11:00',
        emailSentAt: '2026-02-24 09:00 (자동발송)',
        clientReplied: true, clientRepliedAt: '2026-02-25 14:22',
        clientReplyNote: '검토 감사합니다. 구독 상담을 원합니다.',
        aiDraftReady: true, createdAt: '2026-02-20', updatedAt: '2026-02-25',
    }),
    emp({
        id: 'c6', name: '(주)BBQ', biz: '678-90-12345',
        url: 'https://bbq.co.kr', email: 'cs@bbq.co.kr', phone: '02-6789-0123',
        storeCount: 2100, status: 'crawling', source: 'crawler',
        createdAt: '2026-02-28', updatedAt: '2026-02-28',
    }),
    emp({
        id: 'c7', name: '(주)맘스터치', biz: '789-01-23456',
        url: 'https://momstouch.co.kr', email: 'cs@momstouch.co.kr', phone: '02-7890-1234',
        storeCount: 1500, status: 'subscribed', plan: 'standard', assignedLawyer: '김수현 변호사',
        salesConfirmed: true, salesConfirmedAt: '2026-02-15', salesConfirmedBy: 'AI 자동',
        lawyerConfirmed: true, lawyerConfirmedAt: '2026-02-17 14:00',
        emailSentAt: '2026-02-18 09:00 (자동발송)',
        clientReplied: true, clientRepliedAt: '2026-02-19 11:30',
        clientReplyNote: '계약서 검토 후 구독 진행.',
        aiDraftReady: true, createdAt: '2026-02-14', updatedAt: '2026-02-22',
    }),
];

export const DEFAULT_LIT: LitigationCase[] = [
    {
        id: 'l1', companyId: 'c3', companyName: '(주)파리바게뜨',
        caseNo: '2026가합12345', court: '서울중앙지방법원',
        type: '개인정보 손해배상', opponent: '前 가맹점주 김○○',
        claimAmount: 50000000, status: 'hearing',
        assignedLawyer: '이지원 변호사',
        deadlines: [
            { id: 'd1', label: '소장 접수', dueDate: '2026-02-01', completed: true, completedAt: '2026-02-01' },
            { id: 'd2', label: '1차 준비서면 제출', dueDate: '2026-03-15', completed: false, completedAt: '' },
            { id: 'd3', label: '1차 변론기일', dueDate: '2026-04-08', completed: false, completedAt: '' },
        ],
        notes: '가맹점주가 개인정보 유출 주장. 내부 감사 결과 유출 없음 확인.',
        result: '', resultNote: '',
        createdAt: '2026-02-01', updatedAt: '2026-02-28',
    },
    {
        id: 'l2', companyId: 'c7', companyName: '(주)맘스터치',
        caseNo: '2025가합99001', court: '수원지방법원',
        type: '가맹계약 분쟁', opponent: '맘스터치 가맹점 연합회',
        claimAmount: 200000000, status: 'settlement',
        assignedLawyer: '김수현 변호사',
        deadlines: [
            { id: 'd4', label: '소장 접수', dueDate: '2025-12-10', completed: true, completedAt: '2025-12-10' },
            { id: 'd5', label: '조정 기일', dueDate: '2026-03-05', completed: false, completedAt: '' },
        ],
        notes: '가맹계약서 내 개인정보 조항 미비로 인한 분쟁. 합의 진행 중.',
        result: '', resultNote: '',
        createdAt: '2025-12-10', updatedAt: '2026-02-28',
    },
];

export const DEFAULT_AUTO: AutoSettings = {
    autoSalesConfirm: true,
    autoAssignLawyer: true,
    autoGenerateDraft: true,
    autoSendEmail: true,
    lawyerRoundRobin: 0,
    updatedAt: '',
    updatedBy: '시스템',
};
