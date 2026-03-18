'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';
import { fadeUp } from '@/lib/landingData';

interface UseCase {
    company: string;
    industry: string;
    stores: string;
    problem: string;
    result: string;
    savings: string;
    beforeCost: string;
    afterCost: string;
    period: string;
    quote: string;
}

const INDUSTRIES = [
    {
        id: 'franchise',
        label: '프랜차이즈',
        emoji: '🍕',
        color: '#c9a84c',
        cases: [
            {
                company: '외식 프랜차이즈 A사',
                industry: '외식',
                stores: '280개점',
                problem: '가맹계약 분쟁 3건 + 개인정보 과태료 위기',
                result: '분쟁 사전 차단, 과태료 0원 달성',
                savings: '연간 법무비용 47% 절감',
                beforeCost: '월 850만원',
                afterCost: '월 99만원',
                period: '2025년 1월 도입',
                quote: '"외부 로펌 3곳에 나눠 쓰던 걸 하나로 통합하니 비용도 줄고, 대응 속도도 3배 빨라졌습니다."',
            },
            {
                company: '미용 프랜차이즈 B사',
                industry: '뷰티',
                stores: '150개점',
                problem: '가맹점주 12명 집단 소송 위기',
                result: '전원 합의 완료, 본사 리스크 차단',
                savings: '소송비용 1.2억 절감',
                beforeCost: '소송 예상비 2억원',
                afterCost: '합의 비용 8,000만원',
                period: '2024년 10월 완료',
                quote: '"집단 소송이 터질 뻔했는데, IBS 전담팀이 48시간 만에 초기 대응해서 합의로 마무리했습니다."',
            },
        ] as UseCase[],
    },
    {
        id: 'it',
        label: 'IT·스타트업',
        emoji: '💻',
        color: '#60a5fa',
        cases: [
            {
                company: 'SaaS 스타트업 C사',
                industry: 'B2B SaaS',
                stores: '임직원 85명',
                problem: '시리즈B 투자 과정에서 법률 실사 미비',
                result: '100억원 투자 유치 성공',
                savings: '법률실사 비용 60% 절감',
                beforeCost: '외부 로펌 실사 5,000만원',
                afterCost: '구독 내 실사 지원 포함',
                period: '2025년 3월 완료',
                quote: '"투자자 실사에 필요한 법률 서류를 IBS 대시보드에서 바로 다운받아 제출했습니다. 기존 로펌 대비 3주 단축."',
            },
            {
                company: 'AI 플랫폼 D사',
                industry: '인공지능',
                stores: '임직원 120명',
                problem: 'AI 규제 대응 + 개인정보 글로벌 컴플라이언스',
                result: 'GDPR·개보법 동시 대응 완료',
                savings: '컴플라이언스 구축비 70% 절감',
                beforeCost: '외부 컨설팅 연 1.5억원',
                afterCost: '월 구독 199만원',
                period: '2025년 1월 도입',
                quote: '"규제가 빠르게 변하는데, IBS 월간 브리핑으로 항상 최신 상태를 유지하고 있습니다."',
            },
        ] as UseCase[],
    },
    {
        id: 'manufacturing',
        label: '제조업',
        emoji: '🏭',
        color: '#4ade80',
        cases: [
            {
                company: '식품 제조 E사',
                industry: '식품',
                stores: '공장 3개',
                problem: '노동법 위반 근로감독 + 개인정보 유출 사고',
                result: '근로감독 정상 통과, 유출 대응 완료',
                savings: '과태료 + 소송 예방 2.3억원',
                beforeCost: '예상 과태료 3억원',
                afterCost: '시정조치로 0원',
                period: '2024년 12월 완료',
                quote: '"근로감독 48시간 전 긴급 컨설팅 받아서 무사히 통과했습니다. 이 서비스 없었으면 큰일 날 뻔했어요."',
            },
        ] as UseCase[],
    },
    {
        id: 'retail',
        label: '유통·리테일',
        emoji: '🏬',
        color: '#a78bfa',
        cases: [
            {
                company: '온라인 쇼핑몰 F사',
                industry: '이커머스',
                stores: '월 거래 50억',
                problem: '소비자 분쟁 급증 + 전자상거래법 미준수',
                result: '분쟁 건수 72% 감소, 법규 완전 준수',
                savings: '분쟁 처리비용 연 4,800만원 절감',
                beforeCost: '월 600만원 (분쟁 처리)',
                afterCost: '월 99만원 (구독 포함)',
                period: '2025년 2월 도입',
                quote: '"소비자 불만이 소송으로 가기 전에 미리 잡아줍니다. 고객 만족도도 올라갔어요."',
            },
        ] as UseCase[],
    },
];

