'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Phone, Award, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { calcPrice, calcVoucher, ADD_ONS, ADDITIONAL_SERVICES, PRICE_SAMPLES, fadeUp } from '@/lib/landingData';

function PriceCalculator() {
    const [storeCount, setStoreCount] = useState(30);
    const price = calcPrice(storeCount);
    const voucher = calcVoucher(storeCount);
    const net = price - voucher;

    return (
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <Card padding="lg" gold>
                <p className="font-black text-sm mb-1" style={{ color: '#e8c87a' }}>💡 내 가맹점 수로 계산하기</p>
                <p className="text-xs mb-5" style={{ color: 'rgba(201,168,76,0.6)' }}>슬라이더를 움직여 예상 요금을 확인하세요</p>
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
                    {[
                        { label: '월 정가', value: `${(price / 10000).toFixed(1)}만원`, color: 'rgba(240,244,255,0.6)', strike: true },
                        { label: '월 바우처 (50%)', value: `-${(voucher / 10000).toFixed(1)}만원`, color: '#4ade80', strike: false },
                        { label: '첫 6개월 실부담', value: `${(net / 10000).toFixed(1)}만원/월`, color: '#e8c87a', strike: false, big: true },
                    ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                            <span className="text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>{row.label}</span>
                            <span className={`font-black ${row.big ? 'text-xl' : 'text-base'}`}
                                style={{ color: row.color, textDecoration: row.strike ? 'line-through' : 'none' }}>
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="text-xs mb-5" style={{ color: 'rgba(201,168,76,0.6)' }}>
                    12개월 바우처 총액: <strong style={{ color: '#c9a84c' }}>{Math.round(voucher * 12 / 10000)}만원</strong> (Add-on·추가서비스·수임료 할인 사용 가능)
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

                <div className="grid lg:grid-cols-2 gap-8 mb-10">
                    <PriceCalculator />
                    <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                        <Card padding="md">
                            <p className="font-black text-sm mb-4 px-2" style={{ color: '#c9a84c' }}>샘플 가격표</p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                                        {['가맹점 수', '월 요금', '바우처(월)', '실부담'].map(h => (
                                            <th key={h} className="px-3 py-2 text-right text-xs font-bold first:text-left" style={{ color: 'rgba(201,168,76,0.7)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {PRICE_SAMPLES.map((row) => {
                                        const p = calcPrice(row.n);
                                        const v = calcVoucher(row.n);
                                        return (
                                            <tr key={row.n} className="transition-colors hover:bg-[rgba(201,168,76,0.04)]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td className="px-3 py-2.5 font-bold" style={{ color: '#f0f4ff' }}>{row.n}개</td>
                                                <td className="px-3 py-2.5 text-right" style={{ color: 'rgba(240,244,255,0.7)' }}>{(p / 10000).toFixed(1)}만원</td>
                                                <td className="px-3 py-2.5 text-right" style={{ color: '#4ade80' }}>-{(v / 10000).toFixed(1)}만원</td>
                                                <td className="px-3 py-2.5 text-right font-black" style={{ color: '#c9a84c' }}>{((p - v) / 10000).toFixed(1)}만원</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <p className="text-xs px-3 pt-3" style={{ color: 'rgba(240,244,255,0.35)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                ✅ 바우처: 12개월간 월 구독료 50% 크레딧 적립 · 첫 6개월은 Base 구독료에 직접 적용 가능
                            </p>
                        </Card>
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
                                        { label: '계약서 검토', cost: '무제한 포함' },
                                        { label: '개인정보 자동진단', cost: '무제한 포함' },
                                        { label: '노무·경영 자문', cost: '포함' },
                                        { label: '경영 대시보드', cost: '무제한 포함' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <span className="text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>{item.label}</span>
                                            <span className="text-sm font-bold" style={{ color: '#4ade80' }}>{item.cost}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-3 text-right" style={{ borderTop: '1px solid rgba(74,222,128,0.2)' }}>
                                    <span className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>월 구독료</span>
                                    <p className="font-black text-2xl" style={{ color: '#4ade80' }}>49만원~</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
                            <p className="text-xs mb-1" style={{ color: 'rgba(240,244,255,0.4)' }}>연간 절감 (추정)</p>
                            <p className="font-black text-3xl" style={{ background: 'linear-gradient(135deg,#e8c87a,#4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                약 7,800만원
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'rgba(240,244,255,0.5)' }}>쓰지 않는 것이 오히려 손해입니다</p>
                        </div>
                    </Card>
                </motion.div>

                {/* 바우처 강조 */}
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-10">
                    <Card padding="lg" gold>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="w-5 h-5" style={{ color: '#c9a84c' }} />
                                    <span className="font-black text-base" style={{ color: '#e8c87a' }}>신규 계약 바우처 혜택 — 12개월간 실질 50% 할인 효과</span>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.65)' }}>
                                    계약 후 12개월간 매월 구독료의 50% 크레딧 적립. 첫 6개월은 Base 구독료에 직접 사용(월 최대 50%). 잔여 크레딧은 애드온·추가 서비스·소송 수임료 할인에 활용 가능.
                                </p>
                            </div>
                            <div className="text-center flex-shrink-0">
                                <div className="text-4xl font-black" style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>600만원</div>
                                <div className="text-xs mt-1" style={{ color: 'rgba(201,168,76,0.7)' }}>가맹점 100개 기준 12개월 바우처</div>
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
