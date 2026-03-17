'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { RISK_SCENARIOS, fadeUp } from '@/lib/landingData';

export default function RiskSection() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                        방치하면 어떻게 될까요?
                    </h2>
                    <p style={{ color: 'rgba(240,244,255,0.6)' }}>실제 발생한 프랜차이즈 법적 분쟁 사례를 기반으로 한 리스크 시나리오</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {RISK_SCENARIOS.map((scenario, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }}>
                            <Card padding="lg" className="h-full">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                                    style={{ background: `${scenario.color}20` }}>
                                    <scenario.icon className="w-6 h-6" style={{ color: scenario.color }} />
                                </div>
                                <div className="inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-3"
                                    style={{ background: `${scenario.color}20`, color: scenario.color, border: `1px solid ${scenario.color}50` }}>
                                    {scenario.badge}
                                </div>
                                <h3 className="font-black text-lg mb-3" style={{ color: '#f0f4ff' }}>{scenario.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.65)' }}>{scenario.desc}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
