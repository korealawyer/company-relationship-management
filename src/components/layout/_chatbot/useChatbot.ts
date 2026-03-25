import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { store } from '@/lib/mockStore';
import {
    Step, Message, ChatSession,
    IBS_PHONE, IBS_PHONE_DISPLAY,
    INTERNAL_PATHS, CHAT_SESSION_KEY, INITIAL_BOT_MSG, TIME_OPTIONS,
    STEP_PROGRESS, isValidContact, extractUrl, getKeywordResponse,
} from './chatbot.constants';
import { faqs, faqAnswers } from './chatbot.data';

// ── CRM 저장 (API 우선, mockStore 폴백) ──────────────────────────
async function saveLead(question: string, contact: string, customerName: string, preferredTime?: string) {
    const timeNote = preferredTime ? `\n선호 연락 시간: ${preferredTime}` : '';
    const payload = {
        name: customerName || '웹 챗봇 신규 리드',
        biz: '-',
        url: '',
        email: contact.includes('@') ? contact : '-',
        phone: !contact.includes('@') ? contact : '-',
        storeCount: 0,
        status: 'pending' as const,
        assignedLawyer: '',
        issues: [],
        salesConfirmed: false, salesConfirmedAt: '', salesConfirmedBy: '',
        lawyerConfirmed: false, lawyerConfirmedAt: '',
        emailSentAt: '', emailSubject: '',
        clientReplied: false, clientRepliedAt: '', clientReplyNote: '',
        loginCount: 0,
        callNote: `[챗봇 문의]\n고객명: ${customerName}\n질문: ${question}${timeNote}\n\n[고객 남긴 연락처]\n${contact}`,
        plan: 'none' as const,
        autoMode: true,
        aiDraftReady: false,
        source: 'manual' as const,
        riskScore: 0, riskLevel: '', issueCount: 0,
        bizType: '', domain: '', privacyUrl: '',
        contactName: customerName || '홈페이지 방문자',
        contactEmail: contact.includes('@') ? contact : '',
        contactPhone: !contact.includes('@') ? contact : '',
        contacts: [],
        memos: [{
            id: `m${Date.now()}`,
            createdAt: new Date().toLocaleString('ko-KR', { hour12: false }),
            author: 'AI 챗봇',
            content: `(리드 확보) 고객명: "${customerName}" 문의: "${question}"${timeNote}\n연락처: "${contact}"`,
        }],
        timeline: [{
            id: `te${Date.now()}`,
            createdAt: new Date().toISOString(),
            author: 'AI 챗봇',
            type: 'note',
            content: `고객 연락처 확보 — ${customerName} / ${contact}${timeNote}`,
        }],
    };

    try {
        const res = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, contact, customerName, preferredTime, source: 'chatbot' }),
        });
        if (!res.ok) throw new Error('API 저장 실패');
    } catch {
        store.add(payload as unknown as Omit<Parameters<typeof store.add>[0], never>);
    }

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('new-crm-lead', {
            detail: { name: customerName || '웹 챗봇 신규 리드', contact, question, preferredTime },
        }));
    }
}

