'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, RefreshCw, BrainCircuit, Sparkles, Zap, Clock, Trash2, Download } from 'lucide-react';
import { Company, CompanyMemo } from '@/lib/types';
import { AIMemoService, type AIMemoResult } from '@/lib/salesAutomation';
import { useAuth } from '@/lib/AuthContext';

/* ── CRM 라이트 색상 ─────── */
const C = {
    surface: '#ffffff',
    borderLight: '#e5e7eb',
    heading: '#0f172a',
    body: '#1e293b',
    sub: '#475569',
    faint: '#94a3b8',
};

/* ── 날짜 포맷 유틸 ─────── */
function formatDateTime(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface MemoTabProps {
    co: Company;
    onRefresh: () => void;
    setToast: (s: string) => void;
    refreshTrigger?: number;
}

/* ── Component ───────────── */
export default function MemoTab({ co, onRefresh, setToast, refreshTrigger }: MemoTabProps) {
    const { user } = useAuth();
    const authorName = user?.name || '알 수 없음';
    const [memos, setMemos] = useState<CompanyMemo[]>([]);
    const [aiResult, setAiResult] = useState<AIMemoResult | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [resummarizingId, setResummarizingId] = useState<string | null>(null);

    // 메모 목록 로드
    const loadMemos = useCallback(async () => {
        try {
            const res = await fetch(`/api/memos?companyId=${co.id}`);
            if (res.ok) {
                const data = await res.json();
                setMemos(data.memos || []);
            }
        } catch (e) {
            console.error('Failed to load memos:', e);
        }
    }, [co.id]);

    // Reset when the target company changes
    useEffect(() => {
        setAiResult(null);
        prevMemosLength.current = -1;
        loadMemos();
    }, [co.id, loadMemos, refreshTrigger]);

    const prevMemosLength = useRef(-1);

    // 자동 AI 분석: 메모 목록이 로드되거나 변경될 때마다 전체 히스토리를 기반으로 AI 요약 수행
    useEffect(() => {
        if (memos.length > 0 && memos.length !== prevMemosLength.current) {
            prevMemosLength.current = memos.length;
            
            const runAutoAI = async () => {
                setAiLoading(true);
                try {
                    const r = await AIMemoService.analyze(co, memos);
                    setAiResult(r);
                    
                    const { supabaseCompanyStore } = await import('@/lib/supabaseStore');
                    await supabaseCompanyStore.update(co.id, {
                        aiMemoSummary: r.summary,
                        aiNextAction: r.nextAction,
                        aiNextActionType: r.nextActionType,
                    });
                } catch (e) {
                    console.error('Auto AI Analysis failed:', e);
                } finally {
                    setAiLoading(false);
                }
            };
            
            runAutoAI();
        }
    }, [memos, co]);

    const deleteMemo = async (memoId: string) => {
        try {
            const res = await fetch(`/api/memos?id=${memoId}&companyId=${co.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setToast('🗑️ 메모 삭제');
                await loadMemos();
                onRefresh();
            }
        } catch {
            setToast('⚠️ 삭제 실패');
        }
    };

    const handleDownloadTxt = (memo: CompanyMemo) => {
        const scriptMatch = memo.content.split('[전문]');
        if (scriptMatch.length > 1) {
            const script = scriptMatch[1].replace(/^\n+/, ''); // 맨 앞 줄바꿈 제거
            const blob = new Blob([script], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `녹음내용_${formatDateTime(memo.createdAt).replace(/[^0-9]/g, '')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleReSummarize = async (memo: CompanyMemo) => {
        if (resummarizingId === memo.id) return;
        const parts = memo.content.split('[전문]');
        if (parts.length < 2) return;
        
        setResummarizingId(memo.id);
        const script = parts[1].trim();
        setToast('AI 요약을 다시 생성 중입니다...');
        
        try {
            const res = await fetch('/api/ai/resummarize-stt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memoId: memo.id, transcript: script, memoContent: memo.content })
            });
            
            const data = await res.json();
            if (data.success) {
                setToast('요약이 성공적으로 업데이트되었습니다.');
                await loadMemos();
                onRefresh();
            } else {
                setToast(`요약 업데이트 실패: ${data.error}`);
            }
        } catch (e) {
            setToast('요약 생성 중 서버 오류가 발생했습니다.');
        } finally {
            setResummarizingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* ── AI 분석 결과 패널 (1행) ── */}
            <div className="space-y-3">
                {aiLoading ? (
                    <div
                        className="rounded-xl p-6 text-center flex flex-col items-center justify-center"
                        style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}
                    >
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: '#7c3aed' }} />
                        <p className="text-xs font-bold" style={{ color: '#7c3aed' }}>정리 중입니다...</p>
                    </div>
                ) : aiResult ? (
                    <div className="rounded-xl p-4" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4" style={{ color: '#7c3aed' }} />
                            <span
                                className="text-[9px] px-1.5 py-0.5 rounded-full border border-purple-200"
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
                ) : memos.length === 0 ? (
                    <div
                        className="rounded-xl p-6 flex items-center justify-center text-center"
                        style={{ background: C.surface, border: `1px solid ${C.borderLight}`, minHeight: '96px' }}
                    >
                        <BrainCircuit className="w-8 h-8" style={{ color: C.faint }} />
                    </div>
                ) : co.aiMemoSummary ? (
                    <div
                        className="rounded-xl p-3"
                        style={{ background: '#f0fdf4', border: '1px solid #a7f3d0' }}
                    >
                        <p className="text-[10px] font-bold mb-1" style={{ color: '#059669' }}>📌 이전 정리 내용</p>
                        <p className="text-[10px]" style={{ color: C.body }}>{co.aiMemoSummary}</p>
                    </div>
                ) : (
                    <div
                        className="rounded-xl p-6 flex items-center justify-center text-center"
                        style={{ background: C.surface, border: `1px solid ${C.borderLight}`, minHeight: '96px' }}
                    >
                        <BrainCircuit className="w-8 h-8" style={{ color: C.faint }} />
                    </div>
                )}
            </div>

            {/* ── 메모 히스토리 (2행으로 변경됨) ── */}
            {memos.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3 h-3" style={{ color: C.sub }} />
                        <span className="text-[10px] font-bold" style={{ color: C.sub }}>
                            메모 이력 ({memos.length})
                        </span>
                    </div>
                    <div
                        className="flex flex-col gap-2 overflow-y-auto pr-1"
                        style={{ maxHeight: 250 }}
                    >
                        {memos.map((memo) => (
                            <div
                                key={memo.id}
                                className="group rounded-lg p-3 transition-colors hover:bg-slate-50"
                                style={{
                                    background: C.surface,
                                    border: `1px solid ${C.borderLight}`,
                                }}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                            style={{ background: '#eef2ff', color: '#4f46e5' }}>
                                            {memo.author}
                                        </span>
                                        <span className="text-[9px]" style={{ color: C.faint }}>
                                            {formatDateTime(memo.createdAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {memo.content.includes('[전문]') && (
                                            <>
                                                <button
                                                    onClick={() => handleDownloadTxt(memo)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 transition-all flex items-center text-[9px] text-slate-500 font-medium"
                                                    title="TXT 다운로드"
                                                >
                                                    <Download className="w-3 h-3 mr-0.5" /> TXT
                                                </button>
                                                <button
                                                    onClick={() => handleReSummarize(memo)}
                                                    disabled={resummarizingId === memo.id}
                                                    className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 transition-all flex items-center text-[9px] text-slate-500 font-medium ${resummarizingId === memo.id ? 'opacity-100 cursor-not-allowed text-purple-500' : ''}`}
                                                    title="다시 요약하기"
                                                >
                                                    <RefreshCw className={`w-3 h-3 mr-0.5 ${resummarizingId === memo.id ? 'animate-spin text-purple-500' : ''}`} /> 요약 재분석
                                                </button>
                                            </>
                                        )}
                                        {user?.role !== 'sales' && (
                                            <button
                                                onClick={() => deleteMemo(memo.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all"
                                                title="메모 삭제"
                                            >
                                                <Trash2 className="w-3 h-3" style={{ color: '#dc2626' }} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[11px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: C.body }}>
                                    {memo.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
