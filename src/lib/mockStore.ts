// src/lib/mockStore.ts  v5 — 로펌 OS 확장 기반
// 영업·변호사·관리자·송무팀 공용 저장소 + 역할 시스템 + 모듈 레지스트리

// ── 역할(Role) 시스템 ─────────────────────────────────────────
// Phase 2에서 실제 인증과 연결됩니다.
// 새 팀 추가 시 여기에 역할을 추가하면 전체 시스템에 반영됩니다.
export type RoleType =
    | 'super_admin'  // 전체 접근
    | 'admin'        // 관리자 KPI
    | 'sales'        // 영업팀
    | 'lawyer'       // 변호사팀
    | 'litigation'   // 송무팀
    | 'general'      // 총무팀 (로펌 내부)
    | 'hr'           // 인사팀 (로펌 내부)
    | 'finance'      // 회계팀 (로펌 내부)
    | 'counselor'    // EAP 심리상담사 (신규)
    | 'client_hr';   // 고객사 HR 담당자 (신규)

// ── 모듈 레지스트리 ──────────────────────────────────────────
// Navbar, 권한체크, 메뉴 렌더링의 단일 진실 공급원(SSOT).
// 새 팀/기능 추가 = 여기에 항목 하나 추가.
export type ModuleStatus = 'active' | 'beta' | 'coming_soon';

export interface ModuleDefinition {
    id: string;
    href: string;
    label: string;
    icon: string;           // lucide 아이콘 이름 (Navbar에서 resolve)
    roles: RoleType[];      // 접근 가능 역할 목록
    status: ModuleStatus;
    hideable: boolean;      // 사용자가 숨길 수 있는지
    badge?: 'employee' | 'lawyer' | 'admin' | 'litigation';
    phase: 1 | 2 | 3;      // 개발 단계
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
    // ── Phase 1 — 현재 운영 중 ──
    { id: 'employee', href: '/employee', label: '영업 CRM', icon: 'Users', roles: ['super_admin', 'admin', 'sales'], status: 'active', hideable: false, badge: 'employee', phase: 1 },
    { id: 'lawyer', href: '/lawyer', label: '변호사 검토', icon: 'Gavel', roles: ['super_admin', 'admin', 'lawyer', 'sales'], status: 'active', hideable: false, badge: 'lawyer', phase: 1 },
    { id: 'litigation', href: '/litigation', label: '송무팀', icon: 'Swords', roles: ['super_admin', 'admin', 'lawyer', 'litigation'], status: 'active', hideable: true, badge: 'litigation', phase: 1 },
    { id: 'admin', href: '/admin', label: '관리자 KPI', icon: 'BarChart3', roles: ['super_admin', 'admin'], status: 'active', hideable: false, badge: 'admin', phase: 1 },
    // ── Phase 2 — EAP 모듈 ──
    { id: 'eap', href: '/eap', label: 'EAP 상담', icon: 'Heart', roles: ['counselor', 'super_admin', 'admin'], status: 'beta', hideable: false, phase: 2 },
    { id: 'counselor', href: '/counselor', label: '상담사 포털', icon: 'HeartHandshake', roles: ['counselor', 'super_admin'], status: 'beta', hideable: false, phase: 2 },
    { id: 'company-hr', href: '/company-hr', label: '고객사 HR', icon: 'Building2', roles: ['client_hr', 'super_admin', 'admin'], status: 'beta', hideable: false, phase: 2 },
    // ── Phase 2 — 로펌 내부 업무툴 ──
    { id: 'general', href: '/general', label: '총무팀', icon: 'Building2', roles: ['super_admin', 'admin', 'general'], status: 'coming_soon', hideable: true, phase: 2 },
    { id: 'hr', href: '/hr', label: '인사팀(내부)', icon: 'UserCog', roles: ['super_admin', 'admin', 'hr'], status: 'coming_soon', hideable: true, phase: 2 },
    { id: 'finance', href: '/finance', label: '회계팀', icon: 'Coins', roles: ['super_admin', 'admin', 'finance'], status: 'coming_soon', hideable: true, phase: 2 },
    // ── Phase 3 — 지식·AI ──
    { id: 'knowledge', href: '/knowledge', label: '법률 지식관리', icon: 'BookOpen', roles: ['super_admin', 'admin', 'lawyer', 'litigation'], status: 'coming_soon', hideable: true, phase: 3 },
];

// 현재 사용자 역할 — Phase 2에서 실제 인증으로 교체
const ROLE_KEY = 'ibs_role';
export function getCurrentRole(): RoleType {
    // ⚠️ SSR 컨텍스트에서 최고 권한 반환 방지 — 'sales'로 폴백
    if (typeof window === 'undefined') return 'sales';
    return (localStorage.getItem(ROLE_KEY) as RoleType) ?? 'sales';
}
export function setCurrentRole(role: RoleType) {
    localStorage.setItem(ROLE_KEY, role);
}
export function getAccessibleModules(role: RoleType): ModuleDefinition[] {
    return MODULE_REGISTRY.filter(m => m.roles.includes(role));
}


export type CaseStatus =
    | 'pending'           // 검토 대기
    | 'crawling'          // 자동 검토·분석 중
    | 'analyzed'          // AI 분석 완료 (자동컨펌 옵션)
    | 'sales_confirmed'   // 영업 컨펌 완료
    | 'assigned'          // 변호사 자동 배정
    | 'reviewing'         // 변호사 검토 중
    | 'lawyer_confirmed'  // 변호사 컨펌 완료
    | 'emailed'           // 이메일 자동 발송
    | 'client_replied'    // 클라이언트 답장
    | 'client_viewed'     // 클라이언트 리포트 열람
    | 'contract_sent'     // 계약서 발송
    | 'contract_signed'   // 계약서 서명 완료
    | 'subscribed';       // 구독 완료 (결제+이관)

