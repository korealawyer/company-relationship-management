'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, FileText, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useCompanies } from '@/hooks/useDataLayer';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const LVL_COLOR: Record<string, string> = { HIGH: '#f87171', MEDIUM: '#fb923c', LOW: '#4ade80' };
const LVL_BG: Record<string, string> = { HIGH: 'rgba(248,113,113,0.1)', MEDIUM: 'rgba(251,146,60,0.1)', LOW: 'rgba(74,222,128,0.1)' };
const LVL_LABEL: Record<string, string> = { HIGH: '怨좎쐞??, MEDIUM: '二쇱쓽', LOW: '?묓샇' };

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

    const { issues, riskLevel, lawyerConfirmed } = company;
    const hasAnalysis = issues && issues.length > 0 && lawyerConfirmed;
    const effectiveRiskLevel = riskLevel || (hasAnalysis ? 'MEDIUM' : 'LOW');

    return (
        <div className="min-h-screen pt-20 pb-20 px-4" style={{ background: '#f8f7f4' }}>
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold transition-colors hover:text-black"
                    style={{ color: '#6b7280' }}>
                    <ArrowLeft className="w-4 h-4" /> ?ㅻ줈 媛湲?                </button>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* ?? ?ㅻ뜑 ??댄? ?? */}
                <div className="relative p-8 rounded-3xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                                    style={{ background: '#eff6ff', color: '#2563eb' }}>
                                    <Shield className="w-3 h-3" />
                                    IBS 踰뺣쪧 遺꾩꽍 ?쒖뒪??                                </div>
                            </div>
                            <h1 className="text-3xl font-black mb-2" style={{ color: '#111827' }}>
                                媛쒖씤?뺣낫 泥섎━諛⑹묠 遺꾩꽍 寃곌낵
                            </h1>
                            <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                                {company.name}??媛쒖씤?뺣낫 泥섎━諛⑹묠?????踰뺤쟻 由ъ뒪???먭? 寃곌낵?낅땲??
                            </p>
                        </div>
                        
                        {hasAnalysis && (
                        <div className="text-right">
                            <div className="inline-block text-center px-8 py-4 rounded-2xl"
                                style={{ background: LVL_BG[effectiveRiskLevel], border: `1px solid ${LVL_COLOR[effectiveRiskLevel]}40` }}>
                                <div className="text-sm font-black mb-1 opacity-80" style={{ color: LVL_COLOR[effectiveRiskLevel] }}>理쒖쥌 醫낇빀 ?깃툒</div>
                                <div className="text-4xl font-black tracking-tighter" style={{ color: LVL_COLOR[effectiveRiskLevel] }}>{LVL_LABEL[effectiveRiskLevel]}</div>
                            </div>
                        </div>
                        )}
                    </div>
                </div>

                {/* ?? 寃곌낵 蹂몃Ц ?? */}
                {!hasAnalysis ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 px-4 rounded-3xl"
                        style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#d1d5db' }} />
                        <h3 className="text-xl font-bold mb-2 text-gray-900">?꾩쭅 遺꾩꽍 寃곌낵媛 ?놁뒿?덈떎.</h3>
                        <p className="text-sm text-gray-500 mb-6">?대떦 蹂?몄궗媛 ?꾩옱 ?뺤씤 ?먮뒗 遺꾩꽍??吏꾪뻾 以묒씪 ???덉뒿?덈떎.</p>
                    </motion.div>
                ) : (
                    <>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 p-5 rounded-2xl"
                            style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <div className="flex items-center justify-center p-4 rounded-xl" style={{ background: '#fffbeb' }}>
                                <AlertCircle className="w-8 h-8" style={{ color: '#d97706' }} />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-sm font-bold" style={{ color: '#6b7280' }}>諛쒓껄???꾨컲 諛?媛쒖꽑 ?섏떖 ??ぉ</span>
                                <span className="text-2xl font-black mt-1 text-gray-900">珥?{issues.length}嫄?/span>
                            </div>
                        </motion.div>

                        <div className="grid gap-4">
                            {issues.map((issue: any, idx: number) => (
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
                                                洹쇨굅 踰뺣졊:<br/> <span className="text-[10px] break-keep text-wrap inline-block mt-1">{issue.law}</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4 text-sm">
                                            <h3 className="text-lg font-black text-gray-900">{issue.title}</h3>
                                            
                                            <div className="p-4 rounded-xl space-y-2" style={{ background: '#fef2f2' }}>
                                                <div className="flex gap-2 text-red-600">
                                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span className="opacity-90 leading-relaxed font-bold">{issue.riskDesc || "由ъ뒪???ㅻ챸???놁뒿?덈떎."}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl space-y-2" style={{ background: '#f0fdf4' }}>
                                                <div className="flex gap-2 text-green-700">
                                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span className="opacity-90 leading-relaxed font-bold">{issue.customDraft || "?섏젙 沅뚭퀬?덉씠 ?놁뒿?덈떎."}</span>
                                                </div>
                                            </div>

                                            {issue.lawyerNote && (
                                            <div className="p-4 rounded-xl space-y-2" style={{ background: '#f0f9ff' }}>
                                                <div className="flex gap-2 text-blue-700">
                                                    <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="block text-xs font-black mb-1 opacity-70">蹂?몄궗 由щ럭 肄붾찘??/span>
                                                        <span className="opacity-90 leading-relaxed font-bold">{issue.lawyerNote}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            )}

                                            {issue.originalText && (
                                            <div className="flex items-start gap-2 mt-4 px-1">
                                                <span className="text-[10px] uppercase font-black tracking-widest flex-shrink-0 pt-0.5 text-gray-400">諛쒖톸 ?먮Ц</span>
                                                <span className="text-xs font-mono text-gray-600">{issue.originalText}</span>
                                            </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* 怨꾩빟(?먮Ц ?꾩엫) CTA ?곸뿭 */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="mt-8 p-8 rounded-3xl text-center"
                            style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', border: '1px solid #334155' }}>
                            <h3 className="text-xl font-black mb-2 flex items-center justify-center gap-2">
                                <Shield className="w-5 h-5 text-amber-400" />
                                諛쒓껄??由ъ뒪?? IBS 濡쒗럩?먯꽌 ?꾨꼍?섍쾶 ?닿껐???쒕┰?덈떎.
                            </h3>
                            <p className="text-sm opacity-70 mb-6 max-w-lg mx-auto leading-relaxed">
                                ??遺꾩꽍 寃곌낵???곕Ⅸ 踰뺣쪧 ?쒖옱 諛?遺꾩웳 由ъ뒪?щ? 諛⑹??섍린 ?꾪빐 
                                媛쒖꽑 ?묒뾽??留↔린?쒕젮硫??꾨옒 踰꾪듉???뚮윭 踰뺣쪧 ?먮Ц 怨꾩빟???쒕챸??吏꾪뻾??二쇱꽭??
                            </p>
                            <button
                                onClick={() => router.push('/contracts/sign/mock-token-privacy-fix')}
                                className="px-8 py-4 rounded-xl font-black text-sm flex items-center justify-center mx-auto gap-2 transition-transform hover:scale-105"
                                style={{ background: 'linear-gradient(135deg, #e8c87a, #c9a84c)', color: '#0f172a', boxShadow: '0 4px 15px rgba(201,168,76,0.3)' }}>
                                <AlertTriangle className="w-4 h-4" /> 由ъ뒪??媛쒖꽑 怨꾩빟 ?꾩옄?쒕챸?섍린
                            </button>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}