export default function UseCaseSection() {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* 헤더 */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm font-bold"
                        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}>
                        <Building2 className="w-4 h-4" /> 업종별 실제 성과
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                        <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            1,200+ 기업
                        </span>
                        이 IBS를 선택한 이유
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(240,244,255,0.55)' }}>
                        귀사와 같은 업종의 실제 도입 사례를 확인하세요
                    </p>
                </motion.div>

                {/* 업종 탭 */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {INDUSTRIES.map((ind, i) => (
                        <button key={ind.id} onClick={() => setActiveTab(i)}
                            className="px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                            style={{
                                background: activeTab === i ? `${ind.color}15` : 'rgba(255,255,255,0.03)',
                                color: activeTab === i ? ind.color : 'rgba(240,244,255,0.4)',
                                border: `1px solid ${activeTab === i ? `${ind.color}40` : 'rgba(255,255,255,0.06)'}`,
                            }}>
                            <span>{ind.emoji}</span> {ind.label}
                        </button>
                    ))}
                </div>

                {/* 케이스 카드 */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="grid md:grid-cols-2 gap-6">
                        {INDUSTRIES[activeTab].cases.map((c, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15 }}
                                className="rounded-2xl overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                {/* 상단 */}
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-2xl">{INDUSTRIES[activeTab].emoji}</span>
                                        <div>
                                            <h3 className="font-black text-base" style={{ color: '#f0f4ff' }}>{c.company}</h3>
                                            <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{c.industry} · {c.stores}</p>
                                        </div>
                                        <span className="ml-auto text-xs px-2.5 py-1 rounded-full font-bold"
                                            style={{ background: `${INDUSTRIES[activeTab].color}12`, color: INDUSTRIES[activeTab].color }}>{c.period}</span>
                                    </div>

                                    <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                                        <p className="text-xs font-bold mb-1" style={{ color: '#f87171' }}>도입 전 문제</p>
                                        <p className="text-sm" style={{ color: 'rgba(240,244,255,0.7)' }}>{c.problem}</p>
                                    </div>

                                    <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
                                        <p className="text-xs font-bold mb-1" style={{ color: '#4ade80' }}>도입 후 결과</p>
                                        <p className="text-sm" style={{ color: 'rgba(240,244,255,0.7)' }}>{c.result}</p>
                                    </div>
                                </div>

                                {/* 비용 비교 */}
                                <div className="px-6 pb-4">
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(248,113,113,0.05)' }}>
                                            <p className="text-[10px] mb-1" style={{ color: 'rgba(240,244,255,0.35)' }}>도입 전</p>
                                            <p className="font-black text-sm" style={{ color: '#f87171' }}>{c.beforeCost}</p>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <TrendingDown className="w-5 h-5" style={{ color: '#4ade80' }} />
                                        </div>
                                        <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(74,222,128,0.05)' }}>
                                            <p className="text-[10px] mb-1" style={{ color: 'rgba(240,244,255,0.35)' }}>도입 후</p>
                                            <p className="font-black text-sm" style={{ color: '#4ade80' }}>{c.afterCost}</p>
                                        </div>
                                    </div>
                                    <div className="text-center mb-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
                                            style={{ background: `${INDUSTRIES[activeTab].color}12`, color: INDUSTRIES[activeTab].color }}>
                                            💰 {c.savings}
                                        </span>
                                    </div>
                                </div>

                                {/* 후기 */}
                                <div className="px-6 pb-6">
                                    <div className="p-4 rounded-xl" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)' }}>
                                        <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(240,244,255,0.65)' }}>{c.quote}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* 하단 CTA */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    className="mt-14 text-center">
                    <Link href="/login">
                        <button className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-base"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#04091a' }}>
                            우리 업종에 맞는 상담 받기 <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
