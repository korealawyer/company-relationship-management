// src/lib/landingData.ts — 랜딩 페이지 공통 상수 및 유틸 함수
// Phase 4: page.tsx에서 추출

import { AlertTriangle, ShieldOff, TrendingDown, CheckCircle2, Scale, Building2, Award, Zap, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Mock 회사 데이터 ────────────────────────────────────────
export const MOCK_COMPANIES: Record<string, { name: string; issueCount: number; riskLevel: string }> = {
    'test001': { name: '(주)놀부NBG', issueCount: 7, riskLevel: 'HIGH' },
    'test002': { name: '(주)파리바게뜨', issueCount: 4, riskLevel: 'MEDIUM' },
    'test003': { name: '(주)교촌에프앤비', issueCount: 6, riskLevel: 'HIGH' },
    'default': { name: '귀사의 프랜차이즈 본부', issueCount: 5, riskLevel: 'HIGH' },
};

// ── 법적 위반 이슈 ──────────────────────────────────────────
export interface IssueItem {
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    law: string;
    desc: string;
    fine: string;
}

export const ISSUES_MOCK: IssueItem[] = [
    { level: 'HIGH', title: '수집 항목 법정 기재 누락', law: '개인정보 보호법 제30조 제1항 제1호', desc: '수집하는 개인정보 항목(이름, 연락처, 사업자정보)이 처리방침에 명시되지 않아 즉시 과태료 부과 대상입니다.', fine: '최대 3,000만원' },
    { level: 'HIGH', title: '제3자 제공 동의 절차 부재', law: '개인정보 보호법 제17조 제2항', desc: '가맹점 데이터를 마케팅 파트너사에 제공 시 별도 동의를 받아야 하나, 현 방침에 이 절차가 없습니다.', fine: '최대 5,000만원' },
    { level: 'MEDIUM', title: '보유·이용 기간 불명확', law: '개인정보 보호법 제30조 제1항 제3호', desc: '"서비스 종료 시까지"라는 불명확한 표현 사용. 개인정보 보호법은 구체적 보유 기간을 요구합니다.', fine: '시정 권고 후 반복 시 과태료' },
    { level: 'MEDIUM', title: '정보주체 권리 행사 방법 미기재', law: '개인정보 보호법 제35조·제36조·제37조', desc: '열람·정정·삭제·처리 정지 요청 방법 및 접수 담당자 정보가 없습니다.', fine: '과태료 최대 1,000만원' },
    { level: 'LOW', title: '개인정보 보호책임자 연락처 미흡', law: '개인정보 보호법 시행령 제31조', desc: '개인정보 보호책임자의 이메일·전화번호가 없어 민원 처리가 불가능한 상태입니다.', fine: '시정 권고' },
];

// ── 리스크 시나리오 ─────────────────────────────────────────
export interface RiskScenario {
    icon: LucideIcon;
    color: string;
    title: string;
    desc: string;
    badge: string;
}

export const RISK_SCENARIOS: RiskScenario[] = [
    { icon: AlertTriangle, color: '#ef4444', title: '행정 처분 시나리오', desc: '개인정보보호위원회 정기 점검에서 위반 사항 적발 시 과징금 최대 3,000만원 이상 부과. 2023년 국내 프랜차이즈 과징금 평균: 1,800만원.', badge: '과징금 위험' },
    { icon: TrendingDown, color: '#f97316', title: '가맹점 민원 시나리오', desc: '가맹점주가 개인정보 처리 이의를 제기할 경우 가맹거래법상 분쟁조정 절차 개시. 본사 브랜드 이미지 훼손 및 언론 노출 리스크.', badge: '브랜드 위기' },
    { icon: ShieldOff, color: '#a855f7', title: '형사 처벌 시나리오', desc: '개인정보 불법 제3자 제공이 확인될 경우 대표이사 형사처벌(징역 5년 이하 또는 5,000만원 이하 벌금).', badge: '형사 위험' },
];

// ── 5대 기본 서비스 ─────────────────────────────────────────
export interface ServiceItem {
    icon: LucideIcon;
    title: string;
    sub: string;
    desc: string;
    badge: string;
    color: string;
}

export const BASE_SERVICES: ServiceItem[] = [
    { icon: Scale, title: '본사 법률자문', sub: 'HQ Legal Advisory', desc: '무제한 자문. 계약서·약관·분쟁 대응 변호사 직접 응대. 긴급 시 24시간.', badge: '무제한 자문', color: '#c9a84c' },
    { icon: Building2, title: '가맹점 법률상담', sub: 'Franchisee Consultation', desc: '챗봇 접수 → 변호사 BACKCALL 24시간 내 대응. 상담 내용 본사 절대 비공개.', badge: 'BACKCALL 시스템', color: '#60a5fa' },
    { icon: Award, title: '임직원 법률상담', sub: 'Employee Consultation', desc: '복리후생 프로그램. 부동산·가족·소비자 분쟁 등 개인 생활법률 익명 상담.', badge: '복리후생 포함', color: '#4ade80' },
    { icon: Zap, title: '분기 리스크 브리핑', sub: 'Franchise Risk Briefing', desc: '분기 1회(연 4회). 리스크 TOP 5 + 공정위 동향 + 체크리스트 + 표준문구 업데이트.', badge: '연 4회 자동 제공', color: '#a78bfa' },
    { icon: Clock, title: '법률 문서 2,000종', sub: 'Document Templates Library', desc: '연 1회 업데이트. Word+PDF 포맷. 본사·가맹점·임직원 자체 활용 가능.', badge: 'Word + PDF', color: '#f97316' },
];

// ── 애드온 서비스 ───────────────────────────────────────────
export interface AddOnItem { title: string; sub: string; desc: string; tag: string; tagColor: string; price: string; }
export const ADD_ONS: AddOnItem[] = [
    { title: 'EAP 심리상담', sub: '이탈·분쟁 비용 절감', desc: '전문 상담기관 제휴. 익명 예약. 번아웃·갈등 완화 → 운영 안정성 강화.', tag: '2026.04 오픈', tagColor: '#facc15', price: '본사와 동일 산정식' },
    { title: '전수 진단·개선', sub: 'Comprehensive Legal Reform', desc: '기존 문서 전수 점검 → 리스크 발굴 → 표준화 산출물. 법률 DNA 체질 개선.', tag: 'PROJECT', tagColor: '#c9a84c', price: '협의 산정' },
    { title: '경영자문', sub: 'Management Advisory', desc: '재무/세무/투자/특허/법무. 투자 파트너 연계·소개. 동반성장 파트너십.', tag: 'PROJECT', tagColor: '#c9a84c', price: '협의 산정' },
];

// ── 추가 서비스 테이블 ──────────────────────────────────────
export const ADDITIONAL_SERVICES = [
    { name: '상표 출원·등록', regular: '49~50만원', subscriber: '27~28만원', note: '50% 할인 (관납료 포함)' },
    { name: '가맹계약서 최초 세팅', regular: '88만원', subscriber: '무상 제공', note: '구독 포함' },
    { name: '정보공개서 신규 등록', regular: '88만원', subscriber: '44만원', note: '50% 할인' },
    { name: '정보공개서 정기 변경', regular: '88만원', subscriber: '44만원', note: '50% 할인' },
    { name: '해외 확장·M&A', regular: '협의 산정', subscriber: '협의 산정', note: '프로젝트 단위' },
    { name: '임직원 가맹사업법 교육', regular: '협의 산정', subscriber: '협의 산정', note: '온·오프라인' },
];

// ── 가격 샘플표 ─────────────────────────────────────────────
export const PRICE_SAMPLES = [
    { n: 1, price: 30 }, { n: 10, price: 37.7 }, { n: 30, price: 54.7 },
    { n: 50, price: 71.7 }, { n: 100, price: 114.2 }, { n: 150, price: 156.7 }, { n: 200, price: 199.2 },
];

// ── 후기 ────────────────────────────────────────────────────
export const TESTIMONIALS = [
    { company: '커피전문점 본사 (280개 가맹점)', quote: '"방침 수정 후 개인정보보호위 점검에서 이상 없음 확인. 대표이사 형사 리스크 제거"', rating: 5 },
    { company: '치킨 프랜차이즈 본사 (420개 가맹점)', quote: '"가맹점 민원으로 시작했는데, 방침 정비 후 민원 건수 0건. 가맹점주 신뢰 회복"', rating: 5 },
    { company: '뷰티 프랜차이즈 본사 (150개 가맹점)', quote: '"자동 분석 리포트가 내부 법무팀보다 더 빠르고 정확. 월 구독으로 전환한 것 후회 없음"', rating: 5 },
];

// ── FAQ 데이터 ──────────────────────────────────────────────
export const FAQ_ITEMS = [
    { q: '개인정보처리방침 검토는 정말 무료인가요?', a: '1차 자동 분석은 완전 무료입니다. 변호사 교차 검증 의견서 및 수정 초안 열람은 로그인 후 플랜에 따라 제공됩니다.' },
    { q: '계약하면 무엇이 달라지나요?', a: '전담 파트너 변호사 배정 → 분기별 전수 검토 → 법령 개정 자동 알림 → 가맹점·임직원 법률상담 BACKCALL 시스템이 즉시 활성화됩니다.' },
    { q: '가맹점(지점)도 법률상담을 받을 수 있나요?', a: '본사 구독 시 산하 가맹점·임직원 전원이 챗봇 접수 → 변호사 BACKCALL 24시간 내 대응 서비스를 이용할 수 있습니다. 상담 내용은 본사에 공개되지 않습니다.' },
    { q: '과태료 위기 상황인데 지금 즉시 도움받을 수 있나요?', a: '네. 긴급 신청 시 담당 변호사가 4시간 이내 연락드립니다. 02-598-8518로 전화주시거나 우측 하단 채팅으로 문의해주세요.' },
    { q: '1,000억 엑시트 사례가 실제인가요?', a: '네, 실제 자문 사례입니다. 기업명은 계약 상 비공개이며, 구체적 자문 내용은 상담 시 공유 가능합니다.' },
    { q: '최소 계약 기간은 어떻게 되나요?', a: '기본 1년 약정입니다. 계약 후 30일 이내 환불 보장. 이후엔 분기별 가맹점 수 기준으로 요금이 리베이스됩니다.' },
];

// ── 가격 산정식 v4.0 ────────────────────────────────────────
// pricing.ts의 calcPrice를 re-export (Single Source of Truth)
export { calcPrice } from './pricing';

// ── 공통 애니메이션 variants ────────────────────────────────
export const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
