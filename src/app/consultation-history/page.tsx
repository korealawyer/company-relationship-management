'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare, Scale, Brain, Briefcase, Clock, CheckCircle2,
    AlertCircle, ChevronRight, Search, Filter, ArrowRight,
    Lock, Star, Phone, Bot, Calendar,
} from 'lucide-react';
import Link from 'next/link';

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
}

const TYPE_META: Record<ConsultType, { label: string; icon: React.ElementType; color: string }> = {
    legal: { label: '법률 상담', icon: Scale, color: '#c9a84c' },
    eap: { label: '심리/EAP', icon: Brain, color: '#818cf8' },
    business: { label: '경영 자문', icon: Briefcase, color: '#34d399' },
};

const STATUS_META: Record<ConsultStatus, { label: string; color: string; bg: string }> = {
    completed: { label: '답변 완료', color: '#059669', bg: '#ecfdf5' },
    in_progress: { label: '검토 중', color: '#d97706', bg: '#fffbeb' },
    waiting: { label: '답변 대기', color: '#2563eb', bg: '#eff6ff' },
    closed: { label: '종결', color: '#6b7280', bg: '#f3f4f6' },
};

/* ── 목업 데이터 ──────────────────────────────────────── */
const MOCK_RECORDS: ConsultRecord[] = [
    {
        id: 'c1', caseId: 'IBS-2026-384291', type: 'legal',
        title: '가맹계약서 독소조항 문의',
        summary: '가맹계약서 제12조 위약금 조항의 불공정성에 대해 법률 자문을 요청했습니다. 이지원 변호사가 수정안을 포함한 상세 의견을 제출.',
        date: '2026.03.14', status: 'completed', lawyer: '이지원 변호사',
        responseTime: '6시간', satisfaction: 5, messageCount: 12,
    },
    {
        id: 'c2', caseId: 'IBS-2026-392847', type: 'legal',
        title: '개인정보보호법 관련 긴급 자문',
        summary: '가맹점에서 고객 개인정보 유출 사고 발생. 대응 절차 및 신고 의무에 대한 긴급 자문 진행 중.',
        date: '2026.03.12', status: 'in_progress', lawyer: '김수현 변호사',
        messageCount: 8,
    },
    {
        id: 'c3', caseId: 'IBS-2026-401523', type: 'business',
        title: '신규 직영점 설립 시 필요 인허가 사항',
        summary: '서울 강남구 대치동에 신규 직영점 설립 예정. 위생허가, 영업신고 등 필요 인허가 목록 문의.',
        date: '2026.03.10', status: 'waiting',
        messageCount: 3,
    },
    {
        id: 'c4', caseId: 'IBS-2026-378452', type: 'eap',
        title: '직장 내 갈등 상담 (익명)',
        summary: '본사 부서 간 업무 갈등으로 인한 스트레스 상담. 전문 상담사 연결 완료.',
        date: '2026.03.08', status: 'completed', satisfaction: 4, messageCount: 15,
    },
    {
        id: 'c5', caseId: 'IBS-2026-365891', type: 'legal',
        title: '근로자 퇴직금 산정 방법 문의',
        summary: '3년 근속 직원의 퇴직금 산정 기준 및 중간정산 가능 여부에 대한 자문.',
        date: '2026.02.28', status: 'closed', lawyer: '이지원 변호사',
        responseTime: '4시간', satisfaction: 5, messageCount: 7,
    },
    {
        id: 'c6', caseId: 'IBS-2026-354127', type: 'business',
        title: '공정거래위원회 정보공개서 갱신',
        summary: '연간 정보공개서 갱신 기한 도래. 필수 기재사항 변경 내역 확인 및 제출 대행 요청.',
        date: '2026.02.20', status: 'completed', lawyer: '김수현 변호사',
        responseTime: '12시간', satisfaction: 5, messageCount: 9,
    },
];

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
    const [filterType, setFilterType] = useState<ConsultType | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<ConsultStatus | 'all'>('all');
    const [search, setSearch] = useState('');
    const [isSubscribed] = useState(true);

    if (!isSubscribed) return <SubscribeCTA />;

    const filtered = MOCK_RECORDS.filter(r => {
        if (filterType !== 'all' && r.type !== filterType) return false;
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        if (search && !r.title.includes(search) && !r.caseId.includes(search)) return false;
        return true;
    });

    const stats = {
        total: MOCK_RECORDS.length,
        active: MOCK_RECORDS.filter(r => r.status === 'in_progress' || r.status === 'waiting').length,
        avgSatisfaction: (MOCK_RECORDS.filter(r => r.satisfaction).reduce((a, r) => a + (r.satisfaction || 0), 0) / MOCK_RECORDS.filter(r => r.satisfaction).length).toFixed(1),
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
                    <Link href="/chat">
                        <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold"
                            style={{ background: '#111827', color: '#fff' }}>
                            <MessageSquare className="w-3.5 h-3.5" /> 새 상담
                        </button>
                    </Link>
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
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-5 rounded-2xl transition-all hover:shadow-md"
                                style={{ background: '#fff', border: '1px solid #e8e5de' }}
                            >
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

                                <div className="flex items-center justify-between pl-[52px]">
                                    <div className="flex items-center gap-3 text-[11px]" style={{ color: '#9ca3af' }}>
                                        {r.lawyer && <span>👔 {r.lawyer}</span>}
                                        {r.responseTime && <span>⏱ {r.responseTime}</span>}
                                        <span>💬 {r.messageCount}건</span>
                                        {r.satisfaction && (
                                            <span className="flex items-center gap-0.5">
                                                {'★'.repeat(r.satisfaction)}{'☆'.repeat(5 - r.satisfaction)}
                                            </span>
                                        )}
                                    </div>
                                    <Link href="/chat">
                                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold"
                                            style={{ background: `${typeMeta.color}10`, color: typeMeta.color }}>
                                            {r.status === 'completed' || r.status === 'closed' ? '다시 문의' : '이어서 대화'}
                                            <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
