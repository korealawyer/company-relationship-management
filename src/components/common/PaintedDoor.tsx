'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, X, Sparkles, Shield, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// ── Painted Door 모달 ─────────────────────────────────────────
// 미개발 기능 클릭 시 표시 — "이미 있는 것처럼" 보이게 한 뒤
// 실제 액션 시도 시 가입/로그인 유도

interface PaintedDoorModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription?: string;
  featureIcon?: React.ReactNode;
}

export function PaintedDoorModal({ isOpen, onClose, featureName, featureDescription, featureIcon }: PaintedDoorModalProps) {
  const { isAuthenticated } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{ background: 'rgba(4,9,26,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md mx-4"
          >
            <div className="rounded-3xl overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #0d1b3e, #111d42)', border: '1px solid rgba(201,168,76,0.2)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>

              {/* Close button */}
              <button onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
                style={{ color: 'rgba(240,244,255,0.4)' }}>
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="p-8 text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  {featureIcon || <Sparkles className="w-8 h-8" style={{ color: '#c9a84c' }} />}
                </div>

                {/* Title */}
                <h3 className="text-xl font-black mb-2" style={{ color: '#f0f4ff' }}>
                  {featureName}
                </h3>

                {/* Description */}
                <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(240,244,255,0.5)' }}>
                  {featureDescription || `${featureName} 기능을 사용하려면 ${isAuthenticated ? '프리미엄 플랜으로 업그레이드' : '회원 가입'}이 필요합니다.`}
                </p>

                {/* CTA Buttons */}
                {isAuthenticated ? (
                  <>
                    {/* Logged in — Upgrade CTA */}
                    <a href="/pricing"
                      className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black text-base mb-3"
                      style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                      <CreditCard className="w-5 h-5" />
                      플랜 업그레이드
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <a href="tel:02-1234-5678"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Shield className="w-4 h-4" />
                      전담 담당자에게 문의
                    </a>
                  </>
                ) : (
                  <>
                    {/* Not logged in — Sign up CTA */}
                    <a href="/signup"
                      className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black text-base mb-3"
                      style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                      <Lock className="w-5 h-5" />
                      무료 회원가입 후 바로 이용
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <a href="/login"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      이미 계정이 있으신가요? 로그인
                    </a>
                  </>
                )}

                {/* Trust badge */}
                <p className="text-xs mt-5" style={{ color: 'rgba(240,244,255,0.3)' }}>
                  ⚖️ IBS 법률사무소 · 기업 법인 전문 · 1,000여 기업 이용 중
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Painted Door 트리거 훅 ─────────────────────────────────────
export function usePaintedDoor(featureName: string, featureDescription?: string) {
  const [isOpen, setIsOpen] = useState(false);

  const trigger = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const Modal = () => (
    <PaintedDoorModal
      isOpen={isOpen}
      onClose={close}
      featureName={featureName}
      featureDescription={featureDescription}
    />
  );

  return { trigger, close, Modal, isOpen };
}

// ── Feature Gate 래퍼 컴포넌트 ─────────────────────────────────
// 기능이 활성화되면 children 렌더링, 아니면 클릭 시 Painted Door 모달
interface FeatureGateProps {
  featureKey: string;
  isEnabled: boolean;
  featureName: string;
  featureDescription?: string;
  featureIcon?: React.ReactNode;
  children: React.ReactNode;
  fallback?: React.ReactNode;  // 비활성 시 대신 보여줄 데모 UI
}

export function FeatureGate({ featureKey, isEnabled, featureName, featureDescription, featureIcon, children, fallback }: FeatureGateProps) {
  const [showModal, setShowModal] = useState(false);

  if (isEnabled) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="cursor-pointer"
        data-feature={featureKey}
      >
        {fallback || children}
      </div>
      <PaintedDoorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureName={featureName}
        featureDescription={featureDescription}
        featureIcon={featureIcon}
      />
    </>
  );
}
