'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, MessageCircle, FileSearch, Gavel,
    UploadCloud, FileText, Trash2, ArrowRight, ArrowLeft,
    CheckCircle2
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { dataLayer } from '@/lib/dataLayer';
import { getBrowserSupabase } from '@/lib/supabase';
import { Consultation } from '@/lib/types';
import { useConsultations, useLitigations } from '@/hooks/useDataLayer';

export type RequestType = 'consultation' | 'document' | 'contract_draft' | 'case' | 'general';
export type FormRequestType = Exclude<RequestType, 'general'>;

interface ServiceRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultType?: RequestType;
    defaultTitle?: string;
    defaultDetail?: string;
}

const SERVICE_TYPES: { value: FormRequestType; label: string; submitLabel: string; icon: React.ElementType; color: string }[] = [
    { value: 'consultation',    label: '법률 자문 신청', submitLabel: '법률 자문 신청하기',      icon: MessageCircle, color: '#2563eb' },
    { value: 'document',        label: '문서 검토 요청', submitLabel: '문서 검토/작성 신청하기', icon: FileSearch,    color: '#7c3aed' },
    { value: 'case',            label: '사건 위임 의뢰', submitLabel: '사건 위임 의뢰하기',      icon: Gavel,         color: '#dc2626' },
];

function resolveType(t: RequestType): FormRequestType {
    return t === 'general' ? 'consultation' : t as FormRequestType;
}

