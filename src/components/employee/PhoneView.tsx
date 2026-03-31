import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, CheckCircle2, Mail, FileText, Star, Activity, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Company, CaseStatus, AutoSettings } from '@/lib/types';
import { useCompanies } from '@/hooks/useDataLayer';
import { useAuth } from '@/lib/AuthContext';
import { STATUS_LABEL } from '@/lib/constants';
import { T, StatusBadge } from './shared';
import { RiskBadge } from '@/components/crm/SlidePanel';
import MemoTab from '@/components/sales/call/MemoTab';

import EditableField from '@/components/crm/EditableField';

interface PhoneViewProps {
    filtered: Company[];
    phoneIdx: number;
    setPhoneIdx: React.Dispatch<React.SetStateAction<number>>;
    autoSettings: AutoSettings;
    refresh: () => void;
    showToast: (msg: string) => void;
    setContractModal: (c: Company) => void;
}

export default function PhoneView({
    filtered, phoneIdx, setPhoneIdx,
    autoSettings, refresh, showToast, setContractModal
}: PhoneViewProps) {
    const { updateCompany } = useCompanies();
    const { user } = useAuth();
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

    if (filtered.length === 0) {
        return <div className="text-center py-12 text-sm" style={{ color: T.muted }}>표시할 기업이 없습니다.</div>;
    }

    const c = filtered[phoneIdx % filtered.length] || filtered[0];
    const callableStatuses: CaseStatus[] = ['analyzed', 'lawyer_confirmed', 'emailed', 'client_replied', 'client_viewed'];
    const defaultScript = `안녕하세요, ${c.contactName || c.name} 담당자님.\nIBS 법률사무소 영업팀 ${autoSettings.updatedBy || '담당자'}입니다.\n\n귀사 홈페이지의 개인정보처리방침을 AI로 분석한 결과,\n${c.riskLevel === 'HIGH' ? '고위험' : c.riskLevel === 'MEDIUM' ? '중위험' : '저위험'} 수준의 법적 문제가 ${c.issueCount || c.issues?.length || 0}건 발견되었습니다.\n\n특히 개인정보보호법 위반 시 최대 과징금 3,000만원이 부과될 수 있어\n사전 검토가 필요한 상황입니다.\n\n무료 분석 결과를 이메일로 보내드릴 수 있는데,\n확인해보시겠습니까?`;
    const script = c.customScript?.call || defaultScript;

    return (
        <motion.div key={c.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: T.card, border: `2px solid #93c5fd`, boxShadow: '0 4px 24px rgba(37,99,235,0.12)' }}>
            {/* 상단 바 */}
            <div className="flex items-center justify-between px-6 py-4"
                style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" style={{ color: '#2563eb' }} />
                    <div className="min-w-0">
                        <h2 className="font-black text-lg flex" style={{ color: T.heading }}>
                            {isAdmin ? <EditableField value={c.name} onChange={v => updateCompany(c.id, { name: v })} placeholder="기업명" /> : c.name}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: T.muted }}>
                            {isAdmin ? <EditableField value={c.bizType || ''} onChange={v => updateCompany(c.id, { bizType: v })} placeholder="업종" /> : c.bizType || ''}
                            <span style={{ color: 'rgba(0,0,0,0.2)' }}>|</span>
                            {isAdmin ? <EditableField value={c.biz || ''} onChange={v => updateCompany(c.id, { biz: v })} placeholder="사업자번호" /> : c.biz || ''}
                            <span style={{ color: 'rgba(0,0,0,0.2)' }}>|</span>
                            <span>가맹점</span>
                            {isAdmin ? <EditableField value={String(c.storeCount || 0)} onChange={v => updateCompany(c.id, { storeCount: parseInt(v, 10) || 0 })} placeholder="매장수" /> : c.storeCount}
                            <span>개</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <StatusBadge status={c.status} />
                    <RiskBadge level={c.riskLevel} />
                    <span className="text-xs font-bold" style={{ color: T.muted }}>
                        {(phoneIdx % filtered.length) + 1} / {filtered.length}
                    </span>
                </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-6">
                {/* 왼쪽: 통화 스크립트 */}
                <div>
                    <p className="text-xs font-black mb-2 flex items-center gap-1.5" style={{ color: '#2563eb' }}>
                        📋 통화 스크립트
                    </p>
                    <div className="rounded-xl p-4 text-sm whitespace-pre-line leading-relaxed"
                        style={{ background: '#f8fafc', border: `1px solid ${T.border}`, color: T.body, minHeight: 200 }}>
                        {script}
                    </div>
                </div>

                {/* 오른쪽: 핵심 이슈 + 연락처 + 메모 */}
                <div className="space-y-4">
                    {/* 연락처 */}
                    <div className="rounded-xl p-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                        <p className="text-xs font-black mb-2 flex justify-between" style={{ color: '#b8960a' }}>
                            <span>📞 연락처 (클릭하여 텍스트 수정)</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-1.5"><span style={{ color: T.muted, width: 44 }}>담당자:</span> <strong style={{ color: T.body, flex: 1, minWidth:0 }}><EditableField value={c.contactName || ''} onChange={v => updateCompany(c.id, { contactName: v })} placeholder="이름 입력" /></strong></div>
                            <div className="flex items-center gap-1.5"><span style={{ color: T.muted, width: 44 }}>전화:</span> <strong style={{ color: '#2563eb', flex: 1, minWidth:0 }}><EditableField value={c.contactPhone || c.phone || ''} onChange={v => updateCompany(c.id, { contactPhone: v })} placeholder="전화번호 입력" /></strong></div>
                            <div className="flex items-center gap-1.5"><span style={{ color: T.muted, width: 44 }}>이메일:</span> <strong style={{ color: T.body, flex: 1, minWidth:0 }}><EditableField value={c.contactEmail || c.email || ''} onChange={v => updateCompany(c.id, { contactEmail: v })} placeholder="이메일 입력" /></strong></div>
                            <div className="flex items-center gap-1.5"><span style={{ color: T.muted, width: 44 }}>웹:</span> <strong style={{ color: T.body, flex: 1, minWidth:0 }}><EditableField value={c.domain || c.url || ''} onChange={v => updateCompany(c.id, { domain: v })} placeholder="홈페이지 주소" /></strong></div>
                        </div>
                    </div>

                    {/* 핵심 이슈 */}
                    <div className="rounded-xl p-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                        <p className="text-xs font-black mb-2" style={{ color: '#dc2626' }}>⚠️ 핵심 이슈 ({c.issues?.length || c.issueCount || 0}건)</p>
                        <div className="space-y-1.5">
                            {(c.issues || []).slice(0, 4).map((iss, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"
                                        style={{ background: iss.level === 'HIGH' ? '#fecaca' : '#fef3c7', color: iss.level === 'HIGH' ? '#dc2626' : '#d97706' }}>
                                        {iss.level === 'HIGH' ? '고위험' : iss.level === 'MEDIUM' ? '주의' : iss.level}
                                    </span>
                                    <span style={{ color: T.body }} className="truncate">{iss.title}</span>
                                </div>
                            ))}
                            {(!c.issues || c.issues.length === 0) && (
                                <span className="text-xs text-gray-400">발견된 주요 이슈가 없습니다.</span>
                            )}
                        </div>
                    </div>

                    {/* 통합 통화 메모 및 AI 분석 (MemoTab) */}
                    <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: `1px solid ${T.border}` }}>
                        <p className="text-xs font-black mb-2 flex items-center gap-1.5" style={{ color: T.sub }}>
                            <MessageSquare className="w-3.5 h-3.5" /> 통화 메모 & AI 분석 저장
                        </p>
                        <MemoTab co={c} onRefresh={refresh} setToast={showToast} />
                    </div>

                    {/* 과거 이력 (타임라인 / 이전 메모) */}
                    {((c.timeline && c.timeline.length > 0) || (c.memos && c.memos.length > 0)) && (
                        <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm mt-4">
                            <p className="text-xs font-black mb-3 flex items-center gap-1.5" style={{ color: T.sub }}>
                                <Activity className="w-3.5 h-3.5 text-blue-500" /> 🔄 최근 기록 (통화/메세지/메모 등)
                            </p>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                {[...(c.timeline || []).map(t => ({...t, _k: 't'})), ...(c.memos || []).map(m => ({...m, _k: 'm'}))]
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                    .slice(0, 8)
                                    .map(env => (
                                        <div key={env.id} className="text-xs pb-3 border-b last:border-0 border-slate-100">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold flex items-center gap-1 text-[10.5px]" style={{ color: env._k === 't' ? '#6366f1' : '#10b981' }}>
                                                    {env._k === 't' ? <Activity className="w-3 h-3"/> : <MessageSquare className="w-3 h-3"/>}
                                                    {env.author || '시스템'}
                                                </span>
                                                <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                                                    {new Date(env.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p style={{ color: T.sub, lineHeight: 1.4 }} className="whitespace-pre-wrap">{env.content}</p>
                                        </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 어드민 상태 강제 변경 */}
                    {(user?.role === 'super_admin' || user?.role === 'admin') && (
                        <div className="rounded-xl p-4" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
                            <p className="text-xs font-black mb-2" style={{ color: '#dc2626' }}>🔧 상태 강제 변경 (Admin)</p>
                            <select
                                value={c.status}
                                onChange={(e) => {
                                    updateCompany(c.id, { status: e.target.value as CaseStatus });
                                    refresh();
                                    showToast('슈퍼 관리자 권한으로 상태가 변경되었습니다.');
                                }}
                                className="w-full text-xs px-3 py-2 rounded-lg border outline-none font-bold bg-white"
                                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            >
                                {Object.entries(STATUS_LABEL).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* 하단 액션 바 */}
            <div className="flex items-center justify-between px-6 py-4" style={{ background: '#f8f9fc', borderTop: `1px solid ${T.border}` }}>
                <div className="flex gap-2">
                    <button onClick={() => setPhoneIdx(p => Math.max(0, p - 1))}
                        className="px-4 py-2 rounded-lg text-xs font-bold"
                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body }}>
                        ← 이전
                    </button>
                    <button onClick={() => setPhoneIdx(p => p + 1)}
                        className="px-4 py-2 rounded-lg text-xs font-bold"
                        style={{ background: '#2563eb', color: '#fff' }}>
                        다음 →
                    </button>
                </div>
                <div className="flex gap-2">
                    {callableStatuses.includes(c.status) && c.status !== 'emailed' && (
                        <Button variant="outline" size="sm" onClick={() => {
                            updateCompany(c.id, { 
                                salesConfirmed: true, 
                                salesConfirmedBy: autoSettings.updatedBy || '영업팀',
                                salesConfirmedAt: new Date().toISOString()
                            });
                            // AI 분석을 아직 수행하지 않은 경우, 통화 완료 시 Timeline(히스토리) 노드를 강제로 하나 생성하여 남깁니다.
                            updateCompany(c.id, {
                                timeline: [...(c.timeline || []), { id: crypto.randomUUID(), createdAt: new Date().toISOString(), author: autoSettings.updatedBy || '영업팀', type: 'call', content: '통화 완료 (AI분석 미진행)' }] 
                            });
                            refresh();
                            const nextIdx = phoneIdx + 1;
                            if (nextIdx < filtered.length) {
                                showToast(`✅ ${c.name} 통화 완료 → 다음 기업으로 이동`);
                                setTimeout(() => setPhoneIdx(nextIdx), 800);
                            } else {
                                showToast(`✅ ${c.name} 통화 완료 — 마지막 기업입니다`);
                            }
                        }}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 통화 완료
                        </Button>
                    )}
                    {c.status === 'lawyer_confirmed' && (
                        <a href={`/admin/email-preview?leadId=${c.id}`}>
                            <Button variant="premium" size="sm">
                                <Mail className="w-3.5 h-3.5 mr-1" /> 이메일 미리보기
                            </Button>
                        </a>
                    )}
                    {(c.status === 'client_replied' || c.status === 'client_viewed') && (
                        <Button variant="premium" size="sm" onClick={() => setContractModal(c)}>
                            <FileText className="w-3.5 h-3.5 mr-1" /> 계약서 발송
                        </Button>
                    )}
                    {c.status === 'contract_sent' && (
                        <Button variant="outline" size="sm" onClick={() => { updateCompany(c.id, { status: 'contract_signed' }); refresh(); }}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 서명 확인
                        </Button>
                    )}
                    {c.status === 'contract_signed' && (
                        <Button variant="premium" size="sm" onClick={() => { updateCompany(c.id, { plan: 'standard' }); refresh(); }}>
                            <Star className="w-3.5 h-3.5 mr-1" /> 구독 확정 + 이관
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
