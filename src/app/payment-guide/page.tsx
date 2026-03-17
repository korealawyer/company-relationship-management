'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, Phone, Building2, Landmark, ArrowRight,
    CheckCircle2, Copy, ExternalLink, ChevronLeft, X, Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── 결제 방법 정의 ─────────────────────────────────────────
type PayMethod = 'card_url' | 'card_phone' | 'cms' | 'transfer' | null;

const METHODS = [
    {
        id: 'card_url' as PayMethod,
        icon: CreditCard,
        title: '카드 결제 (URL)',
        desc: '결제 링크를 카카오톡 / 이메일로 전송해 드립니다',
        color: '#60a5fa',
        badge: '가장 빠름',
    },
    {
        id: 'card_phone' as PayMethod,
        icon: Phone,
        title: '전화 카드 결제',
        desc: '담당자에게 전화로 카드번호를 알려주세요',
        color: '#c9a84c',
        badge: null,
    },
    {
        id: 'cms' as PayMethod,
        icon: Building2,
        title: 'CMS 자동출금',
        desc: '매월 자동으로 출금됩니다 (계약서 전자서명)',
        color: '#34d399',
        badge: '추천',
    },
    {
        id: 'transfer' as PayMethod,
        icon: Landmark,
        title: '계좌이체 (매월)',
        desc: '매월 안내 계좌로 직접 입금해 주세요',
        color: '#a78bfa',
        badge: null,
    },
];

// ── 계좌 정보 ──────────────────────────────────────────────
const BANK_INFO = {
    bank: '국민은행',
    account: '012-345-67890123',
    holder: '법무법인 IBS',
};

// ── 복사 함수 ──────────────────────────────────────────────
function useCopy() {
    const [copied, setCopied] = useState(false);
    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return { copied, copy };
}

// ── 상세 패널 ──────────────────────────────────────────────
function CardUrlPanel() {
    const [phone, setPhone] = useState('');
    const [sent, setSent] = useState(false);

    const handleSend = () => {
        if (!phone) return;
        setSent(true);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>
                결제 링크를 카카오톡 또는 SMS로 전송해 드립니다.
            </p>

            {!sent ? (
                <>
                    <div>
                        <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.5)' }}>
                            수신 번호 (카카오톡 / SMS)
                        </label>
                        <input value={phone} onChange={e => setPhone(e.target.value)}
                            placeholder="010-0000-0000"
                            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(96,165,250,0.25)', color: '#f0f4ff' }} />
                    </div>
                    <button onClick={handleSend} disabled={!phone}
                        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                        style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', opacity: phone ? 1 : 0.5 }}>
                        <ExternalLink className="w-4 h-4" /> 결제 링크 전송
                    </button>
                </>
            ) : (
                <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color: '#4ade80' }} />
                    <p className="font-bold text-sm" style={{ color: '#4ade80' }}>결제 링크 전송 완료!</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(240,244,255,0.5)' }}>
                        {phone} 으로 전송하였습니다. 링크를 클릭하여 결제를 완료해 주세요.
                    </p>
                </div>
            )}
        </motion.div>
    );
}

function CardPhonePanel() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>
                아래 번호로 전화하시면, 담당자가 카드번호를 안내받아 결제를 처리해 드립니다.
            </p>
            <div className="p-5 rounded-xl text-center" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <Phone className="w-8 h-8 mx-auto mb-2" style={{ color: '#c9a84c' }} />
                <p className="text-2xl font-black tracking-wider" style={{ color: '#c9a84c' }}>02-555-1234</p>
                <p className="text-xs mt-2" style={{ color: 'rgba(240,244,255,0.4)' }}>
                    평일 09:00 ~ 18:00 · 점심 12:00 ~ 13:00
                </p>
            </div>
            <a href="tel:02-555-1234">
                <button className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}>
                    <Phone className="w-4 h-4" /> 바로 전화하기
                </button>
            </a>
        </motion.div>
    );
}

