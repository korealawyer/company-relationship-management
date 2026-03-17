/**
 * ── 가격 단일 소스 (Single Source of Truth) ──
 * 모든 페이지에서 이 모듈로부터 가격 정보를 import 합니다.
 * 가격 변경 시 이 파일만 수정하면 됩니다.
 */

export interface PricingTier {
  id: string;
  name: string;
  nameKo: string;
  price: number;          // 월 구독료 (원)
  annualPrice: number;    // 연간 구독료 (원) — 할인 적용
  color: string;
  popular?: boolean;
  features: string[];
  limits: {
    consultations: string;   // 자문 건수
    employees: string;       // 임직원 계정
    contractReview: string;  // 계약서 검토
    eap: string;             // EAP 상담
  };
}

export const PRICING_TIERS: Record<string, PricingTier> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    nameKo: '베이직',
    price: 990_000,
    annualPrice: 9_900_000,
    color: '#60a5fa',
    features: [
      '법률 챗봇 무제한',
      '법률 자문 3건/월',
      '개인정보 기본 자동 검토',
      '5명 임직원 계정',
    ],
    limits: {
      consultations: '3건/월',
      employees: '5명',
      contractReview: '미포함',
      eap: '미포함',
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameKo: '프로',
    price: 2_490_000,
    annualPrice: 24_900_000,
    color: '#c9a84c',
    popular: true,
    features: [
      '법률 챗봇 무제한',
      '법률 자문 10건/월',
      '개인정보 전체 자동 검토',
      '무제한 임직원 계정',
      '계약서 검토 5건/월',
      '월간 법무 리포트',
      'EAP 심리상담',
    ],
    limits: {
      consultations: '10건/월',
      employees: '무제한',
      contractReview: '5건/월',
      eap: '기본',
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    nameKo: '프리미엄',
    price: 4_990_000,
    annualPrice: 49_900_000,
    color: '#a78bfa',
    features: [
      '모든 Pro 기능 포함',
      '법률 자문 무제한',
      '전담 변호사 지정',
      '계약서 검토 무제한',
      '경영·노무 자문',
      'EAP 무제한',
      '전용 슬랙 채널',
    ],
    limits: {
      consultations: '무제한',
      employees: '무제한',
      contractReview: '무제한',
      eap: '무제한',
    },
  },
};

/** 플랜 배열 (UI 렌더링용) */
export const PRICING_TIERS_LIST: PricingTier[] = [
  PRICING_TIERS.basic,
  PRICING_TIERS.pro,
  PRICING_TIERS.premium,
];

/** 기본 플랜 (CTA/리다이렉트용) */
export const DEFAULT_PLAN = PRICING_TIERS.pro;

/** 가격 포맷 헬퍼 */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

/** 만원 단위 포맷 */
export function formatPriceMan(amount: number): string {
  return `${Math.round(amount / 10_000).toLocaleString('ko-KR')}만원`;
}

/** CRM 플랜 매핑 (mockStore와 호환) */
export const CRM_PLAN_MAP: Record<string, 'starter' | 'standard' | 'premium'> = {
  basic: 'starter',
  pro: 'standard',
  premium: 'premium',
};
