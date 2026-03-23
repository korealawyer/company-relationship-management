'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Phone, ChevronRight, Send, Loader2, RotateCcw, Clock } from 'lucide-react';
import { store } from '@/lib/mockStore';

// ── [개선 1위] 전화번호 단일 상수 관리 ────────────────────────────
const IBS_PHONE = '025988518';
const IBS_PHONE_DISPLAY = '02-598-8518';

// ── 자주 묻는 질문 ──────────────────────────────────────────────
const faqs = [
    { q: '무료 검토는 어떻게 받나요?', keyword: '무료검토' },
    { q: '위반 시 과징금이 얼마인가요?', keyword: '과징금' },
    { q: '가맹계약서 필수 조항은?', keyword: '가맹계약조항' },
    { q: '개인정보처리방침 어떻게 써요?', keyword: '처리방침작성' },
    { q: '분석에 얼마나 걸리나요?', keyword: '분석기간' },
    { q: '수임료는 얼마인가요?', keyword: '수임료안내' },
    { q: '가맹점 분쟁 어떻게 대응하나요?', keyword: '가맹분쟁' },
    { q: '구독 취소는 가능한가요?', keyword: '구독취소' },
];

// ── FAQ별 AI 답변 ────────────────────────────────────────────────
const faqAnswers: Record<string, string> = {
    무료검토: `홈페이지 URL만 알려주시면 AI가 자동으로 개인정보처리방침을 분석합니다.\n1차 리포트는 10분 내로, 변호사 교차 검증 보고서는 48시간 내 이메일로 발송됩니다.\n\n✅ 무료 분석은 월 1회 제공되며, 별도 가입 없이 바로 신청 가능합니다.`,
    과징금: `「개인정보 보호법」 위반 시 처벌 수위입니다.\n\n🔴 과징금: 최대 3,000만원\n🔴 형사처벌: 징역 5년 이하 / 벌금 5,000만원 이하\n🔴 행정처분: 개인정보 이용 정지 명령\n\n프랜차이즈 본사는 가맹점 수 × 위반 건수로 리스크가 배가됩니다. 지금 바로 무료 점검 받으시겠어요?`,
    가맹계약조항: `가맹사업법 제11조에 따라 가맹계약서에 반드시 포함해야 하는 항목입니다.\n\n① 가맹금의 금액·지급 시기·방법\n② 가맹점 영업지역 범위\n③ 계약 해지·갱신 조건\n④ 광고·판촉 분담 기준\n⑤ 영업 비밀 준수 의무\n\n누락 시 과태료 또는 계약 취소 사유가 될 수 있습니다. 검토가 필요하시면 담당 변호사가 확인해 드립니다.`,
    처리방침작성: `개인정보처리방침에 반드시 포함해야 하는 항목(개인정보 보호법 제30조):\n\n① 수집하는 개인정보 항목\n② 수집·이용 목적\n③ 보유·이용 기간\n④ 제3자 제공 여부\n⑤ 처리 위탁 현황\n⑥ 정보주체의 권리·의무 및 행사방법\n\n작성이 어려우시면 저희 AI 자동 생성 + 변호사 검토 서비스를 이용해 보세요!`,
    분석기간: `분석은 다음 3단계로 진행됩니다.\n\n⚡ Step 1 │ AI 자동 분석 — 10분 이내\n⚖️ Step 2 │ 전담 변호사 교차 검증 — 24시간\n📄 Step 3 │ 최종 개선 리포트 발송 — 48시간 내\n\n급하신 경우 당일 처리 프리미엄 옵션도 제공합니다.`,
    수임료안내: `수임료는 사건 유형·난이도·소요 시간에 따라 다릅니다.\n\n💡 시작: 무료 AI 분석 → 유료 서비스 전환 구조라 초기 부담이 없습니다.\n📋 월정액 법무 자문: 규모에 따라 맞춤 산정\n⚖️ 소송·분쟁: 착수금 + 성공보수 구조\n\n정확한 견적은 무료 초기 상담 후 안내드립니다. 상담 신청을 도와드릴까요?`,
    가맹분쟁: `가맹점과의 분쟁은 단계별로 대응이 중요합니다.\n\n1️⃣ 계약서 검토로 위반 사항 확인\n2️⃣ 내용증명 발송 (법적 효력 발생)\n3️⃣ 한국공정거래조정원 조정 신청\n4️⃣ 민사소송 또는 가처분 신청\n\n초기 대응이 빠를수록 유리합니다. 현재 상황을 말씀해 주시겠어요?`,
    구독취소: `IBS 구독은 월 단위 자동 갱신이며, 위약금 없이 언제든 해지 가능합니다.\n\n📅 해지 신청 후 해당 월 말일까지 서비스 유지\n📩 해지 신청: 이메일 또는 전화 상담\n\n장기 구독(6·12개월) 시 최대 20% 할인 옵션도 있습니다.`,
};

