'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, FileText, MessageSquare, CheckCircle2, AlertTriangle, Bot, Send, Loader2, Phone, Edit3, ArrowRight, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { store, type Company } from '@/lib/mockStore';

interface ConsultItem { id: string; companyName: string; category: string; urgency: 'urgent' | 'normal'; title: string; content: string; aiDraft: string; created: string; }

const CONSULTS: ConsultItem[] = [
    { id: 'q1', companyName: '(주)놀부NBG', category: '가맹계약', urgency: 'urgent', title: '가맹계약 중도 해지 통보 대응', content: '본사에서 계약 해지를 요구하고 있습니다. 계약서 제8조 위약금이 200%인데 유효한가요?', aiDraft: '가맹사업법 제14조에 따라 즉시 해지 통보는 무효입니다. 위약금 200%는 감액 청구 가능합니다. 시정 기간 2개월 주장을 권고합니다.', created: '2026-03-01 09:00' },
    { id: 'q2', companyName: '(주)BBQ', category: '개인정보', urgency: 'normal', title: '배달앱 연동 개인정보 처리방침', content: '배달앱과 연동하여 고객 정보를 수집하는데 처리방침에 무엇을 추가해야 하나요?', aiDraft: '제3자 제공 시 별도 동의 필요. 수집항목·보유기간·제3자 제공 현황을 명시해야 합니다.', created: '2026-03-01 08:00' },
    { id: 'q3', companyName: '(주)메가커피', category: '노무', urgency: 'normal', title: '암묵적 초과근무 수당 지급', content: '교대 변경 시 15~20분 초과근무가 발생하는데 수당을 지급해야 하나요?', aiDraft: '', created: '2026-03-01 07:00' },
];

