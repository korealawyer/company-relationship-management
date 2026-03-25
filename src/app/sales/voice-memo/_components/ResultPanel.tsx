'use client';
import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Check, RefreshCw, MicOff, Sparkles, Mic,
} from 'lucide-react';
import { formatDuration, type CallRecording } from '@/lib/callRecordingService';
import { type Company } from '@/lib/mockStore';

/* ─── 디자인 토큰 (인라인 복사) ─── */
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

/* ─── 통화 결과 뱃지 헬퍼 ─── */
function resultStyle(r: string) {
  if (r === 'connected') return { bg: C.greenBg, color: C.green, label: '✅ 연결됨' };
  if (r === 'callback')  return { bg: C.primaryBg, color: C.primary, label: '📋 콜백예정' };
  return { bg: C.amberBg, color: C.amber, label: '📵 부재중' };
}

export interface ResultPanelProps {
  selected: Company;
  sttStatus: 'idle' | 'processing' | 'completed' | 'failed';
  lastRecording: CallRecording | null;
  callResult: 'connected' | 'no_answer' | 'callback';
  onReRecord: () => void;
  onReset: () => void;
}

export default function ResultPanel({
  selected,
  sttStatus,
  lastRecording,
  callResult,
  onReRecord,
  onReset,
}: ResultPanelProps) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* 상태 표시 */}
      <div style={{ textAlign: 'center', padding: '40px 0 32px' }}>
        {sttStatus === 'processing' && (
          <div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: 56, height: 56, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RefreshCw style={{ width: 36, height: 36, color: C.primary }} />
            </motion.div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text1, margin: '0 0 6px' }}>AI가 내용을 정리하고 있습니다</h2>
            <p style={{ fontSize: 14, color: C.text3, margin: 0 }}>음성을 텍스트로 변환하고 핵심 내용을 요약합니다 (보통 10~30초)</p>
          </div>
        )}
        {sttStatus === 'completed' && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: C.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Check style={{ width: 32, height: 32, color: C.green }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text1, margin: '0 0 6px' }}>메모가 저장되었습니다</h2>
            <p style={{ fontSize: 14, color: C.text3, margin: 0 }}>AI 요약 내용이 CRM에 자동으로 업데이트되었습니다</p>
          </motion.div>
        )}
        {sttStatus === 'failed' && (
          <div>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MicOff style={{ width: 32, height: 32, color: C.red }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text1, margin: '0 0 6px' }}>변환에 실패했습니다</h2>
            <p style={{ fontSize: 14, color: C.text3, margin: 0 }}>다시 시도해 주세요</p>
          </div>
        )}
      </div>

      {/* 결과 카드 */}
      {lastRecording && sttStatus === 'completed' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px', marginBottom: 20 }}
        >
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 style={{ width: 20, height: 20, color: C.text3 }} />
              <span style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(() => { const rs = resultStyle(callResult); return (
                <span style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
                  background: rs.bg, color: rs.color,
                }}>{rs.label}</span>
              ); })()}
              <span style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500,
                background: C.divider, color: C.text3,
              }}>🕐 {formatDuration(lastRecording.durationSeconds)}</span>
            </div>
          </div>

          {/* AI 요약 */}
          {lastRecording.transcriptSummary && (
            <div style={{ padding: '16px 20px', borderRadius: 12, marginBottom: 16, background: C.purpleBg, border: `1px solid ${C.purple}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Sparkles style={{ width: 15, height: 15, color: C.purple }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>AI 요약</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: C.text1, margin: 0 }}>{lastRecording.transcriptSummary}</p>
            </div>
          )}

          {/* 전문 */}
          {lastRecording.transcript && (
            <details>
              <summary style={{ fontSize: 13, fontWeight: 600, color: C.primary, cursor: 'pointer', padding: '8px 0', userSelect: 'none' }}>
                📄 전체 녹취 내용 보기
              </summary>
              <div style={{
                fontSize: 14, lineHeight: 1.75, padding: '16px', borderRadius: 10, marginTop: 8,
                background: C.divider, color: C.text2,
                whiteSpace: 'pre-wrap', fontFamily: 'inherit',
              }}>{lastRecording.transcript}</div>
            </details>
          )}
        </motion.div>
      )}

      {/* 다음 액션 버튼 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button onClick={onReRecord}
          style={{
            padding: '16px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: C.primary, color: '#fff',
            fontSize: 15, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <Mic style={{ width: 18, height: 18 }} /> 추가 녹음
        </button>
        <button onClick={onReset}
          style={{
            padding: '16px 0', borderRadius: 12,
            background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer',
            color: C.text2, fontSize: 15, fontWeight: 500,
          }}>
          다른 기업 선택
        </button>
      </div>
    </div>
  );
}
