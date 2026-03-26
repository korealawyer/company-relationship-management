'use client';
import React, { useState, useEffect } from 'react';
import { Send, RefreshCw, BrainCircuit, Sparkles, Zap } from 'lucide-react';
import { Company } from '@/lib/types';
import { useCompanies } from '@/hooks/useDataLayer';
import { AIMemoService, type AIMemoResult } from '@/lib/salesAutomation';

/* ── CRM 라이트 색상 (공유 상수 추출 전 임시 로컬 복사) ─────── */
const C = {
    surface: '#ffffff',
    borderLight: '#e5e7eb',
    heading: '#0f172a',
    body: '#1e293b',
    sub: '#475569',
    faint: '#94a3b8',
};

/* ── Props ───────────────────────────────────────────────── */
export interface MemoTabProps {
    co: Company;
    onRefresh: () => void;
    setToast: (s: string) => void;
}

/* ── Component ───────────────────────────────────────────── */
export default function MemoTab({ co, onRefresh, setToast }: MemoTabProps) {
    const { updateCompany } = useCompanies();
    const [note, setNote] = useState(co.callNote || '');
    const [aiResult, setAiResult] = useState<AIMemoResult | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Reset when the target company changes
    useEffect(() => {
        setNote(co.callNote || '');
        setAiResult(null);
    }, [co.id]);

    const saveMemo = () => {
        updateCompany(co.id, { callNote: note });
        onRefresh();
        setToast('💾 저장');
    };

    const saveWithAI = async () => {
        if (!note.trim()) return;
        updateCompany(co.id, { callNote: note });
        setAiLoading(true);
        try {
            const r = await AIMemoService.analyze(co, note);
            setAiResult(r);
            updateCompany(co.id, {
                aiMemoSummary: r.summary,
                aiNextAction: r.nextAction,
                aiNextActionType: r.nextActionType,
            });
            setToast('🤖 AI 분석 완료');
        } catch {
            setToast('⚠️ 실패');
        } finally {
            setAiLoading(false);
            onRefresh();
        }
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* ── 메모 입력 ── */}
            <div className="flex flex-col gap-2">
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="통화 내용을 기록하세요..."
                    className="flex-1 rounded-xl text-[12px] p-4 font-medium leading-relaxed"
                    style={{
                        background: C.surface,
                        border: `1px solid ${C.borderLight}`,
                        color: C.body,
                        outline: 'none',
                        resize: 'none',
                        minHeight: 180,
                    }}
                />
                <div className="flex gap-2">
                    <button
                        onClick={saveMemo}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                        style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                    >
                        <Send className="w-3.5 h-3.5" />저장
                    </button>
                    <button
                        onClick={saveWithAI}
                        disabled={aiLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                        style={{ background: '#f3e8ff', color: '#7c3aed', border: '1px solid #d8b4fe' }}
                    >
                        {aiLoading
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <BrainCircuit className="w-3.5 h-3.5" />}
                        {aiLoading ? '분석중...' : 'AI 분석 저장'}
                    </button>
                </div>
            </div>

            {/* ── AI 분석 결과 패널 ── */}
            <div className="space-y-3">
                {aiResult && (
                    <div className="rounded-xl p-4" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4" style={{ color: '#7c3aed' }} />
                            <span className="text-xs font-black" style={{ color: C.heading }}>AI 분석 결과</span>
                            <span
                                className="text-[9px] px-1.5 py-0.5 rounded-full"
                                style={{ background: '#f3e8ff', color: '#7c3aed' }}
                            >
                                신뢰도 {aiResult.confidence}%
                            </span>
                        </div>
                        <p className="text-[11px] mb-2 leading-relaxed" style={{ color: C.body }}>
                            {aiResult.summary}
                        </p>
                        {aiResult.keyPoints && aiResult.keyPoints.length > 0 && (
                            <div className="mb-2">
                                {aiResult.keyPoints.map((p, i) => (
                                    <div key={i} className="text-[10px] py-0.5" style={{ color: C.sub }}>• {p}</div>
                                ))}
                            </div>
                        )}
                        <div
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
                            style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}
                        >
                            <Zap className="w-3 h-3" style={{ color: '#059669' }} />
                            <span className="text-[10px] font-bold" style={{ color: '#059669' }}>
                                추천: {aiResult.nextAction}
                            </span>
                        </div>
                    </div>
                )}

                {!aiResult && (
                    <div
                        className="rounded-xl p-6 text-center"
                        style={{ background: C.surface, border: `1px solid ${C.borderLight}` }}
                    >
                        <BrainCircuit className="w-8 h-8 mx-auto mb-2" style={{ color: C.faint }} />
                        <p className="text-xs font-bold" style={{ color: '#64748b' }}>메모 작성 후 AI 분석</p>
                        <p className="text-[10px] mt-1" style={{ color: C.faint }}>통화 내용 요약 + 다음 액션 추천</p>
                    </div>
                )}

                {co.aiMemoSummary && !aiResult && (
                    <div
                        className="rounded-xl p-3"
                        style={{ background: '#f0fdf4', border: '1px solid #a7f3d0' }}
                    >
                        <p className="text-[10px] font-bold mb-1" style={{ color: '#059669' }}>📌 이전 AI 분석</p>
                        <p className="text-[10px]" style={{ color: C.body }}>{co.aiMemoSummary}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
