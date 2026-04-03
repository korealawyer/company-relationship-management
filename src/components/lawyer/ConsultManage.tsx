// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, DollarSign, ChevronLeft, ChevronRight, Plus, X, User, CheckCircle2 } from 'lucide-react';
import { STATUS_COLORS } from '@/lib/lawyerMockData';
import { useConsultations } from '@/hooks/useDataLayer';

const LAWYERS = ['김수현', '이정재', '박은빈', '송중기'];

export default function ConsultManage() {
    const { consultations, isLoading, updateConsultation, addConsultation } = useConsultations();
    
    // Map Supabase Consultation to the UI's expected ConsultRecord format
    const records = (consultations || []).map(c => {
        let mappedStatus = '상담';
        if (c.status === '대기' || c.status === 'submitted') mappedStatus = '상담';
        else if (c.status === '수임') mappedStatus = '수임';
        else if (c.status === '거절') mappedStatus = '보류';
        else if (c.status === '상담완료' || c.status === 'answered' || c.status === 'callback_done') mappedStatus = '완료';

        return {
            id: c.id,
            status: mappedStatus as '상담' | '수임' | '보류' | '완료',
            clientName: c.companyName || c.authorName || '이름 없음',
            clientPhone: c.callbackPhone || '-',
            clientEmail: '',
            category: c.category || '기타',
            content: c.body || c.title || '',
            date: c.createdAt ? c.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            lawyer: c.assignedLawyer || '',
            fee: 0,
            targetFee: 0,
            note: c.callbackNote || '',
            isPublic: !c.isPrivate,
            _original: c
        };
    });

    const [activeTab, setActiveTab] = useState<'전체' | '상담' | '수임' | '보류' | '완료'>('전체');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
    const [editNote, setEditNote] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [showLawyerDropdown, setShowLawyerDropdown] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [newForm, setNewForm] = useState({ clientName: '', clientPhone: '', category: '민사', content: '', targetFee: '' });

    const filtered = activeTab === '전체' ? records : records.filter(r => r.status === activeTab);
    const tabs = (['전체', '상담', '수임', '보류', '완료'] as const);
    const counts = tabs.reduce((a, t) => ({
        ...a, [t]: t === '전체' ? records.length : records.filter(r => r.status === t).length
    }), {} as Record<string, number>);

    const selected = records.find(r => r.id === selectedId) || records[0];

    useEffect(() => {
        if (selected && editNote === '' && selected.note !== editNote) {
            setEditNote(selected.note);
        }
    }, [selectedId, selected?.note]);

    const handleSelect = (r: any) => {
        setSelectedId(r.id);
        setEditNote(r.note ?? '');
        setMobileView('detail');
        setShowLawyerDropdown(false);
    };

    const changeLawyer = async (r: any, newLawyer: string) => {
        await updateConsultation(r.id, { assignedLawyer: newLawyer });
        setShowLawyerDropdown(false);
        setToastMsg(`담당자가 ${newLawyer} 변호사로 변경되었습니다.`);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const changeStatus = async (r: any, status: '상담' | '수임' | '보류' | '완료') => {
        let mappedDbStatus = 'submitted';
        if (status === '상담') mappedDbStatus = 'submitted';
        if (status === '수임') mappedDbStatus = '수임'; // Assume '수임' exists in db
        if (status === '보류') mappedDbStatus = '거절';
        if (status === '완료') mappedDbStatus = 'answered';

        await updateConsultation(r.id, { status: mappedDbStatus as any });
    };

    const changeIsPublic = async (r: any, isPublic: boolean) => {
        await updateConsultation(r.id, { isPrivate: !isPublic });
    };

    const saveNote = async () => {
        if (!selected) return;
        await updateConsultation(selected.id, { callbackNote: editNote });
        setToastMsg(`메모가 저장되었습니다.`);
        setTimeout(() => setToastMsg(''), 3000);
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
        setToastMsg(`신규 상담이 등록되었습니다.`);
        setTimeout(() => setToastMsg(''), 3000);
    };

    return (
        <div className="flex h-full" style={{ background: '#f8f9fc' }}>
            {/* 좌측: 상담 목록 */}
            <div className={`flex-shrink-0 flex flex-col ${mobileView === 'list' ? 'flex' : 'hidden'} sm:flex w-full sm:w-72 lg:w-80`}
                style={{ borderRight: '1px solid #e5e7eb', background: '#ffffff' }}>
                {/* 탭 */}
                <div className="flex-shrink-0" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <div className="flex overflow-x-auto">
                        {tabs.map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className="flex-shrink-0 px-3 py-2.5 text-xs font-bold transition-all"
                                style={{
                                    color: activeTab === t ? '#2563eb' : '#94a3b8',
                                    borderBottom: activeTab === t ? '2px solid #2563eb' : '2px solid transparent',
                                    background: 'transparent'
                                }}>
                                {t} <span className="ml-1 text-[10px]" style={{ color: '#94a3b8' }}>{counts[t]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="px-3 pb-2 pt-1">
                        <button onClick={() => setShowAdd(true)}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                            <Plus className="w-3 h-3" /> 신규 상담 등록
                        </button>
                    </div>
                </div>
                {/* 목록 */}
                <div className="overflow-y-auto flex-1 relative">
                    {isLoading && records.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm text-gray-400 font-bold animate-pulse">데이터 로딩 중...</span>
                        </div>
                    )}
                    {filtered.map(r => {
                        const sc = STATUS_COLORS[r.status] || STATUS_COLORS['상담'];
                        return (
                            <div key={r.id} onClick={() => handleSelect(r)}
                                className="p-3.5 cursor-pointer transition-all"
                                style={{
                                    background: selected?.id === r.id ? '#f0f9ff' : 'transparent',
                                    borderLeft: selected?.id === r.id ? '3px solid #2563eb' : '3px solid transparent',
                                    borderBottom: '1px solid #f1f5f9',
                                }}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                                            {r.status}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                            style={{ background: '#f1f5f9', color: '#64748b' }}>{r.category}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>{r.date.slice(5)}</span>
                                        {r.lawyer && (
                                            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded font-bold"
                                                style={{ background: '#f8f9fc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                                {r.lawyer}
                                            </span>
                                        )}
                                        <ChevronRight className="w-3.5 h-3.5 sm:hidden" style={{ color: '#94a3b8' }} />
                                    </div>
                                </div>
                                <p className="text-sm font-bold truncate" style={{ color: '#1e293b' }}>{r.clientName}</p>
                                <p className="text-xs truncate mt-0.5" style={{ color: '#64748b' }}>{r.content}</p>
                                {r.targetFee ? (
                                    <p className="text-xs mt-1 font-bold" style={{ color: '#b8960a' }}>
                                        목표 {(r.targetFee / 10000).toLocaleString()}만원
                                    </p>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 우측: 상담 상세 */}
            {selected && (
                <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 ${mobileView === 'detail' ? 'flex flex-col' : 'hidden'} sm:flex sm:flex-col`}>
                    <button onClick={() => setMobileView('list')}
                        className="sm:hidden flex items-center gap-2 text-sm font-bold mb-1"
                        style={{ color: '#2563eb' }}>
                        <ChevronLeft className="w-4 h-4" /> 목록으로
                    </button>

                    {/* 고객 정보 */}
                    <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: STATUS_COLORS[selected.status]?.bg || '#eff6ff', color: STATUS_COLORS[selected.status]?.text || '#2563eb', border: `1px solid ${STATUS_COLORS[selected.status]?.border || '#bfdbfe'}` }}>
                                        {selected.status}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                        style={{ background: '#f1f5f9', color: '#64748b' }}>{selected.category}</span>
                                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>{selected.date}</span>
                                </div>
                                <h2 className="text-lg font-black" style={{ color: '#1e293b' }}>{selected.clientName}</h2>
                            </div>
                            {/* 담당지정 & 공개범위 */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <button onClick={() => setShowLawyerDropdown(!showLawyerDropdown)}
                                        className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg font-bold transition-all hover:bg-slate-100"
                                        style={{ background: '#ffffff', color: '#374151', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        <User className="w-3 h-3" style={{ color: selected.lawyer ? '#2563eb' : '#94a3b8' }} />
                                        담당: {selected.lawyer || '미지정'}
                                    </button>
                                    <AnimatePresence>
                                        {showLawyerDropdown && (
                                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
                                                className="absolute right-0 mt-1 w-32 rounded-xl py-1 z-10"
                                                style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                                {LAWYERS.map(l => (
                                                    <button key={l} onClick={() => changeLawyer(selected, l)}
                                                        className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-between"
                                                        style={{ color: '#374151', background: selected.lawyer === l ? '#eff6ff' : 'transparent' }}>
                                                        {l} 변호사
                                                        {selected.lawyer === l && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>공개</span>
                                    <button onClick={() => changeIsPublic(selected, !selected.isPublic)}
                                        className="text-[10px] px-2 py-1.5 rounded-lg font-bold"
                                        style={{ background: selected.isPublic ? '#eff6ff' : '#f1f5f9', color: selected.isPublic ? '#2563eb' : '#94a3b8', border: `1px solid ${selected.isPublic ? '#bfdbfe' : '#e2e8f0'}` }}>
                                        {selected.isPublic ? '전체공개' : '개별공개'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                                <span className="text-sm" style={{ color: '#374151' }}>{selected.clientPhone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                                <span className="text-sm" style={{ color: '#374151' }}>{selected.clientEmail || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                                <span className="text-sm font-bold" style={{ color: '#b8960a' }}>
                                    {selected.fee ? `${(selected.fee / 10000).toLocaleString()}만` : '미결정'}
                                    {selected.targetFee ? ` / 목표 ${(selected.targetFee / 10000).toLocaleString()}만원` : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 상담 내용 */}
                    <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <p className="text-xs font-bold mb-2" style={{ color: '#94a3b8' }}>📋 상담 내용</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{selected.content}</p>
                    </div>

                    {/* 메모 & 답글 */}
                    <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <p className="text-xs font-bold mb-2" style={{ color: '#94a3b8' }}>📝 메모 / 답글</p>
                        <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={4}
                            placeholder="메모나 답글을 입력하세요..."
                            className="w-full p-3 rounded-xl text-sm resize-none outline-none"
                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b', lineHeight: 1.7 }} />
                    </div>

                    {/* 단계 변경 + 액션 버튼 */}
                    <div className="rounded-xl p-4 space-y-3" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>⚡ 단계 변경</p>
                        <div className="flex flex-wrap gap-2">
                            {(['상담', '수임', '보류', '완료'] as const).map(s => (
                                <button key={s} onClick={() => changeStatus(selected, s)}
                                    className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                    style={{
                                        background: selected.status === s ? STATUS_COLORS[s].bg : '#f1f5f9',
                                        color: selected.status === s ? STATUS_COLORS[s].text : '#64748b',
                                        border: `1px solid ${selected.status === s ? STATUS_COLORS[s].border : '#e2e8f0'}`,
                                    }}>{s}</button>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={saveNote}
                                className="flex-1 py-2 rounded-xl text-sm font-bold"
                                style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#ffffff' }}>
                                저장
                            </button>
                            {selected.status === '상담' && (
                                <button onClick={() => changeStatus(selected, '수임')}
                                    className="flex-1 py-2 rounded-xl text-sm font-bold"
                                    style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#ffffff' }}>
                                    공식사건 등록 →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 신규 상담 등록 모달 */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                        onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="w-full max-w-md rounded-2xl p-6"
                            style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-black text-lg" style={{ color: '#1e293b' }}>📋 신규 상담 등록</h2>
                                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg" style={{ color: '#94a3b8' }}><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>★ 의뢰인명</label>
                                        <input value={newForm.clientName} onChange={e => setNewForm(p => ({ ...p, clientName: e.target.value }))}
                                            placeholder="홍○○ / (주)○○" className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>연락처</label>
                                        <input value={newForm.clientPhone} onChange={e => setNewForm(p => ({ ...p, clientPhone: e.target.value }))}
                                            placeholder="010-0000-0000" className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>사건 분류</label>
                                        <select value={newForm.category} onChange={e => setNewForm(p => ({ ...p, category: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                                            {['민사', '형사', '가사', '부동산', '노무', '기업', '기타'].map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>목표 수임료</label>
                                        <input value={newForm.targetFee} onChange={e => setNewForm(p => ({ ...p, targetFee: e.target.value }))}
                                            placeholder="5000000" className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>★ 상담 내용</label>
                                    <textarea value={newForm.content} onChange={e => setNewForm(p => ({ ...p, content: e.target.value }))} rows={4}
                                        placeholder="상담 내용을 입력하세요..."
                                        className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                                        style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                                    style={{ background: '#f1f5f9', color: '#64748b' }}>취소</button>
                                <button onClick={addRecord} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                                    style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#ffffff' }}>등록</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* 토스트 알림 */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg z-50 pointer-events-none"
                        style={{ background: '#1e293b', color: '#ffffff', border: '1px solid #334155' }}>
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-bold">{toastMsg}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
