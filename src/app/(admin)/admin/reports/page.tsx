'use client';
import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, Users, Phone, Mail,
    FileText, Calendar, DollarSign, Target,
    ArrowUp, ArrowDown, Download, Filter,
    CheckCircle2, Clock, AlertTriangle, Star,
} from 'lucide-react';
import Link from 'next/link';
import { ReportGeneratorFactory } from '@/lib/reportGenerator';
import { useCompanies } from '@/hooks/useDataLayer';

/* ── 기간 탭 ─────────────────────────────────────────────── */
type Period = 'week' | 'month' | 'quarter';

/* ── 공통 유틸 및 매핑 데이터 ────────────────────────────────── */
const PLAN_REVENUE = { premium: 2_990_000, standard: 1_490_000, starter: 490_000, none: 0 };

export default function ReportsPage() {
    const { companies, isLoading } = useCompanies();
    const [period, setPeriod] = useState<Period>('month');
    const [downloading, setDownloading] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // =========================================================
    // 데이터 집계 (Data Aggregation)
    // =========================================================
    
    // 이번 달 및 지난 달 필터링
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // KPI 카드 동적 계산
    const { currentLeads, lastLeads, currentRevenue, lastRevenue, currentContracts, currentCalls, lastCalls } = useMemo(() => {
        let curLeads = 0, lstLeads = 0;
        let curRev = 0, lstRev = 0;
        let curCont = 0;
        let curCalls = 0, lstCalls = 0;

        companies.forEach(company => {
            const date = new Date(company.createdAt);
            const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            const isLastMonth = date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
            const rev = PLAN_REVENUE[company.plan as keyof typeof PLAN_REVENUE] || 0;

            if (isCurrentMonth) {
                curLeads++;
                curRev += rev;
                if (company.plan !== 'none') curCont++;
                curCalls += (company.callAttempts || 0);
            } else if (isLastMonth) {
                lstLeads++;
                lstRev += rev;
                lstCalls += (company.callAttempts || 0);
            }
        });

        return {
            currentLeads: curLeads,
            lastLeads: lstLeads,
            currentRevenue: curRev,
            lastRevenue: lstRev,
            currentContracts: curCont,
            currentCalls: curCalls,
            lastCalls: lstCalls,
        };
    }, [companies, currentMonth, currentYear, lastMonth, lastMonthYear]);

    // 증감액 및 퍼센트
    const calcChange = (cur: number, last: number) => {
        if (last === 0) return cur > 0 ? '+100%' : '0%';
        const diff = cur - last;
        const pct = (diff / last) * 100;
        return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
    };

    const leadsChange = calcChange(currentLeads, lastLeads);
    const revChange = calcChange(currentRevenue, lastRevenue);
    const convRate = currentLeads > 0 ? ((currentContracts / currentLeads) * 100).toFixed(1) : '0.0';

    const kpiCards = [
        { icon: Users, label: '신규 리드', value: currentLeads.toString(), change: leadsChange, up: currentLeads >= lastLeads, color: '#2563eb', sub: '전월 대비' },
        { icon: Target, label: '계약 전환율', value: `${convRate}%`, change: '-', up: true, color: '#22c55e', sub: '이번 달 누적' },
        { icon: DollarSign, label: '월 매출', value: `${currentRevenue.toLocaleString()}원`, change: revChange, up: currentRevenue >= lastRevenue, color: '#d97706', sub: '전월 대비' },
        { icon: Phone, label: '전화 완료', value: `${currentCalls}건`, change: `${currentCalls - lastCalls > 0 ? '+' : ''}${currentCalls - lastCalls}건`, up: currentCalls >= lastCalls, color: '#7c3aed', sub: '전월 대비' },
    ];

    // 파이프라인 퍼널 집계
    const FUNNEL_DATA = useMemo(() => {
        let counts = { pending: 0, crawled: 0, sale_conf: 0, law_conf: 0, emailed: 0, reply: 0, contr: 0, sub: 0 };
        companies.forEach(c => {
            // 편의상 파이프라인 진행 상태별 누적 스냅샷 개념 (현 상태 기준)
            switch (c.status) {
                case 'pending': counts.pending++; break;
                case 'crawling': case 'analyzed': counts.crawled++; break;
                case 'reviewing': case 'assigned': counts.sale_conf++; break;
                case 'lawyer_confirmed': counts.law_conf++; break;
                case 'emailed': counts.emailed++; break;
                case 'client_replied': counts.reply++; break;
                case 'contract_sent': case 'contract_signed': counts.contr++; break;
                case 'subscribed': case 'upsell': counts.sub++; break;
            }
        });

        // 좀 더 퍼널(하향식)처럼 보이게, 뒤의 단계 개수를 포함시켜 누적(Threshold)로 만들 수도 있으나,
        // 여기서는 직관적으로 각 파이프라인에 대기 중인 상태를 보여줍니다.
        const funnel = [
            { stage: '신규 리드', count: counts.pending, color: '#94a3b8' },
            { stage: '분석 진행', count: counts.crawled, color: '#60a5fa' },
            { stage: '영업 배정', count: counts.sale_conf, color: '#818cf8' },
            { stage: '변호사 확인', count: counts.law_conf, color: '#c084fc' },
            { stage: '제안 발송', count: counts.emailed, color: '#f472b6' },
            { stage: '고객 응답', count: counts.reply, color: '#fb923c' },
            { stage: '계약 대기', count: counts.contr, color: '#4ade80' },
            { stage: '구독 완료', count: counts.sub, color: '#22c55e' },
        ];
        
        const maxStage = Math.max(...funnel.map(f => f.count), 1);
        return funnel.map(f => ({
            ...f,
            width: Math.min(Math.round((f.count / maxStage) * 100) + 5, 100) // 최소 5% 보장
        }));
    }, [companies]);

    // 월별 트렌드 집계 (최근 6개월)
    const MONTHLY_TRENDS = useMemo(() => {
        const trendsLabel: string[] = [];
        const trendsMap: Record<string, { month: string; leads: number; contracts: number; revenue: number }> = {};
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentYear, currentMonth - i, 1);
            const label = `${d.getMonth() + 1}월`;
            trendsLabel.push(label);
            trendsMap[label] = { month: label, leads: 0, contracts: 0, revenue: 0 };
        }

        companies.forEach(company => {
            const d = new Date(company.createdAt);
            const mLabel = `${d.getMonth() + 1}월`;
            if (trendsMap[mLabel]) {
                trendsMap[mLabel].leads++;
                if (company.plan !== 'none') {
                    trendsMap[mLabel].contracts++;
                    trendsMap[mLabel].revenue += PLAN_REVENUE[company.plan as keyof typeof PLAN_REVENUE] || 0;
                }
            }
        });

        return trendsLabel.map(label => trendsMap[label]);
    }, [companies, currentMonth, currentYear]);

    // 영업 담당자별 성과
    const REP_PERFORMANCE = useMemo(() => {
        const reps: Record<string, any> = {};
        companies.forEach(c => {
            const repName = c.assignedLawyer || c.salesConfirmedBy || '미배정';
            if (!reps[repName]) {
                reps[repName] = { name: repName, leads: 0, calls: 0, emails: 0, contracts: 0, revenue: 0 };
            }
            reps[repName].leads++;
            reps[repName].calls += (c.callAttempts || 0);
            if (c.emailSentAt) reps[repName].emails++;
            
            if (c.plan !== 'none') {
                reps[repName].contracts++;
                reps[repName].revenue += PLAN_REVENUE[c.plan as keyof typeof PLAN_REVENUE] || 0;
            }
        });

        // 배열로 변환 후 정렬 (매출순)
        const list = Object.values(reps).map(r => ({
            ...r,
            rate: r.leads > 0 ? ((r.contracts / r.leads) * 100).toFixed(1) : '0.0'
        }));
        return list.sort((a, b) => b.revenue - a.revenue);
    }, [companies]);


    const handleDownload = async () => {
        if (!reportRef.current || downloading) return;
        try {
            setDownloading(true);
            const generator = ReportGeneratorFactory.create('PDF', `Admin_Report_${period}_${currentYear}.pdf`);
            await generator.generate([reportRef.current]);
            alert('📥 리포트 다운로드가 완료되었습니다.');
        } catch (error) {
            console.error('Report generation failed:', error);
            alert('❌ 다운로드 중 오류가 발생했습니다.');
        } finally {
            setDownloading(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Clock className="w-8 h-8 text-amber-500" /></motion.div></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16">

            {/* 상단 헤더 */}
            <div className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 h-[60px] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/employee">
                        <button className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer font-medium">← 돌아가기</button>
                    </Link>
                    <div className="w-px h-4 bg-slate-200" />
                    <span className="text-[15px] font-black text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-amber-600" /> 영업 성과 리포트
                    </span>
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 py-0.5 px-2 rounded-full">실제 데이터 연동 완료</span>
                    <span className="text-[12px] font-semibold text-slate-400 ml-2 hidden sm:inline-block">{currentYear}년 {currentMonth+1}월 기준 · 실시간 업데이트</span>
                </div>
                <div className="flex items-center gap-2 hidden sm:flex">
                    {/* 기간 필터 */}
                    {(['week', 'month', 'quarter'] as Period[]).map(p => {
                        const labels: Record<Period, string> = { week: '주간', month: '월간', quarter: '분기' };
                        return (
                            <button key={p} onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${period === p ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}>
                                {labels[p]}
                            </button>
                        );
                    })}
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button onClick={handleDownload} disabled={downloading}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all border-none ${downloading ? 'bg-slate-600 text-white cursor-wait opacity-80' : 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer shadow-sm'}`}>
                        {downloading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                <Clock className="w-3.5 h-3.5" />
                            </motion.div>
                        ) : (
                            <Download className="w-3.5 h-3.5" />
                        )}
                        {downloading ? '생성 중...' : 'PDF 다운로드'}
                    </button>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto py-8 px-6">
                {/* PDF로 변환될 메인 컨텐츠 영역 */}
                <div ref={reportRef} className="rounded-xl overflow-hidden p-2 bg-slate-50">
                    {/* KPI 카드 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {kpiCards.map((kpi, i) => {
                            const Icon = kpi.icon;
                            return (
                                <motion.div
                                    key={kpi.label}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * i }}
                                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center opacity-90"
                                            style={{ backgroundColor: `${kpi.color}15` }}>
                                            <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                                        </div>
                                        <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${kpi.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {kpi.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {kpi.change}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 mb-0.5">{kpi.label}</p>
                                    <p className="text-xl font-black text-slate-900">{kpi.value}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium">{kpi.sub}</p>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        {/* 파이프라인 퍼널 */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                            <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4 text-amber-500" />
                                상태별 스냅샷 퍼널
                            </h2>
                            <div className="space-y-2.5">
                                {FUNNEL_DATA.map((f, i) => (
                                    <div key={f.stage} className="flex items-center gap-3">
                                        <span className="text-[11px] font-bold w-20 text-right shrink-0 text-slate-600">
                                            {f.stage}
                                        </span>
                                        <div className="flex-1 h-7 rounded-lg overflow-hidden bg-slate-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${f.width}%` }}
                                                transition={{ delay: 0.1 * i, duration: 0.5 }}
                                                className="h-full rounded-lg flex items-center justify-end px-2 shadow-inner"
                                                style={{ backgroundColor: f.color }}
                                            >
                                                <span className="text-[10px] font-black text-white">{f.count}</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 월별 트렌드 (바 차트 CSS) */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                            <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                최근 6개월 매출 트렌드
                            </h2>
                            <div className="flex items-end gap-3 h-44">
                                {MONTHLY_TRENDS.map((m, i) => {
                                    const maxRevenue = Math.max(...MONTHLY_TRENDS.map(t => t.revenue), 1_000_000);
                                    const height = (m.revenue / maxRevenue) * 100;
                                    return (
                                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-[9px] font-bold text-amber-600">
                                                {(m.revenue / 1_000_000).toFixed(0)}M
                                            </span>
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${height}%` }}
                                                transition={{ delay: 0.1 * i, duration: 0.5 }}
                                                className="w-full rounded-t-lg shadow-sm"
                                                style={{
                                                    background: `linear-gradient(to top, #3b82f6, #93c5fd)`,
                                                    minHeight: 8,
                                                }}
                                            />
                                            <span className="text-[10px] font-bold text-slate-500">{m.month}</span>
                                            <span className="text-[9px] text-slate-400 font-medium">{m.contracts}건</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100">
                                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" /> 월 매출
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                    <span className="text-[10px] font-black text-amber-500">N</span> 계약 건수
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 담당자별 성과 테이블 */}
                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-8">
                        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" />
                                실시간 담당자별 성과
                            </h2>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                전체 누적 기준
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50">
                                        {['순위', '담당자', '리드', '전화', '이메일', '계약 체결', '누적 매출', '전환율'].map(h => (
                                            <th key={h} className="py-3 px-5 text-left text-[11px] font-extrabold text-slate-500 whitespace-nowrap min-w-[70px]">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {REP_PERFORMANCE.length > 0 ? REP_PERFORMANCE.map((rep, i) => (
                                        <tr key={rep.name} className="transition-colors hover:bg-slate-50/50 bg-white">
                                            <td className="py-3 px-5">
                                                <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-black shadow-sm border ${i === 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : i === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' : i === 2 ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-slate-400 border-slate-100'}`}>
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td className="py-3 px-5 font-bold text-slate-800 whitespace-nowrap">{rep.name}</td>
                                            <td className="py-3 px-5 font-bold text-slate-800 text-[13px]">{rep.leads}</td>
                                            <td className="py-3 px-5 text-slate-500 text-[13px] font-medium">{rep.calls}</td>
                                            <td className="py-3 px-5 text-slate-500 text-[13px] font-medium">{rep.emails}</td>
                                            <td className="py-3 px-5">
                                                <span className="font-extrabold text-emerald-600 text-[13px]">{rep.contracts}건</span>
                                            </td>
                                            <td className="py-3 px-5 whitespace-nowrap">
                                                <span className="font-extrabold text-amber-600 text-[13px]">{rep.revenue.toLocaleString()}원</span>
                                            </td>
                                            <td className="py-3 px-5">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${parseFloat(rep.rate) >= 20 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                    {rep.rate}%
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-slate-400 font-medium text-sm">
                                                연동된 데이터가 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <span className="text-slate-500 font-bold shrink-0">📈 데이터 총계</span>
                                <div className="flex gap-4 sm:gap-6 flex-wrap font-medium">
                                    <span className="text-slate-600">총 리드 수: <strong className="text-slate-900 ml-1">{REP_PERFORMANCE.reduce((s, r) => s + r.leads, 0)}</strong></span>
                                    <div className="w-px h-4 bg-slate-300 hidden sm:block" />
                                    <span className="text-slate-600">체결 계약: <strong className="text-emerald-600 ml-1">{REP_PERFORMANCE.reduce((s, r) => s + r.contracts, 0)}건</strong></span>
                                    <div className="w-px h-4 bg-slate-300 hidden sm:block" />
                                    <span className="text-slate-600">누적 매출: <strong className="text-amber-600 ml-1 font-black">{REP_PERFORMANCE.reduce((s, r) => s + r.revenue, 0).toLocaleString()}원</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}