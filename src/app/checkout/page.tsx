'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, ArrowLeft, Building2, User, Phone, Mail,
    FileText, Sparkles, ArrowRight, Copy, Check, Pen, RotateCcw,
    Calendar, Shield, Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCompanies } from '@/hooks/useDataLayer';
import { PRICE_RANGES, CRM_PLAN_MAP, calcPrice } from '@/lib/pricing';

// ── 플랜 데이터 (중앙 관리 모듈에서 가져옴) ─────────────────
const PLANS: Record<string, { name: string; price: number; color: string; features: string[] }> = Object.fromEntries(
    PRICE_RANGES.map(r => [
        r.id,
        { name: r.name, price: calcPrice(r.minStores), color: r.color, features: [`${r.storeRange} 매장`, `${r.priceRange}/월`] },
    ])
);

// ── 서명 캔버스 ─────────────────────────────────────────
function SignatureCanvas({ onSign }: { onSign: (dataUrl: string) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawing, setDrawing] = useState(false);
    const [signed, setSigned] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        ctx.strokeStyle = '#f0f4ff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!drawing) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (!signed) setSigned(true);
    };

    const stopDraw = () => {
        setDrawing(false);
        if (signed && canvasRef.current) {
            onSign(canvasRef.current.toDataURL());
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSigned(false);
        onSign('');
    };

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                className="w-full rounded-xl cursor-crosshair touch-none"
                style={{
                    height: 120,
                    background: 'rgba(13,27,62,0.8)',
                    border: `2px dashed ${signed ? 'rgba(34,197,94,0.5)' : 'rgba(201,168,76,0.3)'}`,
                }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
            />
            {!signed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-2" style={{ color: 'rgba(240,244,255,0.25)' }}>
                        <Pen className="w-5 h-5" />
                        <span className="text-sm font-bold">이곳에 서명해 주세요</span>
                    </div>
                </div>
            )}
            {signed && (
                <button onClick={clear}
                    className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(240,244,255,0.5)' }}>
                    <RotateCcw className="w-3 h-3" /> 다시 서명
                </button>
            )}
        </div>
    );
}

