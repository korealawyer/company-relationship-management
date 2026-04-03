'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldAlert, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ClaimPopup() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const claimId = searchParams.get('claim');
    
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (claimId) {
            // 약간의 딜레이 후 팝업 애니메이션 효과
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [claimId]);

    if (!claimId) return null;

    const handleLoginRedirect = () => {
        setIsVisible(false);
        // 이동 시 url 파라미터 유지
        router.push(`/login?claim=${claimId}&from=/privacy-report`);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-6 right-6 z-[100] w-[340px] shadow-2xl rounded-2xl overflow-hidden"
                    style={{ 
                        background: 'rgba(13,27,62,0.95)', 
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(201,168,76,0.3)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}
                >
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 transition-colors z-10"
                        style={{ color: 'rgba(240,244,255,0.4)' }}
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="p-6">
                        <div className="flex justify-center mb-4 relative">
                            <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full" />
                            <div className="w-12 h-12 flex items-center justify-center rounded-xl relative z-10"
                                style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.1))', border: '1px solid rgba(201,168,76,0.4)' }}>
                                <ShieldAlert className="w-6 h-6 text-gold" style={{ color: '#e8c87a' }} />
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-center mb-2 leading-snug" style={{ color: '#f0f4ff', wordBreak: 'keep-all' }}>
                            🚨 우리 회사의 개인정보보호,<br/> 정말 안전할까요?
                        </h3>
                        <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: 'rgba(240,244,255,0.6)', wordBreak: 'keep-all' }}>
                            사소한 법률 위반도 막대한 과징금으로<br/>이어질 수 있습니다.
                            <span className="block mt-2.5">귀사 홈페이지의 취약점을 분석한<br/>프라이버시 리포트를 발급했습니다.</span>
                            <span className="block mt-2.5 font-medium" style={{ color: '#e2e8f0' }}>로그인 후 상세 진단 결과를 즉시 점검하세요.</span>
                        </p>

                        <Button 
                            variant="premium" 
                            className="w-full font-bold shadow-[0_4px_14px_0_rgba(201,168,76,0.39)]"
                            onClick={handleLoginRedirect}
                        >
                            리스크 진단 결과 보기 <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
