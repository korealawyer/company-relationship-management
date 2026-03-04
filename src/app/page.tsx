'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  AlertTriangle, ShieldOff, TrendingDown, CheckCircle2,
  Phone, Video, CreditCard, ArrowRight, Star, Building2,
  Lock, ChevronDown, Zap, Award, Scale, Clock,
  Search, Loader2, TrendingUp, BadgeCheck, ChevronUp,
  Newspaper, MapPin, Mail, ExternalLink, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Mock company data based on cid param
const MOCK_COMPANIES: Record<string, { name: string; issueCount: number; riskLevel: string }> = {
  'test001': { name: '(주)놀부NBG', issueCount: 7, riskLevel: 'HIGH' },
  'test002': { name: '(주)파리바게뜨', issueCount: 4, riskLevel: 'MEDIUM' },
  'test003': { name: '(주)교촌에프앤비', issueCount: 6, riskLevel: 'HIGH' },
  'default': { name: '귀사의 프랜차이즈 본부', issueCount: 5, riskLevel: 'HIGH' },
};

const ISSUES_MOCK = [
  {
    level: 'HIGH',
    title: '수집 항목 법정 기재 누락',
    law: '개인정보 보호법 제30조 제1항 제1호',
    desc: '수집하는 개인정보 항목(이름, 연락처, 사업자정보)이 처리방침에 명시되지 않아 즉시 과태료 부과 대상입니다.',
    fine: '최대 3,000만원',
  },
  {
    level: 'HIGH',
    title: '제3자 제공 동의 절차 부재',
    law: '개인정보 보호법 제17조 제2항',
    desc: '가맹점 데이터를 마케팅 파트너사에 제공 시 별도 동의를 받아야 하나, 현 방침에 이 절차가 없습니다.',
    fine: '최대 5,000만원',
  },
  {
    level: 'MEDIUM',
    title: '보유·이용 기간 불명확',
    law: '개인정보 보호법 제30조 제1항 제3호',
    desc: '\"서비스 종료 시까지\"라는 불명확한 표현 사용. 개인정보 보호법은 구체적 보유 기간을 요구합니다.',
    fine: '시정 권고 후 반복 시 과태료',
  },
  {
    level: 'MEDIUM',
    title: '정보주체 권리 행사 방법 미기재',
    law: '개인정보 보호법 제35조·제36조·제37조',
    desc: '열람·정정·삭제·처리 정지 요청 방법 및 접수 담당자 정보가 없습니다.',
    fine: '과태료 최대 1,000만원',
  },
  {
    level: 'LOW',
    title: '개인정보 보호책임자 연락처 미흡',
    law: '개인정보 보호법 시행령 제31조',
    desc: '개인정보 보호책임자의 이메일·전화번호가 없어 민원 처리가 불가능한 상태입니다.',
    fine: '시정 권고',
  },
];

const RISK_SCENARIOS = [
  {
    icon: AlertTriangle,
    color: '#ef4444',
    title: '행정 처분 시나리오',
    desc: '개인정보보호위원회 정기 점검에서 위반 사항 적발 시 과징금 최대 3,000만원 이상 부과. 2023년 국내 프랜차이즈 과징금 평균: 1,800만원.',
    badge: '과징금 위험',
  },
  {
    icon: TrendingDown,
    color: '#f97316',
    title: '가맹점 민원 시나리오',
    desc: '가맹점주가 개인정보 처리 이의를 제기할 경우 가맹거래법상 분쟁조정 절차 개시. 본사 브랜드 이미지 훼손 및 언론 노출 리스크.',
    badge: '브랜드 위기',
  },
  {
    icon: ShieldOff,
    color: '#a855f7',
    title: '형사 처벌 시나리오',
    desc: '개인정보 불법 제3자 제공이 확인될 경우 대표이사 형사처벌(징역 5년 이하 또는 5,000만원 이하 벌금).',
    badge: '형사 위험',
  },
];

// 가격 산정식 (상품정의서 v3.0)
function calcPrice(n: number): number {
  if (n <= 0) return 300000;
  if (n <= 11) return 300000 + 20000 * (n - 1);
  return 500000 + Math.round(5617 * (n - 11));
}
function calcVoucher(n: number): number { return Math.round(calcPrice(n) * 0.5); }

const BASE_SERVICES = [
  { icon: Scale, title: '본사 법률자문', sub: 'HQ Legal Advisory', desc: '월 60시간 범위 내 무제한. 계약서·약관·분쟁 대응 직접 응대. 긴급 시 24시간.', badge: '월 60시간 포함', color: '#c9a84c' },
  { icon: Building2, title: '가맹점 법률상담', sub: 'Franchisee Consultation', desc: 'AI 챗봇 접수 → 변호사 BACKCALL 24시간 내 대응. 상담 내용 본사 절대 비공개.', badge: 'BACKCALL 시스템', color: '#60a5fa' },
  { icon: Award, title: '임직원 법률상담', sub: 'Employee Consultation', desc: '복리후생 프로그램. 부동산·가족·소비자 분쟁 등 개인 생활법률 익명 상담.', badge: '복리후생 포함', color: '#4ade80' },
  { icon: Zap, title: '분기 리스크 브리핑', sub: 'Franchise Risk Briefing', desc: '분기 1회(연 4회). 리스크 TOP 5 + 공정위 동향 + 체크리스트 + 표준문구 업데이트.', badge: '연 4회 자동 제공', color: '#a78bfa' },
  { icon: Clock, title: '법률 문서 2,000종', sub: 'Document Templates Library', desc: '연 1회 업데이트. Word+PDF 포맷. 본사·가맹점·임직원 자체 활용 가능.', badge: 'Word + PDF', color: '#f97316' },
];

