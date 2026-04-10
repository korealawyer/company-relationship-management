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
        router.push(`/login?claim=${claimId}&from=/privacy-analysis`);
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

                    <div className="p-7 flex flex-col items-center">
                        
                        {/* Red Pulse Indicator */}
                        <div className="inline-flex items-center justify-center space-x-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="text-[11px] font-bold text-red-400 tracking-wide">긴급 진단 알림</span>
                        </div>

                        {/* Heading Text */}
                        <h3 className="text-lg font-extrabold text-white text-center leading-snug mb-3 tracking-tight word-break-keep">
                            귀사 홈페이지의 <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e8c87a] to-[#c9a84c]">
                                프라이버시 리포트
                            </span> 발급 완료
                        </h3>

                        {/* Description Text */}
                        <p className="text-[13px] text-center mb-6 leading-relaxed" style={{ color: 'rgba(240,244,255,0.7)', wordBreak: 'keep-all' }}>
                            사소한 법률 위반도 막대한 과징금으로 이어질 수 있습니다.<br/>
                            <span className="block mt-2 font-semibold" style={{ color: '#e8c87a' }}>로그인 후 상세 진단 결과를 즉시 점검하세요.</span>
                        </p>

                        <Button 
                            variant="premium" 
                            className="w-full font-bold shadow-[0_8px_24px_-8px_rgba(201,168,76,0.6)] group relative overflow-hidden"
                            onClick={handleLoginRedirect}
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                리스크 진단 결과 보기 
                                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                            </span>
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
