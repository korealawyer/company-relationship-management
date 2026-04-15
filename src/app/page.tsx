import React, { Suspense } from 'react';
import Link from 'next/link';
import { ChevronDown, Shield, BadgeCheck, Award, CheckCircle2 } from 'lucide-react';

import HeroSection, { ScrollProgress } from '@/components/landing/HeroSection';
import InfraMapSection from '@/components/landing/InfraMapSection';
import UseCaseSection from '@/components/landing/UseCaseSection';
import ServicesSection from '@/components/landing/ServicesSection';
import FreeTierSection from '@/components/landing/FreeTierSection';
import PricingSection from '@/components/landing/PricingSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import TrustBadgeSection from '@/components/landing/TrustBadgeSection';
import FaqSection from '@/components/landing/FaqSection';
import FeatureShowcase from '@/components/landing/FeatureShowcase';

import GuideDownloadSection from '@/components/landing/GuideDownloadSection';
import CtaSection from '@/components/landing/CtaSection';
import ClaimPopup from '@/components/landing/ClaimPopup';

export const revalidate = 3600; // Cache ISR revalidation strategy (1 hour)

export default function LandingPage() {
  return (
    <main className="bg-navy-deep">
      <h1 className="sr-only">IBS 프랜차이즈 법률사무소 공식 홈페이지</h1>
      <ScrollProgress />

      <Suspense fallback={null}>
        <ClaimPopup />
      </Suspense>

      {/* ── 1. HERO — 플랫폼 규모감 ── */}
      <Suspense fallback={<div className="h-[600px] w-full bg-[#04091a] animate-pulse rounded-lg" />}>
        <HeroSection />
      </Suspense>

      <div className="gold-divider" />
      <InfraMapSection />
      
      <div className="gold-divider" />
      <UseCaseSection />
      
      <div className="gold-divider" />
      <FeatureShowcase />
      
      <div className="gold-divider" />
      <ServicesSection />
      
      <div className="gold-divider" />
      <FreeTierSection />
      
      <div className="gold-divider" />
      <PricingSection />
      
      <div className="gold-divider" />
      <TestimonialsSection />
      
      <div className="gold-divider" />
      <TrustBadgeSection />
      
      <div className="gold-divider" />
      <GuideDownloadSection />
      
      <div className="gold-divider" />
      <CtaSection />

      <div className="gold-divider" />
      <FaqSection />

      <div className="gold-divider" />
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
                {[Shield, BadgeCheck, Award].map((Icon, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center bg-gold-subtle border-gold-light">
                    <Icon className="w-4 h-4 text-gold" />
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
                { text: '02-598-8518' },
                { text: 'info@ibslaw.co.kr' },
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
              © 2026 IBS 법률사무소. All rights reserved. · 사업자등록번호 313-19-00140 · 대표변호사 유정훈
            </p>
            <div className="flex gap-4">
              <Link href="/legal/terms" className="text-xs hover:underline text-muted-45">이용약관</Link>
              <Link href="/terms/privacy" className="text-xs hover:underline text-muted-45">개인정보처리방침</Link>
              {/* <Link href="/legal" className="text-xs hover:underline text-muted-45">광고성 정보 수신 거부</Link> */}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
