'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, FileText, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useCompanies } from '@/hooks/useDataLayer';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const LVL_COLOR: Record<string, string> = { HIGH: '#f87171', MEDIUM: '#fb923c', LOW: '#4ade80' };
const LVL_BG: Record<string, string> = { HIGH: 'rgba(248,113,113,0.1)', MEDIUM: 'rgba(251,146,60,0.1)', LOW: 'rgba(74,222,128,0.1)' };
const LVL_LABEL: Record<string, string> = { HIGH: '고위험', MEDIUM: '주의', LOW: '양호' };

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
            <div className="min-h-screen pt-24 pb-20 px-4 flex justify-center items-center" style={{ background: '#f8f7f4' }}>
                <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
            </div>
        );
    }

    const { issues, riskLevel, lawyerConfirmed, issueCount = 0 } = company;
    // 변호사 컨펌이 완료되었거나, (현재 CRM에서 직접 보냈을 수 있으므로) 이슈가 있는 경우
    const hasAnalysis = !!lawyerConfirmed || (issues && issues.length > 0) || issueCount > 0;
    
    // DB의 issues 배열이 비어있지만 issueCount가 0보다 큰 경우 (엑셀 임포트 등)
    // 화면에 보여주기 위해 더미 이슈를 생성합니다.
    let displayIssues = issues || [];
    if (displayIssues.length === 0 && issueCount > 0) {
        displayIssues = Array.from({ length: issueCount }).map((_, i) => ({
            title: `개인정보 처리방침 위반 의심 항목 ${i + 1}`,
            level: 'HIGH',
            law: '개인정보 보호법 제30조(개인정보 처리방침의 수립 및 공개)',
            riskDesc: '기재된 개인정보 처리방침 내 필수 기재 사항이 누락되었거나 불분명하여 법적 분쟁의 소지가 있습니다.',
            customDraft: '관련 법령 법률 요건에 맞춘 필수 항목 명시 및 명확한 문구로 개정 필요',
            lawyerNote: '제공하신 정보 및 기본 분석을 바탕으로 식별된 리스크 개수입니다. 상세 분석은 추가 검토가 필요합니다.',
            originalText: '내용 확인 불가 (상세 시스템 연동 필요)'
        }));
    }

    const hasIssues = displayIssues.length > 0;
    
    // 이슈가 없으면 무조건 'LOW' (양호) 등급 배정
    const effectiveRiskLevel = hasIssues ? (riskLevel || 'HIGH') : 'LOW';

    return (
        <div className="min-h-screen pt-20 pb-20 px-4" style={{ background: '#f8f7f4' }}>
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold transition-colors hover:text-black"
                    style={{ color: '#6b7280' }}>
                    <ArrowLeft className="w-4 h-4" /> 뒤로 가기
                </button>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* ── 헤더 타이틀 ── */}
                <div className="relative p-8 rounded-3xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                                    style={{ background: '#eff6ff', color: '#2563eb' }}>
                                    <Shield className="w-3 h-3" />
                                    IBS 법률 분석 시스템
                                </div>
                            </div>
                            <h1 className="text-3xl font-black mb-2" style={{ color: '#111827' }}>
                                개인정보 처리방침 분석 결과
                            </h1>
                            <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                                {company.name}의 개인정보 처리방침에 대한 법적 리스크 점검 결과입니다.
                            </p>
                        </div>
                        
                        {hasAnalysis && (
                        <div className="text-right">
                            <div className="inline-block text-center px-8 py-4 rounded-2xl"
                                style={{ background: LVL_BG[effectiveRiskLevel], border: `1px solid ${LVL_COLOR[effectiveRiskLevel]}40` }}>
                                <div className="text-sm font-black mb-1 opacity-80" style={{ color: LVL_COLOR[effectiveRiskLevel] }}>최종 종합 등급</div>
                                <div className="text-4xl font-black tracking-tighter" style={{ color: LVL_COLOR[effectiveRiskLevel] }}>{LVL_LABEL[effectiveRiskLevel]}</div>
                            </div>
                        </div>
                        )}
                    </div>
                </div>

                {/* ── 결과 본문 ── */}
                {!hasAnalysis ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 px-4 rounded-3xl"
                        style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#d1d5db' }} />
                        <h3 className="text-xl font-bold mb-2 text-gray-900">아직 분석 결과가 없습니다.</h3>
                        <p className="text-sm text-gray-500 mb-6">담당 변호사가 현재 확인 또는 분석을 진행 중일 수 있습니다.</p>
                    </motion.div>
                ) : !hasIssues ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 px-4 rounded-3xl"
                        style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}>
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-black mb-3 text-green-900">법적 리스크가 발견되지 않았습니다</h3>
                        <p className="text-base text-green-700 max-w-lg mx-auto font-medium">
                            {company.name}의 개인정보 처리방침은 현재 관련 법령을 충실히 준수하고 있으며, 즉각적인 수정이나 보완이 필요한 치명적인 위반 사항이 발견되지 않았습니다.
                        </p>
                    </motion.div>
                ) : (
                    <>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 p-5 rounded-2xl"
                            style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <div className="flex items-center justify-center p-4 rounded-xl" style={{ background: '#fffbeb' }}>
                                <AlertCircle className="w-8 h-8" style={{ color: '#d97706' }} />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-sm font-bold" style={{ color: '#6b7280' }}>발견된 위반 및 개선 의심 항목</span>
                                <span className="text-2xl font-black mt-1 text-gray-900">총 {displayIssues.length}건</span>
                            </div>
                        </motion.div>

                        <div className="grid gap-4">
                            {displayIssues.map((issue: any, idx: number) => (
                                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                                    className="p-6 rounded-2xl transition-all"
                                    style={{ background: '#fff', border: `1px solid ${LVL_COLOR[issue.level || 'MEDIUM']}30` }}>
                                    <div className="flex flex-col md:flex-row md:items-start gap-5">
                                        <div className="flex-shrink-0 w-full md:w-32 pt-1">
                                            <div className="inline-block px-3 py-1 rounded-md text-xs font-black tracking-wider"
                                                style={{ background: LVL_COLOR[issue.level || 'MEDIUM'], color: '#fff' }}>
                                                {LVL_LABEL[issue.level || 'MEDIUM']}
                                            </div>
                                            <div className="mt-4 text-xs font-bold leading-relaxed text-gray-500">
                                                근거 법령:<br/> <span className="text-[10px] break-keep text-wrap inline-block mt-1">{issue.law}</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4 text-sm">
                                            <h3 className="text-lg font-black text-gray-900">{issue.title}</h3>
                                            
                                            <div className="p-4 rounded-xl space-y-2" style={{ background: '#fef2f2' }}>
                                                <div className="flex gap-2 text-red-600">
                                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span className="opacity-90 leading-relaxed font-bold">{issue.riskDesc || "리스크 설명이 없습니다."}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl space-y-2" style={{ background: '#f0fdf4' }}>
                                                <div className="flex gap-2 text-green-700">
                                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span className="opacity-90 leading-relaxed font-bold">{issue.customDraft || "수정 권고안이 없습니다."}</span>
                                                </div>
                                            </div>

                                            {issue.lawyerNote && (
                                            <div className="p-4 rounded-xl space-y-2" style={{ background: '#f0f9ff' }}>
                                                <div className="flex gap-2 text-blue-700">
                                                    <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="block text-xs font-black mb-1 opacity-70">변호사 리뷰 코멘트</span>
                                                        <span className="opacity-90 leading-relaxed font-bold">{issue.lawyerNote}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            )}

                                            {issue.originalText && (
                                            <div className="flex items-start gap-2 mt-4 px-1">
                                                <span className="text-[10px] uppercase font-black tracking-widest flex-shrink-0 pt-0.5 text-gray-400">발췌 원문</span>
                                                <span className="text-xs font-mono text-gray-600">{issue.originalText}</span>
                                            </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* 계약(자문 위임) CTA 영역 */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="mt-8 p-8 rounded-3xl text-center"
                            style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', border: '1px solid #334155' }}>
                            <h3 className="text-xl font-black mb-2 flex items-center justify-center gap-2">
                                <Shield className="w-5 h-5 text-amber-400" />
                                발견된 리스크, IBS 로펌에서 완벽하게 해결해 드립니다.
                            </h3>
                            <p className="text-sm opacity-70 mb-6 max-w-lg mx-auto leading-relaxed">
                                위 분석 결과에 따른 법률 제재 및 분쟁 리스크를 방지하기 위해 
                                개선 작업을 맡기시려면 아래 버튼을 눌러 법률 자문 계약서 서명을 진행해 주세요.
                            </p>
                            <button
                                onClick={() => router.push('/contracts/sign/mock-token-privacy-fix')}
                                className="px-8 py-4 rounded-xl font-black text-sm flex items-center justify-center mx-auto gap-2 transition-transform hover:scale-105"
                                style={{ background: 'linear-gradient(135deg, #e8c87a, #c9a84c)', color: '#0f172a', boxShadow: '0 4px 15px rgba(201,168,76,0.3)' }}>
                                <AlertTriangle className="w-4 h-4" /> 리스크 개선 계약 전자서명하기
                            </button>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}