function TransferPanel() {
    const { copied, copy } = useCopy();

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>
                아래 계좌로 매월 구독료를 입금해 주세요. 입금 확인 후 서비스가 활성화됩니다.
            </p>
            <div className="p-5 rounded-xl" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
                <div className="space-y-3">
                    {[
                        { label: '은행', value: BANK_INFO.bank },
                        { label: '계좌번호', value: BANK_INFO.account },
                        { label: '예금주', value: BANK_INFO.holder },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{label}</span>
                            <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={() => copy(`${BANK_INFO.bank} ${BANK_INFO.account} ${BANK_INFO.holder}`)}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}>
                {copied ? <><CheckCircle2 className="w-4 h-4" /> 복사됨!</> : <><Copy className="w-4 h-4" /> 계좌 정보 복사</>}
            </button>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)' }}>
                <p className="text-xs" style={{ color: 'rgba(251,146,60,0.8)' }}>
                    ⚠ 입금자명을 <strong>회사명</strong>으로 해주시면 빠른 확인이 가능합니다.
                </p>
            </div>
        </motion.div>
    );
}

// ── 메인 페이지 ────────────────────────────────────────────
export default function PaymentGuidePage() {
    const router = useRouter();
    const [selected, setSelected] = useState<PayMethod>(null);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(35,68,168,0.15) 0%, transparent 65%), #04091a' }}>

            <div className="w-full max-w-lg">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
                        <div className="rounded-xl flex items-center justify-center font-black text-sm"
                            style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a', width: 44, height: 44 }}>
                            IBS
                        </div>
                    </Link>
                    <h1 className="text-2xl font-black mb-2" style={{ color: '#f0f4ff' }}>결제 방법 선택</h1>
                    <p className="text-sm" style={{ color: 'rgba(240,244,255,0.4)' }}>
                        편리한 결제 방법을 선택해 주세요
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!selected ? (
                        /* ── 방법 선택 리스트 ── */
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-3">
                            {METHODS.map((m, i) => (
                                <motion.button key={m.id}
                                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.07 }}
                                    onClick={() => m.id === 'cms' ? router.push('/payment-guide/cms') : setSelected(m.id)}
                                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                                    style={{ background: `${m.color}06`, border: `1.5px solid ${m.color}20` }}>

                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${m.color}12` }}>
                                        <m.icon className="w-5 h-5" style={{ color: m.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-sm" style={{ color: m.color }}>{m.title}</p>
                                            {m.badge && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                    style={{ background: `${m.color}20`, color: m.color }}>{m.badge}</span>
                                            )}
                                        </div>
                                        <p className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>{m.desc}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: `${m.color}60` }} />
                                </motion.button>
                            ))}

                            {/* 안내 */}
                            <div className="flex items-center gap-2.5 p-4 rounded-xl mt-4"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <Shield className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(201,168,76,0.5)' }} />
                                <p className="text-xs" style={{ color: 'rgba(240,244,255,0.35)' }}>
                                    카드 온라인 결제(KCP)는 <strong style={{ color: 'rgba(240,244,255,0.6)' }}>2026년 3월 26일</strong>부터 지원 예정입니다.
                                    그 전까지 위 방법으로 결제해 주세요.
                                </p>
                            </div>

                            <button onClick={() => router.back()}
                                className="w-full py-2 text-xs mt-2" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                ← 이전으로 돌아가기
                            </button>
                        </motion.div>

                    ) : (
                        /* ── 상세 패널 ── */
                        <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <div className="p-6 rounded-2xl"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>

                                {/* 뒤로가기 + 타이틀 */}
                                <div className="flex items-center gap-3 mb-5">
                                    <button onClick={() => setSelected(null)}
                                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                                        style={{ color: 'rgba(240,244,255,0.4)' }}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <h2 className="font-black text-base" style={{ color: '#f0f4ff' }}>
                                        {METHODS.find(m => m.id === selected)?.title}
                                    </h2>
                                </div>

                                {selected === 'card_url' && <CardUrlPanel />}
                                {selected === 'card_phone' && <CardPhonePanel />}
                                {selected === 'transfer' && <TransferPanel />}

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
