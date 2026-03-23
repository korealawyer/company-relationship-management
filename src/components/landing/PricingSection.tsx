'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Phone, CheckCircle2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { calcPrice, ADD_ONS, ADDITIONAL_SERVICES, PRICE_SAMPLES, fadeUp } from '@/lib/landingData';
import { PRICE_RANGES, INCLUDED_SERVICES, formatPriceMan } from '@/lib/pricing';

/* ── 구간 카드 ──────────────────────────────────────────── */
function RangeCards() {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="grid sm:grid-cols-3 gap-4 mb-8">
            {PRICE_RANGES.map((range) => (
                <div key={range.id}
                    className="relative p-5 rounded-2xl text-center transition-all hover:scale-[1.02]"
                    style={{
                        background: range.popular ? `${range.color}08` : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${range.popular ? range.color + '40' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    {range.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] px-3 py-1 rounded-full font-black"
                            style={{ background: range.color, color: '#04091a' }}>인기</span>
                    )}
                    <p className="text-xs font-bold mb-1" style={{ color: range.color }}>{range.name}</p>
                    <p className="text-2xl font-black mb-1" style={{ color: '#f0f4ff' }}>{range.priceRange}</p>
                    <p className="text-xs mb-3" style={{ color: 'rgba(240,244,255,0.4)' }}>가맹점 {range.storeRange}</p>
                    <div className="text-[10px] space-y-1">
                        {INCLUDED_SERVICES.slice(0, 3).map(s => (
                            <div key={s} className="flex items-center gap-1 justify-center" style={{ color: 'rgba(240,244,255,0.55)' }}>
                                <CheckCircle2 className="w-3 h-3" style={{ color: '#4ade80' }} /> {s}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </motion.div>
    );
}

/* ── 슬라이더 계산기 ────────────────────────────────────── */
function PriceCalculator() {
    const [storeCount, setStoreCount] = useState(30);
    const price = calcPrice(storeCount);

    return (
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <Card padding="lg" gold>
                <p className="font-black text-sm mb-1" style={{ color: '#e8c87a' }}>💡 내 가맹점 수로 계산하기</p>
                <p className="text-xs mb-5" style={{ color: 'rgba(201,168,76,0.6)' }}>슬라이더를 움직여 정확한 요금을 확인하세요</p>
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold" style={{ color: 'rgba(240,244,255,0.7)' }}>가맹점 수</span>
                        <span className="text-2xl font-black" style={{ color: '#e8c87a' }}>{storeCount}개</span>
                    </div>
                    <input type="range" min={1} max={200} value={storeCount}
                        onChange={e => setStoreCount(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: '#c9a84c', background: `linear-gradient(to right, #c9a84c ${(storeCount / 200) * 100}%, rgba(255,255,255,0.1) ${(storeCount / 200) * 100}%)` }} />
                    <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(240,244,255,0.3)' }}>
                        <span>1개</span><span>100개</span><span>200개</span>
                    </div>
                </div>
                <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                        <span className="text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>월 구독료</span>
                        <span className="text-2xl font-black" style={{ color: '#e8c87a' }}>
                            {formatPriceMan(price)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
                        <span className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>연간 구독료</span>
                        <span className="text-sm font-bold" style={{ color: 'rgba(240,244,255,0.6)' }}>
                            {formatPriceMan(price * 12)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>매장당 단가</span>
                        <span className="text-sm font-bold" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            {Math.round(price / storeCount).toLocaleString()}원/개
                        </span>
                    </div>
                </div>
                <Link href="/login">
                    <Button variant="premium" size="lg" className="w-full gap-2">
                        <Phone className="w-4 h-4" /> 이 요금으로 상담 신청
                    </Button>
                </Link>
                <p className="text-xs text-center mt-2" style={{ color: 'rgba(240,244,255,0.35)' }}>
                    최소 1년 약정 · VAT 별도 · 분기별 가맹점 수 기준 리베이스
                </p>
            </Card>
        </motion.div>
    );
}

export default function PricingSection() {
    return (
        <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: '#f0f4ff' }}>
                        <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>가맹점 수</span>에 따라 요금이 결정됩니다
                    </h2>
                    <p style={{ color: 'rgba(240,244,255,0.6)' }}>프리미엄 연간자문 (HQ+Store+Employee) · 1년 약정 · VAT 별도</p>
                </motion.div>

                {/* 구간 카드 3장 */}
                <RangeCards />

                {/* 슬라이더 + 샘플 가격표 */}
                <div className="grid lg:grid-cols-2 gap-8 mb-10">
                    <PriceCalculator />
                    <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                        <Card padding="md">
                            <p className="font-black text-sm mb-4 px-2" style={{ color: '#c9a84c' }}>샘플 가격표</p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                                        {['가맹점 수', '월 구독료', '매장당 단가'].map(h => (
                                            <th key={h} className="px-3 py-2 text-right text-xs font-bold first:text-left" style={{ color: 'rgba(201,168,76,0.7)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {PRICE_SAMPLES.map((row) => {
                                        const p = calcPrice(row.n);
                                        return (
                                            <tr key={row.n} className="transition-colors hover:bg-[rgba(201,168,76,0.04)]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td className="px-3 py-2.5 font-bold" style={{ color: '#f0f4ff' }}>{row.n}개</td>
                                                <td className="px-3 py-2.5 text-right font-black" style={{ color: '#c9a84c' }}>{formatPriceMan(p)}</td>
                                                <td className="px-3 py-2.5 text-right" style={{ color: 'rgba(240,244,255,0.5)' }}>{Math.round(p / row.n).toLocaleString()}원</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="px-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <p className="text-xs" style={{ color: 'rgba(240,244,255,0.35)' }}>
                                    ✅ 산정식: P(n) = ₩300,000 + ₩8,500 × (n - 1) · 200개+ Enterprise 별도 협의
                                </p>
                            </div>
                        </Card>
                        {/* Enterprise CTA */}
                        <div className="mt-4 p-4 rounded-xl text-center" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
                            <Building2 className="w-5 h-5 mx-auto mb-2" style={{ color: '#a78bfa' }} />
                            <p className="text-sm font-bold mb-1" style={{ color: '#f0f4ff' }}>200개 이상 대형 본사</p>
                            <p className="text-xs mb-2" style={{ color: 'rgba(240,244,255,0.4)' }}>전담 변호사팀 배정 · 맞춤 서비스 설계</p>
                            <Link href="/login">
                                <button className="text-xs font-bold px-4 py-2 rounded-lg" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                                    Enterprise 상담 →
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* 외부 로펌 vs IBS 비교 */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-10">
                    <Card padding="lg">
                        <div className="text-center mb-6">
                            <p className="text-xs font-bold mb-2" style={{ color: 'rgba(201,168,76,0.7)' }}>💰 비용 비교</p>
                            <h3 className="font-black text-xl" style={{ color: '#f0f4ff' }}>
                                외부 로펌 이용 vs{' '}
                                <span style={{ color: '#c9a84c' }}>IBS 플랫폼</span>
                            </h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {/* 외부 로펌 */}
                            <div className="p-5 rounded-xl" style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.15)' }}>
                                <p className="font-black text-sm mb-4" style={{ color: '#f87171' }}>🏛 외부 로펌 개별 이용 시</p>
                                <div className="space-y-2">
                                    {[
                                        { label: '법률 자문', cost: '월 500만원' },
                                        { label: '계약서 검토', cost: '건당 100만원' },
                                        { label: '개인정보 컨설팅', cost: '300만원/회' },
                                        { label: '노무 자문', cost: '월 200만원' },
                                        { label: '소송 관리', cost: '착수금 별도' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <span className="text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>{item.label}</span>
                                            <span className="text-sm font-bold" style={{ color: '#f87171' }}>{item.cost}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-3 text-right" style={{ borderTop: '1px solid rgba(248,113,113,0.2)' }}>
                                    <span className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>월 합계 (추정)</span>
                                    <p className="font-black text-2xl" style={{ color: '#f87171' }}>~900만원+</p>
                                </div>
                            </div>
                            {/* IBS */}
                            <div className="p-5 rounded-xl" style={{ background: 'rgba(74,222,128,0.04)', border: '1.5px solid rgba(74,222,128,0.25)' }}>
                                <p className="font-black text-sm mb-4" style={{ color: '#4ade80' }}>⚡ IBS 플랫폼 구독 시</p>
                                <div className="space-y-2">
                                    {[
                                        { label: '법률 자문', cost: '무제한 포함' },
                                        { label: '가맹점 BACKCALL', cost: '무제한 포함' },
                                        { label: '임직원 법률상담', cost: '무제한 포함' },
                                        { label: '분기 리스크 브리핑', cost: '연 4회 포함' },
                                        { label: '법률 문서 2,000종', cost: '포함' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <span className="text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>{item.label}</span>
                                            <span className="text-sm font-bold" style={{ color: '#4ade80' }}>{item.cost}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-3 text-right" style={{ borderTop: '1px solid rgba(74,222,128,0.2)' }}>
                                    <span className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>월 구독료</span>
                                    <p className="font-black text-2xl" style={{ color: '#4ade80' }}>30만원~</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
                            <p className="text-xs mb-1" style={{ color: 'rgba(240,244,255,0.4)' }}>연간 절감 (추정)</p>
                            <p className="font-black text-3xl" style={{ background: 'linear-gradient(135deg,#e8c87a,#4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                최대 1억원+
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'rgba(240,244,255,0.5)' }}>쓰지 않는 것이 오히려 손해입니다</p>
                        </div>
                    </Card>
                </motion.div>

                {/* 포함 서비스 */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-10">
                    <Card padding="lg" gold>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1">
                                <p className="font-black text-base mb-3" style={{ color: '#e8c87a' }}>
                                    ✅ 전 구간 동일 — 5대 서비스 모두 포함
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {INCLUDED_SERVICES.map(s => (
                                        <div key={s} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(240,244,255,0.7)' }}>
                                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} /> {s}
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(250,204,21,0.6)' }} /> EAP 심리상담 (2026.04~)
                                    </div>
                                </div>
                            </div>
                            <div className="text-center flex-shrink-0">
                                <div className="text-sm mb-1" style={{ color: 'rgba(201,168,76,0.7)' }}>가맹점 1개부터</div>
                                <div className="text-4xl font-black" style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>월 30만원~</div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* 애드온 */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-10">
                    <h3 className="text-xl font-black mb-5" style={{ color: '#f0f4ff' }}>
                        <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>애드온</span> 모듈
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {ADD_ONS.map((addon, i) => (
                            <Card key={i} padding="md">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: `${addon.tagColor}18`, color: addon.tagColor, border: `1px solid ${addon.tagColor}30` }}>
                                        {addon.tag}
                                    </span>
                                </div>
                                <p className="font-black text-sm mb-0.5" style={{ color: '#f0f4ff' }}>{addon.title}</p>
                                <p className="text-xs mb-2" style={{ color: 'rgba(240,244,255,0.45)' }}>{addon.sub}</p>
                                <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(240,244,255,0.6)' }}>{addon.desc}</p>
                                <div className="text-xs font-bold" style={{ color: '#c9a84c' }}>💬 {addon.price}</div>
                            </Card>
                        ))}
                    </div>
                </motion.div>

                {/* 추가 서비스 테이블 */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                    <h3 className="text-xl font-black mb-5" style={{ color: '#f0f4ff' }}>
                        <span style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>추가 서비스</span> — 구독 시 최대 50% 할인
                    </h3>
                    <Card padding="sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                                        {['서비스명', '정가', '구독 시', '비고'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-bold" style={{ color: 'rgba(201,168,76,0.7)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ADDITIONAL_SERVICES.map((svc, i) => (
                                        <tr key={i} className="transition-colors hover:bg-[rgba(201,168,76,0.04)]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td className="px-4 py-3 font-semibold" style={{ color: '#f0f4ff' }}>{svc.name}</td>
                                            <td className="px-4 py-3" style={{ color: 'rgba(240,244,255,0.5)', textDecoration: 'line-through' }}>{svc.regular}</td>
                                            <td className="px-4 py-3 font-black" style={{ color: svc.subscriber === '무상 제공' ? '#4ade80' : '#c9a84c' }}>{svc.subscriber}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>{svc.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </motion.div>

                {/* Risk reversal */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-10 text-center">
                    <div className="inline-flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>
                        {['언제든 취소 가능', '30일 환불 보장', '카드/계좌이체 가능', 'VAT 별도'].map((t) => (
                            <span key={t} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-green-400" /> {t}
                            </span>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
