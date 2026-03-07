'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Search, MessageSquare, FileText, Scale, CreditCard, Shield, Users, Mail } from 'lucide-react';
import Link from 'next/link';

const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

interface FAQ {
    q: string;
    a: string;
    category: string;
}

const FAQS: FAQ[] = [
    // 서비스 소개
    { category: '서비스', q: 'IBS 법률사무소는 어떤 서비스를 제공하나요?', a: '프랜차이즈 본부를 위한 종합 법률 자문 서비스를 제공합니다. AI 기반 개인정보처리방침 분석, 전담 변호사 배정, 계약서 검토, 가맹사업법 컴플라이언스 자문, EAP(심리상담) 등을 모두 제공합니다.' },
    { category: '서비스', q: 'AI 분석은 정확한가요?', a: 'AI 분석은 1차 스크리닝 용도로 사용됩니다. 모든 AI 분석 결과는 반드시 전담 변호사가 교차 검증하여 최종 검토합니다. AI + 변호사 이중 검증으로 높은 정확도를 보장합니다.' },
    { category: '서비스', q: '무료 분석은 어떻게 받나요?', a: '홈페이지에서 회사명 또는 사업자번호를 검색하면 즉시 1차 AI 분석을 받으실 수 있습니다. 무료 분석에서는 주요 위험 이슈 2건까지 열람 가능합니다.' },
    // 요금
    { category: '요금', q: '요금제는 어떻게 되나요?', a: 'Basic(월 99만원), Pro(월 249만원), Premium(월 499만원) 3가지 플랜을 제공합니다. Basic은 AI 분석 + 변호사 검토, Pro는 무제한 자문 + EAP, Premium은 전담팀 배정 + 경영자문을 포함합니다.' },
    { category: '요금', q: '결제 방법은 무엇인가요?', a: '신용카드, 무통장입금, 계좌이체를 지원합니다. 월 자동결제 및 연 일시불 결제(10% 할인)가 가능합니다.' },
    { category: '요금', q: '환불 정책은 어떤가요?', a: '서비스 시작 후 7일 이내 100% 환불, 30일 이내 50% 환불이 가능합니다. 단, 이미 제공된 법률 자문 건수에 따라 차감될 수 있습니다.' },
    // 법률
    { category: '법률', q: '개인정보처리방침을 왜 검토해야 하나요?', a: '개인정보 보호법 위반 시 최대 매출액의 3%까지 과징금이 부과될 수 있습니다. 특히 프랜차이즈 본부는 가맹점 직원·고객의 개인정보를 처리하므로 더욱 철저한 관리가 필요합니다.' },
    { category: '법률', q: '가맹사업법 관련 자문도 가능한가요?', a: '네, 가맹사업법 전문 변호사가 정보공개서 검토, 가맹계약서 검토, 분쟁 조정, 공정거래위원회 대응 등 모든 가맹사업법 관련 자문을 제공합니다.' },
    // 기술
    { category: '기술', q: '어떤 AI 기술을 사용하나요?', a: 'Claude, GPT-4o, Gemini 등 최신 AI 모델을 활용합니다. RAG(검색 증강 생성) 기술로 한국 법률 조문을 참조하여 법적 근거가 있는 분석을 제공합니다.' },
    { category: '기술', q: '데이터는 안전하게 관리되나요?', a: '모든 데이터는 암호화 저장되며, AWS 서울 리전에서 운영됩니다. SOC 2 Type II 준수, 개인정보 보호법 제29조에 따른 안전조치 기준을 적용합니다.' },
    // 계정
    { category: '계정', q: '팀원을 추가할 수 있나요?', a: 'Pro 플랜은 최대 5명, Premium 플랜은 무제한 팀원 추가가 가능합니다. 각 팀원에게 역할(HR 담당, 법무 담당 등)을 지정할 수 있습니다.' },
    { category: '계정', q: '비밀번호를 잊어버렸어요', a: '로그인 페이지에서 "비밀번호 찾기"를 클릭하신 후 가입 시 사용한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.' },
];

const CATEGORIES = ['전체', '서비스', '요금', '법률', '기술', '계정'];

export default function HelpPage() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('전체');
    const [openId, setOpenId] = useState<string | null>(null);

    const filtered = FAQS.filter(faq => {
        const matchCat = category === '전체' || faq.category === category;
        const matchSearch = !search || faq.q.includes(search) || faq.a.includes(search);
        return matchCat && matchSearch;
    });

    return (
        <div className="min-h-screen py-8 px-4" style={{ background: T.bg }}>
            <div className="max-w-3xl mx-auto">

                {/* 헤더 */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black flex items-center justify-center gap-2 mb-2" style={{ color: T.heading }}>
                        <HelpCircle className="w-6 h-6" style={{ color: '#6366f1' }} />
                        도움말 & FAQ
                    </h1>
                    <p className="text-sm" style={{ color: T.muted }}>자주 묻는 질문과 서비스 가이드</p>
                </div>

                {/* 검색 */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.faint }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="질문을 검색하세요..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body }} />
                </div>

                {/* 카테고리 필터 */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setCategory(c)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background: category === c ? '#6366f1' : T.card,
                                color: category === c ? '#fff' : T.muted,
                                border: `1px solid ${category === c ? '#6366f1' : T.border}`,
                            }}>
                            {c}
                        </button>
                    ))}
                </div>

                {/* FAQ 아코디언 */}
                <div className="space-y-2 mb-8">
                    {filtered.map((faq, i) => {
                        const isOpen = openId === `${faq.category}-${i}`;
                        return (
                            <motion.div key={`${faq.category}-${i}`} layout
                                className="rounded-xl overflow-hidden"
                                style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                                <button onClick={() => setOpenId(isOpen ? null : `${faq.category}-${i}`)}
                                    className="w-full flex items-center justify-between p-4 text-left">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
                                            style={{ background: '#eef2ff', color: '#6366f1' }}>{faq.category}</span>
                                        <span className="text-sm font-bold truncate" style={{ color: T.heading }}>{faq.q}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                        style={{ color: T.faint }} />
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="px-4 pb-4 pt-0">
                                                <div className="p-3 rounded-lg text-sm leading-relaxed"
                                                    style={{ background: T.bg, color: T.body }}>
                                                    {faq.a}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <HelpCircle className="w-8 h-8 mx-auto mb-2" style={{ color: T.faint }} />
                            <p className="text-sm" style={{ color: T.muted }}>검색 결과가 없습니다</p>
                        </div>
                    )}
                </div>

                {/* 추가 도움말 링크 */}
                <div className="grid sm:grid-cols-3 gap-3">
                    {[
                        { href: '/chat', icon: MessageSquare, label: 'AI 상담', desc: 'AI에게 직접 질문하기', color: '#6366f1' },
                        { href: '/sales', icon: Mail, label: '전문 상담 신청', desc: '변호사 상담 예약', color: '#10b981' },
                        { href: '/pricing', icon: CreditCard, label: '요금제 안내', desc: '플랜 비교 & 구독', color: '#f59e0b' },
                    ].map(({ href, icon: Icon, label, desc, color }) => (
                        <Link key={href} href={href}>
                            <div className="p-4 rounded-xl text-center transition-all hover:shadow-md cursor-pointer"
                                style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                                <Icon className="w-6 h-6 mx-auto mb-2" style={{ color }} />
                                <p className="text-sm font-bold" style={{ color: T.heading }}>{label}</p>
                                <p className="text-xs" style={{ color: T.muted }}>{desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
