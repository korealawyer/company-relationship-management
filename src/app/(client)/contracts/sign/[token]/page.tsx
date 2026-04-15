'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FileText, CheckCircle2, Shield, 
    ArrowLeft, Send, AlertTriangle, 
    Eraser, Pencil, Lock, BadgeCheck, FileSignature, Clock, Building2, Gavel, Phone
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { getSession } from '@/lib/auth';
import { dataLayer } from '@/lib/dataLayer';

const GOLD = '#c9a84c';
const GOLD_LIGHT = '#e8c87a';

const MOCK_PRIVACY_TEXT = `[개인정보 처리방침 및 중요 고지사항]

1. 본 개인정보처리방침은 서비스 이용자가 안심하고 서비스를 이용할 수 있도록 제정되었습니다.
2. 수집하는 개인정보: 이메일, 이름, 연락처, 회사명 및 직책 등
3. 개인정보 수집 목적: 계약 이행 및 전자서명 내역 증명을 위한 안전한 보관.
4. 보유 및 이용 기간: 전자문서 및 전자거래 기본법 등 관련 법령에 의거하여 최장 5년간 보관.
5. 이용자는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으나, 거부 시 본 전자서명 서비스 제약이 발생합니다.`;

const PLANS = {
    basic: { name: 'Basic 플랜', price: '500,000' },
    pro: { name: 'Pro 플랜', price: '1,000,000' },
    premium: { name: 'Premium 플랜', price: '2,000,000' }
};
export type PlanType = keyof typeof PLANS;

interface ContractBodyProps {
    companyName: string;
    businessNumber: string;
    signatureDataUrl: string | null;
    address: string;
    ceoName: string;
    selectedPlan: PlanType;
    effectiveDateStr: string;
}

