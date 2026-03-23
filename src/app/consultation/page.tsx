'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Scale, MessageSquare, Shield, Users,
    CheckCircle2, ArrowRight, Clock, Star, ChevronDown,
    CreditCard, Phone, BadgeCheck, AlertTriangle,
    FileSignature, Gavel, Building2, Briefcase, UploadCloud, X, Crown
} from 'lucide-react';
import Link from 'next/link';
import { consultStore, documentStore, store } from '@/lib/mockStore';
import { getSession } from '@/lib/auth';

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
        color: '#fcd34d',
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
    const subCost = 330000;
    const saving = singleCost - subCost;
    const shouldSub = saving > 0;

    return (
        <motion.div layout
            className="mt-6 p-6 rounded-3xl relative overflow-hidden backdrop-blur-xl"
            style={{
                background: shouldSub ? 'linear-gradient(145deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.02) 100%)' : 'rgba(255,255,255,0.02)',
                border: shouldSub ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: shouldSub ? '0 10px 40px -10px rgba(201,168,76,0.15)' : 'none'
            }}>
            {shouldSub && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c] rounded-full blur-[80px] opacity-20 transform translate-x-1/2 -translate-y-1/2" />
            )}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex-1 text-center md:text-left">
                    <p className="text-sm font-medium tracking-wide text-blue-200/50 mb-1">단건 합계 (월 {selectedCount}건 기준)</p>
                    <p className="font-extrabold text-3xl text-white tracking-tight">
                        ₩{singleCost.toLocaleString()}
                    </p>
                </div>
                
                <div className="flex flex-col items-center px-6">
                    <div className="w-px h-8 bg-white/10 hidden md:block mb-2" />
                    <span className="text-xs font-bold text-white/30 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">vs</span>
                    <div className="w-px h-8 bg-white/10 hidden md:block mt-2" />
                </div>
                
                <div className="flex-1 text-center md:text-right">
                    <p className="text-sm font-medium tracking-wide text-[#c9a84c]/60 mb-1">구독 Entry (월 무제한 혜택)</p>
                    <p className="font-extrabold text-3xl text-[#c9a84c] tracking-tight">
                        ₩{subCost.toLocaleString()}
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {shouldSub && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#c9a84c]/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <ArrowRight className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-green-400/80 uppercase tracking-wider mb-0.5">추천 옵션</p>
                                <p className="text-base font-bold text-white">
                                    구독으로 월 <span className="text-green-400">₩{saving.toLocaleString()}</span> 절감 가능!
                                </p>
                            </div>
                        </div>
                        <Link href="/pricing">
                            <button className="whitespace-nowrap w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#c9a84c] to-[#e8c87a] text-black shadow-lg shadow-[#c9a84c]/20 hover:scale-105 transition-all">
                                구독 플랜 알아보기 →
                            </button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
            {!shouldSub && selectedCount === 1 && (
                <p className="text-xs text-center md:text-left mt-4 text-white/30 font-medium">
                    월 7건 이상 이용 시 구독 멤버십이 더 저렴합니다.
                </p>
            )}
        </motion.div>
    );
}

