'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, Filter, Mail, Phone, AlertCircle,
    CheckCircle2, Clock, ArrowRight, Building2, BarChart3,
    ChevronDown, Eye, TrendingUp, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { leadStore, Lead, LeadStatus } from '@/lib/leadStore';

const STATUS_META_MAP: Record<string, { label: string; color: string; bg: string }> = {
    pending:          { label: '미분석',      color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
    analyzed:         { label: 'AI 분석완료', color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
    assigned:         { label: '변호사 배정', color: '#c9a84c', bg: 'rgba(201,168,76,0.1)' },
    lawyer_confirmed: { label: '컨펌 완료',   color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
    emailed:          { label: '이메일 발송', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    in_contact:       { label: '연락 중',     color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    contracted:       { label: '계약 완료',   color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
    failed:           { label: '실패',        color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};
const FALLBACK_STATUS = { label: '알 수 없음', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' };
const STATUS_META = new Proxy(STATUS_META_MAP, { get: (t, k) => t[k as string] ?? FALLBACK_STATUS });

const RISK_META_MAP: Record<string, { label: string; color: string; bg: string }> = {
    HIGH:   { label: '고위험', color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
    MEDIUM: { label: '주의',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
    LOW:    { label: '양호',   color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
};
const FALLBACK_RISK = { label: '미분석', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' };
const RISK_META = new Proxy(RISK_META_MAP, { get: (t, k) => t[k as string] ?? FALLBACK_RISK });

export default function SalesLeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
    const [filterRisk, setFilterRisk] = useState<'all' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
    const [expanding, setExpanding] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch('/api/ocr', { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.text) {
                const nameMatch = data.text.match(/상호:\s*(.+)/);
                const bizMatch = data.text.match(/등록번호:\s*([\d-]+)/);
                const ceoMatch = data.text.match(/대표자명:\s*(.+)/);
                
                if (nameMatch && bizMatch) {
                    leadStore.add([{
                        companyName: nameMatch[1],
                        biz: bizMatch[1],
                        domain: '',
                        privacyUrl: '',
                        contactName: ceoMatch ? ceoMatch[1] : '미정',
                        contactEmail: '',
                        contactPhone: '',
                        storeCount: 0,
                        bizType: '기타',
                        riskScore: 0,
                        riskLevel: '',
                        issueCount: 0,
                        status: 'pending',
                        source: 'manual'
                    }]);
                    setLeads(leadStore.getAll());
                    alert('사업자등록증이 성공적으로 등록되어 1건의 리드가 추가되었습니다.');
                } else {
                    alert('사업자등록증에서 상호나 등록번호를 추출할 수 없습니다.');
                }
            }
        } catch (err) {
            console.error(err);
            alert('업로드 처리 실패');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        setLeads(leadStore.getAll());
    }, []);

    const filtered = leads.filter(l => {
        const matchSearch = l.companyName.includes(search) || l.contactEmail.includes(search) || l.contactName.includes(search);
        const matchStatus = filterStatus === 'all' || l.status === filterStatus;
        const matchRisk = filterRisk === 'all' || l.riskLevel === filterRisk;
        return matchSearch && matchStatus && matchRisk;
    });

    const handleStatusChange = (id: string, next: LeadStatus) => {
        leadStore.updateStatus(id, next, '영업팀');
        setLeads(leadStore.getAll());
    };

    return (
        <div className="min-h-screen pb-16" style={{ background: '#04091a', color: '#f0f4ff' }}>
            {/* 상단 헤더 */}
            <div className="sticky top-0 z-40 px-6 py-4"
                style={{ background: 'rgba(4,9,26,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Link href="/sales/dashboard">
                            <button className="text-sm flex items-center gap-1" style={{ color: 'rgba(240,244,255,0.4)' }}>
                                ← 대시보드
                            </button>
                        </Link>
                        <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                        <h1 className="text-lg font-black flex items-center gap-2">
                            <Users className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            리드 목록
                        </h1>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}>
                            {filtered.length}건
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="file" 
                            accept="image/*,application/pdf" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                        />
                        <button 
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold"
                            style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            <Building2 className="w-4 h-4" /> 
                            {isUploading ? '업로드 중...' : '사업자등록증 업로드'}
                        </button>
                        <Link href="/sales/email-history">
                            <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold"
                                style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                                <Mail className="w-4 h-4" /> 발송 이력
                            </button>
                        </Link>
                    </div>
                </div>

                {/* 검색 + 필터 */}
                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(240,244,255,0.3)' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="회사명, 담당자, 이메일 검색..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}
                        />
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as LeadStatus | 'all')}
                        className="px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}>
                        <option value="all">전체 상태</option>
                        {Object.entries(STATUS_META).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                    <select value={filterRisk} onChange={e => setFilterRisk(e.target.value as typeof filterRisk)}
                        className="px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}>
                        <option value="all">전체 위험도</option>
                        <option value="HIGH">고위험</option>
                        <option value="MEDIUM">주의</option>
                        <option value="LOW">양호</option>
                    </select>
                </div>
            </div>

            {/* 리드 목록 */}
            <div className="max-w-6xl mx-auto px-4 pt-5 space-y-3">
                <AnimatePresence>
                    {filtered.map((lead, i) => {
                        const sm = STATUS_META[lead.status as string] ?? FALLBACK_STATUS;
                        const rm = RISK_META[lead.riskLevel as string] ?? FALLBACK_RISK;
                        const isExpanded = expanding === lead.id;
                        return (
                            <motion.div key={lead.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ delay: i * 0.04 }}
                                className="rounded-2xl overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: '#c9a84c' }} />
                                                <span className="font-black text-base" style={{ color: '#f0f4ff' }}>{lead.companyName}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                                    style={{ background: rm.bg, color: rm.color }}>
                                                    {rm.label}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                                    style={{ background: sm.bg, color: sm.color }}>
                                                    {sm.label}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" /> {lead.contactName}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {lead.contactEmail}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <BarChart3 className="w-3 h-3" /> {lead.storeCount.toLocaleString()}개 매장
                                                </span>
                                                {lead.issueCount > 0 && (
                                                    <span className="flex items-center gap-1" style={{ color: '#f87171' }}>
                                                        <AlertCircle className="w-3 h-3" /> {lead.issueCount}건 시정사항
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            {/* 리스크 점수 */}
                                            <div className="text-right">
                                                <div className="text-lg font-black" style={{ color: rm.color }}>{lead.riskScore}</div>
                                                <div className="text-[10px]" style={{ color: 'rgba(240,244,255,0.3)' }}>리스크 점수</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 액션 버튼 */}
                                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                                        {/* 상태 변경 */}
                                        <select
                                            value={lead.status}
                                            onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                                            className="px-3 py-1.5 rounded-lg text-xs outline-none font-bold"
                                            style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.color}40` }}>
                                            {Object.entries(STATUS_META).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>

                                        <Link href={`/admin/email-preview?leadId=${lead.id}`}>
                                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                                                style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}>
                                                <Mail className="w-3.5 h-3.5" /> 이메일 발송
                                            </button>
                                        </Link>

                                        {lead.contactPhone && (
                                            <a href={`tel:${lead.contactPhone}`}>
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                                                    style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
                                                    <Phone className="w-3.5 h-3.5" /> 전화
                                                </button>
                                            </a>
                                        )}

                                        <Link href={`/privacy-report?company=${encodeURIComponent(lead.companyName)}`}>
                                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                                                style={{ background: 'rgba(129,140,248,0.08)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.2)' }}>
                                                <Eye className="w-3.5 h-3.5" /> 분석 보고서
                                            </button>
                                        </Link>

                                        <button
                                            onClick={() => setExpanding(isExpanded ? null : lead.id)}
                                            className="ml-auto flex items-center gap-1 text-xs font-bold"
                                            style={{ color: 'rgba(240,244,255,0.4)' }}>
                                            타임라인
                                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* 타임라인 확장 */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div className="px-5 py-4 space-y-5">
                                                {/* 개인정보처리방침 URL 관리 */}
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                                        개인정보처리방침 URL 관리
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            defaultValue={lead.privacyUrl}
                                                            placeholder="https://example.com/privacy"
                                                            onBlur={(e) => {
                                                                if (e.target.value !== lead.privacyUrl) {
                                                                    leadStore.update(lead.id, { privacyUrl: e.target.value });
                                                                    setLeads(leadStore.getAll());
                                                                }
                                                            }}
                                                            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}
                                                        />
                                                        {lead.privacyUrl && (
                                                            <a href={lead.privacyUrl} target="_blank" rel="noreferrer">
                                                                <button className="px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-all hover:scale-[1.02]"
                                                                    style={{ background: 'rgba(255,255,255,0.08)', color: '#f0f4ff', height: '100%' }}>
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </button>
                                                            </a>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] mt-1.5" style={{ color: 'rgba(240,244,255,0.4)' }}>수정 후 다른 곳을 클릭하면 자동 저장됩니다.</p>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                                        활동 타임라인
                                                    </p>
                                                    {[...lead.timeline].reverse().slice(0, 5).map((event) => (
                                                        <div key={event.id} className="flex items-start gap-2.5">
                                                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#c9a84c' }} />
                                                            <div>
                                                                <span className="text-xs font-bold" style={{ color: '#f0f4ff' }}>{event.content}</span>
                                                                <span className="text-[10px] ml-2" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                                                    {new Date(event.createdAt).toLocaleDateString('ko-KR')} · {event.author}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {lead.timeline.length === 0 && (
                                                        <p className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>활동 내역 없음</p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div className="text-center py-20">
                        <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(240,244,255,0.15)' }} />
                        <p className="font-bold" style={{ color: 'rgba(240,244,255,0.4)' }}>검색 결과가 없습니다</p>
                    </div>
                )}
            </div>
        </div>
    );
}
