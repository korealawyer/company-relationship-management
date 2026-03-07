'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Phone, ChevronRight, Send, Loader2 } from 'lucide-react';

const faqs = [
    { q: '무료 검토는 어떻게 받나요?', a: '' },
    { q: '개인정보처리방침 위반 시 벌금은?', a: '' },
    { q: '분석에 얼마나 걸리나요?', a: '' },
    { q: '구독 취소는 언제든 가능한가요?', a: '' },
];

// 내부 업무 경로 — 챗봇 미노출
const INTERNAL_PATHS = ['/admin', '/lawyer', '/employee', '/counselor', '/litigation'];

export default function FloatingChatbot() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([
        { role: 'bot', text: '안녕하세요! 법무법인 임팩트입니다 ⚖️\n무엇이 궁금하신가요? 아래 자주 묻는 질문을 클릭하거나, 직접 입력해 주세요.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // 스크롤 하단 유지 — hooks는 반드시 조건 return 전에 호출
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // 내부 업무 경로에서는 챗봇 미노출
    if (INTERNAL_PATHS.some(p => pathname?.startsWith(p))) return null;

    // A2: API 호출로 AI 응답 받기
    const callChat = async (userText: string) => {
        setLoading(true);
        try {
            const chatHistory = [
                ...messages.filter(m => m.role === 'user').map(m => ({ role: 'user' as const, content: m.text })),
                { role: 'user' as const, content: userText },
            ];
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory, consultType: 'general' }),
            });

            if (res.status === 401) {
                setMessages(prev => [...prev, { role: 'bot', text: '🔒 로그인 후 AI 상담을 이용하실 수 있습니다.\n오른쪽 상단의 로그인 버튼을 눌러주세요!' }]);
                return;
            }

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'bot', text: data.message || '죄송합니다, 응답을 생성하지 못했습니다.' }]);
        } catch {
            setMessages(prev => [...prev, { role: 'bot', text: '네트워크 오류가 발생했습니다. 아래 버튼으로 전문 상담원에게 직접 연결해 주세요.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleFaq = (faq: typeof faqs[number]) => {
        setMessages(prev => [...prev, { role: 'user', text: faq.q }]);
        callChat(faq.q);
    };

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        callChat(userMsg);
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setOpen(!open)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #e8c87a, #c9a84c)', boxShadow: '0 8px 30px rgba(201,168,76,0.5)' }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                animate={open ? {} : {
                    boxShadow: ['0 8px 30px rgba(201,168,76,0.5)', '0 8px 40px rgba(201,168,76,0.8)', '0 8px 30px rgba(201,168,76,0.5)'],
                }}
                transition={open ? {} : { duration: 2.5, repeat: Infinity }}
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <X className="w-6 h-6 text-[#04091a]" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <MessageCircle className="w-6 h-6 text-[#04091a]" strokeWidth={2.5} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="fixed bottom-24 right-6 z-50 w-[340px] rounded-2xl overflow-hidden flex flex-col"
                        style={{
                            background: 'rgba(13,27,62,0.98)',
                            border: '1px solid rgba(201,168,76,0.3)',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                            maxHeight: '520px',
                        }}
                    >
                        {/* Header */}
                        <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(201,168,76,0.12)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)' }}>
                                <span className="text-[#04091a] font-black text-sm">IM</span>
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white">임팩트 AI 어시스턴트</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-xs" style={{ color: 'rgba(240,244,255,0.5)' }}>AI 온라인</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '300px' }}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                                        style={msg.role === 'user' ? {
                                            background: 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                            color: '#04091a',
                                            fontWeight: 600,
                                        } : {
                                            background: 'rgba(255,255,255,0.07)',
                                            color: 'rgba(240,244,255,0.9)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#c9a84c' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* FAQ Chips */}
                        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                            {faqs.map((faq, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleFaq(faq)}
                                    disabled={loading}
                                    className="text-xs px-2.5 py-1 rounded-full transition-all hover:opacity-100 disabled:opacity-40"
                                    style={{
                                        background: 'rgba(201,168,76,0.12)',
                                        border: '1px solid rgba(201,168,76,0.25)',
                                        color: 'rgba(201,168,76,0.8)',
                                    }}
                                >
                                    {faq.q.slice(0, 16)}...
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-3 flex gap-2" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                                placeholder="질문을 입력하세요..."
                                disabled={loading}
                                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(201,168,76,0.2)',
                                    color: 'rgba(240,244,255,0.9)',
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80 btn-gold disabled:opacity-30"
                            >
                                <Send className="w-4 h-4 text-[#04091a]" />
                            </button>
                        </div>

                        {/* Connect to agent */}
                        <button
                            className="mx-3 mb-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                            style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}
                            onClick={() => window.open('tel:025551234')}
                        >
                            <Phone className="w-4 h-4" />
                            전문 상담원 연결 (02-555-1234)
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