const LEVEL_COLOR: Record<string, { text: string; bg: string; border: string }> = {
    HIGH: { text: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
    MEDIUM: { text: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    LOW: { text: '#16a34a', bg: '#dcfce7', border: '#86efac' },
};
const STATUS_META: Record<string, { text: string; bg: string }> = {
    assigned: { text: '#d97706', bg: '#fffbeb' },
    reviewing: { text: '#d97706', bg: '#fef9ec' },
    sales_confirmed: { text: '#7c3aed', bg: '#f5f3ff' },
};
const STATUS_LBL: Record<string, string> = { assigned: '배정됨', reviewing: '검토중', sales_confirmed: '영업컨펌' };

// ── 상담 검토 패널 ──────────────────────────────────────────
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
        <div className="flex h-full" style={{ background: '#f8f9fc' }}>
            <div className="w-72 flex-shrink-0 overflow-y-auto" style={{ borderRight: '1px solid #e5e7eb', background: '#ffffff' }}>
                <div className="p-3 text-xs font-bold" style={{ color: '#94a3b8', borderBottom: '1px solid #e5e7eb' }}>상담 접수 목록</div>
                {CONSULTS.map(c => (
                    <div key={c.id} onClick={() => { setSel(c); setDone(false); setNote(''); }}
                        className="p-4 cursor-pointer transition-all"
                        style={{ background: sel?.id === c.id ? '#fffbeb' : 'transparent', borderLeft: sel?.id === c.id ? '2px solid #c9a84c' : '2px solid transparent', borderBottom: '1px solid #f1f5f9' }}>
                        <div className="flex justify-between mb-1">
                            <span className="text-xs font-bold" style={{ color: c.urgency === 'urgent' ? '#dc2626' : '#94a3b8' }}>{c.urgency === 'urgent' ? '🔴 긴급' : '⚪ 일반'}</span>
                            <span className="text-xs" style={{ color: '#94a3b8' }}>{c.created.slice(5)}</span>
                        </div>
                        <p className="text-sm font-bold truncate mb-0.5" style={{ color: '#1e293b' }}>{c.title}</p>
                        <p className="text-xs" style={{ color: '#64748b' }}>{c.companyName} · {c.category}</p>
                    </div>
                ))}
            </div>
            {sel && (
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div>
                        <h2 className="text-lg font-black mb-3" style={{ color: '#1e293b' }}>{sel.title}</h2>
                        <div className="p-4 rounded-xl text-sm" style={{ background: '#f8f9fc', color: '#475569', borderLeft: '2px solid #e5e7eb' }}>{sel.content}</div>
                    </div>
                    {sel.aiDraft ? (
                        <div>
                            <div className="flex items-center gap-2 mb-2"><Bot className="w-4 h-4" style={{ color: '#6366f1' }} /><span className="text-sm font-bold" style={{ color: '#6366f1' }}>AI 1차 분석</span></div>
                            <div className="p-4 rounded-xl text-sm" style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>{sel.aiDraft}</div>
                        </div>
                    ) : <div className="p-4 rounded-xl text-center text-sm" style={{ color: '#94a3b8', background: '#f8f9fc', border: '1px solid #e5e7eb' }}>AI 분석 준비 중...</div>}
                    {!done ? (
                        <div>
                            <div className="flex items-center gap-2 mb-2"><Scale className="w-4 h-4" style={{ color: '#b8960a' }} /><span className="text-sm font-bold" style={{ color: '#b8960a' }}>변호사 검토 답변</span></div>
                            <textarea value={note} onChange={e => setNote(e.target.value)} rows={6}
                                placeholder="AI 초안을 수정하거나 직접 답변을 작성하세요..."
                                className="w-full p-4 rounded-xl outline-none text-sm resize-none"
                                style={{ background: '#ffffff', border: '1px solid #fde68a', color: '#1e293b', lineHeight: 1.7 }} />
                            {sel.aiDraft && !note && (
                                <button onClick={() => setNote(sel.aiDraft)} className="text-xs mt-1 flex items-center gap-1" style={{ color: '#94a3b8' }}>
                                    <Edit3 className="w-3 h-3" /> AI 초안 가져오기
                                </button>
                            )}
                            <div className="flex gap-3 mt-4">
                                <button onClick={submit} disabled={loading || !note.trim()}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40"
                                    style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#78350f' }}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 답변 발송
                                </button>
                                {sel.urgency === 'urgent' && (
                                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                        <Phone className="w-4 h-4" /> 콜백 예약
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="p-6 rounded-xl text-center"
                            style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color: '#16a34a' }} />
                            <p className="font-bold" style={{ color: '#16a34a' }}>답변이 고객사에 발송되었습니다</p>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── 검토 대기 문서 목록 ────────────────────────────────────
function ReviewDocList({ cases }: { cases: Company[] }) {
    const pending = cases.filter(c => ['assigned', 'reviewing', 'sales_confirmed'].includes(c.status));

    if (pending.length === 0) {
        return (
            <div className="p-8 rounded-2xl text-center" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: '#16a34a' }} />
                <p className="text-sm" style={{ color: '#94a3b8' }}>검토 대기 문서가 없습니다</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {pending.map((c, idx) => {
                const highIssues = c.issues.filter(i => i.level === 'HIGH' && !i.reviewChecked);
                const totalIssues = c.issues.filter(i => !i.reviewChecked);
                const isUrgent = highIssues.length > 0;
                const sm = STATUS_META[c.status] ?? { text: '#64748b', bg: '#f1f5f9' };
                return (
                    <motion.div key={c.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-2xl flex items-center gap-4 group"
                        style={{ background: '#ffffff', border: `1px solid ${isUrgent ? '#fca5a5' : '#e5e7eb'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        {/* 긴급 마커 */}
                        <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: isUrgent ? '#dc2626' : '#c9a84c' }} />

                        {/* 이슈 레벨 배지들 */}
                        <div className="flex flex-col gap-1 flex-shrink-0 w-20">
                            {(['HIGH', 'MEDIUM', 'LOW'] as const).map(level => {
                                const cnt = c.issues.filter(i => i.level === level && !i.reviewChecked).length;
                                if (!cnt) return null;
                                const lc = LEVEL_COLOR[level];
                                return (
                                    <span key={level} className="text-[10px] px-1.5 py-0.5 rounded font-black text-center border"
                                        style={{ background: lc.bg, color: lc.text, borderColor: lc.border }}>
                                        {level} ×{cnt}
                                    </span>
                                );
                            })}
                        </div>

                        {/* 회사 정보 */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                {isUrgent && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#dc2626' }} />}
                                <p className="font-black text-sm truncate" style={{ color: '#1e293b' }}>{c.name}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                    style={{ background: sm.bg, color: sm.text }}>
                                    {STATUS_LBL[c.status] ?? c.status}
                                </span>
                                <span className="text-xs font-medium" style={{ color: '#64748b' }}>
                                    {c.url || c.biz} · 미검토 {totalIssues.length}건
                                </span>
                            </div>
                        </div>

                        {/* 마지막 업데이트 */}
                        <div className="flex items-center gap-1 flex-shrink-0 text-xs font-medium" style={{ color: '#64748b' }}>
                            <Clock className="w-3 h-3" />
                            {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}
                        </div>

                        {/* 검토하기 버튼 */}
                        <Link href="/lawyer/privacy-review" className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>
                            검토 <ChevronRight className="w-3 h-3" />
                        </Link>
                    </motion.div>
                );
            })}
        </div>
    );
}

export default function LawyerPage() {
    const [tab, setTab] = useState<'overview' | 'consult' | 'contracts'>('overview');
    const [search, setSearch] = useState('');
    const [cases, setCases] = useState<Company[]>([]);

    useEffect(() => {
        setCases(store.getAll());
    }, []);

    const assignedCases = cases.filter(c => ['assigned', 'reviewing', 'sales_confirmed'].includes(c.status));
    const filtered = assignedCases.filter(c => !search || c.name.includes(search) || c.biz.includes(search));
    const urgentCount = assignedCases.filter(c => c.issues.some(i => i.level === 'HIGH' && !i.reviewChecked)).length;

    const STATS = [
        { label: '검토 대기', value: assignedCases.length, color: '#b8960a', bg: '#fffbeb' },
        { label: '긴급 이슈', value: urgentCount, color: '#dc2626', bg: '#fef2f2' },
        { label: '검토 완료', value: cases.filter(c => c.lawyerConfirmed).length, color: '#16a34a', bg: '#f0fdf4' },
        { label: '미검토 이슈', value: cases.reduce((s, c) => s + c.issues.filter(i => !i.reviewChecked).length, 0), color: '#d97706', bg: '#fffbeb' },
    ];
    const TABS = [
        { id: 'overview' as const, label: '검토 대기 문서', icon: Scale },
        { id: 'consult' as const, label: '상담 검토', icon: MessageSquare },
        { id: 'contracts' as const, label: '계약서 검토', icon: FileText },
    ];

    return (
        <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
            {/* 사이드바 */}
            <div className="fixed top-20 left-0 bottom-0 w-16 flex flex-col items-center gap-3 py-6 z-40"
                style={{ background: '#ffffff', borderRight: '1px solid #e5e7eb', boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>
                {TABS.map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setTab(id)} title={label}
                        className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                        style={{ background: tab === id ? '#fffbeb' : 'transparent', color: tab === id ? '#b8960a' : '#94a3b8', border: tab === id ? '1px solid #fde68a' : '1px solid transparent' }}>
                        <Icon className="w-5 h-5" />
                        {/* 검토 대기 배지 */}
                        {id === 'overview' && assignedCases.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                                style={{ background: urgentCount > 0 ? '#dc2626' : '#c9a84c', color: '#ffffff' }}>
                                {assignedCases.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <div className="pl-16 pt-20 h-screen flex flex-col">
                {/* 헤더 */}
                <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
                    style={{ borderBottom: '1px solid #e5e7eb', background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div>
                        <h1 className="font-black text-lg" style={{ color: '#1e293b' }}>{TABS.find(t => t.id === tab)?.label}</h1>
                        <p className="text-xs mt-0.5 font-medium" style={{ color: '#64748b' }}>IBS 법률사무소 · 변호사 포털</p>
                    </div>
                    {tab === 'overview' && (
                        <div className="flex items-center gap-3">
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="고객사·사업자번호 검색..." className="px-4 py-2 rounded-xl outline-none text-sm w-56"
                                style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                            <Link href="/lawyer/privacy-review"
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
                                style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#78350f' }}>
                                조문 검토 <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    {tab === 'consult' ? (
                        <div className="h-full"><ConsultQueue /></div>
                    ) : (
                        <div className="h-full overflow-y-auto p-6">
                            {tab === 'overview' && (
                                <>
                                    {/* KPI 카드 */}
                                    <div className="grid grid-cols-4 gap-4 mb-6">
                                        {STATS.map(({ label, value, color, bg }) => (
                                            <div key={label} className="p-4 rounded-xl"
                                                style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                                <div className="text-2xl font-black" style={{ color }}>{value}</div>
                                                <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 검토 대기 문서 목록 */}
                                    <div className="mb-3 flex items-center justify-between">
                                        <h2 className="text-sm font-bold" style={{ color: '#475569' }}>
                                            검토 대기 문서
                                            {urgentCount > 0 && (
                                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-black"
                                                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                                    긴급 {urgentCount}건
                                                </span>
                                            )}
                                        </h2>
                                        <span className="text-xs" style={{ color: '#94a3b8' }}>
                                            행에 마우스를 올리면 검토 버튼이 표시됩니다
                                        </span>
                                    </div>
                                    <ReviewDocList cases={filtered} />
                                </>
                            )}
                            {tab === 'contracts' && (
                                <div className="text-center py-20">
                                    <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#c9a84c', opacity: 0.4 }} />
                                    <p className="font-bold mb-2" style={{ color: '#64748b' }}>계약서 AI 검토 대기</p>
                                    <Link href="/legal/review">
                                        <button className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl font-bold text-sm"
                                            style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>
                                            계약서 검토 페이지로 <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
