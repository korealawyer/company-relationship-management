'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, User, Hash, FileText, Pen, CheckCircle2,
    ChevronLeft, Printer, Download, ArrowRight, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// ── 은행 목록 ──────────────────────────────────────────────
const BANKS = [
    '국민은행', '신한은행', '우리은행', '하나은행', 'SC제일은행',
    '기업은행', '농협은행', '수협은행', '카카오뱅크', '토스뱅크',
    '케이뱅크', '대구은행', '부산은행', '경남은행', '광주은행',
    '전북은행', '제주은행', '새마을금고', '신협', '우체국',
];

// ── 타입 ────────────────────────────────────────────────────
interface CmsForm {
    companyName: string;
    bizNo: string;
    ceoName: string;
    address: string;
    bankName: string;
    accountNo: string;
    accountHolder: string;
    phone: string;
    email: string;
    plan: string;
    amount: string;
}

type Step = 'form' | 'preview' | 'sign' | 'done';

// ── 서명 캔버스 ────────────────────────────────────────────
function SignatureCanvas({ onSave }: { onSave: (dataUrl: string) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawing, setDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    const getCtx = () => canvasRef.current?.getContext('2d');

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        if ('touches' in e) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    };

    const start = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const ctx = getCtx();
        if (!ctx) return;
        setDrawing(true);
        setHasContent(true);
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing) return;
        e.preventDefault();
        const ctx = getCtx();
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#f0f4ff';
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const end = () => setDrawing(false);

    const clear = () => {
        const ctx = getCtx();
        if (!ctx || !canvasRef.current) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHasContent(false);
    };

    const save = () => {
        if (!canvasRef.current || !hasContent) return;
        onSave(canvasRef.current.toDataURL());
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(2, 2);
    }, []);

    return (
        <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden" style={{ border: '2px dashed rgba(201,168,76,0.3)' }}>
                <canvas ref={canvasRef}
                    onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
                    onTouchStart={start} onTouchMove={draw} onTouchEnd={end}
                    className="w-full cursor-crosshair touch-none"
                    style={{ height: 160, background: 'rgba(255,255,255,0.03)' }} />
                {!hasContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-sm" style={{ color: 'rgba(240,244,255,0.2)' }}>
                            <Pen className="w-4 h-4 inline mr-1" />여기에 서명해 주세요
                        </p>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <button onClick={clear}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                    다시 그리기
                </button>
                <button onClick={save} disabled={!hasContent}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    style={{
                        background: hasContent ? 'linear-gradient(135deg,#e8c87a,#c9a84c)' : 'rgba(201,168,76,0.15)',
                        color: hasContent ? '#04091a' : 'rgba(201,168,76,0.5)',
                    }}>
                    <CheckCircle2 className="w-4 h-4" /> 서명 확인
                </button>
            </div>
        </div>
    );
}

