'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

/* ─── 디자인 토큰 ─── */
const C = {
  bg:       '#F0F2F5',
  surface:  '#FFFFFF',
  card:     '#FFFFFF',
  border:   '#E1E4E8',
  divider:  '#F0F2F5',

  text1:    '#111827',
  text2:    '#374151',
  text3:    '#6B7280',
  text4:    '#9CA3AF',

  primary:   '#2563EB',
  primaryBg: '#EFF6FF',
  primaryLight: '#BFDBFE',

  green:   '#059669',
  greenBg: '#ECFDF5',
  greenLight: '#A7F3D0',

  red:   '#DC2626',
  redBg: '#FEF2F2',

  amber:   '#D97706',
  amberBg: '#FFFBEB',

  purple:   '#7C3AED',
  purpleBg: '#F5F3FF',
};

interface ToastNotificationProps {
  toast: string;
  showInstallBanner: boolean;
  onInstall: () => void;
  onDismissBanner: () => void;
}

export default function ToastNotification({
  toast,
  showInstallBanner,
  onInstall,
  onDismissBanner,
}: ToastNotificationProps) {
  return (
    <>
      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
              zIndex: 50, padding: '10px 20px', borderRadius: 24, fontSize: 14, fontWeight: 600,
              background: C.text1, color: '#fff', whiteSpace: 'nowrap',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >{toast}</motion.div>
        )}
      </AnimatePresence>

      {/* PWA 배너 */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{
              margin: '12px 24px 0', padding: '12px 16px', borderRadius: 12,
              background: C.primaryBg, border: `1px solid ${C.primaryLight}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
            <Download style={{ width: 18, height: 18, color: C.primary, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text1, margin: 0 }}>홈 화면에 추가</p>
              <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>앱처럼 빠르게 메모를 기록하세요</p>
            </div>
            <button onClick={onInstall} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: C.primary, color: '#fff', border: 'none', cursor: 'pointer',
            }}>설치</button>
            <button onClick={onDismissBanner} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text4 }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
