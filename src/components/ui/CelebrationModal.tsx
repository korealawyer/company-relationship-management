'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

export function CelebrationModal({
  isOpen,
  onClose,
  title = "모든 준비가 완료되었습니다.",
  description = "성공적인 비즈니스를 위한 최상위 법률 파트너십, 지금부터 IBS가 고객님의 곁에서 완벽하게 보호하겠습니다.",
  buttonText = "포털 시작하기"
}: CelebrationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at center, rgba(4,9,26,0.85) 0%, rgba(4,9,26,0.95) 100%)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.5 }}
            className="relative z-10 max-w-md w-full mx-4 rounded-3xl p-8 text-center overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(23,31,56,0.9) 0%, rgba(10,14,31,0.9) 100%)',
              boxShadow: '0 25px 50px -12px rgba(201,168,76,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
              border: '1px solid rgba(201,168,76,0.2)'
            }}
          >
            {/* Glow Effect behind Title */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[150px] rounded-full blur-[60px] pointer-events-none"
              style={{ background: 'rgba(201, 168, 76, 0.15)' }}
            />

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4 relative z-10"
                style={{
                  background: 'linear-gradient(135deg, #fcecae 0%, #c9a84c 50%, #e8c87a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 2px 10px rgba(201,168,76,0.4))'
                }}>
                {title}
              </h2>

              <p className="text-base mb-8 relative z-10 leading-relaxed font-light"
                style={{ color: 'rgba(240, 244, 255, 0.8)' }}>
                {description}
              </p>

              <button
                onClick={onClose}
                className="relative group w-full py-4 px-6 rounded-2xl font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #c9a84c, #e8c87a)',
                  color: '#0a0e1a',
                  boxShadow: '0 10px 30px -10px rgba(201, 168, 76, 0.5)'
                }}
              >
                {/* Text Content */}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {buttonText}
                </span>

                {/* Shimmer Effect */}
                <div 
                  className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  }}
                />
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
