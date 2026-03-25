'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { smsLogStore, type SmsLogEntry } from '@/lib/mockStore';
import { sendSMS, SMS_TEMPLATES, type SmsTemplate } from '@/lib/smsService';

export default function SmsTab() {
    const [recipients, setRecipients] = useState('');
    const [message, setMessage] = useState('');
    const [smsType, setSmsType] = useState<'SMS' | 'LMS' | 'MMS'>('LMS');
    const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
    const [logs, setLogs] = useState<SmsLogEntry[]>([]);
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState('');
    const [viewMode, setViewMode] = useState<'compose' | 'history'>('compose');

    useEffect(() => { setLogs(smsLogStore.getAll()); }, []);

    const handleTemplateSelect = (tpl: SmsTemplate) => {
        setSelectedTemplate(tpl);
        setMessage(tpl.content);
    };

    const handleSend = async () => {
        if (!recipients.trim() || !message.trim()) return;
        setSending(true);
        const toList = recipients.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
        const result = await sendSMS({ to: toList, message, type: smsType, senderName: '김수현 변호사' });
        setLogs(smsLogStore.getAll());
        setSending(false);
        setToast(`✅ ${result.sentCount}건 발송 완료${result.failedCount > 0 ? ` (실패 ${result.failedCount}건)` : ''}`);
        setTimeout(() => setToast(''), 3000);
        setRecipients('');
        setMessage('');
        setSelectedTemplate(null);
    };

    return (
        <div className="h-full overflow-y-auto p-4 sm:p-6" style={{ background: '#f8f9fc' }}>
            {/* 뷰 전환 */}
            <div className="flex gap-2 mb-5">
                {[{ id: 'compose' as const, label: '📝 문자 작성' }, { id: 'history' as const, label: '📋 발송 이력' }].map(v => (
                    <button key={v.id} onClick={() => setViewMode(v.id)}
                        className="px-4 py-2 rounded-xl text-sm font-bold"
                        style={{ background: viewMode === v.id ? '#1e293b' : '#ffffff', color: viewMode === v.id ? '#ffffff' : '#64748b', border: `1px solid ${viewMode === v.id ? '#1e293b' : '#e2e8f0'}` }}>
                        {v.label}
                    </button>
                ))}
            </div>

            {viewMode === 'compose' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* 좌측: 작성 */}
                    <div className="space-y-4">
                        {/* 수신번호 */}
                        <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                            <label className="text-xs font-bold mb-2 block" style={{ color: '#b8960a' }}>📱 수신번호 (콤마·줄바꿈 구분, 최대 500건)</label>
                            <textarea value={recipients} onChange={e => setRecipients(e.target.value)} rows={3}
                                placeholder="010-1234-5678, 010-9876-5432\n또는 줄바꿈으로 구분"
                                className="w-full p-3 rounded-xl text-sm resize-none outline-none"
                                style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                            <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>
                                입력된 수신자: {recipients.split(/[,;\n]/).filter(s => s.trim()).length}명
                            </p>
                        </div>

                        {/* 발송 유형 */}
                        <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                            <label className="text-xs font-bold mb-2 block" style={{ color: '#b8960a' }}>📨 발송 유형</label>
                            <div className="flex gap-2">
                                {(['SMS', 'LMS', 'MMS'] as const).map(t => (
                                    <button key={t} onClick={() => setSmsType(t)}
                                        className="px-4 py-2 rounded-lg text-xs font-bold"
                                        style={{ background: smsType === t ? '#1e293b' : '#f1f5f9', color: smsType === t ? '#fff' : '#64748b', border: `1px solid ${smsType === t ? '#1e293b' : '#e2e8f0'}` }}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 상용 템플릿 */}
                        <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                            <label className="text-xs font-bold mb-2 block" style={{ color: '#b8960a' }}>📋 상용 문구 템플릿</label>
                            <div className="grid grid-cols-2 gap-2">
                                {SMS_TEMPLATES.map(tpl => (
                                    <button key={tpl.id} onClick={() => handleTemplateSelect(tpl)}
                                        className="p-3 rounded-xl text-left"
                                        style={{ background: selectedTemplate?.id === tpl.id ? '#fffbeb' : '#f8f9fc', border: `1px solid ${selectedTemplate?.id === tpl.id ? '#fde68a' : '#e2e8f0'}` }}>
                                        <p className="text-xs font-bold" style={{ color: '#1e293b' }}>{tpl.name}</p>
                                        <p className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>{tpl.category}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 우측: 메시지 편집 + 미리보기 */}
                    <div className="space-y-4">
                        <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                            <label className="text-xs font-bold mb-2 block" style={{ color: '#b8960a' }}>✏️ 메시지 내용</label>
                            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={10}
                                placeholder="메시지를 입력하세요..."
                                className="w-full p-3 rounded-xl text-sm resize-none outline-none"
                                style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b', lineHeight: 1.7 }} />
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px]" style={{ color: '#94a3b8' }}>{message.length}자 / {smsType === 'SMS' ? '90바이트' : smsType === 'LMS' ? '2,000자' : '2,000자+이미지'}</span>
                            </div>
                        </div>

                        {/* 미리보기 */}
                        {message && (
                            <div className="rounded-xl p-4" style={{ background: '#1e293b' }}>
                                <p className="text-[10px] font-bold mb-2" style={{ color: '#94a3b8' }}>📱 미리보기</p>
                                <div className="rounded-xl p-4" style={{ background: '#ffffff' }}>
                                    <pre className="text-xs whitespace-pre-wrap" style={{ color: '#1e293b', fontFamily: 'inherit', lineHeight: 1.6 }}>{message}</pre>
                                </div>
                            </div>
                        )}

                        {/* 발송 버튼 */}
                        <button onClick={handleSend} disabled={sending || !recipients.trim() || !message.trim()}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#78350f' }}>
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {sending ? '발송 중...' : '문자 발송'}
                        </button>
                    </div>
                </div>
            ) : (
                /* 발송 이력 */
                <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                    <div className="hidden sm:grid px-4 py-2.5 text-[10px] font-bold"
                        style={{ gridTemplateColumns: '100px 120px 1fr 80px 80px', borderBottom: '1px solid #f1f5f9', background: '#f8f9fc', color: '#64748b' }}>
                        <span>발송일</span><span>수신번호</span><span>내용</span><span>유형</span><span>상태</span>
                    </div>
                    {logs.length === 0 ? (
                        <div className="text-center py-16">
                            <Send className="w-10 h-10 mx-auto mb-3" style={{ color: '#94a3b8', opacity: 0.3 }} />
                            <p className="text-sm font-bold" style={{ color: '#94a3b8' }}>발송 이력이 없습니다</p>
                        </div>
                    ) : logs.map(l => (
                        <div key={l.id} className="px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <div className="hidden sm:grid items-center" style={{ gridTemplateColumns: '100px 120px 1fr 80px 80px' }}>
                                <span className="text-xs" style={{ color: '#64748b' }}>{new Date(l.sentAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="text-xs font-bold" style={{ color: '#1e293b' }}>{l.to}</span>
                                <span className="text-xs truncate" style={{ color: '#64748b' }}>{l.message.slice(0, 50)}...</span>
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold w-fit" style={{ background: '#eff6ff', color: '#2563eb' }}>{l.type}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold w-fit" style={{ background: l.status === 'sent' ? '#dcfce7' : '#fef2f2', color: l.status === 'sent' ? '#16a34a' : '#dc2626' }}>{l.status === 'sent' ? '성공' : '실패'}</span>
                            </div>
                            <div className="sm:hidden">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs font-bold" style={{ color: '#1e293b' }}>{l.to}</span>
                                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>{new Date(l.sentAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <p className="text-xs truncate" style={{ color: '#64748b' }}>{l.message.slice(0, 40)}...</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#eff6ff', color: '#2563eb' }}>{l.type}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: l.status === 'sent' ? '#dcfce7' : '#fef2f2', color: l.status === 'sent' ? '#16a34a' : '#dc2626' }}>{l.status === 'sent' ? '성공' : '실패'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-bold z-50"
                        style={{ background: '#111827', color: '#f0f4ff', border: '1px solid rgba(201,168,76,0.3)' }}>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