const ADD_ONS = [
  { title: 'EAP 심리상담', sub: '이탈·분쟁 비용 절감', desc: '전문 상담기관 제휴. 익명 예약. 번아웃·갈등 완화 → 운영 안정성 강화.', tag: '2026.04 오픈', tagColor: '#facc15', price: '본사와 동일 산정식' },
  { title: '전수 진단·개선', sub: 'Comprehensive Legal Reform', desc: '기존 문서 전수 점검 → 리스크 발굴 → 표준화 산출물. 법률 DNA 체질 개선.', tag: 'PROJECT', tagColor: '#c9a84c', price: '협의 산정' },
  { title: '경영자문', sub: 'Management Advisory', desc: '재무/세무/투자/특허/법무. 투자 파트너 연계·소개. 동반성장 파트너십.', tag: 'PROJECT', tagColor: '#c9a84c', price: '협의 산정' },
];

const ADDITIONAL_SERVICES = [
  { name: '상표 출원·등록', regular: '49~50만원', subscriber: '27~28만원', note: '50% 할인 (관납료 포함)' },
  { name: '가맹계약서 최초 세팅', regular: '88만원', subscriber: '무상 제공', note: 'Base 60시간 소진' },
  { name: '정보공개서 신규 등록', regular: '88만원', subscriber: '44만원', note: '50% 할인' },
  { name: '정보공개서 정기 변경', regular: '88만원', subscriber: '44만원', note: '50% 할인' },
  { name: '해외 확장·M&A', regular: '협의 산정', subscriber: '협의 산정', note: '프로젝트 단위' },
  { name: '임직원 가맹사업법 교육', regular: '협의 산정', subscriber: '협의 산정', note: '온·오프라인' },
];

const PRICE_SAMPLES = [
  { n: 1, price: 30 }, { n: 5, price: 38 }, { n: 11, price: 50 },
  { n: 30, price: 60.7 }, { n: 50, price: 71.9 }, { n: 100, price: 100 }, { n: 150, price: 128.1 },
];

const _PRICING_PLANS = [
  {
    name: 'Starter',
    price: '99,000',
    period: '/월',
    annualNote: '연간 결제 시 ₩990,000 (2개월 무료)',
    desc: '개인정보처리방침 리스크를 처음 점검하는 프랜차이즈 본부',
    features: [
      '연 1회 전수 검토',
      '이슈 리포트 (1차 피드백)',
      'AI 자동 분석',
      '변호사 교차 검증',
      '이메일 지원',
    ],
    cta: 'Starter 시작하기',
    recommended: false,
    warning: '과징금 1,800만원의 5.5%에 불과한 보험',
  },
  {
    name: 'Standard',
    price: '199,000',
    period: '/월',
    annualNote: '연간 결제 시 ₩1,990,000 (2개월 무료)',
    desc: '분기별 검토와 지속적 법령 변경 대응이 필요한 성장 본부',
    features: [
      '분기별(연 4회) 전수 검토',
      '1차 + 2차 피드백 무제한 열람',
      '추가 질문 월 무제한',
      '법령 변경 자동 알림',
      '전담 담당 변호사 배정',
      '우선 응답 (48시간 SLA)',
    ],
    cta: '지금 Standard 시작',
    recommended: true,
    warning: '300개 본사 중 70%가 선택하는 플랜',
  },
  {
    name: 'Premium',
    price: '390,000',
    period: '/월',
    annualNote: '연간 결제 시 ₩3,900,000 (2개월 무료)',
    desc: '상시 자문과 긴급 법률 대응이 필요한 대형 프랜차이즈',
    features: [
      '월별 전수 검토',
      '1차~3차 피드백 전체 열람',
      '긴급 법률 대응 (24시간)',
      '계약서·약관 추가 검토',
      '소송·분쟁 조기 대응 지원',
      '전담 파트너 변호사',
      '월간 법률 리포트 제공',
    ],
    cta: 'Premium 상담 받기',
    recommended: false,
    warning: '대형 프랜차이즈 본사 전용',
  },
];

const TESTIMONIALS = [
  { company: '커피전문점 본사 (280개 가맹점)', quote: '"방침 수정 후 개인정보보호위 점검에서 이상 없음 확인. 대표이사 형사 리스크 제거"', rating: 5 },
  { company: '치킨 프랜차이즈 본사 (420개 가맹점)', quote: '"가맹점 민원으로 시작했는데, 방침 정비 후 민원 건수 0건. 가맹점주 신뢰 회복"', rating: 5 },
  { company: '뷰티 프랜차이즈 본사 (150개 가맹점)', quote: '"AI 분석 리포트가 내부 법무팀보다 더 빠르고 정확. 월 구독으로 전환한 것 후회 없음"', rating: 5 },
];

