'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, Clock, AlertTriangle, ArrowLeft, Send, Shield } from 'lucide-react';
import Link from 'next/link';

// 계약서 서명 상세 페이지 (공개 URL로 접근 가능)
const MOCK_CONTRACT = {
    id: 'ct2',
    title: '강남 123호점 가맹계약서',
    template: '가맹계약서',
    created: '2026-03-01',
    party_a: 'IBS 법률사무소',
    party_b: '(주)놀부NBG',
    content: `제1조 (목적)
본 계약은 갑(가맹본부)과 을(가맹점사업자) 간 가맹점 운영에 관한 권리·의무 관계를 규정함을 목적으로 한다.

제2조 (가맹금)
가맹금은 일금 오천만원(₩50,000,000)으로 하며, 계약 체결 시 전액 납부한다.

제3조 (영업지역)
을의 영업지역은 서울시 강남구 역삼동 일원으로 하며, 갑은 동 지역 내 추가 가맹점을 허용하지 아니한다.

제4조 (계약 기간)
본 계약의 유효기간은 계약 체결일로부터 5년으로 한다.

제5조 (비밀유지)
을은 계약 기간 중 및 계약 종료 후 2년간 갑의 영업비밀을 누설하여서는 아니 된다.`,
    status: 'waiting_other',
    a_signed: true,
    a_signed_at: '2026-03-01 09:30',
    b_signed: false,
};

export default function ContractDetailPage({ params }: { params: { id: string } }) {
    const [name, setName] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [signed, setSigned] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSign = async () => {
        if (!name || !agreed) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 1200));
        setSigned(true);
        setLoading(false);
    };

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ background: '#04091a' }}>
            <div className="max-w-3xl mx-auto px-4">
                <Link href="/contracts">
                    <button className="flex items-center gap-2 text-sm mb-6 mt-4"
                        style={{ color: 'rgba(240,244,255,0.5)' }}>
                        <ArrowLeft className="w-4 h-4" /> 목록으로
                    </button>
                </Link>

                {/* 계약서 메타 */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl mb-6"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(201,168,76,0.12)' }}>
                            <FileText className="w-6 h-6" style={{ color: '#c9a84c' }} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black mb-1" style={{ color: '#f0f4ff' }}>{MOCK_CONTRACT.title}</h1>
                            <p className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                {MOCK_CONTRACT.template} · 작성일 {MOCK_CONTRACT.created}
                            </p>
                            <div className="flex gap-4 mt-3">
                                <div className="flex items-center gap-1.5">
                                    {MOCK_CONTRACT.a_signed
                                        ? <CheckCircle2 className="w-4 h-4" style={{ color: '#4ade80' }} />
                                        : <Clock className="w-4 h-4" style={{ color: '#94a3b8' }} />}
                                    <span className="text-xs" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                        {MOCK_CONTRACT.party_a} {MOCK_CONTRACT.a_signed ? `서명 완료 (${MOCK_CONTRACT.a_signed_at})` : '서명 대기'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {MOCK_CONTRACT.b_signed || signed
                                        ? <CheckCircle2 className="w-4 h-4" style={{ color: '#4ade80' }} />
                                        : <Clock className="w-4 h-4" style={{ color: '#fb923c' }} />}
                                    <span className="text-xs" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                        {MOCK_CONTRACT.party_b} {MOCK_CONTRACT.b_signed || signed ? '서명 완료' : '서명 대기'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 계약서 본문 */}
                <div className="p-6 rounded-2xl mb-6"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <h2 className="font-bold text-sm mb-4" style={{ color: 'rgba(240,244,255,0.6)' }}>계약서 내용</h2>
                    <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(240,244,255,0.85)', fontFamily: 'inherit' }}>
                        {MOCK_CONTRACT.content}
                    </pre>
                </div>

                {/* 서명 섹션 */}
                {!signed ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.2)' }}>
                        <div className="flex items-center gap-2 mb-5">
                            <Shield className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            <h2 className="font-black" style={{ color: '#c9a84c' }}>전자 서명</h2>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.7)' }}>서명자 이름</label>
                            <input value={name} onChange={e => setName(e.target.value)}
                                placeholder="서명할 이름을 입력하세요"
                                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }} />
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer mb-5">
                            <div onClick={() => setAgreed(a => !a)}
                                className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
                                style={{ background: agreed ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${agreed ? '#4ade80' : 'rgba(255,255,255,0.15)'}` }}>
                                {agreed && <CheckCircle2 className="w-3 h-3" style={{ color: '#4ade80' }} />}
                            </div>
                            <span className="text-sm" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                위 계약 내용을 충분히 읽고 이해하였으며, 전자서명에 동의합니다. 본 전자서명은 법적 효력을 가집니다.
                            </span>
                        </label>
                        <button onClick={handleSign} disabled={!name || !agreed || loading}
                            className="w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                            {loading ? '처리 중...' : <><Send className="w-5 h-5" /> 서명 완료</>}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="p-8 rounded-2xl text-center"
                        style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#4ade80' }} />
                        <h2 className="text-2xl font-black mb-2" style={{ color: '#4ade80' }}>서명 완료!</h2>
                        <p className="text-sm mb-4" style={{ color: 'rgba(240,244,255,0.6)' }}>
                            양쪽 서명이 모두 완료되었습니다.<br />
                            계약서 PDF가 이메일로 발송되었습니다.
                        </p>
                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>
                            서명 일시: {new Date().toLocaleString('ko-KR')} · IP: 보안 처리됨
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
