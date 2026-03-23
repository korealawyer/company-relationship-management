'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, MessageSquare, Clock, ShieldCheck, Building2, Download,
    Phone, Mail, Lock, CheckCircle2, AlertCircle, Briefcase,
    UserCheck, UserX, Clock3, RefreshCw
} from 'lucide-react';
import {
    getSession, getPendingByCompany, approvePending,
    rejectPending, type PendingMember
} from '@/lib/auth';

// ── 목업 데이터 ────────────────────────────────────────────
const COMPANY = { name: '(주)교촌에프앤비', plan: '프리미엄 플랜', since: '2025.09', storeCount: 1_200, headCount: 3_800 };

const MONTHLY = [
    { month: '10월', total: 38, legal: 22, hr: 10, other: 6 },
    { month: '11월', total: 45, legal: 28, hr: 12, other: 5 },
    { month: '12월', total: 41, legal: 25, hr: 11, other: 5 },
    { month: '1월', total: 53, legal: 33, hr: 14, other: 6 },
    { month: '2월', total: 49, legal: 31, hr: 13, other: 5 },
    { month: '3월', total: 57, legal: 36, hr: 15, other: 6 },
];
const BY_TYPE = [
    { label: '계약·가맹', count: 89, pct: 38, color: '#818cf8' },
    { label: '노무·인사', count: 63, pct: 27, color: '#34d399' },
    { label: '분쟁·민원', count: 47, pct: 20, color: '#f59e0b' },
    { label: '개인정보', count: 24, pct: 10, color: '#f87171' },
    { label: '기타', count: 12, pct: 5, color: '#94a3b8' },
];
const BY_GROUP = [
    { group: '본사 임직원', count: 94, avg: 25, pct: 40 },
    { group: '직영점', count: 71, avg: 22, pct: 30 },
    { group: '가맹점주', count: 56, avg: 18, pct: 24 },
    { group: '가맹점 직원', count: 14, avg: 14, pct: 6 },
];
const THIS_MONTH = { total: 57, avgResponse: '4.2h', satisfaction: 96, pending: 3 };

// ── 승인 상태 배지 ─────────────────────────────────────────
function StatusBadge({ status }: { status: PendingMember['status'] }) {
    const map = {
        pending: { label: '대기 중', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        approved: { label: '승인됨', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
        rejected: { label: '거절됨', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    };
    const m = map[status];
    return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ color: m.color, background: m.bg }}>
            {m.label}
        </span>
    );
}

// ── StotCard ───────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
    return (
        <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
                <span style={{ color }}>{icon}</span>
            </div>
            <div className="text-2xl font-black mb-0.5" style={{ color }}>{value}</div>
            <div className="text-xs font-bold" style={{ color: '#6b7280' }}>{label}</div>
            {sub && <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>{sub}</div>}
        </div>
    );
}

