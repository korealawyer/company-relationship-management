/**
 * ── 기능 플래그 (Feature Flags) ──
 * 각 기능의 상태를 중앙 관리합니다.
 * 
 * Painted Door 전략:
 * - 모든 기능은 UI에서 '사용 가능'으로 표시
 * - 실제 미구현 기능은 클릭 시 가입/업그레이드 유도 모달 표시
 * - 'live'       → 실제 구현 완료 ✅
 * - 'paintedDoor' → UI는 live처럼 보이되, 실제 클릭 시 가입 유도
 * - 'hidden'     → 비노출
 */

export type FeatureStatus = 'live' | 'paintedDoor' | 'hidden';

export interface Feature {
  id: string;
  category: string;
  title: string;
  description: string;
  status: FeatureStatus;
  icon: string;   // emoji
  href?: string;  // 연결 페이지
}

// ⚠️ 고객에게는 모든 기능이 "사용 가능"으로 보입니다.
// paintedDoor 기능은 클릭 시 PaintedDoorModal로 가입 유도됩니다.
export const FEATURES: Feature[] = [
  // ── 법률 자문 ──
  { id: 'ai-chatbot', category: '법률 자문', title: 'AI 법률 챗봇', description: '24시간 법률 질문에 즉시 답변. AI가 1차 분석 후 전문 변호사에게 연결', status: 'live', icon: '🤖', href: '/chat' },
  { id: 'privacy-review', category: '법률 자문', title: '개인정보처리방침 자동 검토', description: 'AI가 법률 위반 항목 자동 탐지 후 수정안 즉시 제공', status: 'live', icon: '🔍', href: '/privacy-report' },
  { id: 'lawyer-consult', category: '법률 자문', title: '전문 변호사 1:1 자문', description: '프랜차이즈·기업법 전문 변호사 즉시 배정 상담', status: 'live', icon: '⚖️', href: '/consultation' },
  { id: 'superlawyer', category: '법률 자문', title: 'AI 법률 의견서 자동 작성', description: 'SuperLawyer AI가 법률 의견서 초안을 5분 내 생성', status: 'live', icon: '📝', href: '/superlawyer' },

  // ── 계약 관리 ──
  { id: 'e-sign', category: '계약 관리', title: '전자 계약/서명', description: '온라인 계약 체결부터 전자서명, PDF 보관까지 원스톱', status: 'live', icon: '✍️', href: '/contracts' },
  { id: 'contract-ai', category: '계약 관리', title: '계약서 AI 위험 분석', description: 'AI가 독소 조항·불리 조건을 자동 검출하고 대안 제시', status: 'paintedDoor', icon: '📋', href: '/legal/review' },
  { id: 'contract-alert', category: '계약 관리', title: '계약 만료 자동 알림', description: '만료 30일 전 담당자에게 자동 알림. 갱신 누락 방지', status: 'paintedDoor', icon: '🔔', href: '/notifications' },

  // ── 사건/소송 관리 ──
  { id: 'case-mgmt', category: '사건/소송', title: '사건 칸반 보드', description: '수임 → 진행 → 종결 전 과정을 드래그&드롭으로 관리', status: 'live', icon: '📂', href: '/cases' },
  { id: 'lawsuit-calendar', category: '사건/소송', title: '기일 자동 캘린더', description: '법원 기일 D-14/7/3/1 자동 알림 + 카카오톡 발송', status: 'paintedDoor', icon: '📅', href: '/cases' },
  { id: 'litigation-dash', category: '사건/소송', title: '송무 통합 대시보드', description: '전사 소송 현황·승소율·비용을 한눈에 파악', status: 'live', icon: '📊', href: '/litigation' },

  // ── 문서 관리 ──
  { id: 'doc-hub', category: '문서 관리', title: '문서 허브', description: '계약서·소송자료·의견서를 클라우드에서 통합 관리', status: 'paintedDoor', icon: '📁', href: '/documents' },
  { id: 'doc-comment', category: '문서 관리', title: '문서 코멘트·승인', description: '변호사↔고객 간 실시간 코멘트 및 전자결재', status: 'paintedDoor', icon: '💬', href: '/documents' },

  // ── EAP 심리상담 ──
  { id: 'eap-ai', category: 'EAP 심리상담', title: 'AI 심리 상담', description: '24시간 비밀 보장 AI 상담. PHQ-9 기반 위험도 분석', status: 'live', icon: '💛', href: '/counselor' },
  { id: 'eap-mgmt', category: 'EAP 심리상담', title: '임직원 정신건강 관리', description: '조직 멘탈 헬스 모니터링 및 익명 리포트', status: 'live', icon: '🧠', href: '/company-hr' },
  { id: 'eap-booking', category: 'EAP 심리상담', title: '전문 상담사 예약', description: '1:1 심리상담 실시간 예약 및 화상 상담', status: 'paintedDoor', icon: '🗓️', href: '/counselor' },

  // ── 경영 자문 ──
  { id: 'compliance', category: '경영 자문', title: '가맹사업법 컴플라이언스', description: '법규 준수 현황 자동 체크 및 과태료 리스크 분석', status: 'live', icon: '🛡️', href: '/dashboard' },
  { id: 'risk-dash', category: '경영 자문', title: '기업 리스크 대시보드', description: '법률·재무·인사 리스크를 통합 스코어링', status: 'paintedDoor', icon: '📈', href: '/dashboard' },

  // ── 자동화 ──
  { id: 'monthly-report', category: '자동화', title: '월간 법무 리포트', description: '매월 자동 생성되는 법무 현황 보고서. PDF 다운로드', status: 'paintedDoor', icon: '📊', href: '/dashboard' },
  { id: 'auto-billing', category: '자동화', title: '수임료 자동 청구', description: '계약 기반 수임료 자동 인보이싱 및 미납 추적', status: 'paintedDoor', icon: '💳', href: '/billing' },
  { id: 'kakao-alert', category: '자동화', title: '카카오 알림톡 자동 발송', description: '기일·결제·상담 완료 시 카카오 알림톡 즉시 발송', status: 'paintedDoor', icon: '💬', href: '/notifications' },
];

export const FEATURE_CATEGORIES = [...new Set(FEATURES.map(f => f.category))];

export function getFeaturesByCategory(category: string) {
  return FEATURES.filter(f => f.category === category && f.status !== 'hidden');
}

export function getLiveFeatures() {
  return FEATURES.filter(f => f.status === 'live');
}

export function getPaintedDoorFeatures() {
  return FEATURES.filter(f => f.status === 'paintedDoor');
}

// 고객에게 보이는 기능 수 (live + paintedDoor)
export function getVisibleFeatureCount() {
  return FEATURES.filter(f => f.status !== 'hidden').length;
}
