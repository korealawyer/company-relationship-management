'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator, TrendingDown, ChevronRight, Copy, Check,
    Send, Printer, Shield, Phone, FileText, Users, BarChart3,
    Share2, Sparkles, Info, Heart, ArrowLeft,
    ChevronDown, Zap, Mic, LayoutDashboard, Headphones,
} from 'lucide-react';
import Link from 'next/link';
import {
    calcPrice, calcBreakdown, formatPrice, formatPriceMan,
    PRICE_RANGES, INCLUDED_SERVICES_FULL, ADD_ON_SERVICES,
    DEGRESSIVE_BANDS, TIER_ENTRY, TIER_GROWTH, TIER_SCALE,
} from '@/lib/pricing';

/* ── 라이트 디자인 토큰 ── */
const C = {
    // 배경
    bg: '#F4F5FB',
    pageBg: '#F4F5FB',
    card: '#FFFFFF',
    cardAccent: '#1B2559',      // 결과 영역
    cardAccent2: '#253272',
    // 텍스트
    text1: '#1A1A1A',
    text2: '#4A4A4A',
    text3: '#8E8E93',
    textWhite: '#F2F2F7',
    // Accent — 골드
    gold: '#B8941F',
    goldDark: '#917310',
    goldBg: 'rgba(212,168,83,0.08)',
    goldBorder: 'rgba(212,168,83,0.25)',
    // Semantic
    success: '#00A85A',
    warning: '#E08600',
    danger: '#E53E3E',
    info: '#2563EB',
    // Border
    border: '#E5E7EB',
    borderStrong: '#D1D5DB',
};

/* ── 숫자 카운트업 (토스 스타일) ── */
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            {prefix}{formatPrice(value)}{suffix}
        </motion.span>
    );
}

/* ── 퀵 프리셋 ── */
const PRESETS = [5, 10, 30, 50, 100, 200, 300, 500, 1000];