export function ServiceRequestModal({ isOpen, onClose, defaultType = 'general', defaultTitle, defaultDetail }: ServiceRequestModalProps) {
    const { mutate: mutateConsultations } = useConsultations();
    const { mutate: mutateLitigations } = useLitigations();
    const session = typeof window !== 'undefined' ? getSession() : null;

    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<FormRequestType>(resolveType(defaultType));
    const [title, setTitle] = useState('');
    const [detail, setDetail] = useState('');

    const [opponent, setOpponent] = useState('');
    const [caseType, setCaseType] = useState('민사');
    const [claimAmount, setClaimAmount] = useState('');
    const [court, setCourt] = useState('');

    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedType(resolveType(defaultType));
            setTitle(defaultTitle || '');
            setDetail(defaultDetail || '');
            setOpponent('');
            setCaseType('민사');
            setClaimAmount('');
            setCourt('');
            setFiles([]);
            setSubmitted(false);
        }
    }, [isOpen, defaultType]);

    const handleFileChange = (fl: FileList | null) => {
        if (!fl) return;
        const valid = Array.from(fl).filter(f => {
            if (f.size > 10 * 1024 * 1024) { alert(`${f.name}은(는) 10MB 이하만 가능합니다.`); return false; }
            return true;
        });
        setFiles(prev => [...prev, ...valid]);
    };

    const handleSubmit = async () => {
        if (!title.trim()) { alert('의뢰 제목을 입력해주세요.'); return; }
        const companyId = session?.companyId || 'org-123';
        const userName  = session?.name  || 'Client';

        setIsSubmitting(true);
        try {
            const sb = getBrowserSupabase();
            const attachedFiles = [];

            // 1. 첨부파일이 있다면 Supabase Storage('documents' 버킷)에 업로드
            if (files.length > 0 && sb) {
                for (const file of files) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${companyId}/consult/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                    const { data, error } = await sb.storage.from('documents').upload(fileName, file);
                    
                    if (!error && data) {
                        const { data: { publicUrl } } = sb.storage.from('documents').getPublicUrl(fileName);
                        attachedFiles.push({
                            name: file.name,
                            url: publicUrl,
                            size: file.size,
                            type: file.type
                        });
                    } else {
                        console.error('File upload error:', error);
                        // 에러 로그만 남기고 계속 진행하거나 에러 처리
                    }
                }
            }

            // 2. 추가 정보(첨부파일)를 본문에 합침
            let fullBody = detail;
            if (attachedFiles.length > 0) {
                fullBody += `\n\n[첨부파일 링크]`;
                attachedFiles.forEach((file, index) => {
                    fullBody += `\n${index + 1}. ${file.name} : ${file.url}`;
                });
            }

            if (selectedType === 'case') {
                const parsedAmount = parseInt(claimAmount.replace(/[^0-9]/g, ''), 10) || 0;
                
                await dataLayer.litigation.create({
                    companyId: companyId as any,
                    title,
                    type: caseType as any,
                    opponent: opponent || '미상',
                    claimAmount: parsedAmount,
                    court: court,
                    notes: fullBody,
                    status: 'preparing' as any
                });
                await mutateLitigations();
            } else {
                // 3. 실제 Consult 데이터 삽입 (일반 법률 자문, 문서 검토 등)
                const payload: Partial<Consultation> = {
                    companyId,
                    companyName: session?.companyName || '새로운 고객사',
                    branchName: '본사',
                    authorName: userName,
                    authorRole: '임직원',
                    category: selectedType === 'document' || selectedType === 'contract_draft' ? '가맹계약' : '기타',
                    urgency: 'normal',
                    title,
                    body: fullBody,
                    status: 'submitted',
                    isPrivate: false,
                    attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined
                };

                await dataLayer.consult.create(payload);
                await mutateConsultations();
            }

            setIsSubmitting(false);
            setSubmitted(true);
            setStep(3);

        } catch (error) {
            console.error('Failed to submit consultation:', error);
            alert('의뢰 제출 중 오류가 발생했습니다.');
            setIsSubmitting(false);
        }
    };

    const STEPS = ['서비스 선택', '상세 내용', '접수 완료'];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-xl bg-white flex flex-col shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] my-4 mx-auto z-[101]"
                        style={{ border: '1px solid #e5e7eb' }}
                    >
                        {/* Gold top accent */}
                        <div className="h-1 w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg, #e8c87a, #c9a84c)' }} />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0" style={{ background: '#111827' }}>
                            <span className="text-base font-black text-white tracking-tight">새 법률 서비스 의뢰</span>
                            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Step indicator */}
                        {step < 3 && (
                            <div className="flex items-center gap-0 px-6 py-4 border-b border-gray-100 flex-shrink-0">
                                {STEPS.map((s, i) => {
                                    const idx = i + 1;
                                    const active = idx === step;
                                    const done = idx < step;
                                    return (
                                        <React.Fragment key={s}>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-colors ${
                                                    done  ? 'bg-gray-900 text-white' :
                                                    active ? 'bg-amber-500 text-white' :
                                                            'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {done ? '✓' : idx}
                                                </div>
                                                <span className={`text-xs font-bold transition-colors ${active ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
                                            </div>
                                            {i < STEPS.length - 1 && (
                                                <div className="flex-1 h-px mx-2" style={{ background: done ? '#111827' : '#e5e7eb' }} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <AnimatePresence mode="wait">

                                {/* ── Step 1: 서비스 선택 ── */}
                                {step === 1 && (
                                    <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
                                        <p className="text-sm font-bold text-gray-900 mb-4">어떤 법률 서비스가 필요하세요?</p>
                                        {SERVICE_TYPES.map(({ value, label, icon: Icon, color }) => {
                                            const selected = selectedType === value;
                                            return (
                                                <button
                                                    key={value}
                                                    onClick={() => setSelectedType(value)}
                                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left"
                                                    style={{
                                                        borderColor: selected ? '#111827' : '#e5e7eb',
                                                        background: selected ? '#111827' : '#fff',
                                                    }}
                                                >
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                        style={{ background: selected ? 'rgba(255,255,255,0.12)' : `${color}15` }}>
                                                        <Icon className="w-5 h-5" style={{ color: selected ? '#e8c87a' : color }} />
                                                    </div>
                                                    <span className={`text-sm font-black ${selected ? 'text-white' : 'text-gray-900'}`}>{label}</span>
                                                    {selected && <ArrowRight className="w-4 h-4 text-amber-400 ml-auto" />}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}

                                {/* ── Step 2: 상세 내용 ── */}
                                {step === 2 && (
                                    <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                                        {/* Title */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">의뢰 제목 <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="예: 가맹점주 계약 해지 관련 자문"
                                                value={title} onChange={e => setTitle(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-gray-800 transition-colors text-sm text-gray-900 placeholder:text-gray-400"
                                            />
                                        </div>

                                        {selectedType === 'consultation' && (
                                            <div className="space-y-4">
                                                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed">
                                                    <span className="font-semibold block mb-1">법률 자문 신청 가이드</span>
                                                    계약서 외의 일반적인 법률 질의, 노무/세무 이슈, 형사 고소 절차 등 변호사의 조언이 필요한 모든 사항을 자유롭게 남겨주세요.
                                                </div>
                                            </div>
                                        )}

                                        {selectedType === 'case' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">사건 종류 <span className="text-red-500">*</span></label>
                                                    <select
                                                        value={caseType} onChange={e => setCaseType(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-gray-800 transition-colors text-sm text-gray-900"
                                                    >
                                                        {['민사', '형사', '행정', '가처분/신청', '기타'].map(ct => (
                                                            <option key={ct} value={ct}>{ct}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">상대방 이름/법인명 <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="text" placeholder="예: 주식회사 홍길동"
                                                        value={opponent} onChange={e => setOpponent(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-gray-800 transition-colors text-sm text-gray-900 placeholder:text-gray-400"
                                                    />
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">청구 금액 / 소가 <span className="text-gray-400 font-normal">(선택)</span></label>
                                                    <input
                                                        type="text" placeholder="예: 50,000,000 (숫자만)"
                                                        value={claimAmount} onChange={e => setClaimAmount(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-gray-800 transition-colors text-sm text-gray-900 placeholder:text-gray-400"
                                                    />
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">관할 법원 <span className="text-gray-400 font-normal">(선택)</span></label>
                                                    <input
                                                        type="text" placeholder="예: 서울중앙지방법원"
                                                        value={court} onChange={e => setCourt(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-gray-800 transition-colors text-sm text-gray-900 placeholder:text-gray-400"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Detail */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">상세 내용 <span className="text-gray-400 font-normal">(선택)</span></label>
                                            <textarea
                                                rows={8} placeholder="배경 및 요청사항을 간략히 적어주세요."
                                                value={detail} onChange={e => setDetail(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-gray-800 transition-colors text-sm text-gray-900 placeholder:text-gray-400 resize-none"
                                            />
                                        </div>

                                        {/* File upload */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">첨부 파일 <span className="text-gray-400 font-normal">(선택 · 최대 10MB)</span></label>
                                            <div
                                                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                                onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                                                onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={e => handleFileChange(e.target.files)} />
                                                <UploadCloud className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                                                <p className="text-xs font-bold text-gray-600">클릭 또는 드래그하여 업로드</p>
                                            </div>
                                            {files.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {files.map((f, i) => (
                                                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                <span className="text-xs font-medium text-gray-700 truncate">{f.name}</span>
                                                                <span className="text-[10px] text-gray-400 flex-shrink-0">{(f.size/1024/1024).toFixed(1)}MB</span>
                                                            </div>
                                                            <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                    </motion.div>
                                )}

                                {/* ── Step 3: 완료 ── */}
                                {step === 3 && (
                                    <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full py-20 text-center gap-4">
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                                            className="w-16 h-16 rounded-full flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg, #e8c87a, #c9a84c)' }}
                                        >
                                            <CheckCircle2 className="w-8 h-8 text-white" />
                                        </motion.div>
                                        <div>
                                            <p className="text-lg font-black text-gray-900">접수 완료!</p>
                                            <p className="text-sm text-gray-500 mt-1">전담 변호사팀이 검토 후 연락드립니다.</p>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="mt-4 px-8 py-3 rounded-xl text-sm font-black text-white"
                                            style={{ background: '#111827' }}
                                        >
                                            닫기
                                        </button>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>

                        {/* Footer buttons */}
                        {step < 3 && (
                            <div className="flex gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                                {step === 2 && (
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> 이전
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (step === 1) setStep(2);
                                        else handleSubmit();
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white transition-opacity disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #111827, #374151)' }}
                                >
                                    {isSubmitting ? '접수 중...' : step === 1 ? '다음 단계' : (SERVICE_TYPES.find(s => s.value === selectedType)?.submitLabel ?? '신청하기')}
                                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
