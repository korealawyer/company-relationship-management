'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Scale, CheckCircle2, ChevronDown, FileSignature, FileText, Gavel, Edit3, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ───── Color Constants ───── */
const LVL_COLOR: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
const LVL_LABEL: Record<string, string> = { HIGH: '위반(고위험)', MEDIUM: '시정권고', LOW: '양호' };
const GOLD = '#c9a84c';

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

interface LegalReviewPreviewProps {
    companyName: string;
    displayIssues: any[];
    auditReport?: string | null;
    onUpdateReport?: (newReport: string) => void;
    lawyerName?: string;
    lawyerSignature?: string;
}

export default function LegalReviewPreview({ companyName, auditReport, displayIssues, onUpdateReport, lawyerName, lawyerSignature }: LegalReviewPreviewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(auditReport || '');
    const saveTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isEditing && auditReport) {
            setEditContent(auditReport);
        }
    }, [auditReport, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setEditContent(val);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            if (onUpdateReport) onUpdateReport(val);
        }, 1500);
    };

    const handleBlur = () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (onUpdateReport) onUpdateReport(editContent);
    };

    const effectiveTotalIssues = displayIssues.length;
    const isCritical = displayIssues.some(i => i.level === 'HIGH');
    const effectiveRiskLevel = isCritical ? 'HIGH' : (displayIssues.some(i => i.level === 'MEDIUM') ? 'MEDIUM' : 'LOW');
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    return (
        <div className="w-full xl:flex-1 min-w-0 mx-auto max-w-[900px] mt-8 mb-40 text-left">
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
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />
                
                <div className="relative z-10 px-8 md:px-16 py-12 md:py-16">
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

                    <h1 className="text-3xl md:text-[40px] font-black text-gray-900 leading-[1.2] tracking-tight mb-4">
                        개인정보 처리방침<br />
                        <span style={{ color: isCritical ? '#ef4444' : GOLD }}>조문별 법적 검토안</span>
                    </h1>
                    <div className="w-20 h-[2px] mb-6" style={{ backgroundColor: isCritical ? '#ef4444' : GOLD }} />
                    <p className="text-[15px] text-gray-500 font-medium leading-relaxed max-w-2xl">
                        {companyName}의 현재 개인정보 처리방침에 대하여 개인정보보호법, 정보통신망법 등 관련 법령을 기준으로 조문별 위반 소지 및 법적 리스크를 검토한 결과입니다.
                    </p>

                    <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1">대상 기업</div>
                            <div className="text-sm font-black text-gray-900">{companyName}</div>
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

            {/* ── 본문 영역 ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative bg-[#faf9f6]"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.03)' }}
            >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />

                {auditReport ? (
                    <>
                        {/* 마크다운 보고서 */}
                        <div className="px-8 md:px-16 py-12 relative z-10">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-8">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-300" />
                                    <h2 className="text-sm font-black text-gray-400 tracking-wider uppercase">종합 실사 보고서</h2>
                                </div>
                                {onUpdateReport && (
                                    <button 
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                    >
                                        {isEditing ? <Check size={14} /> : <Edit3 size={14} />}
                                        {isEditing ? '보기 모드' : '수정 모드'}
                                    </button>
                                )}
                            </div>
                            
                            {isEditing ? (
                                <textarea
                                    value={editContent}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className="w-full h-[60vh] p-4 text-[14px] leading-relaxed text-gray-800 bg-gray-50 border border-gray-200 rounded shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y"
                                    style={{ fontFamily: "'Pretendard', 'Inter', sans-serif" }}
                                    placeholder="마크다운 양식으로 검토안을 수정할 수 있습니다."
                                />
                            ) : (
                                <div className="prose prose-slate max-w-none text-[15px] leading-[2] text-gray-800 prose-headings:font-black prose-headings:text-gray-900 prose-headings:tracking-tight prose-h1:text-2xl prose-h1:mt-12 prose-h1:mb-4 prose-h1:pb-3 prose-h1:border-b prose-h1:border-gray-100 prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-2 prose-p:text-gray-700 prose-p:leading-[2] prose-strong:text-gray-900 prose-li:text-gray-700 prose-li:leading-[1.8] prose-table:text-sm prose-th:bg-gray-50 prose-th:font-black prose-th:text-gray-900" style={{ fontFamily: "'Pretendard', 'Inter', sans-serif" }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{auditReport}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                    </>
                ) : (
                    /* 보고서 생성 지연 중 표시 */
                    <div className="px-8 md:px-16 py-12 relative z-10 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-lg font-black text-gray-700 mb-2">종합 실사 보고서 생성 중...</h2>
                        <p className="text-sm text-gray-500">AI가 1차 조문 검토 결과를 바탕으로 최종 검토 보고서를 작성하고 있습니다. 잠시만 기다려주세요.</p>
                        
                    </div>
                )}

                {/* ── 페이지 끝부분 ── */}
                <div className="px-8 md:px-16 py-12 border-t border-gray-100 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-3">검토 확인</div>
                            <div>
                                <div className="text-sm font-black text-gray-900">IBS 법률사무소</div>
                                <div className="text-[11px] font-medium text-gray-400">개인정보보호 전문 검토팀</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-3 mb-2">
                                <span className="text-sm font-black text-gray-900">변호사 {lawyerName || '임시'}</span>
                                <img src={lawyerSignature || "/signatures/lawyer-j.png"} alt="서명" className="h-[40px] w-auto object-contain opacity-80 mix-blend-multiply" />
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium tracking-tight">
                                본 검토안은 법률 자문 목적으로 작성되었으며,<br />무단 복제 및 배포를 금합니다.
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