// ── 메인 페이지 ─────────────────────────────────────────
function CheckoutContent() {
    const searchParams = useSearchParams();
    const planId = searchParams.get('plan') || 'growth';
    const company = searchParams.get('company') || '';
    const plan = PLANS[planId] || PLANS.growth || Object.values(PLANS)[0];

    const today = new Date();
    const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    const { companies, updateCompany } = useCompanies();

    const [form, setForm] = useState({
        companyName: company,
        bizNo: '',
        ceoName: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
    });
    const [signature, setSignature] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const bankInfo = { bank: '국민은행', account: '123-456-789012', holder: '법률사무소 IBS' };

    const copyAccount = () => {
        navigator.clipboard.writeText(bankInfo.account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const canSubmit = form.companyName && form.contactName && form.contactEmail && signature && agreed;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 2000));

        // CRM 연동: 회사명으로 매칭되는 기업이 있으면 구독 상태 업데이트
        const crmPlan = (CRM_PLAN_MAP[planId] || 'standard') as 'starter' | 'standard' | 'premium';
        const matched = companies.find(c =>
            c.name === form.companyName || c.email === form.contactEmail
        );
        if (matched) {
            await updateCompany(matched.id, { plan: crmPlan, status: 'subscribed' });
        }

        setDone(true);
        setSubmitting(false);
    };

    // ── 제출 완료 화면 ─────────────────────────────────
    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#04091a' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center rounded-3xl p-10"
                    style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(13,27,62,0.8))',
                        border: '2px solid rgba(34,197,94,0.3)',
                        boxShadow: '0 0 80px rgba(34,197,94,0.1)',
                    }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
                        <CheckCircle2 className="w-20 h-20 mx-auto mb-6" style={{ color: '#4ade80' }} />
                    </motion.div>
                    <h2 className="text-3xl font-black mb-2" style={{ color: '#4ade80' }}>신청 완료!</h2>
                    <p className="text-base mb-2" style={{ color: '#f0f4ff' }}>
                        {plan.name} 플랜 구독 신청이 접수되었습니다
                    </p>
                    <p className="text-sm mb-8" style={{ color: 'rgba(240,244,255,0.5)' }}>
                        입금 확인 후 {form.companyName || '귀사'}의 전담 변호사가 48시간 내 배정됩니다
                    </p>

                    {/* 입금 안내 */}
                    <div className="rounded-xl p-5 mb-6 text-left"
                        style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}>
                        <p className="text-xs font-bold mb-3" style={{ color: '#c9a84c' }}>💰 아래 계좌로 입금해 주세요</p>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span style={{ color: 'rgba(240,244,255,0.5)' }}>은행</span>
                                <span className="font-bold" style={{ color: '#f0f4ff' }}>{bankInfo.bank}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span style={{ color: 'rgba(240,244,255,0.5)' }}>계좌번호</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-base" style={{ color: '#e8c87a' }}>{bankInfo.account}</span>
                                    <button onClick={copyAccount}
                                        className="p-1.5 rounded-lg" style={{ background: 'rgba(201,168,76,0.15)' }}>
                                        {copied ? <Check className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                                            : <Copy className="w-3.5 h-3.5" style={{ color: '#c9a84c' }} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: 'rgba(240,244,255,0.5)' }}>예금주</span>
                                <span className="font-bold" style={{ color: '#f0f4ff' }}>{bankInfo.holder}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: 'rgba(240,244,255,0.5)' }}>입금액</span>
                                <span className="font-black" style={{ color: '#e8c87a' }}>{plan.price.toLocaleString()}원</span>
                            </div>
                        </div>
                    </div>

                    {/* 다음 단계 */}
                    <div className="rounded-xl p-4 mb-6"
                        style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <p className="text-xs font-bold mb-2" style={{ color: '#4ade80' }}>다음 단계</p>
                        {[
                            '신청 확인 이메일 발송 (5분 내)',
                            '입금 확인 후 계정 활성화',
                            '전담 변호사 배정 (48시간 내)',
                            '개인정보처리방침 전체 수정본 전달',
                        ].map((step, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm py-1"
                                style={{ color: 'rgba(240,244,255,0.7)' }}>
                                <span className="text-xs font-black px-1.5 py-0.5 rounded"
                                    style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>{i + 1}</span>
                                {step}
                            </div>
                        ))}
                    </div>

                    {/* 로그인 정보 안내 */}
                    <div className="rounded-xl p-5 mb-6 text-left"
                        style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)' }}>
                        <p className="text-xs font-bold mb-3" style={{ color: '#818cf8' }}>🔑 고객 포털 로그인 정보</p>
                        <p className="text-sm mb-3" style={{ color: 'rgba(240,244,255,0.6)' }}>
                            아래 정보로 고객 포털에 바로 로그인하실 수 있습니다.
                        </p>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span style={{ color: 'rgba(240,244,255,0.5)' }}>사업자번호</span>
                                <span className="font-bold" style={{ color: '#f0f4ff' }}>{form.bizNo || '(입력하신 사업자번호)'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: 'rgba(240,244,255,0.5)' }}>초기 비밀번호</span>
                                <span className="font-black" style={{ color: '#818cf8' }}>1234</span>
                            </div>
                        </div>
                        <p className="text-[10px] mt-3" style={{ color: 'rgba(240,244,255,0.3)' }}>
                            * 최초 로그인 후 비밀번호를 반드시 변경해 주세요
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link href="/login">
                            <button className="w-full py-3.5 rounded-xl font-black text-base btn-gold inline-flex items-center justify-center gap-2">
                                고객 포털 로그인하기 <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                        <Link href="/dashboard">
                            <button className="w-full py-3 rounded-xl font-bold text-sm"
                                style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.25)' }}>
                                고객 포털 바로가기
                            </button>
                        </Link>
                        <Link href="/">
                            <button className="w-full py-3 rounded-xl font-bold text-sm"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                홈으로 돌아가기
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── 구독 신청서 메인 ──────────────────────────────────
    return (
        <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: '#04091a' }}>
            <div className="max-w-3xl mx-auto">

                {/* 상단 */}
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/pricing">
                        <button className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg"
                            style={{ color: 'rgba(240,244,255,0.6)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <ArrowLeft className="w-4 h-4" /> 요금제로 돌아가기
                        </button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* ═══ 구독 신청서 타이틀 ═══ */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                            <FileText className="w-4 h-4" style={{ color: '#c9a84c' }} />
                            <span className="text-sm font-bold" style={{ color: '#c9a84c' }}>법률자문 서비스</span>
                        </div>
                        <h1 className="text-3xl font-black mb-2">구독 신청서</h1>
                        <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>
                            작성일: {todayStr}
                        </p>
                    </div>

                    {/* ═══ 1. 선택 플랜 ═══ */}
                    <div className="rounded-2xl p-6 mb-6"
                        style={{
                            background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(13,27,62,0.6))',
                            border: '1px solid rgba(201,168,76,0.3)',
                        }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" style={{ color: plan.color }} />
                                <span className="text-lg font-black" style={{ color: plan.color }}>{plan.name} 플랜</span>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black" style={{ color: '#f0f4ff' }}>{plan.price.toLocaleString()}원</span>
                                <span className="text-sm ml-1" style={{ color: 'rgba(240,244,255,0.4)' }}>/월</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {plan.features.map(f => (
                                <span key={f} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,244,255,0.65)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <CheckCircle2 className="w-3 h-3" style={{ color: plan.color }} /> {f}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ═══ 2. 신청인(회사) 정보 ═══ */}
                    <div className="rounded-2xl p-6 mb-6"
                        style={{ background: 'rgba(13,27,62,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex items-center gap-2 mb-5">
                            <Building2 className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            <h2 className="text-base font-black" style={{ color: '#f0f4ff' }}>신청인 정보</h2>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {[
                                { k: 'companyName', label: '회사명 (상호) *', ph: '(주)회사명', icon: Building2 },
                                { k: 'bizNo', label: '사업자등록번호', ph: '123-45-67890', icon: FileText },
                                { k: 'ceoName', label: '대표자명', ph: '대표자 이름', icon: User },
                                { k: 'contactName', label: '담당자명 *', ph: '법무 담당자', icon: User },
                                { k: 'contactPhone', label: '연락처', ph: '010-1234-5678', icon: Phone },
                                { k: 'contactEmail', label: '이메일 *', ph: 'legal@company.kr', icon: Mail },
                            ].map(({ k, label, ph, icon: Icon }) => (
                                <div key={k}>
                                    <label className="flex items-center gap-1.5 text-xs font-bold mb-1.5"
                                        style={{ color: 'rgba(240,244,255,0.5)' }}>
                                        <Icon className="w-3.5 h-3.5" /> {label}
                                    </label>
                                    <input
                                        value={form[k as keyof typeof form]}
                                        onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                                        placeholder={ph}
                                        required={label.includes('*')}
                                        className="input-navy text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ═══ 3. 간단 계약 조건 ═══ */}
                    <div className="rounded-2xl p-6 mb-6"
                        style={{ background: 'rgba(13,27,62,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex items-center gap-2 mb-5">
                            <Shield className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            <h2 className="text-base font-black" style={{ color: '#f0f4ff' }}>계약 조건</h2>
                        </div>

                        <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.7)' }}>

                            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-xs font-black mb-2" style={{ color: '#c9a84c' }}>제1조 (서비스 내용)</p>
                                <p>법률사무소 IBS(이하 "을")는 {form.companyName || '신청인'}(이하 "갑")에게 <strong style={{ color: '#e8c87a' }}>{plan.name} 플랜</strong>에 포함된 법률자문 서비스를 제공합니다.</p>
                                <ul className="mt-2 space-y-1 text-xs" style={{ color: 'rgba(240,244,255,0.55)' }}>
                                    {plan.features.map(f => <li key={f}>• {f}</li>)}
                                </ul>
                            </div>

                            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-xs font-black mb-2" style={{ color: '#c9a84c' }}>제2조 (계약 기간 및 갱신)</p>
                                <p>본 계약은 <strong style={{ color: '#f0f4ff' }}>입금일로부터 1개월간</strong> 유효하며, 갑이 해지를 통보하지 않는 한 <strong style={{ color: '#f0f4ff' }}>동일 조건으로 자동 갱신</strong>됩니다.</p>
                            </div>

                            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-xs font-black mb-2" style={{ color: '#c9a84c' }}>제3조 (자문료 및 결제)</p>
                                <p>월 자문료는 <strong style={{ color: '#e8c87a' }}>{plan.price.toLocaleString()}원 (VAT 별도)</strong>이며, 매월 서비스 시작일 기준으로 청구됩니다.</p>
                            </div>

                            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-xs font-black mb-2" style={{ color: '#c9a84c' }}>제4조 (해지)</p>
                                <p>갑은 <strong style={{ color: '#f0f4ff' }}>언제든지 해지</strong>를 요청할 수 있으며, 해지 요청 시 잔여 기간분은 일할 계산하여 환불합니다. 위약금은 없습니다.</p>
                            </div>

                            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-xs font-black mb-2" style={{ color: '#c9a84c' }}>제5조 (비밀유지)</p>
                                <p>을은 갑의 업무상 비밀을 엄격히 보호하며, 본 계약 종료 후에도 비밀유지 의무를 준수합니다.</p>
                            </div>
                        </div>
                    </div>

                    {/* ═══ 4. 입금 계좌 안내 ═══ */}
                    <div className="rounded-2xl p-6 mb-6"
                        style={{
                            background: 'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(13,27,62,0.6))',
                            border: '1px solid rgba(201,168,76,0.25)',
                        }}>
                        <div className="flex items-center gap-2 mb-5">
                            <span className="text-lg">💰</span>
                            <h2 className="text-base font-black" style={{ color: '#c9a84c' }}>입금 계좌 안내</h2>
                        </div>

                        <div className="rounded-xl p-5"
                            style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>은행</span>
                                    <span className="text-sm font-bold" style={{ color: '#f0f4ff' }}>{bankInfo.bank}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>계좌번호</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black tracking-wider" style={{ color: '#e8c87a' }}>
                                            {bankInfo.account}
                                        </span>
                                        <button type="button" onClick={copyAccount}
                                            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                                            style={{
                                                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(201,168,76,0.15)',
                                                color: copied ? '#4ade80' : '#c9a84c',
                                                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(201,168,76,0.3)'}`,
                                            }}>
                                            {copied ? <><Check className="w-3 h-3" /> 복사됨</> : <><Copy className="w-3 h-3" /> 복사</>}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>예금주</span>
                                    <span className="text-sm font-bold" style={{ color: '#f0f4ff' }}>{bankInfo.holder}</span>
                                </div>
                                <div className="h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold" style={{ color: 'rgba(240,244,255,0.5)' }}>입금액</span>
                                    <span className="text-xl font-black" style={{ color: '#e8c87a' }}>
                                        {plan.price.toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 px-1">
                            <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(240,244,255,0.3)' }} />
                            <p className="text-xs" style={{ color: 'rgba(240,244,255,0.35)' }}>
                                신청서 제출 후 7일 이내 입금 시 서비스가 활성화됩니다. 세금계산서는 입금 확인 후 발행됩니다.
                            </p>
                        </div>
                    </div>

                    {/* ═══ 5. 서명란 ═══ */}
                    <div className="rounded-2xl p-6 mb-6"
                        style={{ background: 'rgba(13,27,62,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Pen className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            <h2 className="text-base font-black" style={{ color: '#f0f4ff' }}>서명</h2>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'rgba(240,244,255,0.4)' }}>
                            위 내용을 확인하고, 구독 신청에 동의하시면 아래에 서명해 주세요.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs font-bold mb-1" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                    "갑" (신청인)
                                </p>
                                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <p className="text-sm font-bold" style={{ color: '#f0f4ff' }}>{form.companyName || '(회사명 입력 시 표시)'}</p>
                                    <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{form.ceoName || form.contactName || '담당자'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold mb-1" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                    "을" (법률사무소)
                                </p>
                                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <p className="text-sm font-bold" style={{ color: '#f0f4ff' }}>법률사무소 IBS</p>
                                    <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>대표 변호사</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-xs font-bold mb-2" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                ✍️ 갑 서명
                            </p>
                            <SignatureCanvas onSign={setSignature} />
                        </div>

                        <p className="text-[10px] text-center" style={{ color: 'rgba(240,244,255,0.25)' }}>
                            {todayStr} · 본 전자서명은 당사자 간 합의에 의한 서명으로 「전자서명법」 제3조에 따라 법적 효력을 가집니다
                        </p>
                    </div>

                    {/* ═══ 6. 약관 동의 + 제출 ═══ */}
                    <div className="rounded-2xl p-6 mb-6"
                        style={{ background: 'rgba(13,27,62,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                                className="mt-0.5 w-5 h-5 rounded accent-amber-600 flex-shrink-0" />
                            <span className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.65)' }}>
                                상기 <strong style={{ color: '#f0f4ff' }}>계약 조건</strong>을 확인하고 이에 동의하며,
                                <strong style={{ color: '#f0f4ff' }}> {plan.name} 플랜</strong>의 월간 구독을 신청합니다.
                                입금 확인 후 서비스가 시작되며, 위약금 없이 언제든 해지할 수 있습니다.
                            </span>
                        </label>
                    </div>

                    {/* 제출 버튼 */}
                    <button type="submit" disabled={submitting || !canSubmit}
                        className="w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3"
                        style={{
                            background: !canSubmit ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                            color: !canSubmit ? 'rgba(240,244,255,0.3)' : '#04091a',
                            cursor: !canSubmit ? 'not-allowed' : submitting ? 'wait' : 'pointer',
                            boxShadow: canSubmit ? '0 6px 30px rgba(201,168,76,0.4)' : 'none',
                            opacity: submitting ? 0.7 : 1,
                        }}>
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-amber-900 border-t-transparent rounded-full animate-spin" />
                                신청서 제출 중...
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                구독 신청서 제출하기
                            </>
                        )}
                    </button>

                    {/* 안심 배지 */}
                    <div className="flex flex-wrap justify-center gap-3 mt-5">
                        {['위약금 없음', '언제든 해지', '세금계산서 발행', 'SSL 보안'].map(b => (
                            <span key={b} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,244,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                {b}
                            </span>
                        ))}
                    </div>

                </form>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#04091a', color: '#c9a84c' }}><p className="text-lg font-bold">로딩 중...</p></div>}>
            <CheckoutContent />
        </Suspense>
    );
}