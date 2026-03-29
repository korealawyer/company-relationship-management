'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    Building2,
    CheckCircle2,
    ChevronDown,
    FileText,
    Mail,
    Phone,
    Send,
    UploadCloud,
    User,
    X,
    ArrowRight
} from 'lucide-react';


const INQUIRY_TYPES = [
    '가맹본부/지사 관련 분쟁',
    '계약서 검토 및 작성',
    '인사/노무 스크리닝방어',
    '지식재산권(상표/영업비밀)',
    '컴플라이언스 및 법률 자문',
    '기타',
];

export default function ConsultationLandingPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: '',
        employeeCount: '',
        contactName: '',
        phone: '',
        email: '',
        inquiryType: '',
        details: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // File upload state (mock)
    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const res = await fetch('/api/consultation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (res.ok) {
                setIsSuccess(true);
            } else {
                alert(data.error || '진단 요청 중 오류가 발생했습니다. 다시 시도해 주세요.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('서버와의 통신에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen pt-32 pb-24 relative flex items-center justify-center bg-[#020611] text-[#f0f4ff]">
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-2xl h-[50%] bg-[#c9a84c]/20 rounded-full blur-[150px]" />
                </div>
                
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center max-w-lg mx-auto px-4">
                    <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <CheckCircle2 className="w-12 h-12 text-green-400" />
                    </div>
                    <h2 className="text-4xl font-black mb-4 tracking-tight text-white">상담 신청이<br className="sm:hidden"/> 완료되었습니다.</h2>
                    <p className="text-lg text-blue-200/60 leading-relaxed mb-10 font-medium">
                        성공적으로 접수되었습니다. 담당 변호사가<br className="hidden sm:block" />
                        내용을 검토한 후 <strong>입력하신 연락처로 회신</strong>해 드립니다.
                    </p>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8 backdrop-blur-md text-left">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-[#c9a84c]"/> 신청 내역 요약</h3>
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-2">
                                <p className="text-white/40">회사명</p>
                                <p className="text-white col-span-2 font-medium">{formData.companyName}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-2">
                                <p className="text-white/40">담당자</p>
                                <p className="text-white col-span-2 font-medium">{formData.contactName}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <p className="text-white/40">문의유형</p>
                                <p className="text-white col-span-2 font-medium">{formData.inquiryType || '미지정'}</p>
                            </div>
                        </div>
                    </div>
                    <a href="/" className="inline-block px-8 py-3.5 rounded-xl font-bold bg-white text-black hover:bg-white/90 transition-colors">
                        홈으로 돌아가기
                    </a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 pb-24 relative bg-[#020611] text-[#f0f4ff] font-sans selection:bg-[#c9a84c]/30 selection:text-white">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#0f1f3d] rounded-full mix-blend-screen filter blur-[150px] opacity-40" />
                <div className="absolute bottom-0 left-[-20%] w-[40%] h-[40%] bg-[#211a0d] rounded-full mix-blend-screen filter blur-[150px] opacity-30" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-screen" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col lg:flex-row gap-16 lg:gap-24">
                {/* Left Side: Hero / Value Prop */}
                <div className="flex-1 lg:py-12 self-start lg:sticky lg:top-32">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-[1.15] tracking-tight text-white">
                            결정적 리스크 방어,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e8c87a] via-[#c9a84c] to-[#a38031] filter drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]">
                                변호사
                            </span>가<br />직접 진단합니다.
                        </h1>
                        <p className="text-lg md:text-xl font-medium text-blue-200/60 leading-relaxed mb-12 max-w-lg">
                            형식적인 답변은 제공하지 않습니다.<br />
                            전문 변호사들이 귀사의 현재 상황에 맞춘 실질적인 솔루션을 제시합니다.
                        </p>

                        <div className="space-y-6 max-w-md">
                            {[
                                { title: '철저한 비밀 유지 보호', desc: '모든 문의 내용은 강력한 보안 정책 및 변호사법에 의거하여 100% 철저하게 보호됩니다.' },
                                { title: '48시간 내 무료 브리핑', desc: '접수된 서류와 내용을 검토하여 가장 실효성 높은 전략적 방향을 우선 제시해 드립니다.' },
                                { title: '자료 업로드 중심의 빠른 진단', desc: '복잡한 설명 없이 관련 서류(계약서, 내용증명 등)만 첨부하셔도 정확한 진단이 가능합니다.' },
                            ].map((item, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                                    className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-5 h-5 text-[#c9a84c]" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-1">{item.title}</h4>
                                        <p className="text-sm font-medium text-blue-200/50 leading-relaxed">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: VIP Lead Gen Form */}
                <div className="flex-1 w-full max-w-xl mx-auto lg:mx-0">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
                        className="rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden relative"
                        style={{ boxShadow: '0 0 80px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)' }}>
                        
                        {/* Form Header */}
                        <div className="px-8 py-8 border-b border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent">
                            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                사전 진단 신청서
                            </h3>
                            <p className="text-sm text-blue-200/50 mt-2 font-medium">정확한 진단을 위해 필수 항목만 기입해주세요.</p>
                            
                            {/* Step Indicator */}
                            <div className="flex items-center gap-2 mt-8">
                                <div className={`flex-1 h-1.5 rounded-full \${step >= 1 ? 'bg-gradient-to-r from-[#c9a84c] to-[#e8c87a]' : 'bg-white/10'}`} />
                                <div className={`flex-1 h-1.5 rounded-full \${step >= 2 ? 'bg-gradient-to-r from-[#e8c87a] to-[#c9a84c]' : 'bg-white/10 transition-colors duration-500'}`} />
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="p-8">
                            <form onSubmit={handleSubmit}>
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                            className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-bold text-white/80 mb-2 ml-1">기업 정보</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Building2 className="w-5 h-5 text-white/30" />
                                                    </div>
                                                    <input required type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="회사명 (상호)"
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all font-medium" />
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <div className="relative">
                                                    <select required name="employeeCount" value={formData.employeeCount} onChange={handleChange}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-12 py-4 text-white appearance-none focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all font-medium">
                                                        <option value="" disabled className="text-gray-500">임직원 수 선택 (옵션)</option>
                                                        <option value="1-10">1-10명</option>
                                                        <option value="11-50">11-50명</option>
                                                        <option value="51-200">51-200명</option>
                                                        <option value="200+">200명 이상</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                        <ChevronDown className="w-5 h-5 text-white/30" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                <label className="block text-sm font-bold text-white/80 mb-2 ml-1">담당자 정보</label>
                                                <div className="space-y-4">
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <User className="w-5 h-5 text-white/30" />
                                                        </div>
                                                        <input required type="text" name="contactName" value={formData.contactName} onChange={handleChange} placeholder="담당자 성함 및 직급"
                                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a84c]/50 transition-all font-medium" />
                                                    </div>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Phone className="w-5 h-5 text-white/30" />
                                                        </div>
                                                        <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="연락처 (휴대폰 번호)"
                                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a84c]/50 transition-all font-medium" />
                                                    </div>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Mail className="w-5 h-5 text-white/30" />
                                                        </div>
                                                        <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="업무용 이메일 주소"
                                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a84c]/50 transition-all font-medium" />
                                                    </div>
                                                </div>
                                            </div>

                                            <button type="button" onClick={() => {
                                                if(formData.companyName && formData.contactName && formData.phone && formData.email) setStep(2);
                                                else alert('필수 항목을 모두 입력해주세요.');
                                            }}
                                                className="w-full mt-6 py-4.5 rounded-xl font-black text-lg bg-gradient-to-r from-white to-gray-200 text-black shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                                                다음 단계로 <ArrowRight className="w-5 h-5"/>
                                            </button>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6">
                                            
                                            <div>
                                                <label className="block text-sm font-bold text-white/80 mb-2 ml-1">어떤 법률 이슈가 있으신가요?</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {INQUIRY_TYPES.map(type => (
                                                        <label key={type} htmlFor={`inquiry-${type}`} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.inquiryType === type ? 'bg-[#c9a84c]/10 border-[#c9a84c]/50 text-white' : 'bg-black/20 border-white/10 text-white/60 hover:bg-white/5'}`}>
                                                            <input id={`inquiry-${type}`} type="radio" name="inquiryType" value={type} checked={formData.inquiryType === type} onChange={handleChange} className="sr-only" />
                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${formData.inquiryType === type ? 'border-[#c9a84c] border-[6px]' : 'border-white/30'}`} />
                                                            <span className="font-medium text-[15px]">{type}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-white/80 mb-2 ml-1">상세 내용 및 요청사항</label>
                                                <textarea name="details" value={formData.details} onChange={handleChange} placeholder="현재 겪고 계신 상황이나 검토가 필요한 문서를 상세히 적어주시면, 더욱 정확한 사전 진단이 가능합니다."
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a84c]/50 transition-all font-medium h-32 resize-none" />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-white/80 mb-2 ml-1">관련 문서 첨부 (선택)</label>
                                                <div className="relative group cursor-pointer">
                                                    <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                    <div className="w-full bg-black/20 border border-white/10 border-dashed rounded-xl p-6 text-center group-hover:bg-white/5 group-hover:border-white/30 transition-all flex flex-col items-center justify-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                                            <UploadCloud className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white/80 text-sm mb-1">여기를 클릭하여 파일 업로드</p>
                                                            <p className="text-xs text-white/40">PDF, Word, HWP, 이미지 등 (최대 50MB)</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {files.length > 0 && (
                                                    <div className="mt-4 space-y-2">
                                                        {files.map((file, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <FileText className="w-4 h-4 text-[#c9a84c] shrink-0" />
                                                                    <span className="text-sm text-white/80 truncate font-medium">{file.name}</span>
                                                                </div>
                                                                <button type="button" onClick={() => removeFile(idx)} className="p-1 text-white/30 hover:text-white/80 transition-colors">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                                <button type="button" onClick={() => setStep(1)} className="px-6 py-4.5 rounded-xl font-bold bg-white/5 text-white/70 hover:bg-white/10 transition-colors">
                                                    이전
                                                </button>
                                                <button type="submit" disabled={isSubmitting || !formData.inquiryType}
                                                    className={`flex-1 py-4.5 rounded-xl font-black text-lg bg-gradient-to-r from-[#e8c87a] to-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 \${(!formData.inquiryType || isSubmitting) ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}>
                                                    {isSubmitting ? (
                                                        <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <>진단 요청 제출하기 <Send className="w-5 h-5 ml-1" /></>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                            
                            <p className="text-center text-[11px] text-white/30 mt-6 font-medium">
                                제출 시 IBS 법률사무소의 <a href="#" className="underline">개인정보 처리방침</a>에 동의하는 것으로 간주합니다.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

