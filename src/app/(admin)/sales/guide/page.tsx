'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone, Link2, Briefcase, BookOpen, HelpCircle,
    Copy, Check, Share2, ChevronDown, ChevronRight,
    Trash2, Clock, ExternalLink, CheckCircle2, Apple, Play,
    Users, Phone, Mail, FileText, Calculator, BarChart3, Mic
} from 'lucide-react';
import Link from 'next/link';
import { useAuth, useRequireAuth } from '@/lib/AuthContext';

// ─── 색상 토큰 ────────────────────────────────────────────────────
const GOLD = '#c9a84c';
const BG = '#04091a';
const CARD_BG = 'rgba(255,255,255,0.03)';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const TEXT = '#f0f4ff';
const TEXT_SUB = 'rgba(240,244,255,0.55)';

// ─── 탭 정의 ────────────────────────────────────────────────────
const TABS = [
    { id: 'install', label: '앱 설치 가이드', icon: '📱' },
    { id: 'link', label: '링크 생성기', icon: '🔗' },
    { id: 'script', label: '영업 스크립트', icon: '💼' },
    { id: 'features', label: '기능 사용법', icon: '📋' },
    { id: 'faq', label: 'FAQ', icon: '❓' },
];

// ─── Tab 1: 앱 설치 가이드 ───────────────────────────────────────
const ANDROID_STEPS = [
    { n: 1, title: 'Chrome 브라우저로 접속', desc: '구글 Chrome 앱을 열고 주소창에 앱 주소를 입력합니다.' },
    { n: 2, title: '메뉴 버튼 탭', desc: '우상단 점 3개(⋮) 메뉴를 탭합니다.' },
    { n: 3, title: '"홈 화면에 추가" 선택', desc: '메뉴에서 "홈 화면에 추가"를 선택합니다.' },
    { n: 4, title: '이름 입력 후 추가', desc: '"IBS 영업팀"으로 이름을 설정하고 [추가] 버튼을 탭합니다.' },
    { n: 5, title: '홈 화면에서 실행', desc: '홈 화면에 생성된 IBS 아이콘을 탭하면 앱처럼 실행됩니다!' },
];
const IOS_STEPS = [
    { n: 1, title: 'Safari로 접속', desc: '반드시 Safari 브라우저를 사용해야 합니다. (Chrome 불가)' },
    { n: 2, title: '공유 버튼 탭', desc: '하단 가운데 공유(사각형+화살표) 아이콘을 탭합니다.' },
    { n: 3, title: '"홈 화면에 추가" 선택', desc: '스크롤하여 "홈 화면에 추가"를 찾아 탭합니다.' },
    { n: 4, title: '이름 확인 후 추가', desc: '"IBS 영업팀"으로 확인 후 우상단 [추가]를 탭합니다.' },
    { n: 5, title: '홈 화면에서 실행', desc: '홈 화면 IBS 아이콘 → 전체 화면 앱처럼 구동됩니다!' },
];

