'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Scale, MessageSquare, Shield, Users,
    CheckCircle2, ArrowRight, Clock, Star, ChevronDown,
    CreditCard, Phone, BadgeCheck, AlertTriangle,
    FileSignature, Gavel, Building2, Briefcase,
} from 'lucide-react';
import Link from 'next/link';

// ── 서비스 메뉴 ───────────────────────────────────────
const SERVICES = [
    {
        id: 'contract-review',
        category: '계약·검토',
        icon: FileText,
        color: '#60a5fa',
        title: '계약서 검토',
        subtitle: '가맹계약 · 임대차 · 용역 · 근로계약',
        desc: '계약서에 숨은 독소 조항을 잡습니다. 서명 전에 확인하세요.',
        price: 150000,
        turnaround: '24시간',
        includes: ['조항별 리스크 분석', '수정 권고안', '담당 변호사 서면 의견'],
        popular: false,
    },
    {
        id: 'privacy-policy',
        category: '개인정보',
        icon: Shield,
        color: '#c9a84c',
        title: '개인정보처리방침 검토·작성',
        subtitle: '가맹점 · 온라인 쇼핑몰 · 기업 HR',
        desc: '과태료 최대 5천만원. 한 번 제대로 잡아두면 반복청구 없습니다.',
        price: 180000,
        turnaround: '48시간',
        includes: ['법정 기재사항 전체 점검', '위반 항목 수정안 제공', '처리방침 완성본 작성'],
        popular: true,
    },
    {
        id: 'content-certificate',
        category: '문서 작성',
        icon: FileSignature,
        color: '#34d399',
        title: '내용증명 작성',
        subtitle: '채권추심 · 계약 해지 · 경고장',
        desc: '법적 효력 있는 내용증명 한 장이 분쟁을 막습니다.',
        price: 100000,
        turnaround: '24시간',
        includes: ['사실 관계 정리', '법적 근거 명시', '발송 방법 안내'],
        popular: false,
    },
    {
        id: 'legal-opinion',
        category: '법률 의견',
        icon: Scale,
        color: '#a78bfa',
        title: '법률 의견서',
        subtitle: '투자 · 분쟁 · 세무 · 계약 해석',
        desc: '이 결정, 법적으로 문제없는지 변호사 의견으로 확인하세요.',
        price: 220000,
        turnaround: '48시간',
        includes: ['관련 법령 검토', '판례 중심 분석', '리스크 등급 평가', '서면 의견서 발행'],
        popular: false,
    },
    {
        id: 'labor-consult',
        category: '노무',
        icon: Users,
        color: '#fb923c',
        title: '노무 상담 (1건)',
        subtitle: '해고 · 임금체불 · 취업규칙 · 징계',
        desc: '노무 분쟁, 첫 단추를 잘못 끼우면 역으로 당합니다.',
        price: 120000,
        turnaround: '24시간',
        includes: ['사실관계 분석', '대응 전략 제시', '필요 서류 안내'],
        popular: false,
    },
    {
        id: 'regulation-review',
        category: '문서 작성',
        icon: Briefcase,
        color: '#38bdf8',
        title: '사규·취업규칙 검토',
        subtitle: '스타트업 · 프랜차이즈 본사 · 중소기업',
        desc: '직원이 늘기 전에 규정을 먼저 잡으세요. 나중에는 훨씬 복잡합니다.',
        price: 200000,
        turnaround: '48시간',
        includes: ['근로기준법 기준 전체 점검', '위반 조항 수정안', '표준 규정집 제공'],
        popular: false,
    },
];

