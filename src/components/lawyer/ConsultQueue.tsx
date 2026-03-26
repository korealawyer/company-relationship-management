'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, MessageSquare, CheckCircle2, Send, Loader2,
    Phone, Edit3, ChevronRight, ChevronLeft, Paperclip, X, CreditCard
} from 'lucide-react';
import { generateAIDraft, type AIAssistResponse } from '@/lib/ai-assist';
import { type ConsultItem } from '@/lib/types';
import { CONSULTS } from '@/lib/constants';

// ── 상담 검토 패널 (모바일 탭 전환 지원) ─────────────────────────
export default function ConsultQueue() {
    const [sel, setSel] = useState<ConsultItem | null>(CONSULTS[0]);
    const [answer, setAnswer] = useState('');
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aiCache, setAiCache] = useState<Record<string, AIAssistResponse>>({});
    const [sentItems, setSentItems] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState('');
    // 모바일: 목록 패널 vs 답변 패널 전환
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
    const [attachments, setAttachments] = useState<File[]>([]);
    
    // 결제 팝업 상태
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentReason, setPaymentReason] = useState('초기 자문료');
    const [paymentAmount, setPaymentAmount] = useState('500,000');
    const [paymentLoading, setPaymentLoading] = useState(false);

    useEffect(() => {
        const preloadAll = async () => {
            const cache: Record<string, AIAssistResponse> = {};
            for (const item of CONSULTS) {
                const result = await generateAIDraft({
                    question: item.content,
                    category: item.category,
                    companyName: item.companyName,
                    urgency: item.urgency,
                    lawyerName: '김수현',
                });
                cache[item.id] = result;
            }
            setAiCache(cache);
            if (CONSULTS[0] && cache[CONSULTS[0].id]) {
                setAnswer(cache[CONSULTS[0].id].draft);
            }
        };
        preloadAll();
    }, []);

    const handleSelect = (item: ConsultItem) => {
        setSel(item);
        if (sentItems.has(item.id)) {
            setDone(true);
            setAnswer('');
        } else {
            setDone(false);
            const cached = aiCache[item.id];
            setAnswer(cached?.draft || '');
        }
        setAttachments([]);
        // 모바일에서 선택하면 상세 뷰로 이동
        setMobileView('detail');
    };

    const submit = async () => {
        if (!sel || !answer.trim()) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        setDone(true);
        setSentItems(prev => new Set(prev).add(sel.id));
        setLoading(false);
        setToast(`✅ ${sel.companyName}에 답변이 발송되었습니다${attachments.length > 0 ? ` (파일 ${attachments.length}개 첨부)` : ''}`);
        setAttachments([]);
        // 모바일에서 발송 후 목록으로 돌아가기
        setTimeout(() => setMobileView('list'), 1500);
    };

    const handlePaymentSubmit = async () => {
        if (!paymentReason.trim() || !paymentAmount.trim()) {
            setToast('❌ 청구 사유와 금액을 모두 입력해주세요.');
            setTimeout(() => setToast(''), 3000);
            return;
        }

        // 낙관적 UI(Optimistic UI) 업데이트: API 응답을 기다리기 전에 즉각적으로 모달을 닫고 피드백 제공
        setShowPaymentModal(false);
        const optimisticCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        setToast(`⏳ 결제 링크(ibs.law/pay/${optimisticCode}) 전송 진행 중...`);
        setPaymentLoading(true);

        try {
            const response = await fetch('/api/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: paymentReason,
                    amount: paymentAmount,
                    phone: '010-0000-0000', // 모의 데이터 연동
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Server error occurred');
            }

            // 요청 성공 시 서버에서 받은 실제 결제 링크로 토스트 알림 교체
            setToast(`✅ 결제 링크(${result.data.paymentLink})가 SMS로 전송되었습니다`);
            
            // 입력 폼 초기화
            setPaymentReason('초기 자문료');
            setPaymentAmount('500,000');
        } catch (error) {
            console.error('SMS sending error:', error);
            // 에러 발생 시 UI 롤백 (모달을 다시 띄우고 실패 토스트 알림)
            setShowPaymentModal(true);
            setToast('❌ SMS 발송에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setPaymentLoading(false);
            setTimeout(() => setToast(''), 4000);
        }
    };

    const pendingCount = CONSULTS.filter(c => !sentItems.has(c.id)).length;

    return (
        <div className="flex h-full" style={{ background: '#f8f9fc' }}>
            {/* ── 질문 목록 (데스크탑: 항상 표시 / 모바일: list 뷰에서만) ── */}
            <div
                className={`
                    flex-shrink-0 overflow-y-auto
                    ${mobileView === 'list' ? 'flex' : 'hidden'}
                    sm:flex flex-col
                    w-full sm:w-72 lg:w-80
                `}
                style={{ borderRight: '1px solid #e5e7eb', background: '#ffffff' }}
            >
                <div className="p-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <span className="text-xs font-bold" style={{ color: '#94a3b8' }}>고객사 질문 목록</span>
                    {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                            style={{ background: '#fef2f2', color: '#dc2626' }}>
                            미답변 {pendingCount}건
                        </span>
                    )}
                </div>
                <div className="overflow-y-auto flex-1">
                    {CONSULTS.map(c => {
                        const isSent = sentItems.has(c.id);
                        return (
                            <div key={c.id} onClick={() => handleSelect(c)}
                                className="p-4 cursor-pointer transition-all active:opacity-70"
                                style={{
                                    background: sel?.id === c.id ? '#fffbeb' : isSent ? '#f0fdf4' : 'transparent',
                                    borderLeft: sel?.id === c.id ? '3px solid #c9a84c' : '3px solid transparent',
                                    borderBottom: '1px solid #f1f5f9',
                                    opacity: isSent ? 0.6 : 1,
                                }}>
                                <div className="flex justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        {isSent ? (
                                            <CheckCircle2 className="w-3 h-3" style={{ color: '#16a34a' }} />
                                        ) : (
                                            <span className="text-xs font-bold" style={{ color: c.urgency === 'urgent' ? '#dc2626' : '#94a3b8' }}>
                                                {c.urgency === 'urgent' ? '🔴 긴급' : '⚪ 일반'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>{c.created.slice(5)}</span>
                                        {/* 모바일에서 화살표 표시 */}
                                        <ChevronRight className="w-3.5 h-3.5 sm:hidden" style={{ color: '#c9a84c' }} />
                                    </div>
                                </div>
                                <p className="text-sm font-bold truncate mb-0.5" style={{ color: '#1e293b' }}>{c.title}</p>
                                <p className="text-xs truncate" style={{ color: '#64748b' }}>{c.companyName} · {c.category}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── 답변 영역 (데스크탑: 항상 표시 / 모바일: detail 뷰에서만) ── */}
            {sel && (
                <div
                    className={`
                        flex-1 overflow-y-auto p-4 sm:p-6 space-y-5
                        ${mobileView === 'detail' ? 'flex flex-col' : 'hidden'}
                        sm:flex sm:flex-col
                    `}
                >
                    {/* 모바일 뒤로가기 버튼 */}
                    <button
                        onClick={() => setMobileView('list')}
                        className="sm:hidden flex items-center gap-2 text-sm font-bold mb-1"
                        style={{ color: '#b8960a' }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        질문 목록으로
                    </button>

                    {/* 질문 헤더 */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {sel.urgency === 'urgent' && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>긴급</span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{ background: '#eff6ff', color: '#2563eb' }}>{sel.category}</span>
                            <span className="text-xs" style={{ color: '#94a3b8' }}>{sel.companyName}</span>
                        </div>
                        <h2 className="text-base sm:text-lg font-black mb-3" style={{ color: '#1e293b' }}>{sel.title}</h2>
                        <div className="p-3 sm:p-4 rounded-xl text-sm leading-relaxed" style={{ background: '#f8f9fc', color: '#475569', borderLeft: '3px solid #e5e7eb' }}>
                            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold" style={{ color: '#94a3b8' }}>
                                <MessageSquare className="w-3 h-3" /> 고객사 질문
                            </div>
                            {sel.content}
                        </div>
                    </div>

                    {/* AI 분석 결과 */}
                    {sel && aiCache[sel.id] && (
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #c7d2fe' }}>
                            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: '#eef2ff' }}>
                                <div className="flex items-center gap-2">
                                    <Scale className="w-4 h-4" style={{ color: '#6366f1' }} />
                                    <span className="text-xs font-bold" style={{ color: '#6366f1' }}>1차 법률분석 완료</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                    style={{ background: '#dcfce7', color: '#16a34a' }}>
                                    신뢰도 {aiCache[sel.id].confidence}%
                                </span>
                            </div>
                            <div className="px-4 py-2 flex items-center gap-2 flex-wrap" style={{ background: '#f8f9ff', borderBottom: '1px solid #e0e7ff' }}>
                                <span className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>참조:</span>
                                {aiCache[sel.id].references.map((ref: string) => (
                                    <span key={ref} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                        style={{ background: '#eff6ff', color: '#3b82f6' }}>{ref}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 답변 영역 */}
                    {!done ? (
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Scale className="w-4 h-4" style={{ color: '#b8960a' }} />
                                    <span className="text-sm font-bold" style={{ color: '#b8960a' }}>답변 발송</span>
                                </div>
                                {answer && (
                                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                                        {answer.length}자 · 수정 가능
                                    </span>
                                )}
                            </div>
                            <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={8}
                                placeholder="답변을 작성하세요..."
                                className="w-full p-3 sm:p-4 rounded-xl outline-none text-sm resize-none flex-1"
                                style={{ background: '#ffffff', border: `1px solid ${answer ? '#fde68a' : '#e5e7eb'}`, color: '#1e293b', lineHeight: 1.8, minHeight: 160 }} />

                            {/* 첨부파일 영역 */}
                            <div className="mt-3 flex flex-col gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                                        style={{ color: '#64748b', border: '1px dashed #cbd5e1', background: '#f8fafc' }}>
                                        <Paperclip className="w-3.5 h-3.5" />
                                        파일 첨부하기
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                                                }
                                                e.target.value = '';
                                            }}
                                        />
                                    </label>
                                    
                                    {attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold"
                                             style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}>
                                            <span className="truncate max-w-[100px] sm:max-w-[150px]">{file.name}</span>
                                            <button 
                                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                className="transition-colors hover:opacity-70 ml-0.5"
                                                style={{ color: '#94a3b8' }}
                                            >
                                                <X className="w-3 h-3 hover:text-red-500" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
                                <button onClick={() => setShowPaymentModal(true)}
                                    className="flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex-1 sm:flex-none justify-center"
                                    style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#ffffff', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                                    <CreditCard className="w-4 h-4" />
                                    결제/청구서 발송
                                </button>
                                
                                <button onClick={submit} disabled={loading || !answer.trim()}
                                    className="flex items-center gap-2 px-5 sm:px-8 py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all active:scale-95 flex-1 sm:flex-none justify-center"
                                    style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#78350f', boxShadow: '0 2px 8px rgba(201,168,76,0.3)' }}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {loading ? '발송 중...' : '고객사에 답변 발송'}
                                </button>

                                {sel.urgency === 'urgent' && (
                                    <button className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm"
                                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                        <Phone className="w-4 h-4" /> 콜백
                                    </button>
                                )}

                                <button onClick={() => { setAnswer(''); setAttachments([]); }}
                                    className="flex items-center gap-1 px-3 py-3 rounded-xl text-xs font-bold"
                                    style={{ color: '#94a3b8' }}>
                                    <Edit3 className="w-3 h-3" /> 초기화
                                </button>
                            </div>

                            {answer && (
                                <p className="text-[10px] mt-3" style={{ color: '#94a3b8' }}>
                                    💡 분석 결과가 자동으로 입력되었습니다. 검토 후 바로 발송하거나, 수정하여 보낼 수 있습니다.
                                </p>
                            )}
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="p-6 sm:p-8 rounded-xl text-center"
                            style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3" style={{ color: '#16a34a' }} />
                            <p className="font-bold text-base sm:text-lg" style={{ color: '#16a34a' }}>답변이 {sel.companyName}에 발송되었습니다</p>
                            <p className="text-xs mt-2" style={{ color: '#6b7280' }}>고객사 대시보드의 '변호사 답변' 탭에서 확인 가능합니다</p>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
                            style={{ border: '1px solid #e5e7eb' }}>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-blue-600" /> 결제 요청
                                </h3>
                                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">청구 사유</label>
                                    <input type="text" value={paymentReason} onChange={e => setPaymentReason(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-500"
                                        placeholder="예: 초기 자문료" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">청구 금액 (원)</label>
                                    <input type="text" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-500 font-medium"
                                        placeholder="예: 500,000" />
                                </div>
                            </div>
                            
                            <button onClick={handlePaymentSubmit} disabled={paymentLoading}
                                className="w-full mt-6 py-2.5 rounded-xl font-bold text-white text-sm flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                                {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {paymentLoading ? '발송 중...' : 'SMS 결제 링크 발송'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-bold z-50 mx-4"
                        style={{ background: '#111827', color: '#f0f4ff', border: '1px solid rgba(201,168,76,0.3)' }}>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
