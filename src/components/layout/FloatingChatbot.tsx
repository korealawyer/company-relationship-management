'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useChatbot } from './_chatbot/useChatbot';
import ChatPanel from './_chatbot/ChatPanel';
import ChatInputArea from './_chatbot/ChatInputArea';

export default function FloatingChatbot() {
  const {
    // refs
    bottomRef, panelRef, inputRef,
    // state
    open, setOpen,
    messages, loading, step,
    input, setInput,
    savedContact, savedQuestion, customerName,
    showBadge, setShowBadge, setBadgeDismissed,
    contactError, setContactError,
    countdown, maxPanelHeight,
    // computed
    placeholder, bannerContent, isInternal,
    // actions
    handleFaq, handleSend, handleReset,
    // pass-through
    faqs, TIME_OPTIONS,
    IBS_PHONE, IBS_PHONE_DISPLAY, STEP_PROGRESS,
    // inner callbacks needed by panels
    askForContact, finishLead, addUserMsg,
  } = useChatbot();

  if (isInternal) return null;

  return (
    <>
      {/* 뱃지 */}
      <AnimatePresence>
        {showBadge && !open && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="fixed bottom-24 right-3 sm:right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{
              background: 'rgba(13,27,62,0.97)',
              border: '1px solid rgba(201,168,76,0.4)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              color: 'rgba(240,244,255,0.9)',
              maxWidth: 220,
            }}
            onClick={() => { setOpen(true); setShowBadge(false); setBadgeDismissed(true); }}
            role="complementary"
            aria-label="상담 신청 챗봇 열기"
          >
            <span style={{ fontSize: 18 }}>💬</span>
            <span>상담 신청하기</span>
            <button
              aria-label="알림 닫기"
              onClick={(e) => { e.stopPropagation(); setShowBadge(false); setBadgeDismissed(true); }}
              className="ml-1 opacity-50 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        aria-label={open ? '챗봇 닫기' : 'IBS 법무 챗봇 열기'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => { setOpen(!open); setShowBadge(false); setBadgeDismissed(true); }}
        className="fixed bottom-6 right-3 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #e8c87a, #c9a84c)', boxShadow: '0 8px 30px rgba(201,168,76,0.5)' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        animate={open ? {} : {
          boxShadow: ['0 8px 30px rgba(201,168,76,0.5)', '0 8px 40px rgba(201,168,76,0.8)', '0 8px 30px rgba(201,168,76,0.5)'],
        }}
        transition={open ? {} : { duration: 2.5, repeat: Infinity }}
      >
        {!open && showBadge && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#04091a]" aria-hidden="true" />
        )}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X className="w-6 h-6 text-[#04091a]" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageCircle className="w-6 h-6 text-[#04091a]" strokeWidth={2.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <ChatPanel
        panelRef={panelRef}
        bottomRef={bottomRef}
        open={open}
        messages={messages}
        loading={loading}
        step={step}
        savedContact={savedContact}
        customerName={customerName}
        savedQuestion={savedQuestion}
        countdown={countdown}
        maxPanelHeight={maxPanelHeight}
        bannerContent={bannerContent}
        contactError={contactError}
        faqs={faqs}
        TIME_OPTIONS={TIME_OPTIONS}
        IBS_PHONE={IBS_PHONE}
        IBS_PHONE_DISPLAY={IBS_PHONE_DISPLAY}
        STEP_PROGRESS={STEP_PROGRESS}
        handleReset={handleReset}
        handleFaq={handleFaq}
        askForContact={askForContact}
        finishLead={finishLead}
        addUserMsg={addUserMsg}
        setOpen={setOpen}
      >
        {/* Input Area — ChatPanel 내부 하단에 슬롯으로 삽입 (또는 ChatPanel props로 전달) */}
        <ChatInputArea
          inputRef={inputRef}
          input={input}
          setInput={setInput}
          loading={loading}
          step={step}
          contactError={contactError}
          setContactError={setContactError}
          placeholder={placeholder}
          handleSend={handleSend}
        />
      </ChatPanel>
    </>
  );
}
