// @ts-nocheck
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, MessageSquare, CheckCircle2, Send, Loader2,
    ChevronRight, ChevronLeft, Paperclip, X, DownloadCloud, FileText, Image as ImageIcon,
    FileSpreadsheet, Archive, Phone, Mail, DollarSign, Plus, User
} from 'lucide-react';
import { useConsultations } from '@/hooks/useDataLayer';
import { type Consultation } from '@/lib/types';

// Mock File preview handler
function getFileIcon(type: string, name: string) {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-indigo-500" />;
    if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (name.endsWith('.xlsx') || name.endsWith('.csv')) return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    if (name.endsWith('.zip')) return <Archive className="w-5 h-5 text-amber-500" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
}

function getPreviewText(type: string, name: string) {
    if (type.startsWith('image/')) return "OCR 텍스트 추출 완료: [민감정보 마스킹 처리됨]";
    if (type === 'application/pdf') return "총 12페이지 문서 변환 완료. 핵심 요약(Executive Summary) 생성됨.";
    if (name.endsWith('.xlsx') || name.endsWith('.csv')) return "스프레드시트 표 데이터 개요 및 엑셀 데이터 분석 요약.";
    if (name.endsWith('.hwp') || name.endsWith('.docx') || name.endsWith('.txt')) return "주요 조항/계약 핵심 추출 완료.";
    if (name.endsWith('.zip')) return "압축 파일 내부 구조 요약 렌더링 완료.";
    return "문서 요약 분석 대기중";
}

const LAWYERS = ['김수현', '이정재', '박은빈', '송중기'];

