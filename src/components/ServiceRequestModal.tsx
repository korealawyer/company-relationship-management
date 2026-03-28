'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, MessageCircle, FileSearch, Gavel,
    UploadCloud, FileText, Trash2, ArrowRight, ArrowLeft,
    CheckCircle2
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { leadStore } from '@/lib/leadStore';
import { DocumentCategory } from '@/lib/types';
import { documentStore } from '@/lib/store';

export type RequestType = 'consultation' | 'document' | 'contract_draft' | 'case' | 'general';
export type FormRequestType = Exclude<RequestType, 'general'>;

interface ServiceRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultType?: RequestType;
}

const SERVICE_TYPES: { value: FormRequestType; label: string; submitLabel: string; icon: React.ElementType; color: string }[] = [
    { value: 'consultation',    label: '법률 자문 신청', submitLabel: '법률 자문 신청하기',      icon: MessageCircle, color: '#2563eb' },
    { value: 'document',        label: '문서 검토 요청', submitLabel: '문서 검토/작성 신청하기', icon: FileSearch,    color: '#7c3aed' },
    { value: 'case',            label: '사건 위임 의뢰', submitLabel: '사건 위임 의뢰하기',      icon: Gavel,         color: '#dc2626' },
];

function resolveType(t: RequestType): FormRequestType {
    return t === 'general' ? 'consultation' : t as FormRequestType;
}

export function ServiceRequestModal({ isOpen, onClose, defaultType = 'general' }: ServiceRequestModalProps) {
    const session = typeof window !== 'undefined' ? getSession() : null;

    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<FormRequestType>(resolveType(defaultType));
    const [title, setTitle] = useState('');
    const [detail, setDetail] = useState('');
    const [privacyUrl, setPrivacyUrl] = useState('');

    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedType(resolveType(defaultType));
            setTitle('');
            setDetail('');
            setPrivacyUrl('');
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

    const handleSubmit = () => {
        if (!title.trim()) { alert('의뢰 제목을 입력해주세요.'); return; }
        const companyId = session?.companyId || 'org-123';
        const userName  = session?.name  || 'Client';

        setIsSubmitting(true);
        setTimeout(() => {
            const tags = [
                selectedType === 'document' ? '문서검토' : selectedType === 'case' ? '소송대리' : '법률자문',
            ];
            const newLeads = leadStore.add([{
                companyName: session?.companyName || '새로운 고객사',
                domain: '', privacyUrl: privacyUrl,
                contactName: session?.name || 'Client',
                contactEmail: session?.email || 'client@example.com',
                contactPhone: '', storeCount: 1,
                bizType: '기타 (포털 의뢰)',
                riskScore: 50,
                riskLevel: 'LOW' as const,
                issueCount: 1, status: 'pending', source: 'manual',
            } as any]);

            const newLeadId = newLeads[0].id;
            let memo = `[신규 의뢰] ${title}\n${detail}`;
            if (files.length > 0) memo += `\n\n📌 첨부파일 ${files.length}건: ${files.map(f => f.name).join(', ')}`;
            leadStore.addMemo(newLeadId, { author: userName, content: memo });

            if (files.length > 0) {
                let cat: DocumentCategory = '기타';
                if (selectedType === 'document' || selectedType === 'contract_draft') cat = '계약서';
                else if (selectedType === 'case') cat = '소장';
                files.forEach(file => documentStore.upload({
                    companyId, authorRole: 'client', name: file.name,
                    size: file.size, type: file.type || 'application/octet-stream',
                    category: cat, status: '검토 대기',
                    url: URL.createObjectURL(file), isNewForClient: false, isNewForLawyer: true,
                }));
            }

            setIsSubmitting(false);
            setSubmitted(true);
            setStep(3);
        }, 900);
    };

    const STEPS = ['서비스 선택', '상세 내용', '접수 완료'];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        className="relative w-full max-w-md h-full bg-white flex flex-col shadow-2xl"
                        style={{ borderLeft: '1px solid #e5e7eb' }}
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

                                        {/* Privacy URL */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">개인정보처리방침 URL <span className="text-gray-400 font-normal">(선택)</span></label>
                                            <input
                                                type="url"
                                                placeholder="https://example.com/privacy"
                                                value={privacyUrl} onChange={e => setPrivacyUrl(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 outline-none focus:border-gray-800 transition-colors text-sm text-gray-900 placeholder:text-gray-400"
                                            />
                                        </div>

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
