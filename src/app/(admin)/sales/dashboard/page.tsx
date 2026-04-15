'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, Users, Mail, CheckCircle2, ArrowRight, BarChart3,
    Clock, Target, Zap, ChevronRight, AlertCircle, Eye, MousePointerClick,
    PhoneCall, FileText, Plus, Activity
} from 'lucide-react';
import Link from 'next/link';
import { leadStore, Lead, LeadStatus } from '@/lib/leadStore';
import { dataLayer } from '@/lib/dataLayer';
import { Company } from '@/lib/types';
import { useMounted } from '@/hooks/useMounted';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

const PIPELINE_STAGES: { status: LeadStatus; label: string; color: string; bg: string }[] = [
    { status: 'pending', label: '미분석', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
    { status: 'analyzed', label: 'AI 분석완료', color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
    { status: 'reviewing', label: '변호사 검토중', color: '#b45309', bg: 'rgba(217,119,6,0.1)' },
    { status: 'first_review_completed', label: '1차 검토완', color: '#0d9488', bg: 'rgba(20,184,166,0.1)' },
    { status: 'lawyer_confirmed', label: '컨펌 완료', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
    { status: 'emailed', label: '이메일 발송', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { status: 'in_contact', label: '연락 중', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    { status: 'contracted', label: '계약 완료', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
];

const QUICK_LINKS = [
    { href: '/employee', icon: Users, label: '리드 목록', desc: '전체 리드 관리', color: '#818cf8' },
    { href: '/sales/email-history', icon: Mail, label: '발송 이력', desc: '오픈율 & 추적', color: '#3b82f6' },
    { href: '/admin/email-preview', icon: Eye, label: '이메일 발송', desc: '새 이메일 작성', color: '#c9a84c' },
    { href: '/sales/pricing-calculator', icon: FileText, label: '견적 계산기', desc: '플랜 산정', color: '#4ade80' },
];

export default function SalesDashboardPage() {
    const isMounted = useMounted();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [pendingCompanies, setPendingCompanies] = useState<Company[]>([]);

    useEffect(() => {
        setLeads(leadStore.getAll());
        
        const fetchPendingCompanies = async () => {
            try {
                const companies = await dataLayer.companies.getAll();
                const pending = companies.filter(c => c.status === 'contract_signed');
                setPendingCompanies(pending);
            } catch (error) {
                console.error("Failed to fetch pending companies:", error);
            }
        };
        fetchPendingCompanies();
    }, []);

    const handleApprove = async (companyId: string) => {
        if (!confirm('입금 내역을 확인하셨습니까? Pro 플랜으로 승급합니다.')) return;
        
        try {
            await dataLayer.companies.update(companyId, {
                plan: 'premium',
                status: 'subscribed'
            });
            setPendingCompanies(prev => prev.filter(c => c.id !== companyId));
            alert('승급이 완료되었습니다.');
        } catch (error) {
            console.error("Failed to approve company:", error);
            alert('승급 처리 중 오류가 발생했습니다.');
        }
    };

    const total = leads.length;
    const emailed = leads.filter(l => l.emailSentAt).length;
    const contracted = leads.filter(l => l.status === 'contracted').length;
    const highRisk = leads.filter(l => l.riskLevel === 'HIGH').length;
    const conversionRate = total > 0 ? Math.round((contracted / total) * 100) : 0;
    const emailRate = total > 0 ? Math.round((emailed / total) * 100) : 0;

    const recentActivity = [...leads]
        .flatMap(l => l.timeline.map(t => ({ ...t, company: l.companyName, leadId: l.id })))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);

    const stageCounts = PIPELINE_STAGES.map(s => ({
        ...s,
        count: leads.filter(l => l.status === s.status).length,
    }));
    const maxCount = Math.max(...stageCounts.map(s => s.count), 1);

    const activityIcon: Record<string, React.ReactNode> = {
        email: <Mail className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />,
        call: <PhoneCall className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />,
        status_change: <Activity className="w-3.5 h-3.5" style={{ color: '#c9a84c' }} />,
        note: <FileText className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />,
        meeting: <Users className="w-3.5 h-3.5" style={{ color: '#a855f7' }} />,
    };

    if (!isMounted) return <DashboardSkeleton />;

    return (
        <div className="min-h-screen pb-16" style={{ background: '#04091a', color: '#f0f4ff' }}>
            {/* 헤더 */}
            <div className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
                style={{ background: 'rgba(4,9,26,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
                <div>
                    <h1 className="text-xl font-black">영업 대시보드</h1>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>
                        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/employee">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#04091a' }}>
                            <Plus className="w-4 h-4" /> 리드 관리
                        </button>
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
                {/* KPI 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: '전체 리드', value: total, icon: Users, color: '#818cf8', sub: '등록된 총 리드 수' },
                        { label: '이메일 발송', value: `${emailed}건`, icon: Mail, color: '#3b82f6', sub: `발송률 ${emailRate}%` },
                        { label: '계약 완료', value: contracted, icon: CheckCircle2, color: '#4ade80', sub: `전환율 ${conversionRate}%` },
                        { label: '고위험 리드', value: highRisk, icon: AlertCircle, color: '#f87171', sub: '즉시 조치 권장' },
                    ].map(({ label, value, icon: Icon, color, sub }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="rounded-2xl p-5"
                            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}25` }}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 rounded-xl" style={{ background: `${color}15` }}>
                                    <Icon className="w-4 h-4" style={{ color }} />
                                </div>
                                <TrendingUp className="w-3.5 h-3.5" style={{ color: `${color}60` }} />
                            </div>
                            <div className="text-2xl font-black mb-0.5" style={{ color }}>{value}</div>
                            <div className="text-xs font-bold mb-0.5" style={{ color: '#f0f4ff' }}>{label}</div>
                            <div className="text-[10px]" style={{ color: 'rgba(240,244,255,0.35)' }}>{sub}</div>
                        </motion.div>
                    ))}
                </div>

                {/* 파이프라인 보드 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl p-6"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 className="w-5 h-5" style={{ color: '#c9a84c' }} />
                        <h2 className="font-black text-base">영업 파이프라인</h2>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {stageCounts.map((stage, i) => (
                            <div key={stage.status} className="text-center">
                                <div className="text-xs font-bold mb-2 leading-tight" style={{ color: stage.color, fontSize: '10px' }}>
                                    {stage.label}
                                </div>
                                <div className="relative mx-auto w-full rounded-xl overflow-hidden" style={{ height: 80, background: 'rgba(255,255,255,0.03)' }}>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(stage.count / maxCount) * 100}%` }}
                                        transition={{ delay: 0.4 + i * 0.06, duration: 0.5 }}
                                        className="absolute bottom-0 w-full rounded-xl"
                                        style={{ background: stage.bg, borderTop: `2px solid ${stage.color}50` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl font-black" style={{ color: stage.color }}>{stage.count}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 px-1">
                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>
                            funnel: 좌(초기) → 우(계약 완료)
                        </p>
                        <Link href="/employee">
                            <button className="flex items-center gap-1 text-xs font-bold" style={{ color: '#c9a84c' }}>
                                전체 보기 <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </Link>
                    </div>
                </motion.div>

                {/* 퀵 링크 + 최근 활동 */}
                <div className="grid md:grid-cols-3 gap-4">
                    {/* 퀵 링크 */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        className="rounded-2xl p-5 space-y-3"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h2 className="font-black text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4" style={{ color: '#c9a84c' }} />
                            빠른 실행
                        </h2>
                        {QUICK_LINKS.map(({ href, icon: Icon, label, desc, color }) => (
                            <Link key={href} href={href}>
                                <div className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20` }}>
                                    <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${color}15` }}>
                                        <Icon className="w-4 h-4" style={{ color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold" style={{ color: '#f0f4ff' }}>{label}</div>
                                        <div className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{desc}</div>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: `${color}60` }} />
                                </div>
                            </Link>
                        ))}
                    </motion.div>

                    {/* 최근 활동 */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                        className="md:col-span-2 rounded-2xl p-5"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h2 className="font-black text-sm flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4" style={{ color: '#3b82f6' }} />
                            최근 영업 활동
                        </h2>
                        <div className="space-y-2">
                            {recentActivity.map((event, i) => (
                                <div key={`${event.id}_${i}`} className="flex items-start gap-3 py-2"
                                    style={{ borderBottom: i < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                    <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        {activityIcon[event.type] || <Activity className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold" style={{ color: '#f0f4ff' }}>{event.company}</span>
                                            <span className="text-xs" style={{ color: 'rgba(240,244,255,0.5)' }}>{event.content}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px]" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                                {new Date(event.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-[10px]" style={{ color: 'rgba(240,244,255,0.25)' }}>by {event.author}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {recentActivity.length === 0 && (
                                <p className="text-sm text-center py-4" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                    활동 내역이 없습니다
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* 이번달 목표 */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="rounded-2xl p-6"
                    style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(4,9,26,0))', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5" style={{ color: '#c9a84c' }} />
                        <h2 className="font-black text-base">이번달 목표</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: '신규 리드', current: total, goal: 20, color: '#818cf8' },
                            { label: '이메일 발송', current: emailed, goal: 15, color: '#3b82f6' },
                            { label: '계약 전환', current: contracted, goal: 3, color: '#4ade80' },
                        ].map(({ label, current, goal, color }) => {
                            const pct = Math.min((current / goal) * 100, 100);
                            return (
                                <div key={label}>
                                    <div className="flex justify-between items-center mb-1.5 text-xs">
                                        <span style={{ color: 'rgba(240,244,255,0.6)' }}>{label}</span>
                                        <span className="font-black" style={{ color }}>
                                            {current} / {goal}
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ delay: 0.8, duration: 0.6 }}
                                            className="h-full rounded-full"
                                            style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
                                        />
                                    </div>
                                    <div className="text-[10px] mt-1" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                        달성률 {Math.round(pct)}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* 🚨 결제/승인 대기열 (contract_signed 상태의 회사들) */}
                {pendingCompanies.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
                        className="rounded-2xl p-6"
                        style={{ background: 'linear-gradient(135deg, rgba(248,113,113,0.06), rgba(4,9,26,0))', border: '1px solid rgba(248,113,113,0.2)' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="w-5 h-5" style={{ color: '#f87171' }} />
                            <h2 className="font-black text-base" style={{ color: '#f87171' }}>입금 및 승인 대기열</h2>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f8717120', color: '#f87171' }}>
                                {pendingCompanies.length}건
                            </span>
                        </div>
                        <div className="space-y-3">
                            {pendingCompanies.map(company => (
                                <div key={company.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex items-start gap-3 mb-3 md:mb-0">
                                        <div className="p-2 flex-shrink-0 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)' }}>
                                            <FileText className="w-4 h-4" style={{ color: '#f87171' }} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm" style={{ color: '#f0f4ff' }}>{company.name}</h3>
                                            <p className="text-xs mt-1" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                                서명 일시: {company.contractSignedAt ? new Date(company.contractSignedAt).toLocaleString() : '확인 불가'}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleApprove(company.id)}
                                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 mt-2 md:mt-0 rounded-lg font-bold text-xs hover:bg-opacity-90 transition-colors"
                                        style={{ background: '#f87171', color: '#04091a' }}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        입금 확인 및 Pro 승급
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