export interface Issue {
    id: string;
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    law: string;
    title: string;
    originalText: string;
    riskDesc: string;
    customDraft: string;   // AI 초안 → 변호사 수정
    lawyerNote: string;
    reviewChecked: boolean;
    aiDraftGenerated: boolean; // AI 초안 자동생성 여부
}

// ── 리드 통합 타입 (leadStore에서 흡수) ──────────────────────
export interface CompanyContact {
    id: string;
    name: string;
    role?: string;
    department?: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
}

export interface CompanyMemo {
    id: string;
    createdAt: string;
    author: string;
    content: string;
}

export type TimelineEventType = 'status_change' | 'call' | 'email' | 'note' | 'meeting';
export interface CompanyTimelineEvent {
    id: string;
    createdAt: string;
    author: string;
    type: TimelineEventType;
    content: string;
    fromStatus?: CaseStatus;
    toStatus?: CaseStatus;
}

export interface Company {
    id: string;
    name: string;
    biz: string;
    url: string;
    email: string;
    phone: string;
    storeCount: number;
    status: CaseStatus;
    assignedLawyer: string;
    issues: Issue[];
    salesConfirmed: boolean;
    salesConfirmedAt: string;
    salesConfirmedBy: string;
    lawyerConfirmed: boolean;
    lawyerConfirmedAt: string;
    emailSentAt: string;
    emailSubject: string;
    clientReplied: boolean;
    clientRepliedAt: string;
    clientReplyNote: string;
    loginCount: number;
    callNote: string;
    plan: 'none' | 'starter' | 'standard' | 'premium';
    createdAt: string;
    updatedAt: string;
    // AI 자동화 메타
    autoMode: boolean;
    aiDraftReady: boolean;
    source: 'manual' | 'crawler';
    // ── 리드 통합 필드 (leadStore에서 흡수) ──
    riskScore: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | '';
    issueCount: number;
    bizType: string;
    domain: string;
    privacyUrl: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    contacts: CompanyContact[];
    memos: CompanyMemo[];
    timeline: CompanyTimelineEvent[];
    customScript?: { call?: string; email?: string; lastEditedAt?: string };
    lawyerNote?: string;
    // ── 계약 프로세스 필드 ──
    contractSentAt?: string;
    contractSignedAt?: string;
    contractMethod?: 'email' | 'system' | 'offline';
    contractNote?: string;
}

// ── 송무팀 사건 ──────────────────────────────────────────────
export type LitigationStatus =
    | 'preparing'    // 소장 준비
    | 'filed'        // 접수 완료
    | 'hearing'      // 심리 중
    | 'settlement'   // 합의 진행
    | 'judgment'     // 판결
    | 'closed';      // 종결

export interface LitigationDeadline {
    id: string;
    label: string;       // "1차 준비서면 제출"
    dueDate: string;
    completed: boolean;
    completedAt: string;
}

export interface LitigationCase {
    id: string;
    companyId: string;   // 연결된 의뢰인
    companyName: string;
    caseNo: string;      // 사건번호
    court: string;       // 법원
    type: string;        // 소송 유형
    opponent: string;    // 상대방
    claimAmount: number; // 청구금액
    status: LitigationStatus;
    assignedLawyer: string;
    deadlines: LitigationDeadline[];
    notes: string;
    result: '' | '승소' | '패소' | '합의' | '취하';
    resultNote: string;
    createdAt: string;
    updatedAt: string;
}

// ── AI 초안 생성 (GPT-4o Mock) ───────────────────────────────
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

문의: 개인정보보호 담당자 privacy@ibslaw.co.kr