export function useChatbot() {
    const pathname = usePathname();
    const bottomRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', text: INITIAL_BOT_MSG },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<Step>('initial');
    const [savedQuestion, setSavedQuestion] = useState('');
    const [savedContact, setSavedContact] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [showBadge, setShowBadge] = useState(false);
    const [badgeDismissed, setBadgeDismissed] = useState(false);
    const [contactError, setContactError] = useState('');
    // [개선 4위] 카운트다운 12초
    const [countdown, setCountdown] = useState<number | null>(null);
    // [개선 6위] 모바일 키보드 대응 패널 높이
    const [maxPanelHeight, setMaxPanelHeight] = useState<string>('min(560px, calc(100dvh - 120px))');

    // ── 재방문 인식 ──────────────────────────────────────────────
    useEffect(() => {
        try {
            const raw = localStorage.getItem(CHAT_SESSION_KEY);
            if (raw) {
                const session: ChatSession = JSON.parse(raw);
                const hoursSince = (Date.now() - session.lastVisit) / 3600000;
                if (session.hasSubmitted && hoursSince < 72) {
                    const savedName = session.name ?? '고객';
                    const isTestName = savedName.toLowerCase().includes('test') || savedName.includes('테스트') || savedName.includes('테스터');
                    const displayName = isTestName ? '고객' : savedName;

                    setMessages([{
                        role: 'bot',
                        text: `${displayName}님, 다시 찾아주셨군요! 😊\n\n담당 변호사가 곧 연락드릴 예정입니다.\n추가로 궁금하신 점이 있으시면 말씀해 주세요.`,
                    }]);
                    setStep('done');
                    setCustomerName(displayName);
                }
            }
        } catch { /* localStorage 차단 환경 무시 */ }
    }, []);

    // ── 스마트 팝업 트리거 ───────────────────────────────────────
    useEffect(() => {
        const t1 = setTimeout(() => {
            if (!open && !badgeDismissed) setShowBadge(true);
        }, 30000);

        const handleScroll = () => {
            const pct = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
            if (pct > 0.5 && !badgeDismissed && !open) setShowBadge(true);
        };

        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !badgeDismissed && !open) setShowBadge(true);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            clearTimeout(t1);
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [open, badgeDismissed]);

    // ── [개선 6위] 모바일 키보드 대응 (visualViewport) ──────────
    useEffect(() => {
        if (!open) return;
        const handler = () => {
            if (window.visualViewport) {
                const vh = window.visualViewport.height;
                setMaxPanelHeight(`min(560px, ${vh - 120}px)`);
            }
        };
        window.visualViewport?.addEventListener('resize', handler);
        handler(); // 초기 실행
        return () => window.visualViewport?.removeEventListener('resize', handler);
    }, [open]);

    // 메시지 추가될 때 스크롤
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // 챗봇 열릴 때 입력창 포커스
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 300);
    }, [open]);

    // ── 카운트다운 30초 (추가 질문 시간 확보) ──────────────────────
    useEffect(() => {
        if (step !== 'done') return;
        setCountdown(30);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) { clearInterval(interval); return null; }
                return prev - 1;
            });
        }, 1000);
        const close = setTimeout(() => setOpen(false), 30000);
        return () => { clearInterval(interval); clearTimeout(close); };
    }, [step]);

    // ── 키보드 포커스 트랩 ───────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setOpen(false); return; }
            if (e.key !== 'Tab' || !panelRef.current) return;
            const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            ));
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    const isInternal = INTERNAL_PATHS.some(p => pathname?.startsWith(p));

    // ── [개선 9위] 동적 타이핑 딜레이 최적화 (상한 1600ms) ───────
    const addBotMsg = useCallback((text: string, overrideDelay?: number) => {
        const dynamicDelay = overrideDelay ?? Math.min(1600, Math.max(400, text.length * 18));
        setLoading(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'bot', text }]);
            setLoading(false);
        }, dynamicDelay);
    }, []);

    const addUserMsg = useCallback((text: string) => {
        setMessages(prev => [...prev, { role: 'user', text }]);
    }, []);

    // 이름 요청
    const askForName = useCallback((question: string) => {
        setSavedQuestion(question);
        addBotMsg(
            `"${question.length > 30 ? question.slice(0, 30) + '...' : question}"에 대해 문의 주셨군요! 😊\n\n정확하고 맞춤화된 답변을 드리기 위해,\n먼저 성함을 알려주시겠어요?`
        );
        setStep('waiting_name');
    }, [addBotMsg]);

    // 연락처 수집 요청
    const askForContact = useCallback((name: string) => {
        setCustomerName(name);
        addBotMsg(
            `${name}님, 반갑습니다! 🤝\n\n담당 변호사가 귀사 상황에 맞는 정확한 답변과 무료 분석 결과를 드리기 위해 확인 중입니다.\n\n📱 전화번호 또는 이메일을 남겨주시면 10분 내로 즉시 연락드리겠습니다!`
        );
        setStep('waiting_contact');
    }, [addBotMsg]);

    // [개선 8위] 선호 시간 선택 요청
    const askForPreferredTime = useCallback((contact: string) => {
        setSavedContact(contact);
        addBotMsg(
            `감사합니다! 연락처를 잘 받았습니다. 📬\n\n마지막으로, 연락받기 편하신 시간대를 선택해 주세요.\n아래 버튼을 눌러 선택하시거나, 직접 입력하셔도 됩니다.`,
            600
        );
        setStep('waiting_time');
    }, [addBotMsg]);

    // FAQ 칩 클릭
    const handleFaq = useCallback((faq: typeof faqs[number]) => {
        if (step === 'waiting_name' || step === 'waiting_contact' || step === 'waiting_time' || step === 'done') return;
        addUserMsg(faq.q);
        const answer = faqAnswers[faq.keyword] ?? '확인 중입니다. 잠시만 기다려 주세요.';
        setLoading(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'bot', text: answer }]);
            setLoading(false);
            // [개선 3위] 답변 읽을 시간 확보 — 1200ms → 2500ms
            setTimeout(() => askForName(faq.q), 2500);
        }, 900);
        setStep('asked_faq');
    }, [step, addUserMsg, askForName]);

    // 완료 처리
    const finishLead = useCallback((preferredTime: string, contact: string, name: string, question: string) => {
        saveLead(question, contact, name, preferredTime).catch(console.error);

        try {
            const session: ChatSession = { name, hasSubmitted: true, lastVisit: Date.now() };
            localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(session));
        } catch { /* localStorage 차단 환경 무시 */ }

        addBotMsg(
            `✅ 접수 완료되었습니다!\n\n담당 영업 대표가 방금 알림을 받았으며,\n${preferredTime === '시간 무관' ? '빠른 시간 내' : preferredTime}에 연락드리겠습니다.\n\n추가 문의는 직접 전화해 주세요 📞\n→ ${IBS_PHONE_DISPLAY} (평일 09:00~18:00)`,
            600
        );
        setStep('done');
    }, [addBotMsg]);

    // ── AI fallback 호출 ─────────────────────────────────────────
    const callAI = useCallback(async (question: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: question }],
                    consultType: 'legal',
                    isPublic: true,
                }),
            });
            const data = await res.json();
            const reply = data.message || '죄송합니다. 잠시 후 다시 시도해 주세요. 급하신 경우 02-598-8518로 전화 주세요.';
            setMessages(prev => [...prev, { role: 'bot', text: reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'bot', text: '일시적인 오류가 발생했습니다. 📞 02-598-8518로 직접 문의해 주시면 즉시 도움드립니다.' }]);
        } finally {
            setLoading(false);
        }
    }, []);

    // 전송 버튼 / Enter
    const handleSend = useCallback(() => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setContactError('');
        addUserMsg(userMsg);

        if (step === 'initial' || step === 'asked_faq' || step === 'asked_free') {
            const detectedUrl = extractUrl(userMsg);
            if (detectedUrl) {
                setSavedQuestion(`홈페이지 분석 요청: ${detectedUrl}`);
                addBotMsg(
                    `${detectedUrl} 분석을 요청하셨군요! 🔍\n\nAI가 자동으로 개인정보처리방침을 점검해 드리겠습니다.\n\n📋 결과를 받으실 성함을 알려주시겠어요?`
                );
                setStep('waiting_name');
                return;
            }

            const keywordReply = getKeywordResponse(userMsg);
            if (keywordReply) {
                // 키워드 매칭: 즉시 답변 + 이름 수집
                addBotMsg(keywordReply);
                setTimeout(() => askForName(userMsg), Math.min(1600, Math.max(400, keywordReply.length * 18)) + 800);
            } else {
                // 키워드 미매칭: AI에 실제 질문 → 답변 후 이름 수집
                callAI(userMsg).then(() => {
                    setTimeout(() => askForName(userMsg), 2000);
                });
            }
            setStep('asked_free');

        } else if (step === 'waiting_name') {
            askForContact(userMsg);

        } else if (step === 'waiting_contact') {
            if (!isValidContact(userMsg)) {
                setContactError('올바른 전화번호(예: 010-1234-5678) 또는 이메일(예: abc@company.co.kr)을 입력해 주세요.');
                addBotMsg(
                    `입력하신 연락처 형식을 확인해 주세요 🙏\n\n📞 전화번호 예시: 010-1234-5678\n📧 이메일 예시: name@company.co.kr`,
                    500
                );
                return;
            }
            askForPreferredTime(userMsg);

        } else if (step === 'waiting_time') {
            finishLead(userMsg, savedContact, customerName, savedQuestion);

        } else if (step === 'done') {
            addBotMsg(
                `이미 담당자에게 문의가 전달되었습니다 😊\n\n급하신 경우 직접 전화 주시면 즉시 연결됩니다.\n📞 ${IBS_PHONE_DISPLAY} (평일 09:00~18:00)\n\n처음부터 다시 시작하시려면 아래 새로고침 버튼을 눌러주세요.`,
                500
            );
        }
    }, [input, loading, step, savedQuestion, savedContact, customerName, addBotMsg, addUserMsg, askForName, askForContact, askForPreferredTime, finishLead, callAI]);

    // 챗봇 초기화
    const handleReset = useCallback(() => {
        setMessages([{ role: 'bot', text: INITIAL_BOT_MSG }]);
        setStep('initial');
        setSavedQuestion('');
        setSavedContact('');
        setCustomerName('');
        setInput('');
        setContactError('');
        setCountdown(null);
        setMaxPanelHeight('min(560px, calc(100dvh - 120px))');
    }, []);

    // Step별 input placeholder
    const placeholder =
        step === 'waiting_name' ? '성함을 입력해 주세요...' :
        step === 'waiting_contact' ? '전화번호 또는 이메일을 입력해 주세요...' :
        step === 'waiting_time' ? '선호 시간을 입력하거나 아래 버튼을 선택하세요...' :
        step === 'done' ? '추가 문의사항을 입력하세요...' :
        '궁금하신 내용을 입력하세요...';

    // Step별 안내 배너
    const bannerContent = (() => {
        if (step === 'waiting_name') return { icon: '👤', text: '성함을 알려주시면 맞춤 상담을 드립니다', color: 'rgba(99,179,237,0.12)', borderColor: 'rgba(99,179,237,0.3)', textColor: 'rgba(147,210,249,0.9)' };
        if (step === 'waiting_contact') return { icon: '📱', text: '전화번호 또는 이메일을 입력해 주세요', color: 'rgba(201,168,76,0.12)', borderColor: 'rgba(201,168,76,0.25)', textColor: 'rgba(201,168,76,0.9)' };
        if (step === 'waiting_time') return { icon: '⏰', text: '선호하시는 연락 시간대를 선택해 주세요', color: 'rgba(167,139,250,0.12)', borderColor: 'rgba(167,139,250,0.3)', textColor: 'rgba(196,181,253,0.9)' };
        if (step === 'done') return { icon: '✅', text: '문의가 영업팀에 전달되었습니다', color: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)', textColor: 'rgba(134,239,172,0.9)' };
        return null;
    })();

    return {
        // refs
        bottomRef,
        panelRef,
        inputRef,
        // state 값
        open,
        setOpen,
        messages,
        input,
        setInput,
        loading,
        step,
        savedQuestion,
        savedContact,
        customerName,
        showBadge,
        setShowBadge,
        setBadgeDismissed,
        contactError,
        setContactError,
        countdown,
        maxPanelHeight,
        // callbacks
        askForContact,
        finishLead,
        addUserMsg,
        handleFaq,
        handleSend,
        handleReset,
        // 계산값
        placeholder,
        bannerContent,
        isInternal,
        // 데이터 참조용
        faqs,
        TIME_OPTIONS,
        IBS_PHONE,
        IBS_PHONE_DISPLAY,
        STEP_PROGRESS,
    };
}
