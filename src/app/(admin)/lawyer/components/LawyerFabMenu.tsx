import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, UserPlus, Link2 } from 'lucide-react';

export interface LawyerFabMenuProps {
    pendingCount: number;
    onRecordNewClient: () => void;
    onRecordIntakeUrl: () => void;
}

export function LawyerFabMenu({ pendingCount, onRecordNewClient, onRecordIntakeUrl }: LawyerFabMenuProps) {
    const [showFabMenu, setShowFabMenu] = useState(false);

    return (
        <div className="fixed bottom-20 sm:bottom-6 right-5 z-50">
            <AnimatePresence>
                {showFabMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.9 }}
                        className="absolute bottom-16 right-0 w-52 rounded-2xl overflow-hidden"
                        style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #e5e7eb' }}
                    >
                        <div className="px-3 py-2 text-[11px] font-bold" style={{ background: '#f8f9fc', color: '#64748b', borderBottom: '1px solid #e5e7eb' }}>접수 방법 선택</div>
                        <button
                            onClick={() => { onRecordNewClient(); setShowFabMenu(false); }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-green-50 transition-colors"
                            style={{ borderBottom: '1px solid #f1f5f9' }}
                        >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#d1fae5' }}>
                                <UserPlus className="w-4 h-4" style={{ color: '#10b981' }} />
                            </div>
                            <div>
                                <p className="text-sm font-bold" style={{ color: '#1e293b' }}>신규 의뢰인 통화/미팅</p>
                                <p className="text-[10px]" style={{ color: '#94a3b8' }}>녹음 또는 글로 접수</p>
                            </div>
                        </button>
                        <button
                            onClick={() => { onRecordIntakeUrl(); setShowFabMenu(false); }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-amber-50 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#fef3c7' }}>
                                <Link2 className="w-4 h-4" style={{ color: '#f59e0b' }} />
                            </div>
                            <div>
                                <p className="text-sm font-bold" style={{ color: '#1e293b' }}>URL 링크 생성</p>
                                <p className="text-[10px]" style={{ color: '#94a3b8' }}>고객에게 접수 URL 발송</p>
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button
                onClick={() => setShowFabMenu(p => !p)}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(16,185,129,0.5)' }}
                title="신규 의뢰인 접수">
                <Mic className="w-6 h-6 text-white" />
                {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                        style={{ background: '#ef4444', color: '#fff' }}>
                        {pendingCount}
                    </span>
                )}
            </motion.button>
        </div>
    );
}
