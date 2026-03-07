'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale, FileText, MessageSquare, CheckCircle2, AlertTriangle,
    Bot, Send, Loader2, Phone, Edit3, ArrowRight, Clock,
    ChevronRight, ChevronDown, ChevronUp, Eye, Search,
} from 'lucide-react';
import Link from 'next/link';
import { store, type Company } from '@/lib/mockStore';

// ── 색상 시스템 (영업 CRM 통일) ─────────────────────────────
const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff', rowHover: '#f1f5f9',
};

interface ConsultItem {
    id: string; companyName: string; category: string;
    urgency: 'urgent' | 'normal'; title: string; content: string;
    aiDraft: string; created: string;
}

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
const STATUS_LBL: Record<string, string> = { assigned: '배정됨', reviewing: '검토중', sales_confirmed: '영업컨펌' };
const STATUS_META: Record<string, { text: string; bg: string }> = {
    assigned: { text: '#d97706', bg: '#fffbeb' },
    reviewing: { text: '#d97706', bg: '#fef9ec' },
    sales_confirmed: { text: '#7c3aed', bg: '#f5f3ff' },
};

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
        <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div className="flex" style={{ minHeight: 500 }}>
                {/* 좌측 목록 */}
                <div className="w-72 flex-shrink-0 overflow-y-auto" style={{ borderRight: `1px solid ${T.borderSub}` }}>
                    <div className="p-3 text-xs font-bold" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSub}` }}>상담 접수 목록</div>
                    {CONSULTS.map(c => (
                        <div key={c.id} onClick={() => { setSel(c); setDone(false); setNote(''); }}
                            className="p-4 cursor-pointer transition-all"
                            style={{ background: sel?.id === c.id ? '#fffbeb' : 'transparent', borderLeft: sel?.id === c.id ? '2px solid #c9a84c' : '2px solid transparent', borderBottom: `1px solid ${T.borderSub}` }}>
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-bold" style={{ color: c.urgency === 'urgent' ? '#dc2626' : T.faint }}>{c.urgency === 'urgent' ? '🔴 긴급' : '⚪ 일반'}</span>
                                <span className="text-xs" style={{ color: T.faint }}>{c.created.slice(5)}</span>
                            </div>
                            <p className="text-sm font-bold truncate mb-0.5" style={{ color: T.heading }}>{c.title}</p>
                            <p className="text-xs" style={{ color: T.muted }}>{c.companyName} · {c.category}</p>
                        </div>
                    ))}
                </div>
                {/* 우측 상세 */}
                {sel && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        <div>
                            <h2 className="text-lg font-black mb-3" style={{ color: T.heading }}>{sel.title}</h2>
                            <div className="p-4 rounded-xl text-sm" style={{ background: T.bg, color: T.sub, borderLeft: `2px solid ${T.borderSub}` }}>{sel.content}</div>
                        </div>
                        {sel.aiDraft ? (
                            <div>
                                <div className="flex items-center gap-2 mb-2"><Bot className="w-4 h-4" style={{ color: '#6366f1' }} /><span className="text-sm font-bold" style={{ color: '#6366f1' }}>AI 1차 분석</span></div>
                                <div className="p-4 rounded-xl text-sm" style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>{sel.aiDraft}</div>
                            </div>
                        ) : <div className="p-4 rounded-xl text-center text-sm" style={{ color: T.faint, background: T.bg, border: `1px solid ${T.borderSub}` }}>AI 분석 준비 중...</div>}
                        {!done ? (
                            <div>
                                <div className="flex items-center gap-2 mb-2"><Scale className="w-4 h-4" style={{ color: '#b8960a' }} /><span className="text-sm font-bold" style={{ color: '#b8960a' }}>변호사 검토 답변</span></div>
                                <textarea value={note} onChange={e => setNote(e.target.value)} rows={6}
                                    placeholder="AI 초안을 수정하거나 직접 답변을 작성하세요..."
                                    className="w-full p-4 rounded-xl outline-none text-sm resize-none"
                                    style={{ background: T.card, border: '1px solid #fde68a', color: T.heading, lineHeight: 1.7 }} />
                                {sel.aiDraft && !note && (
                                    <button onClick={() => setNote(sel.aiDraft)} className="text-xs mt-1 flex items-center gap-1" style={{ color: T.faint }}>
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
        </div>
    );
}

export default function LawyerPage() {
    const [tab, setTab] = useState<'overview' | 'consult' | 'contracts'>('overview');
    const [search, setSearch] = useState('');
    const [cases] = useState<Company[]>(() => store.getAll());
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const assignedCases = cases.filter(c => ['assigned', 'reviewing', 'sales_confirmed'].includes(c.status));
    const filtered = assignedCases.filter(c => !search || c.name.includes(search) || c.biz.includes(search));
    const urgentCount = assignedCases.filter(c => c.issues.some(i => i.level === 'HIGH' && !i.reviewChecked)).length;

    const STATS = [
        { label: '검토 대기', value: assignedCases.length, color: '#b8960a', bg: '#fffbeb', border: '#fde68a' },
        { label: '긴급 이슈', value: urgentCount, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
        { label: '검토 완료', value: cases.filter(c => c.lawyerConfirmed).length, color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
        { label: '미검토 이슈', value: cases.reduce((s, c) => s + c.issues.filter(i => !i.reviewChecked).length, 0), color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    ];

    const TABS = [
        { id: 'overview' as const, label: '검토 대기 문서', icon: Scale },
        { id: 'consult' as const, label: '상담 검토', icon: MessageSquare },
        { id: 'contracts' as const, label: '계약서 검토', icon: FileText },
    ];

    return (
        <div className="min-h-screen" style={{ background: T.bg }}>
            <div className="max-w-7xl mx-auto px-6 py-6 pt-24 space-y-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black" style={{ color: T.heading }}>변호사 포털</h1>
                        <p className="text-xs mt-0.5" style={{ color: T.muted }}>IBS 법률사무소 · 법률 검토 및 상담 관리</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {tab === 'overview' && (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.faint }} />
                                    <input value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="고객사·사업자번호 검색..."
                                        className="pl-9 pr-4 py-2 rounded-xl outline-none text-sm w-56"
                                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.heading }} />
                                </div>
                                <Link href="/lawyer/privacy-review"
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
                                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#78350f' }}>
                                    조문 검토 <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-4 gap-3">
                    {STATS.map(c => (
                        <div key={c.label} className="px-5 py-4 rounded-2xl" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                            <p className="text-xs font-bold mb-1" style={{ color: c.color }}>{c.label}</p>
                            <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* 탭 */}
                <div className="flex gap-2">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all"
                            style={{
                                background: tab === t.id ? '#fffbeb' : 'transparent',
                                border: tab === t.id ? '1px solid #fde68a' : '1px solid transparent',
                                color: tab === t.id ? '#b8960a' : T.muted,
                            }}>
                            <t.icon className="w-3.5 h-3.5" />{t.label}
                        </button>
                    ))}
                </div>

                {/* 탭 내용 */}
                {tab === 'overview' && (
                    <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: '#f8f9fc', borderBottom: `2px solid ${T.border}` }}>
                                        <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>회사명</th>
                                        <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>상태</th>
                                        <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>이슈</th>
                                        <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>URL</th>
                                        <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>최종 업데이트</th>
                                        <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>액션</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: T.faint }}>검토 대기 문서가 없습니다.</td></tr>
                                    )}
                                    {filtered.map(c => {
                                        const highIssues = c.issues.filter(i => i.level === 'HIGH' && !i.reviewChecked);
                                        const medIssues = c.issues.filter(i => i.level === 'MEDIUM' && !i.reviewChecked);
                                        const lowIssues = c.issues.filter(i => i.level === 'LOW' && !i.reviewChecked);
                                        const totalUnreviewed = c.issues.filter(i => !i.reviewChecked).length;
                                        const isUrgent = highIssues.length > 0;
                                        const sm = STATUS_META[c.status] ?? { text: T.muted, bg: T.bg };
                                        const isExpanded = expandedId === c.id;

                                        return (
                                            <React.Fragment key={c.id}>
                                                <tr className="transition-colors cursor-pointer hover:bg-slate-50"
                                                    style={{ borderBottom: `1px solid ${T.borderSub}`, background: isUrgent ? '#fef2f206' : undefined }}
                                                    onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            {isUrgent && <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#dc2626' }} />}
                                                            <span className="font-bold" style={{ color: T.heading }}>{c.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: sm.bg, color: sm.text }}>
                                                            {STATUS_LBL[c.status] ?? c.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex gap-1">
                                                            {highIssues.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-black" style={{ ...LEVEL_COLOR.HIGH, background: LEVEL_COLOR.HIGH.bg, color: LEVEL_COLOR.HIGH.text, border: `1px solid ${LEVEL_COLOR.HIGH.border}` }}>HIGH ×{highIssues.length}</span>}
                                                            {medIssues.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-black" style={{ background: LEVEL_COLOR.MEDIUM.bg, color: LEVEL_COLOR.MEDIUM.text, border: `1px solid ${LEVEL_COLOR.MEDIUM.border}` }}>MED ×{medIssues.length}</span>}
                                                            {lowIssues.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-black" style={{ background: LEVEL_COLOR.LOW.bg, color: LEVEL_COLOR.LOW.text, border: `1px solid ${LEVEL_COLOR.LOW.border}` }}>LOW ×{lowIssues.length}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-xs truncate max-w-[180px]" style={{ color: T.sub }}>{c.url || c.biz}</td>
                                                    <td className="py-3 px-4 text-xs" style={{ color: T.sub }}>
                                                        {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <button className="text-xs font-bold px-3 py-1 rounded-lg"
                                                                style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                                                                onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : c.id); }}>
                                                                <Eye className="w-3 h-3 inline mr-1" />{isExpanded ? '접기' : '상세'}
                                                            </button>
                                                            <Link href="/lawyer/privacy-review" onClick={e => e.stopPropagation()}
                                                                className="text-xs font-bold px-3 py-1 rounded-lg"
                                                                style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>
                                                                검토 <ChevronRight className="w-3 h-3 inline" />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* 확장 행 */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={6}>
                                                            <div className="px-6 py-4 space-y-2" style={{ background: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
                                                                <p className="text-xs font-bold" style={{ color: T.sub }}>미검토 이슈 ({totalUnreviewed}건)</p>
                                                                <div className="space-y-1.5">
                                                                    {c.issues.filter(i => !i.reviewChecked).slice(0, 5).map((issue, idx) => {
                                                                        const lc = LEVEL_COLOR[issue.level] || LEVEL_COLOR.LOW;
                                                                        return (
                                                                            <div key={idx} className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs"
                                                                                style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                                                                                <span className="px-1.5 py-0.5 rounded font-black" style={{ background: lc.bg, color: lc.text, border: `1px solid ${lc.border}` }}>{issue.level}</span>
                                                                                <span className="flex-1 truncate" style={{ color: T.body }}>{issue.title}</span>
                                                                                <span className="shrink-0 text-[10px]" style={{ color: T.faint }}>{issue.law}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {totalUnreviewed > 5 && (
                                                                        <p className="text-xs text-center py-1" style={{ color: T.faint }}>외 {totalUnreviewed - 5}건...</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'consult' && <ConsultQueue />}

                {tab === 'contracts' && (
                    <div className="rounded-2xl overflow-hidden p-6 text-center" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                        <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#c9a84c', opacity: 0.4 }} />
                        <p className="font-bold mb-2" style={{ color: T.muted }}>계약서 AI 검토 대기</p>
                        <Link href="/legal/review">
                            <button className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl font-bold text-sm"
                                style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>
                                계약서 검토 페이지로 <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