// ── 키워드 기반 규칙 엔진 (감정어 + 법률 전문 보강) ─────────────
const KEYWORD_RESPONSES: Array<{ keywords: string[]; response: string }> = [
    // 감정어 — 최우선 매칭
    {
        keywords: ['억울', '억울해', '화나', '너무해', '답답', '힘들', '불안', '무서', '걱정'],
        response: `충분히 힘드시겠어요. 이런 상황에서 법적 보호를 받는 것이 중요합니다.\n\n어떤 일이 있으셨는지 말씀해 주시면, IBS 변호사가 취할 수 있는 법적 조치를 구체적으로 안내해 드리겠습니다. 🤝`,
    },
    {
        keywords: ['급해', '긴급', '내일', '오늘', '빨리', '당장'],
        response: `긴박한 상황이시군요. 즉시 도움드리겠습니다.\n\n📞 지금 바로 전화 주시면 가장 빠릅니다: **02-598-8518** (평일 09:00~18:00)\n\n또는 아래에 상황을 간략히 적어주시면 영업팀이 즉시 연락드립니다.`,
    },
    {
        keywords: ['개인정보', '처리방침', '개인정보보호', '프라이버시'],
        response: `개인정보 보호법 위반 시 최대 3,000만원 과징금이 부과됩니다.\n프랜차이즈 본사는 가맹점 수만큼 리스크가 배가됩니다.\n\n무료 검토를 통해 귀사의 위험도를 즉시 확인해 보시겠어요? 🔍`,
    },
    {
        keywords: ['계약', '계약서', '약관', '협약'],
        response: `프랜차이즈 계약 관련 법무는 IBS의 핵심 전문 영역입니다.\n계약서 검토부터 분쟁 대응까지 원스톱 서비스를 제공합니다.\n\n어떤 계약 관련 사항이 가장 우려되시나요? 📋`,
    },
    {
        keywords: ['가맹', '가맹점', '본사', '프랜차이즈'],
        response: `가맹사업법과 개인정보 처리는 밀접하게 연결됩니다.\nIBS는 국내 프랜차이즈 본사 전담 법무를 전문으로 합니다.\n\n현재 가맹점 규모는 어느 정도 되시나요? 🏪`,
    },
    {
        keywords: ['비용', '요금', '가격', '얼마', '수임료'],
        response: `법무 서비스 비용은 기업 규모와 서비스 범위에 따라 맞춤 산정됩니다.\n\n💡 소규모 무료 검토 → 유료 구독 전환 구조로,\n초기 부담 없이 시작하실 수 있습니다!\n\n정확한 견적은 담당 변호사 상담 후 안내드립니다.`,
    },
    {
        keywords: ['법', '법률', '소송', '분쟁', '고소', '고발'],
        response: `법률 분쟁은 초기 대응이 가장 중요합니다.\nIBS 전담 변호사가 신속하게 상황을 파악하고\n최선의 전략을 제시해 드립니다.\n\n지금 바로 무료 초기 상담을 받아보시겠어요? ⚖️`,
    },
    {
        keywords: ['임대', '부동산', '상가', '매장', '점포'],
        response: `상가 임대차 및 부동산 관련 법무도 전문 지원 가능합니다.\n프랜차이즈 매장 개설·이전·폐점 과정의 법적 리스크를 사전에 점검해 드립니다.\n\n어떤 상황에 처해 계신지 말씀해 주시겠어요? 🏢`,
    },
    {
        keywords: ['세금', '부가세', '소득세', '회계', '세무'],
        response: `세무·회계 관련 법적 리스크 역시 저희 전문 영역입니다.\n특히 프랜차이즈 본사의 가맹비·로열티 처리는 세무 리스크가 높습니다.\n\n구체적인 상황을 말씀해 주시면 전문 변호사가 안내드립니다. 📊`,
    },
    {
        keywords: ['직원', '근로자', '해고', '노동', '근로계약', '퇴직'],
        response: `노동법 관련 분쟁도 초기 대응이 중요합니다.\n부당해고·임금체불·근로계약 관련 법무를 신속히 지원드립니다.\n\n현재 상황을 간략히 설명해 주시겠어요? 👥`,
    },
    {
        keywords: ['상표', '브랜드', '지식재산', '저작권', '특허'],
        response: `브랜드 보호는 프랜차이즈 본사에서 가장 중요한 법무 영역 중 하나입니다.\n\n상표등록이 되어 있지 않으면 가맹점이 이탈 후 유사 상호를 사용해도 막기 어렵습니다.\n\n상표 관련 어떤 상황이신가요? 무단 사용 문제인지, 등록이 필요하신 건지 알려주세요. ⚖️`,
    },
    {
        keywords: ['안녕', '하이', 'hello', '반가워', '시작', '처음'],
        response: `안녕하세요! IBS 법무 어시스턴트입니다 👋\n\n프랜차이즈·기업 법무 전문 로펌으로, 어떤 법률 질문이든 즉시 답변드립니다.\n아래 주제를 클릭하거나 직접 질문해 주세요.`,
    },
];