// ── 주문 폼 모달 ────────────────────────────────────
function OrderModal({ service, onClose }: { service: typeof SERVICES[0]; onClose: () => void }) {
    const session = typeof window !== 'undefined' ? getSession() : null;
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', detail: '' });
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        
        let companyId = session?.companyId;
        if (!companyId) {
            const allCompanies = store.getAll();
            companyId = allCompanies.length > 0 ? allCompanies[0].id : 'new-company-id';
        }

        const uploadedDocs: any[] = [];
        files.forEach(file => {
            const doc = documentStore.upload({
                companyId: companyId!,
                authorRole: 'client',
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                category: '기타',
                status: '검토 대기',
                url: URL.createObjectURL(file), 
                isNewForClient: false,
                isNewForLawyer: true
            });
            uploadedDocs.push(doc);
        });

        let mappedCategory: any = '기타';
        if (service.category.includes('계약')) mappedCategory = '가맹계약';
        if (service.category.includes('개인정보')) mappedCategory = '개인정보';
        if (service.category.includes('노무')) mappedCategory = '노무';

        consultStore.submit({
            companyId: companyId,
            companyName: form.company || '미지정',
            branchName: '본점',
            authorName: form.name,
            authorRole: '임직원',
            category: mappedCategory,
            title: `[${service.title}] ${form.detail.substring(0, 20)}...`,
            body: form.detail,
            urgency: 'normal'
        });

        window.dispatchEvent(new Event('ibs-consults-updated'));
        
        setIsSubmitting(false);
        setIsDone(true);
        setTimeout(() => onClose(), 2500);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
            onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 30, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-xl rounded-[2rem] p-8 relative overflow-hidden bg-[#0a0f1c]/90 border border-white/10 shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}>
                
                {/* 배경 글로우 효과 */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#c9a84c] rounded-full mix-blend-screen filter blur-[100px] opacity-10" />

                <div className="relative z-10 flex-1 flex flex-col">
                    {/* 모달 헤더 */}
                    <div className="flex items-start gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10 shadow-inner">
                            <service.icon className="w-7 h-7" style={{ color: service.color }} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-extrabold text-xl text-white tracking-tight">{service.title}</h3>
                            <div className="flex items-center gap-3 mt-1.5 text-sm">
                                <span className="font-medium bg-white/10 px-2 py-0.5 rounded text-white/80">
                                    ₩{service.price.toLocaleString()}
                                </span>
                                <span className="text-white/40 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> 답변 {service.turnaround}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* 스텝 인디케이터 */}
                    {!isDone && (
                        <div className="flex items-center gap-2 mb-8">
                            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#c9a84c]' : 'bg-white/10'}`} />
                            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#c9a84c]' : 'bg-white/10'}`} />
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-5 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block text-blue-200/60 uppercase tracking-wider">담당자 성함 *</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/10 transition-all placeholder-white/20" 
                                        placeholder="홍길동"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block text-blue-200/60 uppercase tracking-wider">회사명</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/10 transition-all placeholder-white/20" 
                                        placeholder="(주)회사명"
                                        value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block text-blue-200/60 uppercase tracking-wider">연락처 *</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/10 transition-all placeholder-white/20" 
                                        type="tel" placeholder="010-0000-0000"
                                        value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1.5 block text-blue-200/60 uppercase tracking-wider">이메일 *</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/10 transition-all placeholder-white/20" 
                                        type="email" placeholder="name@company.com"
                                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold mb-1.5 block text-blue-200/60 uppercase tracking-wider flex justify-between">
                                    <span>상황 설명 *</span>
                                    <span className="font-normal normal-case opacity-50">구체적일수록 빠릅니다</span>
                                </label>
                                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 focus:bg-white/10 transition-all placeholder-white/20 resize-none" 
                                    rows={4}
                                    placeholder="예) 프랜차이즈 계약서 서명 전 독소 조항 여부 확인 요청 등"
                                    value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold mb-1.5 block text-blue-200/60 uppercase tracking-wider">참고 자료 첨부 (최대 10MB)</label>
                                <div className="relative">
                                    <input 
                                        type="file" multiple id="consult-file-upload" className="hidden"
                                        onChange={e => {
                                            const newFiles = Array.from(e.target.files || []);
                                            const valid = newFiles.filter(f => f.size <= 10 * 1024 * 1024);
                                            if (valid.length < newFiles.length) alert('10MB 이하의 파일만 첨부 가능합니다.');
                                            setFiles(prev => [...prev, ...valid]);
                                        }}
                                    />
                                    <label htmlFor="consult-file-upload" 
                                        className="flex flex-col items-center justify-center gap-2 w-full py-6 rounded-xl border border-dashed border-white/20 hover:bg-white/5 transition-colors cursor-pointer text-sm text-white/60">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-1">
                                            <UploadCloud className="w-5 h-5 text-white/50" />
                                        </div>
                                        <span className="font-medium">클릭하여 파일 업로드</span>
                                        <span className="text-xs text-white/30">PDF, Word, Excel 등 지원</span>
                                    </label>
                                </div>
                                {files.length > 0 && (
                                    <div className="mt-3 space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                        {files.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/5 border border-white/10 text-white/80">
                                                <span className="font-medium truncate max-w-[80%]">{file.name} ({(file.size/1024/1024).toFixed(1)}MB)</span>
                                                <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/50 hover:text-white">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setStep(2)}
                                disabled={!form.name || !form.phone || !form.email || !form.detail}
                                className="w-full mt-4 py-4 rounded-xl font-bold text-[15px] bg-gradient-to-r from-[#c9a84c] to-[#e8c87a] text-black shadow-lg shadow-[#c9a84c]/20 disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 disabled:shadow-none transition-all flex items-center justify-center gap-2 group">
                                다음: 결제 확인 진행 <ArrowRight className="w-4 h-4 group-disabled:hidden" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 flex-1 flex flex-col">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/10 rounded-full blur-3xl" />
                                <h4 className="font-extrabold text-sm mb-4 text-[#c9a84c] tracking-widest uppercase">최종 의뢰 확인</h4>
                                <div className="space-y-3.5 text-sm">
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                        <span className="text-white/50 font-medium">선택 서비스</span>
                                        <span className="text-white font-bold">{service.title}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-white/50">의뢰인</span>
                                        <span className="text-white">{form.name} <span className="text-white/40">{form.company && `(${form.company})`}</span></span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-white/50">답변 보장 기한</span>
                                        <span className="text-green-400 font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {service.turnaround} 이내</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-white/10">
                                        <span className="font-bold text-white/80">최종 결제 금액</span>
                                        <span className="font-extrabold text-2xl text-[#c9a84c]">₩{service.price.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {isDone ? (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-10 text-center flex-1 flex flex-col justify-center items-center">
                                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-5 relative">
                                        <div className="absolute inset-0 rounded-full border border-green-500/30 animate-ping" />
                                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                                    </div>
                                    <h4 className="font-extrabold text-2xl text-white mb-2 tracking-tight">접수가 완료되었습니다</h4>
                                    <p className="text-sm text-white/50 max-w-xs leading-relaxed">배정된 담당 변호사가 서류를 검토한 후 입력해주신 연락처로 연락드립니다.</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-3 mt-auto pt-4">
                                    <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-4 rounded-xl font-extrabold text-[15px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-70">
                                        {isSubmitting && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                                        <CreditCard className="w-5 h-5 relative z-10" /> 
                                        <span className="relative z-10">{isSubmitting ? '안전하게 결제 처리 중...' : '신용카드로 안전하게 결제'}</span>
                                    </button>
                                    <button className="w-full py-3.5 rounded-xl font-bold text-[15px] bg-[#FAE100] hover:bg-[#F4D700] text-[#371D1E] shadow-lg transition-colors flex items-center justify-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> 카카오페이 결제
                                    </button>
                                </div>
                            )}

                            {!isDone && (
                                <div className="flex items-center justify-between text-xs text-white/40 font-medium">
                                    <button onClick={() => setStep(1)} className="hover:text-white transition-colors py-2 px-1 flex items-center gap-1">
                                        ← 이전 단계
                                    </button>
                                    <p className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> 결제 즉시 담당 변호사 배정 • 기한 초과 시 100% 환불</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── 메인 페이지 ────────────────────────────────────
export default function ConsultationPage() {
    const [selected, setSelected] = useState<typeof SERVICES[0] | null>(null);
    const [monthlyCount, setMonthlyCount] = useState(3);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqs = [
        { q: '결제 후 얼마나 걸리나요?', a: '결제 완료 즉시 담당 변호사가 배정됩니다. 서비스별로 명시된 시간(24~48시간) 내에 고품질의 서면 답변을 보장합니다. 기한 초과 시에는 100% 전액 환불을 보장합니다.' },
        { q: '정기 구독 서비스랑은 무엇이 다른가요?', a: '단건 문의는 당장 필요한 사안에 대해서만 개별로 의뢰하고 비용을 지불하는 방식입니다. 만약 월 7건 이상 정기적인 자문이 필요하시다면 최대 60% 이상 저렴한 구독 플랜을 추천드립니다. 단건 고객님이 추후 구독으로 전환하실 경우 첫 달 할인 쿠폰을 발급해 드립니다.' },
        { q: '지금 당장 문서가 없어도 상담이 가능한가요?', a: '네, 가능합니다. 우선 현재의 상황과 궁금하신 점을 텍스트로 남겨주시면 담당 변호사가 전체적인 현황을 파악한 뒤 추가로 필요한 서류 목록을 안내해 드립니다.' },
        { q: '마음에 안 들면 환불되나요?', a: '네. 검토 결과물이 전달되기 전이라면 언제든 전액 환불이 가능합니다. 결과물 수령 후라도 부족한 부분이 있다면 변호사와 직접 논의하여 추가적인 보완을 무료로 진행해 드립니다.' },
        { q: '상담 내용에 대한 보안은 어떻게 유지되나요?', a: 'IBS 법률사무소의 모든 변호사들은 법률이 정하는 엄격한 비밀유지 의무를 준수합니다. 남겨주신 내용과 첨부 파일은 담당 변호사 외에는 절대 열람할 수 없으며 강력한 보안 시스템 내에 안전하게 보관됩니다.' },
    ];

    return (
        <div className="min-h-screen pt-24 pb-24 relative selection:bg-[#c9a84c]/30" style={{ background: '#020611', color: '#f0f4ff' }}>
            {/* ── 백그라운드 효과 ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0a1930] rounded-full mix-blend-screen filter blur-[150px] opacity-70" />
                <div className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] bg-[#1c1305] rounded-full mix-blend-screen filter blur-[150px] opacity-80" />
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-[#051121] rounded-full mix-blend-screen filter blur-[120px] opacity-60" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* ── 히어로 ── */}
            <div className="relative z-10 text-center py-20 px-4 max-w-4xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 backdrop-blur-md bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(201,168,76,0.1)]">
                        <Scale className="w-4 h-4 text-[#c9a84c]" />
                        <span className="text-sm font-bold tracking-wider text-[#c9a84c] uppercase">개별 법률 자문 센터</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black mb-8 leading-[1.15] tracking-tight">
                        필요할 때, 필요한 만큼.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e8c87a] via-[#c9a84c] to-[#a38031] filter drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]">프리미엄 법률 자문.</span>
                    </h1>
                    <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-blue-200/60 leading-relaxed font-light">
                        계약서 서명 직전, 예상치 못한 분쟁 발생, 복잡한 규제 이슈 등.<br />
                        <strong className="font-semibold text-white">회원가입의 번거로움 없이 즉시 최고 수준의 변호사와 연결됩니다.</strong>
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm font-medium text-white/50">
                        <span className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center"><BadgeCheck className="w-4 h-4 text-green-400" /></div>결제 즉시 담당 배정</span>
                        <span className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><Clock className="w-4 h-4 text-blue-400" /></div>24~48시간 내 확답</span>
                        <span className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center"><Shield className="w-4 h-4 text-purple-400" /></div>지연 시 100% 환불</span>
                    </div>
                </motion.div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
                {/* ── 서비스 메뉴 ── */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-white mb-2 relative inline-block">
                            어떤 도움이 필요하신가요?
                            <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-gradient-to-r from-[#c9a84c] to-transparent rounded-full" />
                        </h2>
                        <p className="text-blue-200/50 mt-4 font-medium">원하시는 서비스를 선택하고 즉시 검토를 요청하세요.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-white/60">
                        <AlertTriangle className="w-4 h-4 text-[#c9a84c]" /> 메뉴에 없는 사안은 고객센터로 문의주세요
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {SERVICES.map((svc, i) => (
                        <motion.div key={svc.id}
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }}
                            onClick={() => setSelected(svc)}
                            className="group relative p-6 rounded-[2rem] cursor-pointer transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.15] backdrop-blur-md overflow-hidden flex flex-col h-full"
                            style={{
                                boxShadow: svc.popular ? '0 0 40px -10px rgba(201,168,76,0.1)' : 'none',
                                borderColor: svc.popular ? 'rgba(201,168,76,0.3)' : '',
                            }}
                            whileHover={{ y: -5 }}>
                            
                            {/* 배경 글로우 호버 효과 */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {svc.popular && (
                                <div className="absolute top-5 right-5">
                                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#c9a84c] to-[#e8c87a] text-black shadow-lg">가장 많이 찾아요</div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-5 relative z-10 w-4/5">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${svc.color}20, transparent)`, border: `1px solid ${svc.color}40` }}>
                                    <svc.icon className="w-6 h-6" style={{ color: svc.color }} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold tracking-[0.2em] mb-1" style={{ color: svc.color }}>{svc.category}</p>
                                    <h3 className="font-extrabold text-lg text-white leading-tight">{svc.title}</h3>
                                </div>
                            </div>

                            <p className="text-sm text-blue-200/50 mb-6 font-light leading-relaxed flex-1">
                                {svc.desc}
                            </p>

                            <div className="space-y-2 mb-6 bg-white/5 p-4 rounded-2xl">
                                {svc.includes.map(item => (
                                    <li key={item} className="flex items-start gap-2.5 text-[13px] text-white/70 font-medium">
                                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-[1.5px]" style={{ color: svc.color }} />
                                        <span className="leading-snug">{item}</span>
                                    </li>
                                ))}
                            </div>

                            <div className="mt-auto pt-5 flex items-end justify-between border-t border-white/5">
                                <div>
                                    <p className="text-[#a3a3a3] text-xs font-medium mb-1 line-through opacity-0 group-hover:opacity-100 transition-opacity">표준 수가 ₩{(svc.price * 1.3).toLocaleString()}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-black text-2xl text-white">₩{svc.price.toLocaleString()}</span>
                                    </div>
                                </div>
                                <button className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/5 text-white group-hover:bg-white group-hover:text-black">
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── 단건 vs 구독 계산기 ── */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
                    className="mb-24 mt-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 px-4">
                        <div>
                            <h3 className="font-black text-2xl text-white tracking-tight">
                                꾸준한 자문이 필요하신가요?
                            </h3>
                            <p className="text-blue-200/50 mt-2 font-medium">
                                월 평균 발생할 의뢰 건수를 입력하고 구독 비용과 비교해보세요.
                            </p>
                        </div>
                        <div className="flex items-center bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner">
                            <button onClick={() => setMonthlyCount(Math.max(1, monthlyCount - 1))}
                                className="w-12 h-12 rounded-xl font-medium text-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">-</button>
                            <div className="w-24 text-center px-2 flex flex-col items-center justify-center">
                                <span className="text-xs text-[#c9a84c] font-bold uppercase tracking-widest mb-0.5">예상 건수</span>
                                <span className="font-black text-2xl text-white leading-none">
                                    {monthlyCount}<span className="text-sm font-medium text-white/40 ml-1">건</span>
                                </span>
                            </div>
                            <button onClick={() => setMonthlyCount(Math.min(20, monthlyCount + 1))}
                                className="w-12 h-12 rounded-xl font-medium text-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">+</button>
                        </div>
                    </div>
                    <CostComparison selectedCount={monthlyCount} />
                </motion.div>

                {/* ── 프로세스 안내 ── */}
                <div className="mb-24 relative">
                    <div className="text-center mb-16">
                        <span className="text-xs font-bold tracking-[0.2em] text-[#c9a84c] uppercase">Simple Process</span>
                        <h2 className="text-3xl font-black mt-3 text-white">결제부터 답변 수령까지 단 3단계</h2>
                    </div>
                    
                    {/* 데스크탑 연결선 */}
                    <div className="hidden md:block absolute top-[60%] left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />

                    <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
                        {[
                            { step: '01', icon: FileText, title: '서비스 신청', desc: '원하는 법률 서비스 선택 후 관련 문서 첨부 및 요청 사항을 자세히 남겨주세요.' },
                            { step: '02', icon: CreditCard, title: '안전한 간편 결제', desc: '의뢰 내용 및 금액 확인 후 카드 또는 간편결제 시스템을 통해 요금을 안전하게 결제합니다.' },
                            { step: '03', icon: Scale, title: '서면 리포트 수령', desc: '담당 변호사가 직접 검토한 프리미엄 법률 의견서를 기한 내 메일로 발송해드립니다.' },
                        ].map(({ step, icon: Icon, title, desc }) => (
                            <div key={step} className="relative flex flex-col items-center text-center group">
                                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-[120%] text-[6rem] font-extrabold text-white/[0.02] select-none pointer-events-none group-hover:text-white/[0.04] transition-colors">{step}</div>
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md group-hover:border-[#c9a84c]/50 group-hover:scale-110 transition-all duration-300">
                                    <Icon className="w-8 h-8 text-[#c9a84c]" />
                                </div>
                                <h3 className="font-extrabold text-xl text-white mb-3">{title}</h3>
                                <p className="text-[15px] font-medium text-blue-200/50 leading-relaxed max-w-[280px]">
                                    {desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── FAQ ── */}
                <div className="mb-24 max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <span className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase">Support</span>
                        <h2 className="text-3xl font-black mt-3 text-white">자주 묻는 질문</h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <motion.div key={idx} layout
                                className="rounded-[2rem] overflow-hidden cursor-pointer backdrop-blur-md bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                                <div className="flex items-center justify-between p-6 sm:px-8">
                                    <p className="font-bold text-[15px] text-white/90">{faq.q}</p>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${openFaq === idx ? 'bg-[#c9a84c] text-black' : 'bg-white/5 text-white/50'}`}>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {openFaq === idx && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                                            <p className="px-6 sm:px-8 pb-8 pt-2 text-[15px] font-medium text-blue-200/60 leading-relaxed">
                                                {faq.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ── 구독 유도 배너 ── */}
                <div className="rounded-[3rem] p-10 sm:p-14 text-center relative overflow-hidden backdrop-blur-2xl shadow-2xl pb-16">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#12192b] to-[#040914] -z-20" />
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.15),transparent_60%)] -z-10" />
                    <div className="absolute inset-0 border border-white/10 rounded-[3rem] -z-10 pointer-events-none" />
                    
                    <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a84c] to-[#a38031] flex items-center justify-center mb-6 shadow-lg shadow-[#c9a84c]/20">
                            <Crown className="w-8 h-8 text-black" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black mb-4 text-white tracking-tight">
                            월 7건 이상 이용 시 <span className="text-[#c9a84c]">정기 구독</span> 추천
                        </h2>
                        <p className="text-[17px] font-medium mb-10 text-white/60 leading-relaxed">
                            기업 법무의 A to Z를 전담합니다. 무제한 본사 자문은 물론,<br className="hidden sm:block" />
                            가맹점 응대 대행과 법률 문서 자동 검토 시스템까지 모두 지원합니다.<br />
                            <span className="inline-block mt-3 px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm font-bold border border-green-500/20">단건 이용 기업, 구독 전환 시 첫 달 20% 추가 혜택 제공</span>
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                            <Link href="/pricing" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-white text-black hover:scale-105 shadow-xl shadow-white/10 transition-transform flex items-center justify-center gap-2">
                                    <Star className="w-5 h-5" /> 프리미엄 요금제 확인
                                </button>
                            </Link>
                            <a href="tel:02-598-8518" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                    <Phone className="w-5 h-5" /> 기업 대상 전용 상담
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
