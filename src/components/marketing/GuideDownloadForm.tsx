'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Building2, User, Mail, Phone, Briefcase, CheckCircle2, Loader2 } from 'lucide-react';

export default function GuideDownloadForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        bizType: '외식/프랜차이즈'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/leads/guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (res.ok) {
                setSuccess(true);
            } else {
                alert('요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
        } catch (error) {
            alert('인터넷 연결을 확인해주세요.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 sm:p-10 text-center shadow-2xl">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">신청이 완료되었습니다!</h3>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                    입력하신 이메일({formData.contactEmail})로 가이드북 다운로드 링크를 발송해 드렸습니다.
                </p>
                <button onClick={() => setSuccess(false)}
                    className="text-sm font-semibold text-[#c9a84c] hover:text-[#e8c87a] transition-colors">
                    이전으로 돌아가기
                </button>
            </motion.div>
        );
    }

    return (
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#c9a84c]/10 to-transparent blur-3xl rounded-full" />
            
            <div className="relative z-10 flex flex-col gap-6">
                <div className="text-left">
                    <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                        핵심 법무 리스크 체크리스트<span className="text-[#c9a84c]">.</span>
                    </h3>
                    <p className="text-sm sm:text-base text-slate-400">
                        단 5분 작성으로 우리 회사의 법률구멍을 진단할 수 있는 무료 가이드북을 다운로드하세요.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" /> 회사명 (상호)
                            </label>
                            <input required name="companyName" value={formData.companyName} onChange={handleChange}
                                placeholder="(주)아이비에스"
                                className="bg-[#0f172a] border border-[#334155] text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> 담당자명
                            </label>
                            <input required name="contactName" value={formData.contactName} onChange={handleChange}
                                placeholder="홍길동"
                                className="bg-[#0f172a] border border-[#334155] text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" /> 이메일 주소
                            </label>
                            <input required type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange}
                                placeholder="name@company.com"
                                className="bg-[#0f172a] border border-[#334155] text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" /> 연락처 (선택)
                            </label>
                            <input name="contactPhone" value={formData.contactPhone} onChange={handleChange}
                                placeholder="010-0000-0000"
                                className="bg-[#0f172a] border border-[#334155] text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] transition-colors" />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" /> 주요 업종
                        </label>
                        <select name="bizType" value={formData.bizType} onChange={handleChange}
                            className="bg-[#0f172a] border border-[#334155] text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] transition-colors appearance-none relative">
                            <option>외식/프랜차이즈</option>
                            <option>IT/스타트업</option>
                            <option>도소매/유통</option>
                            <option>제조업</option>
                            <option>기타</option>
                        </select>
                    </div>

                    <button disabled={loading} type="submit"
                        className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#c9a84c] to-[#e8c87a] text-slate-900 font-bold px-6 py-4 rounded-xl shadow-[0_4px_16px_rgba(201,168,76,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> 무료 가이드북 이메일로 받기</>}
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-2">
                        가이드북 신청 시 마케팅 정보 수신에 자동으로 동의하게 됩니다.
                    </p>
                </form>
            </div>
        </div>
    );
}
