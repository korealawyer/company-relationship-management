'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, CheckCircle2, Clock, AlertTriangle, Eye, Edit3, Send } from 'lucide-react';
import Link from 'next/link';

const CONTRACT_TEMPLATES = [
    { id: 'service', name: '서비스 이용 계약', desc: '플랫폼 서비스 제공 계약서 표준 양식' },
    { id: 'advisory', name: '자문 계약서', desc: '법률·경영 자문 위임 계약서' },
    { id: 'franchise', name: '가맹계약서', desc: '가맹본부-가맹점 표준 계약서 (가맹사업법 준거)' },
];

function getContracts(co: string) {
    return [
        { id: 'ct1', title: `${co} 법률 자문 위임 계약`, template: '자문 계약서', status: 'both_signed', created: '2026-02-01', party: co },
        { id: 'ct2', title: '강남 123호점 가맹계약서', template: '가맹계약서', status: 'waiting_other', created: '2026-03-01', party: '김가맹 (강남 123호점)' },
        { id: 'ct3', title: '홍길동 HR팀장 서비스 이용 계약', template: '서비스 이용 계약', status: 'draft', created: '2026-03-01', party: '—' },
        { id: 'ct4', title: `${co} 개인정보 처리 위탁 계약`, template: '자문 계약서', status: 'both_signed', created: '2026-01-15', party: co },
        { id: 'ct5', title: '서초 45호점 가맹계약서', template: '가맹계약서', status: 'both_signed', created: '2025-12-10', party: '박○○ (서초 45호점)' },
        { id: 'ct6', title: `${co} 비밀유지(NDA) 계약`, template: '자문 계약서', status: 'both_signed', created: '2025-11-20', party: co },
        { id: 'ct7', title: '홍대 78호점 가맹계약서', template: '가맹계약서', status: 'waiting_other', created: '2026-03-10', party: '최○○ (홍대 78호점)' },
    ];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: '초안', color: '#94a3b8', icon: <Edit3 className="w-3 h-3" /> },
    waiting_other: { label: '서명 대기', color: '#fb923c', icon: <Clock className="w-3 h-3" /> },
    both_signed: { label: '서명 완료', color: '#4ade80', icon: <CheckCircle2 className="w-3 h-3" /> },
};

export default function ContractsPage() {
    const [showNew, setShowNew] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [contractTitle, setContractTitle] = useState('');
    const [partyEmail, setPartyEmail] = useState('');
    const [created, setCreated] = useState(false);

    // ── 세션에서 회사명 읽기 ────────────────────────────────
    const [companyName, setCompanyName] = useState('');
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem('ibs_auth_v1');
            if (raw) {
                const s = JSON.parse(raw);
                if (s?.companyName) setCompanyName(s.companyName);
            }
        } catch { /* ignore */ }
    }, []);

    const MOCK_CONTRACTS = getContracts(companyName || '(주)기업명');

    const handleCreate = () => {
        if (!selectedTemplate || !contractTitle) return;
        setCreated(true);
    };

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ background: '#f8f7f4' }}>
            <div className="max-w-5xl mx-auto px-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between py-6 mb-6"
                    style={{ borderBottom: '1px solid #e8e5de' }}>
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: '#111827' }}>전자계약</h1>
                        <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>계약서 작성·발송·서명 관리</p>
                    </div>
                    <button onClick={() => setShowNew(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#111827' }}>
                        <Plus className="w-4 h-4" /> 새 계약서
                    </button>
                </div>

                {/* 새 계약서 생성 모달 */}
                {showNew && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl mb-8"
                        style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        {!created ? (
                            <>
                                <h2 className="font-black mb-5" style={{ color: '#c9a84c' }}>새 계약서 작성</h2>
                                <div className="grid md:grid-cols-3 gap-3 mb-5">
                                    {CONTRACT_TEMPLATES.map(t => (
                                        <div key={t.id} onClick={() => setSelectedTemplate(t.id)}
                                            className="p-4 rounded-xl cursor-pointer transition-all"
                                            style={{
                                                background: selectedTemplate === t.id ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                                                border: `2px solid ${selectedTemplate === t.id ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                            }}>
                                            <div className="font-bold text-sm mb-1" style={{ color: selectedTemplate === t.id ? '#c9a84c' : '#374151' }}>{t.name}</div>
                                            <div className="text-xs" style={{ color: '#6b7280' }}>{t.desc}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid md:grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>계약서 제목</label>
                                        <input value={contractTitle} onChange={e => setContractTitle(e.target.value)}
                                            placeholder="예: 2026년 법률 자문 위임 계약"
                                            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                                            style={{ background: '#f3f4f6', border: '1px solid #e8e5de', color: '#111827' }} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1.5" style={{ color: '#374151' }}>상대방 이메일 (서명 요청)</label>
                                        <input value={partyEmail} onChange={e => setPartyEmail(e.target.value)}
                                            placeholder="상대방 이메일 (나중에 추가 가능)"
                                            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                                            style={{ background: '#f3f4f6', border: '1px solid #e8e5de', color: '#111827' }} />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleCreate}
                                        className="px-6 py-2.5 rounded-xl font-bold text-sm"
                                        style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#111827' }}>
                                        계약서 생성
                                    </button>
                                    <button onClick={() => setShowNew(false)}
                                        className="px-6 py-2.5 rounded-xl font-bold text-sm"
                                        style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                        취소
                                    </button>
                                </div>
                            </>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#4ade80' }} />
                                <h3 className="font-black text-lg mb-2" style={{ color: '#4ade80' }}>계약서 생성 완료!</h3>
                                <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                                    서명 링크가 생성되었습니다. 상대방에게 링크를 전송하세요.
                                </p>
                                <div className="p-3 rounded-xl mb-4 text-left"
                                    style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                                    <p className="text-xs font-bold mb-1" style={{ color: '#4ade80' }}>서명 링크 (복사 후 발송)</p>
                                    <p className="text-xs font-mono break-all" style={{ color: '#374151' }}>
                                        https://app.ibslaw.co.kr/contracts/sign/{Math.random().toString(36).slice(2, 10)}
                                    </p>
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                                        style={{ background: '#fef3c7', color: '#c9a84c', border: '1px solid #c9a84c' }}>
                                        <Send className="w-4 h-4" /> 이메일로 발송
                                    </button>
                                    <button onClick={() => { setShowNew(false); setCreated(false); setSelectedTemplate(''); setContractTitle(''); }}
                                        className="px-5 py-2.5 rounded-xl font-bold text-sm"
                                        style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                        닫기
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* 계약서 목록 */}
                <div className="space-y-3">
                    {MOCK_CONTRACTS.map(c => {
                        const s = STATUS_MAP[c.status];
                        return (
                            <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="p-5 rounded-2xl flex items-center gap-5"
                                style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                <div className="p-2.5 rounded-xl" style={{ background: '#fef3c7' }}>
                                    <FileText className="w-5 h-5" style={{ color: '#c9a84c' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm mb-0.5" style={{ color: '#111827' }}>{c.title}</div>
                                    <div className="text-xs" style={{ color: '#6b7280' }}>
                                        {c.template} · {c.party} · {c.created}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold"
                                        style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}>
                                        {s.icon} {s.label}
                                    </span>
                                    <Link href={`/contracts/${c.id}`}>
                                        <button className="p-2 rounded-xl transition-all"
                                            style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <p className="text-center text-xs mt-8" style={{ color: '#d1d5db' }}>
                    Phase 2: 모두사인·DocuSign API 연동 시 전자서명 법적 효력 강화
                </p>
            </div>
        </div>
    );
}
