import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '@/lib/callPageUtils';
import { Company } from '@/lib/types';

interface CallbackModalProps {
  show: boolean;
  selected: Company | null;
  callbackTime: string;
  setCallbackTime: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CallbackModal({
  show,
  selected,
  callbackTime,
  setCallbackTime,
  onConfirm,
  onClose,
}: CallbackModalProps) {
  return (
    <AnimatePresence>
      {show && selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="rounded-2xl p-6 w-[400px] shadow-xl"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            <h3 className="text-lg font-black mb-1" style={{ color: C.heading }}>📋 콜백 예약</h3>
            <p className="text-xs mb-4" style={{ color: C.sub }}>
              {selected.name} — {selected.contactName || '담당자'}
            </p>
            <input
              type="datetime-local"
              value={callbackTime}
              onChange={(e) => setCallbackTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm mb-4"
              style={{
                background: '#f8fafc',
                border: `1px solid ${C.border}`,
                color: C.body,
                outline: 'none',
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: '#f8f9fc', color: C.sub, border: `1px solid ${C.border}` }}
              >
                취소
              </button>
              <button
                onClick={onConfirm}
                disabled={!callbackTime}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={{
                  background: callbackTime ? '#eef2ff' : '#f8f9fc',
                  color: callbackTime ? '#4f46e5' : C.muted,
                  border: `1px solid ${callbackTime ? '#c7d2fe' : C.border}`,
                }}
              >
                예약 확정
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
