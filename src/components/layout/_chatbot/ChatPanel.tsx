'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Phone, Clock, ChevronRight } from 'lucide-react';
import { Step, Message, STEP_PROGRESS } from './chatbot.constants';
import { faqs } from './chatbot.data'; // ← faqs 타입 참조용

interface ChatPanelProps {
  panelRef: React.RefObject<HTMLDivElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  messages: Message[];
  loading: boolean;
  step: Step;
  savedContact: string;
  customerName: string;
  savedQuestion: string;
  countdown: number | null;
  maxPanelHeight: string;
  bannerContent: { icon: string; text: string; color: string; borderColor: string; textColor: string } | null;
  contactError: string;
  faqs: Array<{ q: string; keyword: string }>;
  TIME_OPTIONS: string[];
  IBS_PHONE: string;
  IBS_PHONE_DISPLAY: string;
  STEP_PROGRESS: Record<Step, number>;
  handleReset: () => void;
  handleFaq: (faq: { q: string; keyword: string }) => void;
  askForContact: (name: string) => void;
  finishLead: (time: string, contact: string, name: string, question: string) => void;
  addUserMsg: (text: string) => void;
  setOpen: (v: boolean) => void;
  children?: React.ReactNode;
}

export default function ChatPanel(props: ChatPanelProps) {
  const {
    panelRef,
    bottomRef,
    open,
    messages,
    loading,
    step,
    savedContact,
    customerName,
    savedQuestion,
    countdown,
    maxPanelHeight,
    bannerContent,
    contactError,
    faqs: faqList,
    TIME_OPTIONS,
    IBS_PHONE,
    IBS_PHONE_DISPLAY,
    STEP_PROGRESS: stepProgress,
    handleReset,
    handleFaq,
    askForContact,
    finishLead,
    addUserMsg,
    setOpen,
    children,
  } = props;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label="IBS 법무 상담 챗봇"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-28 right-4 sm:right-8 z-50 w-[calc(100vw-32px)] sm:w-[380px] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          style={{
            background: 'rgba(13,27,62,0.98)',
            border: '1px solid rgba(201,168,76,0.3)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            maxHeight: maxPanelHeight,
          }}
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center gap-3" style={{ background: 'rgba(201,168,76,0.12)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)' }}>
              <span className="text-[#04091a] font-black text-sm">IBS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white">IBS 어시스턴트</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                <span className="text-xs" style={{ color: 'rgba(240,244,255,0.5)' }}>온라인 · 평균 응답 10분</span>
              </div>
            </div>
            <button
              onClick={handleReset}
              title="대화 초기화"
              aria-label="대화 초기화"
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" style={{ color: 'rgba(201,168,76,0.7)' }} />
            </button>
          </div>

          {/* [개선 5위] 진행 바 */}
          {step !== 'initial' && (
            <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                style={{ height: '100%', background: 'linear-gradient(90deg,#e8c87a,#c9a84c)' }}
                initial={{ width: 0 }}
                animate={{ width: `${stepProgress[step]}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          )}

          {/* Messages */}
          <div
            role="log"
            aria-live="polite"
            aria-label="챗봇 대화 내용"
            className="flex-1 overflow-y-auto p-5 space-y-4"
            style={{ minHeight: 0, maxHeight: '400px' }}
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)' }}
                    aria-hidden="true"
                  >
                    <span className="text-[#04091a] font-black" style={{ fontSize: '8px' }}>IBS</span>
                  </div>
                )}
                <div
                  className="max-w-[85%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap shadow-sm"
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
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2"
                  style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)' }}
                  aria-hidden="true"
                >
                  <span className="text-[#04091a] font-black" style={{ fontSize: '8px' }}>IBS</span>
                </div>
                <div className="px-3 py-2.5 rounded-xl flex items-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
                  aria-label="IBS 응답 중"
                >
                  {[0, 0.2, 0.4].map((d, i) => (
                    <motion.div key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: '#c9a84c' }}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* [개선 2위] FAQ Chips — initial + asked_free 단계 모두 노출 */}
          {(step === 'initial' || step === 'asked_free') && (
            <div className="px-5 pb-4 flex flex-wrap gap-2" role="group" aria-label="자주 묻는 질문">
              {step === 'asked_free' && (
                <p className="w-full text-[13px] mb-1 font-bold" style={{ color: 'rgba(240,244,255,0.4)' }}>💡 자주 묻는 질문</p>
              )}
              {faqList.map((faq, i) => (
                <button
                  key={i}
                  onClick={() => handleFaq(faq)}
                  className="text-[13px] px-3.5 py-2 rounded-full transition-all shadow-sm hover:opacity-100 hover:scale-[1.03]"
                  style={{
                    background: 'rgba(201,168,76,0.12)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    color: 'rgba(201,168,76,0.85)',
                  }}
                >
                  {faq.q}
                </button>
              ))}
            </div>
          )}

          {/* [개선 3위] 이름 스킵 옵션 — 가시성 개선 */}
          {step === 'waiting_name' && (
            <div className="px-5 pb-4">
              <button
                onClick={() => askForContact('익명 고객')}
                className="text-[13px] font-bold px-4 py-3 rounded-xl w-full transition-all hover:opacity-80 shadow-sm"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(240,244,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                익명으로 상담 신청하기 →
              </button>
            </div>
          )}

          {/* [개선 8위] 선호 시간 선택 버튼 */}
          {step === 'waiting_time' && (
            <div className="px-5 pb-4 grid grid-cols-2 gap-2">
              {TIME_OPTIONS.map(time => (
                <button
                  key={time}
                  onClick={() => {
                    addUserMsg(time);
                    finishLead(time, savedContact, customerName, savedQuestion);
                  }}
                  className="text-[13px] font-bold px-3 py-3 rounded-xl transition-all shadow-sm hover:opacity-80 flex items-center justify-center gap-1.5"
                  style={{
                    background: 'rgba(167,139,250,0.1)',
                    color: 'rgba(196,181,253,0.9)',
                    border: '1px solid rgba(167,139,250,0.25)',
                  }}
                >
                  <Clock className="w-3 h-3" />
                  {time}
                </button>
              ))}
            </div>
          )}

          {/* 완료 후 다음 행동 선택지 */}
          {step === 'done' && (
            <div className="px-5 pb-5 flex flex-col gap-2">
              <button
                onClick={() => window.open(`tel:${IBS_PHONE}`)}
                className="text-[14px] font-bold px-4 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-80 shadow-sm"
                style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}
              >
                <Phone className="w-4 h-4" />
                지금 바로 전화 연결
              </button>
              <button
                onClick={handleReset}
                className="text-[13px] font-bold px-4 py-3 rounded-xl transition-all hover:opacity-70 shadow-sm"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,244,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                ↩ 다시 시작하기
              </button>
            </div>
          )}

          {/* 단계별 안내 배너 */}
          {bannerContent && (
            <div className="mx-5 mb-4 px-4 py-3 rounded-xl text-[13px] font-bold flex items-center gap-2 shadow-sm"
              style={{ background: bannerContent.color, border: `1px solid ${bannerContent.borderColor}`, color: bannerContent.textColor }}
              role="status"
            >
              <span aria-hidden="true" className="text-lg">{bannerContent.icon}</span>
              <span>{bannerContent.text}</span>
            </div>
          )}

          {/* 연락처 유효성 에러 메시지 */}
          {contactError && step === 'waiting_contact' && (
            <div className="mx-5 mb-3 px-4 py-3 rounded-xl text-[13px] font-bold shadow-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(252,165,165,0.9)' }}
              role="alert"
            >
              ⚠️ {contactError}
            </div>
          )}

          {/* [개선 4위] 실시간 카운트다운 */}
          {step === 'done' && countdown !== null && (
            <div className="px-3 py-1.5 flex items-center justify-center gap-3 text-xs" style={{ color: 'rgba(134,239,172,0.6)', borderTop: '1px solid rgba(34,197,94,0.1)' }}>
              <span>{countdown}초 후 자동으로 닫힙니다</span>
              <button
                onClick={() => setOpen(false)}
                className="underline hover:opacity-80 transition-opacity"
                style={{ color: 'rgba(134,239,172,0.8)' }}
              >
                지금 닫기
              </button>
            </div>
          )}

          {/* 전화 연결 버튼 */}
          {step !== 'done' && (
            <div className="px-5 pb-5 pt-0 bg-[rgba(4,9,26,0.3)]">
              <button
                className="w-full py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-sm hover:scale-[1.02]"
                style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}
                onClick={() => window.open(`tel:${IBS_PHONE}`)}
                aria-label="전문 상담원 전화 연결"
              >
                <Phone className="w-4 h-4" />
                전문 상담원 연결 ({IBS_PHONE_DISPLAY})
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Area slot */}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
