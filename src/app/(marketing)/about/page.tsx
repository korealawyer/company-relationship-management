'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, Scale, Building2, Users, Award, Globe,
    BookOpen, CheckCircle2, ArrowRight, Star,
    TrendingUp, Briefcase, Clock, Phone,
} from 'lucide-react';
import Link from 'next/link';

/* ── 핵심 가치 ───────────────────────────────────────────── */
const CORE_VALUES = [
    {
        icon: Shield,
        title: '전문성',
        description: '프랜차이즈법, 개인정보보호법, 기업법무 분야에서 10년 이상의 전문 경험을 바탕으로 최고 수준의 법률 서비스를 제공합니다.',
        color: '#c9a84c',
    },
    {
        icon: TrendingUp,
        title: '기술 혁신',
        description: 'AI 기반 계약서 분석, 자동 법률 진단, 실시간 챗봇 등 최첨단 리걸테크 기술을 활용하여 법률 서비스의 새로운 기준을 제시합니다.',
        color: '#2563eb',
    },
    {
        icon: Users,
        title: '기업 동반 성장',
        description: '일회성 자문이 아닌 월간 구독 모델로 기업의 법률 파트너로서 함께 성장합니다. 가맹본부부터 스타트업까지 맞춤형 솔루션을 설계합니다.',
        color: '#059669',
    },
];

/* ── 전문 분야 ───────────────────────────────────────────── */
const PRACTICE_AREAS = [
    { icon: '🏪', title: '프랜차이즈법', desc: '가맹계약서 검토, 정보공개서 작성, 공정거래 자문', count: '500+건 자문' },
    { icon: '🔐', title: '개인정보보호법', desc: '처리방침 진단, GDPR 대응, 정보보호 컴플라이언스', count: '1,200+건 진단' },
    { icon: '⚖️', title: '기업법무', desc: '상법, 근로기준법, 취업규칙, 계약서 전반 검토', count: '800+건 검토' },
    { icon: '📋', title: '전자계약', desc: '전자서명 기반 계약 체결, 계약서 자동 생성 및 관리', count: '350+건 체결' },
];

/* ── 변호사 프로필 ────────────────────────────────────────── */
const LAWYERS = [
    { name: '김수현', title: '대표 변호사', specialty: '프랜차이즈법 · 기업법무', experience: '15년', education: '서울대 법학과, 사법연수원 35기', color: '#c9a84c' },
    { name: '이지원', title: '파트너 변호사', specialty: '개인정보보호법 · 데이터 규제', experience: '12년', education: '고려대 법학전문대학원, 정보보호 석사', color: '#2563eb' },
    { name: '박민재', title: '시니어 변호사', specialty: '상사 분쟁 · 계약법', experience: '10년', education: '연세대 법학전문대학원', color: '#7c3aed' },
    { name: '최은서', title: '변호사', specialty: '노동법 · 취업규칙', experience: '7년', education: '성균관대 법학전문대학원', color: '#059669' },
];

/* ── 연혁 ─────────────────────────────────────────────── */
const TIMELINE = [
    { year: '2016', event: '법률사무소 IBS 설립', detail: '프랜차이즈 전문 법률사무소로 출발' },
    { year: '2018', event: '기업법무 서비스 확대', detail: 'B2B 법률자문 구독 모델 도입' },
    { year: '2020', event: 'AI 리걸테크 개발 착수', detail: '자동 계약서 분석 시스템 프로토타입' },
    { year: '2022', event: '개인정보 진단 서비스 런칭', detail: 'AI 기반 처리방침 자동 진단 시스템' },
    { year: '2024', event: '기업 1,000+사 자문 달성', detail: '프랜차이즈 법률 시장 점유율 1위' },
    { year: '2026', event: '통합 리걸테크 플랫폼 오픈', detail: 'AI 챗봇, 전자계약, CRM 통합 시스템' },
];

