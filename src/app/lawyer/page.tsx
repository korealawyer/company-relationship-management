'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, FileText, MessageSquare, CheckCircle2, AlertTriangle, Bot, Send, Loader2, Phone, Edit3, User, ArrowRight } from 'lucide-react';

interface CompanyCase { id: string; company: string; category: string; urgency: 'urgent' | 'normal'; status: 'submitted' | 'ai_done' | 'in_review' | 'answered'; assignedLawyer?: string; done: number; total: number; lastUpdate: string; }
interface ConsultItem { id: string; companyName: string; category: string; urgency: 'urgent' | 'normal'; title: string; content: string; aiDraft: string; created: string; }

const CASES: CompanyCase[] = [
    { id: 'c1', company: '(주)놀부NBG', category: '가맹계약', urgency: 'urgent', status: 'ai_done', assignedLawyer: '박민준 변호사', done: 2, total: 5, lastUpdate: '방금' },
    { id: 'c2', company: '(주)BBQ', category: '개인정보', urgency: 'normal', status: 'in_review', assignedLawyer: '박민준 변호사', done: 1, total: 3, lastUpdate: '1시간 전' },
    { id: 'c3', company: '(주)메가커피', category: '노무', urgency: 'normal', status: 'submitted', done: 0, total: 2, lastUpdate: '3시간 전' },
    { id: 'c4', company: '(주)교촌치킨', category: '형사', urgency: 'urgent', status: 'answered', assignedLawyer: '박민준 변호사', done: 1, total: 1, lastUpdate: '어제' },
];

const CONSULTS: ConsultItem[] = [
    { id: 'q1', companyName: '(주)놀부NBG', category: '가맹계약', urgency: 'urgent', title: '가맹계약 중도 해지 통보 대응', content: '본사에서 계약 해지를 요구하고 있습니다. 계약서 제8조 위약금이 200%인데 유효한가요?', aiDraft: '가맹사업법 제14조에 따라 즉시 해지 통보는 무효입니다. 위약금 200%는 감액 청구 가능합니다. 시정 기간 2개월 주장을 권고합니다.', created: '2026-03-01 09:00' },
    { id: 'q2', companyName: '(주)BBQ', category: '개인정보', urgency: 'normal', title: '배달앱 연동 개인정보 처리방침', content: '배달앱과 연동하여 고객 정보를 수집하는데 처리방침에 무엇을 추가해야 하나요?', aiDraft: '제3자 제공 시 별도 동의 필요. 수집항목·보유기간·제3자 제공 현황을 명시해야 합니다.', created: '2026-03-01 08:00' },
    { id: 'q3', companyName: '(주)메가커피', category: '노무', urgency: 'normal', title: '암묵적 초과근무 수당 지급', content: '교대 변경 시 15~20분 초과근무가 발생하는데 수당을 지급해야 하나요?', aiDraft: '', created: '2026-03-01 07:00' },
];

const STATUS_COLOR: Record<string, string> = { submitted: '#94a3b8', ai_done: '#818cf8', in_review: '#fb923c', answered: '#4ade80' };
const STATUS_LBL: Record<string, string> = { submitted: '접수', ai_done: 'AI완료', in_review: '검토중', answered: '답변완료' };

