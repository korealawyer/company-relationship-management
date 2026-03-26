// src/lib/constants.ts
// store.ts에서 분리된 상수들.
// Supabase 전환 후에도 영구 사용됩니다.

import type { CaseStatus, LitigationStatus } from './types';

// ── 케이스 상태 레이블/색상 ─────────────────────────────────────
export const STATUS_LABEL: Record<CaseStatus, string> = {
    pending: '등록됨', crawling: '분석중', analyzed: '분석완료',
    assigned: '변호사배정', reviewing: '검토중', lawyer_confirmed: '변호사컨펌',
    emailed: '발송완료', client_replied: '답장수신',
    client_viewed: '리포트열람', contract_sent: '계약서발송',
    contract_signed: '계약서명', subscribed: '구독 중',
    cold_email: '콜드메일 발송', guide_download: '가이드북(리드)',
    pilot_offer: '파일럿 제안', upsell: '업셀링 대상', churn_risk: '이탈 위험',
};

export const STATUS_COLOR: Record<CaseStatus, string> = {
    pending: 'rgba(148,163,184,0.15)', crawling: 'rgba(251,191,36,0.15)',
    analyzed: 'rgba(59,130,246,0.15)',
    assigned: 'rgba(249,115,22,0.15)', reviewing: 'rgba(249,115,22,0.2)',
    lawyer_confirmed: 'rgba(20,184,166,0.15)', emailed: 'rgba(34,197,94,0.15)',
    client_replied: 'rgba(236,72,153,0.15)', client_viewed: 'rgba(129,140,248,0.15)',
    contract_sent: 'rgba(251,191,36,0.2)', contract_signed: 'rgba(74,222,128,0.2)',
    subscribed: 'rgba(201,168,76,0.2)',
    cold_email: 'rgba(148,163,184,0.15)', guide_download: 'rgba(59,130,246,0.15)',
    pilot_offer: 'rgba(168,85,247,0.15)', upsell: 'rgba(14,165,233,0.15)', churn_risk: 'rgba(239,68,68,0.15)',
};

export const STATUS_TEXT: Record<CaseStatus, string> = {
    pending: '#94a3b8', crawling: '#fbbf24', analyzed: '#60a5fa',
    assigned: '#fb923c', reviewing: '#fdba74',
    lawyer_confirmed: '#2dd4bf', emailed: '#4ade80', client_replied: '#f472b6',
    client_viewed: '#818cf8', contract_sent: '#fbbf24',
    contract_signed: '#4ade80', subscribed: '#c9a84c',
    cold_email: '#94a3b8', guide_download: '#3b82f6',
    pilot_offer: '#a855f7', upsell: '#0ea5e9', churn_risk: '#ef4444',
};

export const PIPELINE: CaseStatus[] = [
    'cold_email', 'guide_download', 'pilot_offer',
    'subscribed', 'upsell', 'churn_risk'
];

// ── 송무 상태 레이블/색상 ───────────────────────────────────────
export const LIT_STATUS_LABEL: Record<LitigationStatus, string> = {
    preparing: '소장 준비', filed: '접수완료', hearing: '심리중',
    settlement: '합의진행', judgment: '판결', closed: '종결',
};

export const LIT_STATUS_COLOR: Record<LitigationStatus, string> = {
    preparing: 'rgba(148,163,184,0.2)', filed: 'rgba(59,130,246,0.2)',
    hearing: 'rgba(249,115,22,0.2)', settlement: 'rgba(167,139,250,0.2)',
    judgment: 'rgba(201,168,76,0.2)', closed: 'rgba(74,222,128,0.15)',
};

// ── 인물 목록 ────────────────────────────────────────────────────
export const LAWYERS = ['김수현 변호사', '이지원 변호사', '박민준 변호사', '최유진 변호사'];
export const SALES_REPS = ['이민준', '박지수', '최현우', '강수빈'];

// ── 소송 분류 상수 ───────────────────────────────────────────────
export const LITIGATION_TYPES = ['개인정보 손해배상', '가맹계약 분쟁', '임직원 분쟁', '지적재산권', '계약 불이행', '기타'];
export const COURTS = ['서울중앙지방법원', '수원지방법원', '서울고등법원', '대법원', '수원고등법원'];
