'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Scale, Brain, Briefcase, Clock, CheckCircle2,
    AlertCircle, ChevronRight, Search, Filter, ArrowRight,
    Lock, Star, Phone, Bot, Calendar, Gavel, Send
} from 'lucide-react';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/AuthContext';
import { ServiceRequestModal } from '@/components/ServiceRequestModal';
import { useConsultations } from '@/hooks/useDataLayer';

/* ── 타입 ───────────────────────────────────────────────── */
type ConsultType = 'legal' | 'eap' | 'business';
type ConsultStatus = 'completed' | 'in_progress' | 'waiting' | 'closed';

interface ConsultRecord {
    id: string;
    caseId: string;
    type: ConsultType;
    title: string;
    summary: string;
    date: string;
    status: ConsultStatus;
    lawyer?: string;
    responseTime?: string;
    satisfaction?: number;
    messageCount: number;
    lawyerAnswer?: string;
    is_read?: boolean;
}

const TYPE_META: Record<ConsultType, { label: string; icon: React.ElementType; color: string }> = {
    legal: { label: '법률 상담', icon: Scale, color: '#c9a84c' },
    eap: { label: '심리/EAP', icon: Brain, color: '#818cf8' },
    business: { label: '경영 자문', icon: Briefcase, color: '#34d399' },
};

const STATUS_META: Record<ConsultStatus, { label: string; color: string; bg: string }> = {
    waiting: { label: '접수 완료', color: '#2563eb', bg: '#eff6ff' },
    in_progress: { label: '검토 중', color: '#d97706', bg: '#fffbeb' },
    completed: { label: '답변 완료', color: '#059669', bg: '#ecfdf5' },
    closed: { label: '종결', color: '#6b7280', bg: '#f3f4f6' },
};

// MOCK_RECORDS removed, data now fetched via hook
/* ── 구독 전 CTA ───────────────────────────────────────── */
function SubscribeCTA() {
    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: '#f3f0ff', border: '1px solid #e0d4fd' }}>
                    <MessageSquare className="w-10 h-10" style={{ color: '#7c3aed' }} />
                </div>
                <h1 className="text-2xl font-black mb-3" style={{ color: '#111827' }}>상담 내역</h1>
                <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
                    구독을 시작하면 법률·심리·경영 상담 내역을<br />
                    접수번호별로 추적하고 관리할 수 있습니다.
                </p>
                <div className="space-y-3 max-w-sm mx-auto mb-8">
                    {['상담 접수번호로 진행상황 실시간 추적', '변호사 답변 이력 전체 열람', '상담 만족도 평가 및 피드백'].map(f => (
                        <div key={f} className="flex items-center gap-2 p-3 rounded-xl text-xs"
                            style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#059669' }} />
                            <span style={{ color: '#374151' }}>{f}</span>
                        </div>
                    ))}
                </div>
                <Link href="/pricing">
                    <button className="px-8 py-3 rounded-xl font-bold text-sm"
                        style={{ background: '#111827', color: '#fff' }}>
                        구독 시작하기 →
                    </button>
                </Link>
            </div>
        </div>
    );
}

