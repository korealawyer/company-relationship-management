import { KEYWORD_RESPONSES } from './chatbot.data';

// ── 전화번호 상수 ─────────────────────────────────────────────────
export const IBS_PHONE = '025988518';
export const IBS_PHONE_DISPLAY = '02-598-8518';

// ── 내부 업무 경로 — 챗봇 미노출 ──────────────────────────────────
export const INTERNAL_PATHS = ['/admin', '/lawyer', '/employee', '/sales'];

// ── 세션 키 ───────────────────────────────────────────────────────
export const CHAT_SESSION_KEY = 'ibs_chat_session';

// ── 초기 봇 메시지 ────────────────────────────────────────────────
export const INITIAL_BOT_MSG =
    '안녕하세요! IBS 법무 어시스턴트입니다 👋\n\n개인정보·가맹계약·노무·분쟁 등 어떤 법률 질문이든 즉시 답변드립니다.\n아래 주제를 클릭하거나 직접 입력해 주세요.';

// ── [개선 8위] 상담 선호 시간 옵션 ──────────────────────────────
export const TIME_OPTIONS = ['오전 (9-12시)', '오후 (13-18시)', '저녁 (18-20시)', '시간 무관'];

// ── 단계 타입 ────────────────────────────────────────────────────
export type Step =
    | 'initial'
    | 'asked_faq'
    | 'asked_free'
    | 'url_detected'
    | 'waiting_name'
    | 'waiting_contact'
    | 'waiting_time'
    | 'done';

export interface Message {
    role: 'bot' | 'user';
    text: string;
}

// ── 세션 저장 타입 ────────────────────────────────────────────────
export interface ChatSession {
    name?: string;
    hasSubmitted: boolean;
    lastVisit: number;
}

// ── [개선 5위] 단계별 진행 바 퍼센트 ─────────────────────────────
export const STEP_PROGRESS: Record<Step, number> = {
    initial: 0,
    asked_faq: 20,
    asked_free: 20,
    url_detected: 20,
    waiting_name: 50,
    waiting_contact: 75,
    waiting_time: 90,
    done: 100,
};

// ── 유효성 검사 ──────────────────────────────────────────────────
export function isValidContact(val: string): boolean {
    const phoneRe = /^(01[016789][- ]?\d{3,4}[- ]?\d{4}|0\d{1,2}[- ]?\d{3,4}[- ]?\d{4})$/;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return phoneRe.test(val.replace(/-/g, '').trim()) || emailRe.test(val.trim());
}

// ── URL 감지 ─────────────────────────────────────────────────────
export function extractUrl(text: string): string | null {
    const m = text.match(/https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(co\.kr|com|net|org|kr)[^\s]*/);
    return m ? m[0] : null;
}

// ── 키워드 기반 응답 ──────────────────────────────────────────────
export function getKeywordResponse(text: string): string | null {
    for (const { keywords, response } of KEYWORD_RESPONSES) {
        if (keywords.some(kw => text.includes(kw))) return response;
    }
    return null;
}
