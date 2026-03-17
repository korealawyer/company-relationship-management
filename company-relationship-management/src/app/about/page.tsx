'use client';
import React from 'react';
import { motion } from 'framer-motion';
import {
    Scale, Shield, Award, Users, MapPin, Phone,
    Mail, Building2, Star, ChevronRight, Brain, Gavel,
} from 'lucide-react';
import Link from 'next/link';

const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

const LAWYERS = [
    {
        name: '유정훈', title: '대표 변호사', bar: '대한변호사협회 제28715호',
        specialty: '개인정보보호법 · 프랜차이즈법 · 공정거래법',
        career: ['서울중앙지검 검사 출신', '공정거래위원회 자문위원', '개인정보보호위원회 자문'],
        cases: 847, rating: 4.9,
    },
    {
        name: '김수현', title: '파트너 변호사', bar: '대한변호사협회 제31247호',
        specialty: '가맹사업법 · 계약법 · 노동법',
        career: ['법무법인 태평양 출신', '중소벤처기업부 자문', '프랜차이즈 분쟁 전문'],
        cases: 512, rating: 4.8,
    },
    {
        name: '박지은', title: '시니어 변호사', bar: '대한변호사협회 제35891호',
        specialty: '정보통신망법 · 전자상거래법 · 소비자보호법',
        career: ['방송통신위원회 출신', 'AI 규제 정책 연구', '개인정보 침해 소송 전문'],
        cases: 324, rating: 4.7,
    },
];

const MILESTONES = [
    { year: '2018', event: 'IBS 법률사무소 설립', desc: '프랜차이즈 전문 법률 자문 서비스 시작' },
    { year: '2020', event: '100호 자문 기업 달성', desc: '프랜차이즈 본부 법률 자문 누적 100개사 돌파' },
    { year: '2022', event: 'AI 법률 분석 시스템 도입', desc: '개인정보처리방침 자동 분석 시스템 론칭' },
    { year: '2024', event: '500호 자문 기업 달성', desc: '국내 최대 프랜차이즈 전문 로펌으로 성장' },
    { year: '2026', event: 'AI 2.0 시스템 업그레이드', desc: 'RAG 기반 법률 AI, 멀티 모델 지원, 실시간 스트리밍 상담' },
];

const STATS = [
    { value: '847+', label: '누적 자문 기업', icon: Building2, color: '#6366f1' },
    { value: '99.2%', label: '고객 만족도', icon: Star, color: '#f59e0b' },
    { value: '12,000+', label: '분석된 처리방침', icon: Brain, color: '#10b981' },
    { value: '8년+', label: '운영 경력', icon: Award, color: '#8b5cf6' },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen py-8 px-4" style={{ background: T.bg }}>
            <div className="max-w-5xl mx-auto">

                {/* 히어로 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)' }}>
                        <Scale className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black mb-2" style={{ color: T.heading }}>IBS 법률사무소</h1>
                    <p className="text-lg font-bold" style={{ color: '#c9a84c' }}>한국 1등 프랜차이즈 전문 로펌</p>
                    <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: T.muted }}>
                        AI 기반 법률 분석과 전담 변호사의 교차 검증으로, 프랜차이즈 본부의 법적 리스크를 완벽하게 관리합니다.
                    </p>
                </motion.div>

                {/* 핵심 수치 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {STATS.map(({ value, label, icon: Icon, color }) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-2xl text-center"
                            style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                            <Icon className="w-6 h-6 mx-auto mb-2" style={{ color }} />
                            <div className="text-2xl font-black" style={{ color: T.heading }}>{value}</div>
                            <p className="text-xs mt-1" style={{ color: T.muted }}>{label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* 변호사 소개 */}
                <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: T.heading }}>
                    <Gavel className="w-5 h-5" style={{ color: '#c9a84c' }} />
                    변호사 소개
                </h2>
                <div className="grid md:grid-cols-3 gap-4 mb-10">
                    {LAWYERS.map(l => (
                        <motion.div key={l.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-2xl"
                            style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black"
                                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                                    {l.name[0]}
                                </div>
                                <div>
                                    <p className="font-black text-base" style={{ color: T.heading }}>{l.name}</p>
                                    <p className="text-xs" style={{ color: '#c9a84c' }}>{l.title}</p>
                                </div>
                            </div>
                            <p className="text-[10px] mb-2" style={{ color: T.faint }}>{l.bar}</p>
                            <p className="text-xs font-bold mb-2" style={{ color: '#6366f1' }}>{l.specialty}</p>
                            <div className="space-y-1 mb-3">
                                {l.career.map(c => (
                                    <div key={c} className="flex items-center gap-1.5 text-xs" style={{ color: T.sub }}>
                                        <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: T.faint }} />
                                        {c}
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${T.borderSub}` }}>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className="w-3 h-3 fill-current" style={{ color: '#c9a84c' }} />
                                    ))}
                                    <span className="text-xs ml-1" style={{ color: T.muted }}>{l.rating}</span>
                                </div>
                                <span className="text-xs" style={{ color: T.faint }}>누적 {l.cases}건</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 연혁 */}
                <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: T.heading }}>
                    <Award className="w-5 h-5" style={{ color: '#6366f1' }} />
                    주요 연혁
                </h2>
                <div className="mb-10 p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                    {MILESTONES.map((m, i) => (
                        <div key={m.year} className="flex gap-4 pb-5 last:pb-0 relative"
                            style={{ borderLeft: i < MILESTONES.length - 1 ? `2px solid ${T.borderSub}` : 'none', marginLeft: 8 }}>
                            <div className="absolute -left-[7px] w-4 h-4 rounded-full flex-shrink-0"
                                style={{ background: '#6366f1', border: `3px solid ${T.card}` }} />
                            <div className="ml-4">
                                <span className="text-xs font-black px-2 py-0.5 rounded" style={{ background: '#eef2ff', color: '#6366f1' }}>{m.year}</span>
                                <p className="text-sm font-bold mt-1" style={{ color: T.heading }}>{m.event}</p>
                                <p className="text-xs" style={{ color: T.muted }}>{m.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 연락처 */}
                <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                    <h2 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: T.heading }}>
                        <MapPin className="w-5 h-5" style={{ color: '#10b981' }} />
                        오시는 길
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            {[
                                { icon: MapPin, label: '주소', value: '서울특별시 강남구 테헤란로 123, IBS빌딩 8층' },
                                { icon: Phone, label: '전화', value: '02-555-1234' },
                                { icon: Mail, label: '이메일', value: 'contact@ibslaw.co.kr' },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-start gap-3">
                                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.muted }} />
                                    <div>
                                        <p className="text-xs font-bold" style={{ color: T.muted }}>{label}</p>
                                        <p className="text-sm" style={{ color: T.body }}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-center">
                            <Link href="/sales">
                                <button className="px-8 py-4 rounded-xl font-black text-sm"
                                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                                    무료 상담 신청하기 →
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
