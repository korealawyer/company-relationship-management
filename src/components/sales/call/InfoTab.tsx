// @ts-nocheck
'use client';
import React from 'react';
import Link from 'next/link';
import { Mail, FileText, CheckCircle2, ExternalLink } from 'lucide-react';
import { Company, type CaseStatus } from '@/lib/types';
import { useCompanies } from '@/hooks/useDataLayer';

/* ── CRM 라이트 색상 (공유 상수 추출 전 임시 로컬 복사) ─────── */
const C = {
    surface: '#ffffff',
    border: '#d1d5db',
    borderLight: '#e5e7eb',
    heading: '#0f172a',
    body: '#1e293b',
    sub: '#475569',
    faint: '#94a3b8',
};

/* ── Props ───────────────────────────────────────────────── */
export interface InfoTabProps {
    co: Company;
    onRefresh: () => void;
    setToast: (s: string) => void;
}

/* ── Component ───────────────────────────────────────────── */
export default function InfoTab({ co, onRefresh, setToast }: InfoTabProps) {
    const { updateCompany } = useCompanies();
    return (
        <div className="grid grid-cols-4 gap-3">
            {/* ── 기업 정보 ── */}
            <div className="col-span-2 space-y-2">
                <p className="text-[11px] font-black" style={{ color: C.heading }}>📋 기업 정보</p>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { l: '기업명', v: co.name },
                        { l: '사업자', v: co.biz },
                        { l: '대표', v: (co as any).ceo || '—' },
                        { l: '담당자', v: co.contactName || '미등록' },
                        { l: '이메일', v: co.contactEmail || co.email },
                        { l: '전화', v: co.contactPhone || co.phone },
                        { l: '매장수', v: `${co.storeCount}개` },
                        { l: '업종', v: co.bizType || '—' },
                        { l: '변호사', v: co.assignedLawyer || '미배정' },
                    ].map((i) => (
                        <div
                            key={i.l}
                            className="px-2.5 py-2 rounded-lg"
                            style={{ background: C.surface, border: `1px solid ${C.borderLight}` }}
                        >
                            <div className="text-[8px] font-bold" style={{ color: C.faint }}>{i.l}</div>
                            <div className="text-[11px] font-medium truncate" style={{ color: C.body }}>{i.v}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 이슈 목록 ── */}
            <div className="space-y-2">
                <p className="text-[11px] font-black" style={{ color: C.heading }}>
                    ⚠️ 이슈 ({co.issues?.length || 0}건)
                </p>
                <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 220 }}>
                    {(co.issues || []).map((iss, j) => (
                        <div
                            key={j}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] flex items-start gap-1.5"
                            style={{
                                background: iss.level === 'HIGH' ? '#fef2f2' : '#fffbeb',
                                border: `1px solid ${iss.level === 'HIGH' ? '#fca5a5' : '#fde68a'}`,
                            }}
                        >
                            <span
                                className="text-[8px] px-1 rounded font-bold mt-0.5"
                                style={{
                                    background: iss.level === 'HIGH' ? '#dc2626' : '#d97706',
                                    color: '#fff',
                                }}
                            >
                                {iss.level}
                            </span>
                            <span style={{ color: C.body }}>{iss.title}</span>
                        </div>
                    ))}
                    {(!co.issues || co.issues.length === 0) && (
                        <p className="text-[10px]" style={{ color: C.faint }}>이슈 없음</p>
                    )}
                </div>
            </div>

            {/* ── 빠른 액션 ── */}
            <div className="space-y-2">
                <p className="text-[11px] font-black" style={{ color: C.heading }}>⚡ 빠른 액션</p>
                <div className="space-y-1.5">
                    {co.status === 'lawyer_confirmed' && (
                        <button
                            onClick={() => { updateCompany(co.id, { status: 'emailed' }); onRefresh(); setToast('✉️ 이메일 발송'); }}
                            className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold"
                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd' }}
                        >
                            <Mail className="w-3 h-3" />이메일 발송
                        </button>
                    )}
                    {(co.status === 'client_replied' || co.status === 'client_viewed') && (
                        <button
                            onClick={() => { updateCompany(co.id, { status: 'contract_sent' }); onRefresh(); setToast('📄 계약서 발송'); }}
                            className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold"
                            style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}
                        >
                            <FileText className="w-3 h-3" />계약서 발송
                        </button>
                    )}
                    {co.status === 'contract_sent' && (
                        <button
                            onClick={() => { updateCompany(co.id, { status: 'contract_signed' }); onRefresh(); setToast('✅ 서명 확인'); }}
                            className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold"
                            style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                        >
                            <CheckCircle2 className="w-3 h-3" />서명 확인
                        </button>
                    )}
                    <Link href={`/privacy-report?company=${encodeURIComponent(co.name)}`} target="_blank">
                        <button
                            className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold"
                            style={{ background: C.surface, color: C.sub, border: `1px solid ${C.border}` }}
                        >
                            <ExternalLink className="w-3 h-3" />진단 보고서
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