function ConsultQueue() {
    const [sel, setSel] = useState<ConsultItem | null>(CONSULTS[0]);
    const [note, setNote] = useState('');
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setDone(true); setLoading(false);
    };

    return (
        <div className="flex h-full">
            <div className="w-72 flex-shrink-0 overflow-y-auto" style={{ borderRight: '1px solid rgba(201,168,76,0.1)' }}>
                <div className="p-3 text-xs font-bold" style={{ color: 'rgba(240,244,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>상담 접수 목록</div>
                {CONSULTS.map(c => (
                    <div key={c.id} onClick={() => { setSel(c); setDone(false); setNote(''); }}
                        className="p-4 cursor-pointer transition-all"
                        style={{ background: sel?.id === c.id ? 'rgba(201,168,76,0.08)' : 'transparent', borderLeft: sel?.id === c.id ? '2px solid #c9a84c' : '2px solid transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="flex justify-between mb-1">
                            <span className="text-xs font-bold" style={{ color: c.urgency === 'urgent' ? '#f87171' : '#94a3b8' }}>{c.urgency === 'urgent' ? '🔴 긴급' : '⚪ 일반'}</span>
                            <span className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>{c.created.slice(5)}</span>
                        </div>
                        <p className="text-sm font-bold truncate mb-0.5" style={{ color: '#f0f4ff' }}>{c.title}</p>
                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{c.companyName} · {c.category}</p>
                    </div>
                ))}
            </div>
            {sel && (
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div>
                        <h2 className="text-lg font-black mb-3" style={{ color: '#f0f4ff' }}>{sel.title}</h2>
                        <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(240,244,255,0.8)', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>{sel.content}</div>
                    </div>
                    {sel.aiDraft ? (
                        <div>
                            <div className="flex items-center gap-2 mb-2"><Bot className="w-4 h-4" style={{ color: '#818cf8' }} /><span className="text-sm font-bold" style={{ color: '#818cf8' }}>AI 1차 분석</span></div>
                            <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(129,140,248,0.08)', color: 'rgba(240,244,255,0.85)', border: '1px solid rgba(129,140,248,0.2)' }}>{sel.aiDraft}</div>
                        </div>
                    ) : <div className="p-4 rounded-xl text-center text-sm" style={{ color: 'rgba(240,244,255,0.3)' }}>AI 분석 준비 중...</div>}
                    {!done ? (
                        <div>
                            <div className="flex items-center gap-2 mb-2"><Scale className="w-4 h-4" style={{ color: '#c9a84c' }} /><span className="text-sm font-bold" style={{ color: '#c9a84c' }}>변호사 검토 답변</span></div>
                            <textarea value={note} onChange={e => setNote(e.target.value)} rows={6}
                                placeholder="AI 초안을 수정하거나 직접 답변을 작성하세요..."
                                className="w-full p-4 rounded-xl outline-none text-sm resize-none"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', color: '#f0f4ff', lineHeight: 1.7 }} />
                            {sel.aiDraft && !note && (
                                <button onClick={() => setNote(sel.aiDraft)} className="text-xs mt-1 flex items-center gap-1" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                    <Edit3 className="w-3 h-3" /> AI 초안 가져오기
                                </button>
                            )}
                            <div className="flex gap-3 mt-4">
                                <button onClick={submit} disabled={loading || !note.trim()}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40"
                                    style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 답변 발송
                                </button>
                                {sel.urgency === 'urgent' && (
                                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                                        style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                                        <Phone className="w-4 h-4" /> 콜백 예약
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="p-6 rounded-xl text-center"
                            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color: '#4ade80' }} />
                            <p className="font-bold" style={{ color: '#4ade80' }}>답변이 고객사에 발송되었습니다</p>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function LawyerPage() {
    const [tab, setTab] = useState<'overview' | 'consult' | 'contracts'>('overview');
    const [search, setSearch] = useState('');

    const filtered = CASES.filter(c => !search || c.company.includes(search) || c.category.includes(search));
    const STATS = [
        { label: '배정 케이스', value: CASES.length, color: '#c9a84c' },
        { label: '긴급 처리', value: CASES.filter(c => c.urgency === 'urgent').length, color: '#f87171' },
        { label: '처리 완료', value: CASES.filter(c => c.status === 'answered').length, color: '#4ade80' },
        { label: '대기 중', value: CASES.filter(c => c.status === 'submitted').length, color: '#fb923c' },
    ];
    const TABS = [
        { id: 'overview' as const, label: '케이스 현황', icon: Scale },
        { id: 'consult' as const, label: '상담 검토', icon: MessageSquare },
        { id: 'contracts' as const, label: '계약서 검토', icon: FileText },
    ];

    return (
        <div className="min-h-screen" style={{ background: '#04091a' }}>
            <div className="fixed top-20 left-0 bottom-0 w-16 flex flex-col items-center gap-3 py-6 z-40"
                style={{ background: 'rgba(13,27,62,0.9)', borderRight: '1px solid rgba(201,168,76,0.1)' }}>
                {TABS.map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setTab(id)} title={label}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                        style={{ background: tab === id ? 'rgba(201,168,76,0.2)' : 'transparent', color: tab === id ? '#c9a84c' : 'rgba(240,244,255,0.4)' }}>
                        <Icon className="w-5 h-5" />
                    </button>
                ))}
            </div>
            <div className="pl-16 pt-20 h-screen flex flex-col">
                <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: 'rgba(4,9,26,0.8)' }}>
                    <div>
                        <h1 className="font-black text-lg" style={{ color: '#f0f4ff' }}>{TABS.find(t => t.id === tab)?.label}</h1>
                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>박민준 변호사 · IBS 법률사무소</p>
                    </div>
                    {tab === 'overview' && (
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="고객사·카테고리 검색..." className="px-4 py-2 rounded-xl outline-none text-sm w-56"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }} />
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    {tab === 'consult' ? (
                        <div className="h-full"><ConsultQueue /></div>
                    ) : (
                        <div className="h-full overflow-y-auto p-6">
                            {tab === 'overview' && (
                                <>
                                    <div className="grid grid-cols-4 gap-4 mb-6">
                                        {STATS.map(({ label, value, color }) => (
                                            <div key={label} className="p-4 rounded-xl"
                                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                <div className="text-2xl font-black" style={{ color }}>{value}</div>
                                                <div className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>{label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {filtered.map(c => {
                                            const pct = c.total > 0 ? (c.done / c.total) * 100 : 0;
                                            return (
                                                <motion.div key={c.id} layout whileHover={{ scale: 1.01 }}
                                                    className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {c.urgency === 'urgent' && <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />}
                                                            <span className="font-black text-sm" style={{ color: '#f0f4ff' }}>{c.company}</span>
                                                        </div>
                                                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                                            style={{ background: `${STATUS_COLOR[c.status]}15`, color: STATUS_COLOR[c.status] }}>
                                                            {STATUS_LBL[c.status]}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(240,244,255,0.45)' }}>
                                                        <span>{c.category} · {c.assignedLawyer || '배정 전'}</span>
                                                        <span>{c.done}/{c.total} 완료</span>
                                                    </div>
                                                    <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? '#4ade80' : 'linear-gradient(90deg,#e8c87a,#c9a84c)' }} />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                            {tab === 'contracts' && (
                                <div className="text-center py-20">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: '#c9a84c' }} />
                                    <p className="font-bold mb-2" style={{ color: 'rgba(240,244,255,0.6)' }}>계약서 AI 검토 대기</p>
                                    <a href="/legal/review">
                                        <button className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl font-bold text-sm"
                                            style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}>
                                            계약서 검토 페이지로 <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