const STATUS_COLORS: Record<string, { bg: string, text: string, border: string }> = {
    '상담': { bg: '#fffbeb', text: '#d97706', border: '#fde68a' }, // Amber
    '수임': { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' }, // Red
    '보류': { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' }, // Slate
    '완료': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' }, // Green
};

export default function ConsultQueue() {
    const { consultations, isLoading, updateConsultation, addConsultation } = useConsultations();
    
    // Map Supabase Consultation to the UI's expected ConsultRecord format for mapping tabs/status
    const records = (consultations || []).map(c => {
        let mappedStatus = '상담';
        if (c.status === '대기' || c.status === 'submitted') mappedStatus = '상담';
        else if (c.status === '수임') mappedStatus = '수임';
        else if (c.status === '거절') mappedStatus = '보류';
        else if (c.status === '상담완료' || c.status === 'answered' || c.status === 'callback_done') mappedStatus = '완료';

        return {
            ...c,
            uiStatus: mappedStatus as '상담' | '수임' | '보류' | '완료',
            clientName: c.companyName || c.authorName || '이름 없음',
            clientPhone: c.callbackPhone || '-',
            clientEmail: '',
            uiDate: c.createdAt ? c.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            lawyer: c.assignedLawyer || '',
            targetFee: 0,
            fee: 0,
            isCallbackReq: c.status === 'callback_requested',
        };
    });

    const [activeTab, setActiveTab] = useState<'전체' | '상담' | '수임' | '보류' | '완료'>('전체');
    const filtered = activeTab === '전체' ? records : records.filter(r => r.uiStatus === activeTab);
    const tabs = (['전체', '상담', '수임', '보류', '완료'] as const);
    const counts = tabs.reduce((a, t) => ({
        ...a, [t]: t === '전체' ? records.length : records.filter(r => r.uiStatus === t).length
    }), {} as Record<string, number>);

    const [selId, setSelId] = useState<string | null>(null);
    const sel = records.find(r => r.id === selId) || (records.length > 0 ? records[0] : null);

    const [answer, setAnswer] = useState('');
    const [memo, setMemo] = useState('');
    const [isSavingMemo, setIsSavingMemo] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const memoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState('');
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
    
    // 신규 모달 & 담당자 드롭다운
    const [showAdd, setShowAdd] = useState(false);
    const [showLawyerDropdown, setShowLawyerDropdown] = useState(false);
    const [newForm, setNewForm] = useState({ clientName: '', clientPhone: '', category: '민사', content: '', targetFee: '' });

    // 첨부파일 관리
    const [attachments, setAttachments] = useState<{file: any, expanded: boolean}[]>([]);

    useEffect(() => {
        if (records.length > 0 && !selId) {
            setSelId(records[0].id);
        }
    }, [records.length, selId]);

    useEffect(() => {
        if (sel) {
            setAnswer(sel.lawyerAnswer || sel.aiAnswer || ''); // AI 초안 자동 주입
            setMemo(sel.callbackNote || ''); // 메모 주입
            
            const fileList = sel.attachedFiles || [];
            setAttachments(fileList.map((f: any) => ({ file: f, expanded: false })));
        }
    }, [sel?.id]); // Only run when selection ID changes

    // 자동 저장 
    const handleMemoChange = (val: string) => {
        setMemo(val);
        setIsSavingMemo(true);
        if (memoTimeoutRef.current) clearTimeout(memoTimeoutRef.current);
        memoTimeoutRef.current = setTimeout(() => {
            if (sel) {
                updateConsultation(sel.id, { callbackNote: val, updatedAt: new Date().toISOString() });
                setLastSaved(new Date());
                setIsSavingMemo(false);
            }
        }, 1500);
    };

    const handleMemoBlur = () => {
        if (memoTimeoutRef.current && isSavingMemo && sel) {
            clearTimeout(memoTimeoutRef.current);
            updateConsultation(sel.id, { callbackNote: memo, updatedAt: new Date().toISOString() });
            setLastSaved(new Date());
            setIsSavingMemo(false);
        }
    };

    const updateStatus = async (r: any, newUiStatus: '상담' | '수임' | '보류' | '완료') => {
        let mappedDbStatus = 'submitted';
        if (newUiStatus === '상담') mappedDbStatus = 'submitted';
        if (newUiStatus === '수임') mappedDbStatus = '수임'; 
        if (newUiStatus === '보류') mappedDbStatus = '거절';
        if (newUiStatus === '완료') {
            mappedDbStatus = r.status === 'callback_requested' ? 'callback_done' : 'answered';
        }

        await updateConsultation(r.id, { status: mappedDbStatus as any });
        setToast(`상태가 [${newUiStatus}] 단계로 변경되었습니다.`);
        setTimeout(() => setToast(''), 3000);
    };

    const submitAnswer = async () => {
        if (!sel || !answer.trim()) return;
        setLoading(true);
        await updateConsultation(sel.id, { 
            lawyerAnswer: answer, 
            status: 'answered',
            answeredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            callbackNote: memo
        });
        setLoading(false);
        setToast(`✅ ${sel.clientName}에 답변이 발송되었습니다`);
        setTimeout(() => setToast(''), 3000);
        setTimeout(() => setMobileView('list'), 1500);
    };

    const addRecord = async () => {
        await addConsultation({
            id: `c${Date.now()}`,
            title: newForm.content.slice(0, 20),
            body: newForm.content,
            authorName: newForm.clientName,
            callbackPhone: newForm.clientPhone,
            category: newForm.category as any,
            status: 'submitted',
            createdAt: new Date().toISOString(),
            isPrivate: true,
        });
        setShowAdd(false);
        setNewForm({ clientName: '', clientPhone: '', category: '민사', content: '', targetFee: '' });
        setToast(`신규 상담이 등록되었습니다.`);
        setTimeout(() => setToast(''), 3000);
    };

    return (
        <div className="flex h-full" style={{ background: '#f8f9fc' }}>
            {/* ── 좌측: 목록 패널 ── */}
            <div
                className={`
                    flex-shrink-0 flex-col
                    ${mobileView === 'list' ? 'flex' : 'hidden'}
                    sm:flex w-full sm:w-72 lg:w-80
                `}
                style={{ borderRight: '1px solid #e5e7eb', background: '#ffffff' }}
            >
                {/* 탭 네비게이션 */}
                <div className="flex-shrink-0" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <div className="flex overflow-x-auto">
                        {tabs.map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className="flex-shrink-0 px-3 py-3 text-xs font-bold transition-all whitespace-nowrap"
                                style={{
                                    color: activeTab === t ? '#b8960a' : '#94a3b8',
                                    borderBottom: activeTab === t ? '2px solid #b8960a' : '2px solid transparent',
                                }}>
                                {t} <span className="ml-1 text-[10px]" style={{ color: activeTab === t ? '#c9a84c' : '#94a3b8' }}>{counts[t]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="px-3 pb-3 pt-2">
                        <button onClick={() => setShowAdd(true)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all active:scale-95"
                            style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>
                            <Plus className="w-3.5 h-3.5" /> 오프라인/신규 상담 등록
                        </button>
                    </div>
                </div>

                {/* 리스트 목록 */}
                <div className="overflow-y-auto flex-1 relative">
                    {isLoading && records.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                        </div>
                    )}
                    {filtered.map(r => {
                        const sc = STATUS_COLORS[r.uiStatus] || STATUS_COLORS['상담'];
                        const isSelected = selId === r.id;
                        return (
                            <div key={r.id} onClick={() => { 
                                setSelId(r.id); 
                                setMobileView('detail'); 
                                setShowLawyerDropdown(false); 
                                // 변호사가 1번이라도 열람했다면 '검토중(reviewing)'으로 상태 변경
                                if (r.status === 'submitted' || r.status === '대기' || r.status === 'received') {
                                    updateConsultation(r.id, { status: 'reviewing' as any });
                                }
                            }}
                                className="p-4 cursor-pointer transition-all active:opacity-70"
                                style={{
                                    background: isSelected ? '#fffbeb' : 'transparent',
                                    borderLeft: isSelected ? '3px solid #c9a84c' : '3px solid transparent',
                                    borderBottom: '1px solid #f1f5f9',
                                }}>
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                                            {r.uiStatus}
                                        </span>
                                        {r.isCallbackReq && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black bg-red-600 text-white animate-pulse">
                                                🚨 통화요청
                                            </span>
                                        )}
                                        {r.urgency === 'urgent' && r.uiStatus !== '완료' && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black bg-red-50 text-red-600">긴급</span>
                                        )}
                                        <span className="text-[10px] text-slate-500 font-medium px-1 rounded bg-slate-100">{r.category}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>{r.uiDate.slice(5)}</span>
                                        {r.lawyer && (
                                            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded font-bold"
                                                style={{ background: '#f8f9fc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                                {r.lawyer}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm font-bold truncate mb-0.5" style={{ color: '#1e293b' }}>{r.clientName}</p>
                                <p className="text-xs truncate text-slate-500">{r.title || r.body}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── 우측: 답변/상세 영역 ── */}
            {sel && (
                <div
                    className={`
                        flex-1 overflow-y-auto p-4 sm:p-6 space-y-4
                        ${mobileView === 'detail' ? 'flex flex-col' : 'hidden'}
                        sm:flex sm:flex-col
                    `}
                >
                    <button
                        onClick={() => setMobileView('list')}
                        className="sm:hidden flex items-center gap-2 text-sm font-bold mb-1"
                        style={{ color: '#b8960a' }}
                    >
                        <ChevronLeft className="w-4 h-4" /> 리스트로 돌아가기
                    </button>

                    {/* 상단 CRM 정보 헤더 */}
                    <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                                        style={{ background: STATUS_COLORS[sel.uiStatus]?.bg, color: STATUS_COLORS[sel.uiStatus]?.text, border: `1px solid ${STATUS_COLORS[sel.uiStatus]?.border}` }}>
                                        {sel.uiStatus}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-lg font-bold bg-slate-100 text-slate-600">{sel.category}</span>
                                    <span className="text-xs text-slate-400 font-medium ml-1">{sel.uiDate}</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800">{sel.clientName}</h2>
                            </div>
                            
                            {/* 담당자 & 접근 권한 툴바 */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <button onClick={() => setShowLawyerDropdown(!showLawyerDropdown)}
                                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-bold transition-all hover:bg-slate-50"
                                        style={{ background: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1' }}>
                                        <User className="w-4 h-4" style={{ color: sel.lawyer ? '#b8960a' : '#94a3b8' }} />
                                        담당: {sel.lawyer || '미지정'}
                                    </button>
                                    <AnimatePresence>
                                        {showLawyerDropdown && (
                                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                className="absolute right-0 mt-2 w-36 rounded-xl py-1 z-10 shadow-xl"
                                                style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                                                {LAWYERS.map(l => (
                                                    <button key={l} onClick={async () => {
                                                        await updateConsultation(sel.id, { assignedLawyer: l });
                                                        setToast(`담당자가 ${l} 변호사로 변경되었습니다.`);
                                                        setShowLawyerDropdown(false);
                                                        setTimeout(()=>setToast(''), 3000);
                                                    }}
                                                        className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-between"
                                                        style={{ color: '#374151', background: sel.lawyer === l ? '#fffbeb' : 'transparent' }}>
                                                        {l} 변호사
                                                        {sel.lawyer === l && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-1 py-1">
                                    <button onClick={async () => await updateConsultation(sel.id, { isPrivate: false })}
                                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${!sel.isPrivate ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                                        전체공개
                                    </button>
                                    <button onClick={async () => await updateConsultation(sel.id, { isPrivate: true })}
                                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${sel.isPrivate ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                                        개별비공개
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CRM Detail info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-semibold text-slate-700">{sel.clientPhone || '연락처 없음'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-semibold text-slate-700">{sel.clientEmail || '이메일 없음'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-bold text-amber-600">
                                    {sel.fee ? `${(sel.fee / 10000).toLocaleString()}만` : '예상수임료 미결정'}
                                    {sel.targetFee ? ` / 목표 ${(sel.targetFee / 10000).toLocaleString()}만원` : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 상태 단계 변경 툴바 */}
                    <div className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Scale className="w-4 h-4" /> 단계/상태 관리</span>
                            <div className="flex flex-wrap gap-2">
                                {(['상담', '수임', '보류', '완료'] as const).map(s => (
                                    <button key={s} onClick={() => updateStatus(sel, s)}
                                        className="text-xs px-3.5 py-1.5 rounded-full font-bold transition-all active:scale-95"
                                        style={{
                                            background: sel.uiStatus === s ? STATUS_COLORS[s].bg : '#f1f5f9',
                                            color: sel.uiStatus === s ? STATUS_COLORS[s].text : '#64748b',
                                            border: `1px solid ${sel.uiStatus === s ? STATUS_COLORS[s].border : '#e2e8f0'}`,
                                            boxShadow: sel.uiStatus === s ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                        }}>{s}</button>
                                ))}
                            </div>
                        </div>
                        {sel.uiStatus === '상담' && (
                            <button onClick={() => updateStatus(sel, '수임')}
                                className="flex items-center gap-1 text-xs px-4 py-2 rounded-xl font-bold shadow-sm transition-all hover:-translate-y-0.5"
                                style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#ffffff' }}>
                                공식 사건안으로 승격 전환 →
                            </button>
                        )}
                    </div>

                    {/* 고객사 질문 본문 */}
                    <div>
                        <div className="p-4 sm:p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap" style={{ background: '#f8f9fc', color: '#1e293b', borderLeft: '4px solid #e2e8f0' }}>
                            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-500">
                                <MessageSquare className="w-3.5 h-3.5" /> 
                                {sel.title ? `${sel.title}\n\n` : ''}
                            </div>
                            {sel.body || sel.content}
                        </div>
                    </div>

                    {/* 첨부파일 사전 분석(미리보기) 영역 */}
                    {attachments.length > 0 ? (
                        <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5" /> 첨부 문서 인텔리전스 분석 ({attachments.length}개)
                            </h3>
                            {attachments.map((att, idx) => (
                                <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div 
                                        className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                                        onClick={() => setAttachments(prev => prev.map((a, i) => i === idx ? { ...a, expanded: !a.expanded } : a))}
                                    >
                                        <div className="flex items-center gap-3">
                                            {getFileIcon(att.file.type, att.file.name)}
                                            <span className="text-sm font-semibold text-slate-700 truncate max-w-xs">{att.file.name}</span>
                                            <span className="text-xs text-slate-400">{(att.file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setToast(`📥 ${att.file.name} 원본 다운로드가 시작되었습니다.`); 
                                                    setTimeout(()=>setToast(''), 3000);
                                                }}
                                                className="hidden sm:flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition-all active:scale-95"
                                            >
                                                <DownloadCloud className="w-3.5 h-3.5" /> 원본 열기
                                            </button>
                                            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${att.expanded ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {att.expanded && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="p-4 bg-white flex gap-4">
                                                    <div className="hidden sm:flex items-center justify-center w-32 h-32 bg-slate-50 rounded-xl shrink-0 border border-slate-100 shadow-sm">
                                                        {att.file.type.startsWith('image/') ? <ImageIcon className="w-10 h-10 text-slate-300" /> : getFileIcon(att.file.type, att.file.name)}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                                                            <Scale className="w-3.5 h-3.5 text-indigo-500" /> AI 자동 요약 (참고용)
                                                        </h4>
                                                        <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed min-h-[5rem]">
                                                            {getPreviewText(att.file.type, att.file.name)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="pt-2">
                            <h3 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5" /> 첨부 문서
                            </h3>
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                                <FileText className="w-8 h-8 text-slate-300 mb-2" />
                                <p className="text-sm font-semibold text-slate-500">첨부된 파일이 없습니다</p>
                                <p className="text-xs text-slate-400 mt-1">의뢰인이 상담 시 첨부한 문서나 자료가 없습니다.</p>
                            </div>
                        </div>
                    )}

                    {/* 변호사 메모 및 오퍼레이션 영역 */}
                    <div className="flex-1 flex flex-col pt-3 gap-6">
                        
                        {/* 변호사 코멘트 (강력한 자동저장 지원) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                    📝 진행 메모 노트
                                </span>
                                <span className="text-[10px] flex items-center gap-1">
                                    {isSavingMemo && <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />}
                                    <span className={`transition-opacity duration-300 font-bold ${isSavingMemo ? 'text-slate-400' : lastSaved ? 'text-green-600' : 'text-slate-400'}`}>
                                        {isSavingMemo ? '저장 중...' : lastSaved ? `자동 저장됨: 오전 ${lastSaved.getHours().toString().padStart(2, '0')}:${lastSaved.getMinutes().toString().padStart(2, '0')}` : '수정 시 자동 저장됨'}
                                    </span>
                                </span>
                            </div>
                            <textarea 
                                value={memo} 
                                onChange={e => handleMemoChange(e.target.value)}
                                onBlur={handleMemoBlur}
                                rows={2}
                                placeholder="의뢰인이나 사건 진행에 대한 내부 기록용 메모를 자유롭게 입력하세요 (입력 즉시 자동 저장)"
                                className="w-full p-4 rounded-xl outline-none text-sm resize-none focus:ring-2 focus:ring-slate-100 transition-shadow"
                                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b' }} 
                            />
                        </div>

                        {/* 고객 최종 답변 발송 폼 (선택적) */}
                        <div className="pb-8">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Scale className="w-4 h-4" style={{ color: '#b8960a' }} />
                                    <span className="text-sm font-bold" style={{ color: '#b8960a' }}>고객 답변 브리핑</span>
                                    {sel.aiAnswer && !sel.lawyerAnswer && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold ml-1 border border-indigo-200">
                                            AI 초안 주입됨
                                        </span>
                                    )}
                                </div>
                                {answer && (
                                    <span className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>{answer.length}자</span>
                                )}
                            </div>
                            
                            <textarea 
                                value={answer} 
                                onChange={e => setAnswer(e.target.value)} 
                                rows={6}
                                placeholder="이메일이나 고객 포털로 발송되는 최종 답변을 작성 하는 곳 입니다."
                                className="w-full p-5 rounded-2xl outline-none text-sm resize-none transition-all focus:shadow-md mb-4"
                                style={{ background: '#ffffff', border: `1px solid ${answer ? '#fde68a' : '#e5e7eb'}`, color: '#1e293b', lineHeight: 1.8 }} 
                            />

                            <div className="flex justify-end">
                                <button onClick={submitAnswer} disabled={loading || !answer.trim()}
                                    className="flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 transition-all active:scale-95 w-full sm:w-auto"
                                    style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#78350f', boxShadow: '0 4px 14px rgba(201,168,76,0.25)' }}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {loading ? '발송 처리 중...' : '확인 및 답변 완료 처리'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 기타 오버레이 ── */}
            {/* 오프라인/신규 등록 모달 */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                        onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="w-full max-w-md rounded-2xl p-6"
                            style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-black text-lg" style={{ color: '#1e293b' }}>📋 오프라인 상담 등록</h2>
                                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg active:bg-slate-100" style={{ color: '#94a3b8' }}><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold mb-1 block" style={{ color: '#64748b' }}>회사/의뢰인명 <span className="text-red-500">*</span></label>
                                        <input value={newForm.clientName} onChange={e => setNewForm(p => ({ ...p, clientName: e.target.value }))}
                                            placeholder="홍○○ / (주)○○" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold mb-1 block" style={{ color: '#64748b' }}>연락처</label>
                                        <input value={newForm.clientPhone} onChange={e => setNewForm(p => ({ ...p, clientPhone: e.target.value }))}
                                            placeholder="010-0000-0000" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold mb-1 block" style={{ color: '#64748b' }}>사건 분야</label>
                                        <select value={newForm.category} onChange={e => setNewForm(p => ({ ...p, category: e.target.value }))}
                                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                                            {['민사', '형사', '가사', '부동산', '노무', '기업', '기타'].map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold mb-1 block" style={{ color: '#64748b' }}>목표 예상 수임료</label>
                                        <input value={newForm.targetFee} onChange={e => setNewForm(p => ({ ...p, targetFee: e.target.value }))}
                                            placeholder="숫자 입력 (예: 5000000)" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold mb-1 block" style={{ color: '#64748b' }}>문의 내용 요약 <span className="text-red-500">*</span></label>
                                    <textarea value={newForm.content} onChange={e => setNewForm(p => ({ ...p, content: e.target.value }))} rows={4}
                                        placeholder="초기 상담 내용을 입력하세요..."
                                        className="w-full px-3 py-2.5 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-blue-100"
                                        style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:bg-slate-200"
                                    style={{ background: '#f1f5f9', color: '#64748b' }}>취소</button>
                                <button onClick={addRecord} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                                    style={{ background: '#c9a84c', color: '#fff' }}>서류 등록 완료</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 토스트 메시지 */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-bold z-50 shadow-xl flex items-center gap-2"
                        style={{ background: '#111827', color: '#f0f4ff', border: '1px solid rgba(201,168,76,0.3)', whiteSpace: 'nowrap' }}>
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
