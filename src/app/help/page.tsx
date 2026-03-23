'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle, Search, ChevronDown, ChevronUp, Book,
    MessageSquare, Phone, Mail, FileText, Shield,
    CreditCard, Users, ExternalLink, ArrowRight,
    CheckCircle2, Scale, Lock,
} from 'lucide-react';
import Link from 'next/link';

/* ── FAQ 데이터 ────────────────────────────────────────── */
interface FAQ {
    q: string;
    a: string;
    category: string;
}

const FAQS: FAQ[] = [
    // 서비스 이용
    { category: '서비스 이용', q: '구독 후 바로 법률 상담을 사용할 수 있나요?', a: '네, 구독 결제 완료 즉시 법률 상담 챗봇과 변호사 자문 서비스를 이용하실 수 있습니다. Pro·Premium 플랜은 전담 변호사가 48시간 이내에 배정됩니다.' },
    { category: '서비스 이용', q: '법률 자문 건수를 초과하면 어떻게 되나요?', a: '월간 자문 건수 초과 시 건당 추가 요금(33만원/건)이 발생합니다. 또는 상위 플랜으로 업그레이드하시면 더 경제적입니다.' },
    { category: '서비스 이용', q: '개인정보 진단 리포트는 얼마나 걸리나요?', a: '자동 분석은 즉시 제공되며, 변호사 검토 의견이 포함된 정밀 리포트는 영업일 기준 2~3일 소요됩니다.' },
    { category: '서비스 이용', q: '가맹점주도 서비스를 이용할 수 있나요?', a: '네, 본사가 구독 중이라면 가맹점주 및 임직원도 소속 인증 후 법률·심리 상담을 이용할 수 있습니다. 소속 코드는 본사 HR 담당자에게 문의하세요.' },
    // 결제
    { category: '결제', q: '어떤 결제 수단을 사용할 수 있나요?', a: '신용카드, 법인카드, CMS 자동이체를 지원합니다. 세금계산서 발행도 가능합니다.' },
    { category: '결제', q: '플랜 변경은 어떻게 하나요?', a: '설정 > 결제 관리에서 업그레이드 또는 다운그레이드가 가능합니다. 업그레이드는 즉시 적용되며, 다운그레이드는 현재 결제 주기 종료 후 적용됩니다.' },
    { category: '결제', q: '구독 해지 후에도 문서를 볼 수 있나요?', a: '해지 후 기존에 제공받은 리포트와 자문 기록은 90일간 열람 가능합니다. 이후에는 데이터가 삭제됩니다.' },
    // 보안
    { category: '보안', q: '상담 내용은 안전하게 보호되나요?', a: 'AES-256 암호화를 적용하며, 모든 데이터는 국내 인증(ISMS) 데이터센터에 보관됩니다. 상담 내용은 담당 변호사 외 어떤 제3자에게도 공개되지 않습니다.' },
    { category: '보안', q: '로그인 보안 설정은 어떻게 강화하나요?', a: '설정 > 보안에서 2단계 인증(OTP)을 활성화할 수 있습니다. 또한 세션 타임아웃을 15분으로 설정하면 보안이 더 강화됩니다.' },
    // 계정
    { category: '계정', q: '팀원을 추가하려면 어떻게 하나요?', a: '프로필 > 팀원 관리에서 이메일로 초대할 수 있습니다. 전 구간 최대 10명까지 지원됩니다.' },
    { category: '계정', q: '비밀번호를 잊어버렸어요.', a: '로그인 페이지에서 "비밀번호 찾기"를 클릭하시면 등록된 이메일로 재설정 링크가 발송됩니다.' },
];

const CATEGORIES = Array.from(new Set(FAQS.map(f => f.category)));

