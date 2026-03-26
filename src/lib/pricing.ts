/**
 * ── 가격 단일 소스 (Single Source of Truth) v4.0 ──
 *
 * 2-Layer 구조:
 * ┌─ 고객 공개 (3-tier 고정가) ──────────────┐
 * │  Entry   1~10개   ₩330,000              │
 * │  Growth  11~50개  ₩550,000              │
 * │  Scale   51~100개 ₩1,100,000            │
 * │  Enterprise 100+  "맞춤 견적"            │
 * └─────────────────────────────────────────┘
 * ┌─ 내부 체감 요율 (100개 이상) ────────────┐
 * │  101~200  ₩110만 + ₩6,000 × (n-100)    │
 * │  201~300  ₩170만 + ₩5,000 × (n-200)    │
 * │  301~500  ₩220만 + ₩4,000 × (n-300)    │
 * │  501~1000 ₩300만 + ₩2,000 × (n-500)    │
 * └─────────────────────────────────────────┘
 */

/* ── 고정 티어 가격 ────────────────────────── */
export const TIER_ENTRY = 330_000;      // 1~10개
export const TIER_GROWTH = 550_000;     // 11~50개
export const TIER_SCALE = 1_100_000;    // 51~100개
export const ENTERPRISE_THRESHOLD = 100;

/* ── 체감 요율 테이블 ──────────────────────── */
export const DEGRESSIVE_BANDS = [
  { from: 101, to: 200, base: 1_100_000, perStore: 6_000 },
  { from: 201, to: 300, base: 1_700_000, perStore: 5_000 },
  { from: 301, to: 500, base: 2_200_000, perStore: 4_000 },
  { from: 501, to: 1000, base: 3_000_000, perStore: 2_000 },
] as const;

/* ── 메인 산정 함수 ────────────────────────── */
export function calcPrice(n: number): number {
  if (n <= 0) return TIER_ENTRY;
  if (n <= 10) return TIER_ENTRY;
  if (n <= 50) return TIER_GROWTH;
  if (n <= 100) return TIER_SCALE;

  // 100개 초과: 체감 요율
  for (const band of DEGRESSIVE_BANDS) {
    if (n <= band.to) {
      return band.base + band.perStore * (n - band.from + 1);
    }
  }
  // 1000개 초과: 캡
  return calcPrice(1000);
}

/* ── 산정 내역 (견적서용) ──────────────────── */
export interface PriceBreakdown {
  tierName: string;
  tierNameKo: string;
  baseAmount: number;
  storeCount: number;
  perStoreRate: number;
  additionalStores: number;
  additionalAmount: number;
  totalMonthly: number;
  totalYearly: number;
  perStoreMonthly: number;
}

export function calcBreakdown(n: number): PriceBreakdown {
  const total = calcPrice(n);
  const range = getRange(n);
  const rangeData = PRICE_RANGES.find(r => r.id === range) || PRICE_RANGES[0];

  let baseAmount = total;
  let perStoreRate = 0;
  let additionalStores = 0;
  let additionalAmount = 0;

  if (n > 100) {
    for (const band of DEGRESSIVE_BANDS) {
      if (n <= band.to) {
        baseAmount = band.base;
        perStoreRate = band.perStore;
        additionalStores = n - band.from + 1;
        additionalAmount = perStoreRate * additionalStores;
        break;
      }
    }
  }

  return {
    tierName: rangeData.name,
    tierNameKo: rangeData.nameKo,
    baseAmount,
    storeCount: n,
    perStoreRate,
    additionalStores,
    additionalAmount,
    totalMonthly: total,
    totalYearly: total * 12,
    perStoreMonthly: Math.round(total / Math.max(n, 1)),
  };
}

/* ── 구간 카드 정의 (UI용) ────────────────── */
export interface PriceRange {
  id: string;
  name: string;
  nameKo: string;
  storeRange: string;
  priceRange: string;
  price: string;
  minStores: number;
  maxStores: number;
  color: string;
  popular?: boolean;
}

export const PRICE_RANGES: PriceRange[] = [
  {
    id: 'entry', name: 'Entry', nameKo: '엔트리',
    storeRange: '1~10개', priceRange: '33만원', price: '₩330,000',
    minStores: 1, maxStores: 10, color: '#60a5fa',
  },
  {
    id: 'growth', name: 'Growth', nameKo: '그로스',
    storeRange: '11~50개', priceRange: '55만원', price: '₩550,000',
    minStores: 11, maxStores: 50, color: '#c9a84c', popular: true,
  },
  {
    id: 'scale', name: 'Scale', nameKo: '스케일',
    storeRange: '51~100개', priceRange: '110만원', price: '₩1,100,000',
    minStores: 51, maxStores: 100, color: '#a78bfa',
  },
  {
    id: 'enterprise', name: 'Enterprise', nameKo: '엔터프라이즈',
    storeRange: '100개+', priceRange: '맞춤 견적', price: '별도 협의',
    minStores: 101, maxStores: 9999, color: '#f97316',
  },
];

/* ── 경쟁사 비교표 ─────────────────────────── */
export const COMPETITOR_FOREST = [
  { stores: '10개 이하', price: '33만~', note: '본사 자문만' },
  { stores: '기본형', price: '55만~', note: '서면 횟수 제한' },
  { stores: '프리미엄', price: '110만~', note: '서면 무제한' },
];

/* ── 전체 포함 서비스 (전 구간 동일) ── */
export const INCLUDED_SERVICES = [
  '본사 법률자문 (무제한)',
  '가맹점 법률상담 (BACKCALL)',
  '임직원 법률상담 (BACKCALL)',
  '분기 리스크 브리핑 (연 4회)',
  '법률 문서 2,000종',
];

export const INCLUDED_SERVICES_FULL = [
  ...INCLUDED_SERVICES,
  'EAP 심리상담 (2026.04~)',
];

/* ── 추가 서비스 ───────────────────────────── */
export const ADD_ON_SERVICES = [
  { name: '상표 출원', retail: '49~50만원', subscriber: '27~28만원' },
  { name: '가맹계약서 세팅', retail: '88만원', subscriber: '무상' },
  { name: '정보공개서 신규', retail: '88만원', subscriber: '44만원' },
  { name: '정보공개서 변경', retail: '88만원', subscriber: '44만원' },
];

/* ── 포맷 헬퍼 ─────────────────────────────── */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

export function formatPriceMan(amount: number): string {
  const man = amount / 10_000;
  if (man >= 10000) return `${(man / 10000).toFixed(1)}억원`;
  return man % 1 === 0 ? `${man}만원` : `${man.toFixed(1)}만원`;
}

/* ── CRM 플랜 매핑 (store 호환) ── */
export const CRM_PLAN_MAP: Record<string, string> = {
  entry: 'starter',
  growth: 'standard',
  scale: 'premium',
  enterprise: 'premium',
};

/* ── storeCount → 구간 ID ── */
export function getRange(n: number): string {
  if (n <= 10) return 'entry';
  if (n <= 50) return 'growth';
  if (n <= 100) return 'scale';
  return 'enterprise';
}