/* ── 메인 페이지 ─────────────────────────────────────────── */
export default function AboutPage() {
    return (
        <div className="min-h-screen" style={{ background: '#04091a' }}>

            {/* 히어로 섹션 */}
            <section className="pt-28 pb-20 px-4 text-center relative overflow-hidden">
                {/* 배경 효과 */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl"
                        style={{ background: 'rgba(201,168,76,0.04)' }} />
                    <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full blur-3xl"
                        style={{ background: 'rgba(37,99,235,0.04)' }} />
                </div>

                <div className="relative max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}
                    >
                        <Scale className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-bold" style={{ color: '#c9a84c' }}>About IBS Law</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl font-black mb-4 leading-tight"
                        style={{ color: '#f0f4ff' }}
                    >
                        기업 법률의 미래를<br />
                        <span style={{ color: '#c9a84c' }}>기술로</span> 혁신합니다
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-base leading-relaxed mb-8"
                        style={{ color: 'rgba(240,244,255,0.5)' }}
                    >
                        법률사무소 IBS는 프랜차이즈·개인정보·기업법 분야의 전문성과<br />
                        AI 리걸테크 기술을 결합하여 기업에 최적화된 법률 서비스를 제공합니다.
                    </motion.p>

                    {/* 실적 카운터 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center gap-8"
                    >
                        {[
                            { value: '1,000+', label: '기업 클라이언트' },
                            { value: '10년+', label: '전문 경험' },
                            { value: '2,500+', label: '법률 자문 건수' },
                            { value: '99.2%', label: '고객 만족도' },
                        ].map(stat => (
                            <div key={stat.label} className="text-center">
                                <p className="text-2xl font-black" style={{ color: '#e8c87a' }}>{stat.value}</p>
                                <p className="text-[10px] font-bold mt-1" style={{ color: 'rgba(240,244,255,0.35)' }}>{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 핵심 가치 */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black mb-2" style={{ color: '#f0f4ff' }}>핵심 가치</h2>
                        <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>IBS가 추구하는 세 가지 핵심 가치</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        {CORE_VALUES.map((v, i) => {
                            const Icon = v.icon;
                            return (
                                <motion.div
                                    key={v.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="rounded-2xl p-6"
                                    style={{
                                        background: `linear-gradient(135deg, ${v.color}08, rgba(13,27,62,0.6))`,
                                        border: `1px solid ${v.color}25`,
                                    }}
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                        style={{ background: `${v.color}15` }}>
                                        <Icon className="w-6 h-6" style={{ color: v.color }} />
                                    </div>
                                    <h3 className="text-lg font-black mb-2" style={{ color: '#f0f4ff' }}>{v.title}</h3>
                                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.5)' }}>{v.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 전문 분야 */}
            <section className="py-16 px-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black mb-2" style={{ color: '#f0f4ff' }}>전문 분야</h2>
                        <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>10년 이상의 전문성을 갖춘 핵심 업무 영역</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {PRACTICE_AREAS.map((area, i) => (
                            <motion.div
                                key={area.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="rounded-2xl p-5 flex items-start gap-4"
                                style={{ background: 'rgba(13,27,62,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                                <span className="text-3xl">{area.icon}</span>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-black text-sm" style={{ color: '#f0f4ff' }}>{area.title}</h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c' }}>{area.count}</span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>{area.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 변호사 소개 */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black mb-2" style={{ color: '#f0f4ff' }}>전문 변호사 팀</h2>
                        <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>각 분야 최고 전문가들이 함께합니다</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {LAWYERS.map((lawyer, i) => (
                            <motion.div
                                key={lawyer.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="rounded-2xl p-5 text-center"
                                style={{ background: 'rgba(13,27,62,0.6)', border: `1px solid ${lawyer.color}25` }}
                            >
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                                    style={{ background: `${lawyer.color}15`, border: `2px solid ${lawyer.color}30` }}>
                                    <span className="text-2xl font-black" style={{ color: lawyer.color }}>{lawyer.name[0]}</span>
                                </div>
                                <h3 className="font-black text-sm mb-0.5" style={{ color: '#f0f4ff' }}>{lawyer.name}</h3>
                                <p className="text-[10px] font-bold mb-2" style={{ color: lawyer.color }}>{lawyer.title}</p>
                                <p className="text-[10px] mb-1" style={{ color: 'rgba(240,244,255,0.5)' }}>{lawyer.specialty}</p>
                                <p className="text-[10px]" style={{ color: 'rgba(240,244,255,0.3)' }}>경력 {lawyer.experience}</p>
                                <p className="text-[9px] mt-1" style={{ color: 'rgba(240,244,255,0.2)' }}>{lawyer.education}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 연혁 */}
            <section className="py-16 px-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black mb-2" style={{ color: '#f0f4ff' }}>연혁</h2>
                        <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>10년간의 성장 이야기</p>
                    </div>
                    <div className="relative">
                        {/* 타임라인 라인 */}
                        <div className="absolute left-6 top-0 bottom-0 w-px"
                            style={{ background: 'linear-gradient(to bottom, rgba(201,168,76,0.3), rgba(201,168,76,0.05))' }} />
                        <div className="space-y-6">
                            {TIMELINE.map((item, i) => (
                                <motion.div
                                    key={item.year}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="flex items-start gap-4 pl-2"
                                >
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10"
                                        style={{
                                            background: i === TIMELINE.length - 1 ? '#c9a84c' : 'rgba(201,168,76,0.15)',
                                            border: `2px solid ${i === TIMELINE.length - 1 ? '#c9a84c' : 'rgba(201,168,76,0.3)'}`,
                                        }}>
                                        <span className="text-[9px] font-black"
                                            style={{ color: i === TIMELINE.length - 1 ? '#04091a' : '#c9a84c' }}>
                                            {item.year.slice(2)}
                                        </span>
                                    </div>
                                    <div className="flex-1 rounded-xl p-4"
                                        style={{ background: 'rgba(13,27,62,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-black" style={{ color: '#c9a84c' }}>{item.year}</span>
                                            <h3 className="text-sm font-bold" style={{ color: '#f0f4ff' }}>{item.event}</h3>
                                        </div>
                                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{item.detail}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 text-center">
                <div className="max-w-xl mx-auto">
                    <h2 className="text-2xl font-black mb-3" style={{ color: '#f0f4ff' }}>
                        기업 법률의 새로운 기준을 경험하세요
                    </h2>
                    <p className="text-sm mb-8" style={{ color: 'rgba(240,244,255,0.4)' }}>
                        지금 무료 상담을 신청하시면 전담 변호사가 48시간 내 연락드립니다
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/consultation">
                            <button className="px-8 py-4 rounded-xl font-black text-base flex items-center justify-center gap-2"
                                style={{
                                    background: 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                    color: '#04091a',
                                    boxShadow: '0 6px 30px rgba(201,168,76,0.4)',
                                }}>
                                <Phone className="w-4 h-4" /> 무료 상담 신청
                            </button>
                        </Link>
                        <Link href="/pricing">
                            <button className="px-8 py-4 rounded-xl font-bold text-sm"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                요금제 보기 <ArrowRight className="w-4 h-4 inline ml-1" />
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}