function getKeywordResponse(text: string): string | null {
    for (const { keywords, response } of KEYWORD_RESPONSES) {
        if (keywords.some(kw => text.includes(kw))) return response;
    }
    return null;
}

// ── 내부 업무 경로 — 챗봇 미노출 ──────────────────────────────────
const INTERNAL_PATHS = ['/admin', '/lawyer', '/employee', '/sales'];

// ── 단계 타입 ────────────────────────────────────────────────────
type Step = 'initial' | 'asked_faq' | 'asked_free' | 'url_detected' | 'waiting_name' | 'waiting_contact' | 'waiting_time' | 'done';

interface Message {
    role: 'bot' | 'user';
    text: string;
}

// ── 세션 저장 타입 ────────────────────────────────────────────────
interface ChatSession {
    name?: string;
    hasSubmitted: boolean;
    lastVisit: number;
}

const CHAT_SESSION_KEY = 'ibs_chat_session';

// ── [개선 5위] 단계별 진행 바 퍼센트 ─────────────────────────────
const STEP_PROGRESS: Record<Step, number> = {
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
function isValidContact(val: string): boolean {
    const phoneRe = /^(01[016789][- ]?\d{3,4}[- ]?\d{4}|0\d{1,2}[- ]?\d{3,4}[- ]?\d{4})$/;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return phoneRe.test(val.replace(/-/g, '').trim()) || emailRe.test(val.trim());
}

// ── URL 감지 ─────────────────────────────────────────────────────
function extractUrl(text: string): string | null {
    const m = text.match(/https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(co\.kr|com|net|org|kr)[^\s]*/);
    return m ? m[0] : null;
}

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

const INITIAL_BOT_MSG = '안녕하세요! IBS 법무 어시스턴트입니다 👋\n\n개인정보·가맹계약·노무·분쟁 등 어떤 법률 질문이든 즉시 답변드립니다.\n아래 주제를 클릭하거나 직접 입력해 주세요.';

// ── [개선 8위] 상담 선호 시간 옵션 ──────────────────────────────
const TIME_OPTIONS = ['오전 (9-12시)', '오후 (13-18시)', '저녁 (18-20시)', '시간 무관'];

export default function FloatingChatbot() {
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
                        aria-label="무료 법무 검토 챗봇 열기"
                    >
                        <span style={{ fontSize: 18 }}>💬</span>
                        <span>무료 법무 검토 받기</span>
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
                                    animate={{ width: `${STEP_PROGRESS[step]}%` }}
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
                                {faqs.map((faq, i) => (
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

                        {/* Input */}
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

                        {/* [개선 4위] 실시간 카운트다운 12초 */}
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
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
