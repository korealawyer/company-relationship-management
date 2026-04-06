'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FileText, CheckCircle2, Shield, 
    ArrowLeft, Send, AlertTriangle, 
    Eraser, Pencil 
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { getSession } from '@/lib/auth';
import { dataLayer } from '@/lib/dataLayer';

// 라이트 테마 색상 (로그인 페이지와 동일)
const L = {
    bg: '#f8f9fc',
    card: '#ffffff',
    heading: '#0f172a',
    body: '#1e293b',
    sub: '#475569',
    muted: '#64748b',
    faint: '#94a3b8',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    gold: '#b8960a',
    goldLight: '#fef9e7',
    goldBorder: '#fde68a',
};

const MOCK_CONTRACT_TEXT = `제1조 (자문의 범위)
을은 갑에게 다음의 법률자문 서비스를 제공한다.
1. 개인정보처리방침 검토 및 수정 자문
2. 가맹계약서 법률 검토
3. 노동법 관련 자문
4. 기업 일반 법률 상담

제2조 (자문료)
월간 자문료는 금 500,000원(부가가치세 별도)으로 하며, 
매월 말일에 청구한다.

제3조 (계약기간)
본 계약의 유효기간은 2026년 4월 1일부터 1년간으로 하며,
어느 일방이 해지를 통보하지 않는 한 동일 조건으로 자동 갱신된다.

제4조 (비밀유지)
을은 자문 과정에서 알게 된 갑의 비밀정보를 제3자에게 누설하지 않으며,
본 계약 종료 후에도 비밀유지 의무를 준수한다.`;

const MOCK_PRIVACY_TEXT = `[개인정보 처리방침 및 중요 고지사항]

1. 본 개인정보처리방침은 서비스 이용자가 안심하고 서비스를 이용할 수 있도록 제정되었습니다.
2. 수집하는 개인정보: 이메일, 이름, 연락처, 회사명 및 직책 등
3. 개인정보 수집 목적: 계약 이행 및 전자서명 내역 증명을 위한 안전한 보관.
4. 보유 및 이용 기간: 전자문서 및 전자거래 기본법 등 관련 법령에 의거하여 최장 5년간 보관.
5. 이용자는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으나, 거부 시 본 전자서명 서비스 제약이 발생합니다.`;

