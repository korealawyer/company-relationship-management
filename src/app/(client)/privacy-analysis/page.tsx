'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, FileText, ArrowLeft, Loader2, AlertOctagon, Scale, ChevronDown, FileSignature, Banknote, HelpCircle, FileWarning } from 'lucide-react';
import { useCompanies } from '@/hooks/useDataLayer';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LVL_COLOR: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
const LVL_BG: Record<string, string> = { HIGH: '#fee2e2', MEDIUM: '#fef3c7', LOW: '#d1fae5' };
const LVL_LABEL: Record<string, string> = { HIGH: '위반(고위험)', MEDIUM: '시정권고', LOW: '양호' };

// 개별 이슈 아코디언 컴포넌트
const IssueItem = ({ issue, index }: { issue: any, index: number }) => {
    const [expanded, setExpanded] = useState(false);
    const isHighRisk = issue.level === 'HIGH';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: index * 0.1 }}
            className={`border rounded-2xl overflow-hidden transition-all ${expanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}`}
            style={{ borderColor: isHighRisk ? '#fca5a5' : '#fcd34d', backgroundColor: '#fff' }}
        >
            <button 
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{ background: isHighRisk ? 'linear-gradient(to right, #fff, #fef2f2)' : 'linear-gradient(to right, #fff, #fffbeb)' }}
            >
                <div className="flex-1 flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                        {isHighRisk ? (
                            <div className="p-2 bg-red-100 rounded-lg"><AlertOctagon className="w-6 h-6 text-red-600" /></div>
                        ) : (
                            <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="w-6 h-6 text-amber-600" /></div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black tracking-wider text-white" style={{ backgroundColor: LVL_COLOR[issue.level || 'MEDIUM'] }}>
                                {LVL_LABEL[issue.level || 'MEDIUM']}
                            </span>
                            <span className="text-xs font-bold text-gray-500 line-clamp-1">{issue.law}</span>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 leading-snug">{issue.title}</h3>
                    </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                    >
                        <div className="p-6 space-y-6">
                            {/* 리스크 시나리오 */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-black flex items-center gap-2 text-gray-900">
                                    <Scale className="w-4 h-4 text-red-500" /> 법적 제재 및 분쟁 리스크
                                </h4>
                                <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 text-sm leading-relaxed text-red-900 font-medium">
                                    {issue.riskDesc || "리스크 설명이 없습니다."}
                                </div>
                            </div>

                            {/* 해결 방안 */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-black flex items-center gap-2 text-gray-900">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> 로펌 시정 권고안
                                </h4>
                                <div className="p-4 rounded-xl bg-green-50/50 border border-green-100 text-sm leading-relaxed text-green-900 font-medium">
                                    {issue.customDraft || "수정 권고안이 없습니다."}
                                </div>
                            </div>

                            {/* 변호사 코멘트 */}
                            {issue.lawyerNote && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-black flex items-center gap-2 text-gray-900">
                                        <FileSignature className="w-4 h-4 text-blue-500" /> 담당 변호사 코멘트
                                    </h4>
                                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-sm leading-relaxed text-blue-900 font-bold">
                                        "{issue.lawyerNote}"
                                    </div>
                                </div>
                            )}

                            {/* 원문 */}
                            {issue.originalText && (
                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-[11px] uppercase font-black tracking-widest text-gray-400 mb-2">현재 조항 발췌</h4>
                                    <div className="p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-600 border border-gray-200">
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

export default function PrivacyAnalysisClientPage() {
    const router = useRouter();
    const { companies, isLoading } = useCompanies();
    const [company, setCompany] = useState<any>(null);

    useEffect(() => {
        const session = getSession();
        if (session && companies) {
            const match = companies.find(c => c.id === session.companyId);
            if (match) setCompany(match);
        }
    }, [companies]);

    if (isLoading || !company) {
        return (
            <div className="min-h-screen pt-24 pb-20 px-4 flex justify-center items-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
            </div>
        );
    }

    const { issues, riskLevel, lawyerConfirmed, issueCount = 0, auditReport, audit_report } = company;
    const finalAuditReport = auditReport || audit_report;
    const displayIssues = issues || [];
    
    // 화면에 보여줄 확정 메트릭 (DB 컬럼 최우선 활용)
    const effectiveTotalIssues = displayIssues.length > 0 ? displayIssues.length : issueCount;
    const hasAnalysis = !!lawyerConfirmed || effectiveTotalIssues > 0;
    const hasIssues = effectiveTotalIssues > 0;
    
    // riskLevel이 없으면 'LOW', 문제 건수가 있으면 기본적으로 'HIGH' 취급
    const effectiveRiskLevel = riskLevel || (hasIssues ? 'HIGH' : 'LOW');
    
    // 고위험 건수
    let highRiskCount = displayIssues.filter((i: any) => i.level === 'HIGH').length;
    
    const isCritical = highRiskCount > 0 || effectiveRiskLevel === 'HIGH';

    // 예상 과태료 리스크 동적 산출
    const PenaltyDisplay = () => {
        if (isCritical || effectiveRiskLevel === 'HIGH') {
            return <div className="text-2xl font-black text-gray-900 mb-1">매출액 3<span className="text-sm font-bold text-gray-400 ml-1">% 이하</span></div>;
        }
        if (effectiveRiskLevel === 'MEDIUM') {
            return <div className="text-2xl font-black text-gray-900 mb-1">최대 3,000<span className="text-sm font-bold text-gray-400 ml-1">만원</span></div>;
        }
        return <div className="text-2xl font-black text-gray-900 mb-1">리스크 없음</div>;
    };

    return (
        <div className="min-h-screen pt-20 pb-24 px-4" style={{ backgroundColor: '#fcfbfa' }}>
            <div className="max-w-6xl mx-auto mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-black"
                >
                    <ArrowLeft className="w-4 h-4" /> 뒤로 가기
                </button>
            </div>

            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
                <div className="w-full lg:flex-1 space-y-10">
                {/* ── 헤더: 심각성 강조 ── */}
                <div className={`relative p-8 md:p-10 rounded-[2rem] overflow-hidden ${isCritical ? 'bg-red-600' : 'bg-gray-900'} text-white shadow-2xl`}>
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        <AlertOctagon className="w-64 h-64" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-white/20 backdrop-blur-sm">
                                <Shield className="w-3.5 h-3.5" />
                                CONFIDENTIAL LEGAL AUDIT
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight tracking-tight">
                            개인정보 처리방침<br />
                            <span className={isCritical ? 'text-red-200' : 'text-gray-300'}>법적 리스크 진단 결과</span>
                        </h1>
                        <p className="text-base md:text-lg font-medium opacity-90 max-w-2xl leading-relaxed">
                            {company.name}의 현재 개인정보 처리방침(약관)에 대해 관련 법령 위반 소지 및 그에 따른 과태료/형사처벌 리스크를 진단했습니다. 
                            {isCritical && " 심각한 법적 제재가 우려되므로 즉각적인 개정이 필요합니다."}
                        </p>
                    </div>
                </div>

                {hasAnalysis && hasIssues && (
                    <>
                        {/* ── 프라이버시 실사 마크다운 보고서 (A4 뷰어) ── */}
                        {finalAuditReport ? (
                            <div className="mt-8 relative">
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-400" /> 개인정보처리방침 종합 실사 보고서
                                </h2>
                                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 md:p-14 prose prose-slate max-w-none text-[15px] leading-relaxed text-gray-800" 
                                    style={{ 
                                        minHeight: '297mm', // Roughly A4 height
                                        fontFamily: "'Inter', 'Pretendard', sans-serif" 
                                    }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {finalAuditReport}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            /* ── 기존 상세 조항 분석 리스트 (Fallback) ── */
                            <div>
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-gray-400" /> 상세 리스크 분석 및 솔루션
                                </h2>
                                <div className="space-y-4">
                                    {displayIssues.map((issue: any, idx: number) => (
                                        <IssueItem key={idx} issue={issue} index={idx} />
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* 모바일 화면용 간단한 권고 메시지 */}
                        <div className="lg:hidden mt-12 mb-4 p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
                            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                            <h3 className="text-xl font-black text-red-900 mb-2">지체 없는 개정이 필요합니다</h3>
                            <p className="text-sm font-medium text-red-700 leading-relaxed">
                                다수의 고위험 위반 항목이 검출되었습니다. 방침 전면 개정을 위임하여 즉시 해소하시길 적극 권고합니다.
                            </p>
                        </div>
                    </>
                )}

                {!hasAnalysis && (
                    <div className="text-center py-24 px-4 rounded-[2rem] bg-white border border-gray-200">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-bold mb-2 text-gray-900">아직 진단 결과가 시스템에 반영되지 않았습니다.</h3>
                        <p className="text-sm text-gray-500">IBS 로펌의 전담 변호사가 고객사의 처리방침을 검토 중입니다.</p>
                    </div>
                )}

                {hasAnalysis && !hasIssues && (
                    <div className="text-center py-20 px-4 rounded-[2rem] bg-green-50 border border-green-200">
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-black mb-3 text-green-900">법적 리스크가 발견되지 않았습니다</h3>
                        <p className="text-base text-green-700 max-w-lg mx-auto font-medium">
                            {company.name}의 개인정보 처리방침은 현재 관련 법령을 충실히 준수하고 있으며, 시급히 교정해야 할 위반 사항이 발견되지 않았습니다.
                        </p>
                    </div>
                )}
                </div>

                {/* ── 우측 고정 탭 (Sticky Sidebar CTA) ── */}
                {hasAnalysis && hasIssues && (
                    <div className="hidden lg:block w-[340px] shrink-0 sticky top-24">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-[2rem] shadow-xl border border-gray-200 overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 flex flex-col items-center text-center">
                                <AlertTriangle className="w-10 h-10 text-white opacity-90 mb-3" />
                                <h3 className="text-xl font-black text-white leading-snug">
                                    ❗ 권고 후속 조치<br/><span className="text-sm font-bold text-red-200">(Action Needed)</span>
                                </h3>
                            </div>
                            <div className="p-8 space-y-6">
                                <p className="text-[15px] text-gray-700 font-medium leading-relaxed">
                                    진단 결과 다수의 <strong className="text-red-600">법적 분쟁/과징금 고위험 리스크</strong>가 발견되었습니다. 지체 없이 개정 작업을 이관하여 관련 리스크를 원천 차단하십시오.
                                </p>
                                
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                        법률 검토증명서 공식 발급
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                        개인정보보호위원회 기준 100% 충족
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                        위임 즉시 전담 변호사 배정
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push(`/contracts/sign/${company.id}`)}
                                    className="w-full py-5 px-4 rounded-xl font-black text-[15px] flex items-center justify-center gap-2 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/30 focus:ring-4 focus:ring-red-100"
                                    style={{ 
                                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)', 
                                        color: '#fff', 
                                    }}
                                >
                                    <FileSignature className="w-5 h-5" /> ✍️ 방침 전면 개정 위임 및 결재
                                </button>
                                <p className="text-xs text-center font-bold text-gray-400 leading-relaxed">
                                    위임 승인 시, 기존 처리방침 내 모든 조항이 컴플라이언스 체계에 맞춰 전면 재작성됩니다.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Mobile Fixed Bottom CTA */}
            {hasAnalysis && hasIssues && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-[100]">
                    <button
                        onClick={() => router.push(`/contracts/sign/${company.id}`)}
                        className="w-full py-4 px-4 rounded-xl font-black text-base flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff' }}
                    >
                        <FileSignature className="w-5 h-5" /> ✍️ 방침 전면 개정 및 개선 위임하기
                    </button>
                    <div className="pb-safe"></div>
                </div>
            )}
        </div>
    );
}
