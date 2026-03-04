'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ISSUES_MOCK, fadeUp, type IssueItem } from '@/lib/landingData';

export default function IssueSection({ company }: { company: { name: string; issueCount: number; riskLevel: string } }) {
    return (
        <section id="issues" className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(13,27,62,0.3)' }}>
            <div className="max-w-6xl mx-auto">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-bold"
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                        <AlertTriangle className="w-4 h-4" /> AI 분석 결과 — 발견 이슈 {company.issueCount}건
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                        <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>법적 위반 이슈</span> 상세 보고서
                    </h2>
                    <p className="text-lg" style={{ color: 'rgba(240,244,255,0.6)' }}>
                        아래는 AI 1차 분석 결과입니다. 변호사 교차 검증 리포트는 로그인 후 확인하세요.
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {ISSUES_MOCK.map((issue: IssueItem, i: number) => (
                        <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                            variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { delay: i * 0.1, duration: 0.5 } } }}>
                            <Card padding="lg">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5"
                                            style={{
                                                background: issue.level === 'HIGH' ? 'rgba(239,68,68,0.15)' : issue.level === 'MEDIUM' ? 'rgba(251,146,60,0.15)' : 'rgba(250,204,21,0.15)',
                                                color: issue.level === 'HIGH' ? '#f87171' : issue.level === 'MEDIUM' ? '#fb923c' : '#facc15',
                                            }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className={issue.level === 'HIGH' ? 'badge-high' : issue.level === 'MEDIUM' ? 'badge-medium' : 'badge-low'}>
                                                    {issue.level === 'HIGH' ? '🔴 HIGH' : issue.level === 'MEDIUM' ? '🟠 MEDIUM' : '🟡 LOW'}
                                                </span>
                                                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.5)' }}>
                                                    {issue.law}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-base mb-2" style={{ color: '#f0f4ff' }}>{issue.title}</h3>
                                            <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.65)' }}>{issue.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 text-right sm:ml-4">
                                        <div className="text-xs mb-1" style={{ color: 'rgba(240,244,255,0.4)' }}>예상 리스크</div>
                                        <div className="font-black text-base" style={{ color: '#f87171' }}>{issue.fine}</div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* 잠금 CTA */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-8 text-center">
                    <div className="relative rounded-2xl p-8 overflow-hidden" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}>
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <Lock className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            <span className="font-bold" style={{ color: '#c9a84c' }}>변호사 검토 의견 + 2차·3차 피드백은 로그인 후 확인 가능합니다</span>
                        </div>
                        <p className="text-sm mb-6" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            이메일로 발송된 임시 비밀번호로 로그인하시면 전체 리포트를 즉시 확인하실 수 있습니다.
                        </p>
                        <Link href="/client-portal">
                            <Button variant="premium" size="lg">
                                로그인하여 전체 리포트 보기 <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
