'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, RefreshCw, BrainCircuit, Sparkles, Zap, Clock, Trash2 } from 'lucide-react';
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

/* ── Props ───────────────── */
export interface MemoTabProps {
    co: Company;
    onRefresh: () => void;
    setToast: (s: string) => void;
}

/* ── Component ───────────── */
export default function MemoTab({ co, onRefresh, setToast }: MemoTabProps) {
    const { user } = useAuth();
    const authorName = user?.name || '알 수 없음';
    const [note, setNote] = useState('');
    const [memos, setMemos] = useState<CompanyMemo[]>([]);
    const [aiResult, setAiResult] = useState<AIMemoResult | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [saving, setSaving] = useState(false);

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
        setNote('');
        setAiResult(null);
        loadMemos();
    }, [co.id, loadMemos]);

    const saveMemo = async () => {
        if (!note.trim() || saving) return;
        setSaving(true);
        try {
            const res = await fetch('/api/memos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: co.id,
                    author: authorName,
                    content: note.trim(),
                }),
            });
            if (res.ok) {
                setNote('');
                setToast('💾 메모 저장');
                await loadMemos();
                onRefresh();
            } else {
                const err = await res.json();
                setToast(`⚠️ 저장 실패: ${err.error}`);
            }
        } catch {
            setToast('⚠️ 저장 실패');
        } finally {
            setSaving(false);
        }
    };

    const saveWithAI = async () => {
        if (!note.trim() || saving) return;
        // 먼저 메모 저장
        setSaving(true);
        try {
            const res = await fetch('/api/memos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: co.id,
                    author: authorName,
                    content: note.trim(),
                }),
            });
            if (!res.ok) {
                setToast('⚠️ 저장 실패');
                setSaving(false);
                return;
            }
        } catch {
            setToast('⚠️ 저장 실패');
            setSaving(false);
            return;
        }

        setAiLoading(true);
        try {
            const r = await AIMemoService.analyze(co, note);
            setAiResult(r);
            // AI 결과는 companies 테이블에 저장 (RLS 문제 없음)
            const { useCompanies } = await import('@/hooks/useDataLayer');
            // Direct Supabase update for AI fields (companies table has RLS)
            const { supabaseCompanyStore } = await import('@/lib/supabaseStore');
            await supabaseCompanyStore.update(co.id, {
                aiMemoSummary: r.summary,
                aiNextAction: r.nextAction,
                aiNextActionType: r.nextActionType,
            });
            setToast('🤖 AI 분석 완료');
        } catch {
            setToast('⚠️ AI 분석 실패');
        } finally {
            setAiLoading(false);
            setSaving(false);
            setNote('');
            await loadMemos();
            onRefresh();
        }
    };

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

    return (
        <div className="flex flex-col gap-4">
            {/* ── AI 분석 결과 패널 (1행) ── */}
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

            {/* ── 메모 입력 (2행) ── */}
            <div className="flex flex-col gap-2">
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="새 메모를 입력하세요..."
                    className="flex-1 rounded-xl text-[12px] p-4 font-medium leading-relaxed"
                    style={{
                        background: C.surface,
                        border: `1px solid ${C.borderLight}`,
                        color: C.body,
                        outline: 'none',
                        resize: 'none',
                        minHeight: 100,
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            saveMemo();
                        }
                    }}
                />
                <div className="flex gap-2">
                    <button
                        onClick={saveMemo}
                        disabled={!note.trim() || saving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-opacity"
                        style={{
                            background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                            opacity: (note.trim() && !saving) ? 1 : 0.5,
                        }}
                    >
                        <Send className="w-3.5 h-3.5" />{saving ? '저장중...' : '저장'}
                    </button>
                    <button
                        onClick={saveWithAI}
                        disabled={aiLoading || !note.trim() || saving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-opacity"
                        style={{
                            background: '#f3e8ff', color: '#7c3aed', border: '1px solid #d8b4fe',
                            opacity: (aiLoading || !note.trim() || saving) ? 0.5 : 1,
                        }}
                    >
                        {aiLoading
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <BrainCircuit className="w-3.5 h-3.5" />}
                        {aiLoading ? '분석중...' : 'AI 분석 저장'}
                    </button>
                </div>
                <p className="text-[9px] text-right" style={{ color: C.faint }}>
                    Ctrl+Enter로 빠른 저장
                </p>
            </div>

            {/* ── 메모 히스토리 (3행) ── */}
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
                                    <button
                                        onClick={() => deleteMemo(memo.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all"
                                        title="메모 삭제"
                                    >
                                        <Trash2 className="w-3 h-3" style={{ color: '#dc2626' }} />
                                    </button>
                                </div>
                                <p className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: C.body }}>
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
