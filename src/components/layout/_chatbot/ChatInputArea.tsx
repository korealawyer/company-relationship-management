'use client';
import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Step } from './chatbot.constants';

interface ChatInputAreaProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  step: Step;
  contactError: string;
  setContactError: (v: string) => void;
  placeholder: string;
  handleSend: () => void;
}

export default function ChatInputArea(props: ChatInputAreaProps) {
  const {
    inputRef,
    input,
    setInput,
    loading,
    step,
    contactError,
    setContactError,
    placeholder,
    handleSend,
  } = props;

  return (
    <div className="p-4 flex gap-2" style={{ borderTop: '1px solid rgba(201,168,76,0.15)', background: 'rgba(4,9,26,0.3)' }}>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => { setInput(e.target.value); if (contactError) setContactError(''); }}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={loading}
        className="flex-1 px-4 py-3 rounded-xl text-[14px] outline-none transition-all focus:ring-1 focus:ring-[#c9a84c]"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: contactError
            ? '1px solid rgba(239,68,68,0.6)'
            : step === 'waiting_contact'
              ? '1px solid rgba(201,168,76,0.5)'
              : step === 'waiting_name'
                ? '1px solid rgba(99,179,237,0.4)'
                : step === 'waiting_time'
                  ? '1px solid rgba(167,139,250,0.5)'
                  : '1px solid rgba(201,168,76,0.2)',
          color: 'rgba(240,244,255,0.9)',
          opacity: loading ? 0.6 : 1,
        }}
      />
      <button
        onClick={handleSend}
        disabled={loading || !input.trim()}
        aria-label="메시지 전송"
        className="w-[48px] h-[48px] rounded-xl flex items-center justify-center shadow-md transition-all hover:scale-[1.05] active:scale-[0.95] disabled:hover:scale-100 disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)' }}
      >
        {loading ? <Loader2 className="w-5 h-5 text-[#04091a] animate-spin" /> : <Send className="w-5 h-5 text-[#04091a]" />}
      </button>
    </div>
  );
}
