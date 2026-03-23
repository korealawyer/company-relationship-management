'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { getSession } from '@/lib/auth';

function playNotificationSound() {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const playDing = (freq: number, startTime: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
            osc.start(ctx.currentTime + startTime);
            gain.gain.setValueAtTime(0.5, ctx.currentTime + startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + 0.5);
            osc.stop(ctx.currentTime + startTime + 0.5);
        };
        
        playDing(880, 0); // A5
        playDing(1108.73, 0.15); // C#6
    } catch (e) {
        console.warn('Audio play failed', e);
    }
}

export default function RealtimeNotification() {
    const [toast, setToast] = useState<{name: string, contact: string, question: string} | null>(null);

    useEffect(() => {
        const handleNewLead = (e: any) => {
            const user = getSession();
            // 영업팀, 관리자만 알림을 받음
            if (user && ['super_admin', 'admin', 'sales'].includes(user.role)) {
                setToast(e.detail);
                playNotificationSound();
                setTimeout(() => setToast(null), 8000); // 8초 뒤 닫힘
            }
        };
        window.addEventListener('new-crm-lead', handleNewLead as EventListener);
        return () => window.removeEventListener('new-crm-lead', handleNewLead as EventListener);
    }, []);

    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    className="fixed top-24 right-6 z-[99999] w-80 p-4 rounded-2xl shadow-2xl flex items-start gap-3 cursor-pointer"
                    style={{ background: 'rgba(13,27,62,0.95)', border: '1px solid rgba(201,168,76,0.6)', backdropFilter: 'blur(10px)' }}
                    onClick={() => setToast(null)}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(201,168,76,0.2)' }}>
                        <Bell className="w-5 h-5" style={{ color: '#e8c87a' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-white">🚨 챗봇 신규 리드</span>
                            <span className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>방금 전</span>
                        </div>
                        <p className="text-xs font-semibold" style={{ color: '#e8c87a' }}>연락처: {toast.contact}</p>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'rgba(240,244,255,0.7)' }}>{toast.question}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setToast(null); }} className="text-white/50 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
