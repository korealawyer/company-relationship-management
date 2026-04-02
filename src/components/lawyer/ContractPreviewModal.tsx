'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, X, AlertCircle, Send } from 'lucide-react';
import { C } from '@/lib/callPageUtils';
import { Company } from '@/lib/types';
import { AutoSignatureService } from '@/lib/salesAutomation';
import { useCompanies } from '@/hooks/useDataLayer';
import { renderContractEmailTemplateHtml } from '@/lib/emailTemplates';

/* ─────────────────────────────────────────
   Props
───────────────────────────────────────── */
interface ContractPreviewModalProps {
  company: Company;
  setContractPreviewTarget: (v: Company | null) => void;
  onRefresh: () => void;
  setToast: (s: string) => void;
}

/* ─────────────────────────────────────────
   ContractPreviewModal (default export)
───────────────────────────────────────── */
export default function ContractPreviewModal({
  company,
  setContractPreviewTarget,
  onRefresh,
  setToast,
}: ContractPreviewModalProps) {
  const { updateCompany } = useCompanies();
  /* ── 계약서 발송 핸들러 ── */
  const onSend = () => {
    updateCompany(company.id, { status: 'contract_sent' });
    AutoSignatureService.watchForSignature(company);
    setToast(`${company.name} 계약서 발송 완료 — 서명 자동 감지 시작`);
    setContractPreviewTarget(null);
    onRefresh();
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="contract-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setContractPreviewTarget(null)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(3px)',
          zIndex: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Modal card */}
        <motion.div
          key="contract-modal"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: C.surface,
            borderRadius: 16,
            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
            width: '100%',
            maxWidth: 620,
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '18px 22px',
            borderBottom: `1px solid ${C.borderLight}`,
            background: C.elevated,
          }}>
            <FileSignature size={20} color={C.accent} />
            <span style={{ fontSize: 15, fontWeight: 700, color: C.heading, flex: 1 }}>
              계약서 미리보기
            </span>
            <button
              onClick={() => setContractPreviewTarget(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 4, borderRadius: 6, color: C.muted,
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Company info badge ── */}
          <div style={{
            padding: '12px 22px',
            borderBottom: `1px solid ${C.borderLight}`,
            background: '#f0f4ff',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={15} color={C.accent} />
            <span style={{ fontSize: 13, color: C.accent, fontWeight: 600 }}>
              {company.name}
            </span>
            <span style={{ fontSize: 12, color: C.sub }}>
              · {company.assignedLawyer || '담당 변호사 미배정'} · 이메일 발송 예정
            </span>
          </div>

          {/* ── Contract body ── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: '#f8fafc',
          }}>
            <div dangerouslySetInnerHTML={{ __html: renderContractEmailTemplateHtml(company, 'standard') }} />
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: '14px 22px',
            borderTop: `1px solid ${C.borderLight}`,
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            background: C.elevated,
          }}>
            <button
              onClick={() => setContractPreviewTarget(null)}
              style={{
                padding: '8px 18px', borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.body, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              닫기
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onSend}
              style={{
                padding: '8px 20px', borderRadius: 8,
                border: 'none', background: C.accent,
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Send size={14} />
              계약서 발송
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
