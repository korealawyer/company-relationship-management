'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Heart, Users, Clock, CheckCircle2, Calendar,
    MessageSquare, TrendingUp, AlertCircle, Phone,
    FileText, Star,
} from 'lucide-react';

// ── 더미 데이터 ──────────────────────────────────────────────
const COUNSELING_CASES = [
    {
        id: 'c1', name: '강지훈', company: '(주)교촌에프앤비', type: '직장 스트레스',
        session: 3, nextDate: '2026-03-07', status: 'ongoing', risk: 'MEDIUM',
        lastNote: '업무 과중 및 대인관계 갈등 호소. CBT 기반 접근 지속 예정.',
    },
    {
        id: 'c2', name: '이수진', company: '맥도날드코리아', type: '번아웃',
        session: 1, nextDate: '2026-03-10', status: 'new', risk: 'HIGH',
        lastNote: '초기 상담 완료. 자기효능감 저하 및 수면 문제 확인.',
    },
    {
        id: 'c3', name: '박민우', company: '(주)본죽', type: '가족 갈등',
        session: 5, nextDate: '2026-03-12', status: 'ongoing', risk: 'LOW',
        lastNote: '관계 개선 뚜렷. 마무리 단계 접근 중.',
    },
    {
        id: 'c4', name: '최유리', company: '(주)파리바게뜨', type: '불안 장애',
        session: 8, nextDate: null, status: 'completed', risk: 'LOW',
        lastNote: '목표 달성 후 종결. 6개월 후 추적 상담 예정.',
    },
    {
        id: 'c5', name: '정태호', company: '(주)bhc치킨', type: '직장 스트레스',
        session: 2, nextDate: '2026-03-09', status: 'ongoing', risk: 'HIGH',
        lastNote: '팀장과의 갈등 심화. 위기 개입 프로토콜 검토 중.',
    },
];

const RISK_META = {
    HIGH: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: '고위험' },
    MEDIUM: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: '주의' },
    LOW: { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: '안정' },
};

const STATUS_META = {
    new: { label: '신규', color: '#2563eb', bg: '#eff6ff' },
    ongoing: { label: '진행 중', color: '#d97706', bg: '#fffbeb' },
    completed: { label: '종결', color: '#16a34a', bg: '#f0fdf4' },
};

