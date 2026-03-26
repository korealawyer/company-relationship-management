'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Clock, ArrowRight, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fadeUp } from '@/lib/landingData';

export default function CtaSection() {
  const [showCopyToast, setShowCopyToast] = useState(false);

  return (
    <>
      <section id="cta" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold pill-gold pill-gold-text">
              <Clock className="w-4 h-4" /> 지금 바로 시작하세요
            </div>
            <h2 className="text-3xl sm:text-5xl font-black mb-6 text-light">
              이 인프라를 쓰지 않는 것이<br />
              <span className="text-danger-gradient">오히려 손해입니다</span>
            </h2>
            <p className="text-lg mb-12 max-w-2xl mx-auto text-muted-70">
              1,200+ 기업이 이미 선택한 통합 법무 인프라.<br />
              지금 무료 체험을 시작하고, 귀사의 법률·경영 리스크를 완전히 통제하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:025988518" onClick={(e) => {
                if (window.innerWidth >= 768) {
                  e.preventDefault();
                  navigator.clipboard.writeText('02-598-8518');
                  setShowCopyToast(true);
                  setTimeout(() => setShowCopyToast(false), 3000);
                }
              }}>
                <Button variant="ghost" size="xl" className="gap-3 w-full sm:w-auto">
                  <Phone className="w-6 h-6" /> 02-598-8518 지금 전화
                </Button>
              </a>
              <Link href="/signup">
                <Button variant="premium" size="xl" className="gap-3 w-full sm:w-auto">
                  <Lock className="w-6 h-6" /> 무료 체험 시작하기 <ArrowRight className="w-6 h-6" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Custom Toast Notification for Desktop Phone Click */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl"
            style={{ background: 'rgba(20, 24, 32, 0.95)', border: '1px solid rgba(201,168,76,0.3)', backdropFilter: 'blur(10px)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(201,168,76,0.2)' }}>
              <BadgeCheck className="w-5 h-5 text-gold-light" style={{ color: '#e8c87a' }} />
            </div>
            <div>
              <div className="text-white font-semibold text-sm mb-0.5">전화번호가 클립보드에 복사되었습니다</div>
              <div className="text-xs" style={{ color: 'rgba(240,244,255,0.6)' }}>02-598-8518 (평일 09:00~18:00)</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
