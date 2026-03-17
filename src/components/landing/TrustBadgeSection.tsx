'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Shield, Award, Users, CheckCircle2, Star, Lock, Building2,
    Briefcase, GraduationCap,
} from 'lucide-react';
import { fadeUp } from '@/lib/landingData';

const TRUST_STATS = [
    { icon: Briefcase, value: '15명', label: '전문 변호사 상주', color: '#c9a84c' },
    { icon: Shield, value: 'ISMS', label: '정보보호 인증', color: '#60a5fa' },
    { icon: Award, value: '2회', label: '법무 혁신 수상', color: '#a78bfa' },
    { icon: Users, value: '99.2%', label: '고객 유지율', color: '#4ade80' },
    { icon: Star, value: '4.8/5.0', label: '평균 만족도', color: '#f59e0b' },
    { icon: GraduationCap, value: '12년', label: '업력', color: '#f87171' },
];

const CLIENT_LOGOS = [
    '삼성웰스토리', 'CJ푸드빌', '교촌치킨', 'BBQ', '굽네치킨',
    '놀부NBG', '본죽', '이디야커피', '파리바게뜨', '배스킨라빈스',
    '할리스', '투썸플레이스', '메가커피', '설빙', '뚜레쥬르',
];

const CERTIFICATIONS = [
    { icon: CheckCircle2, label: '대한변호사협회 등록', color: '#4ade80' },
    { icon: CheckCircle2, label: '개인정보보호위원회 자문사', color: '#4ade80' },
    { icon: CheckCircle2, label: '공정거래위원회 등록 법률사무소', color: '#4ade80' },
    { icon: Lock, label: 'AES-256 암호화 · AWS 서울 리전', color: '#60a5fa' },
    { icon: Shield, label: 'ISMS 인증 데이터센터', color: '#60a5fa' },
    { icon: Award, label: '2024/2025 법무 혁신 서비스 대상', color: '#c9a84c' },
];

export default function TrustBadgeSection() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(13,27,62,0.3)' }}>
            <div className="max-w-6xl mx-auto">
                {/* 헤더 */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm font-bold"
                        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}>
                        <Shield className="w-4 h-4" /> 검증된 플랫폼
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                        <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            12년간 검증된
                        </span>
                        {' '}신뢰와 전문성
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(240,244,255,0.55)' }}>
                        대한민국 최고 수준의 법률 인프라가 귀사의 성장을 보호합니다
                    </p>
                </motion.div>

                {/* 핵심 수치 */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-14">
                    {TRUST_STATS.map((stat, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                            className="text-center p-5 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <stat.icon className="w-6 h-6 mx-auto mb-2" style={{ color: stat.color }} />
                            <div className="text-xl font-black mb-0.5" style={{ color: stat.color }}>{stat.value}</div>
                            <div className="text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* 고객사 로고 */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    className="mb-14">
                    <p className="text-center text-xs font-bold mb-6" style={{ color: 'rgba(240,244,255,0.25)' }}>
                        IBS를 신뢰하는 주요 기업 고객사
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {CLIENT_LOGOS.map((name, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                                className="px-4 py-2.5 rounded-xl flex items-center gap-2"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <Building2 className="w-3.5 h-3.5" style={{ color: 'rgba(201,168,76,0.5)' }} />
                                <span className="text-sm font-bold" style={{ color: 'rgba(240,244,255,0.4)' }}>{name}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* 인증 그리드 */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CERTIFICATIONS.map((cert, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <cert.icon className="w-5 h-5 flex-shrink-0" style={{ color: cert.color }} />
                            <span className="text-sm" style={{ color: 'rgba(240,244,255,0.65)' }}>{cert.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
