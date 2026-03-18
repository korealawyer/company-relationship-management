'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, FileSearch, Shield, BarChart3, ClipboardCheck,
    Brain, Heart, Headphones, TrendingUp, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { fadeUp } from '@/lib/landingData';

const INFRA_ITEMS = [
    {
        category: '법률 인프라',
        color: '#60a5fa',
        items: [
            {
                icon: Brain,
                title: '전문 법률 자문',
                desc: '24시간 즉시 법률 질문 답변. 전문 변호사가 판례·법령을 검색하여 정확한 자문을 제공합니다.',
                badge: '24/7 즉시 답변',
            },
            {
                icon: FileSearch,
                title: '계약서 전문 검토',
                desc: '가맹계약, 근로계약, 임대차계약 등 모든 계약서를 변호사가 즉시 검토. 독소조항·누락조항을 탐지합니다.',
                badge: '신속 검토 완료',
            },
            {
                icon: Scale,
                title: '소송·분쟁 관리',
                desc: '진행 중인 소송 현황, 변호사 배정, 기일 관리까지. 전담 변호사가 실시간으로 사건을 추적합니다.',
                badge: '전담 변호사 배정',
            },
        ],
    },
    {
        category: '경영 인프라',
        color: '#c9a84c',
        items: [
            {
                icon: Shield,
                title: '개인정보 컴플라이언스',
                desc: '개인정보처리방침 자동 진단, 위반 항목 실시간 모니터링, 수정 권고안 즉시 생성. 과태료 리스크를 사전 차단합니다.',
                badge: '과태료 리스크 0%',
            },
            {
                icon: ClipboardCheck,
                title: '가맹·노무 자문',
                desc: '가맹거래법, 노동법, 공정거래법 전문 자문. 가맹점 분쟁, 근로관계 이슈를 선제적으로 관리합니다.',
                badge: '분쟁 사전 차단',
            },
            {
                icon: BarChart3,
                title: '경영 대시보드',
                desc: '법무 비용 분석, 리스크 히트맵, 월간 법무 리포트까지. 경영진이 한눈에 파악하는 법무 현황 대시보드.',
                badge: '실시간 데이터',
            },
        ],
    },
    {
        category: 'HR·복지 인프라',
        color: '#a78bfa',
        items: [
            {
                icon: Heart,
                title: 'EAP 심리상담',
                desc: '임직원 정신건강 지원 프로그램. 전문 상담사가 스트레스, 번아웃, 대인관계 문제를 비밀 보장 하에 상담합니다.',
                badge: '비밀 보장',
            },
            {
                icon: Headphones,
                title: '24시간 법률 핫라인',
                desc: '임직원 누구나 24시간 법률 상담 가능. 개인 법률 문제(임대차, 교통사고 등)도 무료 상담 지원.',
                badge: '직원 복지',
            },
            {
                icon: TrendingUp,
                title: '월간 리스크 브리핑',
                desc: '매월 업계 법률 동향, 판례 변화, 규제 업데이트를 정리한 맞춤 브리핑을 경영진에게 직접 제공합니다.',
                badge: '선제 대응',
            },
        ],
    },
];

export default function InfraMapSection() {
    const [activeCategory, setActiveCategory] = useState(0);
    const [hoveredItem, setHoveredItem] = useState<number | null>(null);

    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(13,27,62,0.4)' }}>
            <div className="max-w-6xl mx-auto">
                {/* 헤더 */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm font-bold"
                        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}>
                        🏗 통합 인프라 플랫폼
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                        하나의 플랫폼으로{' '}
                        <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            법률·경영·HR
                        </span>
                        을 통합관리
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(240,244,255,0.55)' }}>
                        외부 로펌, 노무사, 컨설팅을 개별로 쓰는 시대는 끝났습니다.<br />
                        9가지 인프라 모듈이 하나의 구독으로 제공됩니다.
                    </p>
                </motion.div>

                {/* 카테고리 탭 */}
                <div className="flex justify-center gap-3 mb-10">
                    {INFRA_ITEMS.map((cat, i) => (
                        <button key={i} onClick={() => setActiveCategory(i)}
                            className="px-5 py-2.5 rounded-full text-sm font-bold transition-all"
                            style={{
                                background: activeCategory === i ? `${cat.color}20` : 'rgba(255,255,255,0.04)',
                                color: activeCategory === i ? cat.color : 'rgba(240,244,255,0.4)',
                                border: `1px solid ${activeCategory === i ? `${cat.color}50` : 'rgba(255,255,255,0.08)'}`,
                            }}>
                            {cat.category}
                        </button>
                    ))}
                </div>

                {/* 아이템 그리드 */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeCategory}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="grid md:grid-cols-3 gap-5">
                        {INFRA_ITEMS[activeCategory].items.map((item, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onMouseEnter={() => setHoveredItem(i)}
                                onMouseLeave={() => setHoveredItem(null)}
                                className="relative p-6 rounded-2xl cursor-pointer transition-all group"
                                style={{
                                    background: hoveredItem === i
                                        ? `linear-gradient(135deg, ${INFRA_ITEMS[activeCategory].color}12, rgba(13,27,62,0.6))`
                                        : 'rgba(255,255,255,0.03)',
                                    border: `1.5px solid ${hoveredItem === i ? `${INFRA_ITEMS[activeCategory].color}40` : 'rgba(255,255,255,0.07)'}`,
                                    transform: hoveredItem === i ? 'translateY(-4px)' : 'translateY(0)',
                                    boxShadow: hoveredItem === i ? `0 12px 40px ${INFRA_ITEMS[activeCategory].color}15` : 'none',
                                }}>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                    style={{ background: `${INFRA_ITEMS[activeCategory].color}15`, border: `1px solid ${INFRA_ITEMS[activeCategory].color}25` }}>
                                    <item.icon className="w-6 h-6" style={{ color: INFRA_ITEMS[activeCategory].color }} />
                                </div>
                                <h3 className="font-black text-lg mb-2" style={{ color: '#f0f4ff' }}>{item.title}</h3>
                                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(240,244,255,0.6)' }}>{item.desc}</p>
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold"
                                    style={{ background: `${INFRA_ITEMS[activeCategory].color}12`, color: INFRA_ITEMS[activeCategory].color, border: `1px solid ${INFRA_ITEMS[activeCategory].color}25` }}>
                                    ✓ {item.badge}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* 하단 CTA */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    className="mt-12 text-center">
                    <p className="text-sm mb-4" style={{ color: 'rgba(240,244,255,0.4)' }}>
                        9가지 인프라 모듈 · 하나의 구독 · 하나의 대시보드
                    </p>
                    <Link href="/login">
                        <button className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-base"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#04091a' }}>
                            무료 체험 시작하기 <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
