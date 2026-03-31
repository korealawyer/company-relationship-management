'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, Users, Building2, TrendingUp, DollarSign,
    CheckCircle2, Clock, ArrowRight, Shield, Mail, Gavel, Activity
} from 'lucide-react';
import Link from 'next/link';
import { leadStore } from '@/lib/leadStore';
import { useCompanies } from '@/hooks/useDataLayer';

export default function AdminPage() {
    const { companies: clients } = useCompanies();
    const [leads, setLeads] = useState<ReturnType<typeof leadStore.getAll>>([]);

    useEffect(() => {
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
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
            {/* Header */}
            <div className="sticky top-0 z-40 px-6 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <Shield className="w-5 h-5 text-amber-600" />
                            관리자 대시보드
                        </h1>
                        <p className="text-xs mt-0.5 text-slate-500 font-medium">
                            IBS 법률사무소 · 전체 현황
                        </p>
                    </div>
                    <Link href="/admin/clients">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 transition-colors rounded-xl text-sm font-semibold shadow-sm">
                            고객 목록 <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-8 space-y-8">
                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {[
                        { label: '총 구독 기업', value: subscribed.length, icon: Building2, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100', sub: '전체 고객사' },
                        { label: '이번달 신규', value: thisMonth.length, icon: TrendingUp, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100', sub: '신규 구독 완료' },
                        { label: '월 예상 매출', value: `${(monthlyRevenue / 1_0000_0000).toFixed(1)}억`, icon: DollarSign, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100', sub: 'MRR (예상)' },
                        { label: '리드 전환율', value: `${convRate}%`, icon: BarChart3, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-100', sub: `${totalLeads}건 중 ${contractedLeads}건` },
                    ].map(({ label, value, icon: Icon, color, bgColor, borderColor, sub }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className={`rounded-2xl p-5 bg-white border ${borderColor} shadow-sm flex flex-col`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2.5 rounded-xl ${bgColor}`}>
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
                            <div className="text-sm font-medium text-slate-600 mb-1">{label}</div>
                            <div className="text-xs text-slate-400 mt-auto">{sub}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Links */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
                    <h2 className="font-bold text-base text-slate-800 mb-5 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-amber-600" />
                        빠른 메뉴
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                        {ADMIN_QUICK.map(({ href, icon: Icon, label, desc, color }) => (
                            <Link key={href} href={href}>
                                <div className="group p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-50 border border-slate-100 hover:border-slate-300 text-center h-full flex flex-col items-center justify-center">
                                    <div className="p-3 rounded-xl mb-3 transition-colors" style={{ backgroundColor: `${color}15`, color }}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-sm font-bold text-slate-700 mb-1 group-hover:text-slate-900 transition-colors">{label}</div>
                                    <div className="text-[11px] text-slate-500 font-medium">{desc}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Subscriptions */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-600" />
                            최근 구독 완료
                        </h2>
                        <Link href="/admin/clients">
                            <button className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1">
                                전체 보기 <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>
                    <div className="space-y-1">
                        {recentSubscriptions.length === 0 && (
                            <p className="text-sm text-center py-8 text-slate-400 font-medium">최신 구독 기업이 없습니다</p>
                        )}
                        {recentSubscriptions.map((c, i) => {
                            const planStyles = c.plan === 'premium' 
                                ? { bg: 'bg-amber-50', text: 'text-amber-700', outline: 'ring-amber-200' }
                                : c.plan === 'standard'
                                ? { bg: 'bg-indigo-50', text: 'text-indigo-700', outline: 'ring-indigo-200' }
                                : { bg: 'bg-emerald-50', text: 'text-emerald-700', outline: 'ring-emerald-200' };
                                
                            const iconColors = c.plan === 'premium' ? 'text-amber-600' : c.plan === 'standard' ? 'text-indigo-600' : 'text-emerald-600';
                            
                            return (
                                <div key={c.id} className="flex items-center gap-5 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className={`p-3 rounded-xl ${planStyles.bg}`}>
                                        <Building2 className={`w-5 h-5 ${iconColors}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[15px] font-bold text-slate-800 mb-0.5">{c.name}</div>
                                        <div className="text-sm font-medium text-slate-500">
                                            {c.assignedLawyer || '변호사 미배정'} <span className="mx-1.5 text-slate-300">|</span> {c.storeCount}개 매장
                                        </div>
                                    </div>
                                    <span className={`text-xs px-3 py-1 rounded-md font-bold capitalize ring-1 ring-inset ${planStyles.outline} ${planStyles.bg} ${planStyles.text}`}>
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
