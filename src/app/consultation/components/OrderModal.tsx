import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, X, UploadCloud, CheckCircle2, CreditCard, MessageSquare, Shield, ArrowRight } from 'lucide-react';
import { consultStore, documentStore, store } from '@/lib/mockStore';
import { getSession } from '@/lib/auth';
import { ConsultService } from '../constants';

// ── 주문 폼 모달 ────────────────────────────────────
export default function OrderModal({ service, onClose }: { service: ConsultService; onClose: () => void }) {
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
