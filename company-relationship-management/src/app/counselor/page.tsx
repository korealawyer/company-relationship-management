'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Heart, Users, Clock, CheckCircle2, Calendar,
    MessageSquare, AlertCircle, FileText, Eye, Search,
} from 'lucide-react';

// ── 색상 시스템 (영업 CRM 통일) ─────────────────────────────
const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff', rowHover: '#f1f5f9',
};

// ── 더미 데이터 ──────────────────────────────────────────────
const COUNSELING_CASES = [
    { id: 'c1', name: '강지훈', company: '(주)교촌에프앤비', type: '직장 스트레스', session: 3, nextDate: '2026-03-07', status: 'ongoing', risk: 'MEDIUM', lastNote: '업무 과중 및 대인관계 갈등 호소. CBT 기반 접근 지속 예정.' },
    { id: 'c2', name: '이수진', company: '맥도날드코리아', type: '번아웃', session: 1, nextDate: '2026-03-10', status: 'new', risk: 'HIGH', lastNote: '초기 상담 완료. 자기효능감 저하 및 수면 문제 확인.' },
    { id: 'c3', name: '박민우', company: '(주)본죽', type: '가족 갈등', session: 5, nextDate: '2026-03-12', status: 'ongoing', risk: 'LOW', lastNote: '관계 개선 뚜렷. 마무리 단계 접근 중.' },
    { id: 'c4', name: '최유리', company: '(주)파리바게뜨', type: '불안 장애', session: 8, nextDate: null, status: 'completed', risk: 'LOW', lastNote: '목표 달성 후 종결. 6개월 후 추적 상담 예정.' },
    { id: 'c5', name: '정태호', company: '(주)bhc치킨', type: '직장 스트레스', session: 2, nextDate: '2026-03-09', status: 'ongoing', risk: 'HIGH', lastNote: '팀장과의 갈등 심화. 위기 개입 프로토콜 검토 중.' },
];

const RISK_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
    HIGH: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: '고위험' },
    MEDIUM: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: '주의' },
    LOW: { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: '안정' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    new: { label: '신규', color: '#2563eb', bg: '#eff6ff' },
    ongoing: { label: '진행 중', color: '#d97706', bg: '#fffbeb' },
    completed: { label: '종결', color: '#16a34a', bg: '#f0fdf4' },
};

