// src/lib/permissions.ts — 권한 관리 세분화 시스템
// 11가지 권한 항목, 역할별 프리셋, hasPermission/getPermissionLevel 함수

export type PermissionLevel = 'full' | 'own' | 'none';

export type PermissionKey =
  | 'user_management'       // 1. 사용자관리 접근
  | 'case_contract_access'  // 2. 사건 상세보기 - 계약정보 접근
  | 'others_case_view'      // 3. 타인 사건 열람 권한
  | 'billing_access'        // 4. 청구/미수 데이터 접근
  | 'stats_report'          // 5. 통계/리포트 접근
  | 'contact_export'        // 6. 고객 연락처 엑셀 다운로드
  | 'sms_send'              // 7. SMS/알림톡 발송
  | 'approval_management'   // 8. 전자결재 관리
  | 'meeting_room'          // 9. 회의실 관리
  | 'attendance_others'     // 10. 근태 관리 (타인 근태 열람)
  | 'ai_agent';             // 11. AI 에이전트 사용 권한

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  user_management: '사용자관리 접근',
  case_contract_access: '사건 계약정보 접근',
  others_case_view: '타인 사건 열람',
  billing_access: '청구/미수 데이터',
  stats_report: '통계/리포트',
  contact_export: '연락처 엑셀 다운로드',
  sms_send: 'SMS/알림톡 발송',
  approval_management: '전자결재 관리',
  meeting_room: '회의실 관리',
  attendance_others: '타인 근태 열람',
  ai_agent: 'AI 에이전트 사용',
};

export const PERMISSION_KEYS: PermissionKey[] = [
  'user_management',
  'case_contract_access',
  'others_case_view',
  'billing_access',
  'stats_report',
  'contact_export',
  'sms_send',
  'approval_management',
  'meeting_room',
  'attendance_others',
  'ai_agent',
];

export interface UserPermission {
  userId: string;
  userName: string;
  role: string;
  permissions: Record<PermissionKey, PermissionLevel>;
}

// ── 역할별 기본 프리셋 ──────────────────────────────────────────
export type PresetRole = 'partner' | 'associate' | 'staff';

export const PRESET_LABELS: Record<PresetRole, string> = {
  partner: '구성원 변호사 (전체)',
  associate: '소속 변호사 (담당건만)',
  staff: '스탭 (제한)',
};

const PARTNER_DEFAULTS: Record<PermissionKey, PermissionLevel> = {
  user_management: 'full',
  case_contract_access: 'full',
  others_case_view: 'full',
  billing_access: 'full',
  stats_report: 'full',
  contact_export: 'full',
  sms_send: 'full',
  approval_management: 'full',
  meeting_room: 'full',
  attendance_others: 'full',
  ai_agent: 'full',
};

const ASSOCIATE_DEFAULTS: Record<PermissionKey, PermissionLevel> = {
  user_management: 'none',
  case_contract_access: 'own',
  others_case_view: 'none',
  billing_access: 'own',
  stats_report: 'own',
  contact_export: 'none',
  sms_send: 'full',
  approval_management: 'own',
  meeting_room: 'full',
  attendance_others: 'none',
  ai_agent: 'full',
};

const STAFF_DEFAULTS: Record<PermissionKey, PermissionLevel> = {
  user_management: 'none',
  case_contract_access: 'none',
  others_case_view: 'none',
  billing_access: 'none',
  stats_report: 'none',
  contact_export: 'none',
  sms_send: 'own',
  approval_management: 'none',
  meeting_room: 'full',
  attendance_others: 'none',
  ai_agent: 'none',
};

export const PRESETS: Record<PresetRole, Record<PermissionKey, PermissionLevel>> = {
  partner: PARTNER_DEFAULTS,
  associate: ASSOCIATE_DEFAULTS,
  staff: STAFF_DEFAULTS,
};

// ── 기본 사용자 목록 ──────────────────────────────────────────
const DEFAULT_USERS: UserPermission[] = [
  { userId: 'lawyer1', userName: '김수현 변호사', role: 'partner', permissions: { ...PARTNER_DEFAULTS } },
  { userId: 'lawyer2', userName: '이지원 변호사', role: 'associate', permissions: { ...ASSOCIATE_DEFAULTS } },
  { userId: 'lawyer3', userName: '박민준 변호사', role: 'associate', permissions: { ...ASSOCIATE_DEFAULTS } },
  { userId: 'staff1', userName: '최서연 (총무)', role: 'staff', permissions: { ...STAFF_DEFAULTS } },
  { userId: 'staff2', userName: '정다은 (경리)', role: 'staff', permissions: { ...STAFF_DEFAULTS } },
];

// ── localStorage 기반 저장/로드 ──────────────────────────────────
const PERM_KEY = 'ibs_permissions_v1';

function loadPermissions(): UserPermission[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(PERM_KEY);
    if (!raw) {
      localStorage.setItem(PERM_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch { return DEFAULT_USERS; }
}

function savePermissions(users: UserPermission[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PERM_KEY, JSON.stringify(users));
  }
}

// ── 권한 관리 스토어 ──────────────────────────────────────────
export const permissionStore = {
  getAll(): UserPermission[] {
    return loadPermissions();
  },

  getByUser(userId: string): UserPermission | undefined {
    return loadPermissions().find(u => u.userId === userId);
  },

  update(userId: string, permissions: Record<PermissionKey, PermissionLevel>): void {
    const all = loadPermissions();
    const user = all.find(u => u.userId === userId);
    if (user) {
      user.permissions = permissions;
      savePermissions(all);
    }
  },

  applyPreset(userId: string, preset: PresetRole): void {
    const all = loadPermissions();
    const user = all.find(u => u.userId === userId);
    if (user) {
      user.permissions = { ...PRESETS[preset] };
      user.role = preset;
      savePermissions(all);
    }
  },

  saveAll(users: UserPermission[]): void {
    savePermissions(users);
  },
};

// ── 편의 함수 ──────────────────────────────────────────
export function hasPermission(userId: string, key: PermissionKey): boolean {
  const user = permissionStore.getByUser(userId);
  if (!user) return false;
  return user.permissions[key] !== 'none';
}

export function getPermissionLevel(userId: string, key: PermissionKey): PermissionLevel {
  const user = permissionStore.getByUser(userId);
  if (!user) return 'none';
  return user.permissions[key] || 'none';
}

// 현재 로그인 사용자 ID 가져오기 (간단 구현)
export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'lawyer1';
  return localStorage.getItem('ibs_current_user_id') || 'lawyer1';
}
