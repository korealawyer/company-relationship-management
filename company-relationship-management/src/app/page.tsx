'use client';

import React, { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Phone, Lock, Clock, ArrowRight, Shield, BadgeCheck, Award, CheckCircle2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ── 랜딩 섹션 컴포넌트 ────────────────────────────────────
import HeroSection, { ScrollProgress } from '@/components/landing/HeroSection';
import IssueSection from '@/components/landing/IssueSection';
import RiskSection from '@/components/landing/RiskSection';
import ServicesSection from '@/components/landing/ServicesSection';
import PricingSection from '@/components/landing/PricingSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import FaqSection from '@/components/landing/FaqSection';

// ── Mock 회사 데이터 ────────────────────────────────────────
import { MOCK_COMPANIES, fadeUp } from '@/lib/landingData';

// ── useSearchParams는 Suspense 경계 안에서만 사용 가능 ──────
function LandingPageInner() {
  const searchParams = useSearchParams();
  const cid = searchParams.get('cid') ?? '';
  const company = useMemo(() => (cid && MOCK_COMPANIES[cid]) ? MOCK_COMPANIES[cid] : MOCK_COMPANIES['default'], [cid]);
  const resolvedParams: { cid?: string } = cid ? { cid } : {};

  return (
    <>
      <ScrollProgress />
      <div className="bg-navy-deep">

        {/* ── 1. HERO ── */}
        <HeroSection company={company} resolvedParams={resolvedParams} />

        <div className="gold-divider" />

        {/* ── 2. ISSUE SUMMARY ── */}
        <IssueSection company={company} />

        <div className="gold-divider" />

        {/* ── 3. RISK SCENARIOS ── */}
        <RiskSection />

        <div className="gold-divider" />

        {/* ── 4. 5대 포함 서비스 ── */}
        <ServicesSection />

        <div className="gold-divider" />

        {/* ── 5. PRICING ── */}
        <PricingSection />

        <div className="gold-divider" />

        {/* ── 6. TESTIMONIALS + 미디어 + 케이스 스터디 ── */}
        <TestimonialsSection />

        <div className="gold-divider" />

        {/* ── 마지막 CTA ── */}
        <section id="cta" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold pill-gold pill-gold-text">
                <Clock className="w-4 h-4" /> 지금 바로 시작하세요
              </div>
              <h2 className="text-3xl sm:text-5xl font-black mb-6 text-light">
                오늘 조치하지 않으면<br />
                <span className="text-danger-gradient">내일이 더 위험합니다</span>
              </h2>
              <p className="text-lg mb-12 max-w-2xl mx-auto text-muted-70">
                개인정보보호위원회 정기 점검은 예고 없이 찾아옵니다.<br />
                지금 무료 1차 검토를 받고, 법적 리스크를 완전히 제거하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:025551234">
                  <Button variant="ghost" size="xl" className="gap-3 w-full sm:w-auto">
                    <Phone className="w-6 h-6" /> 02-555-1234 지금 전화
                  </Button>
                </a>
                <Link href="/login">
                  <Button variant="premium" size="xl" className="gap-3 w-full sm:w-auto">
                    <Lock className="w-6 h-6" /> 무료 리포트 지금 확인 <ArrowRight className="w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="gold-divider" />

        {/* ── FAQ ── */}
        <FaqSection />

        <div className="gold-divider" />

        {/* ── 푸터 ── */}
        <footer className="footer-bg">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 logo-gold"
                    style={{ width: 32, height: 32 }}>
                    IBS
                  </div>
                  <div>
                    <p className="font-black text-sm text-light">법률사무소</p>
                    <p className="text-[10px] text-gold-50">IBS LAW FIRM</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-40">
                  한국 No.1 프랜차이즈 전문 로펌<br />설립 2013년 · 본점 서울 서초구
                </p>
                <div className="flex gap-2 mt-4">
                  {[Shield, BadgeCheck, Award].map((I, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center bg-gold-subtle border-gold-light">
                      <I className="w-4 h-4 text-gold" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-bold text-sm mb-4 text-gold">서비스</p>
                {['프랜차이즈 자문', '가맹점 분쟁 해결', '개인정보 컴플라이언스', '소송·분쟁 해결', '연간 법률 진단'].map((s, i) => (
                  <p key={i} className="text-xs mb-2 flex items-center gap-1.5 text-muted-45">
                    <ChevronDown className="w-3 h-3 -rotate-90 text-gold-40" />{s}
                  </p>
                ))}
              </div>
              <div>
                <p className="font-bold text-sm mb-4 text-gold">연락정보</p>
                {[
                  { text: '02-555-1234' },
                  { text: 'legal@ibs-law.co.kr' },
                  { text: '서울시 서초구 서초대로 272, IBS빌딩' },
                  { text: '평일 09:00‒18:00' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-muted-45">{c.text}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="font-bold text-sm mb-4 text-gold">신뢰 인증</p>
                {['대한변호사협회 등록', '대한법조코리아 회원사', '개인정보보호위원회 자문사', '공정거래위원회 등록 법률사무소'].map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-green" />
                    <span className="text-xs text-muted-45">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-glass-top">
              <p className="text-xs text-muted-45">
                © 2026 IBS 법률사무소. All rights reserved. · 사업자등록번호 123-45-67890 · 대표변호사 유정훈
              </p>
              <div className="flex gap-4">
                <Link href="/legal/terms" className="text-xs hover:underline text-muted-45">이용약관</Link>
                <Link href="/legal/privacy" className="text-xs hover:underline text-muted-45">개인정보처리방침</Link>
                <Link href="/legal" className="text-xs hover:underline text-muted-45">광고성 정보 수신 거부</Link>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

// Suspense 래퍼: useSearchParams 사용을 위해 필수
export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#04091a' }}><div className="text-gold text-lg font-bold animate-pulse">로딩 중...</div></div>}>
      <LandingPageInner />
    </Suspense>
  );
}
