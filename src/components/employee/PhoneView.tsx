import React from 'react';
import { motion } from 'framer-motion';
import { Phone, CheckCircle2, Mail, FileText, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Company, CaseStatus, AutoSettings } from '@/lib/types';
import { useCompanies } from '@/hooks/useDataLayer';
import { T, StatusBadge } from './shared';
import { RiskBadge } from '@/components/crm/SlidePanel';

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
                    <div>
                        <h2 className="font-black text-lg" style={{ color: T.heading }}>{c.name}</h2>
                        <p className="text-xs" style={{ color: T.muted }}>{c.bizType || c.biz} · 가맹점 {c.storeCount}개</p>
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
                        <p className="text-xs font-black mb-2" style={{ color: '#b8960a' }}>📞 연락처</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span style={{ color: T.muted }}>담당자:</span> <strong style={{ color: T.body }}>{c.contactName || '-'}</strong></div>
                            <div><span style={{ color: T.muted }}>전화:</span> <a href={`tel:${c.contactPhone || c.phone}`} className="font-bold underline" style={{ color: '#2563eb' }}>{c.contactPhone || c.phone}</a></div>
                            <div><span style={{ color: T.muted }}>이메일:</span> <strong style={{ color: T.body }}>{c.contactEmail || c.email}</strong></div>
                            <div><span style={{ color: T.muted }}>홈페이지:</span> <strong style={{ color: T.body }}>{c.domain || c.url}</strong></div>
                        </div>
                    </div>

                    {/* 핵심 이슈 */}
                    <div className="rounded-xl p-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                        <p className="text-xs font-black mb-2" style={{ color: '#dc2626' }}>⚠️ 핵심 이슈 ({c.issues?.length || c.issueCount || 0}건)</p>
                        <div className="space-y-1.5">
                            {(c.issues || []).slice(0, 4).map((iss, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                        style={{ background: iss.level === 'HIGH' ? '#fecaca' : '#fef3c7', color: iss.level === 'HIGH' ? '#dc2626' : '#d97706' }}>
                                        {iss.level}
                                    </span>
                                    <span style={{ color: T.body }}>{iss.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 통화 메모 */}
                    <div>
                        <p className="text-xs font-black mb-1.5" style={{ color: T.sub }}>📝 통화 메모</p>
                        <textarea
                            defaultValue={c.callNote}
                            onBlur={(e) => { updateCompany(c.id, { callNote: e.target.value }); refresh(); }}
                            rows={3} placeholder="통화 결과를 메모하세요..."
                            className="w-full rounded-xl text-sm p-3"
                            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none', resize: 'none' }} />
                    </div>
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
                                salesConfirmedAt: new Date().toISOString(),
                                callNote: c.callNote || '전화 완료'
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