// URL 입력 → AI 분석 → 로그인 유도 후킹 플로우
function UrlAnalyzer() {
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [issueCount] = useState(() => Math.floor(Math.random() * (6 - 3 + 1)) + 3);

  const STEPS = [
    '검토 진행 중: 홈페이지 개인정보처리방침 확인중...',
    'AI 법률 DB 대조 분석 중...',
    '개인정보보호법 제30조 코린중...',
    '\uac00맹거래법 교차검증 중...',
    '변호사 교차 검토 준비 중...',
  ];
  const [stepIdx, setStepIdx] = useState(0);

  const handleAnalyze = () => {
    if (!url.trim()) return;
    setPhase('loading');
    setProgress(0);
    setStepIdx(0);
    let p = 0;
    let s = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => setPhase('done'), 400); }
      setProgress(Math.min(p, 100));
      if (p > s * 20 + 15) { s = Math.min(s + 1, STEPS.length - 1); setStepIdx(s); }
    }, 350);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="max-w-2xl mx-auto w-full">
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '16px', padding: '8px 8px 8px 16px' }}>
              <Search className="w-5 h-5 mt-3 flex-shrink-0" style={{ color: 'rgba(201,168,76,0.6)' }} />
              <input
                type="url" placeholder="https://your-franchise.co.kr 입력 — 30초 내 무료 진단"
                value={url} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                className="flex-1 bg-transparent text-sm outline-none py-2"
                style={{ color: '#f0f4ff' }} />
              <button onClick={handleAnalyze}
                className="px-5 py-2.5 rounded-xl font-black text-sm transition-all"
                style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                AI 진단 시작
              </button>
            </div>
            <p className="text-center text-xs mt-2" style={{ color: 'rgba(240,244,255,0.3)' }}>URL 미입력 시 블라인드 테스트 버전으로 실행 · 개인정보 수집 없음</p>
          </motion.div>
        )}
        {phase === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="p-6 rounded-2xl" style={{ background: 'rgba(13,27,62,0.8)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#c9a84c' }} />
              <span className="text-sm font-bold" style={{ color: '#e8c87a' }}>분석 진행 중...</span>
            </div>
            <div className="h-2 w-full rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div className="h-2 rounded-full" style={{ background: 'linear-gradient(90deg,#c9a84c,#e8c87a)', width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
            <p className="text-xs" style={{ color: 'rgba(240,244,255,0.5)' }}>{STEPS[stepIdx]}</p>
          </motion.div>
        )}
        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl text-center" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 text-xs font-bold" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
              <AlertTriangle className="w-3.5 h-3.5" /> AI 분석 완료
            </div>
            <p className="font-black text-xl mb-1" style={{ color: '#f0f4ff' }}>법적 위반 이슈 <span style={{ color: '#f87171' }}>{issueCount}건</span> 발견</p>
            <p className="text-sm mb-4" style={{ color: 'rgba(240,244,255,0.5)' }}>변호사 교차 검증 리포트는 로그인 후 확인 가능합니다</p>
            <div className="flex gap-3 justify-center">
              <Link href="/client-portal">
                <Button variant="premium" size="md" className="gap-2">
                  <Lock className="w-4 h-4" /> 로그인하여 전체 리포트 보기 <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <button onClick={() => { setPhase('idle'); setUrl(''); }}
                className="text-sm px-3 py-2 rounded-xl" style={{ color: 'rgba(240,244,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>다시 분석</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Animated counter
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// 실시간 가격 계산기
function PriceCalculator() {
  const [storeCount, setStoreCount] = useState(30);
  const price = calcPrice(storeCount);
  const voucher = calcVoucher(storeCount);
  const net = price - voucher;

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
      <Card padding="lg" gold>
        <p className="font-black text-sm mb-1" style={{ color: '#e8c87a' }}>💡 내 가맹점 수로 계산하기</p>
        <p className="text-xs mb-5" style={{ color: 'rgba(201,168,76,0.6)' }}>슬라이더를 움직여 예상 요금을 확인하세요</p>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold" style={{ color: 'rgba(240,244,255,0.7)' }}>가맹점 수</span>
            <span className="text-2xl font-black" style={{ color: '#e8c87a' }}>{storeCount}개</span>
          </div>
          <input
            type="range" min={1} max={200} value={storeCount}
            onChange={e => setStoreCount(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#c9a84c', background: `linear-gradient(to right, #c9a84c ${storeCount / 2}%, rgba(255,255,255,0.1) ${storeCount / 2}%)` }}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(240,244,255,0.3)' }}>
            <span>1개</span><span>100개</span><span>200개</span>
          </div>
        </div>
        <div className="space-y-3 mb-6">
          {[
            { label: '월 정가', value: `${(price / 10000).toFixed(1)}만원`, color: 'rgba(240,244,255,0.6)', strike: true },
            { label: '월 바우처 (50%)', value: `-${(voucher / 10000).toFixed(1)}만원`, color: '#4ade80', strike: false },
            { label: '첫 6개월 실부담', value: `${(net / 10000).toFixed(1)}만원/월`, color: '#e8c87a', strike: false, big: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2"
              style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
              <span className="text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>{row.label}</span>
              <span className={`font-black ${row.big ? 'text-xl' : 'text-base'}`}
                style={{ color: row.color, textDecoration: row.strike ? 'line-through' : 'none' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <div className="text-xs mb-5" style={{ color: 'rgba(201,168,76,0.6)' }}>
          12개월 바우처 총액: <strong style={{ color: '#c9a84c' }}>{Math.round(voucher * 12 / 10000)}만원</strong> (Add-on·추가서비스·수임료 할인 사용 가능)
        </div>
        <Link href="/login">
          <Button variant="premium" size="lg" className="w-full gap-2">
            <Phone className="w-4 h-4" /> 이 요금으로 상담 신청
          </Button>
        </Link>
        <p className="text-xs text-center mt-2" style={{ color: 'rgba(240,244,255,0.35)' }}>
          최소 1년 약정 · VAT 별도 · 분기별 가맹점 수 기준 리베이스
        </p>
      </Card>
    </motion.div>
  );
}

// FAQ 아코디언
const FAQ_ITEMS = [
  { q: '개인정보처리방침 검토는 정말 무료인가요?', a: 'AI 1차 분석은 완전 무료입니다. 변호사 교차 검증 의견서 및 수정 초안 열람은 로그인 후 플랜에 따라 제공됩니다.' },
  { q: '계약하면 무엇이 달라지나요?', a: '전담 파트너 변호사 배정 → 분기별 전수 검토 → 법령 개정 자동 알림 → 가맹점·임직원 법률상담 BACKCALL 시스템이 즉시 활성화됩니다.' },
  { q: '가맹점(지점)도 법률상담을 받을 수 있나요?', a: '본사 구독 시 산하 가맹점·임직원 전원이 AI 챗봇 접수 → 변호사 BACKCALL 24시간 내 대응 서비스를 이용할 수 있습니다. 상담 내용은 본사에 공개되지 않습니다.' },
  { q: '과태료 위기 상황인데 지금 즉시 도움받을 수 있나요?', a: '네. 긴급 신청 시 담당 변호사가 4시간 이내 연락드립니다. 02-555-1234로 전화주시거나 우측 하단 채팅으로 문의해주세요.' },
  { q: '1,000억 엑시트 사례가 실제인가요?', a: '네, 실제 자문 사례입니다. 기업명은 계약 상 비공개이며, 구체적 자문 내용은 상담 시 공유 가능합니다.' },
  { q: '최소 계약 기간은 어떻게 되나요?', a: '기본 1년 약정입니다. 계약 후 30일 이내 환불 보장. 이후엔 분기별 가맹점 수 기준으로 요금이 리베이스됩니다.' },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(13,27,62,0.3)' }}>
      <div className="max-w-3xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          className="text-center mb-10">
          <h2 className="text-3xl font-black mb-2" style={{ color: '#f0f4ff' }}>자주 묻는 질문</h2>
          <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>도입 전 궁금한 것들을 미리 해소하세요</p>
        </motion.div>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(201,168,76,0.12)', background: open === i ? 'rgba(201,168,76,0.05)' : 'rgba(13,27,62,0.5)' }}>
                <button className="w-full text-left flex items-center justify-between gap-3 px-5 py-4" onClick={() => setOpen(open === i ? null : i)}>
                  <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>{item.q}</span>
                  {open === i ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#c9a84c' }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(201,168,76,0.4)' }} />}
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.6)' }}>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Scroll progress bar
function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div className="scroll-progress" style={{ width: `${progress}%` }} />;
}

export default function LandingPage({ searchParams }: { searchParams: Promise<{ cid?: string }> }) {
  const [company, setCompany] = useState(MOCK_COMPANIES['default']);
  const [resolvedParams, setResolvedParams] = useState<{ cid?: string }>({});

  useEffect(() => {
    searchParams.then((params) => {
      setResolvedParams(params);
      if (params.cid && MOCK_COMPANIES[params.cid]) {
        setCompany(MOCK_COMPANIES[params.cid]);
      }
    });
  }, [searchParams]);

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <>
      <ScrollProgress />
      <div style={{ background: '#04091a' }}>

        {/* ── 1. HERO ── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(35,68,168,0.3) 0%, transparent 70%)', top: '-10%', left: '-5%' }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)', bottom: '10%', right: '5%' }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, delay: 2 }}
            />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
            {/* Company-specific badge */}
            {resolvedParams.cid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold"
                style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', color: '#e8c87a' }}
              >
                <Zap className="w-4 h-4" />
                {company.name} — 맞춤 분석 리포트
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
              style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', color: '#e8c87a' }}
            >
              <BadgeCheck className="w-4 h-4" />
              한국 프랜차이즈 전문 1등 로펌 · 설립 12년
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight mb-6"
              style={{ color: '#f0f4ff' }}
            >
              <span style={{ display: 'block' }}>프랜차이즈 본부의</span>
              <span style={{
                display: 'block',
                background: 'linear-gradient(135deg, #e8c87a, #c9a84c)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                법률 리스크
              </span>
              <span style={{ display: 'block', fontSize: '0.75em', color: 'rgba(240,244,255,0.9)' }}>
                AI가 30초 만에 진단합니다
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg sm:text-xl mb-8 max-w-3xl mx-auto leading-relaxed"
              style={{ color: 'rgba(240,244,255,0.7)' }}
            >
              자문 기업 <strong style={{ color: '#e8c87a' }}>1,000억원 엑시트</strong> 달성 · <strong style={{ color: '#e8c87a' }}>45,000명</strong> 법률 서비스 제공<br />
              지금 홈페이지 URL을 입력하면 무료로 법적 리스크를 진단해 드립니다.
            </motion.p>

            {/* URL 분석 플로우 */}
            <UrlAnalyzer />

            {/* 보조 CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mt-5 mb-16"
            >
              <a href="tel:025551234">
                <Button variant="ghost" size="md" className="gap-2 w-full sm:w-auto">
                  <Phone className="w-4 h-4" /> 전화 상담
                </Button>
              </a>
              <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="md" className="gap-2 w-full sm:w-auto">
                  <Video className="w-4 h-4" /> 줌 상담 예약
                </Button>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-3 gap-6 max-w-lg mx-auto"
            >
              {[
                { value: 80000, suffix: '+', label: '누적 법률 자문' },
                { value: 45000, suffix: '명', label: '법률 서비스 회원' },
                { value: 98, suffix: '%', label: '리스크 해결률' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-black" style={{ color: '#c9a84c' }}>
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(240,244,255,0.5)' }}>{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Scroll down indicator */}
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="w-6 h-6" style={{ color: 'rgba(201,168,76,0.5)' }} />
            </motion.div>
          </div>
        </section>

        <div className="gold-divider" />

        {/* ── 2. ISSUE SUMMARY ── */}
        <section id="issues" className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(13,27,62,0.3)' }}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-bold"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                <AlertTriangle className="w-4 h-4" /> AI 분석 결과 — 발견 이슈 {company.issueCount}건
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>법적 위반 이슈</span> 상세 보고서
              </h2>
              <p className="text-lg" style={{ color: 'rgba(240,244,255,0.6)' }}>
                아래는 AI 1차 분석 결과입니다. 변호사 교차 검증 리포트는 로그인 후 확인하세요.
              </p>
            </motion.div>

            <div className="space-y-4">
              {ISSUES_MOCK.map((issue, i) => (
                <motion.div
                  key={i}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { delay: i * 0.1, duration: 0.5 } } }}
                >
                  <Card padding="lg">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5"
                          style={{
                            background: issue.level === 'HIGH' ? 'rgba(239,68,68,0.15)' : issue.level === 'MEDIUM' ? 'rgba(251,146,60,0.15)' : 'rgba(250,204,21,0.15)',
                            color: issue.level === 'HIGH' ? '#f87171' : issue.level === 'MEDIUM' ? '#fb923c' : '#facc15',
                          }}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={issue.level === 'HIGH' ? 'badge-high' : issue.level === 'MEDIUM' ? 'badge-medium' : 'badge-low'}>
                              {issue.level === 'HIGH' ? '🔴 HIGH' : issue.level === 'MEDIUM' ? '🟠 MEDIUM' : '🟡 LOW'}
                            </span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.5)' }}>
                              {issue.law}
                            </span>
                          </div>
                          <h3 className="font-bold text-base mb-2" style={{ color: '#f0f4ff' }}>{issue.title}</h3>
                          <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.65)' }}>{issue.desc}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right sm:ml-4">
                        <div className="text-xs mb-1" style={{ color: 'rgba(240,244,255,0.4)' }}>예상 리스크</div>
                        <div className="font-black text-base" style={{ color: '#f87171' }}>{issue.fine}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Unlock more CTA */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="mt-8 text-center"
            >
              <div className="relative rounded-2xl p-8 overflow-hidden" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Lock className="w-5 h-5" style={{ color: '#c9a84c' }} />
                  <span className="font-bold" style={{ color: '#c9a84c' }}>변호사 검토 의견 + 2차·3차 피드백은 로그인 후 확인 가능합니다</span>
                </div>
                <p className="text-sm mb-6" style={{ color: 'rgba(240,244,255,0.5)' }}>
                  이메일로 발송된 임시 비밀번호로 로그인하시면 전체 리포트를 즉시 확인하실 수 있습니다.
                </p>
                <Link href="/client-portal">
                  <Button variant="premium" size="lg">
                    로그인하여 전체 리포트 보기 <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="gold-divider" />

        {/* ── 3. RISK SCENARIOS ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                방치하면 어떻게 될까요?
              </h2>
              <p style={{ color: 'rgba(240,244,255,0.6)' }}>실제 발생한 프랜차이즈 법적 분쟁 사례를 기반으로 한 리스크 시나리오</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {RISK_SCENARIOS.map((scenario, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                >
                  <Card padding="lg" className="h-full">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: `${scenario.color}20` }}>
                      <scenario.icon className="w-6 h-6" style={{ color: scenario.color }} />
                    </div>
                    <div className="inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-3"
                      style={{ background: `${scenario.color}20`, color: scenario.color, border: `1px solid ${scenario.color}50` }}>
                      {scenario.badge}
                    </div>
                    <h3 className="font-black text-lg mb-3" style={{ color: '#f0f4ff' }}>{scenario.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.65)' }}>{scenario.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <div className="gold-divider" />

        {/* ── 4. 5대 포함 서비스 ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(13,27,62,0.3)' }}>
          <div className="max-w-6xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-bold"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}>
                <CheckCircle2 className="w-4 h-4" /> 프리미엄 연간자문 — 기본 포함 서비스
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                IBS 법률사무소가 <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>5가지를 기본 제공</span>합니다
              </h2>
              <p style={{ color: 'rgba(240,244,255,0.6)' }}>단순 법률자문이 아닌 — 본사·가맹점·임직원 전체를 커버하는 브랜드 리스크 운영 예산</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BASE_SERVICES.map((svc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Card padding="lg" className="h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${svc.color}18`, border: `1px solid ${svc.color}30` }}>
                        <svc.icon className="w-5 h-5" style={{ color: svc.color }} />
                      </div>
                      <div>
                        <p className="font-black text-sm" style={{ color: '#f0f4ff' }}>{svc.title}</p>
                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{svc.sub}</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(240,244,255,0.65)' }}>{svc.desc}</p>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold"
                      style={{ background: `${svc.color}15`, color: svc.color, border: `1px solid ${svc.color}30` }}>
                      ✅ {svc.badge}
                    </span>
                  </Card>
                </motion.div>
              ))}
              {/* 6번째 셀 — 포지셔닝 카드 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Card padding="lg" gold className="h-full flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: 'rgba(201,168,76,0.7)' }}>핵심 차별점</p>
                    {[
                      '사건 처리 → 사고 예방 중심',
                      '본사 + 가맹점 + 임직원 원스톱',
                      '공식 법률파트너 표기 제공',
                      '분기 리스크 브리핑으로 선제 대응',
                    ].map((pt, j) => (
                      <div key={j} className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#c9a84c' }} />
                        <span className="text-sm" style={{ color: 'rgba(240,244,255,0.8)' }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}>
                    <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>최소 계약: 1년 / 분기별 가맹점 수 기준 요금 리베이스</p>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="gold-divider" />

        {/* ── 5. PRICING — 가격 계산기 ── */}
        <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>가맹점 수</span>에 따라 요금이 결정됩니다
              </h2>
              <p style={{ color: 'rgba(240,244,255,0.6)' }}>프리미엄 연간자문 (HQ+Store+Employee) · 1년 약정 · VAT 별도</p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8 mb-10">
              {/* 인터랙티브 계산기 */}
              <PriceCalculator />

              {/* 샘플 가격표 */}
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <Card padding="md">
                  <p className="font-black text-sm mb-4 px-2" style={{ color: '#c9a84c' }}>샘플 가격표</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                        <th className="px-3 py-2 text-left text-xs font-bold" style={{ color: 'rgba(201,168,76,0.7)' }}>가맹점 수</th>
                        <th className="px-3 py-2 text-right text-xs font-bold" style={{ color: 'rgba(201,168,76,0.7)' }}>월 요금</th>
                        <th className="px-3 py-2 text-right text-xs font-bold" style={{ color: 'rgba(201,168,76,0.7)' }}>바우처(월)</th>
                        <th className="px-3 py-2 text-right text-xs font-bold" style={{ color: 'rgba(201,168,76,0.7)' }}>실부담</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRICE_SAMPLES.map((row) => {
                        const price = calcPrice(row.n);
                        const voucher = calcVoucher(row.n);
                        return (
                          <tr key={row.n} className="transition-colors hover:bg-[rgba(201,168,76,0.04)]"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td className="px-3 py-2.5 font-bold" style={{ color: '#f0f4ff' }}>{row.n}개</td>
                            <td className="px-3 py-2.5 text-right" style={{ color: 'rgba(240,244,255,0.7)' }}>{(price / 10000).toFixed(1)}만원</td>
                            <td className="px-3 py-2.5 text-right" style={{ color: '#4ade80' }}>-{(voucher / 10000).toFixed(1)}만원</td>
                            <td className="px-3 py-2.5 text-right font-black" style={{ color: '#c9a84c' }}>{((price - voucher) / 10000).toFixed(1)}만원</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="text-xs px-3 pt-3" style={{ color: 'rgba(240,244,255,0.35)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    ✅ 바우처: 12개월간 월 구독료 50% 크레딧 적립 · 첫 6개월은 Base 구독료에 직접 적용 가능
                  </p>
                </Card>
              </motion.div>
            </div>

            {/* 바우처 혜택 강조 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-10">
              <Card padding="lg" gold>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5" style={{ color: '#c9a84c' }} />
                      <span className="font-black text-base" style={{ color: '#e8c87a' }}>신규 계약 바우처 혜택 — 12개월간 실질 50% 할인 효과</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.65)' }}>
                      계약 후 12개월간 매월 구독료의 50% 크레딧 적립. 첫 6개월은 Base 구독료에 직접 사용(월 최대 50%). 잔여 크레딧은 애드온·추가 서비스·소송 수임료 할인에 활용 가능.
                    </p>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <div className="text-4xl font-black" style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>600만원</div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(201,168,76,0.7)' }}>가맹점 100개 기준 12개월 바우처</div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* 애드온 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-10">
              <h3 className="text-xl font-black mb-5" style={{ color: '#f0f4ff' }}>
                <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>애드온</span> 모듈
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {ADD_ONS.map((addon, i) => (
                  <Card key={i} padding="md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: `${addon.tagColor}18`, color: addon.tagColor, border: `1px solid ${addon.tagColor}30` }}>
                        {addon.tag}
                      </span>
                    </div>
                    <p className="font-black text-sm mb-0.5" style={{ color: '#f0f4ff' }}>{addon.title}</p>
                    <p className="text-xs mb-2" style={{ color: 'rgba(240,244,255,0.45)' }}>{addon.sub}</p>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(240,244,255,0.6)' }}>{addon.desc}</p>
                    <div className="text-xs font-bold" style={{ color: '#c9a84c' }}>💬 {addon.price}</div>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* 추가 서비스 테이블 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h3 className="text-xl font-black mb-5" style={{ color: '#f0f4ff' }}>
                <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>추가 서비스</span> — 구독 시 최대 50% 할인
              </h3>
              <Card padding="sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                        {['서비스명', '정가', '구독 시', '비고'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold" style={{ color: 'rgba(201,168,76,0.7)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ADDITIONAL_SERVICES.map((svc, i) => (
                        <tr key={i} className="transition-colors hover:bg-[rgba(201,168,76,0.04)]"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-4 py-3 font-semibold" style={{ color: '#f0f4ff' }}>{svc.name}</td>
                          <td className="px-4 py-3" style={{ color: 'rgba(240,244,255,0.5)', textDecoration: 'line-through' }}>{svc.regular}</td>
                          <td className="px-4 py-3 font-black" style={{ color: svc.subscriber === '무상 제공' ? '#4ade80' : '#c9a84c' }}>{svc.subscriber}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>{svc.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>


            {/* Risk reversal */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="mt-10 text-center"
            >
              <div className="inline-flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> 언제든 취소 가능</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> 30일 환불 보장</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> 카드/계좌이체 가능</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> VAT 별도</span>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="gold-divider" />

        {/* ── 6. TESTIMONIALS ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(13,27,62,0.3)' }}>
          <div className="max-w-6xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-black mb-2" style={{ color: '#f0f4ff' }}>이미 300개 본사가 선택했습니다</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Card padding="lg" className="h-full">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, s) => (
                        <Star key={s} className="w-4 h-4 fill-[#c9a84c]" style={{ color: '#c9a84c' }} />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(240,244,255,0.8)' }}>{t.quote}</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" style={{ color: 'rgba(201,168,76,0.7)' }} />
                      <span className="text-xs font-medium" style={{ color: 'rgba(240,244,255,0.5)' }}>{t.company}</span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <div className="gold-divider" />

        {/* ── 마지막 CTA ──  - 기존 컴포넌트에 코드 변경 없이 유지 */}
        <section id="cta" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#e8c87a' }}>
                <Clock className="w-4 h-4" /> 지금 바로 시작하세요
              </div>
              <h2 className="text-3xl sm:text-5xl font-black mb-6" style={{ color: '#f0f4ff' }}>
                오늘 조치하지 않으면<br />
                <span style={{ background: 'linear-gradient(135deg,#f87171,#ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>내일이 더 위험합니다</span>
              </h2>
              <p className="text-lg mb-12 max-w-2xl mx-auto" style={{ color: 'rgba(240,244,255,0.7)' }}>
                개인정보보호위원회 정기 점검은 예고 없이 찾아옵니다.<br />
                지금 무료 1차 검토를 받고, 법적 리스크를 완전히 제거하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:025551234">
                  <Button variant="ghost" size="xl" className="gap-3 w-full sm:w-auto">
                    <Phone className="w-6 h-6" />
                    02-555-1234 지금 전화
                  </Button>
                </a>
                <Link href="/login">
                  <Button variant="premium" size="xl" className="gap-3 w-full sm:w-auto">
                    <Lock className="w-6 h-6" />
                    무료 리포트 지금 확인
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="gold-divider" />

        {/* ── 미디어 노출 배지 ── */}
        <section className="py-12 px-4" style={{ background: 'rgba(13,27,62,0.5)' }}>
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-xs font-bold mb-6" style={{ color: 'rgba(240,244,255,0.25)' }}>
              언론 및 미디어 보도
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {['조선일보', '한국경제신문', 'SBS Biz', '연합뉴스TV', '로이터즈', '공정거래위원회 자료집'].map((m, i) => (
                <div key={i} className="px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-sm font-bold" style={{ color: 'rgba(240,244,255,0.35)' }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 케이스 스터디 ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-bold"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}>
                <Award className="w-4 h-4" /> 실제 성과 사례
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: '#f0f4ff' }}>
                IBS가 자문한 기업들의 <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>실제 성과</span>
              </h2>
              <p style={{ color: 'rgba(240,244,255,0.5)' }}>법률 자문이 사업 성과로 직결되는 순간</p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  emoji: '🎉',
                  highlight: '1,000억원 엑시트',
                  company: '투자유치 중 M&A',
                  desc: '자묨12년차 직영 스토리지 프랜차이즈 본부. 우리의 프랜차이즈 계약 서류 정비 후 투자자 신뢰도 확보 성공, 1,000억원 M&A 엑시트 달성.',
                  badge: '2024년 10월 완료',
                  color: '#c9a84c',
                },
                {
                  emoji: '📊',
                  highlight: '과태료 0원',
                  company: '외식 프랜차이즈 280개점',
                  desc: '개인정보보호위원회 현장 점검에서 위반사항 적발 당해 과태료 2,400만원 실보 위기. IBS 조속 수임 후 행정순욝 고충 성공, 교정조치 마무리.',
                  badge: '과태료 감면 확정',
                  color: '#4ade80',
                },
                {
                  emoji: '⚖️',
                  highlight: '분쟁 전담 속결',
                  company: '미용 프랜차이즈 150개점',
                  desc: '가맹점주 12명 집단 소송 위기. 개인정보 보호 의무 위반 주장 증거 무효화 성공, 본사 도주숫을 당겨내며 1년 이내 전송 합의 완료.',
                  badge: '소송 수패',
                  color: '#60a5fa',
                },
              ].map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}>
                  <Card padding="lg" className="h-full">
                    <div className="text-3xl mb-3">{c.emoji}</div>
                    <p className="font-black text-xl mb-1" style={{ color: c.color }}>{c.highlight}</p>
                    <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(240,244,255,0.4)' }}>{c.company}</p>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(240,244,255,0.65)' }}>{c.desc}</p>
                    <span className="inline-block text-xs px-2.5 py-1 rounded-full font-bold"
                      style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30` }}>{c.badge}</span>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <div className="gold-divider" />

        {/* ── FAQ ── */}
        <FaqSection />

        <div className="gold-divider" />

        {/* ── 푸터 ── */}
        <footer style={{ background: 'rgba(4,8,20,0.95)', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a', width: 32, height: 32, letterSpacing: '-0.5px' }}>
                    IBS
                  </div>
                  <div>
                    <p className="font-black text-sm" style={{ color: '#f0f4ff' }}>법률사무소</p>
                    <p className="text-[10px]" style={{ color: 'rgba(201,168,76,0.5)' }}>IBS LAW FIRM</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.4)' }}>한국 No.1 프랜차이즈 전문 로펌<br />설립 2013년 · 본점 서울 서초구</p>
                <div className="flex gap-2 mt-4">
                  {[Shield, BadgeCheck, Award].map((I, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                      <I className="w-4 h-4" style={{ color: '#c9a84c' }} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-bold text-sm mb-4" style={{ color: '#c9a84c' }}>서비스</p>
                {['프랜차이즈 자문', '가맹점 해승 대응', '개인정보 컴플라이언스', '소송·분쟁 해결', '연간 법률 진단'].map((s, i) => (
                  <p key={i} className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'rgba(240,244,255,0.45)' }}>
                    <ChevronDown className="w-3 h-3 -rotate-90" style={{ color: 'rgba(201,168,76,0.4)' }} />{s}
                  </p>
                ))}
              </div>
              <div>
                <p className="font-bold text-sm mb-4" style={{ color: '#c9a84c' }}>연락정보</p>
                {[
                  { icon: Phone, text: '02-555-1234' },
                  { icon: Mail, text: 'legal@ibs-law.co.kr' },
                  { icon: MapPin, text: '서울시 서초구 서초대로 272, IBS빌딩' },
                  { icon: Clock, text: '평일 09:00‒18:00' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <c.icon className="w-3.5 h-3.5" style={{ color: 'rgba(201,168,76,0.5)' }} />
                    <span className="text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>{c.text}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="font-bold text-sm mb-4" style={{ color: '#c9a84c' }}>신뢰 인증</p>
                {['대한변호사협회 등록', '대한법조코리아 회원사', '개인정보보호월회 귀상 자문사', '공정거래위원회 등록 뺕주인'].map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4ade80' }} />
                    <span className="text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs" style={{ color: 'rgba(240,244,255,0.2)' }}>
                © 2026 IBS 법률사무소. All rights reserved. · 사업자등록번호 123-45-67890 · 대표변호사 유정훈
              </p>
              <div className="flex gap-4">
                {['이용약관', '개인정보처리방침', '비술익참제한'].map((l) => (
                  <a key={l} href="#" className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>{l}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