// ── 계약서 미리보기 (인쇄 가능) ─────────────────────────────
function ContractPreview({ form, signatureUrl }: { form: CmsForm; signatureUrl: string }) {
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div id="cms-contract" className="bg-white text-gray-900 p-8 rounded-xl text-sm leading-relaxed"
            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>

            <div className="text-center mb-8">
                <h1 className="text-xl font-black mb-1">CMS 자동출금 이체 동의서</h1>
                <p className="text-xs text-gray-500">법무법인 IBS</p>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-2 text-gray-700">▸ 신청인 정보</h3>
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                    <span className="text-gray-500">상호(법인명)</span><span className="font-medium">{form.companyName}</span>
                    <span className="text-gray-500">사업자등록번호</span><span className="font-medium">{form.bizNo}</span>
                    <span className="text-gray-500">대표자</span><span className="font-medium">{form.ceoName}</span>
                    <span className="text-gray-500">주소</span><span className="font-medium">{form.address}</span>
                    <span className="text-gray-500">연락처</span><span className="font-medium">{form.phone}</span>
                    <span className="text-gray-500">이메일</span><span className="font-medium">{form.email}</span>
                </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-2 text-gray-700">▸ 출금 계좌 정보</h3>
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                    <span className="text-gray-500">은행명</span><span className="font-medium">{form.bankName}</span>
                    <span className="text-gray-500">계좌번호</span><span className="font-medium">{form.accountNo}</span>
                    <span className="text-gray-500">예금주</span><span className="font-medium">{form.accountHolder}</span>
                </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-2 text-gray-700">▸ 이체 내용</h3>
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                    <span className="text-gray-500">이용 플랜</span><span className="font-medium">{form.plan}</span>
                    <span className="text-gray-500">월 출금액</span><span className="font-medium">{form.amount}원 (VAT 포함)</span>
                    <span className="text-gray-500">출금일</span><span className="font-medium">매월 5일</span>
                    <span className="text-gray-500">수취인</span><span className="font-medium">법무법인 IBS</span>
                </div>
            </div>

            <div className="mb-8 text-xs text-gray-600 leading-relaxed space-y-2">
                <p className="font-bold text-gray-700">▸ 동의 사항</p>
                <p>1. 위 계좌에서 매월 지정일에 상기 금액이 자동 출금되는 것에 동의합니다.</p>
                <p>2. 잔액 부족 시 다음 영업일에 재출금되며, 2회 연속 실패 시 서비스가 일시 중지될 수 있습니다.</p>
                <p>3. 해지를 원하시는 경우 출금일 5영업일 전까지 서면 또는 유선으로 통보해 주시기 바랍니다.</p>
                <p>4. 본 동의서는 전자서명법에 의한 전자서명으로 체결되며, 서면 계약과 동일한 법적 효력을 갖습니다.</p>
            </div>

            <div className="flex items-end justify-between border-t pt-6">
                <div>
                    <p className="text-xs text-gray-500 mb-1">{today}</p>
                    <p className="font-bold">신청인: {form.companyName}</p>
                    <p className="text-xs text-gray-500">대표 {form.ceoName}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">서명</p>
                    {signatureUrl ? (
                        <img src={signatureUrl} alt="서명" className="h-16 inline-block" />
                    ) : (
                        <div className="w-24 h-12 border-b-2 border-gray-300" />
                    )}
                </div>
            </div>
        </div>
    );
}