const KPI = [
    { label: '담당 사례', value: '5', icon: Users, color: '#b8960a', bg: '#fffbeb' },
    { label: '이번 주 상담', value: '3', icon: Calendar, color: '#2563eb', bg: '#eff6ff' },
    { label: '고위험 내담자', value: '2', icon: AlertCircle, color: '#dc2626', bg: '#fef2f2' },
    { label: '종결 사례', value: '1', icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4' },
];

export default function CounselorPage() {
    const [filter, setFilter] = useState<'all' | 'new' | 'ongoing' | 'completed'>('all');
    const [selected, setSelected] = useState<string | null>(null);

    const filtered = COUNSELING_CASES.filter(c => filter === 'all' || c.status === filter);
    const selectedCase = COUNSELING_CASES.find(c => c.id === selected) ?? null;

    return (
        <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: '#f8f9fc' }}>
            <div className="max-w-6xl mx-auto">

                {/* 헤더 */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)' }}>
                            <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black" style={{ color: '#0f172a' }}>EAP 상담사 포털</h1>
                            <p className="text-sm font-medium" style={{ color: '#334155' }}>
                                IBS 법률사무소 · Employee Assistance Program
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* KPI 카드 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {KPI.map((k, i) => (
                        <motion.div key={k.label}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="rounded-2xl p-5"
                            style={{ background: '#ffffff', border: '1px solid #d1d5db', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                                    <k.icon className="w-5 h-5" style={{ color: k.color }} />
                                </div>
                            </div>
                            <div className="text-3xl font-black mb-1" style={{ color: '#0f172a' }}>{k.value}</div>
                            <div className="text-xs font-semibold" style={{ color: '#475569' }}>{k.label}</div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* 사례 목록 */}
                    <div className="lg:col-span-2">
                        {/* 필터 */}
                        <div className="flex gap-2 mb-4">
                            {(['all', 'new', 'ongoing', 'completed'] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                                    style={{
                                        background: filter === f ? '#fffbeb' : '#ffffff',
                                        color: filter === f ? '#b8960a' : '#475569',
                                        border: `1px solid ${filter === f ? '#fde68a' : '#d1d5db'}`,
                                    }}>
                                    {f === 'all' ? `전체 ${COUNSELING_CASES.length}` :
                                        f === 'new' ? '신규' :
                                            f === 'ongoing' ? '진행 중' : '종결'}
                                </button>
                            ))}
                        </div>

                        {/* 사례 카드 목록 */}
                        <div className="space-y-3">
                            {filtered.map((c, i) => {
                                const rm = RISK_META[c.risk as keyof typeof RISK_META];
                                const sm = STATUS_META[c.status as keyof typeof STATUS_META];
                                const isSelected = selected === c.id;
                                return (
                                    <motion.div key={c.id}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelected(isSelected ? null : c.id)}
                                        className="rounded-2xl p-4 cursor-pointer transition-all"
                                        style={{
                                            background: '#ffffff',
                                            border: `1.5px solid ${isSelected ? '#c9a84c' : '#d1d5db'}`,
                                            boxShadow: isSelected ? '0 4px 16px rgba(201,168,76,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
                                        }}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                {/* 위험도 좌측 바 */}
                                                <div className="w-1 rounded-full self-stretch" style={{ background: rm.color, minHeight: 40 }} />
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-black text-sm" style={{ color: '#0f172a' }}>{c.name}</p>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                                            style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold border"
                                                            style={{ background: rm.bg, color: rm.color, borderColor: rm.border }}>{rm.label}</span>
                                                    </div>
                                                    <p className="text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                                                        {c.company} · {c.type} · {c.session}회기
                                                    </p>
                                                    <p className="text-xs" style={{ color: '#4b5563' }}>{c.lastNote}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                {c.nextDate ? (
                                                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2563eb' }}>
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(c.nextDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-medium" style={{ color: '#6b7280' }}>일정 없음</span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 사이드 패널 */}
                    <div className="space-y-4">
                        {/* 이번 주 일정 */}
                        <div className="rounded-2xl p-5"
                            style={{ background: '#ffffff', border: '1px solid #d1d5db', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <h3 className="font-black text-sm mb-4 flex items-center gap-2" style={{ color: '#0f172a' }}>
                                <Calendar className="w-4 h-4" style={{ color: '#b8960a' }} /> 이번 주 상담 일정
                            </h3>
                            <div className="space-y-3">
                                {COUNSELING_CASES.filter(c => c.nextDate).map(c => (
                                    <div key={c.id} className="flex items-center gap-3 py-2"
                                        style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                                            style={{ background: '#fffbeb', color: '#b8960a' }}>
                                            {c.session}회
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold" style={{ color: '#1e293b' }}>{c.name}</p>
                                            <p className="text-[10px] font-semibold" style={{ color: '#4b5563' }}>{c.type}</p>
                                        </div>
                                        <p className="text-[10px] font-semibold" style={{ color: '#2563eb' }}>
                                            {c.nextDate ? new Date(c.nextDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '—'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 선택된 내담자 상세 */}
                        {selectedCase ? (
                            <motion.div key={selectedCase.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl p-5"
                                style={{ background: '#ffffff', border: '1.5px solid #c9a84c', boxShadow: '0 4px 16px rgba(201,168,76,0.12)' }}>
                                <h3 className="font-black text-sm mb-4 flex items-center gap-2" style={{ color: '#0f172a' }}>
                                    <FileText className="w-4 h-4" style={{ color: '#b8960a' }} /> 내담자 상세
                                </h3>
                                <div className="space-y-2 text-xs">
                                    {[
                                        { label: '성명', value: selectedCase.name },
                                        { label: '소속', value: selectedCase.company },
                                        { label: '상담 유형', value: selectedCase.type },
                                        { label: '회기 수', value: `${selectedCase.session}회기` },
                                        { label: '다음 일정', value: selectedCase.nextDate ?? '미정' },
                                    ].map(row => (
                                        <div key={row.label} className="flex justify-between py-1.5"
                                            style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <span className="font-semibold" style={{ color: '#374151' }}>{row.label}</span>
                                            <span className="font-bold" style={{ color: '#1e293b' }}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-3 rounded-xl" style={{ background: '#f8f9fc', border: '1px solid #e5e7eb' }}>
                                    <p className="text-xs font-bold mb-1" style={{ color: '#475569' }}>📝 최근 메모</p>
                                    <p className="text-xs leading-relaxed" style={{ color: '#1e293b' }}>{selectedCase.lastNote}</p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="rounded-2xl p-8 text-center" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: '#94a3b8' }} />
                                <p className="text-sm font-medium" style={{ color: '#6b7280' }}>사례를 클릭하면 상세 정보가 표시됩니다</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