/* ── 메인 ── */
export default function PricingCalculatorPage() {
    const [storeCount, setStoreCount] = useState(30);
    const [copied, setCopied] = useState(false);
    const [showQuote, setShowQuote] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientCompany, setClientCompany] = useState('');
    const [showBreakdown, setShowBreakdown] = useState(true);

    const breakdown = useMemo(() => calcBreakdown(storeCount), [storeCount]);
    const perStore = breakdown.perStoreMonthly;

    const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setStoreCount(parseInt(e.target.value));
    }, []);

    const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseInt(e.target.value) || 0;
        setStoreCount(Math.min(1500, Math.max(1, v)));
    }, []);

    const copyQuote = useCallback(() => {
        const lines = [
            `[IBS 법률사무소] ${clientCompany || '프랜차이즈'} 맞춤 견적`,
            ``, `── 요금 내역 ──`,
            `가맹점 수: ${storeCount}개`,
            `적용 구간: ${breakdown.tierName} (${breakdown.tierNameKo})`,
            `월 자문료: ₩${formatPrice(breakdown.totalMonthly)} (VAT 별도)`,
            `연간 비용: ₩${formatPrice(breakdown.totalYearly)}`,
            `매장당 월: ₩${formatPrice(perStore)}`,
            ``, `── 포함 서비스 ──`,
            ...INCLUDED_SERVICES_FULL.map(s => `  ✅ ${s}`),
            ``, `── 구독 할인 ──`,
            ...ADD_ON_SERVICES.map(s => `  · ${s.name}: ${s.retail} → ${s.subscriber}`),
            ``, `📞 IBS 법률사무소 | ibslaw.co.kr`,
        ];
        navigator.clipboard.writeText(lines.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [storeCount, breakdown, perStore, clientCompany]);

    const sliderPercent = Math.min(100, (storeCount / 1000) * 100);

    const comparisons = useMemo(() => [
        { stores: 10, us: calcPrice(10), forestOk: true },
        { stores: 50, us: calcPrice(50), forestOk: true },
        { stores: 100, us: calcPrice(100), forestOk: true },
        { stores: 200, us: calcPrice(200), forestOk: false },
        { stores: 500, us: calcPrice(500), forestOk: false },
        { stores: 1000, us: calcPrice(1000), forestOk: false },
    ], []);

    return (
        <div className="min-h-screen" style={{ background: C.pageBg, fontFamily: "'Pretendard', -apple-system, 'Apple SD Gothic Neo', sans-serif" }}>
            {/* ── 상단 서브 네비 ── */}
            <div className="sticky top-0 z-40 px-4 py-3" style={{
                background: 'rgba(244,245,251,0.92)',
                backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${C.border}`,
            }}>
                <div className="max-w-2xl mx-auto flex gap-2 items-center overflow-x-auto pb-1">
                    <Link href="/employee" className="flex-shrink-0"><button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{background:C.card,border:`1px solid ${C.border}`,color:C.text2}}><LayoutDashboard className="w-3.5 h-3.5 hidden sm:block"/> 대시보드</button></Link>
                    <Link href="/sales/call" className="flex-shrink-0"><button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{background:C.card,border:`1px solid ${C.border}`,color:C.text2}}><Headphones className="w-3.5 h-3.5 hidden sm:block"/> 전화 영업</button></Link>
                    <Link href="/sales/voice-memo" className="flex-shrink-0"><button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{background:C.card,border:`1px solid ${C.border}`,color:C.text2}}><Mic className="w-3.5 h-3.5 hidden sm:block"/> 음성 메모</button></Link>
                    <Link href="/sales/pricing-calculator" className="flex-shrink-0"><button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{background:'#FDF9F0',border:`1px solid ${C.goldBorder}`,color:C.goldDark}}><Calculator className="w-3.5 h-3.5 hidden sm:block"/> 견적 계산기</button></Link>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

                {/* ══════════ 히어로 카드: 가격 계산 ══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl overflow-hidden mb-5"
                    style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    {/* 입력부 */}
                    <div className="p-5 pb-4">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="text-xs font-bold mb-0.5" style={{ color: C.text3 }}>가맹점 수</div>
                                <div className="text-sm" style={{ color: C.text2 }}>슬라이더를 움직이거나 직접 입력하세요</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="number" value={storeCount} onChange={handleInput}
                                    className="w-20 text-right text-2xl font-black px-2 py-1.5 rounded-xl"
                                    style={{
                                        color: C.goldDark, background: C.goldBg,
                                        border: `2px solid ${C.goldBorder}`, outline: 'none',
                                    }}
                                    min={1} max={1500}
                                />
                                <span className="text-sm font-bold" style={{ color: C.text3 }}>개</span>
                            </div>
                        </div>

                        {/* 슬라이더 */}
                        <input
                            type="range" min={1} max={1000} value={Math.min(storeCount, 1000)}
                            onChange={handleSlider}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer mb-1"
                            style={{
                                background: `linear-gradient(to right, ${C.gold} 0%, ${C.gold} ${sliderPercent}%, #E5E7EB ${sliderPercent}%, #E5E7EB 100%)`,
                            }}
                        />
                        <div className="flex justify-between text-[10px]" style={{ color: C.text3 }}>
                            <span>1</span><span>100</span><span>200</span><span>500</span><span>1,000</span>
                        </div>

                        {/* 퀵 프리셋 */}
                        <div className="flex flex-wrap gap-1.5 mt-4">
                            {PRESETS.map(n => (
                                <button key={n} onClick={() => setStoreCount(n)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={{
                                        background: storeCount === n ? C.gold : '#F3F4F6',
                                        color: storeCount === n ? '#FFF' : C.text2,
                                        border: `1px solid ${storeCount === n ? C.gold : C.border}`,
                                    }}>
                                    {n}개
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 결과 (딥블루 배경 — 숫자 주인공) */}
                    <div className="p-6" style={{ background: `linear-gradient(135deg, ${C.cardAccent}, ${C.cardAccent2})` }}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black"
                                style={{ background: '#D4A853', color: '#1B2559' }}>
                                {breakdown.tierName}
                            </span>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                {breakdown.tierNameKo} · {storeCount}개 가맹점
                            </span>
                        </div>

                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>월</span>
                            <span className="text-4xl font-black tracking-tight" style={{ color: '#FFFFFF' }}>
                                <AnimatedNumber value={breakdown.totalMonthly} prefix="₩" />
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: '연간 비용', value: `₩${formatPrice(breakdown.totalYearly)}`, sub: 'VAT 별도', icon: '📊' },
                                { label: '매장당', value: `₩${formatPrice(perStore)}`, sub: '월 기준', icon: '🏪' },
                                { label: '하루', value: `₩${formatPrice(Math.round(perStore / 30))}`, sub: '커피 한 잔값', icon: '☕' },
                            ].map(item => (
                                <div key={item.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.icon} {item.label}</div>
                                    <div className="text-sm font-black" style={{ color: '#FFFFFF' }}>{item.value}</div>
                                    <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ══════════ 산정 내역 ══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="rounded-2xl overflow-hidden mb-5"
                    style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    <button onClick={() => setShowBreakdown(!showBreakdown)}
                        className="w-full flex items-center justify-between p-4 text-left">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" style={{ color: C.info }} />
                            <span className="text-sm font-bold" style={{ color: C.text1 }}>산정 내역 (체감 요율 방식)</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} style={{ color: C.text3 }} />
                    </button>

                    <AnimatePresence>
                        {showBreakdown && (
                            <motion.div
                                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 space-y-1.5">
                                    {[
                                        { label: '1~10개', rate: '고정', price: TIER_ENTRY, active: storeCount >= 1 && storeCount <= 10 },
                                        { label: '11~50개', rate: '고정', price: TIER_GROWTH, active: storeCount >= 11 && storeCount <= 50 },
                                        { label: '51~100개', rate: '고정', price: TIER_SCALE, active: storeCount >= 51 && storeCount <= 100 },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all"
                                            style={{
                                                background: row.active ? C.goldBg : '#F9FAFB',
                                                border: `1px solid ${row.active ? C.goldBorder : C.border}`,
                                            }}>
                                            <span className="font-bold" style={{ color: row.active ? C.goldDark : C.text2 }}>
                                                {row.active && '▸ '}{row.label}
                                            </span>
                                            <span style={{ color: C.text3 }}>{row.rate}</span>
                                            <span className="font-black" style={{ color: row.active ? C.goldDark : C.text2 }}>
                                                {formatPriceMan(row.price)}
                                            </span>
                                        </div>
                                    ))}

                                    {DEGRESSIVE_BANDS.map((band, i) => {
                                        const active = storeCount >= band.from && storeCount <= band.to;
                                        return (
                                            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all"
                                                style={{
                                                    background: active ? C.goldBg : '#F9FAFB',
                                                    border: `1px solid ${active ? C.goldBorder : C.border}`,
                                                }}>
                                                <span className="font-bold" style={{ color: active ? C.goldDark : C.text2 }}>
                                                    {active && '▸ '}{band.from}~{band.to}개
                                                </span>
                                                <span style={{ color: C.text3 }}>+₩{formatPrice(band.perStore)}/개</span>
                                                <span className="font-black" style={{ color: active ? C.goldDark : C.text2 }}>
                                                    {active
                                                        ? `${formatPriceMan(band.base)} + ${formatPrice(band.perStore)} × ${storeCount - band.from + 1}`
                                                        : `${formatPriceMan(band.base)}~`
                                                    }
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mx-4 mb-4 flex items-center justify-between p-4 rounded-xl"
                                    style={{ background: C.cardAccent, border: `1px solid rgba(212,168,83,0.4)` }}>
                                    <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                        {storeCount}개 · {breakdown.tierName}
                                    </span>
                                    <span className="text-lg font-black" style={{ color: '#D4A853' }}>
                                        월 {formatPriceMan(breakdown.totalMonthly)}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ══════════ 포함 서비스 ══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="rounded-2xl p-5 mb-5"
                    style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: C.text1 }}>
                        <Shield className="w-4 h-4" style={{ color: C.success }} />
                        전 구간 포함 서비스
                    </h2>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { icon: <FileText className="w-4 h-4" />, label: '본사 법률자문', sub: '무제한', color: C.info },
                            { icon: <Phone className="w-4 h-4" />, label: '가맹점 BACKCALL', sub: '법률상담', color: C.success },
                            { icon: <Users className="w-4 h-4" />, label: '임직원 상담', sub: 'BACKCALL', color: '#7C3AED' },
                            { icon: <BarChart3 className="w-4 h-4" />, label: '리스크 브리핑', sub: '연 4회', color: C.warning },
                            { icon: <FileText className="w-4 h-4" />, label: '법률 문서', sub: '2,000종', color: C.gold },
                            { icon: <Heart className="w-4 h-4" />, label: 'EAP 심리상담', sub: '2026.04~', color: C.danger },
                        ].map(s => (
                            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl"
                                style={{ background: '#F9FAFB', border: `1px solid ${C.border}` }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                                <div>
                                    <div className="text-xs font-bold" style={{ color: C.text1 }}>{s.label}</div>
                                    <div className="text-[10px]" style={{ color: C.text3 }}>{s.sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                        <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: C.text1 }}>
                            <Sparkles className="w-3.5 h-3.5" style={{ color: C.gold }} />
                            구독 할인 서비스
                        </h3>
                        <div className="space-y-1.5">
                            {ADD_ON_SERVICES.map(s => (
                                <div key={s.name} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg"
                                    style={{ background: '#F9FAFB' }}>
                                    <span className="font-medium" style={{ color: C.text2 }}>{s.name}</span>
                                    <span>
                                        <span className="line-through mr-2" style={{ color: C.text3 }}>{s.retail}</span>
                                        <span className="font-black" style={{ color: C.success }}>{s.subscriber}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ══════════ 주요 구간 요금표 ══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="rounded-2xl overflow-hidden mb-5"
                    style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    <div className="p-4 pb-2">
                        <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: C.text1 }}>
                            📊 주요 구간 요금표
                        </h2>
                        <p className="text-[10px] mt-0.5" style={{ color: C.text3 }}>행을 탭하면 해당 가맹점 수로 이동합니다</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr style={{ background: '#F9FAFB' }}>
                                    <th className="text-left px-4 py-2.5 font-bold" style={{ color: C.text3 }}>가맹점</th>
                                    <th className="text-right px-4 py-2.5 font-bold" style={{ color: C.text3 }}>월 요금</th>
                                    <th className="text-right px-4 py-2.5 font-bold" style={{ color: C.text3 }}>매장당 월</th>
                                    <th className="text-right px-4 py-2.5 font-bold" style={{ color: C.text3 }}>매장당 일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 5, 10, 20, 30, 50, 80, 100, 150, 200, 300, 500, 700, 1000].map(n => {
                                    const p = calcPrice(n);
                                    const ps = Math.round(p / n);
                                    const pd = Math.round(ps / 30);
                                    const isActive = n === storeCount;
                                    return (
                                        <tr key={n}
                                            onClick={() => setStoreCount(n)}
                                            className="cursor-pointer transition-all"
                                            style={{
                                                borderBottom: `1px solid ${C.border}`,
                                                background: isActive ? C.goldBg : undefined,
                                            }}
                                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F9FAFB'; }}
                                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = ''; }}
                                        >
                                            <td className="px-4 py-2.5 font-bold" style={{ color: isActive ? C.goldDark : C.text1 }}>
                                                {isActive && '▸ '}{n}개
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-black" style={{ color: isActive ? C.goldDark : C.text1 }}>
                                                {formatPriceMan(p)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right" style={{ color: C.text2 }}>
                                                ₩{formatPrice(ps)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right" style={{ color: C.text3 }}>
                                                ₩{formatPrice(pd)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* ══════════ 경쟁사 비교 ══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl p-5 mb-5"
                    style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: C.text1 }}>
                        <Zap className="w-4 h-4" style={{ color: C.warning }} />
                        IBS vs 법무법인 숲 비교
                    </h2>
                    <table className="w-full text-xs">
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                                <th className="text-left py-2 font-bold" style={{ color: C.text3 }}>가맹점</th>
                                <th className="text-right py-2 font-bold" style={{ color: C.goldDark }}>IBS</th>
                                <th className="text-right py-2 font-bold" style={{ color: C.text3 }}>숲</th>
                                <th className="text-right py-2 font-bold" style={{ color: C.text3 }}>비교</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisons.map(row => (
                                <tr key={row.stores} style={{ borderBottom: `1px solid ${C.border}` }}>
                                    <td className="py-2.5 font-bold" style={{ color: C.text1 }}>{row.stores}개</td>
                                    <td className="py-2.5 text-right font-black" style={{ color: C.goldDark }}>
                                        {formatPriceMan(row.us)}
                                    </td>
                                    <td className="py-2.5 text-right" style={{ color: C.text2 }}>
                                        {row.forestOk ? `${formatPriceMan(row.us)}~` : '—'}
                                    </td>
                                    <td className="py-2.5 text-right font-bold" style={{ color: row.forestOk ? C.success : C.info }}>
                                        {row.forestOk ? '✅ 동일 가격' : '🔵 독점 서비스'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(0,168,90,0.06)', border: `1px solid rgba(0,168,90,0.15)` }}>
                        <span className="text-[11px] font-bold" style={{ color: C.success }}>✅ IBS만 제공:</span>{' '}
                        <span className="text-[11px]" style={{ color: C.text2 }}>
                            가맹점 BACKCALL · 임직원 상담 · 리스크 브리핑 · 문서 2,000종 · EAP
                        </span>
                    </div>
                </motion.div>

                {/* ══════════ 견적서 생성 ══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="rounded-2xl overflow-hidden mb-5"
                    style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    <div className="p-5">
                        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: C.text1 }}>
                            <Share2 className="w-4 h-4" style={{ color: C.info }} />
                            견적서 생성 · 공유
                        </h2>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="text-[10px] font-bold block mb-1" style={{ color: C.text3 }}>고객사명 <span style={{ color: C.danger }}>*</span></label>
                                <input
                                    type="text" value={clientCompany} onChange={e => setClientCompany(e.target.value)}
                                    placeholder="예: ○○치킨 본사"
                                    className="w-full px-3 py-2.5 rounded-xl text-xs"
                                    style={{ background: '#F9FAFB', border: `1px solid ${C.border}`, outline: 'none', color: C.text1 }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold block mb-1" style={{ color: C.text3 }}>담당자명</label>
                                <input
                                    type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                                    placeholder="예: 김대표"
                                    className="w-full px-3 py-2.5 rounded-xl text-xs"
                                    style={{ background: '#F9FAFB', border: `1px solid ${C.border}`, outline: 'none', color: C.text1 }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowQuote(!showQuote)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold mb-3 transition-all"
                            style={{ background: '#F9FAFB', border: `1px solid ${C.border}`, color: C.text1 }}
                        >
                            <span>📋 견적서 미리보기</span>
                            <ChevronRight className={`w-4 h-4 transition-transform ${showQuote ? 'rotate-90' : ''}`} style={{ color: C.text3 }} />
                        </button>

                        <AnimatePresence>
                            {showQuote && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="rounded-2xl p-5 mb-4 overflow-hidden"
                                    id="quote-preview"
                                    style={{ background: '#FAFBFC', border: `1px solid ${C.borderStrong}` }}
                                >
                                    <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: `2px solid ${C.gold}` }}>
                                        <div>
                                            <div className="text-lg font-black" style={{ color: C.text1 }}>IBS 법률사무소</div>
                                            <div className="text-[10px]" style={{ color: C.text3 }}>프랜차이즈 전문 법률 자문</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold" style={{ color: C.gold }}>맞춤 견적서</div>
                                            <div className="text-[10px]" style={{ color: C.text3 }}>
                                                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>

                                    {(clientCompany || clientName) && (
                                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                                            <div className="p-2.5 rounded-lg" style={{ background: '#F3F4F6' }}>
                                                <span style={{ color: C.text3 }}>고객사: </span>
                                                <span className="font-bold" style={{ color: C.text1 }}>{clientCompany || '-'}</span>
                                            </div>
                                            <div className="p-2.5 rounded-lg" style={{ background: '#F3F4F6' }}>
                                                <span style={{ color: C.text3 }}>담당자: </span>
                                                <span className="font-bold" style={{ color: C.text1 }}>{clientName || '-'}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 rounded-xl mb-3" style={{ background: '#F3F4F6', border: `1px solid ${C.border}` }}>
                                        <div className="text-xs font-bold mb-2" style={{ color: C.text1 }}>요금 내역</div>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between">
                                                <span style={{ color: C.text3 }}>가맹점 수</span>
                                                <span className="font-bold" style={{ color: C.text1 }}>{storeCount}개</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span style={{ color: C.text3 }}>적용 구간</span>
                                                <span className="font-bold" style={{ color: C.text1 }}>{breakdown.tierName} ({breakdown.tierNameKo})</span>
                                            </div>
                                            {storeCount > 100 && breakdown.additionalStores > 0 && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span style={{ color: C.text3 }}>기본 요금</span>
                                                        <span style={{ color: C.text1 }}>₩{formatPrice(breakdown.baseAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span style={{ color: C.text3 }}>추가 ({breakdown.additionalStores}개 × ₩{formatPrice(breakdown.perStoreRate)})</span>
                                                        <span style={{ color: C.text1 }}>₩{formatPrice(breakdown.additionalAmount)}</span>
                                                    </div>
                                                </>
                                            )}
                                            <div className="flex justify-between pt-2 mt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                                                <span className="font-black" style={{ color: C.text1 }}>월 자문료 (VAT 별도)</span>
                                                <span className="font-black text-base" style={{ color: C.goldDark }}>₩{formatPrice(breakdown.totalMonthly)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span style={{ color: C.text3 }}>연간 비용</span>
                                                <span className="font-bold" style={{ color: C.text1 }}>₩{formatPrice(breakdown.totalYearly)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl" style={{ background: '#F3F4F6', border: `1px solid ${C.border}` }}>
                                        <div className="text-xs font-bold mb-2" style={{ color: C.text1 }}>포함 서비스 (전 구간 동일)</div>
                                        <div className="space-y-1 text-xs">
                                            {INCLUDED_SERVICES_FULL.map(s => (
                                                <div key={s} style={{ color: C.text2 }}>✅ {s}</div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={copyQuote}
                                className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-bold transition-all"
                                style={{ background: C.cardAccent, color: '#FFF' }}>
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? '완료!' : '복사'}
                            </button>
                            <button onClick={() => window.print()}
                                className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-bold transition-all"
                                style={{ background: '#F3F4F6', color: C.text1, border: `1px solid ${C.border}` }}>
                                <Printer className="w-3.5 h-3.5" />
                                인쇄
                            </button>
                            <button
                                className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-bold transition-all"
                                style={{ background: 'rgba(37,99,235,0.06)', color: C.info, border: `1px solid rgba(37,99,235,0.2)` }}>
                                <Send className="w-3.5 h-3.5" />
                                이메일
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ══════════ 요율 설명 ══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl p-5"
                    style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                    <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: C.text1 }}>
                        <Info className="w-4 h-4" style={{ color: C.gold }} />
                        요금 산정 원리
                    </h2>
                    <div className="space-y-3 text-xs leading-relaxed" style={{ color: C.text2 }}>
                        <p>
                            IBS 법률사무소는 <b style={{ color: C.text1 }}>체감 요율 방식</b>을 적용합니다.
                            가맹점 수가 많아질수록 <b style={{ color: C.success }}>매장당 추가 단가가 낮아져</b>,
                            대형 프랜차이즈일수록 합리적인 비용으로 이용하실 수 있습니다.
                        </p>
                        <div className="p-3 rounded-xl" style={{ background: '#F9FAFB', border: `1px solid ${C.border}` }}>
                            <div className="font-bold mb-2" style={{ color: C.text1 }}>구간별 매장당 추가 단가</div>
                            <div className="space-y-1">
                                {[
                                    { range: '1~100개', rate: '고정가 (33/55/110만원)', color: C.goldDark },
                                    { range: '101~200개', rate: '매장당 ₩6,000', color: C.gold },
                                    { range: '201~300개', rate: '매장당 ₩5,000', color: C.gold },
                                    { range: '301~500개', rate: '매장당 ₩4,000', color: C.gold },
                                    { range: '501~1000개', rate: '매장당 ₩2,000', color: C.gold },
                                ].map(item => (
                                    <div key={item.range} className="flex items-center justify-between">
                                        <span style={{ color: C.text2 }}>{item.range}</span>
                                        <span className="font-bold" style={{ color: item.color }}>{item.rate}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-[10px]" style={{ color: C.text3 }}>
                            ※ 모든 요금은 VAT 별도 · 1년 약정 기준입니다. 1,000개 이상은 별도 협의해 주세요.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
