'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, Users, Building2, TrendingUp, DollarSign,
    CheckCircle2, Clock, ArrowRight, Shield, Mail, Gavel, Activity
} from 'lucide-react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { leadStore } from '@/lib/leadStore';

export default function AdminPage() {
    const [clients, setClients] = useState<ReturnType<typeof store.getAll>>([]);
    const [leads, setLeads] = useState<ReturnType<typeof leadStore.getAll>>([]);

    useEffect(() => {
        setClients(store.getAll());
        setLeads(leadStore.getAll());
    }, []);

    const subscribed = clients.filter(c => c.plan && c.plan !== 'none');
    const thisMonth = subscribed.filter(c => {
        const d = new Date(c.salesConfirmedAt || '');
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalLeads = leads.length;
    const contractedLeads = leads.filter(l => l.status === 'contracted').length;
    const convRate = totalLeads > 0 ? Math.round((contractedLeads / totalLeads) * 100) : 0;

    // 더미 월 매출 (구독 기업 * 평균 단가)
    const monthlyRevenue = subscribed.length * 3_500_000;

    const ADMIN_QUICK = [
        { href: '/admin/clients', icon: Building2, label: '고객 목록', desc: '전체 구독 기업 관리', color: '#c9a84c' },
        { href: '/admin/email-preview', icon: Mail, label: '이메일 발송', desc: '개인화 이메일 작성', color: '#3b82f6' },
        { href: '/admin/contract-preview', icon: CheckCircle2, label: '계약서 발송', desc: '전자계약 발송', color: '#4ade80' },
        { href: '/admin/reports', icon: BarChart3, label: '월간 리포트', desc: 'AI 리포트 생성', color: '#818cf8' },
        { href: '/sales/dashboard', icon: TrendingUp, label: '영업 현황', desc: '파이프라인 대시보드', color: '#fb923c' },
        { href: '/employee', icon: Shield, label: 'CRM 전체', desc: '직원 전용 페이지', color: '#a855f7' },
    ];

    const recentSubscriptions = [...subscribed]
        .sort((a, b) => new Date(b.salesConfirmedAt || 0).getTime() - new Date(a.salesConfirmedAt || 0).getTime())
        .slice(0, 5);

    return (
        <div className="min-h-screen pb-16" style={{ background: '#04091a', color: '#f0f4ff' }}>
            {/* 헤더 */}
            <div className="sticky top-0 z-40 px-6 py-4"
                style={{ background: 'rgba(4,9,26,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black flex items-center gap-2">
                            <Shield className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            관리자 대시보드
                        </h1>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>
                            IBS 법률사무소 · 전체 현황
                        </p>
                    </div>
                    <Link href="/admin/clients">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#04091a' }}>
                            고객 목록 →
                        </button>
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: '총 구독 기업', value: subscribed.length, icon: Building2, color: '#c9a84c', sub: '전체 고객사' },
                        { label: '이번달 신규', value: thisMonth.length, icon: TrendingUp, color: '#4ade80', sub: '신규 구독 완료' },
                        { label: '월 예상 매출', value: `${(monthlyRevenue / 1_0000_0000).toFixed(1)}억`, icon: DollarSign, color: '#818cf8', sub: 'MRR (예상)' },
                        { label: '리드 전환율', value: `${convRate}%`, icon: BarChart3, color: '#3b82f6', sub: `${totalLeads}건 중 ${contractedLeads}건` },
                    ].map(({ label, value, icon: Icon, color, sub }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="rounded-2xl p-5"
                            style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}25` }}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 rounded-xl" style={{ background: `${color}15` }}>
                                    <Icon className="w-4 h-4" style={{ color }} />
                                </div>
                            </div>
                            <div className="text-2xl font-black mb-0.5" style={{ color }}>{value}</div>
                            <div className="text-xs font-bold text-white mb-0.5">{label}</div>
                            <div className="text-[10px]" style={{ color: 'rgba(240,244,255,0.35)' }}>{sub}</div>
                        </motion.div>
                    ))}
                </div>

                {/* 퀵 링크 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl p-6"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 className="font-black text-sm mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        빠른 실행
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {ADMIN_QUICK.map(({ href, icon: Icon, label, desc, color }) => (
                            <Link key={href} href={href}>
                                <div className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.03] text-center"
                                    style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                                    <div className="p-2 rounded-lg inline-flex mb-2" style={{ background: `${color}15` }}>
                                        <Icon className="w-4 h-4" style={{ color }} />
                                    </div>
                                    <div className="text-xs font-black mb-0.5" style={{ color: '#f0f4ff' }}>{label}</div>
                                    <div className="text-[9px]" style={{ color: 'rgba(240,244,255,0.35)' }}>{desc}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* 최근 구독 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-2xl p-6"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-black text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4" style={{ color: '#4ade80' }} />
                            최근 구독 완료
                        </h2>
                        <Link href="/admin/clients">
                            <button className="text-xs font-bold flex items-center gap-1" style={{ color: '#c9a84c' }}>
                                전체 보기 <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentSubscriptions.length === 0 && (
                            <p className="text-sm text-center py-4" style={{ color: 'rgba(240,244,255,0.3)' }}>구독 기업이 없습니다</p>
                        )}
                        {recentSubscriptions.map((c, i) => {
                            const planColor = c.plan === 'premium' ? '#c9a84c' : c.plan === 'standard' ? '#818cf8' : '#4ade80';
                            return (
                                <div key={c.id} className="flex items-center gap-4 py-2.5"
                                    style={{ borderBottom: i < recentSubscriptions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                    <div className="p-2 rounded-lg" style={{ background: `${planColor}10` }}>
                                        <Building2 className="w-4 h-4" style={{ color: planColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold" style={{ color: '#f0f4ff' }}>{c.name}</div>
                                        <div className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                            {c.assignedLawyer || '변호사 미배정'} · {c.storeCount}개 매장
                                        </div>
                                    </div>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold capitalize"
                                        style={{ background: `${planColor}15`, color: planColor }}>
                                        {c.plan}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