// ── 메인 ────────────────────────────────────────────────────
export default function CmsContractPage() {
    const [step, setStep] = useState<Step>('form');
    const [signatureUrl, setSignatureUrl] = useState('');
    const [form, setForm] = useState<CmsForm>({
        companyName: '', bizNo: '', ceoName: '', address: '',
        bankName: '', accountNo: '', accountHolder: '',
        phone: '', email: '', plan: 'Pro', amount: '990,000',
    });

    const updateForm = useCallback((key: keyof CmsForm, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const formatBiz = (v: string) => {
        const d = v.replace(/\D/g, '').slice(0, 10);
        if (d.length <= 3) return d;
        if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
        return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
    };

    const isFormValid = form.companyName && form.bizNo && form.ceoName && form.bankName && form.accountNo && form.accountHolder;

    const handlePrint = () => {
        const el = document.getElementById('cms-contract');
        if (!el) return;
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`
            <html><head><title>CMS 자동출금 동의서 — ${form.companyName}</title>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
            <style>body{font-family:'Noto Sans KR',sans-serif;padding:40px;color:#111}
            .bg-gray-50{background:#f9fafb}.rounded-lg{border-radius:8px}.p-4{padding:16px}
            .grid{display:grid}.grid-cols-2{grid-template-columns:1fr 1fr}.gap-y-1\\.5{row-gap:6px}
            .font-bold{font-weight:700}.font-medium{font-weight:500}.text-gray-500{color:#6b7280}
            .text-gray-700{color:#374151}.text-gray-600{color:#4b5563}.text-gray-400{color:#9ca3af}
            .text-xs{font-size:12px}.text-sm{font-size:14px}.mb-1{margin-bottom:4px}.mb-2{margin-bottom:8px}
            .mb-6{margin-bottom:24px}.mb-8{margin-bottom:32px}.border-t{border-top:1px solid #e5e7eb}
            .pt-6{padding-top:24px}.space-y-2>*+*{margin-top:8px}.leading-relaxed{line-height:1.6}
            @media print{body{padding:20mm}}
            </style></head><body>${el.outerHTML}</body></html>`);
        w.document.close();
        w.print();
    };

    const PLANS = [
        { id: 'Starter', price: '490,000' },
        { id: 'Pro', price: '990,000' },
        { id: 'Premium', price: '1,990,000' },
    ];

    const InputField = ({ label, value, onChange, placeholder, type = 'text' }: {
        label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
    }) => (
        <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.5)' }}>{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
                className="w-full px-4 py-2.5 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(52,211,153,0.2)', color: '#f0f4ff' }} />
        </div>
    );

    return (
        <div className="min-h-screen px-4 py-12"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(52,211,153,0.08) 0%, transparent 65%), #04091a' }}>

            <div className="max-w-xl mx-auto">
                {/* 헤더 */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/payment-guide" className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'rgba(240,244,255,0.4)' }}>
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-black" style={{ color: '#34d399' }}>
                            <Building2 className="w-5 h-5 inline mr-1.5" />CMS 자동출금 계약
                        </h1>
                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.35)' }}>
                            전자서명으로 간편하게 계약 완료
                        </p>
                    </div>
                </div>

                {/* 스텝 인디케이터 */}
                <div className="flex items-center gap-2 mb-8 px-2">
                    {['정보 입력', '계약서 확인', '전자서명', '완료'].map((s, i) => {
                        const stepIdx = ['form', 'preview', 'sign', 'done'].indexOf(step);
                        return (
                            <React.Fragment key={s}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                                        style={{
                                            background: i < stepIdx ? '#34d399' : i === stepIdx ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)',
                                            color: i < stepIdx ? '#04091a' : i === stepIdx ? '#34d399' : 'rgba(240,244,255,0.3)',
                                            border: i === stepIdx ? '2px solid #34d399' : '2px solid transparent',
                                        }}>
                                        {i < stepIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                                    </div>
                                    <span className="text-[9px] hidden sm:block" style={{ color: i === stepIdx ? '#34d399' : 'rgba(240,244,255,0.25)' }}>{s}</span>
                                </div>
                                {i < 3 && <div className="flex-1 h-px" style={{ background: i < stepIdx ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.06)' }} />}
                            </React.Fragment>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">

                    {/* ── STEP 1: 정보 입력 ── */}
                    {step === 'form' && (
                        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="p-6 rounded-2xl space-y-5"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>

                                {/* 신청인 정보 */}
                                <div>
                                    <h3 className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: '#34d399' }}>
                                        <User className="w-4 h-4" /> 신청인 정보
                                    </h3>
                                    <div className="space-y-3">
                                        <InputField label="상호(법인명)" value={form.companyName} onChange={v => updateForm('companyName', v)} placeholder="(주)교촌에프앤비" />
                                        <InputField label="사업자등록번호" value={form.bizNo}
                                            onChange={v => updateForm('bizNo', formatBiz(v))} placeholder="000-00-00000" />
                                        <InputField label="대표자" value={form.ceoName} onChange={v => updateForm('ceoName', v)} placeholder="홍길동" />
                                        <InputField label="주소" value={form.address} onChange={v => updateForm('address', v)} placeholder="서울시 강남구 테헤란로 123" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <InputField label="연락처" value={form.phone} onChange={v => updateForm('phone', v)} placeholder="010-0000-0000" />
                                            <InputField label="이메일" value={form.email} onChange={v => updateForm('email', v)} placeholder="email@company.com" />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                                {/* 출금 계좌 */}
                                <div>
                                    <h3 className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: '#34d399' }}>
                                        <Building2 className="w-4 h-4" /> 출금 계좌 정보
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.5)' }}>은행</label>
                                            <select value={form.bankName} onChange={e => updateForm('bankName', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl outline-none text-sm"
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(52,211,153,0.2)',
                                                    color: form.bankName ? '#f0f4ff' : 'rgba(240,244,255,0.3)',
                                                }}>
                                                <option value="">-- 은행 선택 --</option>
                                                {BANKS.map(b => <option key={b} value={b} style={{ background: '#0f1c3f' }}>{b}</option>)}
                                            </select>
                                        </div>
                                        <InputField label="계좌번호" value={form.accountNo} onChange={v => updateForm('accountNo', v)} placeholder="숫자만 입력" />
                                        <InputField label="예금주" value={form.accountHolder} onChange={v => updateForm('accountHolder', v)} placeholder="(주)교촌에프앤비" />
                                    </div>
                                </div>

                                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                                {/* 플랜 선택 */}
                                <div>
                                    <h3 className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: '#34d399' }}>
                                        <FileText className="w-4 h-4" /> 구독 플랜
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PLANS.map(p => (
                                            <button key={p.id}
                                                onClick={() => { updateForm('plan', p.id); updateForm('amount', p.price); }}
                                                className="p-3 rounded-xl text-center transition-all text-sm"
                                                style={{
                                                    background: form.plan === p.id ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.03)',
                                                    border: `2px solid ${form.plan === p.id ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                                                    color: form.plan === p.id ? '#34d399' : 'rgba(240,244,255,0.5)',
                                                }}>
                                                <p className="font-black">{p.id}</p>
                                                <p className="text-xs mt-0.5">{p.price}원</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={() => setStep('preview')} disabled={!isFormValid}
                                    className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                    style={{
                                        background: isFormValid ? 'linear-gradient(135deg,#34d399,#059669)' : 'rgba(52,211,153,0.15)',
                                        color: isFormValid ? '#04091a' : 'rgba(52,211,153,0.4)',
                                    }}>
                                    계약서 미리보기 <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 2: 계약서 미리보기 ── */}
                    {step === 'preview' && (
                        <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <ContractPreview form={form} signatureUrl="" />
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setStep('form')}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm"
                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    ← 수정
                                </button>
                                <button onClick={() => setStep('sign')}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg,#34d399,#059669)', color: '#04091a' }}>
                                    <Pen className="w-4 h-4" /> 전자서명
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 3: 전자서명 ── */}
                    {step === 'sign' && (
                        <motion.div key="sign" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <div className="p-6 rounded-2xl"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                                <h3 className="font-black text-base mb-1" style={{ color: '#34d399' }}>
                                    <Pen className="w-5 h-5 inline mr-1.5" />전자서명
                                </h3>
                                <p className="text-xs mb-5" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                    아래 영역에 서명을 그려주세요. 마우스 또는 터치로 서명할 수 있습니다.
                                </p>

                                <SignatureCanvas onSave={(url) => {
                                    setSignatureUrl(url);
                                    setStep('done');
                                }} />

                                <div className="flex items-center gap-2 p-3 rounded-lg mt-4"
                                    style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)' }}>
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(251,146,60,0.7)' }} />
                                    <p className="text-xs" style={{ color: 'rgba(251,146,60,0.7)' }}>
                                        전자서명법에 의거, 본 전자서명은 서면 날인과 동일한 효력을 갖습니다.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 4: 완료 ── */}
                    {step === 'done' && (
                        <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            {/* 완료 배너 */}
                            <div className="p-6 rounded-2xl text-center mb-6"
                                style={{ background: 'rgba(52,211,153,0.06)', border: '1.5px solid rgba(52,211,153,0.25)' }}>
                                <CheckCircle2 className="w-14 h-14 mx-auto mb-3" style={{ color: '#34d399' }} />
                                <h2 className="text-xl font-black mb-1" style={{ color: '#34d399' }}>CMS 계약 완료!</h2>
                                <p className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                    {form.companyName} · {form.plan} 플랜 · 월 {form.amount}원
                                </p>
                                <p className="text-xs mt-3" style={{ color: 'rgba(240,244,255,0.35)' }}>
                                    매월 5일 · {form.bankName} {form.accountNo.slice(0, 6)}***
                                </p>
                            </div>

                            {/* 서명된 계약서 */}
                            <div className="mb-4">
                                <p className="text-xs font-bold mb-2" style={{ color: 'rgba(240,244,255,0.4)' }}>▼ 서명된 계약서</p>
                                <ContractPreview form={form} signatureUrl={signatureUrl} />
                            </div>

                            {/* 인쇄/다운로드 */}
                            <div className="flex gap-3 mb-6">
                                <button onClick={handlePrint}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                    style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}>
                                    <Printer className="w-4 h-4" /> 인쇄하기
                                </button>
                                <button onClick={handlePrint}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                    style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>
                                    <Download className="w-4 h-4" /> PDF 저장
                                </button>
                            </div>

                            {/* 안내 */}
                            <div className="p-4 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <p className="text-xs font-bold mb-2" style={{ color: '#c9a84c' }}>📋 다음 단계</p>
                                {[
                                    '계약서 사본이 이메일로 자동 전송됩니다',
                                    '로펌에서 인쇄 후 은행에 CMS 등록을 진행합니다',
                                    '등록 완료 후 서비스가 정식 개시됩니다 (1~3영업일)',
                                    '첫 출금은 다음 달 5일에 진행됩니다',
                                ].map(t => (
                                    <p key={t} className="text-xs mt-1.5 flex items-start gap-2" style={{ color: 'rgba(240,244,255,0.55)' }}>
                                        <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                                        {t}
                                    </p>
                                ))}
                            </div>

                            <Link href="/dashboard">
                                <button className="w-full py-3.5 rounded-xl font-bold text-sm mt-6 flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                                    고객 포털로 이동 <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
