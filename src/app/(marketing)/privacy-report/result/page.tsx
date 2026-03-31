'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle, CheckCircle2, AlertTriangle, Shield, Loader2,
    FileText, Bot, ArrowLeft, Zap, ExternalLink, Calendar
} from 'lucide-react';
import { leadStore } from '@/lib/leadStore';
import { supabaseCompanyStore } from '@/lib/supabaseStore';
import { getPromptConfig } from '@/lib/prompts/privacy';

interface AnalysisIssue {
    id: string;
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    law: string;
    originalText?: string;
    riskDesc?: string;
    customDraft?: string;
}

interface AnalysisResult {
    success: boolean;
    isDemoMode: boolean;
    message: string;
    analysisId: string;
    analyzedUrl: string | null;
    issueCount: number;
    issues: AnalysisIssue[];
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    completedAt: string;
    error?: string;
}

const LVL_COLOR: Record<string, string> = { HIGH: '#f87171', MEDIUM: '#fb923c', LOW: '#4ade80' };
const LVL_BG: Record<string, string> = { HIGH: 'rgba(248,113,113,0.1)', MEDIUM: 'rgba(251,146,60,0.1)', LOW: 'rgba(74,222,128,0.1)' };
const LVL_LABEL: Record<string, string> = { HIGH: '고위험', MEDIUM: '주의', LOW: '양호' };

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

function ResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlParam = searchParams.get('url');
    const companyParam = searchParams.get('company');

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAnalysis() {
            setLoading(true);
            setError(null);

            let payloadUrl = urlParam || '';
            let payloadManualText = '';
            let payloadCompanyId = companyParam || '';

            // CRM 진입 시 수동 텍스트 병합 처리
            if (companyParam) {
                const leads = leadStore.getAll();
                const matched = leads.find(l => l.companyName === companyParam);
                if (matched) {
                    payloadUrl = matched.privacyUrl || payloadUrl;
                    payloadManualText = matched.privacyPolicyText || '';
                    payloadCompanyId = matched.id;
                }
            }

            if (!payloadUrl && !payloadManualText && !payloadCompanyId) {
                setError('분석할 대상(URL, 회사명, 원문)이 명확하지 않습니다.');
                setLoading(false);
                return;
            }

            try {
                const promptConfig = getPromptConfig();

                const res = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: payloadUrl,
                        companyId: payloadCompanyId,
                        manualText: payloadManualText,
                        systemPrompt: promptConfig.analyzePrompt
                    })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    setError(data.error || '분석 중 오류가 발생했습니다.');
                } else {
                    setResult(data);
                    
                    // DB/Store에 기록 (명확한 회사 대상일 경우)
                    if (payloadCompanyId && data.issueCount !== undefined) {
                        try {
                            const updates = {
                                riskLevel: data.riskLevel,
                                issueCount: data.issueCount,
                                status: 'analyzed' as any
                            };
                            
                            // 1. 로컬 상태 변경
                            leadStore.update(payloadCompanyId, updates);
                            
                            // 2. Supabase DB 영구 저장
                            await supabaseCompanyStore.update(payloadCompanyId, updates);
                            console.log('[Analyze] Result saved to database for company:', payloadCompanyId);
                        } catch (e) {
                            console.warn('Failed to save analysis result to database', e);
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                setError('서버 통신 중 장애가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        }

        fetchAnalysis();
    }, [urlParam, companyParam]);

    return (
        <div className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#04091a', color: '#f0f4ff' }}>
            {/* 상단 네비게이션 */}
            <div className="max-w-4xl mx-auto mb-10">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold transition-colors hover:text-white"
                    style={{ color: 'rgba(240,244,255,0.4)' }}>
                    <ArrowLeft className="w-4 h-4" /> 뒤로 가기
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* 1) 로딩 상태 */}
                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-32">
                        <div className="text-center">
                            <Bot className="w-16 h-16 mx-auto mb-6 animate-pulse" style={{ color: '#c9a84c' }} />
                            <h2 className="text-2xl font-black mb-3">AI가 실시간 판독 중입니다</h2>
                            <p className="text-sm px-4" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                {companyParam ? `[${companyParam}]의 데이터베이스 원문을 불러와` : '입력하신 URL 환경 내 텍스트를 파싱하여'}<br/>
                                2026 개정 개인정보보호법에 맞춰 분석하고 있습니다... (약 10~20초 소요)
                            </p>
                            <Loader2 className="w-6 h-6 mx-auto mt-8 animate-spin" style={{ color: '#c9a84c' }} />
                        </div>
                    </motion.div>
                )}

                {/* 2) 에러 발생 */}
                {!loading && error && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 px-4 rounded-3xl"
                        style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)' }}>
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#f87171' }} />
                        <h2 className="text-xl font-bold mb-2">분석을 진행할 수 없습니다</h2>
                        <p className="text-sm mb-6" style={{ color: 'rgba(240,244,255,0.6)' }}>{error}</p>
                        <button onClick={() => router.push('/privacy-report')} className="px-6 py-2.5 rounded-xl text-sm font-bold"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            기존 화면으로
                        </button>
                    </motion.div>
                )}

                {/* 3) 분석 결과 출력 */}
                {!loading && result && (
                    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
                        {/* ── 결과 헤더 ── */}
                        <motion.div variants={fadeUp} className="relative p-8 rounded-3xl overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 filter blur-3xl"
                                style={{ background: LVL_COLOR[result.riskLevel] }} />
                                
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                                            style={{ background: result.isDemoMode ? 'rgba(168,85,247,0.15)' : 'rgba(74,222,128,0.15)', color: result.isDemoMode ? '#a855f7' : '#4ade80' }}>
                                            <Zap className="w-3 h-3" />
                                            {result.isDemoMode ? 'Democ API 플래그 표시' : 'GPT-4o 실시간 분석 완료'}
                                        </div>
                                        {companyParam && (
                                            <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(240,244,255,0.5)' }}>
                                                CRM 연동 객체
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-3">
                                        {companyParam && <span style={{ color: '#c9a84c' }}>{companyParam}</span>}
                                        개인정보처리방침 리스크 
                                        {result.riskLevel === 'HIGH' && ' 심각'}
                                    </h1>
                                    <p className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm font-medium" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                        {result.analyzedUrl && (
                                            <a href={result.analyzedUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 transition-colors hover:text-white">
                                                <ExternalLink className="w-3.5 h-3.5" /> 원문보기
                                            </a>
                                        )}
                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 진단일시: {new Date(result.completedAt).toLocaleString('ko-KR')}</span>
                                    </p>
                                </div>

                                <div className="text-right">
                                    <div className="inline-block text-center px-8 py-4 rounded-2xl"
                                        style={{ background: LVL_BG[result.riskLevel], border: `1px solid ${LVL_COLOR[result.riskLevel]}40` }}>
                                        <div className="text-sm font-black mb-1 opacity-80" style={{ color: LVL_COLOR[result.riskLevel] }}>최종 종합 등급</div>
                                        <div className="text-4xl font-black tracking-tighter" style={{ color: LVL_COLOR[result.riskLevel] }}>{LVL_LABEL[result.riskLevel]}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── 요약 통계 ── */}
                        <motion.div variants={fadeUp} className="flex gap-4 p-5 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-center justify-center p-4 rounded-xl" style={{ background: 'rgba(201,168,76,0.1)' }}>
                                <AlertCircle className="w-8 h-8" style={{ color: '#c9a84c' }} />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-sm font-bold" style={{ color: 'rgba(240,244,255,0.5)' }}>발견된 위반 및 개선 의심 항목</span>
                                <span className="text-2xl font-black mt-1">총 {result.issues?.length || 0}건</span>
                            </div>
                        </motion.div>

                        {/* ── 세부 조항 리스트 ── */}
                        {result.issues && result.issues.length > 0 ? (
                            <div className="grid gap-4">
                                {result.issues.map((issue, idx) => (
                                    <motion.div key={idx} variants={fadeUp} className="p-6 rounded-2xl transition-all"
                                        style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${LVL_COLOR[issue.level]}30` }}>
                                        <div className="flex flex-col md:flex-row md:items-start gap-5">
                                            {/* 왼쪽 사이드 바 표시 */}
                                            <div className="flex-shrink-0 w-full md:w-32 pt-1">
                                                <div className="inline-block px-3 py-1 rounded-md text-xs font-black tracking-wider"
                                                    style={{ background: LVL_COLOR[issue.level], color: '#04091a' }}>
                                                    {LVL_LABEL[issue.level]}
                                                </div>
                                                <div className="mt-4 text-xs font-bold leading-relaxed opacity-60">
                                                    근거 법령:<br/> <span className="text-[10px] break-keep text-wrap inline-block mt-1">{issue.law}</span>
                                                </div>
                                            </div>

                                            {/* 우측 내용 */}
                                            <div className="flex-1 space-y-4 text-sm">
                                                <h3 className="text-lg font-black" style={{ color: '#f0f4ff' }}>{issue.title}</h3>
                                                
                                                <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                    <div className="flex gap-2 text-red-300">
                                                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                        <span className="opacity-90 leading-relaxed font-bold">{issue.riskDesc || "리스크 설명이 없습니다."}</span>
                                                    </div>
                                                </div>

                                                <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(74,222,128,0.05)' }}>
                                                    <div className="flex gap-2 text-green-300">
                                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                        <span className="opacity-90 leading-relaxed font-bold">{issue.customDraft || "수정 권고안이 없습니다."}</span>
                                                    </div>
                                                </div>

                                                {issue.originalText && (
                                                <div className="flex items-start gap-2 mt-2 px-1 opacity-60">
                                                    <span className="text-[10px] uppercase font-black tracking-widest flex-shrink-0 pt-0.5" style={{ color: 'rgba(240,244,255,0.6)' }}>발췌 원문</span>
                                                    <span className="text-xs font-mono">{issue.originalText}</span>
                                                </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <motion.div variants={fadeUp} className="text-center py-20 px-4 rounded-2xl"
                                style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)' }}>
                                <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: '#4ade80' }} />
                                <h3 className="text-xl font-bold mb-2">분석 결과, 양호 수준입니다.</h3>
                                <p className="text-sm opacity-60">중대한 법적 리스크가 발견되지 않았습니다. 단, 최신 법률 트렌드를 준수하는지 정기 점검이 권장됩니다.</p>
                            </motion.div>
                        )}

                        {/* ── 하단 CTA ── */}
                        <motion.div variants={fadeUp} className="mt-16 text-center border-t pt-12" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <h2 className="text-2xl font-black mb-3">AI 진단만으로는 100% 방어할 수 없습니다</h2>
                            <p className="text-sm mb-8 max-w-xl mx-auto" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                법률 해석은 비즈니스 형태마다 다르게 적용됩니다. 지금 바로 변호사에게 방어 논리를 의뢰하여, 다가오는 감사 또는 민원으로부터 완전히 해방되십시오.
                            </p>
                            <button className="flex items-center justify-center gap-2 w-full md:w-auto mx-auto px-10 py-5 rounded-2xl font-black text-lg transition-transform hover:scale-105"
                                style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#04091a', boxShadow: '0 10px 40px rgba(201,168,76,0.3)' }}>
                                <Shield className="w-5 h-5" /> 변호사 심층 진단 & 개정안 받기
                            </button>
                        </motion.div>

                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default function PrivacyReportResultPageWrap() {
    return (
        <Suspense fallback={
            <div className="min-h-screen pt-24 pb-20 px-4 flex justify-center items-center" style={{ background: '#04091a', color: '#f0f4ff' }}>
                <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
            </div>
        }>
            <ResultContent />
        </Suspense>
    );
}
