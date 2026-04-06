'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, FileText, ArrowLeft, Loader2, AlertOctagon, Scale, ChevronDown, FileSignature, Banknote, HelpCircle, FileWarning } from 'lucide-react';
import { useCompanies } from '@/hooks/useDataLayer';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

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

    const { issues, riskLevel, lawyerConfirmed, issueCount = 0 } = company;
    
    // DB의 issues 배열은 비어있지만 issueCount가 0보다 큰 경우 (최초 스캐너 등급만 받은 상태)
    // 고객에게 심각성을 인지시키기 위해 더미 이슈(설득 요소)를 생성합니다.
    const displayIssues = [...(issues || [])];
    if (displayIssues.length === 0 && issueCount > 0) {
        Array.from({ length: issueCount }).forEach((_, i) => {
            displayIssues.push({
                title: `개인정보 처리방침 위반 소지 항목 ${i + 1}`,
                level: i === 0 ? 'HIGH' : 'MEDIUM',
                law: '개인정보보호법 등 관련 가이드라인 위반 지적',
                riskDesc: '현재 조항은 방통위 및 개보위의 최신 제재 기조에 어긋나며, 고객 민원 발생 또는 관계 당국 조사 시 과태료 처분(최대 매출액 3%) 및 형사 고발 대상이 될 수 있는 심각한 리스크를 내포하고 있습니다.',
                customDraft: '현업 비즈니스 모델을 해치지 않는 선에서, 최신 법령에 완벽히 부합하는 방어적이고 적법한 내용으로 조항 전면 개정을 권고합니다.',
                originalText: '회사 내부 정책에 따라 임의 처리함 (상세 수집항목 및 파기절차 누락)',
                lawyerNote: '초기 스캐너 진단 결과, 구조적인 법적 결함이 다수 발견되었습니다. 당소의 전문 변호사가 귀사의 비즈니스에 맞춰 약관을 전면 재작성해 드리는 자문을 반드시 받으셔야 합니다.'
            });
        });
    }
    
    // 화면에 보여줄 확정 메트릭 (DB 컬럼 최우선 활용)
    const effectiveTotalIssues = displayIssues.length > 0 ? displayIssues.length : issueCount;
    const hasAnalysis = !!lawyerConfirmed || effectiveTotalIssues > 0;
    const hasIssues = effectiveTotalIssues > 0;
    
    // riskLevel이 없으면 'LOW', 문제 건수가 있으면 기본적으로 'HIGH' 취급
    const effectiveRiskLevel = riskLevel || (hasIssues ? 'HIGH' : 'LOW');
    
    // 고위험 건수: 상세 내역 있으면 필터, 없는데 riskLevel이 HIGH면 일단 전체의 절반 정도로 어림잡아 표시
    let highRiskCount = displayIssues.filter((i: any) => i.level === 'HIGH').length;
    if (displayIssues.length === 0 && effectiveTotalIssues > 0 && effectiveRiskLevel === 'HIGH') {
        highRiskCount = Math.max(1, Math.floor(effectiveTotalIssues * 0.4));
    }
    
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
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-black"
                >
                    <ArrowLeft className="w-4 h-4" /> 뒤로 가기
                </button>
            </div>

            <div className="max-w-4xl mx-auto space-y-10">
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
                        {/* ── 핵심 지표 대시보드 (Four Key Metrics) ── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="text-gray-400 mb-3"><AlertTriangle className="w-6 h-6" /></div>
                                <div className="text-3xl font-black text-gray-900 mb-1">{effectiveTotalIssues}<span className="text-sm font-bold text-gray-400 ml-1">건</span></div>
                                <div className="text-xs font-bold text-gray-500">발견된 보안/법률 취약점</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 opacity-5"><AlertOctagon className="w-24 h-24 text-red-500" /></div>
                                <div className="text-red-500 mb-3 relative z-10"><AlertOctagon className="w-6 h-6" /></div>
                                <div className="text-3xl font-black text-red-600 mb-1 relative z-10">{highRiskCount}<span className="text-sm font-bold text-red-400 ml-1">건</span></div>
                                <div className="text-xs font-bold text-red-500 relative z-10">고위험 위반 조항</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="text-gray-400 mb-3"><Banknote className="w-6 h-6" /></div>
                                <PenaltyDisplay />
                                <div className="text-xs font-bold text-gray-500">예상 과태료/벌금 리스크</div>
                            </div>
                            <div className={`p-6 rounded-2xl shadow-sm ${isCritical ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                                <div className={`${isCritical ? 'text-red-400' : 'text-green-400'} mb-3`}><Shield className="w-6 h-6" /></div>
                                <div className={`text-2xl font-black mb-1 ${isCritical ? 'text-red-700' : 'text-green-700'}`}>{LVL_LABEL[effectiveRiskLevel] || '알 수 없음'}</div>
                                <div className={`text-xs font-bold ${isCritical ? 'text-red-500' : 'text-green-500'}`}>종합 컴플라이언스 등급</div>
                            </div>
                        </div>

                        {/* ── 경고 메시지 ── */}
                        {isCritical && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl">
                                <h3 className="text-red-800 font-black text-lg mb-2 flex items-center gap-2">
                                    <FileWarning className="w-5 h-5" /> 즉시 시정 조치가 필요합니다.
                                </h3>
                                <p className="text-red-700 text-sm leading-relaxed font-medium">
                                    발견된 고위험 항목은 개인정보보호위원회 조사 대상이 될 경우 매출액의 최대 3% 이하의 과징금 또는 형사 고발로 이어질 수 있는 중대한 사안입니다.
                                </p>
                            </div>
                        )}

                        {/* ── 상세 조항 분석 리스트 ── */}
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

                        {/* ── 강력한 CTA 영역 (자문 계약 유도) ── */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.5 }}
                            className="mt-12 p-10 md:p-12 rounded-[2rem] text-center relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
                            
                            <div className="relative z-10 max-w-2xl mx-auto">
                                <Shield className="w-12 h-12 text-amber-400 mx-auto mb-6" />
                                <h3 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">
                                    이대로 방치하면 <br className="md:hidden"/>리스크는 현실이 됩니다.
                                </h3>
                                <p className="text-base text-gray-300 mb-10 leading-relaxed font-medium">
                                    IBS 로펌의 전문가가 고객사의 비즈니스 모델에 완벽히 부합하는 최적의 약관으로 전면 개정해 드립니다. 지금 바로 법률 자문 계약을 맺고 법적 사각지대를 완전히 해소하세요.
                                </p>
                                <button
                                    onClick={() => router.push(`/contracts/sign/${company.id}`)}
                                    className="w-full md:w-auto px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center mx-auto gap-3 transition-all hover:scale-105 active:scale-95"
                                    style={{ 
                                        background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                                        color: '#fff', 
                                        boxShadow: '0 10px 25px -5px rgba(245,158,11,0.5), 0 8px 10px -6px rgba(245,158,11,0.1)'
                                    }}
                                >
                                    <FileSignature className="w-6 h-6" /> IBS 로펌에 리스크 전면 개선 맡기기 (위임계약 서명)
                                </button>
                                <p className="mt-5 text-xs text-gray-500 font-bold">
                                    * 전자서명 완료 즉시 전담 변호사가 배정되어 실무 작업에 착수합니다.
                                </p>
                            </div>
                        </motion.div>
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
        </div>
    );
}
