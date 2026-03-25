'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, Search, Loader2, AlertTriangle, CheckCircle2, Calendar, ExternalLink } from 'lucide-react';
import { CourtCaseResult } from '@/types/cases';

interface CourtSearchPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CourtSearchPanel({ isOpen, onClose }: CourtSearchPanelProps) {
    const [courtQuery, setCourtQuery] = useState('');
    const [courtLoading, setCourtLoading] = useState(false);
    const [courtResult, setCourtResult] = useState<CourtCaseResult | null>(null);
    const [courtError, setCourtError] = useState('');
    const [courtFetchedAt, setCourtFetchedAt] = useState('');

    const searchCourt = async () => {
        if (!courtQuery.trim()) return;
        setCourtLoading(true);
        setCourtError('');
        setCourtResult(null);
        try {
            const res = await fetch('/api/court-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caseNumber: courtQuery.trim() }),
            });
            const json = await res.json();
            if (!res.ok) {
                setCourtError(json.error || '검색에 실패했습니다.');
            } else {
                setCourtResult(json.data);
                setCourtFetchedAt(new Date(json.fetchedAt).toLocaleString('ko-KR'));
            }
        } catch {
            setCourtError('서버 연결에 실패했습니다.');
        } finally {
            setCourtLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden">
                    <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #dde5f0' }}>
                        {/* 헤더 */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)' }}>
                                    <Globe className="w-5 h-5" style={{ color: '#fff' }} />
                                </div>
                                <div>
                                    <p className="font-black text-sm" style={{ color: '#111827' }}>대법원 나의사건검색</p>
                                    <p className="text-[10px]" style={{ color: '#9ca3af' }}>safind.scourt.go.kr 연동 · 실시간 크롤링</p>
                                </div>
                            </div>
                            <button onClick={onClose}>
                                <X className="w-4 h-4" style={{ color: '#9ca3af' }} />
                            </button>
                        </div>

                        {/* 검색 바 */}
                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                                <input value={courtQuery}
                                    onChange={e => setCourtQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && searchCourt()}
                                    placeholder="사건번호 입력 (예: 2026가합12345)"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                                    style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827' }} />
                            </div>
                            <button onClick={searchCourt} disabled={courtLoading || !courtQuery.trim()}
                                className="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                                style={{ background: '#1e3a8a', color: '#fff', opacity: courtLoading || !courtQuery.trim() ? 0.5 : 1 }}>
                                {courtLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                                {courtLoading ? '크롤링 중...' : '사건 조회'}
                            </button>
                        </div>

                        {/* 빠른 검색 칩 */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            <span className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>등록 사건:</span>
                            {['2026가합12345', '2025나67890', '2026가단34567', '2025가합78901'].map(cn => (
                                <button key={cn} onClick={() => { setCourtQuery(cn); }}
                                    className="text-[10px] px-2 py-0.5 rounded-lg font-mono transition-all hover:opacity-80"
                                    style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe' }}>
                                    {cn}
                                </button>
                            ))}
                        </div>

                        {/* 에러 */}
                        {courtError && (
                            <div className="p-3 rounded-xl flex items-center gap-2 mb-4"
                                style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#dc2626' }} />
                                <p className="text-xs" style={{ color: '#dc2626' }}>{courtError}</p>
                            </div>
                        )}

                        {/* 결과 */}
                        {courtResult && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                                    <span className="text-xs font-bold" style={{ color: '#22c55e' }}>크롤링 성공</span>
                                    <span className="text-[10px]" style={{ color: '#9ca3af' }}>{courtFetchedAt} 기준</span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* 사건 정보 */}
                                    <div className="p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                                        <p className="font-black text-sm mb-3" style={{ color: '#111827' }}>📋 사건 정보</p>
                                        {[
                                            { k: '사건번호', v: courtResult.caseNumber },
                                            { k: '사건명', v: courtResult.caseName },
                                            { k: '법원', v: `${courtResult.court} ${courtResult.courtSection}` },
                                            { k: '사건유형', v: courtResult.caseType },
                                            { k: '접수일', v: courtResult.filedDate },
                                            { k: '진행상태', v: courtResult.status },
                                            { k: '재판장', v: courtResult.judge },
                                            { k: '원고', v: courtResult.plaintiff },
                                            { k: '피고', v: courtResult.defendant },
                                        ].map(row => (
                                            <div key={row.k} className="flex justify-between py-1.5"
                                                style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                <span className="text-[11px]" style={{ color: '#6b7280' }}>{row.k}</span>
                                                <span className="text-[11px] font-bold text-right max-w-[60%]" style={{ color: '#111827' }}>{row.v}</span>
                                            </div>
                                        ))}
                                        {courtResult.nextDate && (
                                            <div className="mt-3 p-2.5 rounded-lg flex items-center gap-2"
                                                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                                                <Calendar className="w-3.5 h-3.5" style={{ color: '#92400e' }} />
                                                <span className="text-[11px] font-bold" style={{ color: '#92400e' }}>
                                                    다음 기일: {courtResult.nextDate} ({courtResult.nextEvent})
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 기일 내역 */}
                                    <div className="p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                                        <p className="font-black text-sm mb-3" style={{ color: '#111827' }}>📅 기일/결과 내역</p>
                                        <div className="space-y-0">
                                            {courtResult.events.map((ev, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-2 h-2 rounded-full mt-1.5"
                                                            style={{ background: i === 0 ? '#3b82f6' : '#d1d5db' }} />
                                                        {i < courtResult.events.length - 1 && (
                                                            <div className="w-px flex-1 mt-0.5" style={{ background: '#e5e7eb' }} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 pb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono" style={{ color: '#9ca3af' }}>{ev.date}</span>
                                                            {ev.courtroom && (
                                                                <span className="text-[9px] px-1.5 py-0.5 rounded"
                                                                    style={{ background: '#eff6ff', color: '#3b82f6' }}>{ev.courtroom}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-bold" style={{ color: '#111827' }}>{ev.type}</p>
                                                        <p className="text-[10px]" style={{ color: '#6b7280' }}>{ev.result}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 데이터 출처 */}
                                <div className="flex items-center justify-between mt-4 p-3 rounded-xl"
                                    style={{ background: '#eff6ff', border: '1px solid #dbeafe' }}>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
                                        <span className="text-[10px]" style={{ color: '#1e40af' }}>
                                            출처: 대법원 사건검색시스템 (safind.scourt.go.kr)
                                        </span>
                                    </div>
                                    <a href="https://safind.scourt.go.kr" target="_blank" rel="noopener noreferrer"
                                        className="text-[10px] flex items-center gap-1 font-bold" style={{ color: '#3b82f6' }}>
                                        원본 보기 <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
