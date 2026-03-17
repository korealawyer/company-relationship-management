'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FEATURES, FEATURE_CATEGORIES, type Feature } from '@/lib/featureFlags';
import { PaintedDoorModal } from '@/components/common/PaintedDoor';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
    const [showModal, setShowModal] = useState(false);
    const isPaintedDoor = feature.status === 'paintedDoor';

    const content = (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="relative p-4 rounded-2xl transition-all group cursor-pointer"
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
            whileHover={{ scale: 1.02, borderColor: 'rgba(74,222,128,0.3)' }}
            onClick={isPaintedDoor ? () => setShowModal(true) : undefined}
        >
            <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{feature.icon}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm truncate" style={{ color: '#f0f4ff' }}>{feature.title}</h3>
                        {/* 모든 기능이 사용 가능으로 표시 — Painted Door 전략 */}
                        <span className="flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
                            ✅ 사용 가능
                        </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.5)' }}>
                        {feature.description}
                    </p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#4ade80' }} />
            </div>
        </motion.div>
    );

    // Painted Door: 클릭 시 모달, Live: 실제 페이지 이동
    if (isPaintedDoor) {
        return (
            <>
                {content}
                <PaintedDoorModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    featureName={feature.title}
                    featureDescription={`${feature.title} 기능을 사용하시려면 회원 가입이 필요합니다. 가입 즉시 모든 기능을 이용하실 수 있습니다.`}
                />
            </>
        );
    }

    if (feature.href) {
        return <Link href={feature.href}>{content}</Link>;
    }
    return content;
}

export default function FeatureShowcase() {
    const totalCount = FEATURES.filter(f => f.status !== 'hidden').length;

    return (
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* 헤더 */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
                        style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                        <Sparkles className="w-4 h-4" style={{ color: '#4ade80' }} />
                        <span className="text-sm font-bold" style={{ color: '#4ade80' }}>
                            {totalCount}개 기능 지금 바로 사용 가능
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: '#f0f4ff' }}>
                        하나의 플랫폼으로{' '}
                        <span style={{
                            background: 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                        }}>전체 법무</span>를 관리하세요
                    </h2>
                    <p className="text-base max-w-2xl mx-auto" style={{ color: 'rgba(240,244,255,0.5)' }}>
                        법률 자문부터 계약·소송·EAP·경영 자문까지. 가입 즉시 모든 기능을 사용할 수 있습니다.
                    </p>
                </motion.div>

                {/* 카테고리별 기능 그리드 */}
                <div className="space-y-10">
                    {FEATURE_CATEGORIES.map(category => {
                        const features = FEATURES.filter(f => f.category === category && f.status !== 'hidden');
                        if (features.length === 0) return null;
                        return (
                            <div key={category}>
                                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                                    <h3 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: '#f0f4ff' }}>
                                        <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)' }} />
                                        {category}
                                    </h3>
                                </motion.div>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {features.map((feature, i) => (
                                        <FeatureCard key={feature.id} feature={feature} index={i} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 하단 CTA — "모든 기능이 이미 있음" 톤 */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                    className="mt-12 text-center">
                    <div className="p-6 rounded-2xl inline-block"
                        style={{
                            background: 'linear-gradient(135deg, rgba(74,222,128,0.06), rgba(74,222,128,0.02))',
                            border: '1px solid rgba(74,222,128,0.15)',
                        }}>
                        <p className="font-bold text-sm mb-3" style={{ color: '#f0f4ff' }}>
                            ✅ <span style={{ color: '#4ade80' }}>{totalCount}개 전체 기능</span>을 지금 바로 사용할 수 있습니다
                        </p>
                        <Link href="/signup">
                            <button className="px-8 py-3 rounded-xl font-black text-sm transition-all hover:scale-105"
                                style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                                무료 체험 시작하기 →
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