export default function CounselorPage() {
    const [filter, setFilter] = useState<'all' | 'new' | 'ongoing' | 'completed'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const filtered = COUNSELING_CASES
        .filter(c => filter === 'all' || c.status === filter)
        .filter(c => !search || c.name.includes(search) || c.company.includes(search));

    const stats = [
        { label: '담당 사례', value: COUNSELING_CASES.length, color: '#b8960a', bg: '#fffbeb', border: '#fde68a' },
        { label: '이번 주 상담', value: COUNSELING_CASES.filter(c => c.nextDate).length, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
        { label: '고위험 내담자', value: COUNSELING_CASES.filter(c => c.risk === 'HIGH').length, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
        { label: '종결 사례', value: COUNSELING_CASES.filter(c => c.status === 'completed').length, color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
    ];

    return (
        <div className="min-h-screen" style={{ background: T.bg }}>
            <div className="max-w-7xl mx-auto px-6 py-6 pt-24 space-y-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black" style={{ color: T.heading }}>EAP 상담사 포털</h1>
                        <p className="text-xs mt-0.5" style={{ color: T.muted }}>IBS 법률사무소 · Employee Assistance Program</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.faint }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="내담자·소속기업 검색..."
                            className="pl-9 pr-4 py-2 rounded-xl outline-none text-sm w-56"
                            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.heading }} />
                    </div>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-4 gap-3">
                    {stats.map(c => (
                        <div key={c.label} className="px-5 py-4 rounded-2xl" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                            <p className="text-xs font-bold mb-1" style={{ color: c.color }}>{c.label}</p>
                            <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* 필터 탭 */}
                <div className="flex gap-2">
                    {([
                        { key: 'all' as const, label: `전체 ${COUNSELING_CASES.length}` },
                        { key: 'new' as const, label: '신규' },
                        { key: 'ongoing' as const, label: '진행 중' },
                        { key: 'completed' as const, label: '종결' },
                    ]).map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                            style={{
                                background: filter === f.key ? '#fffbeb' : 'transparent',
                                border: filter === f.key ? '1px solid #fde68a' : '1px solid transparent',
                                color: filter === f.key ? '#b8960a' : T.muted,
                            }}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* 테이블 */}
                <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ background: '#f8f9fc', borderBottom: `2px solid ${T.border}` }}>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>내담자</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>소속기업</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>상담유형</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>회기</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>다음 일정</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>위험도</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>상태</th>
                                    <th className="py-3 px-4 text-left text-xs font-black" style={{ color: '#b8960a' }}>액션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-12 text-sm" style={{ color: T.faint }}>해당하는 사례가 없습니다.</td></tr>
                                )}
                                {filtered.map(c => {
                                    const rm = RISK_META[c.risk] ?? RISK_META.LOW;
                                    const sm = STATUS_META[c.status] ?? STATUS_META.ongoing;
                                    const isExpanded = expandedId === c.id;

                                    return (
                                        <React.Fragment key={c.id}>
                                            <tr className="transition-colors cursor-pointer hover:bg-slate-50"
                                                style={{ borderBottom: `1px solid ${T.borderSub}`, background: c.risk === 'HIGH' ? '#fef2f206' : undefined }}
                                                onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                                                <td className="py-3 px-4 font-bold" style={{ color: T.heading }}>
                                                    <div className="flex items-center gap-2">
                                                        {c.risk === 'HIGH' && <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#dc2626' }} />}
                                                        {c.name}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-xs" style={{ color: T.sub }}>{c.company}</td>
                                                <td className="py-3 px-4 text-xs font-medium" style={{ color: T.body }}>{c.type}</td>
                                                <td className="py-3 px-4 font-bold" style={{ color: T.body }}>{c.session}회</td>
                                                <td className="py-3 px-4 text-xs" style={{ color: c.nextDate ? '#2563eb' : T.faint }}>
                                                    {c.nextDate ? (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(c.nextDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    ) : '미정'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                        style={{ background: rm.bg, color: rm.color, border: `1px solid ${rm.border}` }}>
                                                        {rm.label}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold"
                                                        style={{ background: sm.bg, color: sm.color }}>
                                                        {sm.label}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button className="text-xs font-bold px-3 py-1 rounded-lg"
                                                        style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                                                        onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : c.id); }}>
                                                        <Eye className="w-3 h-3 inline mr-1" />{isExpanded ? '접기' : '상세'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* 확장 행: 상세 정보 */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={8}>
                                                        <div className="px-6 py-4" style={{ background: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
                                                            <div className="grid grid-cols-2 gap-6">
                                                                {/* 내담자 정보 */}
                                                                <div>
                                                                    <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: T.sub }}>
                                                                        <FileText className="w-3.5 h-3.5" />내담자 정보
                                                                    </p>
                                                                    <div className="space-y-2">
                                                                        {[
                                                                            { label: '성명', value: c.name },
                                                                            { label: '소속', value: c.company },
                                                                            { label: '상담 유형', value: c.type },
                                                                            { label: '회기 수', value: `${c.session}회기` },
                                                                            { label: '다음 일정', value: c.nextDate ?? '미정' },
                                                                        ].map(row => (
                                                                            <div key={row.label} className="flex justify-between text-xs px-3 py-1.5 rounded-lg"
                                                                                style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                                                                                <span className="font-medium" style={{ color: T.sub }}>{row.label}</span>
                                                                                <span className="font-bold" style={{ color: T.heading }}>{row.value}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                {/* 최근 메모 */}
                                                                <div>
                                                                    <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: T.sub }}>
                                                                        <MessageSquare className="w-3.5 h-3.5" />최근 상담 메모
                                                                    </p>
                                                                    <div className="p-4 rounded-xl text-sm leading-relaxed"
                                                                        style={{ background: T.card, border: `1px solid ${T.borderSub}`, color: T.body }}>
                                                                        {c.lastNote}
                                                                    </div>
                                                                </div>
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
            </div>
        </div>
    );
}
