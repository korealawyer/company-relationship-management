// src/lib/moduleRegistry.ts
// Navbar, 권한체크, 메뉴 렌더링의 단일 진실 공급원(SSOT).
// 새 팀/기능 추가 = 여기에 항목 하나 추가.
// Supabase 전환 후에도 영구 사용됩니다.

import type { RoleType, ModuleDefinition } from './types';

export const MODULE_REGISTRY: ModuleDefinition[] = [
    // ── Phase 1 — 현재 운영 중 ──
    { id: 'employee', href: '/employee', label: '영업 CRM', icon: 'Users', roles: ['super_admin', 'admin', 'sales'], status: 'active', hideable: false, badge: 'employee', phase: 1 },
    { id: 'lawyer', href: '/lawyer', label: '변호사 검토', icon: 'Gavel', roles: ['super_admin', 'admin', 'lawyer', 'sales'], status: 'active', hideable: false, badge: 'lawyer', phase: 1 },
    { id: 'litigation', href: '/litigation', label: '송무팀', icon: 'Swords', roles: ['super_admin', 'admin', 'lawyer', 'litigation'], status: 'active', hideable: true, badge: 'litigation', phase: 1 },
    { id: 'admin', href: '/admin', label: '관리자 KPI', icon: 'BarChart3', roles: ['super_admin', 'admin'], status: 'active', hideable: false, badge: 'admin', phase: 1 },
    // ── Phase 2 — EAP 모듈 ──
    { id: 'eap', href: '/eap', label: 'EAP 상담', icon: 'Heart', roles: ['counselor', 'super_admin', 'admin'], status: 'beta', hideable: false, phase: 2 },
    { id: 'counselor', href: '/counselor', label: '상담사 포털', icon: 'HeartHandshake', roles: ['counselor', 'super_admin'], status: 'beta', hideable: false, phase: 2 },
    { id: 'company-hr', href: '/company-hr', label: '고객사 HR', icon: 'Building2', roles: ['client_hr', 'super_admin', 'admin'], status: 'active', hideable: false, phase: 1 },
    // ── Phase 1 — 고객사 포털 ──
    { id: 'client-dashboard', href: '/dashboard', label: '대시보드', icon: 'LayoutDashboard', roles: ['client_hr', 'super_admin'], status: 'active', hideable: false, phase: 1 },
    { id: 'consultation', href: '/consultation', label: '법률 상담', icon: 'HeartHandshake', roles: ['client_hr', 'super_admin'], status: 'active', hideable: false, phase: 1 },
    { id: 'ai-chat', href: '/chat', label: '법률 상담', icon: 'Bot', roles: ['client_hr', 'super_admin'], status: 'active', hideable: false, phase: 1 },
    { id: 'client-cases', href: '/cases', label: '사건 관리', icon: 'Briefcase', roles: ['client_hr', 'super_admin', 'admin', 'lawyer'], status: 'active', hideable: true, phase: 1 },
    { id: 'client-docs', href: '/documents', label: '문서함', icon: 'FolderOpen', roles: ['client_hr', 'super_admin'], status: 'active', hideable: true, phase: 1 },
    { id: 'client-billing', href: '/billing', label: '결제 관리', icon: 'CreditCard', roles: ['client_hr', 'super_admin'], status: 'active', hideable: true, phase: 1 },
    // ── Phase 2 — 로펌 내부 업무툴 ──
    { id: 'general', href: '/general', label: '총무팀', icon: 'Building2', roles: ['super_admin', 'admin', 'general'], status: 'coming_soon', hideable: true, phase: 2 },
    { id: 'hr', href: '/hr', label: '인사팀(내부)', icon: 'UserCog', roles: ['super_admin', 'admin', 'hr'], status: 'coming_soon', hideable: true, phase: 2 },
    { id: 'finance', href: '/billing', label: '회계팀', icon: 'Coins', roles: ['super_admin', 'admin', 'finance', 'sales'], status: 'active', hideable: true, badge: 'admin', phase: 1 },
    // ── Phase 3 — 지식·AI ──
    { id: 'knowledge', href: '/knowledge', label: '법률 지식관리', icon: 'BookOpen', roles: ['super_admin', 'admin', 'lawyer', 'litigation'], status: 'coming_soon', hideable: true, phase: 3 },
    // ── Phase 1 — 개인 소송 관리 ──
    { id: 'personal-litigation', href: '/personal-litigation', label: '개인 소송', icon: 'UserCheck', roles: ['super_admin', 'admin', 'lawyer', 'litigation', 'finance'], status: 'active', hideable: true, phase: 1 },
];

import { safeStorage } from './safeStorage';

// 현재 사용자 역할 — Phase 2에서 실제 인증으로 교체
const ROLE_KEY = 'ibs_role';
export function getCurrentRole(): RoleType {
    if (typeof window === 'undefined') return 'sales';
    return (safeStorage.getItem(ROLE_KEY) as RoleType) ?? 'sales';
}
export function setCurrentRole(role: RoleType) {
    safeStorage.setItem(ROLE_KEY, role);
}
export function getAccessibleModules(role: RoleType): ModuleDefinition[] {
    return MODULE_REGISTRY.filter(m => m.roles.includes(role));
}
