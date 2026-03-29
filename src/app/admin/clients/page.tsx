'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Search, CheckCircle2,
    Phone, Mail, BarChart3, Gavel, ChevronDown, ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { DocumentWidget } from '@/components/DocumentWidget';
import type { Company } from '@/lib/types';
import { useCompanies } from '@/hooks/useDataLayer';

const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
    premium:  { label: 'Premium',  color: '#c9a84c', bg: 'rgba(201,168,76,0.1)' },
    standard: { label: 'Standard', color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
    starter:  { label: 'Starter',  color: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
    none:     { label: '미구독',   color: '#94a3b8', bg: 'rgba(148,163,184,0.06)' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
    active:    { label: '활성',     color: '#4ade80' },
    pending:   { label: '검토 중',  color: '#fb923c' },
    suspended: { label: '정지',     color: '#f87171' },
    trial:     { label: '트라이얼', color: '#818cf8' },
};

export default function AdminClientsPage() {
    const { companies, updateCompany } = useCompanies();
    const clients = companies.filter(c => c.plan && c.plan !== 'none');
    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'stores' | 'plan'>('name');
    const [sortAsc, setSortAsc] = useState(true);
    const [expandId, setExpandId] = useState<string | null>(null);

    const filtered = clients
        .filter(c => {
            const q = search.toLowerCase();
            const matchSearch = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
            const matchPlan = filterPlan === 'all' || c.plan === filterPlan;
            return matchSearch && matchPlan;
        })
        .sort((a, b) => {
            let r = 0;
            if (sortBy === 'name') r = a.name.localeCompare(b.name);
            else if (sortBy === 'stores') r = (a.storeCount || 0) - (b.storeCount || 0);
            else if (sortBy === 'plan') r = (a.plan || '').localeCompare(b.plan || '');
            return sortAsc ? r : -r;
        });

    const toggleSort = (col: typeof sortBy) => {
        if (sortBy === col) setSortAsc(v => !v);
        else { setSortBy(col); setSortAsc(true); }
    };

    return (
        <div className="min-h-screen pb-16" style={{ background: '#04091a', color: '#f0f4ff' }}>
            {/* 헤더 */}
            <div className="sticky top-0 z-40 px-6 py-4 space-y-3"
                style={{ background: 'rgba(4,9,26,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center gap-3">
                    <h1 className="font-black text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5" style={{ color: '#c9a84c' }} />
                        구독 고객 목록
                    </h1>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}>
                        {filtered.length}개사
                    </span>
                </div>

                {/* 검색 + 필터 */}
                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(240,244,255,0.3)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="기업명, 이메일 검색..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }} />
                    </div>
                    <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
                        className="px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}>
                        <option value="all">전체 플랜</option>
                        <option value="premium">Premium</option>
                        <option value="standard">Standard</option>
                        <option value="starter">Starter</option>
                    </select>
                </div>

                {/* 정렬 헤더 */}
                <div className="hidden md:grid grid-cols-12 text-[10px] font-black uppercase tracking-widest px-1"
                    style={{ color: 'rgba(240,244,255,0.3)' }}>
                    <button className="col-span-4 flex items-center gap-1 text-left" onClick={() => toggleSort('name')}>
                        기업명 {sortBy === 'name' ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
                    </button>
                    <button className="col-span-2 flex items-center gap-1" onClick={() => toggleSort('plan')}>
                        플랜 {sortBy === 'plan' ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
                    </button>
                    <button className="col-span-2 flex items-center gap-1" onClick={() => toggleSort('stores')}>
                        매장수 {sortBy === 'stores' ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
                    </button>
                    <div className="col-span-2">담당 변호사</div>
                    <div className="col-span-2">연락처</div>
                </div>
            </div>

            {/* 클라이언트 목록 */}
            <div className="max-w-6xl mx-auto px-4 pt-4 space-y-2">
                <AnimatePresence>
                    {filtered.map((c, i) => {
                        const pm = PLAN_META[c.plan || 'none'] || PLAN_META.none;
                        const sm = STATUS_META[c.status] || { label: c.status, color: '#94a3b8' };
                        const isExpanded = expandId === c.id;
                        return (
                            <motion.div key={c.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ delay: i * 0.03 }}
                                className="rounded-2xl overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="p-4">
                                    {/* PC 그리드 */}
                                    <div className="hidden md:grid grid-cols-12 items-center gap-3">
                                        {/* 기업명 */}
                                        <div className="col-span-4 flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${pm.color}12` }}>
                                                <Building2 className="w-4 h-4" style={{ color: pm.color }} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-black text-sm truncate" style={{ color: '#f0f4ff' }}>{c.name}</div>
                                                <div className="text-[10px] truncate" style={{ color: 'rgba(240,244,255,0.4)' }}>{c.email}</div>
                                            </div>
                                        </div>
                                        {/* 플랜 */}
                                        <div className="col-span-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                                style={{ background: pm.bg, color: pm.color }}>{pm.label}</span>
                                        </div>
                                        {/* 매장수 */}
                                        <div className="col-span-2 text-sm font-bold" style={{ color: '#f0f4ff' }}>
                                            {(c.storeCount || 0).toLocaleString()}개
                                        </div>
                                        {/* 변호사 */}
                                        <div className="col-span-2 text-xs" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                            <span className="flex items-center gap-1">
                                                <Gavel className="w-3 h-3" />
                                                {c.assignedLawyer || '미배정'}
                                            </span>
                                        </div>
                                        {/* 연락처 */}
                                        <div className="col-span-2 flex items-center gap-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                                style={{ background: sm.color + '18', color: sm.color }}>
                                                {sm.label}
                                            </span>
                                            <button onClick={() => setExpandId(isExpanded ? null : c.id)}
                                                className="ml-auto text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 모바일 */}
                                    <div className="md:hidden">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="font-black text-sm" style={{ color: '#f0f4ff' }}>{c.name}</div>
                                                <div className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.4)' }}>{c.email}</div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                                    style={{ background: pm.bg, color: pm.color }}>{pm.label}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                            <span>{(c.storeCount || 0).toLocaleString()}개 매장</span>
                                            <span>·</span>
                                            <span>{c.assignedLawyer || '변호사 미배정'}</span>
                                        </div>
                                        <button onClick={() => setExpandId(isExpanded ? null : c.id)}
                                            className="mt-3 w-full text-xs font-bold py-1.5 rounded-lg"
                                            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,244,255,0.4)' }}>
                                            {isExpanded ? '접기' : '상세 보기'}
                                        </button>
                                    </div>
                                </div>

                                {/* 확장 상세 */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div className="px-5 py-4">
                                                <div className="grid md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                                                            style={{ color: 'rgba(240,244,255,0.3)' }}>연락처 및 방침</p>
                                                        <div className="space-y-3">
                                                            {c.phone && (
                                                                <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-xs"
                                                                    style={{ color: '#4ade80' }}>
                                                                    <Phone className="w-3.5 h-3.5" /> {c.phone}
                                                                </a>
                                                            )}
                                                            <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs"
                                                                style={{ color: '#3b82f6' }}>
                                                                <Mail className="w-3.5 h-3.5" /> {c.email}
                                                            </a>
                                                            <div>
                                                                <p className="text-[10px] font-black" style={{ color: 'rgba(240,244,255,0.3)', marginBottom: '4px' }}>개인정보처리방침 URL</p>
                                                                <div className="flex items-center gap-1.5">
                                                                    <input 
                                                                        type="text" 
                                                                        defaultValue={c.privacyUrl || ''}
                                                                        placeholder="https://example.com/privacy"
                                                                        onBlur={(e) => {
                                                                            if (e.target.value !== (c.privacyUrl || '')) {
                                                                                updateCompany(c.id, { privacyUrl: e.target.value });
                                                                            }
                                                                        }}
                                                                        className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
                                                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}
                                                                    />
                                                                    {c.privacyUrl && (
                                                                        <a href={c.privacyUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg transition-all hover:scale-105"
                                                                            style={{ background: 'rgba(255,255,255,0.08)', color: '#f0f4ff' }}>
                                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black" style={{ color: 'rgba(240,244,255,0.3)', marginBottom: '4px' }}>개인정보처리방침 원문</p>
                                                                <textarea
                                                                    defaultValue={c.privacyPolicyText || ''}
                                                                    placeholder="개인정보처리방침 전체 내용을 여기에 붙여넣기 하세요..."
                                                                    onBlur={(e) => {
                                                                        if (e.target.value !== (c.privacyPolicyText || '')) {
                                                                            updateCompany(c.id, { privacyPolicyText: e.target.value });
                                                                        }
                                                                    }}
                                                                    rows={6}
                                                                    className="w-full px-2.5 py-2 rounded-lg text-xs outline-none resize-y"
                                                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', minHeight: '100px' }}
                                                                />
                                                                <p className="text-[9px] mt-1" style={{ color: 'rgba(240,244,255,0.25)' }}>수정 후 다른 곳을 클릭하면 자동 저장됩니다.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                                                            style={{ color: 'rgba(240,244,255,0.3)' }}>구독 정보</p>
                                                        <div className="space-y-1 text-xs" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                                            <div>플랜: <span className="font-bold" style={{ color: pm.color }}>{pm.label}</span></div>
                                                            <div>리스크: <span style={{ color: c.riskLevel === 'HIGH' ? '#f87171' : c.riskLevel === 'MEDIUM' ? '#fb923c' : '#4ade80' }}>{c.riskLevel || '분석 필요'}</span></div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                                                            style={{ color: 'rgba(240,244,255,0.3)' }}>빠른 실행</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Link href={`/admin/email-preview?company=${encodeURIComponent(c.name)}`}>
                                                                <button className="px-3 py-1.5 rounded-lg text-xs font-bold"
                                                                    style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c' }}>
                                                                    이메일 발송
                                                                </button>
                                                            </Link>
                                                            <Link href="/contracts">
                                                                <button className="px-3 py-1.5 rounded-lg text-xs font-bold"
                                                                    style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80' }}>
                                                                    계약서 보기
                                                                </button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Document Widget */}
                                                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <p className="text-[10px] font-black uppercase tracking-widest mb-3"
                                                        style={{ color: 'rgba(240,244,255,0.3)' }}>문서함 관리</p>
                                                    <div className="h-[350px]">
                                                        <DocumentWidget companyId={c.id} currentUserRole="admin" />
                                                    </div>
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
                    <div className="text-center py-16">
                        <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(240,244,255,0.1)' }} />
                        <p className="font-bold" style={{ color: 'rgba(240,244,255,0.4)' }}>
                            {search ? '검색 결과가 없습니다' : '구독 중인 고객사가 없습니다'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
