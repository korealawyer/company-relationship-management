'use client';
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, Users, Phone, Mail,
    FileText, Calendar, DollarSign, Target,
    ArrowUp, ArrowDown, Download, Filter,
    CheckCircle2, Clock, AlertTriangle, Star,
} from 'lucide-react';
import Link from 'next/link';
import { ReportGeneratorFactory } from '@/lib/reportGenerator';

/* ── 기간 탭 ─────────────────────────────────────────────── */
type Period = 'week' | 'month' | 'quarter';

/* ── 담당자별 성과 데이터 ─────────────────────────────────── */
const REP_PERFORMANCE = [
    { name: '김영업', leads: 45, calls: 128, emails: 67, contracts: 12, revenue: 29_880_000, rate: 26.7 },
    { name: '이세일', leads: 38, calls: 95, emails: 52, contracts: 9, revenue: 22_410_000, rate: 23.7 },
    { name: '박매니', leads: 32, calls: 87, emails: 41, contracts: 8, revenue: 19_920_000, rate: 25.0 },
    { name: '최마케', leads: 28, calls: 74, emails: 35, contracts: 6, revenue: 14_940_000, rate: 21.4 },
];

/* ── 파이프라인 퍼널 데이터 ────────────────────────────────── */
const FUNNEL_DATA = [
    { stage: '리드 수집', count: 143, color: '#94a3b8', width: 100 },
    { stage: 'AI 분석 완료', count: 128, color: '#60a5fa', width: 89 },
    { stage: '영업 컨펌', count: 98, color: '#818cf8', width: 69 },
    { stage: '변호사 배정', count: 76, color: '#c084fc', width: 53 },
    { stage: '이메일 발송', count: 62, color: '#f472b6', width: 43 },
    { stage: '고객 답장', count: 41, color: '#fb923c', width: 29 },
    { stage: '계약 체결', count: 35, color: '#4ade80', width: 24 },
    { stage: '구독 활성', count: 35, color: '#22c55e', width: 24 },
];

/* ── 월별 트렌드 ─────────────────────────────────────────── */
const MONTHLY_TRENDS = [
    { month: '10월', leads: 68, contracts: 15, revenue: 37_350_000 },
    { month: '11월', leads: 82, contracts: 19, revenue: 47_310_000 },
    { month: '12월', leads: 95, contracts: 22, revenue: 54_780_000 },
    { month: '1월', leads: 110, contracts: 28, revenue: 69_720_000 },
    { month: '2월', leads: 125, contracts: 31, revenue: 77_190_000 },
    { month: '3월', leads: 143, contracts: 35, revenue: 87_150_000 },
];

/* ── 메인 페이지 ─────────────────────────────────────────── */
export default function ReportsPage() {
    const [period, setPeriod] = useState<Period>('month');
    const [downloading, setDownloading] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const kpiCards = [
        { icon: Users, label: '신규 리드', value: '143', change: '+18.3%', up: true, color: '#2563eb', sub: '전월 대비' },
        { icon: Target, label: '계약 전환율', value: '24.5%', change: '+2.1%p', up: true, color: '#22c55e', sub: '목표 20%' },
        { icon: DollarSign, label: '월 매출', value: '87,150,000원', change: '+12.9%', up: true, color: '#d97706', sub: '전월 대비' },
        { icon: Phone, label: '전화 완료', value: '384건', change: '+24건', up: true, color: '#7c3aed', sub: '이번 달' },
    ];

    const handleDownload = async () => {
        if (!reportRef.current || downloading) return;
        
        try {
            setDownloading(true);
            const generator = ReportGeneratorFactory.create('PDF', `Admin_Report_${period}_2026.pdf`);
            
            // 요소 캡처 및 PDF 생성 진행
            await generator.generate([reportRef.current]);
            
            alert('📥 리포트 다운로드가 완료되었습니다.');
        } catch (error) {
            console.error('Report generation failed:', error);
            alert('❌ 다운로드 중 오류가 발생했습니다.');
        } finally {
            setDownloading(false);
        }
    };

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
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 py-0.5 px-2 rounded-full">관리자 전용</span>
                    <span className="text-[12px] font-semibold text-slate-400 ml-2 hidden sm:inline-block">2026년 3월 기준 · 실시간 업데이트</span>
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
                {/* 모바일 화면용 필터 컨테이너 (작은 화면에서만 보임) */}
                <div className="flex sm:hidden items-center justify-between mb-6 gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500">2026년 3월 기준 · 실시간 업데이트</span>
                    <div className="flex items-center gap-2">
                        {(['week', 'month', 'quarter'] as Period[]).map(p => {
                            const labels: Record<Period, string> = { week: '주간', month: '월간', quarter: '분기' };
                            return (
                                <button key={p} onClick={() => setPeriod(p)}
                                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all border cursor-pointer ${period === p ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                                    {labels[p]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* PDF로 변환될 메인 컨텐츠 영역 */}
                <div ref={reportRef} className="rounded-xl overflow-hidden p-2 bg-slate-50">
                    {/* KPI 카드 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {kpiCards.map((kpi, i) => {
                            const Icon = kpi.icon;
                            // Tailwind CSS bg opacity trick: use rgba directly or define mapping if strictly needed. We will use a wrapper.
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
                                파이프라인 퍼널
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
                                        <span className="text-[10px] font-bold w-10 text-right text-slate-400">
                                            {f.width}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 월별 트렌드 (바 차트 CSS) */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                            <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                월별 성장 트렌드
                            </h2>
                            <div className="flex items-end gap-3 h-44">
                                {MONTHLY_TRENDS.map((m, i) => {
                                    const maxRevenue = Math.max(...MONTHLY_TRENDS.map(t => t.revenue));
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
                                    <span className="w-2 h-2 rounded-full bg-blue-500" /> 매출
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                    <span className="text-[10px] font-black text-amber-500">N</span> 계약 건수
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 담당자별 성과 테이블 */}
                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" />
                                영업 담당자별 성과
                            </h2>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                이번 달 기준
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50">
                                        {['순위', '담당자', '리드', '전화', '이메일', '계약 체결', '매출', '전환율'].map(h => (
                                            <th key={h} className="py-3 px-5 text-left text-[11px] font-extrabold text-slate-500 whitespace-nowrap min-w-[70px]">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {REP_PERFORMANCE.map((rep, i) => (
                                        <tr key={rep.name} className="transition-colors hover:bg-slate-50/50 bg-white">
                                            <td className="py-3 px-5">
                                                <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-black shadow-sm border ${i === 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : i === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' : i === 2 ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-slate-400 border-slate-100'}`}>
                                                    {i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : i + 1}
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
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${rep.rate >= 25 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                    {rep.rate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <span className="text-slate-500 font-bold shrink-0">📈 부서 총계</span>
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
                {/* 리포트 캡처 영역 끝 */}
            </div>
        </div>
    );
}