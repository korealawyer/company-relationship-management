'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Scale, Brain, Briefcase, Phone, CheckCircle2, ArrowRight } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

const CONSULT_TYPES = [
    { id: 'legal', icon: Scale, label: '법률 상담', color: '#c9a84c', desc: '계약·가맹·노동·형사' },
    { id: 'eap', icon: Brain, label: '심리/EAP', color: '#818cf8', desc: '스트레스·감정·위기' },
    { id: 'business', icon: Briefcase, label: '경영 자문', color: '#34d399', desc: '노무·공정거래·내규' },
];

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [consultType, setConsultType] = useState('general');
    const [step, setStep] = useState<'select' | 'chat'>('select');
    const [caseId] = useState(() => `IBS-${new Date().getFullYear()}-${String(Math.random()).slice(2, 8)}`);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const selectType = async (type: string) => {
        setConsultType(type);
        setStep('chat');
        setLoading(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ messages: [], consultType: type }),
            });
            const data = await res.json();
            setMessages([{ role: 'assistant', content: data.message }]);
        } catch { setMessages([{ role: 'assistant', content: '안녕하세요. 어떤 도움이 필요하신가요?' }]); }
        setLoading(false);
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
                body: JSON.stringify({ messages: newMsgs, consultType }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        } catch { setMessages(prev => [...prev, { role: 'assistant', content: '죄송합니다. 일시적 오류가 발생했습니다.' }]); }
        setLoading(false);
    };

    return (
        <div className="min-h-screen pt-20" style={{ background: '#04091a' }}>
            <div className="max-w-3xl mx-auto px-4 pb-8">
                {/* 헤더 */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                        <Bot className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>AI 상담 어시스턴트</span>
                    </div>
                    <h1 className="text-3xl font-black mb-2" style={{ color: '#f0f4ff' }}>
                        법률·심리·경영 통합 상담
                    </h1>
                    <p className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>
                        접수번호: <span style={{ color: '#c9a84c' }}>{caseId}</span>
                    </p>
                </motion.div>

                {step === 'select' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
                        <p className="text-center text-sm mb-2" style={{ color: 'rgba(240,244,255,0.5)' }}>상담 분야를 선택해 주세요</p>
                        {CONSULT_TYPES.map(({ id, icon: Icon, label, color, desc }) => (
                            <motion.button key={id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => selectType(id)}
                                className="flex items-center gap-5 p-6 rounded-2xl text-left transition-all"
                                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)` }}>
                                <div className="p-3 rounded-xl" style={{ background: `${color}20` }}>
                                    <Icon className="w-6 h-6" style={{ color }} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-black" style={{ color: '#f0f4ff' }}>{label}</div>
                                    <div className="text-sm mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>{desc}</div>
                                </div>
                                <ArrowRight className="w-5 h-5" style={{ color: 'rgba(240,244,255,0.3)' }} />
                            </motion.button>
                        ))}
                        <div className="text-center mt-4">
                            <p className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                🔒 모든 상담 내용은 암호화되어 보관됩니다
                            </p>
                        </div>
                    </motion.div>
                )}

                {step === 'chat' && (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(201,168,76,0.15)', background: 'rgba(255,255,255,0.02)' }}>
                        {/* 채팅 헤더 */}
                        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,27,62,0.4)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.15)' }}>
                                <Bot className="w-4 h-4" style={{ color: '#c9a84c' }} />
                            </div>
                            <div>
                                <div className="font-bold text-sm" style={{ color: '#f0f4ff' }}>IBS AI 어시스턴트</div>
                                <div className="text-xs flex items-center gap-1" style={{ color: '#4ade80' }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                                    온라인
                                </div>
                            </div>
                            <div className="ml-auto text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                {CONSULT_TYPES.find(t => t.id === consultType)?.label || '일반 상담'}
                            </div>
                        </div>

                        {/* 메시지 목록 */}
                        <div className="h-96 overflow-y-auto p-6 space-y-4">
                            <AnimatePresence>
                                {messages.map((msg, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-yellow-900/30' : 'bg-indigo-900/30'}`}>
                                            {msg.role === 'user'
                                                ? <User className="w-4 h-4" style={{ color: '#c9a84c' }} />
                                                : <Bot className="w-4 h-4" style={{ color: '#818cf8' }} />}
                                        </div>
                                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                                            }`} style={{
                                                background: msg.role === 'user' ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.05)',
                                                color: msg.role === 'user' ? '#e8c87a' : '#f0f4ff',
                                                border: `1px solid ${msg.role === 'user' ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                            }}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {loading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-900/30 flex items-center justify-center">
                                            <Bot className="w-4 h-4" style={{ color: '#818cf8' }} />
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#818cf8' }} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={bottomRef} />
                        </div>

                        {/* 입력창 */}
                        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex gap-3">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                                    placeholder="메시지를 입력하세요..."
                                    className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}
                                />
                                <button onClick={send} disabled={loading || !input.trim()}
                                    className="px-4 py-3 rounded-xl transition-all disabled:opacity-30"
                                    style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-center text-xs mt-3" style={{ color: 'rgba(240,244,255,0.25)' }}>
                                AI 답변은 참고용이며, 최종 법률 판단은 담당 변호사가 제공합니다
                            </p>
                        </div>
                    </div>
                )}

                {/* 안내 박스 */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.4 } }}
                    className="mt-6 p-5 rounded-2xl grid grid-cols-3 gap-4"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {[
                        { icon: '⚡', label: '빠른 접수', desc: '24시간 접수' },
                        { icon: '🔒', label: '보안 보장', desc: '암호화 처리' },
                        { icon: '📞', label: '전문가 연결', desc: '48h 내 답변' },
                    ].map(({ icon, label, desc }) => (
                        <div key={label} className="text-center">
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className="text-xs font-bold" style={{ color: '#c9a84c' }}>{label}</div>
                            <div className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{desc}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
