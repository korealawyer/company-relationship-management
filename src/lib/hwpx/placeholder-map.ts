/**
 * HWPX 플레이스홀더 매핑 정의
 * 
 * HWPX 템플릿 내 {{PLACEHOLDER}} 형태의 토큰을 실제 값으로 치환하기 위한 타입 및 기본 정의
 */

/** 플레이스홀더 키-값 맵 타입 */
export type PlaceholderMap = Record<string, string>;

/** 지원되는 플레이스홀더 키 목록 */
export const PLACEHOLDER_KEYS = {
  /** 법률 의견서 본문 내용 */
  OPINION_CONTENT: '{{OPINION_CONTENT}}',
  /** 문서 작성 날짜 (YYYY.MM.DD) */
  DATE: '{{DATE}}',
  /** 사건 번호 */
  CASE_NUMBER: '{{CASE_NUMBER}}',
  /** 의뢰인 성명 */
  CLIENT_NAME: '{{CLIENT_NAME}}',
  /** 상대방 성명 */
  OPPONENT_NAME: '{{OPPONENT_NAME}}',
  /** 담당 변호사 */
  LAWYER_NAME: '{{LAWYER_NAME}}',
  /** 법무법인 명 */
  FIRM_NAME: '{{FIRM_NAME}}',
  /** 사건 제목 */
  CASE_TITLE: '{{CASE_TITLE}}',
  /** 결론 요약 */
  CONCLUSION: '{{CONCLUSION}}',
} as const;

/** 기본 플레이스홀더 값 (테스트/데모 용) */
export const DEFAULT_PLACEHOLDERS: PlaceholderMap = {
  [PLACEHOLDER_KEYS.DATE]: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
  [PLACEHOLDER_KEYS.CASE_NUMBER]: '2026-0001',
  [PLACEHOLDER_KEYS.CLIENT_NAME]: '홍길동',
  [PLACEHOLDER_KEYS.OPPONENT_NAME]: '김철수',
  [PLACEHOLDER_KEYS.LAWYER_NAME]: '이변호사',
  [PLACEHOLDER_KEYS.FIRM_NAME]: '법무법인 수퍼로이어',
  [PLACEHOLDER_KEYS.CASE_TITLE]: '손해배상(기) 청구 사건',
  [PLACEHOLDER_KEYS.CONCLUSION]: '원고의 청구가 인용될 가능성이 높은 것으로 판단됩니다.',
  [PLACEHOLDER_KEYS.OPINION_CONTENT]: '',
};
