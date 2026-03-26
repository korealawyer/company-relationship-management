'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Phone, Check, ChevronDown, ChevronUp,
  Edit3, MessageSquare, Clock, Mic, Square, User,
} from 'lucide-react';
import { formatDuration, type CallRecording } from '@/lib/callRecordingService';
import { type Company } from '@/lib/store';

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

function cleanPhone(raw: string) { return raw.replace(/[^0-9+]/g, ''); }
function fmtTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '00')}`;
}

export interface RecordPanelProps {
  selected: Company;
  isRecording: boolean;
  elapsed: number;
  waveformData: number[];
  callResult: 'connected' | 'no_answer' | 'callback';
  setCallResult: (v: 'connected' | 'no_answer' | 'callback') => void;
  quickMemo: string;
  setQuickMemo: (v: string) => void;
  showQuickMemo: boolean;
  setShowQuickMemo: (v: boolean) => void;
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;
  companyRecordings: CallRecording[];
  onStart: () => void;
  onStop: () => void;
  getPhoneList: (co: Company) => { label: string; phone: string; isPrimary: boolean }[];
}

export default function RecordPanel({
  selected,
  isRecording,
  elapsed,
  waveformData,
  callResult,
  setCallResult,
  quickMemo,
  setQuickMemo,
  showQuickMemo,
  setShowQuickMemo,
  showHistory,
  setShowHistory,
  companyRecordings,
  onStart,
  onStop,
  getPhoneList,
}: RecordPanelProps) {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* 기업 정보 카드 */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: '20px 24px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: C.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Building2 style={{ width: 26, height: 26, color: C.text3 }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selected.name}</h2>
              {selected.storeCount > 0 && (
                <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: C.divider, color: C.text3, fontWeight: 500 }}>
                  {selected.storeCount.toLocaleString()}개점
                </span>
              )}
            </div>
            {selected.biz && <p style={{ fontSize: 13, color: C.text3, margin: '4px 0 0' }}>{selected.biz}</p>}
          </div>
          {selected.contactName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: C.divider }}>
              <User style={{ width: 14, height: 14, color: C.text3 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: C.text2 }}>{selected.contactName}</span>
            </div>
          )}
        </div>
      </div>

      {/* 두 컬럼 레이아웃 (PC: 좌/우, 모바일: 상/하) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* 왼쪽: 전화번호 + 통화 결과 + 빠른 메모 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 전화번호 */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text3, margin: '0 0 12px', letterSpacing: '0.05em' }}>전화번호</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {getPhoneList(selected).map((p, i) => (
                <a key={i} href={`tel:${cleanPhone(p.phone)}`}
                  onClick={() => setCallResult('connected')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10, textDecoration: 'none',
                    background: p.isPrimary ? C.greenBg : C.divider,
                    border: `1px solid ${p.isPrimary ? C.greenLight : C.border}`,
                  }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: p.isPrimary ? C.green : C.text3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Phone style={{ width: 15, height: 15, color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: p.isPrimary ? C.green : C.text3, margin: 0, fontWeight: 500 }}>{p.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 600, color: C.text1, margin: '2px 0 0', fontFamily: 'monospace' }}>{p.phone}</p>
                  </div>
                  <span style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: p.isPrimary ? C.green : C.text2, color: '#fff',
                  }}>📞 전화</span>
                </a>
              ))}
              {getPhoneList(selected).length === 0 && (
                <p style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: C.text4, margin: 0 }}>등록된 전화번호가 없습니다</p>
              )}
            </div>
          </div>

          {/* 통화 결과 */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text3, margin: '0 0 12px', letterSpacing: '0.05em' }}>통화 결과</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {([
                { k: 'connected' as const, l: '연결됨', color: C.green, bg: C.greenBg },
                { k: 'no_answer' as const, l: '부재중', color: C.amber, bg: C.amberBg },
                { k: 'callback' as const, l: '콜백예정', color: C.primary, bg: C.primaryBg },
              ]).map(r => (
                <button key={r.k} onClick={() => setCallResult(r.k)} style={{
                  padding: '12px 0', border: `1.5px solid ${callResult === r.k ? r.color : C.border}`,
                  borderRadius: 10, cursor: 'pointer',
                  background: callResult === r.k ? r.bg : C.surface,
                  color: callResult === r.k ? r.color : C.text3,
                  fontSize: 13, fontWeight: callResult === r.k ? 700 : 400,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all 0.15s',
                }}>
                  {callResult === r.k && <Check style={{ width: 14, height: 14 }} />}
                  {r.l}
                </button>
              ))}
            </div>
          </div>

          {/* 빠른 메모 */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <button onClick={() => setShowQuickMemo(!showQuickMemo)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              <Edit3 style={{ width: 16, height: 16, color: showQuickMemo ? C.primary : C.text3 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: showQuickMemo ? C.primary : C.text3 }}>
                빠른 메모 {quickMemo && '✓'}
              </span>
              {showQuickMemo
                ? <ChevronUp style={{ width: 14, height: 14, marginLeft: 'auto', color: C.text4 }} />
                : <ChevronDown style={{ width: 14, height: 14, marginLeft: 'auto', color: C.text4 }} />}
            </button>
            <AnimatePresence>
              {showQuickMemo && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <textarea
                    value={quickMemo} onChange={e => setQuickMemo(e.target.value)}
                    placeholder="통화 핵심 키워드를 메모하세요"
                    rows={3} autoFocus
                    style={{
                      width: '100%', marginTop: 12, padding: '12px', borderRadius: 8, fontSize: 14,
                      resize: 'none', background: C.divider, border: 'none', color: C.text1,
                      outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 이전 상담 메모 */}
          {selected.callNote && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.text3, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.05em' }}>
                <MessageSquare style={{ width: 13, height: 13 }} /> 이전 상담 메모
              </p>
              <p style={{ fontSize: 14, color: C.text2, margin: 0, lineHeight: 1.7 }}>{selected.callNote}</p>
            </div>
          )}
        </div>

        {/* 오른쪽: 녹음 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 녹음 메인 카드 */}
          <div style={{
            background: C.surface, border: `2px solid ${isRecording ? C.red : C.border}`,
            borderRadius: 16, padding: '32px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            transition: 'border-color 0.3s',
          }}>
            {/* 파형 */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, height: 56, marginBottom: 20, width: '100%' }}>
              {waveformData.map((v, i) => (
                <motion.div key={i}
                  style={{
                    width: 4, borderRadius: 2,
                    background: isRecording
                      ? `hsl(${355 - (v / 8)}, 80%, 55%)`
                      : C.border,
                  }}
                  animate={{ height: isRecording ? Math.max(4, v / 4) : 4 }}
                  transition={{ duration: 0.05 }}
                />
              ))}
            </div>

            {/* 타이머 */}
            <div style={{
              fontSize: 52, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: isRecording ? C.red : C.text4,
              letterSpacing: '0.03em', lineHeight: 1,
              marginBottom: 8,
            }}>
              {fmtTime(elapsed)}
            </div>
            <p style={{ fontSize: 14, color: isRecording ? C.red : C.text4, margin: '0 0 28px', fontWeight: isRecording ? 600 : 400 }}>
              {isRecording ? '● 녹음 중' : '녹음 대기'}
            </p>

            {/* 녹음 버튼 */}
            <motion.button
              onClick={isRecording ? onStop : onStart}
              whileTap={{ scale: 0.93 }}
              style={{
                width: 88, height: 88, borderRadius: '50%',
                border: `4px solid ${isRecording ? C.red + '30' : C.border}`,
                cursor: 'pointer',
                background: isRecording
                  ? 'linear-gradient(135deg, #DC2626, #EF4444)'
                  : 'linear-gradient(135deg, #DC2626, #EF4444)',
                boxShadow: isRecording ? '0 0 0 12px rgba(220,38,38,0.12)' : '0 4px 16px rgba(220,38,38,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
            >
              {isRecording && (
                <motion.div
                  style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2px solid ${C.red}30` }}
                  animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.3 }}
                />
              )}
              {isRecording
                ? <Square style={{ width: 28, height: 28, color: '#fff', fill: '#fff' }} />
                : <Mic style={{ width: 34, height: 34, color: '#fff' }} />}
            </motion.button>

            <p style={{ fontSize: 13, color: C.text3, marginTop: 18, textAlign: 'center' }}>
              {isRecording ? '버튼을 클릭하면 녹음이 종료됩니다' : '버튼을 클릭하면 녹음이 시작됩니다'}
            </p>
          </div>

          {/* 이전 녹음 내역 아코디언 */}
          {companyRecordings.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <button onClick={() => setShowHistory(!showHistory)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
                <Clock style={{ width: 15, height: 15, color: C.text3 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text2 }}>이전 녹음 {companyRecordings.length}건</span>
                {showHistory
                  ? <ChevronUp style={{ width: 14, height: 14, marginLeft: 'auto', color: C.text4 }} />
                  : <ChevronDown style={{ width: 14, height: 14, marginLeft: 'auto', color: C.text4 }} />}
              </button>
              <AnimatePresence>
                {showHistory && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {companyRecordings.slice(0, 5).map(rec => (
                        <div key={rec.id} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '10px 12px', borderRadius: 10, background: C.divider,
                        }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                            background: rec.sttStatus === 'completed' ? C.green : C.amber,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: C.text2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {rec.transcriptSummary || rec.transcript?.slice(0, 50) || '변환 중…'}
                            </p>
                            <p style={{ fontSize: 11, color: C.text4, margin: '3px 0 0' }}>
                              {new Date(rec.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              {' · '}{formatDuration(rec.durationSeconds)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
