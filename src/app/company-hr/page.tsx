'use client';
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Building2, Download, Lock } from 'lucide-react';
import { getSession, getPendingByCompany, approvePending, rejectPending, type PendingMember } from '@/lib/auth';

const COMPANY = { name: '기업', plan: '기본', since: '2024-01', headCount: 0, storeCount: 0 };
const MONTHLY: any[] = [];
const BY_TYPE: any[] = [];
const BY_GROUP: any[] = [];
const THIS_MONTH = { total: 0, avgResponse: '-', satisfaction: 0, pending: 0 };

// Components
import { CompanyStatsTab } from './components/CompanyStatsTab';
import { MemberApprovalTab } from './components/MemberApprovalTab';

function downloadReport() {
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
    const rows: string[][] = [];

    // Header
    rows.push([`${COMPANY.name} 법무 서비스 이용 리포트`]);
    rows.push([`생성일: ${today}`]);
    rows.push([`플랜: ${COMPANY.plan}`, `임직원: ${COMPANY.headCount}명`, `가맹점: ${COMPANY.storeCount}개`]);
    rows.push([]);

    // KPI
    rows.push(['[이번달 KPI]']);
    rows.push(['총 상담 건수', '평균 응답 시간', '만족도', '처리 대기']);
    rows.push([`${THIS_MONTH.total}건`, THIS_MONTH.avgResponse, `${THIS_MONTH.satisfaction}%`, `${THIS_MONTH.pending}건`]);
    rows.push([]);

    // Monthly trend
    rows.push(['[월별 상담 추이]']);
    rows.push(['월', '총 건수', '법률', 'HR', '기타', 'Q&A', '계약', '소송']);
    MONTHLY.forEach(m => rows.push([m.month, String(m.total), String(m.legal), String(m.hr), String(m.other), String(m.qna), String(m.contract), String(m.lit)]));
    rows.push([]);

    // By type
    rows.push(['[상담 유형별]']);
    rows.push(['유형', '건수', '비중']);
    BY_TYPE.forEach(t => rows.push([t.label, `${t.count}건`, `${t.pct}%`]));
    rows.push([]);

    // By group
    rows.push(['[그룹별 이용 현황]']);
    rows.push(['그룹', '총 건수', '1인 평균 이용일', '비중']);
    BY_GROUP.forEach(g => rows.push([g.group, `${g.count}건`, `${g.avg}일`, `${g.pct}%`]));

    const csv = '\uFEFF' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IBS_법무리포트_${COMPANY.name}_${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function CompanyHRPage() {
    const [tab, setTab] = useState<'stats' | 'members'>('stats');
    const [period, setPeriod] = useState('6개월');
    const [pending, setPending] = useState<PendingMember[]>([]);
    const [companyId, setCompanyId] = useState('c2');

    useEffect(() => {
        const s = getSession();
        if (s?.companyId) setCompanyId(s.companyId);
    }, []);

    const loadPending = () => setPending(getPendingByCompany(companyId));

    useEffect(() => { loadPending(); }, [companyId]);

    const pendingCount = pending.filter(p => p.status === 'pending').length;

    const handleApprove = (id: string) => { approvePending(id); loadPending(); };
    const handleReject = (id: string) => { rejectPending(id); loadPending(); };

    const addMockPending = () => {
         
        const { requestAffiliation } = require('@/lib/auth');
        requestAffiliation({ name: '김가맹점주', email: 'test@franchise.com', phone: '010-1234-5678', companyId, companyName: COMPANY.name, message: '교촌 서초점 점주입니다' });
        loadPending();
    };

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-6xl mx-auto px-4">
                {/* ── 헤더 ── */}
                <div className="flex items-start justify-between py-5 mb-1" style={{ borderBottom: '1px solid #e8e5de' }}>
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
                        <button 
                            onClick={downloadReport}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80 active:scale-95"
                            style={{ background: '#111827', color: '#e8c87a', border: '1px solid #374151', cursor: 'pointer' }}>
                            <Download className="w-3.5 h-3.5" /> 리포트 다운로드
                        </button>
                    </div>
                </div>

                {/* ── 탭 메뉴 ── */}
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

                {/* ── 탭 내용 ── */}
                <AnimatePresence mode="wait">
                    {tab === 'stats' && (
                        <CompanyStatsTab period={period} setPeriod={setPeriod} />
                    )}
                    {tab === 'members' && (
                        <MemberApprovalTab 
                            pending={pending} 
                            loadPending={loadPending} 
                            addMockPending={addMockPending} 
                            handleApprove={handleApprove} 
                            handleReject={handleReject} 
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