/* ── FAQ 아코디언 ───────────────────────────────────────── */
function FAQItem({ faq }: { faq: FAQ }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-xl overflow-hidden transition-all"
            style={{ border: `1px solid ${open ? '#c9a84c40' : '#f0ede6'}`, background: open ? '#fffdf8' : '#fff' }}>
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left">
                <span className="text-sm font-bold pr-4" style={{ color: '#111827' }}>{faq.q}</span>
                {open ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#c9a84c' }} />
                    : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#9ca3af' }} />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="px-4 pb-4">
                            <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{faq.a}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── 메인 페이지 ───────────────────────────────────────── */
export default function HelpPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    const filtered = FAQS.filter(f => {
        const matchSearch = !search || f.q.includes(search) || f.a.includes(search);
        const matchCat = activeCategory === 'all' || f.category === activeCategory;
        return matchSearch && matchCat;
    });

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-3xl mx-auto px-4">

                {/* 헤더 */}
                <div className="py-8 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: '#fff3cd', border: '1px solid #ffeaa7' }}>
                        <HelpCircle className="w-7 h-7" style={{ color: '#c9a84c' }} />
                    </div>
                    <h1 className="text-2xl font-black mb-2" style={{ color: '#111827' }}>도움말 센터</h1>
                    <p className="text-sm" style={{ color: '#6b7280' }}>자주 묻는 질문과 서비스 가이드를 확인하세요.</p>
                </div>

                {/* 검색 */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                    <input type="text" placeholder="질문을 검색하세요..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm"
                        style={{ background: '#fff', border: '1px solid #e8e5de', color: '#111827', outline: 'none' }}
                    />
                </div>

                {/* 빠른 링크 */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                    {[
                        { icon: <Book className="w-5 h-5" />, label: '이용 가이드', href: '/terms/service', color: '#2563eb' },
                        { icon: <CreditCard className="w-5 h-5" />, label: '결제 안내', href: '/billing', color: '#059669' },
                        { icon: <Shield className="w-5 h-5" />, label: '보안 정책', href: '/legal/privacy', color: '#7c3aed' },
                        { icon: <Phone className="w-5 h-5" />, label: '전화 문의', href: '#', color: '#c9a84c' },
                    ].map(link => (
                        <Link key={link.label} href={link.href}>
                            <div className="p-4 rounded-2xl text-center transition-all hover:shadow-md cursor-pointer"
                                style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                                    style={{ background: `${link.color}10` }}>
                                    <span style={{ color: link.color }}>{link.icon}</span>
                                </div>
                                <span className="text-xs font-bold" style={{ color: '#374151' }}>{link.label}</span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* 카테고리 필터 */}
                <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
                    <button onClick={() => setActiveCategory('all')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
                        style={{
                            background: activeCategory === 'all' ? '#111827' : '#fff',
                            color: activeCategory === 'all' ? '#fff' : '#6b7280',
                            border: `1px solid ${activeCategory === 'all' ? '#111827' : '#e8e5de'}`,
                        }}>전체</button>
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
                            style={{
                                background: activeCategory === cat ? '#f0ede6' : '#fff',
                                color: activeCategory === cat ? '#111827' : '#6b7280',
                                border: `1px solid ${activeCategory === cat ? '#d6ceb8' : '#e8e5de'}`,
                            }}>{cat}</button>
                    ))}
                </div>

                {/* FAQ 리스트 */}
                <div className="space-y-2 mb-10">
                    {filtered.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                            <FAQItem faq={f} />
                        </motion.div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center py-16 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <HelpCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#d1d5db' }} />
                            <p className="font-bold text-sm" style={{ color: '#6b7280' }}>검색 결과가 없습니다</p>
                            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>다른 키워드로 검색하거나 1:1 문의를 이용해주세요.</p>
                        </div>
                    )}
                </div>

                {/* 1:1 문의 CTA */}
                <div className="p-6 rounded-2xl text-center" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    <h3 className="font-black mb-2" style={{ color: '#111827' }}>원하는 답변을 찾지 못하셨나요?</h3>
                    <p className="text-xs mb-4" style={{ color: '#6b7280' }}>전문 상담원이 빠르게 도움을 드리겠습니다.</p>
                    <div className="flex items-center justify-center gap-3">
                        <Link href="/chat">
                            <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold"
                                style={{ background: '#111827', color: '#fff' }}>
                                <MessageSquare className="w-3.5 h-3.5" /> 1:1 채팅 문의
                            </button>
                        </Link>
                        <a href="tel:02-1234-5678">
                            <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold"
                                style={{ background: '#f8f7f4', color: '#374151', border: '1px solid #e8e5de' }}>
                                <Phone className="w-3.5 h-3.5" /> 02-1234-5678
                            </button>
                        </a>
                    </div>
                    <p className="text-[10px] mt-3" style={{ color: '#9ca3af' }}>평일 09:00 ~ 18:00 (토·일·공휴일 휴무)</p>
                </div>
            </div>
        </div>
    );
}