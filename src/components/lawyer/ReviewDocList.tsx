'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Building, CheckCircle2, Clock, Scale, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { type Company } from '@/lib/types';
import { ChevronLeft, ChevronRight as ChevronRightIcon, RefreshCw } from 'lucide-react';
import { useCompanies } from '@/hooks/useDataLayer';

// ── 로컬 상수 ────────────────────────────────────────────────
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
const LEVEL_LABEL: Record<string, string> = { HIGH: '고위험', MEDIUM: '주의', LOW: '참고' };
const LEVEL_ICON: Record<string, string> = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' };

// ── 컴포넌트 ─────────────────────────────────────────────────
export default function ReviewDocList({ cases }: { cases: Company[] }) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const pageSize = 5;
    
    const { updateCompany, mutate: refreshCompanies } = useCompanies();
    const [analyzingId, setAnalyzingId] = React.useState<string | null>(null);

    const handleReanalyze = async (c: Company) => {
        if (!confirm(`${c.name}의 개인정보처리방침을 재분석하시겠습니까?`)) return;
        setAnalyzingId(c.id);
        
        try {
            await updateCompany(c.id, { status: 'reviewing' });
            refreshCompanies();

            const promptConfig = (await import('@/lib/prompts/privacy')).getPromptConfig();
            
            // 크롤링 URL 생성 제거됨 (DB 저장된 데이터만 활용)
            
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    companyId: c.id, 
                    // 크롤링 방지: url을 전송하지 않고 DB 저장된 데이터(rawText 등)만 활용하도록 유도
                    systemPrompt: promptConfig.analyzePrompt,
                    model: promptConfig.model,
                    skipCrawl: true 
                })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                let auditReportMarkdown = null;
                if (data.issues && data.issues.length > 0) {
                    try {
                        const reportRes = await fetch('/api/analyze/report', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                issues: data.issues,
                                companyName: c.name,
                                _promptConfig: promptConfig
                            })
                        });
                        const reportData = await reportRes.json();
                        if (reportRes.ok && reportData.success) {
                            auditReportMarkdown = reportData.reportMarkdown;
                        }
                    } catch (err) {
                        console.error('보고서 생성 에러:', err);
                    }
                }

                await updateCompany(c.id, { 
                    status: 'reviewing',
                    issues: data.issues || [],
                    issueCount: data.issueCount || 0,
                    riskLevel: data.riskLevel || 'MEDIUM',
                    privacyPolicyText: data.rawText || (c as any).privacyPolicyText,
                    ...(auditReportMarkdown ? { audit_report: auditReportMarkdown } : {})
                });
                alert('재분석이 완료되었습니다.');
            } else {
                alert(`재분석 실패: ${data.error || '알 수 없는 오류'}`);
            }
        } catch (err: any) {
            console.error('재분석 에러:', err);
            alert(`재분석 중 오류 발생: ${err.message}`);
        } finally {
            setAnalyzingId(null);
            refreshCompanies();
        }
    };

    const pending = cases.filter(c => ['assigned', 'reviewing'].includes(c.status));
    const totalPages = Math.max(1, Math.ceil(pending.length / pageSize));
    
    // Reset to page 1 if filtered results change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [cases]);

    const paginatedCases = pending.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
            <div className="hidden sm:grid px-5 py-3 gap-3 text-[11px] font-bold tracking-wide"
                style={{ gridTemplateColumns: '1fr 120px 180px 290px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', letterSpacing: '0.05em' }}>
                <span>기업명 / 상태</span>
                <span className="text-center">위험도 분포</span>
                <span className="text-center">미검토 이슈</span>
                <span className="text-right pr-2">검토</span>
            </div>

            {/* 문서 목록 */}
            <div>
                {paginatedCases.map((c, idx) => {
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
                                style={{ gridTemplateColumns: '1fr 120px 180px 290px' }}>
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
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => handleReanalyze(c)}
                                        disabled={analyzingId === c.id}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all hover:shadow-md active:scale-95 border"
                                        style={{ background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                                        <RefreshCw className={`w-3.5 h-3.5 ${analyzingId === c.id ? 'animate-spin' : ''}`} />
                                        {analyzingId === c.id ? '분석중' : '재분석'}
                                    </button>
                                    <Link href={`/lawyer/privacy-review?leadId=${c.id}&company=${encodeURIComponent(c.name)}&preview=1`}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all hover:shadow-md active:scale-95 border"
                                        style={{ background: '#fffbeb', color: '#B45309', borderColor: '#fde68a' }}>
                                        <Scale className="w-3.5 h-3.5" />
                                        검토안 보기
                                    </Link>
                                    <Link href={`/lawyer/privacy-review?leadId=${c.id}&company=${encodeURIComponent(c.name)}`}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all hover:shadow-md active:scale-95"
                                        style={{ background: isUrgent ? '#dc2626' : '#1e293b', color: '#ffffff' }}>
                                        <Scale className="w-3.5 h-3.5" />
                                        상세 검토
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
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => handleReanalyze(c)}
                                            disabled={analyzingId === c.id}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap flex-shrink-0 border"
                                            style={{ background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                                            <RefreshCw className={`w-3 h-3 ${analyzingId === c.id ? 'animate-spin' : ''}`} />
                                            {analyzingId === c.id ? '분석중' : '재분석'}
                                        </button>
                                        <Link href={`/lawyer/privacy-review?leadId=${c.id}&company=${encodeURIComponent(c.name)}&preview=1`}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap flex-shrink-0 border"
                                            style={{ background: '#fffbeb', color: '#B45309', borderColor: '#fde68a' }}>
                                            검토안 보기
                                        </Link>
                                        <Link href={`/lawyer/privacy-review?leadId=${c.id}&company=${encodeURIComponent(c.name)}`}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap flex-shrink-0"
                                            style={{ background: isUrgent ? '#dc2626' : '#1e293b', color: '#ffffff' }}>
                                            상세 검토 <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </div>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
                    <span className="text-xs text-slate-500 font-medium tracking-tight">
                        {pending.length}건 중 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, pending.length)}건 표기
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => {
                                const page = i + 1;
                                // Show first, last, current, and adjacent sibling pages
                                if (
                                    page === 1 || 
                                    page === totalPages || 
                                    Math.abs(page - currentPage) <= 1
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors flex items-center justify-center
                                                ${currentPage === page 
                                                    ? 'bg-violet-50 text-violet-600 border border-violet-200' 
                                                    : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}
                                        >
                                            {page}
                                        </button>
                                    );
                                } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                ) {
                                    return <span key={page} className="text-slate-400 text-xs tracking-widest px-0.5">...</span>;
                                }
                                return null;
                            })}
                        </div>

                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
