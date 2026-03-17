'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Building2, Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { TESTIMONIALS, fadeUp } from '@/lib/landingData';

const CASE_STUDIES = [
    {
        emoji: '🎉',
        highlight: '1,000억원 엑시트',
        company: '투자유치 중 M&A',
        desc: '자문 12년차 직영 스토리지 프랜차이즈 본부. 우리의 프랜차이즈 계약 서류 정비 후 투자자 신뢰도 확보 성공, 1,000억원 M&A 엑시트 달성.',
        badge: '2024년 10월 완료',
        color: '#c9a84c',
    },
    {
        emoji: '📊',
        highlight: '과태료 0원',
        company: '외식 프랜차이즈 280개점',
        desc: '개인정보보호위원회 현장 점검에서 위반사항 적발 당해 과태료 2,400만원 위기. IBS 조속 수임 후 행정소송 고충 성공, 교정조치 마무리.',
        badge: '과태료 감면 확정',
        color: '#4ade80',
    },
    {
        emoji: '⚖️',
        highlight: '분쟁 전담 속결',
        company: '미용 프랜차이즈 150개점',
        desc: '가맹점주 12명 집단 소송 위기. 개인정보 보호 의무 위반 주장 증거 무효화 성공, 본사 리스크를 차단하며 1년 이내 전원 합의 완료.',
        badge: '분쟁 해결',
        color: '#60a5fa',
    },
];

const MEDIA_NAMES = ['조선일보', '한국경제신문', 'SBS Biz', '연합뉴스TV', '로이터즈', '공정거래위원회 자료집'];

export default function TestimonialsSection() {
    return (
        <>
            {/* ── 후기 ── */}
            <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(13,27,62,0.3)' }}>
                <div className="max-w-6xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-2 text-light">이미 300개 본사가 선택했습니다</h2>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                                <Card padding="lg" className="h-full">
                                    <div className="flex gap-0.5 mb-4">
                                        {Array.from({ length: t.rating }).map((_, s) => (
                                            <Star key={s} className="w-4 h-4 fill-[#c9a84c] text-gold" />
                                        ))}
                                    </div>
                                    <p className="text-sm leading-relaxed mb-4 text-muted-80">{t.quote}</p>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-gold-80" />
                                        <span className="text-xs font-medium text-muted-50">{t.company}</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="gold-divider" />

            {/* ── 미디어 노출 ── */}
            <section className="py-12 px-4" style={{ background: 'rgba(13,27,62,0.5)' }}>
                <div className="max-w-5xl mx-auto">
                    <p className="text-center text-xs font-bold mb-6 text-muted-25">언론 및 미디어 보도</p>
                    <div className="flex flex-wrap items-center justify-center gap-8">
                        {MEDIA_NAMES.map((m, i) => (
                            <div key={i} className="px-4 py-2 rounded-lg bg-glass-3 border-glass">
                                <span className="text-sm font-bold text-muted-35">{m}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="gold-divider" />

            {/* ── 케이스 스터디 ── */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-bold pill-gold">
                            <Award className="w-4 h-4" /> 실제 성과 사례
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black mb-3 text-light">
                            IBS가 자문한 기업들의 <span className="text-gold-gradient">실제 성과</span>
                        </h2>
                        <p className="text-muted-50">법률 자문이 사업 성과로 직결되는 순간</p>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {CASE_STUDIES.map((c, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}>
                                <Card padding="lg" className="h-full">
                                    <div className="text-3xl mb-3">{c.emoji}</div>
                                    <p className="font-black text-xl mb-1" style={{ color: c.color }}>{c.highlight}</p>
                                    <p className="text-xs font-semibold mb-3 text-muted-40">{c.company}</p>
                                    <p className="text-sm leading-relaxed mb-4 text-muted-65">{c.desc}</p>
                                    <span className="inline-block text-xs px-2.5 py-1 rounded-full font-bold"
                                        style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30` }}>{c.badge}</span>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
