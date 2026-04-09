'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Scale, Brain, Briefcase, ArrowRight } from 'lucide-react';
import { getPromptConfig } from '@/lib/prompts/privacy';

interface Message { role: 'user' | 'assistant'; content: string; }

const CONSULT_TYPES = [
    { id: 'legal', icon: Scale, label: '법률 상담', color: '#b8860b', bg: '#fef3c7', desc: '계약·가맹·노동·형사' },
    // { id: 'eap', icon: Brain, label: '심리/EAP', color: '#7c3aed', bg: '#ede9fe', desc: '스트레스·감정·위기' },
    // { id: 'business', icon: Briefcase, label: '경영 자문', color: '#059669', bg: '#d1fae5', desc: '노무·공정거래·내규' },
];

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [consultType, setConsultType] = useState('general');
    const [step, setStep] = useState<'select' | 'chat'>('select');
    const [caseId, setCaseId] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        setCaseId(`IBS-${new Date().getFullYear()}-${String(Math.random()).slice(2, 8)}`);
    }, []);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const selectType = async (type: string) => {
        setConsultType(type);
        setStep('chat');
        setMessages([
            { role: 'assistant', content: '안녕하세요. IBS법률사무소 파트너입니다. 궁금한 점이나 법률적인 상담이 필요하시면 언제든지 말씀해 주세요. 빠르게 정리후 변호사님과 상담을 받을 수 있도록 도와 드리겠습니다.' }
        ]);
        
        setLoading(true);
        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: '명확한 상담을 위해 먼저 여쭙겠습니다. 현재 어떤 종류의 법률 문제를 겪고 계신가요? (예: 형사, 민사, 가사)' }
            ]);
            setLoading(false);
        }, 1000);
    };

    const send = async () => {
        if (!input.trim() || loading) return;
        const userMsg: Message = { role: 'user', content: input };
        const newMsgs = [...messages, userMsg];
        setMessages(newMsgs);
        setInput('');
        setLoading(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ 
                    messages: newMsgs, 
                    consultType,
                    systemPrompt: getPromptConfig().chatSystemPrompt 
                }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
            if (data.isSummary) {
                try {
                    await fetch('/api/chat/save', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ 
                            messages: newMsgs, 
                            summaryData: data.summaryData, 
                            caseId, 
                            consultType 
                        })
                    });
                } catch (e) {
                    console.error('Failed to save chat', e);
                }
                setIsFinished(true);
            }
        } catch { setMessages(prev => [...prev, { role: 'assistant', content: '죄송합니다. 일시적 오류가 발생했습니다.' }]); }
        setLoading(false);
    };

    return (
        <div className="min-h-screen pt-20" style={{ background: '#f8f7f4' }}>
            <div className="max-w-3xl mx-auto px-4 pb-8">
                {/* 헤더 */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                        style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                        <Bot className="w-4 h-4" style={{ color: '#92400e' }} />
                        <span className="text-xs font-bold" style={{ color: '#92400e' }}>법률 어시스턴트</span>
                    </div>
                    <h1 className="text-3xl font-black mb-2" style={{ color: '#111827' }}>
                        법률 상담
                    </h1>
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                        접수번호: <span className="font-mono font-bold" style={{ color: '#b8860b' }}>{caseId}</span>
                    </p>
                </motion.div>

                {step === 'select' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
                        <p className="text-center text-sm mb-2 font-medium" style={{ color: '#6b7280' }}>상담 분야를 선택해 주세요</p>
                        {CONSULT_TYPES.map(({ id, icon: Icon, label, color, bg, desc }) => (
                            <motion.button key={id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                                onClick={() => selectType(id)}
                                className="flex items-center gap-5 p-6 rounded-2xl text-left transition-all"
                                style={{ background: '#fff', border: '1px solid #e8e5de', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div className="p-3.5 rounded-xl" style={{ background: bg }}>
                                    <Icon className="w-6 h-6" style={{ color }} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-black text-base" style={{ color: '#111827' }}>{label}</div>
                                    <div className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{desc}</div>
                                </div>
                                <ArrowRight className="w-5 h-5" style={{ color: '#d1d5db' }} />
                            </motion.button>
                        ))}
                        <div className="text-center mt-4">
                            <p className="text-xs" style={{ color: '#9ca3af' }}>
                                🔒 모든 상담 내용은 암호화되어 보관됩니다
                            </p>
                        </div>
                    </motion.div>
                )}

                {step === 'chat' && (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e5de', background: '#fff' }}>
                        {/* 채팅 헤더 */}
                        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #e8e5de', background: '#fafaf8' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#fef3c7' }}>
                                <Bot className="w-4 h-4" style={{ color: '#92400e' }} />
                            </div>
                            <div>
                                <div className="font-bold text-sm" style={{ color: '#111827' }}>IBS 어시스턴트</div>
                                <div className="text-xs flex items-center gap-1" style={{ color: '#16a34a' }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                    온라인
                                </div>
                            </div>
                            <div className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full"
                                style={{ background: '#f3f4f6', color: '#374151' }}>
                                {CONSULT_TYPES.find(t => t.id === consultType)?.label || '일반 상담'}
                            </div>
                        </div>

                        {/* 메시지 목록 */}
                        <div className="h-96 overflow-y-auto p-6 space-y-4" style={{ background: '#fafaf8' }}>
                            <AnimatePresence>
                                {messages.map((msg, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center`}
                                            style={{ background: msg.role === 'user' ? '#fef3c7' : '#ede9fe' }}>
                                            {msg.role === 'user'
                                                ? <User className="w-4 h-4" style={{ color: '#92400e' }} />
                                                : <Bot className="w-4 h-4" style={{ color: '#7c3aed' }} />}
                                        </div>
                                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                                            }`} style={{
                                                background: msg.role === 'user' ? '#111827' : '#fff',
                                                color: msg.role === 'user' ? '#fef3c7' : '#374151',
                                                border: `1px solid ${msg.role === 'user' ? '#111827' : '#e8e5de'}`,
                                            }}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {loading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#ede9fe' }}>
                                            <Bot className="w-4 h-4" style={{ color: '#7c3aed' }} />
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#7c3aed' }} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={bottomRef} />
                        </div>

                        {/* 입력창 */}
                        <div className="p-4" style={{ borderTop: '1px solid #e8e5de' }}>
                            <div className="flex gap-3">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                                    placeholder={isFinished ? "상담 접수가 완료되었습니다." : "메시지를 입력하세요..."}
                                    disabled={isFinished}
                                    className="flex-1 px-4 py-3 rounded-xl text-sm outline-none disabled:bg-gray-200 disabled:cursor-not-allowed"
                                    style={{ background: '#f3f4f6', border: '1px solid #e8e5de', color: '#111827' }}
                                />
                                <button onClick={send} disabled={loading || !input.trim() || isFinished}
                                    className="px-4 py-3 rounded-xl transition-all disabled:opacity-30"
                                    style={{ background: '#111827', color: '#fff' }}>
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-center text-xs mt-3" style={{ color: '#9ca3af' }}>
                                자동 답변은 참고용이며, 최종 법률 판단은 담당 변호사가 제공합니다
                            </p>
                        </div>
                    </div>
                )}

                {/* 안내 박스 */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.4 } }}
                    className="mt-6 p-5 rounded-2xl grid grid-cols-3 gap-4"
                    style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    {[
                        { icon: '⚡', label: '빠른 접수', desc: '24시간 접수' },
                        { icon: '🔒', label: '보안 보장', desc: '암호화 처리' },
                        { icon: '📞', label: '전문가 연결', desc: '48h 내 답변' },
                    ].map(({ icon, label, desc }) => (
                        <div key={label} className="text-center">
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className="text-xs font-bold" style={{ color: '#111827' }}>{label}</div>
                            <div className="text-xs" style={{ color: '#9ca3af' }}>{desc}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
