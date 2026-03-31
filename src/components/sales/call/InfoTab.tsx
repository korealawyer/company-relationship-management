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
        <div className="flex flex-col gap-3">
            {/* ── 기업 정보 ── */}
            <div className="space-y-2">
                <p className="text-[11px] font-black" style={{ color: C.heading }}>📋 기업 정보 (클릭하여 수정)</p>
                <div className="grid grid-cols-4 gap-2">
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

                {/* ── 어드민: 상태값 강제 변경 ── */}
                {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-red-100 justify-end">
                        <p className="text-[11px] font-black" style={{ color: '#dc2626' }}>🔧 상태 강제 변경 (Admin)</p>
                        <select
                            value={co.status}
                            onChange={(e) => {
                                updateCompany(co.id, { status: e.target.value as CaseStatus });
                                onRefresh();
                                setToast('슈퍼 관리자 권한으로 상태가 변경되었습니다.');
                            }}
                            className="text-[11px] px-2 py-1.5 rounded-lg border outline-none font-bold min-w-[120px]"
                            style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}
                        >
                            {Object.entries(STATUS_LABEL).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}
