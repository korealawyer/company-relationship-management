'use client';

import React, { Suspense, useEffect, useState } from 'react';
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
  const [company, setCompany] = useState(MOCK_COMPANIES['default']);
  const resolvedParams: { cid?: string } = cid ? { cid } : {};

  useEffect(() => {
    if (cid && MOCK_COMPANIES[cid]) {
      setCompany(MOCK_COMPANIES[cid]);
    }
  }, [cid]);

  return (
    <>
      <ScrollProgress />
      <div style={{ background: '#04091a' }}>

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
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.4)' }}>
                  한국 No.1 프랜차이즈 전문 로펌<br />설립 2013년 · 본점 서울 서초구
                </p>
                <div className="flex gap-2 mt-4">
                  {[Shield, BadgeCheck, Award].map((I, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                      <I className="w-4 h-4" style={{ color: '#c9a84c' }} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-bold text-sm mb-4" style={{ color: '#c9a84c' }}>서비스</p>
                {['프랜차이즈 자문', '가맹점 분쟁 해결', '개인정보 컴플라이언스', '소송·분쟁 해결', '연간 법률 진단'].map((s, i) => (
                  <p key={i} className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'rgba(240,244,255,0.45)' }}>
                    <ChevronDown className="w-3 h-3 -rotate-90" style={{ color: 'rgba(201,168,76,0.4)' }} />{s}
                  </p>
                ))}
              </div>
              <div>
                <p className="font-bold text-sm mb-4" style={{ color: '#c9a84c' }}>연락정보</p>
                {[
                  { text: '02-555-1234' },
                  { text: 'legal@ibs-law.co.kr' },
                  { text: '서울시 서초구 서초대로 272, IBS빌딩' },
                  { text: '평일 09:00‒18:00' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>{c.text}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="font-bold text-sm mb-4" style={{ color: '#c9a84c' }}>신뢰 인증</p>
                {['대한변호사협회 등록', '대한법조코리아 회원사', '개인정보보호위원회 자문사', '공정거래위원회 등록 법률사무소'].map((b, i) => (
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
                {['이용약관', '개인정보처리방침', '광고성 정보 수신 거부'].map((l) => (
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

// Suspense 래퍼: useSearchParams 사용을 위해 필수
export default function LandingPage() {
  return (
    <Suspense>
      <LandingPageInner />
    </Suspense>
  );
}
