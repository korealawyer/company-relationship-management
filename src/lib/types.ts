// src/lib/types.ts
// store.ts에서 분리된 타입 정의들.
// Supabase 연동 시 이 파일을 그대로 사용합니다.

// ── 역할(Role) 시스템 ──────────────────────────────────────────
export type RoleType =
    | 'super_admin'  // 전체 접근
    | 'admin'        // 관리자 KPI
    | 'sales'        // 영업팀
    | 'lawyer'       // 변호사팀
    | 'litigation'   // 송무팀
    | 'general'      // 총무팀 (로펌 내부)
    | 'hr'           // 인사팀 (로펌 내부)
    | 'finance'      // 회계팀 (로펌 내부)
    | 'counselor'       // EAP 심리상담사 (신규)
    | 'client_hr'       // 고객사 HR 담당자 (신규)
    | 'personal_client'; // 개인 의뢰인 (개인 소송 포탈)

// ── 모듈 레지스트리 타입 ────────────────────────────────────────
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

// ── 케이스 상태 ─────────────────────────────────────────────────
export type CaseStatus =
    // 기존 오퍼레이션 상태 (유지)
    | 'pending'           // 검토 대기
    | 'crawling'          // 자동 검토·분석 중
    | 'analyzed'          // AI 분석 완료
    | 'assigned'          // 변호사 자동 배정
    | 'reviewing'         // 변호사 검토 중
    | 'lawyer_confirmed'  // 변호사 컨펌 완료
    | 'emailed'           // 이메일 자동 발송
    | 'client_replied'    // 클라이언트 답장
    | 'client_viewed'     // 클라이언트 리포트 열람
    | 'contract_sent'     // 계약서 발송
    | 'contract_signed'   // 계약서 서명 완료
    // 신규 영업 파이프라인 상태
    | 'cold_email'        // 콜드메일 발송
    | 'guide_download'    // 가이드북 다운로드(리드)
    | 'pilot_offer'       // 파일럿 제안(할인)
    | 'subscribed'        // 구독 완료 (정식 계약/구독 중)
    | 'upsell'            // 업셀링 대상
    | 'churn_risk';       // 이탈 위험(Churn)

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

// ── 리드 통합 타입 ───────────────────────────────────────────────

export interface CallLock {
    id?: string;
    companyId: string;
    userId: string;
    userName: string;
    lockedAt: string;
    lockedUntil: string;
}

export interface CallClaimResult {
    success: boolean;
    lockedBy?: string;
    lockedUntil?: string;
}

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
    assignedSalesId?: string;
    assignedSalesName?: string;
    assignedAt?: string;
    salesQueueIndex?: number;
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
    // ── 리드 통합 필드 ──
    riskScore: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | '';
    issueCount: number;
    bizType: string;
    franchiseType?: '프랜차이즈' | '그외' | string;
    domain: string;
    privacyUrl: string;
    privacyPolicyText?: string;
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
    // ── 자동화 필드 ──
    callbackScheduledAt?: string;
    followUpStep?: number;
    aiMemoSummary?: string;
    aiNextAction?: string;
    aiNextActionType?: string;
    lastCallResult?: 'connected' | 'no_answer' | 'callback' | 'rejected' | 'invalid_site';
    lastCallAt?: string;
    lastCalledBy?: string;
    callAttempts?: number;
}

// ── 송무팀 사건 ─────────────────────────────────────────────────
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
    notificationSettings?: {
        notifyEmail: boolean;
        notifyKakao: boolean;
        frequency: 'immediate' | 'daily' | 'weekly';
    };
    closedAt?: string;
    closeReason?: string;
    createdAt: string;
    updatedAt: string;
}

// ── 자동화 설정 ─────────────────────────────────────────────────
export interface AutoSettings {
    signatureAutoCheck: boolean;
    signatureCheckIntervalHours: number;
    welcomeEmailAutoSend: boolean;
    autoOnboarding: boolean;
    autoFollowUp: boolean;
    kakaoAutoSend: boolean;
    kakaoScheduleHours: number;
    kakaoTemplate: string;
    autoSalesConfirm: boolean;
    autoAssignLawyer: boolean;
    autoGenerateDraft: boolean;
    autoSendEmail: boolean;
    autoDeadlineAlert: boolean;
    autoMonthlyBilling: boolean;
    autoOverdueReminder: boolean;
    autoSatisfactionSurvey: boolean;
    autoAiMemoSummary: boolean;
    lawyerRoundRobin: number;
    updatedAt: string;
    updatedBy: string;
}

export interface AutoLog {
    id: string;
    at: string;
    type: 'auto_confirm' | 'auto_assign' | 'auto_email' | 'setting_change' | 'ai_analysis'
        | 'deadline_alert' | 'auto_billing' | 'overdue_reminder' | 'satisfaction_survey' | 'ai_memo_summary';
    label: string;
    companyName?: string;
    detail: string;
    prevValue?: string;
    newValue?: string;
    channel?: string;
    amount?: number;
}

// ── 문서 보관함 ─────────────────────────────────────────────────
export interface SmsLogEntry { id: string; [key: string]: any; }
export interface PendingClient { id: string; [key: string]: any; }
export interface CrmNotification { id: string; [key: string]: any; }
export interface ConsultRecord { id: string; [key: string]: any; }

