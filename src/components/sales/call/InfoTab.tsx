// @ts-nocheck
'use client';
import React from 'react';
import Link from 'next/link';
import { Mail, FileText, CheckCircle2, ExternalLink } from 'lucide-react';
import { Company, type CaseStatus } from '@/lib/types';
import { useCompanies } from '@/hooks/useDataLayer';
import { useAuth } from '@/lib/AuthContext';
import { STATUS_LABEL } from '@/lib/constants';

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

import EditableField from '@/components/crm/EditableField';

/* ── Props ───────────────────────────────────────────────── */
export interface InfoTabProps {
    co: Company;
    onRefresh: () => void;
    setToast: (s: string) => void;
}

/* ── Component ───────────────────────────────────────────── */
export default function InfoTab({ co, onRefresh, setToast }: InfoTabProps) {
    const { updateCompany } = useCompanies();
    const { user } = useAuth();
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

    return (
        <div className="grid grid-cols-4 gap-3">
            {/* ── 기업 정보 ── */}
            <div className="col-span-2 space-y-2">
                <p className="text-[11px] font-black" style={{ color: C.heading }}>📋 기업 정보 (클릭하여 수정)</p>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { l: '기업명', v: co.name || '', field: isAdmin ? 'name' : undefined, placeholder: '기업명' },
                        { l: '사업자', v: co.biz || '', field: isAdmin ? 'biz' : undefined, placeholder: '사업자번호' },
                        { l: '대표', v: (co as any).ceo || '', field: isAdmin ? 'ceo' : undefined, placeholder: '대표명' },
                        { l: '담당자', v: co.contactName || '', field: 'contactName', placeholder: '이름 입력' },
                        { l: '이메일', v: co.contactEmail || co.email || '', field: 'contactEmail', placeholder: '이메일 입력' },
                        { l: '전화', v: co.contactPhone || co.phone || '', field: 'contactPhone', placeholder: '전화번호 입력' },
                        { l: '홈페이지', v: co.domain || co.url || '', field: 'domain', placeholder: '홈페이지 주소' },
                        { l: '매장수', v: String(co.storeCount || 0), field: isAdmin ? 'storeCount' : undefined, placeholder: '매장수', isNumber: true },
                        { l: '업종', v: co.bizType || '', field: isAdmin ? 'bizType' : undefined, placeholder: '업종명' },
                        { l: '변호사', v: co.assignedLawyer || '', field: isAdmin ? 'assignedLawyer' : undefined, placeholder: '미배정' },
                    ].map((i) => (
                        <div
                            key={i.l}
                            className="px-2.5 py-2 rounded-lg"
                            style={{ background: C.surface, border: `1px solid ${C.borderLight}` }}
                        >
                            <div className="text-[8px] font-bold" style={{ color: C.faint }}>{i.l}</div>
                            <div className="text-[11px] font-medium truncate" style={{ color: i.field ? '#2563eb' : C.body }}>
                                {i.field ? (
                                    <EditableField 
                                        value={i.v as string} 
                                        onChange={v => {
                                            const finalV = i.isNumber ? (parseInt(v, 10) || 0) : v;
                                            updateCompany(co.id, { [i.field as string]: finalV });
                                        }}
                                        placeholder={i.placeholder}
                                    />
                                ) : (
                                    i.v || '—'
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 이슈 목록 ── */}
            <div className="space-y-2 flex flex-col">
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

                {/* ── 어드민: 상태값 강제 변경 ── */}
                {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-black" style={{ color: '#dc2626' }}>🔧 상태 강제 변경 (Admin)</p>
                        <select
                            value={co.status}
                            onChange={(e) => {
                                updateCompany(co.id, { status: e.target.value as CaseStatus });
                                onRefresh();
                                setToast('슈퍼 관리자 권한으로 상태가 변경되었습니다.');
                            }}
                            className="w-full text-[11px] px-2 py-1.5 rounded-lg border outline-none font-bold"
                            style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}
                        >
                            {Object.entries(STATUS_LABEL).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                )}
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