// ── 메인 페이지 ────────────────────────────────────────────
export default function CompanyHRPage() {
    const [tab, setTab] = useState<'stats' | 'members'>('stats');
    const [period, setPeriod] = useState('6개월');
    const [pending, setPending] = useState<PendingMember[]>([]);
    const [companyId, setCompanyId] = useState('c2'); // 기본값

    const maxBar = Math.max(...MONTHLY.map(m => m.total));

    // 세션에서 companyId 가져오기
    useEffect(() => {
        const s = getSession();
        if (s?.companyId) setCompanyId(s.companyId);
    }, []);

    const loadPending = () => setPending(getPendingByCompany(companyId));

    useEffect(() => { loadPending(); }, [companyId]);

    const pendingCount = pending.filter(p => p.status === 'pending').length;

    const handleApprove = (id: string) => { approvePending(id); loadPending(); };
    const handleReject = (id: string) => { rejectPending(id); loadPending(); };

    // 목업 pending 추가 (테스트용)
    const addMockPending = () => {
        const { requestAffiliation } = require('@/lib/auth');
        requestAffiliation({ name: '김가맹점주', email: 'test@franchise.com', phone: '010-1234-5678', companyId, companyName: COMPANY.name, message: '교촌 서초점 점주입니다' });
        loadPending();
    };

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-6xl mx-auto px-4">

                {/* ── 헤더 ── */}
                <div className="flex items-start justify-between py-5 mb-1"
                    style={{ borderBottom: '1px solid #e8e5de' }}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4" style={{ color: '#c9a84c' }} />
                            <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>{COMPANY.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
                                {COMPANY.plan}
                            </span>
                        </div>
                        <h1 className="text-xl font-black" style={{ color: '#111827' }}>법무 서비스 사용 현황</h1>
                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                            {COMPANY.since} 도입 · 임직원 {COMPANY.headCount.toLocaleString()}명 · 가맹점 {COMPANY.storeCount.toLocaleString()}개
                            &nbsp;·&nbsp;<Lock className="w-3 h-3 inline mr-0.5" />익명 집계만 표시
                        </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                            style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e8e5de' }}>
                            <Download className="w-3.5 h-3.5" /> 리포트 다운로드
                        </button>
                    </div>
                </div>

                {/* ── 탭 ── */}
                <div className="flex gap-1 mt-4 mb-5">
                    {[
                        { key: 'stats', label: '사용 현황' },
                        { key: 'members', label: `멤버 승인${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                            style={{
                                background: tab === t.key ? '#fef3c7' : '#f3f4f6',
                                color: tab === t.key ? '#92400e' : '#6b7280',
                                border: tab === t.key ? '1px solid #fde68a' : '1px solid #e8e5de',
                            }}>
                            {t.label}
                            {t.key === 'members' && pendingCount > 0 && (
                                <span className="ml-1.5 w-4 h-4 rounded-full text-[10px] font-black inline-flex items-center justify-center"
                                    style={{ background: '#f59e0b', color: '#111827' }}>
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* ── TAB 1: 사용 현황 ── */}
                    {tab === 'stats' && (
                        <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                            {/* KPI */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <StatCard icon={<MessageSquare className="w-4 h-4" />} label="총 상담 건수" value={THIS_MONTH.total} sub="전월 대비 +16%" color="#c9a84c" />
                                <StatCard icon={<Clock className="w-4 h-4" />} label="평균 응답 시간" value={THIS_MONTH.avgResponse} sub="업무시간 기준" color="#818cf8" />
                                <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="만족도" value={`${THIS_MONTH.satisfaction}%`} sub="구성원 응답 기준" color="#34d399" />
                                <StatCard icon={<AlertCircle className="w-4 h-4" />} label="처리 대기" value={THIS_MONTH.pending} sub="72h 이내 완료 예정" color="#f59e0b" />
                            </div>

                            <div className="grid lg:grid-cols-3 gap-4">
                                {/* 월별 차트 */}
                                <div className="lg:col-span-2 p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <p className="font-black text-sm" style={{ color: '#111827' }}>월별 상담 추이</p>
                                            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>유형별 분류 포함</p>
                                        </div>
                                        <div className="flex gap-1">
                                            {['3개월', '6개월'].map(p => (
                                                <button key={p} onClick={() => setPeriod(p)}
                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                                                    style={{ background: period === p ? '#fef3c7' : '#f3f4f6', color: period === p ? '#c9a84c' : '#6b7280', border: period === p ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent' }}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2 h-36">
                                        {(period === '3개월' ? MONTHLY.slice(-3) : MONTHLY).map((m, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-[10px] font-black" style={{ color: '#c9a84c' }}>{m.total}</span>
                                                <div className="w-full rounded-t-lg overflow-hidden flex flex-col-reverse" style={{ height: `${(m.total / maxBar) * 100}px`, minHeight: 8 }}>
                                                    <div style={{ height: `${(m.legal / m.total) * 100}%`, background: '#818cf8', minHeight: 4 }} />
                                                    <div style={{ height: `${(m.hr / m.total) * 100}%`, background: '#34d399' }} />
                                                    <div style={{ height: `${(m.other / m.total) * 100}%`, background: '#f59e0b' }} />
                                                </div>
                                                <span className="text-[10px]" style={{ color: '#9ca3af' }}>{m.month}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                                        {[{ label: '법률', color: '#818cf8' }, { label: '노무·HR', color: '#34d399' }, { label: '기타', color: '#f59e0b' }].map(l => (
                                            <div key={l.label} className="flex items-center gap-1.5 text-[10px]" style={{ color: '#6b7280' }}>
                                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                                                {l.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 유형별 */}
                                <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                    <p className="font-black text-sm mb-1" style={{ color: '#111827' }}>상담 유형별</p>
                                    <p className="text-[10px] mb-4" style={{ color: '#9ca3af' }}>누적 전체 기간</p>
                                    <div className="space-y-3">
                                        {BY_TYPE.map(t => (
                                            <div key={t.label}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span style={{ color: '#374151' }}>{t.label}</span>
                                                    <span className="font-black" style={{ color: t.color }}>{t.count}건</span>
                                                </div>
                                                <div className="h-1.5 rounded-full" style={{ background: '#e5e7eb' }}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${t.pct}%` }} transition={{ duration: 0.8 }}
                                                        className="h-full rounded-full" style={{ background: t.color }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 그룹별 */}
                            <div className="mt-4 p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                <p className="font-black text-sm mb-1" style={{ color: '#111827' }}>그룹별 이용 현황</p>
                                <p className="text-[10px] mb-4" style={{ color: '#9ca3af' }}>개인 식별 불가 익명 통계 · 부서/점포명 미포함</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {BY_GROUP.map((g, i) => (
                                        <div key={i} className="p-4 rounded-xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                            <div className="flex items-center gap-1.5 mb-3">
                                                <Briefcase className="w-3.5 h-3.5" style={{ color: '#c9a84c' }} />
                                                <span className="text-[11px] font-bold" style={{ color: '#374151' }}>{g.group}</span>
                                            </div>
                                            <div className="text-2xl font-black mb-0.5" style={{ color: '#111827' }}>{g.count}<span className="text-sm font-normal ml-1" style={{ color: '#9ca3af' }}>건</span></div>
                                            <div className="text-xs mb-3" style={{ color: '#9ca3af' }}>1인 평균 {g.avg}일 이용</div>
                                            <div className="h-1.5 rounded-full" style={{ background: '#e5e7eb' }}>
                                                <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: 'linear-gradient(90deg,#c9a84c,#e8c87a)' }} />
                                            </div>
                                            <div className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>{g.pct}% 비중</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 플랜+연락처 */}
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                    <p className="font-black text-sm mb-4" style={{ color: '#111827' }}>현재 플랜</p>
                                    <div className="flex items-start gap-3 p-3 rounded-xl mb-3" style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.15)' }}>
                                        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#c9a84c' }} />
                                        <div>
                                            <p className="text-sm font-black" style={{ color: '#c9a84c' }}>본사 지원 프리미엄</p>
                                            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>임직원·가맹점주 전원 무제한 이용</p>
                                        </div>
                                    </div>
                                    {['법률 문서 검토 무제한', '전담 변호사 24h 응답', '노무·HR 자문', '개인정보 컴플라이언스', '월별 리포트 자동 발송'].map(f => (
                                        <div key={f} className="flex items-center gap-2 text-xs mb-1.5" style={{ color: '#374151' }}>
                                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#34d399' }} />{f}
                                        </div>
                                    ))}
                                </div>

                                <div className="p-5 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                    <p className="font-black text-sm mb-4" style={{ color: '#111827' }}>담당 변호사</p>
                                    {[
                                        { name: '김수현 변호사', role: '법률 전담', phone: '02-1234-5678', email: 'lawyer1@ibslaw.kr', color: '#818cf8' },
                                    ].map(l => (
                                        <div key={l.name} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs" style={{ background: `${l.color}15`, color: l.color }}>{l.name[0]}</div>
                                                <div>
                                                    <p className="text-sm font-black" style={{ color: '#111827' }}>{l.name}</p>
                                                    <p className="text-[10px]" style={{ color: '#9ca3af' }}>{l.role}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <a href={`tel:${l.phone}`} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}><Phone className="w-3.5 h-3.5" /></a>
                                                <a href={`mailto:${l.email}`} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8' }}><Mail className="w-3.5 h-3.5" /></a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── TAB 2: 멤버 승인 ── */}
                    {tab === 'members' && (
                        <motion.div key="members" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-black" style={{ color: '#111827' }}>소속 가입 신청 관리</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                                        회원가입 시 "소속 신청"을 선택한 구성원 목록입니다. 본인 확인 후 승인해주세요.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {/* 테스트 데이터 추가 버튼 */}
                                    <button onClick={addMockPending}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                                        style={{ background: 'rgba(201,168,76,0.08)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.15)' }}>
                                        + 테스트 신청 추가
                                    </button>
                                    <button onClick={loadPending}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                                        style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #e8e5de' }}>
                                        <RefreshCw className="w-3.5 h-3.5" /> 새로고침
                                    </button>
                                </div>
                            </div>

                            {/* KPI 요약 */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {[
                                    { label: '대기 중', value: pending.filter(p => p.status === 'pending').length, color: '#f59e0b', icon: <Clock3 className="w-4 h-4" /> },
                                    { label: '승인됨', value: pending.filter(p => p.status === 'approved').length, color: '#34d399', icon: <UserCheck className="w-4 h-4" /> },
                                    { label: '거절됨', value: pending.filter(p => p.status === 'rejected').length, color: '#f87171', icon: <UserX className="w-4 h-4" /> },
                                ].map(k => (
                                    <div key={k.label} className="p-4 rounded-2xl flex items-center gap-3"
                                        style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
                                        <div>
                                            <div className="text-xl font-black" style={{ color: k.color }}>{k.value}</div>
                                            <div className="text-xs" style={{ color: '#6b7280' }}>{k.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 신청 목록 */}
                            {pending.length === 0 ? (
                                <div className="text-center py-16 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                                    <Users className="w-10 h-10 mx-auto mb-3" style={{ color: '#d1d5db' }} />
                                    <p className="text-sm font-black mb-1" style={{ color: '#9ca3af' }}>소속 신청이 없습니다</p>
                                    <p className="text-xs" style={{ color: '#9ca3af' }}>구성원이 가입 시 "소속 신청"을 선택하면 여기 표시됩니다.</p>
                                    <button onClick={addMockPending} className="mt-4 px-4 py-2 rounded-lg text-xs font-bold"
                                        style={{ background: 'rgba(201,168,76,0.08)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.15)' }}>
                                        테스트 데이터 추가해보기
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {pending.map(p => (
                                        <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl"
                                            style={{ background: '#fff', border: `1px solid ${p.status === 'pending' ? 'rgba(245,158,11,0.2)' : '#e8e5de'}` }}>

                                            {/* 아바타 */}
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                                                style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>
                                                {p.name[0]}
                                            </div>

                                            {/* 정보 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="font-black text-sm" style={{ color: '#111827' }}>{p.name}</p>
                                                    <StatusBadge status={p.status} />
                                                </div>
                                                <p className="text-xs" style={{ color: '#6b7280' }}>{p.email}{p.phone && ` · ${p.phone}`}</p>
                                                {p.message && (
                                                    <p className="text-[11px] mt-1 px-2 py-1 rounded-lg" style={{ background: '#f9fafb', color: '#6b7280' }}>
                                                        "{p.message}"
                                                    </p>
                                                )}
                                                <p className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>
                                                    신청일: {new Date(p.requestedAt).toLocaleDateString('ko-KR')}
                                                </p>
                                            </div>

                                            {/* 액션 버튼 */}
                                            {p.status === 'pending' && (
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button onClick={() => handleApprove(p.id)}
                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all hover:opacity-80"
                                                        style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                                                        <UserCheck className="w-3.5 h-3.5" /> 승인
                                                    </button>
                                                    <button onClick={() => handleReject(p.id)}
                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all hover:opacity-80"
                                                        style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.15)' }}>
                                                        <UserX className="w-3.5 h-3.5" /> 거절
                                                    </button>
                                                </div>
                                            )}
                                            {p.status === 'approved' && (
                                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#34d399' }} />
                                            )}
                                            {p.status === 'rejected' && (
                                                <UserX className="w-5 h-5 flex-shrink-0" style={{ color: '#f87171' }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 익명 안내 */}
                            <p className="text-[10px] mt-6 text-center" style={{ color: '#9ca3af' }}>
                                <Lock className="w-3 h-3 inline mr-1" />승인 후에도 개인별 상담 내용은 HR 담당자에게 공개되지 않습니다.
                            </p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
