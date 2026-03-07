// src/lib/mock/constants.ts — 상수 정의
// mockStore.ts에서 분리. 상태 레이블, 색상, 변호사 목록 등.

import type { CaseStatus, LitigationStatus, ConsultCategory, ConsultStatus, ModuleDefinition, RoleType } from './types';

// ── 모듈 레지스트리 ──────────────────────────────────────────
export const MODULE_REGISTRY: ModuleDefinition[] = [
    { id: 'employee', href: '/employee', label: '영업 CRM', icon: 'Users', roles: ['super_admin', 'admin', 'sales'], status: 'active', hideable: false, badge: 'employee', phase: 1 },
    { id: 'lawyer', href: '/lawyer', label: '변호사 검토', icon: 'Gavel', roles: ['super_admin', 'admin', 'lawyer', 'sales'], status: 'active', hideable: false, badge: 'lawyer', phase: 1 },
    { id: 'litigation', href: '/litigation', label: '송무팀', icon: 'Swords', roles: ['super_admin', 'admin', 'lawyer', 'litigation'], status: 'active', hideable: true, badge: 'litigation', phase: 1 },
    { id: 'admin', href: '/admin', label: '관리자 KPI', icon: 'BarChart3', roles: ['super_admin', 'admin'], status: 'active', hideable: false, badge: 'admin', phase: 1 },
    { id: 'eap', href: '/eap', label: 'EAP 상담', icon: 'Heart', roles: ['counselor', 'super_admin', 'admin'], status: 'beta', hideable: false, phase: 2 },
    { id: 'counselor', href: '/counselor', label: '상담사 포털', icon: 'HeartHandshake', roles: ['counselor', 'super_admin'], status: 'beta', hideable: false, phase: 2 },
    { id: 'company-hr', href: '/company-hr', label: '고객사 HR', icon: 'Building2', roles: ['client_hr', 'super_admin', 'admin'], status: 'beta', hideable: false, phase: 2 },
    { id: 'general', href: '/admin', label: '총무팀', icon: 'Building2', roles: ['super_admin', 'admin', 'general'], status: 'coming_soon', hideable: true, phase: 2 },
    { id: 'hr', href: '/admin', label: '인사팀(내부)', icon: 'UserCog', roles: ['super_admin', 'admin', 'hr'], status: 'coming_soon', hideable: true, phase: 2 },
    { id: 'finance', href: '/finance', label: '회계팀', icon: 'Coins', roles: ['super_admin', 'admin', 'finance'], status: 'coming_soon', hideable: true, phase: 2 },
    { id: 'knowledge', href: '/knowledge', label: '법률 지식관리', icon: 'BookOpen', roles: ['super_admin', 'admin', 'lawyer', 'litigation'], status: 'coming_soon', hideable: true, phase: 3 },
];

// ── 역할 유틸 ─────────────────────────────────────────────────
const ROLE_KEY = 'ibs_role';
export function getCurrentRole(): RoleType {
    if (typeof window === 'undefined') return 'sales';
    return (localStorage.getItem(ROLE_KEY) as RoleType) ?? 'sales';
}
export function setCurrentRole(role: RoleType) {
    localStorage.setItem(ROLE_KEY, role);
}
export function getAccessibleModules(role: RoleType): ModuleDefinition[] {
    return MODULE_REGISTRY.filter(m => m.roles.includes(role));
}

// ── 상태 레이블/색상 ──────────────────────────────────────────
export const STATUS_LABEL: Record<CaseStatus, string> = {
    pending: '등록됨', crawling: 'AI 분석중', analyzed: '분석완료',
    sales_confirmed: '영업컨펌', assigned: '변호사배정',
    reviewing: '검토중', lawyer_confirmed: '변호사컨펌',
    emailed: '발송완료', client_replied: '답장수신', subscribed: '구독완료',
};

export const STATUS_COLOR: Record<CaseStatus, string> = {
    pending: 'rgba(148,163,184,0.15)', crawling: 'rgba(251,191,36,0.15)',
    analyzed: 'rgba(59,130,246,0.15)', sales_confirmed: 'rgba(167,139,250,0.15)',
    assigned: 'rgba(249,115,22,0.15)', reviewing: 'rgba(249,115,22,0.2)',
    lawyer_confirmed: 'rgba(20,184,166,0.15)', emailed: 'rgba(34,197,94,0.15)',
    client_replied: 'rgba(236,72,153,0.15)', subscribed: 'rgba(201,168,76,0.2)',
};

export const STATUS_TEXT: Record<CaseStatus, string> = {
    pending: '#94a3b8', crawling: '#fbbf24', analyzed: '#60a5fa',
    sales_confirmed: '#a78bfa', assigned: '#fb923c', reviewing: '#fdba74',
    lawyer_confirmed: '#2dd4bf', emailed: '#4ade80', client_replied: '#f472b6',
    subscribed: '#c9a84c',
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
    'assigned', 'reviewing', 'lawyer_confirmed', 'emailed', 'client_replied', 'subscribed',
];

export const LAWYERS = ['김수현 변호사', '이지원 변호사', '박민준 변호사', '최유진 변호사'];
export const SALES_REPS = ['이민준', '박지수', '최현우', '강수빈'];
export const LITIGATION_TYPES = ['개인정보 손해배상', '가맹계약 분쟁', '임직원 분쟁', '지적재산권', '계약 불이행', '기타'];
export const COURTS = ['서울중앙지방법원', '수원지방법원', '서울고등법원', '대법원', '수원고등법원'];

export const CONSULT_STATUS_LABEL: Record<ConsultStatus, string> = {
    submitted: '접수완료', ai_analyzing: 'AI분석중', ai_done: 'AI완료',
    assigned: '변호사배정', reviewing: '검토중', answered: '답변완료',
    callback_requested: '콜백요청', callback_done: '콜백완료',
};

export const CONSULT_CATEGORIES: ConsultCategory[] = ['가맹계약', '개인정보', '형사', '노무', '지식재산', '기타'];
