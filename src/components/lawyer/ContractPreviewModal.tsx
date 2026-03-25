'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, X, AlertCircle, Send } from 'lucide-react';
import { C } from '@/lib/callPageUtils';
import { Company, store } from '@/lib/mockStore';
import { AutoSignatureService } from '@/lib/salesAutomation';

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
  /* ── 계약서 발송 핸들러 ── */
  const onSend = () => {
    store.sendContract(company.id, 'email');
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
            padding: '24px 28px',
            fontSize: 13,
            color: C.body,
            lineHeight: 1.75,
          }}>
            <p style={{ fontSize: 17, fontWeight: 700, textAlign: 'center', marginBottom: 24, color: C.heading }}>
              법률 자문 서비스 이용 계약서
            </p>

            <p style={{ marginBottom: 16 }}>
              <strong>위탁인(이하 "갑"):</strong> {company.name}<br />
              <strong>수탁인(이하 "을"):</strong> IBS 법률사무소 (대표변호사 홍길동)
            </p>

            <p style={{ marginBottom: 6, fontWeight: 600 }}>제1조 (목적)</p>
            <p style={{ marginBottom: 16 }}>
              본 계약은 갑이 을에게 개인정보보호법 관련 법률 자문 및 처리방침 수정 업무를 위탁하고,
              을이 이를 성실히 수행함에 있어 필요한 제반 사항을 규정함을 목적으로 한다.
            </p>

            <p style={{ marginBottom: 6, fontWeight: 600 }}>제2조 (자문 범위)</p>
            <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
              <li>개인정보처리방침 법적 적합성 검토 및 수정 의견서 제공</li>
              <li>관련 법령 위반 리스크 분석 및 개선 권고</li>
              <li>규제기관 제출용 문서 검토 지원</li>
              <li>월 1회 정기 자문 보고서 제공</li>
            </ul>

            <p style={{ marginBottom: 6, fontWeight: 600 }}>제3조 (계약 기간)</p>
            <p style={{ marginBottom: 16 }}>
              계약 체결일로부터 12개월 (자동 갱신 조항 적용, 해지 의사통보 시 30일 전 서면 통보 필요)
            </p>

            <p style={{ marginBottom: 6, fontWeight: 600 }}>제4조 (자문 수수료)</p>
            <p style={{ marginBottom: 16 }}>
              월 자문료는 선택 플랜에 따라 결정되며, 매월 1일 자동 청구됩니다.
              미납 시 서비스가 일시 중단될 수 있습니다.
            </p>

            <p style={{ marginBottom: 6, fontWeight: 600 }}>제5조 (비밀유지)</p>
            <p style={{ marginBottom: 16 }}>
              을은 본 계약 이행 과정에서 취득한 갑의 영업상·법적 비밀을 계약 종료 후 3년간 엄격히 비밀로 유지한다.
            </p>

            <p style={{ marginBottom: 6, fontWeight: 600 }}>제6조 (분쟁 해결)</p>
            <p style={{ marginBottom: 16 }}>
              본 계약으로 인한 분쟁은 서울중앙지방법원을 제1심 관할법원으로 한다.
            </p>

            <div style={{
              marginTop: 32,
              padding: 16,
              background: C.elevated,
              borderRadius: 10,
              border: `1px solid ${C.borderLight}`,
              fontSize: 12,
              color: C.sub,
            }}>
              ※ 본 계약서는 전자서명법 제3조에 따라 전자서명으로 효력이 발생합니다.<br />
              ※ 이메일 발송 후 수신인의 전자서명 완료 시 계약이 성립됩니다.<br />
              ※ 문의: legal@ibslaw.co.kr | 02-000-0000
            </div>
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