export default function ContractSignPage({ params }: { params: { token: string } }) {
    const [step, setStep] = useState<'review' | 'done'>('review');
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Canvas 참조
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        if (canvasRef.current && step === 'review') {
            const canvas = canvasRef.current;
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = 200;
            }
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = 3;
                ctx.strokeStyle = L.heading; // 서명 색상을 다크네이비 계열로 변경
            }
        }
    }, [step]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsDrawing(true);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            ctx.beginPath();
            ctx.moveTo(clientX - rect.left, clientY - rect.top);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            ctx.lineTo(clientX - rect.left, clientY - rect.top);
            ctx.stroke();
            setHasSignature(true);
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.closePath();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setHasSignature(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!agreed || !hasSignature) return;
        setSubmitting(true);
        
        try {
            const session = getSession();
            if (session?.companyId) {
                // 1. 계약 기록을 저장 (Mock 계약 번호 포함)
                await dataLayer.contracts.create({
                    id: crypto.randomUUID(), // 임의 ID
                    title: '법률자문 계약 (Pro 플랜)',
                    template: '자문 계약서',
                    party_a_name: 'test_ibs',
                    party_a_signed: true,
                    party_b_name: session.companyName || '고객사',
                    party_b_email: session.email || '',
                    party_b_signed: true,
                    status: 'both_signed',
                    content: MOCK_CONTRACT_TEXT,
                });

                // 2. 회사 상태를 'contract_signed' (서명 완료, 입금/승인 대기)로 변경. 
                //    플랜은 결제 확인 후 영업/관리자가 수동으로 변경하도록 합니다.
                await dataLayer.companies.update(session.companyId, {
                    status: 'contract_signed',
                    contract_signed_at: new Date().toISOString()
                } as any);
            } else {
                console.warn('세션(회사 ID)이 없어 DB에 반영되지 않았습니다. 테스트 모드입니다.');
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#b8960a', '#e8c87a', '#22c55e', '#3b82f6']
            });

            setStep('done');
        } catch (error) {
            console.error('계약 저장 오류:', error);
            alert('계약 처리 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (step === 'done') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" 
                 style={{ background: `linear-gradient(135deg, ${L.bg} 0%, #eef2ff 50%, #fef9e7 100%)` }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center rounded-2xl p-10"
                    style={{
                        background: L.card,
                        border: `1px solid ${L.border}`,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                    }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
                        <CheckCircle2 className="w-20 h-20 mx-auto mb-6" style={{ color: '#22c55e' }} />
                    </motion.div>
                    <h2 className="text-2xl font-black mb-2" style={{ color: L.heading }}>서명 완료!</h2>
                    <p className="text-sm mb-6" style={{ color: L.sub }}>
                        계약서 전자서명이 성공적으로 처리되었습니다.
                    </p>
                    <div className="rounded-xl p-4 mb-6"
                        style={{ background: L.borderLight, border: `1px solid ${L.border}` }}>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span style={{ color: L.muted }}>문서 번호</span>
                                <span className="font-bold" style={{ color: L.heading }}>IBS-CTR-2026-6421</span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: L.muted }}>체결 일시</span>
                                <span className="font-bold" style={{ color: L.heading }}>
                                    {new Date().toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Link href="/dashboard">
                        <button className="w-full py-4 rounded-xl font-bold text-sm transition-all"
                            style={{ 
                                background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', 
                                color: '#0f172a',
                                boxShadow: '0 2px 12px rgba(184,150,10,0.25)' 
                            }}>
                            내 사건 대시보드로 이동
                        </button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 px-4" 
             style={{ background: `linear-gradient(135deg, ${L.bg} 0%, #eef2ff 50%, #fef9e7 100%)` }}>
            
            {/* 배경 장식 */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,150,10,0.06) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 70%)' }} />
            </div>

            <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-8 relative z-10">
                
                {/* 좌측: 계약서 및 안내 문구 */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <Link href="/documents">
                            <button className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
                                style={{ color: L.muted, background: L.card, border: `1px solid ${L.border}` }}>
                                <ArrowLeft className="w-4 h-4" /> 뒤로 가기
                            </button>
                        </Link>
                    </div>
                    
                    <div>
                        <h1 className="text-3xl font-black mb-2" style={{ color: L.heading }}>
                            계약서 전자서명
                        </h1>
                        <p className="text-sm" style={{ color: L.sub }}>
                            계약 내용을 확인하시고 우측 패드에 서명을 진행해 주세요.
                        </p>
                    </div>

                    {/* 계약서 본문 확인 영역 */}
                    <div className="rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
                        style={{ background: L.card, border: `1px solid ${L.border}` }}>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5" style={{ color: L.gold }} />
                            <h2 className="text-sm font-black" style={{ color: L.heading }}>법률자문 계약서</h2>
                        </div>
                        <div className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-line font-mono overflow-y-auto max-h-[300px]"
                            style={{ background: L.borderLight, border: `1px solid ${L.border}`, color: L.body }}>
                            {MOCK_CONTRACT_TEXT}
                        </div>
                    </div>

                    {/* 개인정보 처리방침 안내 영역 */}
                    <div className="rounded-2xl p-6 shadow-sm"
                        style={{ background: L.card, border: `1px solid ${L.border}` }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5" style={{ color: '#3b82f6' }} />
                            <h2 className="text-sm font-black" style={{ color: L.heading }}>개인정보 처리방침 및 고지사항</h2>
                        </div>
                        <div className="p-4 rounded-xl text-xs leading-relaxed whitespace-pre-line font-mono overflow-y-auto max-h-[200px]"
                            style={{ background: L.borderLight, border: `1px solid ${L.border}`, color: L.sub }}>
                            {MOCK_PRIVACY_TEXT}
                        </div>
                    </div>
                </div>

                {/* 우측: 동의 및 서명 패드 */}
                <div className="lg:col-span-2">
                    <div className="sticky top-24 pt-11">
                        
                        {/* 약관 동의 */}
                        <div className="rounded-2xl p-6 mb-6 shadow-sm transition-all"
                            style={{ 
                                background: agreed ? L.goldLight : L.card, 
                                border: `1px solid ${agreed ? L.goldBorder : L.border}` 
                            }}>
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <button
                                    onClick={() => setAgreed(!agreed)}
                                    className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
                                    style={{
                                        background: agreed ? L.gold : L.borderLight,
                                        border: `2px solid ${agreed ? L.gold : L.border}`,
                                    }}
                                >
                                    {agreed && <CheckCircle2 className="w-4 h-4" style={{ color: '#ffffff' }} />}
                                </button>
                                <div>
                                    <p className="font-bold text-sm mb-1 transition-colors"
                                       style={{ color: agreed ? '#927708' : L.heading }}>
                                        계약 내용 및 개인정보 처리방침 동의
                                    </p>
                                    <p className="text-xs" style={{ color: L.sub }}>
                                        위 계약서 및 방침 내용을 모두 확인하였으며, 본 전자서명을 통해 법적 효력이 발생함에 동의합니다.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* 서명 패드 */}
                        <div className="rounded-2xl p-6 mb-8 flex flex-col items-center shadow-sm"
                            style={{ background: L.card, border: `1px solid ${L.border}` }}>
                            <div className="w-full flex justify-between items-center mb-4">
                                <h2 className="text-sm font-black flex items-center gap-2" style={{ color: L.heading }}>
                                    <Pencil className="w-4 h-4 text-amber-500" /> 자필 서명란
                                </h2>
                                <button onClick={clearCanvas} className="text-[11px] font-bold flex items-center gap-1.5 px-2 py-1 rounded transition-colors hover:bg-gray-100"
                                    style={{ color: L.sub, background: L.borderLight }}>
                                    <Eraser className="w-3 h-3" /> 초기화
                                </button>
                            </div>
                            
                            <div className="w-full rounded-xl overflow-hidden relative cursor-crosshair touch-none"
                                style={{ background: '#ffffff', border: `1px dashed ${L.gold}` }}>
                                {(!hasSignature && !isDrawing) && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <p className="text-sm font-bold" style={{ color: L.faint }}>
                                            이곳에 서명해 주세요
                                        </p>
                                    </div>
                                )}
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    className="w-full h-[200px]"
                                />
                            </div>
                        </div>

                        <div className="rounded-xl p-3 mb-6 flex items-start gap-2"
                            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                            <p className="text-[11px]" style={{ color: '#991b1b' }}>
                                본 서명은 자필 서명과 동일한 법적 효력을 가지며, 서명된 문서는 암호화되어 안전하게 보관됩니다.
                            </p>
                        </div>

                        {/* 제출 버튼 */}
                        <button onClick={handleSubmit} 
                                disabled={!agreed || !hasSignature || submitting}
                            className="w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all block"
                            style={{
                                background: (!agreed || !hasSignature) ? L.borderLight : 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                color: (!agreed || !hasSignature) ? L.faint : '#0f172a',
                                boxShadow: (agreed && hasSignature && !submitting) ? '0 2px 12px rgba(184,150,10,0.25)' : 'none',
                                border: (!agreed || !hasSignature) ? `1px solid ${L.border}` : 'none',
                                cursor: (!agreed || !hasSignature) ? 'not-allowed' : submitting ? 'wait' : 'pointer',
                                opacity: submitting ? 0.7 : 1,
                            }}>
                            {submitting ? (
                                <><div className="w-5 h-5 border-2 border-amber-900 border-t-transparent rounded-full animate-spin" /> 전송 중...</>
                            ) : (
                                <><Send className="w-5 h-5" /> 서명 완료 제출하기</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}