const ContractBody = ({ companyName, businessNumber, signatureDataUrl, address, ceoName, selectedPlan, effectiveDateStr }: ContractBodyProps) => {
    return (
        <div className="space-y-8 text-[15px] text-gray-800 font-medium leading-[2.2] tracking-tight whitespace-pre-wrap">
            <p className="text-center font-black text-2xl mb-12">법률 자문 계약서</p>
            <p>
                <span className="font-bold underline decoration-gray-300 underline-offset-4">{companyName}</span> (이하 “갑”이라 한다)과(와) <strong>IBS법률사무소</strong> (변호사 유정훈, 이하 “을”이라 한다)은 상호 이해와 협력으로 아래와 같이 합의하여 법률 자문계약(이하 “본 계약”이라 한다)을 체결한다.
            </p>

            <p><strong>제1조 (계약의 목적)</strong><br />
            본 계약은 갑의 프랜차이즈 비즈니스 모델에 대응 전략을 수립에 필요한 법률자문, 의사결정 파트너로서의 경영 및 법률, 협상심리 조언, 가맹점주와의 사전 분쟁을 검토하고, 통계적으로 경영에 반영할 수 있는 법률프로세스와 소송 등 분쟁에 대응하는 서비스를 제공하는 것을 목적으로 한다.</p>

            <p><strong>제2조 (위임사무의 범위)</strong><br />
            ① 을은 갑에게 제2조 2항의 서비스를 제공하고, 그 외 사안은 개별적으로 협의하여 별도 계약을 체결한다.<br />
            ② 갑의 프랜차이즈 비즈니스 모델에 대응 전략을 수립에 필요한 법률자문, 의사결정 파트너로서의 경영, 법률 및 협상심리 조언, 임직원 및 가맹점주 개개인의 법률상담 자문을 제공한다.</p>

            <p><strong>제3조 (기간)</strong><br />
            ① 을은 제2조의 위임사무를 갑에게 계약일({effectiveDateStr})로부터 1년간 제공한다.<br />
            ② 계약만료일 전 1개월 전에 별도의 서면에 의한 의사표시가 없으면 묵시적으로 연장된 것으로 한다.</p>

            <p><strong>제4조 (보수)</strong><br />
            갑은 을에게 제2조의 위임업무를 처리함에 있어 매월 {PLANS[selectedPlan].price}원을 보수로 <strong>기업은행 233-094886-01-019 유정훈  : IBS법률사무소</strong> 계좌로 입금한다.</p>

            <p><strong>제5조 (계약서 작성 등)</strong><br />
            본 계약서는 갑과 을 중 어느 당사자가 작성하였는지 관계없이 공정하게 해석되어야 하고, 갑과 을은 본 계약의 준비와 작성에 있어 각각 중대하고 필수적인 역할을 하였음을 인정하고 이에 동의한다.</p>
            
            <p>본 계약이 체결되었음을 증명하기 위하여 갑과 을은 본 계약서 2부 작성하도록 한 다음 서명 또는 기명날인하고, 각 1부씩 보관한다.</p>
            
            <p className="text-center mt-12 mb-12">{effectiveDateStr}</p>
            
            <div className="flex flex-col xl:flex-row justify-between mt-12 pt-12 border-t border-gray-300 gap-16">
                <div className="w-full xl:w-1/2 flex flex-col space-y-4">
                    <p className="font-bold text-lg">(갑) {companyName}</p>
                    <p>사업자번호 : {businessNumber}</p>
                    <p>주 소 : {address}</p>
                    <div className="flex items-center justify-between gap-4 mt-auto pt-4">
                        <p>대표이사 {ceoName}</p>
                        <div className="relative flex items-center pr-8">
                            <span className="font-bold text-lg">(인)</span>
                            {signatureDataUrl && (
                                <img src={signatureDataUrl} alt="서명" className="absolute bottom-0 left-[30%] -translate-x-1/2 translate-y-[15%] w-48 h-auto scale-125 origin-bottom mix-blend-multiply pointer-events-none" />
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="w-full xl:w-1/2 flex flex-col space-y-4 xl:pl-4">
                    <p className="font-bold text-lg">(을) IBS법률사무소</p>
                    <p>사업자번호 : 313-19-00140</p>
                    <div className="flex gap-2.5">
                        <p className="shrink-0">주 소 :</p>
                        <p>
                            서울시 서초구 서초대로 272 IBS빌딩<br />
                            서울시 서초구 서초대로 270 IBS법률상담센터
                        </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 mt-auto pt-4">
                        <p>대표변호사 유정훈</p>
                        <div className="relative flex items-center pr-8">
                            <span className="font-bold text-lg">(인)</span>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border-[2px] border-red-500 rounded-full flex items-center justify-center mix-blend-multiply opacity-80 transform -rotate-[15deg] pointer-events-none">
                                <span className="text-red-500 font-extrabold text-sm tracking-widest ml-1">직인</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NoiseTexture = () => (
    <>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
        />
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, #000 39px, #000 40px)`,
                backgroundSize: '100% 40px',
            }}
        />
    </>
);

export default function ContractSignPage(props: { params: Promise<{ token: string }> }) {
    const params = React.use(props.params);
    const router = useRouter();
    const [step, setStep] = useState<'review' | 'done'>('review');
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [companyName, setCompanyName] = useState('고객사');
    const [isLoading, setIsLoading] = useState(true);
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);

    const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
    const [businessNumber, setBusinessNumber] = useState('');
    const [address, setAddress] = useState('');
    const [ceoName, setCeoName] = useState('');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const effectiveDateStr = `${tomorrow.getFullYear()}년 ${tomorrow.getMonth() + 1}월 ${tomorrow.getDate()}일`;

    const updateSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            setSignatureDataUrl(canvas.toDataURL('image/png'));
        }
    };

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const session = getSession();
                if (session?.companyName) {
                    setCompanyName(session.companyName);
                }
                const trackId = params.token || session?.companyId;
                if (trackId) {
                    const c = await dataLayer.companies.getById(trackId);
                    if (c && c.status && ['contract_signed', 'payment_pending', 'active'].includes(c.status)) {
                        router.replace('/contracts');
                        return;
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        checkStatus();
    }, [params.token, router]);

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
                ctx.lineWidth = 30; // 원래 5에서 -> 10 -> 30으로 대폭 굵기 상향
                ctx.strokeStyle = '#0f172a'; // 다크네이비
            }
        }
    }, [step]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsDrawing(true);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#0f172a';

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            let clientX, clientY;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            ctx.beginPath();
            ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            let clientX, clientY;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
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
            updateSignature();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setHasSignature(false);
                setSignatureDataUrl(null);
            }
        }
    };

    const isFormValid = agreed && hasSignature && businessNumber.trim() !== '' && address.trim() !== '' && ceoName.trim() !== '';

    const handleSubmit = async () => {
        if (!isFormValid) {
            document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        setSubmitting(true);
        
        try {
            const session = getSession();
            if (session?.companyId) {
                // 1. Wait for typography rendering to settle
                await document.fonts.ready;

                // 2. Pick element to capture
                const contractElement = document.getElementById('contract-document');
                if (!contractElement) throw new Error('계약서 문서를 찾을 수 없습니다.');

                // 3. Client-side PDF generation (html2canvas -> jsPDF)
                const html2canvas = (await import('html2canvas')).default;
                const { jsPDF } = await import('jspdf');

                const canvas = await html2canvas(contractElement, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#faf9f6'
                });

                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                let heightLeft = pdfHeight;
                let position = 0;
                
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
                
                while (heightLeft >= 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pdf.internal.pageSize.getHeight();
                }

                const pdfBlob = pdf.output('blob');

                // 4. API Request: Insert record & get signed URL
                const response = await fetch('/api/contracts/finalize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        companyName,
                        businessNumber,
                        address,
                        ceoName,
                        selectedPlan,
                        signatureDataUrl,
                        companyId: session.companyId
                    })
                });

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || 'API Request Failed');
                }

                // 5. Upload via Signed URL
                if (result.signedUploadUrl) {
                    const uploadResponse = await fetch(result.signedUploadUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/pdf'
                        },
                        body: pdfBlob
                    });

                    if (!uploadResponse.ok) {
                        throw new Error('PDF 업로드에 실패했습니다.');
                    }
                }

                if (result.documentUrl) {
                    setDocumentUrl(result.documentUrl);
                }

                // 6. Complete status upgrade
                await dataLayer.companies.update(session.companyId, {
                    status: 'contract_signed',
                    contract_signed_at: new Date().toISOString()
                } as any);

                await new Promise(resolve => setTimeout(resolve, 500));
                
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#b8960a', '#e8c87a', '#22c55e', '#3b82f6']
                });

                setStep('done');
            } else {
                console.warn('세션이 없어 DB에 반영되지 않았습니다.');
                alert('로그인 세션이 만료되었습니다. 다시 로그인 해 주세요.');
            }
        } catch (error: any) {
            console.error('계약 저장 오류:', error);
            alert(`계약 처리 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e5e3db' }}>
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (step === 'done') {
        return (
            <div className="min-h-screen relative flex items-center justify-center px-4" style={{ backgroundColor: '#e5e3db' }}>
                <NoiseTexture />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full relative z-10 text-center rounded-2xl p-10"
                    style={{
                        background: '#faf9f6',
                        boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
                        borderTop: `4px solid ${GOLD}`
                    }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
                        <CheckCircle2 className="w-20 h-20 mx-auto mb-6" style={{ color: '#22c55e' }} />
                    </motion.div>
                    <h2 className="text-3xl font-black mb-3 text-gray-900 tracking-tight">계약 체결 완료</h2>
                    <p className="text-sm font-medium mb-8 text-gray-500 leading-relaxed">
                        법률자문 계약의 전자서명이 성공적으로 처리되었습니다.<br/>
                        안전한 암호화 과정을 거쳐 블록체인에 위변조 방지 등록됩니다.
                    </p>
                    <div className="rounded-xl p-5 mb-8 text-left"
                        style={{ background: '#f8f7f5', border: '1px solid #e8e5de' }}>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                <span className="font-bold text-gray-400">문서 번호</span>
                                <span className="font-black text-gray-900">IBS-CTR-2026-6421</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-400">체결 일시</span>
                                <span className="font-black text-gray-900">
                                    {new Date().toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    {documentUrl ? (
                        <div className="flex gap-4">
                            <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                                <button className="w-full py-4 rounded-xl font-black text-[15px] border-2 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                                    style={{ borderColor: GOLD, color: GOLD }}>
                                    <FileText className="w-5 h-5" />
                                    PDF 다운로드
                                </button>
                            </a>
                            <Link href="/contracts" className="flex-1">
                                <button className="w-full h-full py-4 rounded-xl font-black text-[15px] transition-all hover:scale-105 shadow-[0_8px_30px_rgba(201,168,76,0.25)]"
                                    style={{ 
                                        background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, 
                                        color: '#0a0e1a'
                                    }}>
                                    내 서재 복귀
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <Link href="/contracts">
                            <button className="w-full py-4 rounded-xl font-black text-[15px] transition-all hover:scale-105 shadow-[0_8px_30px_rgba(201,168,76,0.25)]"
                                style={{ 
                                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, 
                                    color: '#0a0e1a'
                                }}>
                                내 전자계약함으로 복귀
                            </button>
                        </Link>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative" style={{ backgroundColor: '#e5e3db' }}>
            {/* ─── 상단 툴바 ─── */}
            <div className="sticky top-0 z-[150] backdrop-blur-xl border-b" style={{ backgroundColor: 'rgba(245,243,238,0.92)', borderColor: '#e8e5de' }}>
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> 뒤로 가기
                    </button>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                        <FileSignature className="w-3.5 h-3.5" />
                        <span>계약서 전자서명</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-1 text-[11px] font-bold text-gray-400">
                            <Clock className="w-3 h-3" />
                            {dateStr}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 메인 콘텐츠 영역 ─── */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8 pb-40">
                <div className="flex flex-col xl:flex-row gap-8 items-start">
                    
                    {/* ═══════════════════════════════════════════
                        좌측: 계약서 본문 (전자책 스타일)
                    ═══════════════════════════════════════════ */}
                    <div className="w-full xl:flex-1 min-w-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative overflow-hidden"
                            style={{
                                background: '#faf9f6',
                                borderRadius: '4px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.03)',
                                borderTop: `4px solid ${GOLD}`,
                            }}
                        >
                            <NoiseTexture />
                            
                            <div id="contract-document" className="relative z-10 px-8 md:px-16 py-12 md:py-16" style={{ backgroundColor: '#faf9f6' }}>
                                {/* 문서 분류 마크 */}
                                <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: `${GOLD}15` }}>
                                            <Building2 className="w-3 h-3" style={{ color: GOLD }} />
                                        </div>
                                        <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: GOLD }}>
                                            전자 계약서 서명
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: '#fef2f2' }}>
                                        <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-red-500" />
                                        <span className="text-[10px] font-black text-red-600">
                                            서명 대기중
                                        </span>
                                    </div>
                                </div>

                                {/* 제목 */}
                                <h1 className="text-3xl md:text-[40px] font-black text-gray-900 leading-[1.2] tracking-tight mb-4">
                                    법률자문 <span style={{ color: GOLD }}>계약서</span>
                                </h1>
                                <p className="text-[15px] text-gray-500 font-medium leading-relaxed max-w-2xl mb-10">
                                    아래 계약 내용을 상세히 확인하신 후 우측 패널에서 모든 약관에 동의하고 자필 서명을 진행해 주세요. 본 계약은 전자서명법 제3조에 따라 종이문서와 동일한 법적 효력을 가집니다.
                                </p>

                                {/* 계약서 본문 */}
                                <div className="relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-100 rounded-full" />
                                    <div className="pl-6">
                                        <ContractBody 
                                            companyName={companyName} 
                                            businessNumber={businessNumber}
                                            signatureDataUrl={signatureDataUrl} 
                                            address={address}
                                            ceoName={ceoName}
                                            selectedPlan={selectedPlan}
                                            effectiveDateStr={effectiveDateStr}
                                        />
                                    </div>
                                </div>

                                <div className="mt-16 pt-8 border-t border-gray-200 border-dashed">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shield className="w-4 h-4 text-gray-400" />
                                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">개인정보 처리방침 및 고지사항</h3>
                                    </div>
                                    <div className="p-6 rounded-xl bg-gray-50/50 border border-gray-100 text-[13px] text-gray-600 font-medium leading-[1.8] whitespace-pre-wrap">
                                        {MOCK_PRIVACY_TEXT}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ═══════════════════════════════════════════
                        우측: 액션 사이드바 (서명 및 동의)
                    ═══════════════════════════════════════════ */}
                    <div className="w-full xl:w-[380px] shrink-0 xl:sticky xl:top-20">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                            id="form-top"
                        >

                            {/* 구독제 서비스 선택 */}
                            <div className="rounded-xl overflow-hidden p-6" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <h3 className="text-[13px] font-black text-gray-900 mb-3">구독제 서비스 선택</h3>
                                <div className="space-y-2">
                                    {Object.entries(PLANS).map(([key, plan]) => (
                                        <label key={key} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${selectedPlan === key ? 'border-amber-500 bg-amber-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="radio" 
                                                    name="plan" 
                                                    value={key} 
                                                    checked={selectedPlan === key} 
                                                    onChange={() => setSelectedPlan(key as PlanType)}
                                                    className="w-4 h-4 text-amber-500 border-gray-300 focus:ring-amber-500"
                                                />
                                                <span className="text-sm font-bold text-gray-800">{plan.name}</span>
                                            </div>
                                            <span className="text-[13px] font-black text-gray-900">월 {plan.price}원</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 계약 문의 안내 */}
                            <div className="rounded-xl overflow-hidden px-6 py-5" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-[12px] font-bold text-gray-500 mb-0.5">계약 문의 (IBS법률사무소 기업법무전담팀)</h3>
                                        <p className="text-[15px] font-black text-gray-900" style={{ color: '#c9a84c' }}>02-537-8720</p>
                                    </div>
                                </div>
                            </div>

                            {/* 회사 정보 입력 */}
                            <div className="rounded-xl overflow-hidden p-6" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <h3 className="text-[13px] font-black text-gray-900 mb-4">회사 정보 입력</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 mb-1.5">사업자 등록번호</label>
                                        <input 
                                            type="text" 
                                            value={businessNumber}
                                            onChange={e => setBusinessNumber(e.target.value)}
                                            placeholder="예: 123-45-67890"
                                            className="w-full text-gray-900 text-sm font-medium px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-amber-500 focus:bg-white bg-gray-50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 mb-1.5">사업장 주소</label>
                                        <input 
                                            type="text" 
                                            value={address}
                                            onChange={e => setAddress(e.target.value)}
                                            placeholder="예: 서울특별시 강남구 테헤란로 123"
                                            className="w-full text-gray-900 text-sm font-medium px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-amber-500 focus:bg-white bg-gray-50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 mb-1.5">대표이사 성명</label>
                                        <input 
                                            type="text" 
                                            value={ceoName}
                                            onChange={e => setCeoName(e.target.value)}
                                            placeholder="대표자 이름 입력"
                                            className="w-full text-gray-900 text-sm font-medium px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-amber-500 focus:bg-white bg-gray-50 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl overflow-hidden p-6" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                {/* 약관 동의 */}
                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <button
                                        onClick={() => setAgreed(!agreed)}
                                        className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center transition-all group-hover:bg-amber-50"
                                        style={{
                                            background: agreed ? GOLD : 'transparent',
                                            border: `2px solid ${agreed ? GOLD : '#d1d5db'}`,
                                        }}
                                    >
                                        {agreed && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </button>
                                    <div>
                                        <p className="font-bold text-[14px] mb-1 transition-colors"
                                           style={{ color: agreed ? '#92400e' : '#111827' }}>
                                            계약 내용 및 방침 일괄 동의
                                        </p>
                                        <p className="text-[12px] text-gray-500 font-medium leading-relaxed">
                                            전자서명의 법적 효력 발생에 동의하며, 자사가 본 계약에 귀속됨을 확인합니다.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* 자필 서명 패드 */}
                            <div className="rounded-xl p-6" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-sm font-black flex items-center gap-2 text-gray-900">
                                        <Pencil className="w-4 h-4 text-gray-400" /> 자필 서명란
                                    </h2>
                                    <button onClick={clearCanvas} className="text-[11px] font-bold flex items-center gap-1.5 px-2 py-1 rounded transition-colors hover:bg-gray-100 bg-gray-50 text-gray-500 border border-gray-200">
                                        <Eraser className="w-3 h-3" /> 지우기
                                    </button>
                                </div>
                                
                                <div className="w-full rounded-md overflow-hidden relative cursor-crosshair touch-none bg-gray-50"
                                    style={{ border: `1px dashed ${hasSignature ? GOLD : '#d1d5db'}` }}>
                                    {(!hasSignature && !isDrawing) && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <p className="text-[13px] font-bold text-gray-400">
                                                도장 패드에 마우스/터치로 서명하세요
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
                                        className="w-full h-[180px]"
                                    />
                                </div>
                            </div>

                            {/* 제출 버튼 */}
                            <button onClick={handleSubmit} 
                                    disabled={submitting}
                                className="w-full py-4 rounded-xl font-black text-[15px] flex items-center justify-center gap-2 transition-all block"
                                style={{
                                    background: !isFormValid ? '#f3f4f6' : `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                                    color: !isFormValid ? '#9ca3af' : '#0a0e1a',
                                    boxShadow: (isFormValid && !submitting) ? `0 6px 24px ${GOLD}40` : 'none',
                                    border: !isFormValid ? '1px solid #e5e7eb' : 'none',
                                    cursor: submitting ? 'wait' : 'pointer',
                                    opacity: submitting ? 0.7 : 1,
                                }}>
                                {submitting ? (
                                    <><div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> 처리 중...</>
                                ) : (
                                    <><BadgeCheck className="w-5 h-5" /> 법률자문 계약 체결하기</>
                                )}
                            </button>
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
}