export type DocumentCategory = 
'계약서' | '의견서' | '리포트' | '소장' | '영수증' | '기타';
export type DocumentStatus = '검토 대기' | '변호사 열람 완료' | '검토 중' | '검토 완료';

export interface Document {
    id: string;
    companyId: string;
    authorRole: 'client' | 'lawyer' | 'system';
    name: string;
    size: number;
    type: string;
    category: DocumentCategory;
    status: DocumentStatus;
    createdBy?: string; // 작성자 정보 추가
    url: string;
    createdAt: string;
    isNewForClient: boolean;
    isNewForLawyer: boolean;
}

export interface ConsultItem {
    id: string;
    companyName: string;
    companyId: string;
    title: string;
    category: string;
    urgency: 'normal' | 'urgent';
    created: string;
    status: 'pending' | 'in_progress' | 'completed';
    content: string;
    lawyerName?: string;
    lawyerId?: string;
    assignedAt?: string;
    [key: string]: any;
}

// ── 전자계약 (E-Contract) ───────────────────────────────────────
export interface DbContract {
    id: string;
    title: string;
    template: string;
    party_a_name: string;
    party_a_signed: boolean;
    party_b_name: string;
    party_b_email: string;
    party_b_signed: boolean;
    content: string;
    status: 'draft' | 'waiting_other' | 'both_signed';
    created_at: string;
    updated_at: string;
}

// ── 법률 상담 시스템 ──────────────────────────────────────────
export type ConsultCategory = '가맹계약' | '개인정보' | '형사' | '노무' | '지식재산' | '기타';
export type ConsultUrgency = 'urgent' | 'normal';
export type ConsultStatus =
    | 'submitted'
    | 'ai_analyzing'
    | 'ai_done'
    | 'assigned'
    | 'reviewing'
    | 'answered'
    | 'callback_requested'
    | 'callback_done';

export interface Consultation {
    id: string;
    companyId: string;
    companyName: string;
    branchName: string;
    authorName: string;
    authorRole: '가맹점주' | '임직원' | '본사직원';
    category: ConsultCategory;
    urgency: ConsultUrgency;
    title: string;
    body: string;
    aiAnswer: string;
    aiConfidence: number;
    aiLaw: string[];
    lawyerAnswer: string;
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
    isPrivate: boolean;
    attachedFiles?: any[];
}

// ── 개인 의뢰인 소송 관리 시스템 ──────────────────────────────
export interface PersonalClient {
    id: string;
    name: string;
    phone: string;
    email: string;
    birthYear: number;
    address: string;
    memo: string;
    createdAt: string;
}

export type PersonalLitStatus =
    | 'consulting'
    | 'preparing'
    | 'filed'
    | 'hearing'
    | 'settlement'
    | 'judgment'
    | 'appeal'
    | 'enforcing'
    | 'closed';

export type PersonalLitType =
    | '민사(손해배상)'
    | '민사(대여금)'
    | '민사(부동산)'
    | '가사(이혼)'
    | '가사(양육권)'
    | '가사(상속)'
    | '형사(피해자)'
    | '형사(피의자)'
    | '행정소송'
    | '산재/노동'
    | '채권추심'
    | '기타';

export interface PersonalLitDeadline {
    id: string;
    label: string;
    dueDate: string;
    completed: boolean;
    completedAt: string;
    isFixed?: boolean;
}

export interface PersonalLitDocument {
    id: string;
    name: string;
    type: 'complaint' | 'brief' | 'evidence' | 'court_order' | 'judgment' | 'other';
    addedAt: string;
}

export interface PersonalLitigation {
    id: string;
    clientId: string;
    clientName: string;
    caseNo: string;
    court: string;
    type: PersonalLitType;
    role: '원고' | '피고' | '고소인' | '피고소인' | '신청인' | '피신청인';
    opponent: string;
    opponentLawyer: string;
    claimAmount: number;
    status: PersonalLitStatus;
    assignedLawyer: string;
    deadlines: PersonalLitDeadline[];
    documents: PersonalLitDocument[];
    notes: string;
    result: '' | '승소' | '일부승소' | '패소' | '합의' | '취하' | '각하';
    resultNote: string;
    legalFee: number;
    courtFee: number;
    nextHearingDate: string;
    closedAt?: string;
    closeReason?: string;
    createdAt: string;
    updatedAt: string;
}

// ── 알림 시스템 (Notifications) ────────────────────────────────
export interface AppNotification {
    id: string;
    user_id: string;
    type: 'document' | 'payment' | 'consultation' | 'member' | 'system';
    title: string;
    message: string;
    status: 'unread' | 'read';
    href?: string;
    action_label?: string;
    created_at: string;
}

// ── 재무 및 회계 시스템 (Finance) ──────────────────────────────
export interface FinancePayment {
    id: string;
    client_id: string | null;
    case_id: string | null;
    amount: number;
    description: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
    due_date: string | null;
    paid_date: string | null;
    payment_method: string | null;
    created_at: string;
    updated_at: string;
}

export interface FinanceExpense {
    id: string;
    amount: number;
    category: 'OFFICE' | 'TRAVEL' | 'SOFTWARE' | 'MARKETING' | string;
    description: string;
    payment_method: string | null;
    incurred_date: string;
    receipt_url: string | null;
    created_at: string;
    updated_at: string;
}

// ── 영업팀 콜 락 시스템 (Sales Call Locks) ────────────────────────
// (Merged with earlier definition at the top)