// ── 구독 비교 계산기 ────────────────────────────────
function CostComparison({ selectedCount }: { selectedCount: number }) {
    const singleCost = selectedCount * 150000; // 평균 단가
    const subCost = 990000;
    const saving = singleCost - subCost;
    const shouldSub = saving > 0;

    return (
        <motion.div layout
            className="mt-4 p-4 rounded-2xl"
            style={{
                background: shouldSub ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                border: shouldSub ? '1.5px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.07)',
            }}>
            <div className="flex items-center justify-between text-sm">
                <div>
                    <p style={{ color: 'rgba(240,244,255,0.5)' }}>단건 합계 (월 {selectedCount}건 기준)</p>
                    <p className="font-black text-lg mt-0.5" style={{ color: '#f0f4ff' }}>
                        ₩{singleCost.toLocaleString()}
                    </p>
                </div>
                <div className="text-center px-4" style={{ color: 'rgba(240,244,255,0.2)' }}>vs</div>
                <div className="text-right">
                    <p style={{ color: 'rgba(240,244,255,0.5)' }}>구독 Basic (무제한)</p>
                    <p className="font-black text-lg mt-0.5" style={{ color: '#c9a84c' }}>
                        ₩{subCost.toLocaleString()}
                    </p>
                </div>
            </div>
            {shouldSub && (
                <div className="mt-3 pt-3 flex items-center justify-between"
                    style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}>
                    <p className="text-sm font-bold" style={{ color: '#4ade80' }}>
                        구독하시면 월 ₩{saving.toLocaleString()} 절감!
                    </p>
                    <Link href="/pricing">
                        <button className="text-xs font-black px-4 py-2 rounded-lg btn-gold">
                            구독 보기 →
                        </button>
                    </Link>
                </div>
            )}
            {!shouldSub && selectedCount === 1 && (
                <p className="text-xs mt-2" style={{ color: 'rgba(240,244,255,0.35)' }}>
                    월 7건 이상이면 구독이 더 저렴합니다
                </p>
            )}
        </motion.div>
    );
}

