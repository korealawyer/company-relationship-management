'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { BASE_SERVICES, fadeUp } from '@/lib/landingData';

export default function ServicesSection() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(13,27,62,0.3)' }}>
            <div className="max-w-6xl mx-auto">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-bold"
                        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}>
                        <CheckCircle2 className="w-4 h-4" /> 프리미엄 연간자문 — 기본 포함 서비스
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                        IBS 법률사무소가 <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>5가지를 기본 제공</span>합니다
                    </h2>
                    <p style={{ color: 'rgba(240,244,255,0.6)' }}>단순 법률자문이 아닌 — 본사·가맹점·임직원 전체를 커버하는 브랜드 리스크 운영 예산</p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {BASE_SERVICES.map((svc, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                            <Card padding="lg" className="h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${svc.color}18`, border: `1px solid ${svc.color}30` }}>
                                        <svc.icon className="w-5 h-5" style={{ color: svc.color }} />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm" style={{ color: '#f0f4ff' }}>{svc.title}</p>
                                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{svc.sub}</p>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(240,244,255,0.65)' }}>{svc.desc}</p>
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold"
                                    style={{ background: `${svc.color}15`, color: svc.color, border: `1px solid ${svc.color}30` }}>
                                    ✅ {svc.badge}
                                </span>
                            </Card>
                        </motion.div>
                    ))}

                    {/* 6번째 — 핵심 차별점 카드 */}
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.5 }}>
                        <Card padding="lg" gold className="h-full flex flex-col justify-between">
                            <div>
                                <p className="text-xs font-bold mb-2" style={{ color: 'rgba(201,168,76,0.7)' }}>핵심 차별점</p>
                                {['사건 처리 → 사고 예방 중심', '본사 + 가맹점 + 임직원 원스톱', '공식 법률파트너 표기 제공', '분기 리스크 브리핑으로 선제 대응'].map((pt, j) => (
                                    <div key={j} className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#c9a84c' }} />
                                        <span className="text-sm" style={{ color: 'rgba(240,244,255,0.8)' }}>{pt}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}>
                                <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>최소 계약: 1년 / 분기별 가맹점 수 기준 요금 리베이스</p>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
