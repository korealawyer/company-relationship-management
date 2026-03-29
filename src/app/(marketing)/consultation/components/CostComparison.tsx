import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CostComparison({ selectedCount }: { selectedCount: number }) {
    const singleCost = selectedCount * 150000; // 평균 단가
    const subCost = 330000;
    const saving = singleCost - subCost;
    const shouldSub = saving > 0;

    return (
        <motion.div layout
            className="mt-6 p-6 rounded-3xl relative overflow-hidden backdrop-blur-xl"
            style={{
                background: shouldSub ? 'linear-gradient(145deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.02) 100%)' : 'rgba(255,255,255,0.02)',
                border: shouldSub ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: shouldSub ? '0 10px 40px -10px rgba(201,168,76,0.15)' : 'none'
            }}>
            {shouldSub && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c] rounded-full blur-[80px] opacity-20 transform translate-x-1/2 -translate-y-1/2" />
            )}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex-1 text-center md:text-left">
                    <p className="text-sm font-medium tracking-wide text-blue-200/50 mb-1">단건 합계 (월 {selectedCount}건 기준)</p>
                    <p className="font-extrabold text-3xl text-white tracking-tight">
                        ₩{singleCost.toLocaleString()}
                    </p>
                </div>
                
                <div className="flex flex-col items-center px-6">
                    <div className="w-px h-8 bg-white/10 hidden md:block mb-2" />
                    <span className="text-xs font-bold text-white/30 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">vs</span>
                    <div className="w-px h-8 bg-white/10 hidden md:block mt-2" />
                </div>
                
                <div className="flex-1 text-center md:text-right">
                    <p className="text-sm font-medium tracking-wide text-[#c9a84c]/60 mb-1">구독 Entry (월 무제한 혜택)</p>
                    <p className="font-extrabold text-3xl text-[#c9a84c] tracking-tight">
                        ₩{subCost.toLocaleString()}
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {shouldSub && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#c9a84c]/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <ArrowRight className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-green-400/80 uppercase tracking-wider mb-0.5">추천 옵션</p>
                                <p className="text-base font-bold text-white">
                                    구독으로 월 <span className="text-green-400">₩{saving.toLocaleString()}</span> 절감 가능!
                                </p>
                            </div>
                        </div>
                        <Link href="/pricing">
                            <button className="whitespace-nowrap w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#c9a84c] to-[#e8c87a] text-black shadow-lg shadow-[#c9a84c]/20 hover:scale-105 transition-all">
                                구독 플랜 알아보기 →
                            </button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
            {!shouldSub && selectedCount === 1 && (
                <p className="text-xs text-center md:text-left mt-4 text-white/30 font-medium">
                    월 7건 이상 이용 시 구독 멤버십이 더 저렴합니다.
                </p>
            )}
        </motion.div>
    );
}