// ── 주문 폼 모달 ────────────────────────────────────
function OrderModal({ service, onClose }: { service: typeof SERVICES[0]; onClose: () => void }) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', detail: '' });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-lg rounded-3xl p-6 relative"
                style={{ background: 'rgba(13,27,62,0.98)', border: '1px solid rgba(201,168,76,0.3)' }}
                onClick={e => e.stopPropagation()}>

                {/* 헤더 */}
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${service.color}20` }}>
                        <service.icon className="w-5 h-5" style={{ color: service.color }} />
                    </div>
                    <div>
                        <h3 className="font-black text-base" style={{ color: '#f0f4ff' }}>{service.title}</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            ₩{service.price.toLocaleString()} · 답변 {service.turnaround} 내
                        </p>
                    </div>
                    <button onClick={onClose} className="ml-auto text-2xl leading-none"
                        style={{ color: 'rgba(240,244,255,0.3)' }}>×</button>
                </div>

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.6)' }}>성함 *</label>
                                <input className="input-navy w-full" placeholder="홍길동"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.6)' }}>회사명</label>
                                <input className="input-navy w-full" placeholder="(주)홍길동산업"
                                    value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.6)' }}>연락처 *</label>
                                <input className="input-navy w-full" type="tel" placeholder="010-1234-5678"
                                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.6)' }}>이메일 *</label>
                                <input className="input-navy w-full" type="email" placeholder="name@company.kr"
                                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                상황 설명 * <span style={{ color: 'rgba(240,244,255,0.3)', fontWeight: 400 }}>(구체적일수록 빠르게 검토됩니다)</span>
                            </label>
                            <textarea className="input-navy w-full resize-none" rows={4}
                                placeholder={`예) 프랜차이즈 계약서 서명 전 독소 조항 여부 확인 요청\n- 위약금 조항이 불리한지 의심됨\n- 계약 기간 5년, 중도해지 시 잔여 기간 수수료 청구 조항 있음`}
                                value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} />
                        </div>

                        <button onClick={() => setStep(2)}
                            disabled={!form.name || !form.phone || !form.email || !form.detail}
                            className="w-full py-3.5 rounded-2xl font-black text-sm btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                            다음: 결제 확인 →
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h4 className="font-black text-sm mb-3" style={{ color: '#c9a84c' }}>의뢰 내용 확인</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span style={{ color: 'rgba(240,244,255,0.5)' }}>서비스</span>
                                    <span style={{ color: '#f0f4ff' }}>{service.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'rgba(240,244,255,0.5)' }}>의뢰인</span>
                                    <span style={{ color: '#f0f4ff' }}>{form.name} {form.company && `(${form.company})`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'rgba(240,244,255,0.5)' }}>답변 기한</span>
                                    <span style={{ color: '#4ade80' }}>{service.turnaround} 이내 보장</span>
                                </div>
                                <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                                    <span className="font-black" style={{ color: '#f0f4ff' }}>결제 금액</span>
                                    <span className="font-black text-lg" style={{ color: '#c9a84c' }}>₩{service.price.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button className="w-full py-3.5 rounded-2xl font-black text-sm btn-gold flex items-center justify-center gap-2">
                                <CreditCard className="w-4 h-4" /> 카드로 결제하기
                            </button>
                            <button className="w-full py-3 rounded-2xl font-bold text-sm"
                                style={{ background: 'rgba(249,232,78,0.1)', color: '#f9e84e', border: '1px solid rgba(249,232,78,0.2)' }}>
                                카카오페이로 결제
                            </button>
                        </div>

                        <div className="flex items-start gap-2 text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>
                            <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            결제 후 즉시 담당 변호사가 배정되며, 기한 내 답변이 없을 경우 전액 환불됩니다.
                        </div>

                        <button onClick={() => setStep(1)} className="text-xs w-full text-center"
                            style={{ color: 'rgba(240,244,255,0.3)' }}>← 이전으로</button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

// ── 메인 페이지 ────────────────────────────────────
export default function PricingPage() {
    const [selected, setSelected] = useState<typeof SERVICES[0] | null>(null);
    const [monthlyCount, setMonthlyCount] = useState(1);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqs = [
        { q: '결제 후 얼마나 걸리나요?', a: '결제 완료 즉시 담당 변호사가 배정됩니다. 서비스별 24~48시간 내 서면 답변을 보장합니다. 기한 초과 시 전액 환불.' },
        { q: '구독이랑 뭐가 달라요?', a: '단건은 필요한 것만 골라서 한 번 쓰는 방식입니다. 월 7건 이상 쓰신다면 구독이 최대 60% 저렴합니다. 단건 고객에게는 구독 전환 시 할인 쿠폰을 드립니다.' },
        { q: '문서를 첨부해야 하나요?', a: '의뢰 접수 후 담당 변호사가 필요한 서류를 안내드립니다. 처음엔 상황 설명만으로 충분합니다.' },
        { q: '마음에 안 들면 환불되나요?', a: '검토 결과물 수령 전이라면 전액 환불됩니다. 결과물 수령 후에는 변호사와 직접 협의하여 추가 수정을 무료로 진행합니다.' },
        { q: '비밀이 보장되나요?', a: '물론입니다. 변호사법에 의한 비밀유지 의무가 적용됩니다. 상담 내용은 어떤 경우에도 외부에 공개되지 않습니다.' },
    ];

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#04091a', color: '#f0f4ff' }}>
            {/* ── 히어로 ── */}
            <div className="text-center py-16 px-4 max-w-4xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                        <Scale className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-bold" style={{ color: '#c9a84c' }}>구독 없이 바로 시작</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-5 leading-tight">
                        필요한 것만,<br />
                        <span style={{ color: '#c9a84c' }}>지금 바로.</span>
                    </h1>
                    <p className="text-lg md:text-xl max-w-2xl mx-auto mb-3" style={{ color: 'rgba(240,244,255,0.65)' }}>
                        계약서 서명 전, 분쟁 발생 전, 규제 과태료 받기 전에 변호사에게 맡기세요.<br />
                        <strong style={{ color: '#f0f4ff' }}>회원가입 없이, 필요한 서비스만 골라서.</strong>
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>
                        <span className="flex items-center gap-1.5"><BadgeCheck className="w-4 h-4" style={{ color: '#4ade80' }} />결제 후 즉시 배정</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" style={{ color: '#60a5fa' }} />24~48시간 답변 보장</span>
                        <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" style={{ color: '#a78bfa' }} />기한 초과 시 전액 환불</span>
                    </div>
                </motion.div>
            </div>

            <div className="max-w-6xl mx-auto px-4">
                {/* ── 서비스 메뉴 ── */}
                <div className="mb-6">
                    <h2 className="text-xl font-black mb-2" style={{ color: '#f0f4ff' }}>
                        원하는 서비스를 선택하세요
                    </h2>
                    <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>
                        클릭하면 바로 의뢰할 수 있습니다
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                    {SERVICES.map((svc, i) => (
                        <motion.div key={svc.id}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            onClick={() => setSelected(svc)}
                            className="relative p-5 rounded-2xl cursor-pointer transition-all group"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: `1.5px solid ${svc.popular ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            }}
                            whileHover={{ scale: 1.02, borderColor: svc.color + '60' }}>
                            {svc.popular && (
                                <div className="absolute -top-3 right-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-black"
                                        style={{ background: '#c9a84c', color: '#04091a' }}>많이 찾아요</span>
                                </div>
                            )}

                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${svc.color}15` }}>
                                    <svc.icon className="w-5 h-5" style={{ color: svc.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black tracking-wider uppercase mb-0.5"
                                        style={{ color: svc.color + 'aa' }}>{svc.category}</p>
                                    <h3 className="font-black text-base leading-tight" style={{ color: '#f0f4ff' }}>{svc.title}</h3>
                                </div>
                            </div>

                            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'rgba(240,244,255,0.55)' }}>
                                {svc.desc}
                            </p>

                            <ul className="space-y-1.5 mb-4">
                                {svc.includes.map(item => (
                                    <li key={item} className="flex items-center gap-2 text-xs"
                                        style={{ color: 'rgba(240,244,255,0.7)' }}>
                                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: svc.color }} />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex items-center justify-between pt-3"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div>
                                    <span className="font-black text-lg" style={{ color: '#f0f4ff' }}>
                                        ₩{svc.price.toLocaleString()}
                                    </span>
                                    <span className="text-xs ml-1" style={{ color: 'rgba(240,244,255,0.35)' }}>/건</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {svc.turnaround} 내
                                </div>
                            </div>

                            <button className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm transition-all"
                                style={{
                                    background: svc.popular ? 'linear-gradient(135deg,#c9a84c,#e8c87a)' : `${svc.color}15`,
                                    color: svc.popular ? '#04091a' : svc.color,
                                    border: `1px solid ${svc.color}30`,
                                }}>
                                이 서비스 의뢰하기 →
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* ── 구독제 요금표 ── */}
                <div className="mb-12">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                            <Star className="w-4 h-4" style={{ color: '#c9a84c' }} />
                            <span className="text-sm font-bold" style={{ color: '#c9a84c' }}>구독제</span>
                        </div>
                        <h2 className="text-2xl font-black mb-2" style={{ color: '#f0f4ff' }}>
                            매달 쓰신다면, 구독이 훨씬 유리합니다
                        </h2>
                        <p className="text-sm max-w-xl mx-auto" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            전담 변호사 배정 · 무제한 법률 자문 · 계약서 검토 · 규제 모니터링까지<br />
                            프랜차이즈 본사에 꼭 필요한 법률 서비스를 월정액으로 제공합니다.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        {/* Starter */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-2xl p-6 relative"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#60a5fa' }}>STARTER</p>
                            <h3 className="text-xl font-black mb-1" style={{ color: '#f0f4ff' }}>스타터</h3>
                            <p className="text-xs mb-4" style={{ color: 'rgba(240,244,255,0.45)' }}>
                                소규모 가맹점 · 개인 사업자
                            </p>
                            <div className="mb-5">
                                <span className="text-3xl font-black" style={{ color: '#f0f4ff' }}>₩490,000</span>
                                <span className="text-sm ml-1" style={{ color: 'rgba(240,244,255,0.4)' }}>/월</span>
                            </div>
                            <ul className="space-y-2.5 mb-6">
                                {[
                                    '법률 자문 월 2건',
                                    '계약서 검토 월 1건',
                                    '이메일 상담 무제한',
                                    '개인정보처리방침 1회 작성',
                                    '규제 변경 알림 (월간)',
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-2 text-sm"
                                        style={{ color: 'rgba(240,244,255,0.7)' }}>
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#60a5fa' }} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-3 rounded-xl font-bold text-sm"
                                style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                                시작하기
                            </button>
                        </motion.div>

                        {/* Standard (인기) */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-2xl p-6 relative"
                            style={{ background: 'rgba(201,168,76,0.05)', border: '1.5px solid rgba(201,168,76,0.4)' }}>
                            <div className="absolute -top-3 right-4">
                                <span className="px-3 py-1 rounded-full text-xs font-black"
                                    style={{ background: '#c9a84c', color: '#04091a' }}>추천</span>
                            </div>
                            <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#c9a84c' }}>STANDARD</p>
                            <h3 className="text-xl font-black mb-1" style={{ color: '#f0f4ff' }}>스탠다드</h3>
                            <p className="text-xs mb-4" style={{ color: 'rgba(240,244,255,0.45)' }}>
                                가맹 본사 · 중소기업 (10~100인)
                            </p>
                            <div className="mb-5">
                                <span className="text-3xl font-black" style={{ color: '#c9a84c' }}>₩990,000</span>
                                <span className="text-sm ml-1" style={{ color: 'rgba(240,244,255,0.4)' }}>/월</span>
                            </div>
                            <ul className="space-y-2.5 mb-6">
                                {[
                                    '법률 자문 월 5건 포함',
                                    '계약서 검토 무제한',
                                    '전담 변호사 1인 배정',
                                    '개인정보처리방침 분기 업데이트',
                                    '규제 변경 알림 (주간)',
                                    '노무 상담 월 2건',
                                    'AI 자동 분석 리포트',
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-2 text-sm"
                                        style={{ color: 'rgba(240,244,255,0.7)' }}>
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#c9a84c' }} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-3 rounded-xl font-black text-sm btn-gold">
                                구독 시작하기
                            </button>
                        </motion.div>

                        {/* Premium */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl p-6 relative"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#a78bfa' }}>PREMIUM</p>
                            <h3 className="text-xl font-black mb-1" style={{ color: '#f0f4ff' }}>프리미엄</h3>
                            <p className="text-xs mb-4" style={{ color: 'rgba(240,244,255,0.45)' }}>
                                대형 가맹 본사 · 상장 준비 기업
                            </p>
                            <div className="mb-5">
                                <span className="text-3xl font-black" style={{ color: '#f0f4ff' }}>₩2,200,000</span>
                                <span className="text-sm ml-1" style={{ color: 'rgba(240,244,255,0.4)' }}>/월</span>
                            </div>
                            <ul className="space-y-2.5 mb-6">
                                {[
                                    '법률 자문 무제한',
                                    '전담 변호사 2인 배정',
                                    '계약서·사규 검토 무제한',
                                    '개인정보처리방침 상시 관리',
                                    '규제 변경 실시간 대응',
                                    '노무 상담 무제한',
                                    '소송 대리 수임료 30% 할인',
                                    '경영진 직통 핫라인',
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-2 text-sm"
                                        style={{ color: 'rgba(240,244,255,0.7)' }}>
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#a78bfa' }} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-3 rounded-xl font-bold text-sm"
                                style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                                상담 후 시작
                            </button>
                        </motion.div>
                    </div>

                    {/* 구독 공통 혜택 */}
                    <div className="mt-6 p-5 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {[
                            { icon: '👨‍⚖️', label: '전담 변호사', desc: '매번 같은 변호사' },
                            { icon: '⚡', label: '24시간 응답', desc: '긴급 상담 가능' },
                            { icon: '📊', label: 'AI 분석', desc: '자동 리스크 진단' },
                            { icon: '🔄', label: '해지 자유', desc: '위약금 없음' },
                        ].map(({ icon, label, desc }) => (
                            <div key={label} className="text-center">
                                <div className="text-2xl mb-1">{icon}</div>
                                <div className="text-xs font-bold" style={{ color: '#c9a84c' }}>{label}</div>
                                <div className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 단건 vs 구독 계산기 ── */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mb-12 p-6 rounded-3xl"
                    style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="font-black text-lg" style={{ color: '#f0f4ff' }}>
                                단건 vs 구독, 뭐가 더 유리할까요?
                            </h3>
                            <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                월 예상 의뢰 건수를 조정해보세요
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setMonthlyCount(Math.max(1, monthlyCount - 1))}
                                className="w-8 h-8 rounded-lg font-black text-lg flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.06)', color: '#f0f4ff' }}>-</button>
                            <span className="font-black text-2xl w-8 text-center" style={{ color: '#c9a84c' }}>
                                {monthlyCount}
                            </span>
                            <button onClick={() => setMonthlyCount(Math.min(20, monthlyCount + 1))}
                                className="w-8 h-8 rounded-lg font-black text-lg flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.06)', color: '#f0f4ff' }}>+</button>
                            <span className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>건/월</span>
                        </div>
                    </div>
                    <CostComparison selectedCount={monthlyCount} />
                </motion.div>

                {/* ── 프로세스 안내 ── */}
                <div className="mb-12">
                    <h2 className="text-xl font-black mb-8 text-center" style={{ color: '#f0f4ff' }}>
                        의뢰부터 답변까지, 딱 3단계
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { step: '01', icon: FileText, color: '#60a5fa', title: '서비스 선택 + 내용 입력', desc: '위 메뉴에서 원하는 서비스를 고르고 상황을 설명하세요. 자세할수록 더 정확한 검토가 가능합니다.' },
                            { step: '02', icon: CreditCard, color: '#c9a84c', title: '온라인 결제', desc: '카드, 카카오페이로 즉시 결제하세요. 결제 완료 즉시 담당 변호사가 서류를 확인합니다.' },
                            { step: '03', icon: Scale, color: '#4ade80', title: '서면 답변 수령', desc: '24~48시간 내 이메일로 검토 결과를 받으세요. 추가 질문은 무료로 1회 더 답변드립니다.' },
                        ].map(({ step, icon: Icon, color, title, desc }) => (
                            <div key={step} className="relative pl-6">
                                <div className="absolute left-0 top-0 w-px h-full"
                                    style={{ background: `linear-gradient(to bottom, ${color}40, transparent)` }} />
                                <div className="text-xs font-black tracking-widest mb-2" style={{ color: color + '80' }}>STEP {step}</div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="w-5 h-5" style={{ color }} />
                                    <h3 className="font-black text-base" style={{ color: '#f0f4ff' }}>{title}</h3>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.55)' }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── FAQ ── */}
                <div className="mb-12 max-w-3xl mx-auto">
                    <h2 className="text-xl font-black mb-6 text-center" style={{ color: '#f0f4ff' }}>자주 묻는 질문</h2>
                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <motion.div key={idx} layout
                                className="rounded-2xl overflow-hidden cursor-pointer"
                                style={{
                                    background: openFaq === idx ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${openFaq === idx ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                }}
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                                <div className="flex items-center justify-between p-4">
                                    <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>{faq.q}</p>
                                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                                        style={{ color: '#c9a84c' }} />
                                </div>
                                <AnimatePresence>
                                    {openFaq === idx && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                            className="overflow-hidden">
                                            <p className="px-4 pb-4 text-sm leading-relaxed"
                                                style={{ color: 'rgba(240,244,255,0.6)' }}>{faq.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ── 구독 유도 배너 ── */}
                <div className="rounded-3xl p-8 text-center relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(13,27,62,0.9) 100%)',
                        border: '1.5px solid rgba(201,168,76,0.3)',
                    }}>
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{ background: 'repeating-linear-gradient(45deg, #c9a84c 0, #c9a84c 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
                    <div className="relative">
                        <p className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: 'rgba(201,168,76,0.6)' }}>
                            자주 쓰신다면
                        </p>
                        <h2 className="text-2xl font-black mb-2" style={{ color: '#f0f4ff' }}>
                            월 7건 이상이면 구독이 더 쌉니다
                        </h2>
                        <p className="text-sm mb-6" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            Basic ₩990,000/월 — 자문 3건 포함 + 계약서 검토 + 규제 알림 자동 발송<br />
                            <span style={{ color: '#4ade80' }}>단건 고객 전환 시 첫 달 20% 할인</span>
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a href="tel:02-555-1234">
                                <button className="px-8 py-3.5 rounded-2xl font-black btn-gold flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> 전화 상담
                                </button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 주문 모달 ── */}
            <AnimatePresence>
                {selected && <OrderModal service={selected} onClose={() => setSelected(null)} />}
            </AnimatePresence>
        </div>
    );
}
