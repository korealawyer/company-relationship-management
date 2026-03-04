'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Bot, Loader2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface Issue { clauseTitle: string; level: 'HIGH' | 'MEDIUM' | 'LOW'; original: string; problem: string; suggestion: string; lawRef: string; }
interface ReviewResult { overallRisk: 'HIGH' | 'MEDIUM' | 'LOW'; summary: string; issues: Issue[]; }

const LVL_COLOR: Record<string, string> = { HIGH: '#f87171', MEDIUM: '#fb923c', LOW: '#facc15' };
const LVL_BG: Record<string, string> = { HIGH: 'rgba(248,113,113,0.1)', MEDIUM: 'rgba(251,146,60,0.1)', LOW: 'rgba(250,204,21,0.1)' };

const SAMPLE = `제8조 (위약금)\n가맹점사업자가 계약을 중도 해지할 경우 가맹금의 200%를 위약금으로 지급한다.\n\n제12조 (계약 해지)\n가맹본부는 서면 통보 후 즉시 계약을 해지할 수 있다.\n\n제15조 (영업지역)\n영업구역은 상호 협의에 따라 변경될 수 있다.`;

export default function LegalReviewPage() {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ReviewResult | null>(null);
    const [expanded, setExpanded] = useState<number | null>(0);

    const analyze = async () => {
        if (!text.trim()) return;
        setLoading(true); setResult(null);
        try {
            const res = await fetch('/api/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) });
            const data = await res.json();
            setResult(data.result);
        } catch { alert('분석 중 오류'); }
        setLoading(false);
    };

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ background: '#04091a' }}>
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center py-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                        <Bot className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-bold" style={{ color: '#c9a84c' }}>Claude Sonnet 3.7 기반 AI 검토</span>
                    </div>
                    <h1 className="text-3xl font-black mb-2" style={{ color: '#f0f4ff' }}>계약서 AI 리스크 분석</h1>
                    <p className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>계약서를 붙여넣으면 AI가 조항별 리스크를 분석합니다</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-bold text-sm" style={{ color: 'rgba(240,244,255,0.7)' }}>계약서 원문</h2>
                            <button onClick={() => setText(SAMPLE)} className="text-xs px-3 py-1.5 rounded-lg"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.5)' }}>
                                샘플 불러오기
                            </button>
                        </div>
                        <textarea value={text} onChange={e => setText(e.target.value)}
                            placeholder="계약서 내용을 붙여넣으세요..." rows={14}
                            className="w-full p-4 rounded-xl outline-none text-sm resize-none"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', lineHeight: 1.7 }} />
                        <button onClick={analyze} disabled={loading || !text.trim()}
                            className="w-full py-3.5 rounded-xl font-black mt-3 flex items-center justify-center gap-2 disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> AI 분석 중...</> : <><Bot className="w-5 h-5" /> AI 리스크 분석</>}
                        </button>
                    </div>
                    <div>
                        <h2 className="font-bold text-sm mb-3" style={{ color: 'rgba(240,244,255,0.7)' }}>AI 분석 결과</h2>
                        {!result && !loading && (
                            <div className="h-64 flex items-center justify-center rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                                <div className="text-center">
                                    <Shield className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: '#c9a84c' }} />
                                    <p className="text-sm" style={{ color: 'rgba(240,244,255,0.3)' }}>분석 결과가 여기에 표시됩니다</p>
                                </div>
                            </div>
                        )}
                        {loading && (
                            <div className="h-64 flex items-center justify-center rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <div className="text-center">
                                    <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin" style={{ color: '#c9a84c' }} />
                                    <p className="text-sm" style={{ color: 'rgba(240,244,255,0.5)' }}>조항별 리스크 분석 중...</p>
                                </div>
                            </div>
                        )}
                        {result && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                <div className="p-4 rounded-xl"
                                    style={{ background: LVL_BG[result.overallRisk], border: `1px solid ${LVL_COLOR[result.overallRisk]}30` }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4" style={{ color: LVL_COLOR[result.overallRisk] }} />
                                        <span className="font-black text-sm" style={{ color: LVL_COLOR[result.overallRisk] }}>
                                            전체 리스크: {result.overallRisk} · {result.issues.length}건 발견
                                        </span>
                                    </div>
                                    <p className="text-sm" style={{ color: 'rgba(240,244,255,0.8)' }}>{result.summary}</p>
                                </div>
                                {result.issues.map((issue, i) => (
                                    <div key={i} className="rounded-xl overflow-hidden"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${LVL_COLOR[issue.level]}25` }}>
                                        <button className="w-full flex items-center justify-between p-4"
                                            onClick={() => setExpanded(expanded === i ? null : i)}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full font-black"
                                                    style={{ background: LVL_BG[issue.level], color: LVL_COLOR[issue.level] }}>{issue.level}</span>
                                                <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>{issue.clauseTitle}</span>
                                            </div>
                                            {expanded === i ? <ChevronUp className="w-4 h-4 opacity-40" /> : <ChevronDown className="w-4 h-4 opacity-40" />}
                                        </button>
                                        <AnimatePresence>
                                            {expanded === i && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                    <div className="px-4 pb-4 space-y-2">
                                                        <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(240,244,255,0.5)', borderLeft: '2px solid rgba(255,255,255,0.1)' }}><strong>원문:</strong> {issue.original}</div>
                                                        <div className="p-3 rounded-lg text-xs" style={{ background: LVL_BG[issue.level], color: LVL_COLOR[issue.level], borderLeft: `2px solid ${LVL_COLOR[issue.level]}` }}><strong>문제:</strong> {issue.problem}</div>
                                                        <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', borderLeft: '2px solid rgba(74,222,128,0.4)' }}><strong>제안:</strong> {issue.suggestion}</div>
                                                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>📋 {issue.lawRef}</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                                <button className="w-full py-3 rounded-xl font-bold text-sm"
                                    style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
                                    변호사 검토 요청하기 →
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
