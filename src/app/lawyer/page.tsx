'use client';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, FileText, MessageSquare, CheckCircle2, AlertTriangle, Send, Loader2, Phone, Edit3, ArrowRight, Clock, ChevronRight, ChevronLeft, Search, FolderOpen, Briefcase, TrendingDown, DollarSign, UserCheck, Mail, Building, Plus, X, Filter, Bell, Mic, Users, ChevronDown, ChevronUp, Gavel, User } from 'lucide-react';
import Link from 'next/link';
import { generateAIDraft, type AIAssistResponse } from '@/lib/ai-assist';
import { store, type Company, LAWYERS, LITIGATION_TYPES, COURTS, NotificationStore, PendingClientStore, type PendingClient } from '@/lib/mockStore';
import { useRequireAuth } from '@/lib/AuthContext';
import { DocumentWidget } from '@/components/DocumentWidget';
import LitigationDashboard from '@/app/litigation/page';
import PersonalLitigationDashboard from '@/app/personal-litigation/page';
const RecordingWidget = lazy(() => import('@/components/RecordingWidget'));




const LEVEL_COLOR: Record<string, { text: string; bg: string; border: string }> = {
    HIGH: { text: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
    MEDIUM: { text: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    LOW: { text: '#16a34a', bg: '#dcfce7', border: '#86efac' },
};
const STATUS_META: Record<string, { text: string; bg: string }> = {
    assigned: { text: '#d97706', bg: '#fffbeb' },
    reviewing: { text: '#d97706', bg: '#fef9ec' },
};
const STATUS_LBL: Record<string, string> = { assigned: '배정됨', reviewing: '검토중' };

interface ConsultItem { id: string; companyName: string; category: string; urgency: 'urgent' | 'normal'; title: string; content: string; created: string; }

const CONSULTS: ConsultItem[] = [
    { id: 'q1', companyName: '(주)놀부NBG', category: '가맹계약', urgency: 'urgent', title: '가맹계약 중도 해지 통보 대응', content: '본사에서 계약 해지를 요구하고 있습니다. 계약서 제8조 위약금이 200%인데 유효한가요? 가맹계약서와 관련 서류를 첨부합니다.', created: '2026-03-17 09:00' },
    { id: 'q2', companyName: '(주)BBQ', category: '개인정보', urgency: 'normal', title: '배달앱 연동 개인정보 처리방침', content: '배달앱과 연동하여 고객 정보를 수집하는데 처리방침에 무엇을 추가해야 하나요? 현재 방침 PDF 첨부합니다.', created: '2026-03-17 08:30' },
    { id: 'q3', companyName: '(주)메가커피', category: '노무', urgency: 'normal', title: '암묵적 초과근무 수당 지급 의무', content: '교대 변경 시 15~20분 초과근무가 발생하는데 수당을 지급해야 하나요? 현재 1,500개 가맹점에 적용 중입니다.', created: '2026-03-17 07:45' },
    { id: 'q4', companyName: '(주)파리바게뜨', category: '가맹계약', urgency: 'urgent', title: '가맹점 영업지역 침해 분쟁', content: '인근 200m에 동일 브랜드 가맹점이 추가 개설됩니다. 계약서상 영업지역 보호 조항이 있는데 법적 대응이 가능한가요?', created: '2026-03-16 16:00' },
];

// ── 상담 검토 패널 (모바일 탭 전환 지원) ─────────────────────────
function ConsultQueue() {
    const [sel, setSel] = useState<ConsultItem | null>(CONSULTS[0]);
    const [answer, setAnswer] = useState('');
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aiCache, setAiCache] = useState<Record<string, AIAssistResponse>>({});
    const [sentItems, setSentItems] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState('');
    // 모바일: 목록 패널 vs 답변 패널 전환
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

    useEffect(() => {
        const preloadAll = async () => {
            const cache: Record<string, AIAssistResponse> = {};
            for (const item of CONSULTS) {
                const result = await generateAIDraft({
                    question: item.content,
                    category: item.category,
                    companyName: item.companyName,
                    urgency: item.urgency,
                    lawyerName: '김수현',
                });
                cache[item.id] = result;
            }
            setAiCache(cache);
            if (CONSULTS[0] && cache[CONSULTS[0].id]) {
                setAnswer(cache[CONSULTS[0].id].draft);
            }
        };
        preloadAll();
    }, []);

    const handleSelect = (item: ConsultItem) => {
        setSel(item);
        if (sentItems.has(item.id)) {
            setDone(true);
            setAnswer('');
        } else {
            setDone(false);
            const cached = aiCache[item.id];
            setAnswer(cached?.draft || '');
        }
        // 모바일에서 선택하면 상세 뷰로 이동
        setMobileView('detail');
    };

    const submit = async () => {
        if (!sel || !answer.trim()) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        setDone(true);
        setSentItems(prev => new Set(prev).add(sel.id));
        setLoading(false);
        setToast(`✅ ${sel.companyName}에 답변이 발송되었습니다`);
        // 모바일에서 발송 후 목록으로 돌아가기
        setTimeout(() => setMobileView('list'), 1500);
    };

    const pendingCount = CONSULTS.filter(c => !sentItems.has(c.id)).length;

    return (
        <div className="flex h-full" style={{ background: '#f8f9fc' }}>
            {/* ── 질문 목록 (데스크탑: 항상 표시 / 모바일: list 뷰에서만) ── */}
            <div
                className={`
                    flex-shrink-0 overflow-y-auto
                    ${mobileView === 'list' ? 'flex' : 'hidden'}
                    sm:flex flex-col
                    w-full sm:w-72 lg:w-80
                `}
                style={{ borderRight: '1px solid #e5e7eb', background: '#ffffff' }}
            >
                <div className="p-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <span className="text-xs font-bold" style={{ color: '#94a3b8' }}>고객사 질문 목록</span>
                    {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                            style={{ background: '#fef2f2', color: '#dc2626' }}>
                            미답변 {pendingCount}건
                        </span>
                    )}
                </div>
                <div className="overflow-y-auto flex-1">
                    {CONSULTS.map(c => {
                        const isSent = sentItems.has(c.id);
                        return (
                            <div key={c.id} onClick={() => handleSelect(c)}
                                className="p-4 cursor-pointer transition-all active:opacity-70"
                                style={{
                                    background: sel?.id === c.id ? '#fffbeb' : isSent ? '#f0fdf4' : 'transparent',
                                    borderLeft: sel?.id === c.id ? '3px solid #c9a84c' : '3px solid transparent',
                                    borderBottom: '1px solid #f1f5f9',
                                    opacity: isSent ? 0.6 : 1,
                                }}>
                                <div className="flex justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        {isSent ? (
                                            <CheckCircle2 className="w-3 h-3" style={{ color: '#16a34a' }} />
                                        ) : (
                                            <span className="text-xs font-bold" style={{ color: c.urgency === 'urgent' ? '#dc2626' : '#94a3b8' }}>
                                                {c.urgency === 'urgent' ? '🔴 긴급' : '⚪ 일반'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>{c.created.slice(5)}</span>
                                        {/* 모바일에서 화살표 표시 */}
                                        <ChevronRight className="w-3.5 h-3.5 sm:hidden" style={{ color: '#c9a84c' }} />
                                    </div>
                                </div>
                                <p className="text-sm font-bold truncate mb-0.5" style={{ color: '#1e293b' }}>{c.title}</p>
                                <p className="text-xs truncate" style={{ color: '#64748b' }}>{c.companyName} · {c.category}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── 답변 영역 (데스크탑: 항상 표시 / 모바일: detail 뷰에서만) ── */}
            {sel && (
                <div
                    className={`
                        flex-1 overflow-y-auto p-4 sm:p-6 space-y-5
                        ${mobileView === 'detail' ? 'flex flex-col' : 'hidden'}
                        sm:flex sm:flex-col
                    `}
                >
                    {/* 모바일 뒤로가기 버튼 */}
                    <button
                        onClick={() => setMobileView('list')}
                        className="sm:hidden flex items-center gap-2 text-sm font-bold mb-1"
                        style={{ color: '#b8960a' }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        질문 목록으로
                    </button>

                    {/* 질문 헤더 */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {sel.urgency === 'urgent' && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>긴급</span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{ background: '#eff6ff', color: '#2563eb' }}>{sel.category}</span>
                            <span className="text-xs" style={{ color: '#94a3b8' }}>{sel.companyName}</span>
                        </div>
                        <h2 className="text-base sm:text-lg font-black mb-3" style={{ color: '#1e293b' }}>{sel.title}</h2>
                        <div className="p-3 sm:p-4 rounded-xl text-sm leading-relaxed" style={{ background: '#f8f9fc', color: '#475569', borderLeft: '3px solid #e5e7eb' }}>
                            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold" style={{ color: '#94a3b8' }}>
                                <MessageSquare className="w-3 h-3" /> 고객사 질문
                            </div>
                            {sel.content}
                        </div>
                    </div>

                    {/* AI 분석 결과 */}
                    {sel && aiCache[sel.id] && (
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #c7d2fe' }}>
                            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: '#eef2ff' }}>
                                <div className="flex items-center gap-2">
                                    <Scale className="w-4 h-4" style={{ color: '#6366f1' }} />
                                    <span className="text-xs font-bold" style={{ color: '#6366f1' }}>1차 법률분석 완료</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                    style={{ background: '#dcfce7', color: '#16a34a' }}>
                                    신뢰도 {aiCache[sel.id].confidence}%
                                </span>
                            </div>
                            <div className="px-4 py-2 flex items-center gap-2 flex-wrap" style={{ background: '#f8f9ff', borderBottom: '1px solid #e0e7ff' }}>
                                <span className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>참조:</span>
                                {aiCache[sel.id].references.map((ref: string) => (
                                    <span key={ref} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                        style={{ background: '#eff6ff', color: '#3b82f6' }}>{ref}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 답변 영역 */}
                    {!done ? (
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Scale className="w-4 h-4" style={{ color: '#b8960a' }} />
                                    <span className="text-sm font-bold" style={{ color: '#b8960a' }}>답변 발송</span>
                                </div>
                                {answer && (
                                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                                        {answer.length}자 · 수정 가능
                                    </span>
                                )}
                            </div>
                            <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={8}
                                placeholder="답변을 작성하세요..."
                                className="w-full p-3 sm:p-4 rounded-xl outline-none text-sm resize-none flex-1"
                                style={{ background: '#ffffff', border: `1px solid ${answer ? '#fde68a' : '#e5e7eb'}`, color: '#1e293b', lineHeight: 1.8, minHeight: 160 }} />

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
                                <button onClick={submit} disabled={loading || !answer.trim()}
                                    className="flex items-center gap-2 px-5 sm:px-8 py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all active:scale-95 flex-1 sm:flex-none justify-center"
                                    style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#78350f', boxShadow: '0 2px 8px rgba(201,168,76,0.3)' }}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {loading ? '발송 중...' : '고객사에 답변 발송'}
                                </button>

                                {sel.urgency === 'urgent' && (
                                    <button className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm"
                                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                        <Phone className="w-4 h-4" /> 콜백
                                    </button>
                                )}

                                <button onClick={() => setAnswer('')}
                                    className="flex items-center gap-1 px-3 py-3 rounded-xl text-xs font-bold"
                                    style={{ color: '#94a3b8' }}>
                                    <Edit3 className="w-3 h-3" /> 초기화
                                </button>
                            </div>

                            {answer && (
                                <p className="text-[10px] mt-3" style={{ color: '#94a3b8' }}>
                                    💡 분석 결과가 자동으로 입력되었습니다. 검토 후 바로 발송하거나, 수정하여 보낼 수 있습니다.
                                </p>
                            )}
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="p-6 sm:p-8 rounded-xl text-center"
                            style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3" style={{ color: '#16a34a' }} />
                            <p className="font-bold text-base sm:text-lg" style={{ color: '#16a34a' }}>답변이 {sel.companyName}에 발송되었습니다</p>
                            <p className="text-xs mt-2" style={{ color: '#6b7280' }}>고객사 대시보드의 '변호사 답변' 탭에서 확인 가능합니다</p>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-bold z-50 mx-4"
                        style={{ background: '#111827', color: '#f0f4ff', border: '1px solid rgba(201,168,76,0.3)' }}>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── 내 상담관리 (로탑 My Page → 내 상담관리 참조) ─────────────────
interface ConsultRecord {
    id: string;
    status: '상담' | '수임' | '보류' | '완료';
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    category: '민사' | '형사' | '가사' | '부동산' | '노무' | '기업' | '기타';
    content: string;
    date: string;
    fee?: number;
    targetFee?: number;
    note?: string;
    isPublic: boolean;
}

const SAMPLE_CONSULTS: ConsultRecord[] = [
    { id: 'c1', status: '상담', clientName: '김○○', clientPhone: '010-1234-5678', clientEmail: 'kim@email.com', category: '민사', content: '프랜차이즈 계약 해지 관련 손해배상 청구 상담. 계약 위반 사항 검토 필요.', date: '2026-03-23', fee: 0, targetFee: 5000000, note: '', isPublic: false },
    { id: 'c2', status: '수임', clientName: '(주)○○푸드', clientPhone: '02-1234-5678', clientEmail: 'ceo@food.co.kr', category: '기업', content: '가맹점 영업지역 침해 분쟁. 본사 상대 손해배상 소송 진행 중.', date: '2026-03-20', fee: 3300000, targetFee: 5500000, note: '1차 준비서면 제출 완료', isPublic: true },
    { id: 'c3', status: '보류', clientName: '이○○', clientPhone: '010-9876-5432', clientEmail: '', category: '가사', content: '이혼 소송 및 재산분할 청구. 자녀 양육권 분쟁 포함.', date: '2026-03-18', fee: 0, targetFee: 3000000, note: '의뢰인 연락 두절', isPublic: false },
    { id: 'c4', status: '상담', clientName: '박○○', clientPhone: '010-5555-7777', clientEmail: 'park@biz.com', category: '노무', content: '부당해고 구제신청 관련 법률 자문. 해고 사유 적법성 검토.', date: '2026-03-22', fee: 0, targetFee: 2000000, note: '', isPublic: false },
    { id: 'c5', status: '완료', clientName: '최○○', clientPhone: '010-3333-4444', clientEmail: 'choi@mail.com', category: '형사', content: '사기죄 고소장 작성 및 수사 지원. 증거 자료 분석 완료.', date: '2026-03-10', fee: 2200000, targetFee: 2200000, note: '사건 종결', isPublic: true },
];

const STATUS_COLORS: Record<ConsultRecord['status'], { bg: string; text: string; border: string }> = {
    '상담': { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    '수임': { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
    '보류': { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
    '완료': { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
};

function ConsultManage() {
    const [records, setRecords] = useState<ConsultRecord[]>(SAMPLE_CONSULTS);
    const [activeTab, setActiveTab] = useState<'전체' | '상담' | '수임' | '보류' | '완료'>('전체');
    const [selected, setSelected] = useState<ConsultRecord | null>(SAMPLE_CONSULTS[0]);
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
    const [editNote, setEditNote] = useState(SAMPLE_CONSULTS[0]?.note ?? '');
    const [showAdd, setShowAdd] = useState(false);
    const [newForm, setNewForm] = useState({ clientName: '', clientPhone: '', category: '민사' as ConsultRecord['category'], content: '', targetFee: '' });

    const filtered = activeTab === '전체' ? records : records.filter(r => r.status === activeTab);
    const tabs = (['전체', '상담', '수임', '보류', '완료'] as const);
    const counts = tabs.reduce((a, t) => ({
        ...a, [t]: t === '전체' ? records.length : records.filter(r => r.status === t).length
    }), {} as Record<string, number>);

    const handleSelect = (r: ConsultRecord) => {
        setSelected(r);
        setEditNote(r.note ?? '');
        setMobileView('detail');
    };

    const changeStatus = (r: ConsultRecord, status: ConsultRecord['status']) => {
        setRecords(prev => prev.map(x => x.id === r.id ? { ...x, status } : x));
        if (selected?.id === r.id) setSelected({ ...r, status });
    };

    const saveNote = () => {
        if (!selected) return;
        setRecords(prev => prev.map(x => x.id === selected.id ? { ...x, note: editNote } : x));
        setSelected({ ...selected, note: editNote });
    };

    const addRecord = () => {
        const rec: ConsultRecord = {
            id: `c${Date.now()}`, status: '상담',
            clientName: newForm.clientName, clientPhone: newForm.clientPhone,
            clientEmail: '', category: newForm.category,
            content: newForm.content, date: new Date().toISOString().slice(0, 10),
            fee: 0, targetFee: parseInt(newForm.targetFee) || 0,
            note: '', isPublic: false,
        };
        setRecords(prev => [rec, ...prev]);
        setShowAdd(false);
        setNewForm({ clientName: '', clientPhone: '', category: '민사', content: '', targetFee: '' });
    };

    return (
        <div className="flex h-full" style={{ background: '#f8f9fc' }}>
            {/* 좌측: 상담 목록 */}
            <div className={`flex-shrink-0 flex flex-col ${mobileView === 'list' ? 'flex' : 'hidden'} sm:flex w-full sm:w-72 lg:w-80`}
                style={{ borderRight: '1px solid #e5e7eb', background: '#ffffff' }}>
                {/* 탭 */}
                <div className="flex-shrink-0" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <div className="flex overflow-x-auto">
                        {tabs.map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className="flex-shrink-0 px-3 py-2.5 text-xs font-bold transition-all"
                                style={{
                                    color: activeTab === t ? '#2563eb' : '#94a3b8',
                                    borderBottom: activeTab === t ? '2px solid #2563eb' : '2px solid transparent',
                                    background: 'transparent'
                                }}>
                                {t} <span className="ml-1 text-[10px]" style={{ color: '#94a3b8' }}>{counts[t]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="px-3 pb-2 pt-1">
                        <button onClick={() => setShowAdd(true)}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                            <Plus className="w-3 h-3" /> 신규 상담 등록
                        </button>
                    </div>
                </div>
                {/* 목록 */}
                <div className="overflow-y-auto flex-1">
                    {filtered.map(r => {
                        const sc = STATUS_COLORS[r.status];
                        return (
                            <div key={r.id} onClick={() => handleSelect(r)}
                                className="p-3.5 cursor-pointer transition-all"
                                style={{
                                    background: selected?.id === r.id ? '#f0f9ff' : 'transparent',
                                    borderLeft: selected?.id === r.id ? '3px solid #2563eb' : '3px solid transparent',
                                    borderBottom: '1px solid #f1f5f9',
                                }}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                                            {r.status}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                            style={{ background: '#f1f5f9', color: '#64748b' }}>{r.category}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px]" style={{ color: '#94a3b8' }}>{r.date.slice(5)}</span>
                                        <ChevronRight className="w-3.5 h-3.5 sm:hidden" style={{ color: '#94a3b8' }} />
                                    </div>
                                </div>
                                <p className="text-sm font-bold truncate" style={{ color: '#1e293b' }}>{r.clientName}</p>
                                <p className="text-xs truncate mt-0.5" style={{ color: '#64748b' }}>{r.content}</p>
                                {r.targetFee ? (
                                    <p className="text-xs mt-1 font-bold" style={{ color: '#b8960a' }}>
                                        목표 {(r.targetFee / 10000).toLocaleString()}만원
                                    </p>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 우측: 상담 상세 */}
            {selected && (
                <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 ${mobileView === 'detail' ? 'flex flex-col' : 'hidden'} sm:flex sm:flex-col`}>
                    <button onClick={() => setMobileView('list')}
                        className="sm:hidden flex items-center gap-2 text-sm font-bold mb-1"
                        style={{ color: '#2563eb' }}>
                        <ChevronLeft className="w-4 h-4" /> 목록으로
                    </button>

                    {/* 고객 정보 */}
                    <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: STATUS_COLORS[selected.status].bg, color: STATUS_COLORS[selected.status].text, border: `1px solid ${STATUS_COLORS[selected.status].border}` }}>
                                        {selected.status}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                        style={{ background: '#f1f5f9', color: '#64748b' }}>{selected.category}</span>
                                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>{selected.date}</span>
                                </div>
                                <h2 className="text-lg font-black" style={{ color: '#1e293b' }}>{selected.clientName}</h2>
                            </div>
                            {/* 공개범위 */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>공개</span>
                                <button onClick={() => setSelected({ ...selected, isPublic: !selected.isPublic })}
                                    className="text-[10px] px-2 py-1 rounded-lg font-bold"
                                    style={{ background: selected.isPublic ? '#eff6ff' : '#f1f5f9', color: selected.isPublic ? '#2563eb' : '#94a3b8', border: `1px solid ${selected.isPublic ? '#bfdbfe' : '#e2e8f0'}` }}>
                                    {selected.isPublic ? '전체공개' : '개별공개'}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                                <span className="text-sm" style={{ color: '#374151' }}>{selected.clientPhone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                                <span className="text-sm" style={{ color: '#374151' }}>{selected.clientEmail || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                                <span className="text-sm font-bold" style={{ color: '#b8960a' }}>
                                    {selected.fee ? `${(selected.fee / 10000).toLocaleString()}만` : '미결정'}
                                    {selected.targetFee ? ` / 목표 ${(selected.targetFee / 10000).toLocaleString()}만원` : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 상담 내용 */}
                    <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <p className="text-xs font-bold mb-2" style={{ color: '#94a3b8' }}>📋 상담 내용</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{selected.content}</p>
                    </div>

                    {/* 메모 & 답글 */}
                    <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <p className="text-xs font-bold mb-2" style={{ color: '#94a3b8' }}>📝 메모 / 답글</p>
                        <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={4}
                            placeholder="메모나 답글을 입력하세요..."
                            className="w-full p-3 rounded-xl text-sm resize-none outline-none"
                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b', lineHeight: 1.7 }} />
                    </div>

                    {/* 단계 변경 + 액션 버튼 */}
                    <div className="rounded-xl p-4 space-y-3" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>⚡ 단계 변경</p>
                        <div className="flex flex-wrap gap-2">
                            {(['상담', '수임', '보류', '완료'] as const).map(s => (
                                <button key={s} onClick={() => changeStatus(selected, s)}
                                    className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                    style={{
                                        background: selected.status === s ? STATUS_COLORS[s].bg : '#f1f5f9',
                                        color: selected.status === s ? STATUS_COLORS[s].text : '#64748b',
                                        border: `1px solid ${selected.status === s ? STATUS_COLORS[s].border : '#e2e8f0'}`,
                                    }}>{s}</button>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={saveNote}
                                className="flex-1 py-2 rounded-xl text-sm font-bold"
                                style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#ffffff' }}>
                                저장
                            </button>
                            {selected.status === '상담' && (
                                <button onClick={() => changeStatus(selected, '수임')}
                                    className="flex-1 py-2 rounded-xl text-sm font-bold"
                                    style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#ffffff' }}>
                                    공식사건 등록 →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 신규 상담 등록 모달 */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                        onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="w-full max-w-md rounded-2xl p-6"
                            style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-black text-lg" style={{ color: '#1e293b' }}>📋 신규 상담 등록</h2>
                                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg" style={{ color: '#94a3b8' }}><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>★ 의뢰인명</label>
                                        <input value={newForm.clientName} onChange={e => setNewForm(p => ({ ...p, clientName: e.target.value }))}
                                            placeholder="홍○○ / (주)○○" className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>연락처</label>
                                        <input value={newForm.clientPhone} onChange={e => setNewForm(p => ({ ...p, clientPhone: e.target.value }))}
                                            placeholder="010-0000-0000" className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>사건 분류</label>
                                        <select value={newForm.category} onChange={e => setNewForm(p => ({ ...p, category: e.target.value as ConsultRecord['category'] }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                                            {['민사', '형사', '가사', '부동산', '노무', '기업', '기타'].map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>목표 수임료</label>
                                        <input value={newForm.targetFee} onChange={e => setNewForm(p => ({ ...p, targetFee: e.target.value }))}
                                            placeholder="5000000" className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>★ 상담 내용</label>
                                    <textarea value={newForm.content} onChange={e => setNewForm(p => ({ ...p, content: e.target.value }))} rows={4}
                                        placeholder="상담 내용을 입력하세요..."
                                        className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                                        style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                                    style={{ background: '#f1f5f9', color: '#64748b' }}>취소</button>
                                <button onClick={addRecord} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                                    style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#ffffff' }}>등록</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── 청구/미수 현황 (로탑 수납/통계 → 건별 청구/미수 참조) ───────────────
interface BillingRecord {
    id: string;
    date: string;
    clientName: string;
    type: '수임료' | '실비';
    item: string;
    chargeAmount: number;
    chargeVat: number;
    paidAmount: number;
    unpaidAmount: number;
    note?: string;
    caseTitle: string;
    caseNo: string;
    opponent: string;
}

const SAMPLE_BILLING: BillingRecord[] = [
    { id: 'b1', date: '2026-03-05', clientName: '(주)놀부NBG', type: '수임료', item: '착수금', chargeAmount: 3000000, chargeVat: 300000, paidAmount: 0, unpaidAmount: 3300000, caseTitle: '가맹계약 해지 손배', caseNo: '2026가합12345', opponent: '놀부NBG본사' },
    { id: 'b2', date: '2026-03-06', clientName: '(주)BBQ', type: '수임료', item: '착수금', chargeAmount: 2000000, chargeVat: 200000, paidAmount: 2200000, unpaidAmount: 0, caseTitle: '영업지역 침해', caseNo: '2026가합67890', opponent: '제너시스BBQ' },
    { id: 'b3', date: '2026-03-10', clientName: '(주)메가커피', type: '수임료', item: '성공보수', chargeAmount: 5000000, chargeVat: 500000, paidAmount: 2750000, unpaidAmount: 2750000, caseTitle: '노무 분쟁', caseNo: '2026민사34567', opponent: '메가엠지씨커피' },
    { id: 'b4', date: '2026-03-12', clientName: '(주)파리바게뜨', type: '실비', item: '소송비용', chargeAmount: 500000, chargeVat: 50000, paidAmount: 550000, unpaidAmount: 0, caseTitle: '가맹점 분쟁', caseNo: '2026가합11111', opponent: 'SPC삼립' },
    { id: 'b5', date: '2026-03-15', clientName: '이○○', type: '수임료', item: '착수금', chargeAmount: 1500000, chargeVat: 150000, paidAmount: 0, unpaidAmount: 1650000, caseTitle: '이혼소송', caseNo: '2026드합22222', opponent: '-' },
];

function BillingTracker() {
    const [records] = useState<BillingRecord[]>(SAMPLE_BILLING);
    const [filter, setFilter] = useState<'all' | '수임료' | '실비'>('all');

    const filtered = filter === 'all' ? records : records.filter(r => r.type === filter);
    const totalCharge = filtered.reduce((s, r) => s + r.chargeAmount + r.chargeVat, 0);
    const totalPaid = filtered.reduce((s, r) => s + r.paidAmount, 0);
    const totalUnpaid = filtered.reduce((s, r) => s + r.unpaidAmount, 0);

    const fmt = (n: number) => n.toLocaleString();

    return (
        <div className="h-full overflow-y-auto p-4 sm:p-6" style={{ background: '#f8f9fc' }}>
            {/* 합계 요약 카드 (로탑 UX: 항상 상단 고정) */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                    { label: '청구합계', value: totalCharge, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                    { label: '입금합계', value: totalPaid, color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
                    { label: '미수합계', value: totalUnpaid, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' }, // 로탑: 미수 빨간색
                ].map(c => (
                    <div key={c.label} className="p-3 sm:p-4 rounded-xl"
                        style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                        <p className="text-[10px] font-bold mb-1" style={{ color: c.color }}>{c.label}</p>
                        <p className="text-sm sm:text-lg font-black" style={{ color: c.color }}>{fmt(c.value)}원</p>
                    </div>
                ))}
            </div>

            {/* 필터 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                    {(['all', '수임료', '실비'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className="text-xs px-3 py-1.5 rounded-xl font-bold"
                            style={{
                                background: filter === f ? '#1e293b' : '#ffffff',
                                color: filter === f ? '#ffffff' : '#64748b',
                                border: `1px solid ${filter === f ? '#1e293b' : '#e2e8f0'}`,
                            }}>{f === 'all' ? '전체' : f}</button>
                    ))}
                </div>
                <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold"
                    style={{ background: '#ffffff', color: '#16a34a', border: '1px solid #86efac' }}>
                    📊 엑셀
                </button>
            </div>

            {/* 청구 목록 */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                {/* 헤더 */}
                <div className="hidden sm:grid px-4 py-2.5 text-[10px] font-bold"
                    style={{ gridTemplateColumns: '90px 1fr 80px 100px 100px 100px', borderBottom: '1px solid #f1f5f9', background: '#f8f9fc', color: '#64748b' }}>
                    <span>청구일</span><span>의뢰인 / 사건</span><span>구분</span><span>청구합계</span><span>입금합계</span><span>미수합계</span>
                </div>
                <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                    {filtered.map(r => (
                        <div key={r.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                            {/* 데스크탑 그리드 */}
                            <div className="hidden sm:grid items-center"
                                style={{ gridTemplateColumns: '90px 1fr 80px 100px 100px 100px' }}>
                                <span className="text-xs" style={{ color: '#64748b' }}>{r.date.slice(5)}</span>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{r.clientName}</p>
                                    <p className="text-[10px]" style={{ color: '#94a3b8' }}>{r.caseTitle} / vs {r.opponent}</p>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold w-fit"
                                    style={{ background: r.type === '수임료' ? '#eff6ff' : '#f0fdf4', color: r.type === '수임료' ? '#2563eb' : '#16a34a' }}>
                                    {r.type}
                                </span>
                                <span className="text-sm font-bold" style={{ color: '#374151' }}>{fmt(r.chargeAmount + r.chargeVat)}</span>
                                <span className="text-sm font-bold" style={{ color: '#16a34a' }}>{fmt(r.paidAmount)}</span>
                                <span className="text-sm font-black" style={{ color: r.unpaidAmount > 0 ? '#dc2626' : '#94a3b8' }}>
                                    {r.unpaidAmount > 0 ? fmt(r.unpaidAmount) : '완납'}
                                </span>
                            </div>
                            {/* 모바일 카드 */}
                            <div className="sm:hidden">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                            style={{ background: r.type === '수임료' ? '#eff6ff' : '#f0fdf4', color: r.type === '수임료' ? '#2563eb' : '#16a34a' }}>{r.type}</span>
                                        <span className="text-xs font-bold" style={{ color: '#1e293b' }}>{r.clientName}</span>
                                    </div>
                                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>{r.date.slice(5)}</span>
                                </div>
                                <p className="text-[10px] mb-2" style={{ color: '#94a3b8' }}>{r.caseTitle}</p>
                                <div className="flex gap-3">
                                    <div><p className="text-[10px]" style={{ color: '#64748b' }}>청구</p><p className="text-xs font-bold" style={{ color: '#374151' }}>{fmt(r.chargeAmount + r.chargeVat)}</p></div>
                                    <div><p className="text-[10px]" style={{ color: '#64748b' }}>입금</p><p className="text-xs font-bold" style={{ color: '#16a34a' }}>{fmt(r.paidAmount)}</p></div>
                                    <div><p className="text-[10px]" style={{ color: '#64748b' }}>미수</p><p className="text-xs font-black" style={{ color: r.unpaidAmount > 0 ? '#dc2626' : '#94a3b8' }}>{r.unpaidAmount > 0 ? fmt(r.unpaidAmount) : '완납'}</p></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── 검토 대기 문서 목록 (한국 법률사무소 신뢰 디자인) ────────────────
const LEVEL_LABEL: Record<string, string> = { HIGH: '고위험', MEDIUM: '주의', LOW: '참고' };
const LEVEL_ICON: Record<string, string> = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' };

function ReviewDocList({ cases }: { cases: Company[] }) {
    const pending = cases.filter(c => ['assigned', 'reviewing'].includes(c.status));

    if (pending.length === 0) {
        return (
            <div className="rounded-2xl text-center py-16" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                    <CheckCircle2 className="w-8 h-8" style={{ color: '#16a34a' }} />
                </div>
                <p className="font-bold text-base mb-1" style={{ color: '#1e293b' }}>모든 문서 검토가 완료되었습니다</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>새로운 검토 대기 문서가 등록되면 여기에 표시됩니다</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {/* 테이블 헤더 */}
            <div className="hidden sm:grid px-5 py-3 text-[11px] font-bold tracking-wide"
                style={{ gridTemplateColumns: '1fr 120px 180px 100px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', letterSpacing: '0.05em' }}>
                <span>기업명 / 상태</span>
                <span className="text-center">위험도 분포</span>
                <span className="text-center">미검토 이슈</span>
                <span className="text-right">검토</span>
            </div>

            {/* 문서 목록 */}
            <div>
                {pending.map((c, idx) => {
                    const highIssues = c.issues.filter(i => i.level === 'HIGH' && !i.reviewChecked);
                    const medIssues = c.issues.filter(i => i.level === 'MEDIUM' && !i.reviewChecked);
                    const lowIssues = c.issues.filter(i => i.level === 'LOW' && !i.reviewChecked);
                    const totalIssues = c.issues.filter(i => !i.reviewChecked);
                    const checkedIssues = c.issues.filter(i => i.reviewChecked);
                    const isUrgent = highIssues.length > 0;
                    const progress = c.issues.length > 0 ? Math.round((checkedIssues.length / c.issues.length) * 100) : 0;
                    const sm = STATUS_META[c.status] ?? { text: '#64748b', bg: '#f1f5f9' };

                    return (
                        <motion.div key={c.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.06, duration: 0.3 }}
                            className="relative"
                            style={{ borderBottom: idx < pending.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            {/* 좌측 위험도 사이드바 인디케이터 */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                                style={{ background: isUrgent ? '#dc2626' : '#c9a84c' }} />

                            {/* === 데스크탑 레이아웃 === */}
                            <div className="hidden sm:grid items-center px-5 py-4 gap-3 hover:bg-slate-50/50 transition-colors"
                                style={{ gridTemplateColumns: '1fr 120px 180px 100px' }}>
                                {/* 기업명 + 상태 */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: isUrgent ? '#fef2f2' : '#f8f9fc', border: `1px solid ${isUrgent ? '#fecaca' : '#e2e8f0'}` }}>
                                        {isUrgent
                                            ? <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} />
                                            : <Building className="w-4 h-4" style={{ color: '#64748b' }} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-[13px] truncate" style={{ color: '#1e293b' }}>{c.name}</p>
                                            {isUrgent && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded font-black flex-shrink-0"
                                                    style={{ background: '#dc2626', color: '#ffffff', letterSpacing: '0.05em' }}>긴급</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                                style={{ background: sm.bg, color: sm.text }}>
                                                {STATUS_LBL[c.status] ?? c.status}
                                            </span>
                                            <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                                                <Clock className="w-2.5 h-2.5 inline mr-0.5" style={{ verticalAlign: '-1px' }} />
                                                {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 위험도 분포 미니바 */}
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-full h-2 rounded-full overflow-hidden flex" style={{ background: '#f1f5f9' }}>
                                        {highIssues.length > 0 && <div style={{ width: `${(highIssues.length / totalIssues.length) * 100}%`, background: '#dc2626' }} />}
                                        {medIssues.length > 0 && <div style={{ width: `${(medIssues.length / totalIssues.length) * 100}%`, background: '#f59e0b' }} />}
                                        {lowIssues.length > 0 && <div style={{ width: `${(lowIssues.length / totalIssues.length) * 100}%`, background: '#22c55e' }} />}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {(['HIGH', 'MEDIUM', 'LOW'] as const).map(level => {
                                            const cnt = level === 'HIGH' ? highIssues.length : level === 'MEDIUM' ? medIssues.length : lowIssues.length;
                                            if (!cnt) return null;
                                            return (
                                                <span key={level} className="text-[9px] font-bold" style={{ color: LEVEL_COLOR[level].text }}>
                                                    {LEVEL_ICON[level]}{cnt}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 미검토 이슈 진행률 */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold" style={{ color: '#475569' }}>
                                                미검토 {totalIssues.length}건
                                            </span>
                                            <span className="text-[10px] font-bold" style={{ color: progress > 0 ? '#16a34a' : '#94a3b8' }}>
                                                {progress}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full" style={{ background: '#f1f5f9' }}>
                                            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progress === 100 ? '#16a34a' : '#3b82f6' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* 검토 버튼 */}
                                <div className="flex justify-end">
                                    <Link href="/lawyer/privacy-review"
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:shadow-md active:scale-95"
                                        style={{ background: isUrgent ? '#dc2626' : '#1e293b', color: '#ffffff' }}>
                                        <Scale className="w-3.5 h-3.5" />
                                        검토
                                    </Link>
                                </div>
                            </div>

                            {/* === 모바일 레이아웃 === */}
                            <div className="sm:hidden px-4 py-3.5 pl-4 active:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: isUrgent ? '#fef2f2' : '#f8f9fc', border: `1px solid ${isUrgent ? '#fecaca' : '#e2e8f0'}` }}>
                                            {isUrgent
                                                ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                                                : <Building className="w-3.5 h-3.5" style={{ color: '#64748b' }} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-black text-sm truncate" style={{ color: '#1e293b' }}>{c.name}</p>
                                                {isUrgent && (
                                                    <span className="text-[9px] px-1 py-0.5 rounded font-black flex-shrink-0"
                                                        style={{ background: '#dc2626', color: '#ffffff' }}>긴급</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                                    style={{ background: sm.bg, color: sm.text }}>
                                                    {STATUS_LBL[c.status] ?? c.status}
                                                </span>
                                                <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                                                    {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link href="/lawyer/privacy-review"
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold flex-shrink-0"
                                        style={{ background: isUrgent ? '#dc2626' : '#1e293b', color: '#ffffff' }}>
                                        검토 <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                {/* 모바일 위험도 + 진행률 */}
                                <div className="flex items-center gap-3 pl-10">
                                    <div className="flex items-center gap-1.5">
                                        {(['HIGH', 'MEDIUM', 'LOW'] as const).map(level => {
                                            const cnt = c.issues.filter(i => i.level === level && !i.reviewChecked).length;
                                            if (!cnt) return null;
                                            return (
                                                <span key={level} className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                                    style={{ background: LEVEL_COLOR[level].bg, color: LEVEL_COLOR[level].text, border: `1px solid ${LEVEL_COLOR[level].border}` }}>
                                                    {LEVEL_LABEL[level]} {cnt}
                                                </span>
                                            );
                                        })}
                                    </div>
                                    <div className="flex-1 flex items-center gap-1.5">
                                        <div className="flex-1 h-1.5 rounded-full" style={{ background: '#f1f5f9' }}>
                                            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#3b82f6' }} />
                                        </div>
                                        <span className="text-[9px] font-bold" style={{ color: '#94a3b8' }}>{progress}%</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* 하단 요약 바 */}
            <div className="px-5 py-2.5 flex items-center justify-between" style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>총 {pending.length}개 기업</span>
                    <div className="flex items-center gap-2">
                        {(['HIGH', 'MEDIUM', 'LOW'] as const).map(level => {
                            const cnt = pending.reduce((s, c) => s + c.issues.filter(i => i.level === level && !i.reviewChecked).length, 0);
                            if (!cnt) return null;
                            return (
                                <span key={level} className="text-[9px] font-bold" style={{ color: LEVEL_COLOR[level].text }}>
                                    {LEVEL_ICON[level]} {LEVEL_LABEL[level]} {cnt}
                                </span>
                            );
                        })}
                    </div>
                </div>
                <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                    총 미검토 {pending.reduce((s, c) => s + c.issues.filter(i => !i.reviewChecked).length, 0)}건
                </span>
            </div>
        </div>
    );
}

// ── 대기중 의뢰인 패널 ─────────────────────────────────────
function PendingClientsPanel({ onConfirm }: { onConfirm: () => void }) {
    const [pendings, setPendings] = useState<PendingClient[]>([]);
    const [selId, setSelId] = useState<string | null>(null);
    const [openStep, setOpenStep] = useState<number | null>(0);
    const [showFull, setShowFull] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const load = () => setPendings(PendingClientStore.getPending());
    useEffect(() => {
        load();
        window.addEventListener('ibs-pending-updated', load);
        return () => window.removeEventListener('ibs-pending-updated', load);
    }, []);

    const selected = pendings.find(p => p.id === selId) ?? pendings[0];

    const handleConfirm = async () => {
        if (!selected) return;
        setConfirming(true);
        const confirmed = PendingClientStore.confirm(selected.id);
        if (confirmed) {
            // 송무 사건 자동 등록
            store.addLit({
                companyId: 'personal',
                companyName: confirmed.clientName,
                caseNo: '',
                court: COURTS[0],
                type: LITIGATION_TYPES[0],
                opponent: '',
                claimAmount: 0,
                status: 'preparing',
                assignedLawyer: LAWYERS[0],
                deadlines: [],
                notes: `📋 접수 경위: ${confirmed.channel === 'recording' ? '녹음 접수' : confirmed.channel === 'intake_url' ? 'URL 접수' : '회의 접수'}
연락처: ${confirmed.clientPhone}

📝 AI 요약:
${confirmed.summarySteps.map(s => s.replace(/\*\*/g, '')).join('\n')}

📃 전체 녹취록:
${confirmed.transcript}`,
                result: '',
                resultNote: '',
            });
        }
        load();
        setSelId(null);
        setConfirming(false);
        onConfirm();
    };

    const handleReject = () => {
        if (!selected) return;
        PendingClientStore.reject(selected.id);
        load();
        setSelId(null);
    };

    const CHANNEL_ICON: Record<string, string> = { recording: '🎙️', intake_url: '🔗', meeting: '👥' };
    const CHANNEL_LABEL: Record<string, string> = { recording: '녹음 접수', intake_url: 'URL 접수', meeting: '회의 녹음' };

    if (pendings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-16">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-bold text-sm" style={{ color: '#64748b' }}>대기중인 의뢰인이 없습니다</p>
                <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>🎙️ 녹음 버튼으로 새 의뢰인을 접수하세요</p>
            </div>
        );
    }

    return (
        <div className="flex h-full" style={{ height: 'calc(100vh - 8rem)' }}>
            {/* 목록 */}
            <div className="w-72 flex-shrink-0 overflow-y-auto border-r" style={{ borderColor: '#e5e7eb', background: '#f8f9fc' }}>
                {pendings.map(p => (
                    <div key={p.id}
                        onClick={() => { setSelId(p.id); setOpenStep(0); setShowFull(false); }}
                        className="p-3 cursor-pointer border-b transition-all"
                        style={{
                            borderColor: '#f1f5f9',
                            background: (selected?.id === p.id) ? '#fffbeb' : '#fff',
                            borderLeft: (selected?.id === p.id) ? '3px solid #b8960a' : '3px solid transparent',
                        }}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{CHANNEL_ICON[p.channel]}</span>
                            <span className="text-sm font-black" style={{ color: '#1e293b' }}>{p.clientName}</span>
                            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                style={{ background: '#fef3c7', color: '#92400e' }}>대기중</span>
                        </div>
                        <p className="text-xs" style={{ color: '#64748b' }}>{CHANNEL_LABEL[p.channel]} · {p.category}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>
                            {new Date(p.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                ))}
            </div>

            {/* 상세 패널 */}
            {selected && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{CHANNEL_ICON[selected.channel]}</span>
                                <h2 className="text-lg font-black" style={{ color: '#1e293b' }}>{selected.clientName}</h2>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                                {CHANNEL_LABEL[selected.channel]} · {selected.category} · {selected.clientPhone || '연락처 없음'}
                            </p>
                        </div>
                    </div>

                    {/* 단계별 요약 (노션 AI 스타일) */}
                    <div>
                        <p className="text-xs font-black mb-2 uppercase tracking-wider" style={{ color: '#94a3b8' }}>🤖 AI 분석 요약</p>
                        <div className="space-y-2">
                            {selected.summarySteps.map((step, i) => (
                                <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                                    <button className="w-full flex items-center justify-between px-4 py-3 text-left"
                                        style={{ background: openStep === i ? '#f8faff' : '#fff' }}
                                        onClick={() => setOpenStep(openStep === i ? null : i)}>
                                        <span className="text-sm font-bold" style={{ color: '#1e293b' }}>{step.split(':')[0]}</span>
                                        {openStep === i ? <ChevronUp className="w-4 h-4" style={{ color: '#94a3b8' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#94a3b8' }} />}
                                    </button>
                                    <AnimatePresence>
                                        {openStep === i && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                <p className="px-4 pb-3 text-xs leading-relaxed" style={{ color: '#475569' }}>
                                                    {step.replace(/\*\*/g, '').split(':').slice(1).join(':').trim()}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 전체 녹취록 토글 */}
                    {selected.transcript && (
                        <div>
                            <button onClick={() => setShowFull(s => !s)}
                                className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                                style={{ color: '#94a3b8' }}>
                                <FileText className="w-3.5 h-3.5" />
                                {showFull ? '녹취록 접기' : '전체 녹취록 보기'}
                                {showFull ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            <AnimatePresence>
                                {showFull && (
                                    <motion.pre
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        className="text-xs rounded-xl p-3 whitespace-pre-wrap overflow-y-auto max-h-48"
                                        style={{ background: '#f8f9fc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                        {selected.transcript}
                                    </motion.pre>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* 컨펌 버튼 */}
                    <div className="flex gap-3 pt-4">
                        <button onClick={handleReject}
                            className="flex-1 py-3 rounded-xl text-sm font-bold"
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                            ❌ 거절
                        </button>
                        <button onClick={handleConfirm} disabled={confirming}
                            className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center"
                            style={{ background: confirming ? '#94a3b8' : 'linear-gradient(135deg,#16a34a,#22c55e)' }}>
                            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : '✅ 컨펌 → 사건 및 송무 자동 등록'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LawyerPage() {
    const { loading, authorized } = useRequireAuth(['lawyer']);
    const [tab, setTab] = useState<'overview' | 'consult' | 'contracts' | 'documents' | 'consultMgmt' | 'billing' | 'pending' | 'litigation' | 'personalLit'>('overview');
    const [search, setSearch] = useState('');
    const [cases, setCases] = useState<Company[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [selectedDocCompanyId, setSelectedDocCompanyId] = useState<string | null>(null);
    const [showRecWidget, setShowRecWidget] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        setCases(store.getAll());
        const refreshCounts = () => {
            setNotifCount(NotificationStore.unreadCount());
            setPendingCount(PendingClientStore.count());
        };
        refreshCounts();
        window.addEventListener('ibs-notif-updated', refreshCounts);
        window.addEventListener('ibs-pending-updated', refreshCounts);
        return () => {
            window.removeEventListener('ibs-notif-updated', refreshCounts);
            window.removeEventListener('ibs-pending-updated', refreshCounts);
        };
    }, []);

    if (loading || !authorized) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 14, color: '#6b7280' }}>로딩 중...</div>
        </div>
    );

    const assignedCases = cases.filter(c => ['assigned', 'reviewing'].includes(c.status));
    const filtered = assignedCases.filter(c => !search || c.name.includes(search) || c.biz.includes(search));
    const urgentCount = assignedCases.filter(c => c.issues.some(i => i.level === 'HIGH' && !i.reviewChecked)).length;

    const STATS = [
        { label: '검토 대기', value: assignedCases.length, color: '#b8960a', bg: '#fffbeb' },
        { label: '긴급 이슈', value: urgentCount, color: '#dc2626', bg: '#fef2f2' },
        { label: '검토 완료', value: cases.filter(c => c.lawyerConfirmed).length, color: '#16a34a', bg: '#f0fdf4' },
        { label: '미검토', value: cases.reduce((s, c) => s + c.issues.filter(i => !i.reviewChecked).length, 0), color: '#d97706', bg: '#fffbeb' },
    ];
    const TABS = [
        { id: 'overview' as const, label: '검토 대기', icon: Scale },
        { id: 'consult' as const, label: '상담 검토', icon: MessageSquare },
        { id: 'pending' as const, label: '대기중', icon: Users },
        { id: 'consultMgmt' as const, label: '내 상담관리', icon: UserCheck },
        { id: 'litigation' as const, label: '기업 송무사건', icon: Gavel },
        { id: 'personalLit' as const, label: '개인 송무사건', icon: User },
        { id: 'billing' as const, label: '청구/미수', icon: TrendingDown },
        { id: 'contracts' as const, label: '계약서', icon: FileText },
        { id: 'documents' as const, label: '문서함', icon: FolderOpen },
    ];

    return (
        <div className="min-h-screen" style={{ background: '#f8f9fc' }}>

            {/* ── 데스크탑 전용 좌측 사이드바 (확장형) ── */}
            <div className="hidden sm:flex fixed top-20 left-0 bottom-0 w-48 flex-col gap-2 py-6 px-3 z-40"
                style={{ background: '#ffffff', borderRight: '1px solid #e5e7eb', boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>
                {TABS.map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setTab(id)} title={label}
                        className="relative w-full h-11 px-3 rounded-xl flex items-center justify-start gap-3 transition-all group"
                        style={{ background: tab === id ? '#fffbeb' : 'transparent', color: tab === id ? '#b8960a' : '#64748b', border: tab === id ? '1px solid #fde68a' : '1px solid transparent' }}>
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-bold truncate group-hover:text-[#b8960a] transition-colors">{label}</span>
                        {id === 'overview' && assignedCases.length > 0 && (
                            <span className="ml-auto w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0"
                                style={{ background: urgentCount > 0 ? '#dc2626' : '#c9a84c', color: '#ffffff' }}>
                                {assignedCases.length}
                            </span>
                        )}
                        {id === 'pending' && pendingCount > 0 && (
                            <span className="ml-auto w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0"
                                style={{ background: '#ef4444', color: '#ffffff' }}>
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── 메인 콘텐츠 (sm: 좌측 사이드바 여백) ── */}
            <div className="sm:pl-48 pt-14 sm:pt-20 flex flex-col" style={{ minHeight: '100vh' }}>

                {/* 헤더 */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid #e5e7eb', background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="font-black text-base sm:text-lg truncate" style={{ color: '#1e293b' }}>
                                {TABS.find(t => t.id === tab)?.label}
                            </h1>
                            <p className="text-xs mt-0.5 font-medium hidden sm:block" style={{ color: '#64748b' }}>IBS 법률사무소 · 변호사 포털</p>
                        </div>
                        {tab === 'overview' && (
                            <div className="flex items-center gap-2">
                                {/* 모바일: 검색 토글 버튼 */}
                                <button
                                    onClick={() => setShowSearch(p => !p)}
                                    className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#64748b' }}
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                                {/* 데스크탑: 항상 표시 */}
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="고객사·사업자번호 검색..." className="hidden sm:block px-4 py-2 rounded-xl outline-none text-sm w-44 lg:w-56"
                                    style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                <Link href="/lawyer/privacy-review"
                                    className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap"
                                    style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#78350f' }}>
                                    검토 <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                    {/* 모바일 검색바 (토글) */}
                    {tab === 'overview' && showSearch && (
                        <div className="sm:hidden mt-2">
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="고객사·사업자번호 검색..." className="w-full px-4 py-2 rounded-xl outline-none text-sm"
                                style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }}
                                autoFocus />
                        </div>
                    )}
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 overflow-hidden">
                    {tab === 'consult' ? (
                        <div className="h-full" style={{ height: 'calc(100vh - 8rem)' }}>
                            <ConsultQueue />
                        </div>
                    ) : tab === 'pending' ? (
                        <div className="h-full">
                            <PendingClientsPanel onConfirm={() => setPendingCount(PendingClientStore.count())} />
                        </div>
                    ) : tab === 'consultMgmt' ? (
                        <div className="h-full" style={{ height: 'calc(100vh - 8rem)' }}>
                            <ConsultManage />
                        </div>
                    ) : tab === 'billing' ? (
                        <div className="h-full" style={{ height: 'calc(100vh - 8rem)' }}>
                            <BillingTracker />
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto p-4 sm:p-6">
                            {tab === 'overview' && (
                                <>
                                    {/* ✅ KPI 카드: 한국 법률사무소 스타일 */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                                        {STATS.map(({ label, value, color, bg }, i) => {
                                            const icons = [Scale, AlertTriangle, CheckCircle2, Clock];
                                            const Icon = icons[i];
                                            return (
                                                <div key={label} className="relative overflow-hidden p-4 sm:p-5 rounded-xl group"
                                                    style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                                    {/* 상단 라인 */}
                                                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                                                            <Icon className="w-4 h-4" style={{ color }} />
                                                        </div>
                                                        {value > 0 && (
                                                            <div className="w-7 h-7 rounded-full flex items-center justify-center"
                                                                style={{ background: bg, border: `1.5px solid ${color}` }}>
                                                                <span className="text-[10px] font-black" style={{ color }}>{value}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-2xl sm:text-3xl font-black leading-none mb-1" style={{ color }}>
                                                        {value}
                                                    </div>
                                                    <div className="text-[11px] font-bold" style={{ color: '#64748b' }}>{label}</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* 검토 대기 문서 섹션 헤더 */}
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-5 rounded-full" style={{ background: '#1e293b' }} />
                                                <h2 className="text-sm font-black" style={{ color: '#1e293b' }}>
                                                    검토 대기 문서
                                                </h2>
                                            </div>
                                            {urgentCount > 0 && (
                                                <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black animate-pulse"
                                                    style={{ background: '#dc2626', color: '#ffffff' }}>
                                                    <AlertTriangle className="w-3 h-3" />
                                                    긴급 {urgentCount}건
                                                </span>
                                            )}
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                style={{ background: '#f1f5f9', color: '#64748b' }}>
                                                전체 {assignedCases.length}건
                                            </span>
                                        </div>
                                        <Link href="/lawyer/privacy-review"
                                            className="hidden sm:flex items-center gap-1.5 text-xs font-bold transition-colors"
                                            style={{ color: '#94a3b8' }}>
                                            전체 검토 시작 <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                    <ReviewDocList cases={filtered} />
                                </>
                            )}
                            {tab === 'contracts' && (
                                <div className="text-center py-16">
                                    <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#c9a84c', opacity: 0.4 }} />
                                    <p className="font-bold mb-2" style={{ color: '#64748b' }}>계약서 검토 대기</p>
                                    <Link href="/legal/review">
                                        <button className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl font-bold text-sm"
                                            style={{ background: '#fffbeb', color: '#b8960a', border: '1px solid #fde68a' }}>
                                            계약서 검토 페이지로 <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </Link>
                                </div>
                            )}
                            
                            {tab === 'documents' && (
                                <div className="h-full flex flex-col sm:flex-row gap-4">
                                    {/* Company List Sidebar */}
                                    <div className="w-full sm:w-64 flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[200px] sm:h-full">
                                        <div className="p-3 bg-gray-50 border-b border-gray-200">
                                            <h3 className="text-sm font-bold text-gray-700">관리 중인 기업</h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            {cases.map(c => (
                                                <div 
                                                    key={c.id} 
                                                    onClick={() => setSelectedDocCompanyId(c.id)}
                                                    className={`p-3 border-b flex items-center justify-between cursor-pointer transition-colors ${selectedDocCompanyId === c.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-800">{c.name}</h4>
                                                        <p className="text-[10px] text-gray-500">{c.biz}</p>
                                                    </div>
                                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Document Widget Area */}
                                    <div className="flex-1 h-full min-h-[400px]">
                                        {selectedDocCompanyId ? (
                                            <DocumentWidget companyId={selectedDocCompanyId} currentUserRole="lawyer" />
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400">
                                                <FolderOpen className="w-12 h-12 mb-3 opacity-20" />
                                                <p className="text-sm">기업을 선택하면 문서함이 표시됩니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {tab === 'litigation' && (
                        <div className="flex-1 p-0 sm:p-2 lg:p-4">
                            <LitigationDashboard isEmbedded={true} />
                        </div>
                    )}
                    {tab === 'personalLit' && (
                        <div className="flex-1 p-0 sm:p-2 lg:p-4">
                            <PersonalLitigationDashboard isEmbedded={true} />
                        </div>
                    )}
                </div>
            </div>

            {/* ── 🎙️ 녹음 FAB ── */}
            <motion.button
                onClick={() => setShowRecWidget(true)}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                className="fixed bottom-20 sm:bottom-6 right-5 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-white"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(16,185,129,0.5)' }}
                title="신규 의뢰인 녹음 접수">
                <Mic className="w-6 h-6 text-white" />
                {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                        style={{ background: '#ef4444', color: '#fff' }}>
                        {pendingCount}
                    </span>
                )}
            </motion.button>

            {/* ── 🎤 녹음 위젯 모달 ── */}
            <Suspense fallback={null}>
                <AnimatePresence>
                    {showRecWidget && (
                        <RecordingWidget
                            mode="new_client"
                            onClose={() => setShowRecWidget(false)}
                            userId="lawyer1"
                            userName="김수현 변호사"
                        />
                    )}
                </AnimatePresence>
            </Suspense>

            {/* ── 모바일 전용 하단 탭바 ── */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex overflow-x-auto hide-scrollbar"
                style={{ background: '#ffffff', borderTop: '1px solid #e5e7eb', boxShadow: '0 -2px 12px rgba(0,0,0,0.08)' }}>
                {TABS.map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setTab(id)}
                        className="flex-shrink-0 w-16 flex flex-col items-center gap-1 py-2.5 relative"
                        style={{ color: tab === id ? '#b8960a' : '#94a3b8' }}>
                        <div className="relative">
                            <Icon className="w-5 h-5" />
                            {id === 'overview' && assignedCases.length > 0 && (
                                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                                    style={{ background: urgentCount > 0 ? '#dc2626' : '#c9a84c', color: '#ffffff' }}>
                                    {assignedCases.length}
                                </span>
                            )}
                            {id === 'pending' && pendingCount > 0 && (
                                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                                    style={{ background: '#ef4444', color: '#ffffff' }}>
                                    {pendingCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold">{label}</span>
                        {tab === id && (
                            <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full" style={{ background: '#c9a84c' }} />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
