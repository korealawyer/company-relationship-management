import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function CloseModal({ ids, onClose, onConfirm }: { ids: string[]; onClose: () => void; onConfirm: (reason: string) => void }) {
    const [reason, setReason] = useState('');
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md rounded-2xl p-6"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <h3 className="font-black text-lg mb-4" style={{ color: '#1e293b' }}>📦 사건 종결 처리 ({ids.length}건)</h3>
                <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>종결 사유</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="종결 사유를 입력하세요..."
                    className="w-full px-3 py-2 rounded-lg text-sm resize-none mb-4"
                    style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-bold"
                        style={{ background: '#f1f5f9', color: '#64748b' }}>취소</button>
                    <button onClick={() => reason.trim() && onConfirm(reason)} className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
                        style={{ background: reason.trim() ? '#16a34a' : '#94a3b8' }}>종결 처리</button>
                </div>
            </motion.div>
        </motion.div>
    );
}
