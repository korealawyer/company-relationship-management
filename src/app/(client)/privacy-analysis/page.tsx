'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    Shield, AlertTriangle, CheckCircle2, FileText, ArrowLeft, Loader2,
    AlertOctagon, Scale, ChevronDown, FileSignature, Banknote, HelpCircle,
    FileWarning, BookOpen, ChevronUp, Lock, Award, Clock, Users,
    Star, ArrowRight, Phone, Sparkles, Eye, Bookmark, Download,
    BadgeCheck, Gavel, Building2, TrendingUp, ChevronRight,
    MessageSquare, Zap, ExternalLink
} from 'lucide-react';
import { useCompanies } from '@/hooks/useDataLayer';
import { dataLayer } from '@/lib/dataLayer';
import { getSession } from '@/lib/auth';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ───── Color Constants ───── */
const LVL_COLOR: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
const LVL_LABEL: Record<string, string> = { HIGH: '위반(고위험)', MEDIUM: '시정권고', LOW: '양호' };
const GOLD = '#c9a84c';
const GOLD_LIGHT = '#e8c87a';

/* ───── Animation Variants ───── */
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

/* ───── 개별 이슈 아코디언 (e-book 스타일) ───── */
const IssueItem = ({ issue, index }: { issue: any; index: number }) => {
    const [expanded, setExpanded] = useState(false);
    const isHighRisk = issue.level === 'HIGH';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            style={{
                borderLeft: `4px solid ${isHighRisk ? '#ef4444' : '#f59e0b'}`,
                backgroundColor: 'transparent',
                marginBottom: '2px',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}
            className="transition-all relative z-10"
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left px-8 py-6 flex items-start justify-between gap-4 transition-colors hover:bg-gray-50/50"
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span
                            className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider text-white"
                            style={{ backgroundColor: LVL_COLOR[issue.level || 'MEDIUM'] }}
                        >
                            {LVL_LABEL[issue.level || 'MEDIUM']}
                        </span>
                        <span className="text-[11px] font-bold text-gray-400">{issue.law}</span>
                    </div>
                    <h3 className="text-[15px] font-black text-gray-900 leading-snug">{issue.title}</h3>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-gray-300 mt-1 flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-8 pb-8 space-y-5" style={{ borderTop: '1px solid #f3f4f6' }}>
                            <div className="pt-5 space-y-3">
                                <h4 className="text-xs font-black flex items-center gap-1.5 text-gray-500 uppercase tracking-wider">
                                    <Scale className="w-3.5 h-3.5 text-red-400" /> 법적 제재 및 분쟁 리스크
                                </h4>
                                <div className="p-5 bg-red-50/60 border-l-2 border-red-300 text-sm leading-[1.8] text-red-900 font-medium">
                                    {issue.riskDesc || '리스크 설명이 없습니다.'}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-xs font-black flex items-center gap-1.5 text-gray-500 uppercase tracking-wider">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> 로펌 시정 권고안
                                </h4>
                                <div className="p-5 bg-green-50/60 border-l-2 border-green-300 text-sm leading-[1.8] text-green-900 font-medium">
                                    {issue.customDraft || '수정 권고안이 없습니다.'}
                                </div>
                            </div>
                            {issue.lawyerNote && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black flex items-center gap-1.5 text-gray-500 uppercase tracking-wider">
                                        <FileSignature className="w-3.5 h-3.5 text-blue-400" /> 담당 변호사 코멘트
                                    </h4>
                                    <div className="p-5 bg-blue-50/60 border-l-2 border-blue-300 text-sm leading-[1.8] text-blue-900 font-bold italic">
                                        &ldquo;{issue.lawyerNote}&rdquo;
                                    </div>
                                </div>
                            )}
                            {issue.originalText && (
                                <div className="pt-4 border-t border-dashed border-gray-200">
                                    <h4 className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">
                                        현재 조항 발췌
                                    </h4>
                                    <div className="p-4 bg-gray-50 text-xs font-mono text-gray-500 leading-relaxed border border-gray-200 rounded">
                                        {issue.originalText}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/* ───── 신뢰 배지 컴포넌트 ───── */
const TrustBadge = ({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) => (
    <div className="flex items-start gap-3 py-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${GOLD}12`, border: `1px solid ${GOLD}25` }}>
            <Icon className="w-4 h-4" style={{ color: GOLD }} />
        </div>
        <div>
            <div className="text-[13px] font-black text-gray-900">{label}</div>
            <div className="text-[11px] font-medium text-gray-400 leading-snug mt-0.5">{sub}</div>
        </div>
    </div>
);

/* ───── 메인 페이지 ───── */
export default function PrivacyAnalysisClientPage() {
    const router = useRouter();
    const { companies, isLoading } = useCompanies();
    const { user, loading: authLoading } = useAuth();
    const [company, setCompany] = useState<any>(null);
    const bookRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress, scrollY } = useScroll();
    const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
    const [showBottomBanner, setShowBottomBanner] = useState(false);

    useEffect(() => {
        const unsubscribe = scrollY.on('change', (latest) => {
            if (latest > 400) {
                setShowBottomBanner(true);
            } else {
                setShowBottomBanner(false);
            }
        });
        return () => unsubscribe();
    }, [scrollY]);

    useEffect(() => {
        if (authLoading || isLoading) return;
        const session = user || getSession();

        const resolveCompany = async () => {
            let match = null;
            if (session) {
                // 1. Initial array check
                if (session.companyId) {
                    match = companies?.find((c) => c.id === session.companyId);
                }
                
                // 3. Fallback to bizNo from companyId string
                if (!match && session.companyId) {
                    const digits = session.companyId.replace(/\D/g, '');
                    if (digits.length >= 10) {
                        match = companies?.find((c: any) => c.biz === digits || c.biz?.replace(/\D/g, '') === digits);
                    }
                }

                // 4. Fallback to bizNo from email
                if (!match && session.email) {
                    const prefix = session.email.split('@')[0].replace(/\D/g, '');
                    if (prefix.length >= 10) {
                        match = companies?.find((c: any) => c.biz === prefix || c.biz?.replace(/\D/g, '') === prefix);
                    }
                }
                
                // If it's a UUID but not matched above, maybe use the ID directly
                let targetId = match ? match.id : (session.companyId && session.companyId.length > 20 ? session.companyId : null);
                
                // If nothing is found, use the first company
                if (!targetId && companies && companies.length > 0) {
                    targetId = companies[0].id;
                }

                // Upgrade to full model to retrieve `lawyerProfile` and full nested relations
                if (targetId) {
                    try {
                        const fullComp = await dataLayer.companies.getById(targetId);
                        if (fullComp) {
                            match = fullComp;
                        }
                    } catch (e) {
                        console.error('Failed to fetch full company', e);
                    }
                }
            } else if (companies && companies.length > 0) {
                // If no session but companies exist, load the full profile of the first one
                try {
                    const fullComp = await dataLayer.companies.getById(companies[0].id);
                    if (fullComp) {
                        match = fullComp;
                    }
                } catch (e) {
                    console.error('Failed to fallback full company', e);
                }
            }

            // Set final match
            setCompany(match || (companies && companies.length > 0 ? companies[0] : null));
        };

        resolveCompany();
    }, [companies, user, isLoading, authLoading]);

    if (!isLoading && !company) {
        return (
            <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: '#f8f7f4' }}>
                <div className="text-center">
                    <p className="text-sm font-bold text-gray-500">조회할 검토안이 없습니다.</p>
                </div>
            </div>
        );
    }

    if (isLoading || !company) {
        return (
            <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: '#f8f7f4' }}>
                <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: GOLD }} />
                    <p className="text-sm font-bold text-gray-400">검토안을 불러오는 중입니다...</p>
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto mt-3" />
                </div>
            </div>
        );
    }

    const { issues, riskLevel, lawyerConfirmed, issueCount = 0, auditReport, audit_report } = company;
    const finalAuditReport = auditReport || audit_report;
    const displayIssues = issues || [];
    const effectiveTotalIssues = displayIssues.length > 0 ? displayIssues.length : issueCount;
    const hasAnalysis = !!lawyerConfirmed || effectiveTotalIssues > 0;
    const hasIssues = effectiveTotalIssues > 0;
    const effectiveRiskLevel = riskLevel || (hasIssues ? 'HIGH' : 'LOW');
    const highRiskCount = displayIssues.filter((i: any) => i.level === 'HIGH').length;
    const mediumCount = displayIssues.filter((i: any) => i.level === 'MEDIUM').length;
    const isCritical = highRiskCount > 0 || effectiveRiskLevel === 'HIGH';

    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    return (
        <div className="min-h-screen relative" style={{ backgroundColor: '#e5e3db' }}>
            {/* ─── 상단 진행바 ─── */}
            <motion.div
                className="fixed top-0 left-0 h-[3px] z-[200]"
                style={{ width: progressWidth, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` }}
            />

            {/* ─── 상단 툴바 ─── */}
            <div className="sticky top-0 z-[150] backdrop-blur-xl border-b" style={{ backgroundColor: 'rgba(245,243,238,0.92)', borderColor: '#e8e5de' }}>
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> 뒤로 가기
                    </button>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{company.name} — 조문 검토안</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-1 text-[11px] font-bold text-gray-400">
                            <Clock className="w-3 h-3" />
                            {dateStr}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 메인 콘텐츠 영역 ─── */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8 pb-40">
                <div className="flex flex-col xl:flex-row gap-8 items-start">

                    {/* ═══════════════════════════════════════════
                        좌측: 전자책 본문 영역  
                    ═══════════════════════════════════════════ */}
                    <div className="w-full xl:flex-1 min-w-0" ref={bookRef}>

                        {/* ── 전자책 표지 (커버) ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative overflow-hidden"
                            style={{
                                background: '#faf9f6',
                                borderRadius: '2px 2px 0 0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.03)',
                                borderTop: `4px solid ${isCritical ? '#ef4444' : GOLD}`,
                            }}
                        >
                            {/* 표지 배경 패턴 및 종이 질감 */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                }}
                            />
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                                style={{
                                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, #000 39px, #000 40px)`,
                                    backgroundSize: '100% 40px',
                                }}
                            />

                            <div className="relative z-10 px-8 md:px-16 py-12 md:py-16">
                                {/* 문서 분류 마크 */}
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: isCritical ? '#fef2f2' : `${GOLD}15` }}>
                                            <Shield className="w-3 h-3" style={{ color: isCritical ? '#ef4444' : GOLD }} />
                                        </div>
                                        <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: isCritical ? '#ef4444' : GOLD }}>
                                            CONFIDENTIAL LEGAL REVIEW
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: LVL_COLOR[effectiveRiskLevel] + '12' }}>
                                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: LVL_COLOR[effectiveRiskLevel] }} />
                                        <span className="text-[10px] font-black" style={{ color: LVL_COLOR[effectiveRiskLevel] }}>
                                            {effectiveRiskLevel === 'HIGH' ? '즉시 개정 필요' : effectiveRiskLevel === 'MEDIUM' ? '시정 권고' : '양호'}
                                        </span>
                                    </div>
                                </div>

                                {/* 제목 */}
                                <h1 className="text-3xl md:text-[40px] font-black text-gray-900 leading-[1.2] tracking-tight mb-4">
                                    개인정보 처리방침<br />
                                    <span style={{ color: isCritical ? '#ef4444' : GOLD }}>조문별 법적 검토안</span>
                                </h1>
                                <div className="w-20 h-[2px] mb-6" style={{ backgroundColor: isCritical ? '#ef4444' : GOLD }} />
                                <p className="text-[15px] text-gray-500 font-medium leading-relaxed max-w-2xl">
                                    {company.name}의 현재 개인정보 처리방침에 대하여 개인정보보호법, 정보통신망법 등 관련 법령을 기준으로
                                    조문별 위반 소지 및 법적 리스크를 검토한 결과입니다.
                                </p>

                                {/* 메타 정보 */}
                                <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">대상 기업</div>
                                        <div className="text-sm font-black text-gray-900">{company.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">위반 항목</div>
                                        <div className="text-sm font-black" style={{ color: isCritical ? '#ef4444' : '#111' }}>{effectiveTotalIssues}건</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">위험 등급</div>
                                        <div className="text-sm font-black" style={{ color: LVL_COLOR[effectiveRiskLevel] }}>{LVL_LABEL[effectiveRiskLevel]}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">검토일</div>
                                        <div className="text-sm font-black text-gray-900">{dateStr}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── 본문 영역: 마크다운 보고서 or 이슈 리스트 ── */}
                        {hasAnalysis && hasIssues && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="relative"
                                style={{
                                    background: '#faf9f6',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.03)',
                                }}
                            >
                                {/* 본문 배경 질감 (노이즈) 추가 */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                    }}
                                />
                                {finalAuditReport ? (
                                    <>
                                        {/* 마크다운 보고서 (전자책 본문) */}
                                        <div className="px-8 md:px-16 py-12">
                                            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-gray-100">
                                                <FileText className="w-4 h-4 text-gray-300" />
                                                <h2 className="text-sm font-black text-gray-400 tracking-wider uppercase">종합 실사 보고서</h2>
                                            </div>
                                            <div
                                                className="prose prose-slate max-w-none text-[15px] leading-[2] text-gray-800
                                                    prose-headings:font-black prose-headings:text-gray-900 prose-headings:tracking-tight
                                                    prose-h1:text-2xl prose-h1:mt-12 prose-h1:mb-4 prose-h1:pb-3 prose-h1:border-b prose-h1:border-gray-100
                                                    prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3
                                                    prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-2
                                                    prose-p:text-gray-700 prose-p:leading-[2]
                                                    prose-strong:text-gray-900
                                                    prose-li:text-gray-700 prose-li:leading-[1.8]
                                                    prose-table:text-sm
                                                    prose-th:bg-gray-50 prose-th:font-black prose-th:text-gray-900
                                                    prose-td:border-gray-100"
                                                style={{ fontFamily: "'Pretendard', 'Inter', sans-serif" }}
                                            >
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalAuditReport}</ReactMarkdown>
                                            </div>
                                        </div>

                                        {/* 변호사 서명 영역 (신규) */}
                                        {company?.lawyerProfile && (
                                            <div className="px-8 md:px-16 flex justify-end">
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <div className="flex items-end gap-3">
                                                        <div className="font-black text-gray-900 text-lg">
                                                            {company.lawyerProfile.name.endsWith(' 변호사') 
                                                                ? `변호사 ${company.lawyerProfile.name.replace(' 변호사', '')}` 
                                                                : `변호사 ${company.lawyerProfile.name}`}
                                                        </div>
                                                        {company.lawyerProfile.signatureImageUrl && (
                                                            <img 
                                                                src={company.lawyerProfile.signatureImageUrl} 
                                                                alt="서명" 
                                                                className="h-10 max-w-[150px] object-contain opacity-80" 
                                                                style={{ mixBlendMode: 'multiply' }} 
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 조문별 상세 분석 (아코디언 형식) */}
                                        {displayIssues.length > 0 && (
                                            <div className="border-t border-gray-100">
                                                <div className="px-8 md:px-16 pt-6 pb-2">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Gavel className="w-4 h-4 text-gray-300" />
                                                        <h2 className="text-sm font-black text-gray-400 tracking-wider uppercase">
                                                            조문별 상세 분석
                                                        </h2>
                                                    </div>
                                                    <p className="text-xs text-gray-400 font-medium">각 항목을 클릭하면 상세 리스크 및 권고안을 확인할 수 있습니다</p>
                                                </div>
                                                <div>
                                                    {displayIssues.map((issue: any, idx: number) => (
                                                        <IssueItem key={idx} issue={issue} index={idx} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* 이슈 리스트만 있을 때 (Fallback) */
                                    <div>
                                        <div className="px-8 md:px-16 pt-10 pb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Gavel className="w-4 h-4 text-gray-300" />
                                                <h2 className="text-sm font-black text-gray-400 tracking-wider uppercase">
                                                    조문별 법적 검토 결과
                                                </h2>
                                            </div>
                                            <p className="text-xs text-gray-400 font-medium">각 항목을 클릭하면 상세 리스크 및 권고안을 확인할 수 있습니다</p>
                                        </div>
                                        <div>
                                            {displayIssues.map((issue: any, idx: number) => (
                                                <IssueItem key={idx} issue={issue} index={idx} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── 페이지 끝 서명 영역 ── */}
                                <div className="px-8 md:px-16 py-12 border-t border-gray-100">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div>
                                            <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-3">검토 확인</div>
                                            <div>
                                                <div className="text-sm font-black text-gray-900">IBS 법률사무소</div>
                                                <div className="text-[11px] font-medium text-gray-400">개인정보보호 전문 검토팀</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[11px] text-gray-400 font-medium">
                                                본 검토안은 법률 자문 목적으로 작성되었으며,<br />
                                                무단 복제 및 배포를 금합니다.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* 분석 없음 상태 */}
                        {!hasAnalysis && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-24 px-8 text-center"
                                style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                            >
                                <BookOpen className="w-14 h-14 mx-auto mb-5" style={{ color: '#d1d5db' }} />
                                <h3 className="text-xl font-black mb-2 text-gray-900">검토안이 아직 준비 중입니다</h3>
                                <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                                    IBS 로펌의 전담 변호사가 고객사의 개인정보 처리방침을 검토하고 있습니다.<br />
                                    완료 시 이 페이지에서 전자책 형태로 열람하실 수 있습니다.
                                </p>
                            </motion.div>
                        )}

                        {/* 분석 완료 but 이슈 없음 */}
                        {hasAnalysis && !hasIssues && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-20 px-8 text-center"
                                style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                            >
                                <div className="w-20 h-20 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-black mb-3 text-green-900">법적 리스크 미발견</h3>
                                <p className="text-base text-green-700 max-w-lg mx-auto font-medium leading-relaxed">
                                    {company.name}의 개인정보 처리방침은 현행 법령을 충실히 준수하고 있습니다.
                                </p>
                            </motion.div>
                        )}

                        {/* ─── 하단: 신뢰 & 프로세스 보증 영역 ─── */}
                        {hasAnalysis && hasIssues && (
                            <>
                                {/* 보증 섹션 */}
                                <motion.div 
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp} 
                                    className="mt-8 rounded-xl overflow-hidden" 
                                    style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                                >
                                    <div className="px-8 md:px-12 py-8">
                                        <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-6">IBS 법률사무소의 약속</div>
                                        <div className="grid md:grid-cols-3 gap-6">
                                            {[
                                                { icon: Lock, title: '변호사법 기밀 보장', desc: '의뢰 내용은 변호사법에 의거 철저히 보호됩니다' },
                                                { icon: Clock, title: '48시간 내 개정 완료', desc: '수임 즉시 전담팀이 배정되어 신속하게 처리합니다' },
                                                { icon: BadgeCheck, title: '100% 법령 충족 보장', desc: '개인정보보호위원회 최신 기준에 완벽히 대응합니다' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${GOLD}10` }}>
                                                        <item.icon className="w-4 h-4" style={{ color: GOLD }} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[13px] font-black text-gray-900 mb-0.5">{item.title}</div>
                                                        <div className="text-[11px] font-medium text-gray-400 leading-snug">{item.desc}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* 하단 CTA (데스크톱) */}
                                <motion.div
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                    className="mt-6 rounded-xl overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(135deg, #111827, #1f2937)',
                                        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    <div className="px-8 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="text-center md:text-left">
                                            <h3 className="text-xl md:text-2xl font-black text-white mb-2 leading-snug">
                                                지금 바로 조문을 <span style={{ color: GOLD_LIGHT }}>안전하게 수정</span>하세요
                                            </h3>
                                            <p className="text-sm font-medium text-gray-400 leading-relaxed">
                                                발견된 {effectiveTotalIssues}건의 위반 항목을 전담 변호사가 48시간 내 전면 개정해 드립니다
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                                            <button
                                                onClick={() => router.push(`/contracts/sign/${company.id}`)}
                                                className="flex items-center gap-2 px-8 py-4 rounded-xl font-black text-[15px] transition-all hover:scale-105 hover:shadow-lg whitespace-nowrap"
                                                style={{
                                                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                                                    color: '#0a0e1a',
                                                    boxShadow: '0 8px 30px rgba(201,168,76,0.25)',
                                                }}
                                            >
                                                <FileSignature className="w-5 h-5" /> 방침 개정 위임하기
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                            <a
                                                href="tel:025988518"
                                                className="flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-sm transition-colors hover:bg-white/10 whitespace-nowrap"
                                                style={{ border: '1px solid rgba(255,255,255,0.12)', color: '#9ca3af' }}
                                            >
                                                <Phone className="w-4 h-4" style={{ color: GOLD }} /> 02-598-8518
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}

                        {/* 여백 */}
                        <div className="h-8" />
                    </div>

                    {/* ═══════════════════════════════════════════
                        우측: Sticky 사이드바 (데스크톱)
                    ═══════════════════════════════════════════ */}
                    {hasAnalysis && hasIssues && (
                        <div className="hidden xl:block w-[320px] shrink-0 sticky top-20">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-4"
                            >
                                {/* 위험도 요약 카드 */}
                                <div className="rounded-xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                    <div className="px-6 py-5" style={{ background: isCritical ? 'linear-gradient(135deg, #fef2f2, #fff)' : 'linear-gradient(135deg, #fffbeb, #fff)', borderBottom: `1px solid ${isCritical ? '#fecaca' : '#fde68a'}` }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            {isCritical ? (
                                                <AlertOctagon className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                            )}
                                            <span className="text-sm font-black" style={{ color: isCritical ? '#991b1b' : '#92400e' }}>
                                                위험도 요약
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-center">
                                                <div className="text-2xl font-black text-red-600">{highRiskCount}</div>
                                                <div className="text-[10px] font-bold text-gray-400">고위험</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-black text-amber-500">{mediumCount}</div>
                                                <div className="text-[10px] font-bold text-gray-400">시정권고</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-black text-gray-900">{effectiveTotalIssues}</div>
                                                <div className="text-[10px] font-bold text-gray-400">전체</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 예상 제재 */}
                                    <div className="px-6 py-4 border-b border-gray-50">
                                        <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-2">예상 최대 제재</div>
                                        {isCritical ? (
                                            <div className="text-xl font-black text-red-600">매출액 3% <span className="text-xs font-bold text-gray-400">과징금</span></div>
                                        ) : effectiveRiskLevel === 'MEDIUM' ? (
                                            <div className="text-xl font-black text-amber-600">3,000만원 <span className="text-xs font-bold text-gray-400">과태료</span></div>
                                        ) : (
                                            <div className="text-xl font-black text-green-600">리스크 없음</div>
                                        )}
                                    </div>

                                    {/* CTA 버튼 */}
                                    <div className="px-6 py-5">
                                        <button
                                            onClick={() => router.push(`/contracts/sign/${company.id}`)}
                                            className="w-full py-4 px-4 rounded-xl font-black text-[14px] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                            style={{
                                                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                                                color: '#0a0e1a',
                                                boxShadow: `0 6px 24px ${GOLD}30`,
                                            }}
                                        >
                                            <FileSignature className="w-4 h-4" /> 방침 전면 개정 위임
                                        </button>
                                        <p className="text-[10px] text-center font-medium text-gray-400 mt-3 leading-relaxed">
                                            위임 즉시 전담 변호사가 배정되어<br />48시간 내 개정안을 전달합니다
                                        </p>
                                    </div>
                                </div>

                                {/* 신뢰 배지 */}
                                <div className="rounded-xl px-6 py-5" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                    <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-3">검토 보증</div>
                                    <div className="divide-y divide-gray-50">
                                        <TrustBadge icon={BadgeCheck} label="변호사 직접 검토" sub="AI 분석 후 실무 변호사 최종 확인" />
                                        <TrustBadge icon={Lock} label="변호사법 비밀유지" sub="의뢰인 정보 100% 기밀 보장" />
                                        <TrustBadge icon={Award} label="법률검토증명서 발급" sub="공식 검토 완료 증명서 제공" />
                                        <TrustBadge icon={TrendingUp} label="정기 모니터링" sub="법령 변경 시 자동 재검토 알림" />
                                    </div>
                                </div>

                                {/* 상담 */}
                                <div className="rounded-xl px-6 py-5" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                    <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-3">문의</div>
                                    <a href="tel:025988518" className="flex items-center gap-3 py-2 group">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                                            <Phone className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-gray-900 group-hover:underline">02-598-8518</div>
                                            <div className="text-[11px] font-medium text-gray-400">평일 09:00 ~ 18:00</div>
                                        </div>
                                    </a>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════
                 하단 고정 배너 (Bottom Sheet 형태)
            ═══════════════════════════════════════════ */}
            <AnimatePresence>
                {showBottomBanner && hasAnalysis && hasIssues && (
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[200] pb-safe"
                    >
                        {/* 데스크톱/모바일 동시 적용 하단 배너 */}
                        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-8px_40px_rgba(0,0,0,0.1)]">
                            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-4">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    {/* 문구 영역 */}
                                    <div className="flex items-center gap-4 text-center md:text-left">
                                        <div className="hidden md:flex w-12 h-12 rounded-full items-center justify-center bg-red-50 shrink-0">
                                            <AlertOctagon className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-[15px] md:text-[17px] font-black text-gray-900 leading-tight mb-1">
                                                방치하면 예상되는 <span className="text-red-600">최대 {isCritical ? '매출액 3% 과징금' : '3,000만원 과태료'}</span>
                                            </h4>
                                            <p className="text-xs md:text-sm text-gray-500 font-medium">
                                                전담 변호사가 48시간 내 위반 사항을 완벽하게 수정해 드립니다.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Action 버튼들 */}
                                    <div className="flex w-full md:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => alert("개인정보보호 책임자용 맞춤 보고서(PDF) 다운로드는 프리미엄 구독자 전용 기능입니다.")}
                                            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-[14px] bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap border border-gray-200"
                                        >
                                            <Download className="w-4 h-4" /> 책임자용 보고서 다운
                                        </button>
                                        <button
                                            onClick={() => router.push(`/contracts/sign/${company.id}`)}
                                            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-black text-[15px] transition-all hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(201,168,76,0.25)] whitespace-nowrap"
                                            style={{
                                                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                                                color: '#0a0e1a',
                                            }}
                                        >
                                            <Phone className="w-5 h-5 text-current opacity-80" /> 수석 변호사 1:1 상담
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