/* ── 메인 페이지 ───────────────────────────────────────── */
export default function ConsultationHistoryPage() {
    const { loading: authLoading, authorized, user } = useRequireAuth();
    const { consultations, isLoading: dataLoading, updateConsultation } = useConsultations();
    const [filterType, setFilterType] = useState<ConsultType | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<ConsultStatus | 'all'>('all');
    const [search, setSearch] = useState('');
    const [isSubscribed] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [followupText, setFollowupText] = useState('');
    const [modalDefaultTitle, setModalDefaultTitle] = useState('');
    const [modalDefaultDetail, setModalDefaultDetail] = useState('');

    const handleFollowupSubmit = (r: ConsultRecord) => {
        if (!followupText.trim()) {
            alert('추가로 문의할 내용을 입력해주세요.');
            return;
        }

        const oldHistory = `[이전 문의 내역]
📌 제목: ${r.title}
❓ 원래 질문: ${r.summary}
⚖️ 변호사 답변: ${r.lawyerAnswer}

---
[추가 문의 내용]
${followupText}`;

        setModalDefaultTitle(`[추가 문의] ${r.title}`);
        setModalDefaultDetail(oldHistory);
        setFollowupText('');
        setIsModalOpen(true);
    };

    if (authLoading || dataLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 14, color: '#6b7280' }}>로딩 중...</div></div>;
    if (!authorized) return null; // Or a redirect could happen inside useRequireAuth

    if (!isSubscribed) return <SubscribeCTA />;

    const companyId = user?.companyId;

    const mappedRecords: ConsultRecord[] = consultations
        .filter(c => companyId ? c.companyId === companyId : true)
        .map((c: any) => ({
            id: c.id,
            caseId: `IBS-${c.id.slice(0, 6).toUpperCase()}`,
            type: c.category === 'labor' ? 'eap' : (c.category === 'legal_advice' || c.category === 'contract' ? 'legal' : 'business') as ConsultType,
            title: c.title,
            summary: c.body || '상세 내용 없음',
            date: new Date(c.createdAt).toLocaleDateString(),
            status: ['completed', 'answered', '상담완료', 'callback_done', 'callback_requested'].includes(c.status) ? 'completed' : (['in_progress', 'reviewing'].includes(c.status) ? 'in_progress' : 'waiting') as ConsultStatus,
            lawyer: c.managerName || '배정 대기 중',
            messageCount: Math.floor(Math.random() * 5), // Mock message count for now
            lawyerAnswer: c.lawyerAnswer || '',
            is_read: c.is_read,
        }));

    const filtered = mappedRecords.filter(r => {
        if (filterType !== 'all' && r.type !== filterType) return false;
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        if (search && !r.title.includes(search) && !r.caseId.includes(search)) return false;
        return true;
    });

    const stats = {
        total: mappedRecords.length,
        active: mappedRecords.filter(r => r.status === 'in_progress' || r.status === 'waiting').length,
        avgSatisfaction: mappedRecords.filter(r => r.satisfaction).length > 0
            ? (mappedRecords.filter(r => r.satisfaction).reduce((a, r) => a + (r.satisfaction || 0), 0) / mappedRecords.filter(r => r.satisfaction).length).toFixed(1)
            : '0.0',
    };

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-4xl mx-auto px-4">

                {/* 헤더 */}
                <div className="py-8 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-5 h-5" style={{ color: '#7c3aed' }} />
                            <h1 className="text-2xl font-black" style={{ color: '#111827' }}>상담 내역</h1>
                        </div>
                        <p className="text-sm" style={{ color: '#6b7280' }}>접수번호별 상담 진행 현황을 확인하세요.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-transform hover:scale-105"
                        style={{ background: '#111827', color: '#fff' }}>
                        <MessageSquare className="w-3.5 h-3.5" /> 새 상담
                    </button>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: '총 상담', value: stats.total, color: '#c9a84c', icon: <MessageSquare className="w-4 h-4" /> },
                        { label: '진행 중', value: stats.active, color: '#d97706', icon: <Clock className="w-4 h-4" /> },
                        { label: '평균 만족도', value: `${stats.avgSatisfaction}★`, color: '#059669', icon: <Star className="w-4 h-4" /> },
                    ].map(s => (
                        <div key={s.label} className="p-4 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${s.color}10` }}>
                                <span style={{ color: s.color }}>{s.icon}</span>
                            </div>
                            <div className="text-xl font-black" style={{ color: '#111827' }}>{s.value}</div>
                            <div className="text-xs" style={{ color: '#6b7280' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* 검색 + 필터 */}
                <div className="flex flex-col md:flex-row gap-3 mb-5">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                        <input type="text" placeholder="접수번호 또는 제목으로 검색..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                            style={{ background: '#fff', border: '1px solid #e8e5de', color: '#111827', outline: 'none' }}
                        />
                    </div>
                    <div className="flex gap-1.5">
                        {Object.entries(TYPE_META).map(([key, meta]) => (
                            <button key={key} onClick={() => setFilterType(k => k === key ? 'all' : key as ConsultType)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                                style={{
                                    background: filterType === key ? `${meta.color}10` : '#fff',
                                    color: filterType === key ? meta.color : '#6b7280',
                                    border: `1px solid ${filterType === key ? meta.color + '40' : '#e8e5de'}`,
                                }}>{meta.label}</button>
                        ))}
                    </div>
                </div>

                {/* 상태 필터 */}
                <div className="flex gap-1.5 mb-6">
                    <button onClick={() => setFilterStatus('all')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: filterStatus === 'all' ? '#f0ede6' : 'transparent', color: filterStatus === 'all' ? '#111827' : '#9ca3af' }}>
                        전체
                    </button>
                    {Object.entries(STATUS_META).map(([key, meta]) => (
                        <button key={key} onClick={() => setFilterStatus(k => k === key ? 'all' : key as ConsultStatus)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: filterStatus === key ? meta.bg : 'transparent', color: filterStatus === key ? meta.color : '#9ca3af' }}>
                            {meta.label}
                        </button>
                    ))}
                </div>

                {/* 상담 리스트 */}
                <div className="space-y-3">
                    {filtered.map((r, i) => {
                        const typeMeta = TYPE_META[r.type];
                        const statusMeta = STATUS_META[r.status];
                        const TypeIcon = typeMeta.icon;
                        return (
                            <motion.div key={r.id}
                                onClick={() => {
                                    setExpandedId(prev => prev === r.id ? null : r.id);
                                    if (r.is_read === false && r.id) {
                                        updateConsultation(r.id, { is_read: true });
                                    }
                                }}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-5 rounded-2xl transition-all hover:shadow-md cursor-pointer relative"
                                style={{ background: '#fff', border: '1px solid #e8e5de' }}
                            >
                                {r.is_read === false && (
                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
                                )}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: `${typeMeta.color}10` }}>
                                            <TypeIcon className="w-5 h-5" style={{ color: typeMeta.color }} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                                                    style={{ background: '#f3f4f6', color: '#6b7280' }}>{r.caseId}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                    style={{ color: statusMeta.color, background: statusMeta.bg }}>{statusMeta.label}</span>
                                            </div>
                                            <h3 className="font-bold text-sm" style={{ color: '#111827' }}>{r.title}</h3>
                                        </div>
                                    </div>
                                    <span className="text-[10px] flex-shrink-0" style={{ color: '#9ca3af' }}>{r.date}</span>
                                </div>

                                <p className="text-xs leading-relaxed mb-3 pl-[52px]" style={{ color: '#6b7280' }}>{r.summary}</p>

                                {/* ✨ 상세 답변 인라인 패널 (아코디언) ✨ */}
                                <AnimatePresence>
                                    {expandedId === r.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-gray-100 mt-4 pt-4 ml-[52px]">
                                                {/* 변호사 의견란 */}
                                                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                                                    <h4 className="font-bold flex items-center gap-1.5 mb-2.5 text-xs text-gray-900">
                                                        <Gavel className="w-4 h-4 text-amber-600" />
                                                        변호사 검토 의견
                                                    </h4>
                                                    <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                        {r.lawyerAnswer || "안내: 아직 답변 내용이 등록되지 않았습니다."}
                                                    </div>
                                                </div>

                                                {/* 추가 문의란 */}
                                                <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                                                    <textarea
                                                        value={followupText}
                                                        onChange={e => setFollowupText(e.target.value)}
                                                        placeholder="위 답변과 관련하여 추가적인 질문이나 요청사항이 있으신가요?"
                                                        className="w-full text-xs outline-none resize-none pt-1 text-gray-800 placeholder:text-gray-400"
                                                        rows={2}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <div className="flex justify-end mt-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleFollowupSubmit(r); }}
                                                            disabled={!followupText.trim()}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-opacity disabled:opacity-50"
                                                            style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                                                        >
                                                            <Send className="w-3.5 h-3.5" /> 추가 문의 접수
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
            <ServiceRequestModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                defaultType="consultation"
                defaultTitle={modalDefaultTitle}
                defaultDetail={modalDefaultDetail}
            />
        </div>
    );
}