[AI 생성 초안 — 변호사 검토 필요]`,
};

const BASE_ISSUES: Issue[] = [
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
        createdAt: '', updatedAt: '',
        // 리드 통합 필드 기본값
        riskScore: 0, riskLevel: '', issueCount: 0, bizType: '',
        domain: '', privacyUrl: '',
        contactName: '', contactEmail: '', contactPhone: '',
        contacts: [], memos: [], timeline: [],
        ...p,
    };
}

const CASE_KEY = 'ibs_store_v4';
const LIT_KEY = 'ibs_lit_v1';
const AUTO_KEY = 'ibs_auto_settings';

// ── 기본 데이터 ──────────────────────────────────────────────
const DEFAULT_COMPANIES: Company[] = [
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

const DEFAULT_LIT: LitigationCase[] = [
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

// ── 자동화 설정 ───────────────────────────────────────────────
export interface AutoSettings {
    autoSalesConfirm: boolean;   // 분석완료 → 자동 영업컨펌
    autoAssignLawyer: boolean;   // 영업컨펌 → 변호사 자동배정
    autoGenerateDraft: boolean;  // AI 초안 자동생성
    autoSendEmail: boolean;      // 변호사컨펌 → 자동발송
    lawyerRoundRobin: number;    // 현재 배정 인덱스
    updatedAt: string;           // 마지막 설정 변경 시각
    updatedBy: string;           // 누가 변경했는지
}

// 자동화 활동 로그
export interface AutoLog {
    id: string;
    at: string;          // 발생 시각
    type: 'auto_confirm' | 'auto_assign' | 'auto_email' | 'setting_change' | 'ai_analysis';
    label: string;       // "영업 자동 컨펌"
    companyName?: string;
    detail: string;      // "분석완료 → 자동 컨펌 처리됨"
    prevValue?: string;  // 설정 변경 전 값
    newValue?: string;   // 설정 변경 후 값
}

const DEFAULT_AUTO: AutoSettings = {
    autoSalesConfirm: true,
    autoAssignLawyer: true,
    autoGenerateDraft: true,
    autoSendEmail: true,
    lawyerRoundRobin: 0,
    updatedAt: '',
    updatedBy: '시스템',
};

function loadAuto(): AutoSettings {
    if (typeof window === 'undefined') return DEFAULT_AUTO;
    try { return { ...DEFAULT_AUTO, ...JSON.parse(localStorage.getItem(AUTO_KEY) || 'null') }; } catch { return DEFAULT_AUTO; }
}
function saveAuto(s: AutoSettings) {
    if (typeof window !== 'undefined') localStorage.setItem(AUTO_KEY, JSON.stringify(s));
}

const LOG_KEY = 'ibs_auto_logs';
const MAX_LOGS = 50;

function loadLogs(): AutoLog[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
}
function addLog(log: Omit<AutoLog, 'id' | 'at'>) {
    if (typeof window === 'undefined') return;
    const logs = loadLogs();
    logs.unshift({
        ...log,
        id: `log${Date.now()}`,
        at: new Date().toLocaleString('ko-KR', { hour12: false }),
    });
    if (logs.length > MAX_LOGS) logs.pop();
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

function load(): Company[] {
    if (typeof window === 'undefined') return DEFAULT_COMPANIES;
    try {
        const raw = localStorage.getItem(CASE_KEY);
        if (!raw) { localStorage.setItem(CASE_KEY, JSON.stringify(DEFAULT_COMPANIES)); return DEFAULT_COMPANIES; }
        return JSON.parse(raw);
    } catch { return DEFAULT_COMPANIES; }
}
function save(cs: Company[]) {
    if (typeof window !== 'undefined') localStorage.setItem(CASE_KEY, JSON.stringify(cs));
}

function loadLit(): LitigationCase[] {
    if (typeof window === 'undefined') return DEFAULT_LIT;
    try {
        const raw = localStorage.getItem(LIT_KEY);
        if (!raw) { localStorage.setItem(LIT_KEY, JSON.stringify(DEFAULT_LIT)); return DEFAULT_LIT; }
        return JSON.parse(raw);
    } catch { return DEFAULT_LIT; }
}
function saveLit(cs: LitigationCase[]) {
    if (typeof window !== 'undefined') localStorage.setItem(LIT_KEY, JSON.stringify(cs));
}

// ── 자동화 파이프라인 ─────────────────────────────────────────
// 재귀 setTimeout → async Promise 체이닝 (메모리 누수 제거, 명시적 종료 조건)
async function runAutoPipeline(companyId: string): Promise<void> {
    const delay = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

    // Step 1: 자동 영업 컨펌
    await delay(500);
    {
        const settings = loadAuto();
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c && c.status === 'analyzed' && settings.autoSalesConfirm) {
            const now = new Date().toLocaleString('ko-KR', { hour12: false });
            c.status = 'sales_confirmed';
            c.salesConfirmed = true;
            c.salesConfirmedAt = now;
            c.salesConfirmedBy = 'AI 자동';
            c.updatedAt = new Date().toISOString();
            save(all);
            addLog({ type: 'auto_confirm', label: '영업 자동 컨펌', companyName: c.name, detail: `분석완료 → AI가 자동으로 영업 컨펌 처리 (담당: AI 자동)` });
        }
    }

    // Step 2: 자동 변호사 배정
    await delay(800);
    {
        const settings = loadAuto();
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c && c.status === 'sales_confirmed' && settings.autoAssignLawyer && !c.assignedLawyer) {
            const s = loadAuto();
            const lawyer = LAWYERS[s.lawyerRoundRobin % LAWYERS.length];
            s.lawyerRoundRobin = (s.lawyerRoundRobin + 1) % LAWYERS.length;
            saveAuto(s);
            c.assignedLawyer = lawyer;
            c.status = 'assigned';
            c.updatedAt = new Date().toISOString();
            save(all);
            addLog({ type: 'auto_assign', label: '변호사 자동 배정', companyName: c.name, detail: `라운드로빈 → ${lawyer} 자동 배정 완료` });
        }
    }

    // Step 3: 변호사 컨펌 후 자동 이메일 발송
    await delay(800);
    {
        const settings = loadAuto();
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c && c.status === 'lawyer_confirmed' && settings.autoSendEmail && !c.emailSentAt) {
            const now = new Date().toLocaleString('ko-KR', { hour12: false });
            c.status = 'emailed';
            c.emailSentAt = `${now} (자동발송)`;
            c.emailSubject = `[IBS 법률사무소] ${c.name} 개인정보처리방침 법률 검토 결과`;
            c.updatedAt = new Date().toISOString();
            save(all);
            addLog({ type: 'auto_email', label: '이메일 자동 발송', companyName: c.name, detail: `변호사 컨펌 → ${c.email}로 자동 발송 완료` });
        }
    }
}

export const store = {
    getAll(): Company[] { return load(); },
    getById(id: string): Company | undefined { return load().find(c => c.id === id); },
    getAutoSettings(): AutoSettings { return loadAuto(); },
    getLogs(): AutoLog[] { return loadLogs(); },
    clearLogs(): void { if (typeof window !== 'undefined') localStorage.removeItem(LOG_KEY); },

    updateAutoSettings(patch: Partial<AutoSettings>, changedBy = '영업팀'): AutoSettings {
        const prev = loadAuto();
        const s = { ...prev, ...patch, updatedAt: new Date().toLocaleString('ko-KR', { hour12: false }), updatedBy: changedBy };
        saveAuto(s);
        // 변경된 항목들 로그 기록
        const LABELS: Record<string, string> = {
            autoSalesConfirm: '영업 자동 컨펌',
            autoAssignLawyer: '변호사 자동 배정',
            autoGenerateDraft: 'AI 초안 자동생성',
            autoSendEmail: '이메일 자동 발송',
        };
        (Object.keys(patch) as (keyof AutoSettings)[]).forEach(key => {
            if (key in LABELS && patch[key] !== prev[key]) {
                addLog({
                    type: 'setting_change',
                    label: `설정 변경: ${LABELS[key]}`,
                    detail: `${changedBy}가 설정 변경`,
                    prevValue: prev[key] ? '🟢 ON' : '🔴 OFF',
                    newValue: patch[key] ? '🟢 ON' : '🔴 OFF',
                });
            }
        });
        return s;
    },

    update(id: string, patch: Partial<Company>): Company[] {
        const all = load();
        const idx = all.findIndex(c => c.id === id);
        if (idx >= 0) all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
        save(all); return all;
    },

    updateIssue(companyId: string, issueId: string, patch: Partial<Issue>): Company[] {
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c) { const issue = c.issues.find(i => i.id === issueId); if (issue) Object.assign(issue, patch); c.updatedAt = new Date().toISOString(); }
        save(all); return all;
    },

    add(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Company[] {
        const all = load();
        const c: Company = { ...data, id: `c${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        all.unshift(c);
        save(all);
        return all;
    },

    triggerAI(companyId: string): void {
        store.update(companyId, { status: 'crawling', issues: [], aiDraftReady: false });
        const c0 = store.getById(companyId);
        addLog({ type: 'ai_analysis', label: '분석 시작', companyName: c0?.name, detail: '개인정보처리방침 자동 검토 및 이슈 분석 시작' });
        setTimeout(() => {
            const all = load();
            const c = all.find(co => co.id === companyId);
            if (c && c.status === 'crawling') {
                c.issues = BASE_ISSUES.map(i => ({ ...i }));
                c.status = 'analyzed';
                c.aiDraftReady = true;
                // 리드 통합: 리스크 점수/등급/이슈 수 자동 설정
                c.issueCount = c.issues.length;
                const highCount = c.issues.filter(i => i.level === 'HIGH').length;
                c.riskLevel = highCount >= 2 ? 'HIGH' : highCount >= 1 ? 'MEDIUM' : 'LOW';
                c.riskScore = highCount * 30 + c.issues.filter(i => i.level === 'MEDIUM').length * 15 + c.issues.filter(i => i.level === 'LOW').length * 5;
                c.updatedAt = new Date().toISOString();
                save(all);
                addLog({ type: 'ai_analysis', label: 'AI 분석 완료', companyName: c.name, detail: `이슈 ${c.issues.length}건 발견, AI 수정문구 초안 자동 생성 완료` });
                runAutoPipeline(companyId);
            }
        }, 3000);
    },

    salesConfirm(companyId: string, by: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const result = store.update(companyId, { salesConfirmed: true, salesConfirmedAt: now, salesConfirmedBy: by, status: 'sales_confirmed' });
        runAutoPipeline(companyId);
        return result;
    },

    assignLawyer(companyId: string, lawyer: string): Company[] {
        return store.update(companyId, { assignedLawyer: lawyer, status: 'assigned' });
    },

    markReviewing(companyId: string): Company[] {
        const c = store.getById(companyId);
        if (c && c.status === 'assigned') return store.update(companyId, { status: 'reviewing' });
        return load();
    },

    lawyerConfirm(companyId: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const result = store.update(companyId, { lawyerConfirmed: true, lawyerConfirmedAt: now, status: 'lawyer_confirmed' });
        runAutoPipeline(companyId);
        return result;
    },

    // ── 리드 통합 메서드 (leadStore에서 흡수) ──
    addMemo(companyId: string, memo: { author: string; content: string }): Company[] {
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c) {
            if (!c.memos) c.memos = [];
            c.memos.push({ id: `m${Date.now()}`, createdAt: new Date().toISOString(), ...memo });
            c.updatedAt = new Date().toISOString();
        }
        save(all); return all;
    },

    addTimelineEvent(companyId: string, event: Omit<CompanyTimelineEvent, 'id'>): Company[] {
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c) {
            if (!c.timeline) c.timeline = [];
            c.timeline.push({ id: `t${Date.now()}`, ...event });
            c.updatedAt = new Date().toISOString();
        }
        save(all); return all;
    },

    saveScript(companyId: string, script: { call?: string; email?: string }): Company[] {
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c) {
            c.customScript = { ...c.customScript, ...script, lastEditedAt: new Date().toISOString() };
            c.updatedAt = new Date().toISOString();
        }
        save(all); return all;
    },

    sendEmail(companyId: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const c = store.getById(companyId);
        return store.update(companyId, {
            status: 'emailed',
            emailSentAt: now,
            emailSubject: `[IBS 법률사무소] ${c?.name ?? ''} 개인정보처리방침 법률 검토 결과`,
        });
    },

    markClientReplied(companyId: string, note: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        return store.update(companyId, { clientReplied: true, clientRepliedAt: now, clientReplyNote: note, status: 'client_replied' });
    },

    markClientViewed(companyId: string): Company[] {
        return store.update(companyId, { status: 'client_viewed' });
    },

    sendContract(companyId: string, method: 'email' | 'system' | 'offline' = 'email', note?: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const c = store.getById(companyId);
        addLog({ type: 'auto_email', label: '계약서 발송', companyName: c?.name, detail: `계약서 ${method === 'email' ? '이메일' : method === 'system' ? '시스템' : '오프라인'} 발송` });
        return store.update(companyId, { status: 'contract_sent', contractSentAt: now, contractMethod: method, contractNote: note || '' });
    },

    signContract(companyId: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const c = store.getById(companyId);
        addLog({ type: 'auto_confirm', label: '계약 서명 확인', companyName: c?.name, detail: '고객 계약서 서명 완료' });
        return store.update(companyId, { status: 'contract_signed', contractSignedAt: now });
    },

    subscribe(companyId: string, plan: 'starter' | 'standard' | 'premium'): Company[] {
        const result = store.update(companyId, { status: 'subscribed', plan });
        const c = store.getById(companyId);
        if (c) {
            // ── 송무팀 자동 이관 ──
            store.addLit({
                companyId: c.id,
                companyName: c.name,
                caseNo: `AUTO-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
                court: '',
                type: '개인정보 자문',
                opponent: '',
                claimAmount: 0,
                status: 'preparing',
                assignedLawyer: c.assignedLawyer || '',
                deadlines: [
                    { id: `d${Date.now()}`, label: '초기 자문 보고서 제출', dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], completed: false, completedAt: '' },
                    { id: `d${Date.now() + 1}`, label: '개인정보처리방침 수정 완료', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], completed: false, completedAt: '' },
                ],
                notes: `구독 자동 이관. 플랜: ${plan}. 이슈 ${c.issueCount}건.`,
                result: '',
                resultNote: '',
            });
            addLog({ type: 'auto_confirm', label: '송무팀 자동 이관', companyName: c.name, detail: `구독 확정 → 송무팀에 자동 이관 (플랜: ${plan})` });
        }
        return result;
    },

    getBadge(role: 'admin' | 'employee' | 'lawyer' | 'litigation'): number {
        const all = load();
        if (role === 'lawyer') return all.filter(c => ['sales_confirmed', 'assigned', 'reviewing'].includes(c.status)).length;
        if (role === 'employee') return all.filter(c => c.status === 'analyzed' || c.status === 'lawyer_confirmed' || c.status === 'client_replied').length;
        if (role === 'admin') return all.filter(c => ['analyzed', 'sales_confirmed', 'lawyer_confirmed'].includes(c.status)).length;
        if (role === 'litigation') {
            const lits = loadLit();
            const today = new Date();
            return lits.filter(l => l.deadlines.some(d => !d.completed && new Date(d.dueDate) <= new Date(today.getTime() + 7 * 86400000))).length;
        }
        return 0;
    },

    reset(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(CASE_KEY);
        localStorage.removeItem(LIT_KEY);
        localStorage.removeItem(AUTO_KEY);
        localStorage.removeItem(LOG_KEY);
    },

    // ── 송무팀 ──
    getLitAll(): LitigationCase[] { return loadLit(); },
    getLitById(id: string): LitigationCase | undefined { return loadLit().find(l => l.id === id); },

    addLit(data: Omit<LitigationCase, 'id' | 'createdAt' | 'updatedAt'>): LitigationCase[] {
        const all = loadLit();
        all.unshift({ ...data, id: `l${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        saveLit(all); return all;
    },

    updateLit(id: string, patch: Partial<LitigationCase>): LitigationCase[] {
        const all = loadLit();
        const idx = all.findIndex(l => l.id === id);
        if (idx >= 0) all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
        saveLit(all); return all;
    },

    updateDeadline(litId: string, deadlineId: string, patch: Partial<LitigationDeadline>): LitigationCase[] {
        const all = loadLit();
        const lit = all.find(l => l.id === litId);
        if (lit) { const d = lit.deadlines.find(x => x.id === deadlineId); if (d) Object.assign(d, patch); lit.updatedAt = new Date().toISOString(); }
        saveLit(all); return all;
    },
};

// ── 상수 ─────────────────────────────────────────────────────
export const STATUS_LABEL: Record<CaseStatus, string> = {
    pending: '등록됨', crawling: '분석중', analyzed: '분석완료',
    sales_confirmed: '영업컨펌', assigned: '변호사배정',
    reviewing: '검토중', lawyer_confirmed: '변호사컨펌',
    emailed: '발송완료', client_replied: '답장수신',
    client_viewed: '리포트열람', contract_sent: '계약서발송',
    contract_signed: '계약서명', subscribed: '구독완료',
};

export const STATUS_COLOR: Record<CaseStatus, string> = {
    pending: 'rgba(148,163,184,0.15)', crawling: 'rgba(251,191,36,0.15)',
    analyzed: 'rgba(59,130,246,0.15)', sales_confirmed: 'rgba(167,139,250,0.15)',
    assigned: 'rgba(249,115,22,0.15)', reviewing: 'rgba(249,115,22,0.2)',
    lawyer_confirmed: 'rgba(20,184,166,0.15)', emailed: 'rgba(34,197,94,0.15)',
    client_replied: 'rgba(236,72,153,0.15)', client_viewed: 'rgba(129,140,248,0.15)',
    contract_sent: 'rgba(251,191,36,0.2)', contract_signed: 'rgba(74,222,128,0.2)',
    subscribed: 'rgba(201,168,76,0.2)',
};

export const STATUS_TEXT: Record<CaseStatus, string> = {
    pending: '#94a3b8', crawling: '#fbbf24', analyzed: '#60a5fa',
    sales_confirmed: '#a78bfa', assigned: '#fb923c', reviewing: '#fdba74',
    lawyer_confirmed: '#2dd4bf', emailed: '#4ade80', client_replied: '#f472b6',
    client_viewed: '#818cf8', contract_sent: '#fbbf24',
    contract_signed: '#4ade80', subscribed: '#c9a84c',
};

export const LIT_STATUS_LABEL: Record<LitigationStatus, string> = {
    preparing: '소장 준비', filed: '접수완료', hearing: '심리중',
    settlement: '합의진행', judgment: '판결', closed: '종결',
};

export const LIT_STATUS_COLOR: Record<LitigationStatus, string> = {
    preparing: 'rgba(148,163,184,0.2)', filed: 'rgba(59,130,246,0.2)',
    hearing: 'rgba(249,115,22,0.2)', settlement: 'rgba(167,139,250,0.2)',
    judgment: 'rgba(201,168,76,0.2)', closed: 'rgba(74,222,128,0.15)',
};

export const PIPELINE: CaseStatus[] = [
    'pending', 'crawling', 'analyzed', 'sales_confirmed',
    'assigned', 'reviewing', 'lawyer_confirmed', 'emailed', 'client_replied',
    'client_viewed', 'contract_sent', 'contract_signed', 'subscribed',
];

export const LAWYERS = ['김수현 변호사', '이지원 변호사', '박민준 변호사', '최유진 변호사'];
export const SALES_REPS = ['이민준', '박지수', '최현우', '강수빈'];
export const LITIGATION_TYPES = ['개인정보 손해배상', '가맹계약 분쟁', '임직원 분쟁', '지적재산권', '계약 불이행', '기타'];
export const COURTS = ['서울중앙지방법원', '수원지방법원', '서울고등법원', '대법원', '수원고등법원'];

// ── 법률 상담 시스템 ──────────────────────────────────────────
export type ConsultCategory = '가맹계약' | '개인정보' | '형사' | '노무' | '지식재산' | '기타';
export type ConsultUrgency = 'urgent' | 'normal';
export type ConsultStatus =
    | 'submitted'    // 접수 완료
    | 'ai_analyzing' // AI 분류 중
    | 'ai_done'      // AI 1차 답변 완료
    | 'assigned'     // 변호사 배정
    | 'reviewing'    // 변호사 검토 중
    | 'answered'     // 변호사 답변 발송
    | 'callback_requested' // 콜백 요청됨
    | 'callback_done';     // 콜백 완료

export interface Consultation {
    id: string;
    companyId: string;   // 본사 ID
    companyName: string;
    branchName: string;  // 가맹점명 / 임직원 소속
    authorName: string;  // 작성자 이름
    authorRole: '가맹점주' | '임직원' | '본사직원';
    category: ConsultCategory;
    urgency: ConsultUrgency;
    title: string;
    body: string;        // 상담 내용
    aiAnswer: string;    // AI 1차 답변
    aiConfidence: number; // AI 신뢰도 0~100
    aiLaw: string[];     // AI가 참조한 법령
    lawyerAnswer: string; // 변호사 최종 답변 (편집됨)
    assignedLawyer: string;
    assignedAt: string;
    answeredAt: string;
    callbackPhone: string;
    callbackRequestedAt: string;
    callbackDoneAt: string;
    callbackNote: string;
    status: ConsultStatus;
    createdAt: string;
    updatedAt: string;
    isPrivate: boolean;  // 본사에 비공개 여부
}

// AI 답변 mock 생성
function genAiAnswer(category: ConsultCategory, body: string): { answer: string; law: string[]; confidence: number } {
    const map: Record<ConsultCategory, { answer: string; law: string[] }> = {
        '가맹계약': {
            answer: `가맹사업거래의 공정화에 관한 법률(가맹사업법)에 따르면, 가맹본부는 가맹계약서를 계약 체결 14일 전에 제공해야 합니다.\n\n귀하의 질의 내용을 검토한 결과, 계약서 내 위약금 조항이 가맹사업법 시행령 제14조 기준을 초과할 가능성이 있습니다. 변호사 검토 후 구체적인 조치를 권장합니다.\n\n[AI 1차 분석 — 변호사 교차검증 후 최종 확인]`,
            law: ['가맹사업거래의 공정화에 관한 법률 제7조', '동법 시행령 제14조'],
        },
        '개인정보': {
            answer: `개인정보보호법 제29조에 따라 개인정보처리자는 안전성 확보에 필요한 기술적·관리적·물리적 조치를 취해야 합니다.\n\n귀하의 상황에서는 동의서 재수집 절차와 처리방침 개정이 우선적으로 필요해 보입니다. 위반 시 과태료가 최대 3,000만원에 달할 수 있습니다.\n\n[AI 1차 분석 — 변호사 교차검증 후 최종 확인]`,
            law: ['개인정보보호법 제29조', '동법 제30조 제1항'],
        },
        '형사': {
            answer: `형사 사안은 즉각적인 법률 전문가 상담이 필요합니다. 현재 AI 분석만으로는 형사 리스크 수준을 정확히 판단하기 어려우며, 담당 변호사의 긴급 개입이 권장됩니다.\n\n콜백을 요청하시면 익일 영업일 내 담당 변호사가 직접 연락드립니다.\n\n[AI 1차 분석 — 담당 변호사 긴급 배정 권장]`,
            law: ['형법 제347조(사기)', '형사소송법 제244조'],
        },
        '노무': {
            answer: `근로기준법 및 최저임금법에 따른 검토 결과, 근로계약서 미작성·최저임금 미달·초과근무 미지급 등이 주요 위험 요인입니다.\n\n가맹점의 경우도 가맹점주 사용자 책임이 인정될 수 있어 본사 차원의 가이드라인 정비가 필요합니다.\n\n[AI 1차 분석 — 변호사 교차검증 후 최종 확인]`,
            law: ['근로기준법 제17조', '최저임금법 제6조'],
        },
        '지식재산': {
            answer: `상표권·저작권 관련 분쟁은 상표법 및 저작권법에 따라 판단됩니다. 유사 상표 사용은 상표법 제108조 위반으로 형사처벌 대상이 될 수 있습니다.\n\n가맹계약 내 IP 사용 조항을 재검토하고, 상표 사용 허락 범위를 명확히 하는 것이 권장됩니다.\n\n[AI 1차 분석 — 변호사 교차검증 후 최종 확인]`,
            law: ['상표법 제108조', '저작권법 제136조'],
        },
        '기타': {
            answer: `귀하의 질의를 검토한 결과, 관련 법령 및 판례 분석이 필요합니다. 담당 변호사가 구체적인 사실관계를 확인 후 정확한 법적 견해를 제공해 드릴 예정입니다.\n\n48시간 내 답변을 드리겠으며, 긴급한 경우 콜백을 요청하시면 익일 영업일 내 연락드립니다.\n\n[AI 1차 분석 — 변호사 교차검증 후 최종 확인]`,
            law: ['민법 제750조(불법행위)', '상법 제1조'],
        },
    };
    const conf = category === '형사' ? 52 : category === '기타' ? 65 : Math.floor(Math.random() * 20) + 75;
    return { answer: map[category].answer, law: map[category].law, confidence: conf };
}

const CONSULT_KEY = 'ibs_consult_v1';

// 라운드로빈 배정 — AutoSettings.lawyerRoundRobin(localStorage)으로 통일 관리
// 이전의 인메모리 let _lawyerIdx 제거: 새고침 시리셋 문제 해결
function assignNextLawyer(): string {
    const s = loadAuto();
    const lawyer = LAWYERS[s.lawyerRoundRobin % LAWYERS.length];
    saveAuto({ ...s, lawyerRoundRobin: (s.lawyerRoundRobin + 1) % LAWYERS.length });
    return lawyer;
}

const DEFAULT_CONSULTATIONS: Consultation[] = [
    {
        id: 'q1', companyId: 'c1', companyName: '(주)놀부NBG', branchName: '강남1호점', authorName: '김가맹', authorRole: '가맹점주',
        category: '가맹계약', urgency: 'normal', title: '계약 갱신 거절 통보 받았습니다',
        body: '본사에서 5년 계약 만료 후 갱신 거절 공문을 받았습니다. 이게 법적으로 가능한가요? 보증금 환급도 요청했는데 묵묵부답입니다.',
        aiAnswer: genAiAnswer('가맹계약', '').answer, aiConfidence: 82, aiLaw: ['가맹사업거래의 공정화에 관한 법률 제7조', '동법 시행령 제14조'],
        lawyerAnswer: '', assignedLawyer: '이지원 변호사', assignedAt: '2026-02-28 09:00',
        answeredAt: '', callbackPhone: '', callbackRequestedAt: '', callbackDoneAt: '', callbackNote: '',
        status: 'assigned', createdAt: '2026-02-28 08:30', updatedAt: '2026-02-28 09:00', isPrivate: true,
    },
    {
        id: 'q2', companyId: 'c3', companyName: '(주)파리바게뜨', branchName: '분당판교점', authorName: '박점주', authorRole: '가맹점주',
        category: '개인정보', urgency: 'urgent', title: '개인정보보호위원회 조사 통보 받았습니다 — 긴급',
        body: '오늘 개인정보보호위원회로부터 현장조사 통보를 받았습니다. 다음주 월요일 방문 예정입니다. 어떻게 대응해야 하나요? 처리방침이 오래됐습니다.',
        aiAnswer: genAiAnswer('개인정보', '').answer, aiConfidence: 78, aiLaw: ['개인정보보호법 제29조', '동법 제30조 제1항'],
        lawyerAnswer: '', assignedLawyer: '', assignedAt: '',
        answeredAt: '', callbackPhone: '010-1234-5678', callbackRequestedAt: '2026-02-28 10:15',
        callbackDoneAt: '', callbackNote: '',
        status: 'callback_requested', createdAt: '2026-02-28 10:00', updatedAt: '2026-02-28 10:15', isPrivate: true,
    },
    {
        id: 'q3', companyId: 'c4', companyName: '(주)bhc치킨', branchName: '본사 인사팀', authorName: '이담당', authorRole: '임직원',
        category: '노무', urgency: 'normal', title: '가맹점 아르바이트 최저임금 위반 민원',
        body: '가맹점에서 알바 직원이 최저임금 위반 민원을 고용노동부에 제기했다는 연락이 왔습니다. 본사가 공동 책임을 질 수 있나요?',
        aiAnswer: genAiAnswer('노무', '').answer, aiConfidence: 79, aiLaw: ['근로기준법 제17조', '최저임금법 제6조'],
        lawyerAnswer: `귀하의 질의를 검토한 결과, 가맹본부의 사용자 책임 인정 여부는 가맹점에 대한 지배·관리 정도에 따라 판단됩니다.\n\n최근 판례(서울고법 2024나12345)에 따르면 본사가 인사·노무에 실질적 개입을 한 경우 공동사용자로 인정될 수 있습니다.\n\n**권장 조치:**\n1. 해당 가맹점 근로계약서 즉시 확인\n2. 가맹계약서 내 노무 관련 조항 점검\n3. 고용노동부 조사 전 자체감사 실시\n\n추가 상담이 필요하시면 연락주십시오.\n\n— 김수현 변호사`,
        assignedLawyer: '김수현 변호사', assignedAt: '2026-02-27 11:00',
        answeredAt: '2026-02-27 16:30', callbackPhone: '', callbackRequestedAt: '', callbackDoneAt: '', callbackNote: '',
        status: 'answered', createdAt: '2026-02-27 10:00', updatedAt: '2026-02-27 16:30', isPrivate: false,
    },
];

class ConsultStore {
    private items: Consultation[] = [];

    constructor() {
        if (typeof window === 'undefined') { this.items = [...DEFAULT_CONSULTATIONS]; return; }
        const saved = localStorage.getItem(CONSULT_KEY);
        this.items = saved ? JSON.parse(saved) : [...DEFAULT_CONSULTATIONS];
    }

    private save() { if (typeof window !== 'undefined') localStorage.setItem(CONSULT_KEY, JSON.stringify(this.items)); }

    getAll(): Consultation[] { return [...this.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
    getByCompany(cid: string): Consultation[] { return this.getAll().filter(q => q.companyId === cid); }
    getById(id: string): Consultation | undefined { return this.items.find(q => q.id === id); }
    getUnassigned(): Consultation[] { return this.getAll().filter(q => q.status === 'ai_done' || q.status === 'callback_requested'); }
    getForLawyer(lawyer: string): Consultation[] { return this.getAll().filter(q => q.assignedLawyer === lawyer || q.status === 'ai_done'); }

    submit(data: {
        companyId: string; companyName: string; branchName: string;
        authorName: string; authorRole: Consultation['authorRole'];
        category: ConsultCategory; title: string; body: string;
        urgency: ConsultUrgency; callbackPhone?: string; isPrivate?: boolean;
    }): Consultation {
        const now = new Date().toLocaleString('ko-KR');
        const ai = genAiAnswer(data.category, data.body);
        const q: Consultation = {
            id: `q${Date.now()}`,
            ...data,
            aiAnswer: ai.answer, aiConfidence: ai.confidence, aiLaw: ai.law,
            lawyerAnswer: '', assignedLawyer: '', assignedAt: '',
            answeredAt: '', callbackPhone: data.callbackPhone || '',
            callbackRequestedAt: data.urgency === 'urgent' && data.callbackPhone ? now : '',
            callbackDoneAt: '', callbackNote: '',
            status: 'ai_analyzing',
            createdAt: now, updatedAt: now, isPrivate: data.isPrivate ?? true,
        };
        this.items.unshift(q);
        this.save();
        // AI 분석 시뮬레이션 (1.5초 후 자동 완료)
        setTimeout(() => {
            const idx = this.items.findIndex(x => x.id === q.id);
            if (idx >= 0) {
                this.items[idx].status = data.urgency === 'urgent' ? 'callback_requested' : 'ai_done';
                this.items[idx].updatedAt = new Date().toLocaleString('ko-KR');
                this.save();
            }
        }, 1500);
        return q;
    }

    assignLawyer(id: string, lawyer?: string): void {
        const q = this.items.find(x => x.id === id);
        if (!q) return;
        q.assignedLawyer = lawyer || assignNextLawyer();
        q.assignedAt = new Date().toLocaleString('ko-KR');
        q.status = 'assigned';
        q.updatedAt = q.assignedAt;
        this.save();
    }

    saveLawyerDraft(id: string, draft: string): void {
        const q = this.items.find(x => x.id === id);
        if (!q) return;
        q.lawyerAnswer = draft;
        q.status = 'reviewing';
        q.updatedAt = new Date().toLocaleString('ko-KR');
        this.save();
    }

    sendAnswer(id: string, answer: string): void {
        const q = this.items.find(x => x.id === id);
        if (!q) return;
        q.lawyerAnswer = answer;
        q.answeredAt = new Date().toLocaleString('ko-KR');
        q.status = 'answered';
        q.updatedAt = q.answeredAt;
        this.save();
    }

    markCallbackDone(id: string, note: string): void {
        const q = this.items.find(x => x.id === id);
        if (!q) return;
        q.callbackDoneAt = new Date().toLocaleString('ko-KR');
        q.callbackNote = note;
        q.status = 'callback_done';
        q.updatedAt = q.callbackDoneAt;
        this.save();
    }

    requestCallback(id: string, phone: string): void {
        const q = this.items.find(x => x.id === id);
        if (!q) return;
        q.callbackPhone = phone;
        q.callbackRequestedAt = new Date().toLocaleString('ko-KR');
        q.status = 'callback_requested';
        q.updatedAt = q.callbackRequestedAt;
        this.save();
    }
}

export const consultStore = new ConsultStore();

export const CONSULT_STATUS_LABEL: Record<ConsultStatus, string> = {
    submitted: '접수완료', ai_analyzing: 'AI분석중', ai_done: 'AI완료',
    assigned: '변호사배정', reviewing: '검토중', answered: '답변완료',
    callback_requested: '콜백요청', callback_done: '콜백완료',
};

export const CONSULT_CATEGORIES: ConsultCategory[] = ['가맹계약', '개인정보', '형사', '노무', '지식재산', '기타'];

