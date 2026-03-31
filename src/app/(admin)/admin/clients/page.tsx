'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Search, CheckCircle2,
    Phone, Mail, BarChart3, Gavel, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { DocumentWidget } from '@/components/DocumentWidget';
import type { Company } from '@/lib/types';
import { useCompanies } from '@/hooks/useDataLayer';
import { AdminCompanyEditModal } from '@/components/admin/AdminCompanyEditModal';

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
    const { companies, updateCompany, deleteCompany } = useCompanies();
    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState<string>('all_clients');
    const [sortBy, setSortBy] = useState<'name' | 'stores' | 'plan'>('name');
    const [sortAsc, setSortAsc] = useState(true);
    const [expandId, setExpandId] = useState<string | null>(null);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    const filtered = companies
        .filter(c => {
            const q = search.toLowerCase();
            const matchSearch = (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
            
            let matchPlan = false;
            if (filterPlan === 'all_users') {
                matchPlan = true;
            } else if (filterPlan === 'all_clients') {
                matchPlan = !!c.plan && c.plan !== 'none';
            } else if (filterPlan === 'none') {
                matchPlan = !c.plan || c.plan === 'none';
            } else {
                matchPlan = c.plan === filterPlan;
            }
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
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
            {/* Header */}
            <div className="sticky top-0 z-40 w-full py-4 bg-white/90 border-b border-slate-200 backdrop-blur-md shadow-sm">
                <div className="max-w-6xl mx-auto px-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <h1 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                            <Building2 className="w-5 h-5 text-amber-600" />
                            구독 고객 목록
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {filtered.length}개사
                        </span>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="기업명, 이메일 검색..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm bg-white border border-slate-200 text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-sm"
                            />
                        </div>
                        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
                            className="px-3 py-2 rounded-xl text-sm outline-none bg-white border border-slate-200 text-slate-700 shadow-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all">
                            <option value="all_clients">구독 고객 전체</option>
                            <option value="all_users">전체 가입자(리드 포함)</option>
                            <option value="none">단순 가입/미구독</option>
                            <option value="premium">Premium 플랜</option>
                            <option value="standard">Standard 플랜</option>
                            <option value="starter">Starter 플랜</option>
                        </select>
                    </div>

                    {/* Sort Header */}
                    <div className="hidden md:grid grid-cols-12 gap-3 px-4 pt-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        <button className="col-span-4 flex items-center gap-1 text-left hover:text-slate-800 transition-colors" onClick={() => toggleSort('name')}>
                            기업명 {sortBy === 'name' ? (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <span className="w-3.5 h-3.5" />}
                        </button>
                        <button className="col-span-2 flex items-center gap-1 text-left hover:text-slate-800 transition-colors" onClick={() => toggleSort('plan')}>
                            플랜 {sortBy === 'plan' ? (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <span className="w-3.5 h-3.5" />}
                        </button>
                        <button className="col-span-2 flex items-center gap-1 text-left hover:text-slate-800 transition-colors" onClick={() => toggleSort('stores')}>
                            매장수 {sortBy === 'stores' ? (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <span className="w-3.5 h-3.5" />}
                        </button>
                        <div className="col-span-2 text-left">담당 변호사</div>
                        <div className="col-span-2 text-left">상태</div>
                    </div>
                </div>
            </div>

            {/* Client List */}
            <div className="max-w-6xl mx-auto px-4 pt-6 space-y-3">
                <AnimatePresence>
                    {filtered.map((c, i) => {
                        const pm = PLAN_META[c.plan || 'none'] || PLAN_META.none;
                        const sm = STATUS_META[c.status] || { label: c.status, color: '#64748b' };
                        const isExpanded = expandId === c.id;
                        
                        // Compute Light Mode Styles for Plan/Status
                        const iconColor = c.plan === 'premium' ? 'text-amber-600' : c.plan === 'standard' ? 'text-indigo-600' : c.plan === 'starter' ? 'text-emerald-600' : 'text-slate-400';
                        const planBg = c.plan === 'premium' ? 'bg-amber-50 text-amber-700 ring-amber-200' : c.plan === 'standard' ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : c.plan === 'starter' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200';
                        const statusString = c.status as string;
                        const statusColor = statusString === 'active' ? 'text-emerald-700 bg-emerald-50 ring-emerald-200' : statusString === 'pending' ? 'text-amber-700 bg-amber-50 ring-amber-200' : statusString === 'suspended' ? 'text-red-700 bg-red-50 ring-red-200' : 'text-indigo-700 bg-indigo-50 ring-indigo-200';
                        const iconBg = c.plan === 'premium' ? 'bg-amber-100' : c.plan === 'standard' ? 'bg-indigo-100' : c.plan === 'starter' ? 'bg-emerald-100' : 'bg-slate-100';

                        return (
                            <motion.div key={c.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ delay: i * 0.03 }}
                                className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                                <div className="p-4">
                                    {/* PC Grid */}
                                    <div className="hidden md:grid grid-cols-12 items-center gap-3">
                                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                                            <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>
                                                <Building2 className={`w-4 h-4 ${iconColor}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-[15px] text-slate-800 truncate mb-0.5">{c.name}</div>
                                                <div className="text-[11px] font-medium text-slate-500 truncate">{c.email}</div>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`text-xs px-2.5 py-1 rounded-md font-bold ring-1 ring-inset ${planBg}`}>{pm.label}</span>
                                        </div>
                                        <div className="col-span-2 text-[15px] font-bold text-slate-700">
                                            {(c.storeCount || 0).toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">개</span>
                                        </div>
                                        <div className="col-span-2 text-xs font-medium text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <Gavel className="w-3.5 h-3.5 text-slate-400" />
                                                {c.assignedLawyer || '미배정'}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex items-center gap-3">
                                            <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold ring-1 ring-inset ${statusColor}`}>
                                                {sm.label}
                                            </span>
                                            <button onClick={() => setExpandId(isExpanded ? null : c.id)}
                                                className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Mobile */}
                                    <div className="md:hidden">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex gap-3">
                                                <div className={`p-2 rounded-xl flex-shrink-0 ${iconBg}`}>
                                                    <Building2 className={`w-4 h-4 ${iconColor}`} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-slate-800">{c.name}</div>
                                                    <div className="text-xs mt-0.5 text-slate-500">{c.email}</div>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ring-1 ring-inset ${planBg}`}>{pm.label}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium px-1">
                                            <span>{(c.storeCount || 0).toLocaleString()}개 매장</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="flex items-center gap-1"><Gavel className="w-3 h-3" />{c.assignedLawyer || '미배정'}</span>
                                        </div>
                                        <button onClick={() => setExpandId(isExpanded ? null : c.id)}
                                            className="mt-4 w-full text-xs font-bold py-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-100">
                                            {isExpanded ? '상세 접기' : '상세 보기'}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden border-t border-slate-100 bg-slate-50/50">
                                            <div className="p-5 md:p-6">
                                                <div className="grid md:grid-cols-3 gap-6 text-sm">
                                                    {/* Contact & Privacy */}
                                                    <div>
                                                        <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> 연락처 및 방침</p>
                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                {c.phone && (
                                                                    <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-emerald-600 transition-colors">
                                                                        <div className="p-1.5 rounded-md bg-white border border-slate-200">
                                                                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                                                        </div> {c.phone}
                                                                    </a>
                                                                )}
                                                                <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-blue-600 transition-colors">
                                                                    <div className="p-1.5 rounded-md bg-white border border-slate-200">
                                                                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                                                                    </div> {c.email}
                                                                </a>
                                                            </div>
                                                            <div className="pt-2">
                                                                <p className="text-[11px] font-bold text-slate-500 mb-1.5">거점 / 법적 문서 확인 (URL)</p>
                                                                <div className="flex items-center gap-2">
                                                                    <input 
                                                                        type="text" 
                                                                        defaultValue={c.privacyUrl || ''}
                                                                        placeholder="https://example.com/privacy"
                                                                        onBlur={(e) => {
                                                                            if (e.target.value !== (c.privacyUrl || '')) {
                                                                                updateCompany(c.id, { privacyUrl: e.target.value });
                                                                            }
                                                                        }}
                                                                        className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none bg-white border border-slate-200 text-slate-800 shadow-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                                                    />
                                                                    {c.privacyUrl && (
                                                                        <a href={c.privacyUrl} target="_blank" rel="noreferrer" className="p-2 rounded-xl transition-all hover:bg-slate-100 bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-amber-600">
                                                                            <CheckCircle2 className="w-4 h-4" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-bold text-slate-500 mb-1.5">개인정보처리방침 원문 (텍스트)</p>
                                                                <textarea
                                                                    defaultValue={c.privacyPolicyText || ''}
                                                                    placeholder="개인정보처리방침 전체 내용..."
                                                                    onBlur={(e) => {
                                                                        if (e.target.value !== (c.privacyPolicyText || '')) {
                                                                            updateCompany(c.id, { privacyPolicyText: e.target.value });
                                                                        }
                                                                    }}
                                                                    rows={5}
                                                                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-y bg-white border border-slate-200 text-slate-800 shadow-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                                                />
                                                                <p className="text-[10px] mt-1.5 font-medium text-slate-400 flex items-center gap-1">
                                                                    <Sparkles className="w-3 h-3" /> 수정 후 다른 곳을 클릭하면 자동 저장
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Subscription Info */}
                                                    <div>
                                                        <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-slate-400 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5"/> 분석 정보</p>
                                                        <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                                <span className="text-[13px] font-medium text-slate-500">현재 플랜</span>
                                                                <span className={`text-[13px] font-bold ${iconColor}`}>{pm.label}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[13px] font-medium text-slate-500">AI 분석 리스크</span>
                                                                <span className={`text-[13px] font-bold px-2 py-0.5 rounded-md ${c.riskLevel === 'HIGH' ? 'bg-red-50 text-red-600' : c.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                    {c.riskLevel || '분석 필요'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div>
                                                        <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-slate-400 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5"/> 빠른 실행 및 관리</p>
                                                        <div className="flex flex-col gap-2">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <button onClick={() => setEditingCompany(c)} className="px-3 py-2 rounded-xl text-[12px] font-bold transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 shadow-sm">
                                                                    마스터 정보 수정
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        alert('임시 비밀번호 발송 스케줄링됨');
                                                                    }} 
                                                                    className="px-3 py-2 rounded-xl text-[12px] font-bold transition-colors bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm">
                                                                    계정 PW 초기화
                                                                </button>
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                                <Link href={`/admin/email-preview?company=${encodeURIComponent(c.name)}`} className="w-full">
                                                                    <button className="w-full px-3 py-2 rounded-xl text-[12px] font-bold transition-colors bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100 shadow-sm">
                                                                        이메일 발송 폼
                                                                    </button>
                                                                </Link>
                                                                <Link href="/contracts" className="w-full">
                                                                    <button className="w-full px-3 py-2 rounded-xl text-[12px] font-bold transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 shadow-sm">
                                                                        계약서 보관함
                                                                    </button>
                                                                </Link>
                                                            </div>

                                                            <div className="w-full h-px my-2 bg-slate-200" />
                                                            
                                                            <button 
                                                                onClick={() => {
                                                                    if(confirm(`정말 '${c.name}' 계정을 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                                                                        deleteCompany(c.id);
                                                                    }
                                                                }} 
                                                                className="px-3 py-2 w-full rounded-xl text-[12px] font-bold transition-colors bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-sm">
                                                                계정 영구 삭제
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Document Widget */}
                                                <div className="mt-6 pt-6 border-t border-slate-200">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                                                        <h3 className="text-sm font-bold text-slate-800">해당 기업 문서함 (관리자 뷰)</h3>
                                                    </div>
                                                    <div className="h-[400px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="font-bold text-slate-500 text-sm">
                            {search ? '검색 결과가 없습니다' : '고객 데이터가 없습니다'}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AdminCompanyEditModal 
                isOpen={!!editingCompany}
                company={editingCompany}
                onClose={() => setEditingCompany(null)}
                onSave={updateCompany}
            />
        </div>
    );
}