function AppInstallTab() {
    const [installed, setInstalled] = useState(false);
    useEffect(() => {
        setInstalled(localStorage.getItem('ibs_app_installed') === 'true');
    }, []);
    const markInstalled = () => {
        localStorage.setItem('ibs_app_installed', 'true');
        setInstalled(true);
    };

    return (
        <div className="space-y-8">
            <div className="text-center pb-2">
                <h2 className="text-2xl font-black mb-1">📱 PWA 앱 설치 가이드</h2>
                <p className="text-sm" style={{ color: TEXT_SUB }}>스마트폰에 설치하면 네이티브 앱처럼 빠르게 실행됩니다</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Android */}
                <div className="rounded-2xl p-6" style={{ background: CARD_BG, border: `1px solid rgba(78,205,196,0.2)` }}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(78,205,196,0.15)' }}>
                            <Play className="w-5 h-5" style={{ color: '#4ecdc4' }} />
                        </div>
                        <div>
                            <div className="font-black" style={{ color: '#4ecdc4' }}>Android</div>
                            <div className="text-xs" style={{ color: TEXT_SUB }}>Chrome 브라우저</div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {ANDROID_STEPS.map((s, i) => (
                            <motion.div key={s.n}
                                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="flex gap-3">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                                    style={{ background: 'rgba(78,205,196,0.15)', color: '#4ecdc4', border: '1px solid rgba(78,205,196,0.3)' }}>
                                    {s.n}
                                </div>
                                <div>
                                    <div className="text-sm font-bold" style={{ color: TEXT }}>{s.title}</div>
                                    <div className="text-xs mt-0.5" style={{ color: TEXT_SUB }}>{s.desc}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* iPhone */}
                <div className="rounded-2xl p-6" style={{ background: CARD_BG, border: `1px solid rgba(168,85,247,0.2)` }}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
                            <Apple className="w-5 h-5" style={{ color: '#a855f7' }} />
                        </div>
                        <div>
                            <div className="font-black" style={{ color: '#a855f7' }}>iPhone</div>
                            <div className="text-xs" style={{ color: TEXT_SUB }}>Safari 브라우저</div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {IOS_STEPS.map((s, i) => (
                            <motion.div key={s.n}
                                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="flex gap-3">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                                    style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>
                                    {s.n}
                                </div>
                                <div>
                                    <div className="text-sm font-bold" style={{ color: TEXT }}>{s.title}</div>
                                    <div className="text-xs mt-0.5" style={{ color: TEXT_SUB }}>{s.desc}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 설치 완료 체크 */}
            <div className="flex justify-center pt-2">
                {installed ? (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2 px-6 py-3 rounded-full font-black"
                        style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
                        <CheckCircle2 className="w-5 h-5" />
                        ✅ 설치 완료! 앱처럼 사용하세요
                    </motion.div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        onClick={markInstalled}
                        className="px-8 py-3 rounded-full font-black text-sm"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #e8c87a)`, color: '#0a0e1a' }}>
                        ✅ 설치했나요? 완료 표시하기
                    </motion.button>
                )}
            </div>
        </div>
    );
}

// ─── Tab 2: 링크 생성기 ────────────────────────────────────────
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://ibs-law.co.kr';
const MAX_HISTORY = 5;

interface LinkHistory { biz: string; rep: string; url: string; createdAt: string; }

function LinkGeneratorTab() {
    const { user } = useAuth();
    const repId = user?.id ?? user?.email ?? 'sales001';
    const repName = user?.name ?? user?.email ?? '영업담당자';

    const [biz, setBiz] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState('');
    const [history, setHistory] = useState<LinkHistory[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('ibs_link_history');
            if (raw) setHistory(JSON.parse(raw));
        } catch { }
    }, []);

    const generateLink = useCallback(() => {
        const cleanBiz = biz.replace(/[^0-9]/g, '');
        if (cleanBiz.length < 10) {
            showToast('❌ 올바른 사업자번호(10자리)를 입력하세요');
            return;
        }
        const url = `${BASE_URL}/?biz=${cleanBiz}&rep=${encodeURIComponent(repId)}`;
        setGeneratedUrl(url);

        // 히스토리 저장
        const newEntry: LinkHistory = { biz: cleanBiz, rep: repId, url, createdAt: new Date().toISOString() };
        const updated = [newEntry, ...history.filter(h => h.biz !== cleanBiz)].slice(0, MAX_HISTORY);
        setHistory(updated);
        localStorage.setItem('ibs_link_history', JSON.stringify(updated));
    }, [biz, repId, history]);

    const copyToClipboard = useCallback(async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            showToast('✅ 링크가 클립보드에 복사되었습니다!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast('❌ 복사 실패 — 수동으로 선택해 복사하세요');
        }
    }, []);

    const shareViaNavigator = useCallback(async (url: string) => {
        if (navigator.share) {
            try {
                await navigator.share({ title: 'IBS 법률 서비스 안내', text: '맞춤 법률 서비스를 확인해보세요!', url });
            } catch { }
        } else {
            copyToClipboard(url);
            showToast('📋 공유 API 미지원 — 링크를 복사했습니다');
        }
    }, [copyToClipboard]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    const deleteHistoryItem = (index: number) => {
        const updated = history.filter((_, i) => i !== index);
        setHistory(updated);
        localStorage.setItem('ibs_link_history', JSON.stringify(updated));
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl font-bold text-sm shadow-xl"
                        style={{ background: 'rgba(10,14,26,0.95)', border: `1px solid ${GOLD}40`, color: TEXT, backdropFilter: 'blur(12px)' }}>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center pb-2">
                <h2 className="text-2xl font-black mb-1">🔗 고객 개인화 링크 생성기</h2>
                <p className="text-sm" style={{ color: TEXT_SUB }}>고객번호 입력 → 링크 생성 → 카카오톡 전송</p>
            </div>

            {/* 담당자 정보 뱃지 */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: `rgba(201,168,76,0.08)`, border: `1px solid ${GOLD}30` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm"
                    style={{ background: `${GOLD}20`, color: GOLD }}>
                    {repName.charAt(0)}
                </div>
                <div>
                    <div className="text-xs font-bold" style={{ color: TEXT_SUB }}>자동 연결된 담당자</div>
                    <div className="font-black text-sm" style={{ color: GOLD }}>{repName}</div>
                </div>
                <div className="ml-auto text-xs font-mono px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: TEXT_SUB }}>
                    rep={repId}
                </div>
            </div>

            {/* 입력 영역 */}
            <div className="rounded-2xl p-6 space-y-4" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: TEXT_SUB }}>
                        고객사 사업자번호 <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                        value={biz}
                        onChange={e => setBiz(e.target.value)}
                        placeholder="000-00-00000 또는 숫자만 입력"
                        maxLength={12}
                        inputMode="numeric"
                        className="w-full px-4 py-3.5 rounded-xl outline-none text-base font-bold tracking-widest"
                        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.12)`, color: TEXT }}
                        onKeyDown={e => e.key === 'Enter' && generateLink()}
                    />
                    <p className="text-xs mt-1.5" style={{ color: TEXT_SUB }}>
                        하이픈(-) 제외 10자리 숫자
                    </p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={generateLink}
                    className="w-full py-4 rounded-xl font-black text-base"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #e8c87a)`, color: '#0a0e1a' }}>
                    🔗 영업 링크 생성하기
                </motion.button>
            </div>

            {/* 생성된 링크 */}
            <AnimatePresence>
                {generatedUrl && (
                    <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="rounded-2xl p-6 space-y-4"
                        style={{ background: `rgba(201,168,76,0.06)`, border: `1px solid ${GOLD}35` }}>
                        <div className="text-sm font-bold" style={{ color: GOLD }}>✨ 생성된 개인화 링크</div>
                        <div className="px-4 py-3 rounded-xl break-all text-sm font-mono"
                            style={{ background: 'rgba(0,0,0,0.3)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {generatedUrl}
                        </div>
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                                onClick={() => copyToClipboard(generatedUrl)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                                style={{ background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : CARD_BORDER}`, color: copied ? '#4ade80' : TEXT }}>
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? '복사됨!' : '링크 복사'}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                                onClick={() => shareViaNavigator(generatedUrl)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                                style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.25)', color: '#ffc107' }}>
                                <Share2 className="w-4 h-4" />
                                카카오톡 공유
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 최근 생성 링크 */}
            {history.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4" style={{ color: TEXT_SUB }} />
                        <span className="text-sm font-bold" style={{ color: TEXT_SUB }}>최근 생성 링크</span>
                    </div>
                    <div className="space-y-2">
                        {history.map((h, i) => (
                            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold" style={{ color: TEXT }}>
                                        사업자: {h.biz.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')}
                                    </div>
                                    <div className="text-xs truncate" style={{ color: TEXT_SUB }}>{h.url}</div>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                    <button onClick={() => copyToClipboard(h.url)}
                                        className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <Copy className="w-3.5 h-3.5" style={{ color: TEXT_SUB }} />
                                    </button>
                                    <button onClick={() => shareViaNavigator(h.url)}
                                        className="p-2 rounded-lg" style={{ background: 'rgba(255,193,7,0.08)' }}>
                                        <Share2 className="w-3.5 h-3.5" style={{ color: '#ffc107' }} />
                                    </button>
                                    <button onClick={() => deleteHistoryItem(i)}
                                        className="p-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.08)' }}>
                                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tab 3: 영업 스크립트 ────────────────────────────────────────
const SCRIPTS = [
    {
        type: '프랜차이즈 본사 대표 공략',
        color: GOLD,
        emoji: '🏢',
        intro: '대표님, 혹시 가맹점주들 법적 분쟁으로 머리 아프신 적 없으세요?',
        steps: [
            { role: '영업', text: '대표님 안녕하세요, IBS 법률사무소 [이름]입니다. 프랜차이즈 본사 전문 법률 리테이너 서비스를 소개드리려고요.' },
            { role: '고객', text: '아, 법무법인이요? 지금도 고문변호사 있어서요...' },
            { role: '영업', text: '맞습니다. 그런데 고문변호사는 사건이 생겼을 때만 대응하잖아요. 저희는 가맹 계약서, 노무, 공정위 이슈까지 사전에 예방하고, 플랫폼으로 임원분들이 직접 실시간 자문을 받을 수 있어요. 월 비용도 기존 법무 비용 대비 70%는 절감되시고요.' },
            { role: '고객', text: '플랫폼이요? 좀 더 자세히 알고 싶은데요.' },
            { role: '영업', text: '제가 지금 바로 개인화 링크 보내드릴게요. 대표님 회사 맞춤 기능을 바로 확인하실 수 있습니다. 사업자번호가 어떻게 되세요?' },
        ],
        tip: '💡 TIP: 링크 생성 탭에서 바로 개인화 링크를 생성해 카카오톡으로 전송하세요!',
    },
    {
        type: '방어적인 법무팀 담당자 공략',
        color: '#818cf8',
        emoji: '🛡️',
        intro: '"기존 법무팀이 있어서요"라는 반응에 대응하는 스크립트',
        steps: [
            { role: '영업', text: '법무팀 담당자님, 저희 IBS 플랫폼이 법무팀의 일을 빼앗는 게 아니라, 담당자님의 업무 효율을 10배 높여드리는 도구입니다.' },
            { role: '고객', text: '저희 내부적으로 처리하고 있어서 필요 없을 것 같아요.' },
            { role: '영업', text: '물론입니다. 그런데 지금 가맹점주 민원이나 계약서 검토 요청이 얼마나 들어오세요? 저희 플랫폼은 AI가 1차로 분류하고 우선순위를 잡아드려서, 담당자님이 정말 중요한 건에만 집중할 수 있게 해드려요.' },
            { role: '고객', text: 'AI라고 하면 믿음이 안 가는데...' },
            { role: '영업', text: '전담 변호사가 최종 검토합니다. AI는 보조 역할이에요. 사용 사례 3분이면 설명드릴 수 있는데, 지금 잠깐 시간 괜찮으세요? 개인화 데모 링크도 바로 보내드릴게요.' },
        ],
        tip: '💡 TIP: 법무팀은 "보조·효율화" 포지셔닝 유지. 대체가 아님을 강조하세요.',
    },
    {
        type: '예산 없다고 거절하는 CFO 공략',
        color: '#4ade80',
        emoji: '💰',
        intro: '"예산이 없어요"라는 반응 → ROI로 역전시키는 스크립트',
        steps: [
            { role: '영업', text: 'CFO님, 저희가 제안드리는 건 비용이 아니라 리스크 최소화 투자입니다.' },
            { role: '고객', text: '올해 예산이 빠듯해서 새로운 서비스 계약은 어렵습니다.' },
            { role: '영업', text: '이해합니다. 그런데 가맹점주 한 명이 부당해지 소송만 제기해도 최소 3,000만 원 이상의 비용이 발생해요. 저희 플랫폼은 월 정액으로 이런 리스크를 90%까지 낮춥니다.' },
            { role: '고객', text: '구체적인 숫자가 있나요?' },
            { role: '영업', text: '고객사 평균 법무 비용 절감액이 월 450만 원입니다. 투자 대비 수익률 계산기도 있어요 — 저는 지금 바로 CFO님 회사 맞춤 견적 링크를 보내드릴게요. 가맹점 수가 몇 개이신가요?' },
        ],
        tip: '💡 TIP: 요금제 계산기(/sales/pricing-calculator)와 연계해서 실제 견적을 보여드리세요.',
    },
];

const COMPARISON_TABLE = [
    { feature: '법률 자문 응답 시간', ibs: '🟢 24시간 이내', clio: '🟡 2~3일', mycase: '🔴 없음' },
    { feature: '심리상담(EAP) 포함', ibs: '🟢 포함', clio: '🔴 미포함', mycase: '🔴 미포함' },
    { feature: '가맹사업 전문성', ibs: '🟢 1,000+ 가맹본부', clio: '🟡 일반 법무', mycase: '🟡 일반 법무' },
    { feature: '한국어 지원', ibs: '🟢 완전 한국어', clio: '🔴 영어 중심', mycase: '🔴 영어 중심' },
    { feature: '월 구독 요금', ibs: '🟢 맞춤 정액', clio: '🟡 고정 고가', mycase: '🟡 고정 고가' },
    { feature: 'AI 문서 분석', ibs: '🟢 포함', clio: '🟡 제한적', mycase: '🔴 미포함' },
    { feature: '전담 변호사 배정', ibs: '🟢 포함', clio: '🔴 별도 비용', mycase: '🔴 미포함' },
];

function ScriptTab() {
    const [expanded, setExpanded] = useState<number | null>(null);
    const [copied, setCopied] = useState<number | null>(null);

    const copyScript = (i: number, s: typeof SCRIPTS[0]) => {
        const text = s.steps.map(step => `[${step.role}] ${step.text}`).join('\n');
        navigator.clipboard.writeText(text).catch(() => { });
        setCopied(i);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="space-y-8">
            <div className="text-center pb-2">
                <h2 className="text-2xl font-black mb-1">💼 영업 시나리오 & 스크립트</h2>
                <p className="text-sm" style={{ color: TEXT_SUB }}>타입별 고객 대화 스크립트 & 경쟁사 비교</p>
            </div>

            {/* 스크립트 아코디언 */}
            <div className="space-y-3">
                {SCRIPTS.map((s, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${s.color}25` }}>
                        <button
                            className="w-full flex items-center gap-4 px-6 py-5 text-left"
                            style={{ background: `${s.color}08` }}
                            onClick={() => setExpanded(expanded === i ? null : i)}>
                            <span className="text-2xl">{s.emoji}</span>
                            <div className="flex-1">
                                <div className="font-black" style={{ color: s.color }}>{s.type}</div>
                                <div className="text-xs mt-0.5" style={{ color: TEXT_SUB }}>{s.intro}</div>
                            </div>
                            <ChevronDown className="w-5 h-5 flex-shrink-0 transition-transform"
                                style={{ color: TEXT_SUB, transform: expanded === i ? 'rotate(180deg)' : 'none' }} />
                        </button>

                        <AnimatePresence>
                            {expanded === i && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                                    style={{ overflow: 'hidden' }}>
                                    <div className="px-6 pb-5 pt-3 space-y-3"
                                        style={{ background: 'rgba(0,0,0,0.2)', borderTop: `1px solid ${s.color}15` }}>
                                        {s.steps.map((step, j) => (
                                            <div key={j} className="flex gap-3">
                                                <div className="w-16 text-xs font-bold pt-0.5 flex-shrink-0"
                                                    style={{ color: step.role === '영업' ? s.color : TEXT_SUB }}>
                                                    [{step.role}]
                                                </div>
                                                <div className="text-sm leading-relaxed" style={{ color: step.role === '영업' ? TEXT : TEXT_SUB }}>
                                                    {step.text}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="mt-4 px-4 py-3 rounded-xl text-sm" style={{ background: `${s.color}10`, color: s.color }}>
                                            {s.tip}
                                        </div>
                                        <button onClick={() => copyScript(i, s)}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm mt-2"
                                            style={{ background: copied === i ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)', color: copied === i ? '#4ade80' : TEXT, border: `1px solid ${copied === i ? 'rgba(74,222,128,0.3)' : CARD_BORDER}` }}>
                                            {copied === i ? <><Check className="w-4 h-4" /> 복사됨!</> : <><Copy className="w-4 h-4" /> 이 스크립트 복사</>}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* 경쟁사 비교표 */}
            <div>
                <h3 className="text-lg font-black mb-4" style={{ color: TEXT }}>📊 경쟁사 대비 IBS 강점 비교</h3>
                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${CARD_BORDER}` }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <th className="px-4 py-3 text-left font-bold" style={{ color: TEXT_SUB }}>기능 / 항목</th>
                                <th className="px-4 py-3 text-center font-black" style={{ color: GOLD }}>IBS</th>
                                <th className="px-4 py-3 text-center font-bold" style={{ color: TEXT_SUB }}>Clio</th>
                                <th className="px-4 py-3 text-center font-bold" style={{ color: TEXT_SUB }}>MyCase</th>
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARISON_TABLE.map((row, i) => (
                                <tr key={i} style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                                    <td className="px-4 py-3" style={{ color: TEXT }}>{row.feature}</td>
                                    <td className="px-4 py-3 text-center">{row.ibs}</td>
                                    <td className="px-4 py-3 text-center">{row.clio}</td>
                                    <td className="px-4 py-3 text-center">{row.mycase}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Tab 4: 기능 사용법 ────────────────────────────────────────
const FEATURE_CARDS = [
    {
        href: '/sales/dashboard',
        icon: BarChart3,
        color: '#c9a84c',
        title: '영업 대시보드',
        desc: '리드 파이프라인, KPI, 이번달 목표를 한눈에 확인. 실시간 활동 피드로 팀 진행 상황을 추적.',
        tips: ['파이프라인 차트에서 단계별 전환 현황 파악', '이번달 목표 달성률 실시간 추적', '최근 활동 피드로 팀 공유'],
    },
    {
        href: '/sales/call',
        icon: Phone,
        color: '#4ecdc4',
        title: '전화 영업 센터',
        desc: '콜 로그 기록, 통화 메모 저장, 다음 콜 일정 관리. AI가 통화 패턴을 분석해 최적 콜 타임 제안.',
        tips: ['통화 후 즉시 메모 입력으로 컨텍스트 유지', '콜 상태(미연결/연결/약속) 업데이트', '다음 콜 리마인더 설정'],
    },
    {
        href: '/employee',
        icon: Users,
        color: '#818cf8',
        title: '리드 관리',
        desc: '전체 리드 목록, 위험도 분류, AI 분석 결과 확인. 필터/정렬로 우선순위 리드를 신속하게 탐색.',
        tips: ['위험도(HIGH/MED/LOW) 필터로 우선 관리', 'AI 분석 완료 리드 우선 처리', '상태 변경으로 파이프라인 업데이트'],
    },
    {
        href: '/sales/voice-memo',
        icon: Mic,
        color: '#a855f7',
        title: '음성 메모',
        desc: '현장에서 바로 음성 메모 녹음. 자동 텍스트 변환으로 통화 내용을 CRM에 즉시 저장.',
        tips: ['통화 직후 주요 내용 음성 메모 남기기', '자동 텍스트 변환으로 검색 가능', '리드 카드에 바로 연동'],
    },
    {
        href: '/sales/email-history',
        icon: Mail,
        color: '#3b82f6',
        title: '이메일 발송 이력',
        desc: '전송된 이메일 목록, 오픈율, 클릭률 추적. 미오픈 고객을 자동 식별해 재연락 시점 알림.',
        tips: ['오픈하지 않은 고객 → 72시간 후 재연락', '클릭율로 관심도 파악', '발송 이력으로 중복 발송 방지'],
    },
    {
        href: '/sales/pricing-calculator',
        icon: Calculator,
        color: '#4ade80',
        title: '요금제 계산기',
        desc: '가맹점 수, 서비스 유형에 따른 맞춤 견적 자동 산출. 고객사에게 즉석 견적서 제시 가능.',
        tips: ['상담 중 실시간 견적 계산', '비교 플랜 나란히 제시', '견적 결과 링크로 공유 가능'],
    },
];

function FeaturesTab() {
    return (
        <div className="space-y-6">
            <div className="text-center pb-2">
                <h2 className="text-2xl font-black mb-1">📋 기능 사용법 모아보기</h2>
                <p className="text-sm" style={{ color: TEXT_SUB }}>영업팀 전용 페이지 핵심 기능 요약</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                {FEATURE_CARDS.map((card, i) => (
                    <motion.div key={card.href}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="rounded-2xl p-5"
                        style={{ background: CARD_BG, border: `1px solid ${card.color}20` }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: `${card.color}15` }}>
                                <card.icon className="w-5 h-5" style={{ color: card.color }} />
                            </div>
                            <div className="font-black" style={{ color: card.color }}>{card.title}</div>
                        </div>
                        <p className="text-sm mb-3" style={{ color: TEXT_SUB }}>{card.desc}</p>
                        <ul className="space-y-1 mb-4">
                            {card.tips.map((tip, j) => (
                                <li key={j} className="flex items-center gap-2 text-xs" style={{ color: TEXT_SUB }}>
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: card.color }} />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                        <Link href={card.href}>
                            <button className="flex items-center gap-1.5 text-sm font-bold"
                                style={{ color: card.color }}>
                                바로가기 <ChevronRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Tab 5: FAQ ────────────────────────────────────────────────
const FAQS = [
    {
        q: '고객이 "개인정보 도용 아니냐"고 물어보면?',
        a: '사업자번호는 공개 정보(사업자등록증)입니다. 주민번호나 대표자 개인정보가 아니며, 링크는 고객이 서비스를 확인하기 위한 안내 URL입니다. "회사 정보 기반으로 맞춤 안내를 드리기 위해 사업자번호만 사용했습니다"고 설명하세요.',
    },
    {
        q: '링크가 열리지 않는다고 하면?',
        a: '1) 인터넷 연결 확인. 2) 링크를 직접 복사해 Chrome 브라우저에서 열기 시도. 3) 캐시 삭제 후 재시도. 4) 그래도 안 되면 고객에게 www.ibs-law.co.kr으로 직접 접속 후 상담 신청을 안내하세요.',
    },
    {
        q: '비로그인으로 들어온 고객이 구독하면 내 실적으로 잡히나요?',
        a: '네! 링크에 포함된 rep=[사번] 파라미터가 쿠키에 저장되어, 고객이 그 브라우저에서 신청하면 자동으로 담당 영업사원 실적으로 귀속됩니다. 쿠키 유효기간은 30일입니다.',
    },
    {
        q: '고객이 "다음에 연락달라"고 하면 어떻게 CRM에 기록하나요?',
        a: '/employee에서 해당 고객 → 상태를 "in_contact"로 변경 → 콜 메모에 날짜와 다음 연락 시점 기록 → /sales/call에서 다음 콜 알림 설정. 자동 리마인더가 설정한 날짜에 알림을 보냅니다.',
    },
    {
        q: '이메일 발송했는데 오픈을 안 하면?',
        a: '/sales/email-history에서 72시간 미오픈 고객을 확인하고, 직접 전화 영업으로 전환하세요. 이메일에 너무 의존하지 말고, 전화 → 이메일 → 카카오 순서로 멀티 채널 전략을 사용하세요.',
    },
    {
        q: '가맹점이 50개 미만인 소규모 고객도 서비스 가능한가요?',
        a: '네, 스타터 플랜(~50매장)부터 시작할 수 있습니다. 소규모라도 법적 리스크는 동일하게 존재하므로, "비용 대비 효과"를 강조하면서 시작을 유도하세요. 견적 계산기로 정확한 금액을 바로 산출해 드릴 수 있습니다.',
    },
    {
        q: 'PWA 앱이 일반 앱과 다른 점은?',
        a: '앱스토어/플레이스토어 설치 불필요. 자동 업데이트. 홈 화면 아이콘으로 앱처럼 실행. 인터넷 연결 시 최신 버전 자동 적용. 단, 오프라인 사용이나 푸시 알림은 제한될 수 있습니다.',
    },
    {
        q: '고객사가 이미 다른 법무법인을 쓰고 있다면?',
        a: '"저희는 대체가 아니라 보완입니다"라고 시작하세요. 기존 법무법인은 소송·계약서 중심이라면, IBS는 플랫폼 기반 예방·경영 자문에 집중합니다. 같이 사용하는 고객이 많다는 사례를 들어 설득하세요.',
    },
    {
        q: '계약서 검토나 자문 요청은 어떻게 하나요?',
        a: '고객이 플랫폼 구독 후 → 대시보드에서 "법률 자문 요청" → 전담 변호사가 24시간 이내 응답. 영업팀은 /employee에서 해당 고객의 자문 요청 현황을 실시간 확인 가능합니다.',
    },
    {
        q: '개인화 링크의 biz 파라미터가 없으면 어떻게 되나요?',
        a: '고객이 일반 방문자로 랜딩 페이지에 접속합니다. 이 경우 rep 파라미터만 있으면 여전히 해당 영업사원 실적으로 귀속됩니다. 단, 맞춤형 UI는 표시되지 않으니, 반드시 사업자번호를 입력하고 링크를 생성하는 것을 권장합니다.',
    },
    {
        q: '영업 실적 확인은 어디서 하나요?',
        a: '/sales/dashboard에서 본인의 KPI와 파이프라인을 확인할 수 있습니다. 계약 전환 리드, 이번 달 발송 이메일 수, 콜 통화 수 등이 실시간으로 업데이트됩니다.',
    },
    {
        q: '고객이 "비싸다"고 하면?',
        a: '즉시 /sales/pricing-calculator로 이동하여 고객사 규모에 맞는 정확한 견적을 산출해 주세요. "월 [X]원으로 법적 분쟁 1건 예방 효과"라는 ROI 관점으로 재프레이밍하세요. 경쟁사 대비 기능/가격 비교표도 활용하세요.',
    },
];

function FAQTab() {
    const [expanded, setExpanded] = useState<number | null>(null);

    return (
        <div className="space-y-6">
            <div className="text-center pb-2">
                <h2 className="text-2xl font-black mb-1">❓ 자주 묻는 질문 (FAQ)</h2>
                <p className="text-sm" style={{ color: TEXT_SUB }}>현장에서 자주 나오는 질문 {FAQS.length}개 정리</p>
            </div>
            <div className="space-y-2">
                {FAQS.map((faq, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${CARD_BORDER}` }}>
                        <button
                            className="w-full flex items-center gap-4 px-5 py-4 text-left"
                            style={{ background: CARD_BG }}
                            onClick={() => setExpanded(expanded === i ? null : i)}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                                style={{ background: `${GOLD}15`, color: GOLD }}>
                                {i + 1}
                            </div>
                            <div className="flex-1 text-sm font-bold" style={{ color: TEXT }}>{faq.q}</div>
                            <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform"
                                style={{ color: TEXT_SUB, transform: expanded === i ? 'rotate(180deg)' : 'none' }} />
                        </button>
                        <AnimatePresence>
                            {expanded === i && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                    style={{ overflow: 'hidden' }}>
                                    <div className="px-5 pb-5 pt-3 text-sm leading-relaxed"
                                        style={{ background: 'rgba(0,0,0,0.15)', borderTop: `1px solid ${CARD_BORDER}`, color: TEXT_SUB }}>
                                        {faq.a}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── 메인 페이지 ──────────────────────────────────────────────
const TAB_COMPONENTS: Record<string, React.FC> = {
    install: AppInstallTab,
    link: LinkGeneratorTab,
    script: ScriptTab,
    features: FeaturesTab,
    faq: FAQTab,
};

export default function SalesGuidePage() {
    const { user, authorized } = useRequireAuth(['sales']);
    const [activeTab, setActiveTab] = useState('install');
    const [prevTab, setPrevTab] = useState('install');

    const handleTabChange = (id: string) => {
        setPrevTab(activeTab);
        setActiveTab(id);
    };

    const tabIndex = (id: string) => TABS.findIndex(t => t.id === id);
    const direction = tabIndex(activeTab) > tabIndex(prevTab) ? 1 : -1;

    const ActiveComponent = TAB_COMPONENTS[activeTab];

    if (!authorized) return null;

    return (
        <div className="min-h-screen" style={{ background: BG, color: TEXT }}>
            {/* 페이지 헤더 */}
            <div className="pt-10 pb-6 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.07), transparent)' }} />
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-bold"
                        style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}30`, color: GOLD }}>
                        📚 영업팀 플레이북
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-2">Sales Guide</h1>
                    <p className="text-sm" style={{ color: TEXT_SUB }}>
                        {user?.name ?? '영업팀'}님을 위한 완전한 영업 가이드 · 매일 확인하세요
                    </p>
                </motion.div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="sticky top-0 z-30 px-4 py-3"
                style={{ background: 'rgba(4,9,26,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${CARD_BORDER}` }}>
                <div className="max-w-4xl mx-auto flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex-shrink-0"
                            style={{
                                background: activeTab === tab.id ? `${GOLD}18` : 'transparent',
                                color: activeTab === tab.id ? GOLD : TEXT_SUB,
                                border: activeTab === tab.id ? `1px solid ${GOLD}40` : '1px solid transparent',
                            }}>
                            <span>{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 탭 콘텐츠 */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={activeTab}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -40 }}
                        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}>
                        <ActiveComponent />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
