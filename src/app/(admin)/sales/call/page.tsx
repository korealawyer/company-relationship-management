'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Search, LayoutDashboard, Headphones, Mic, Calculator, ArrowUpDown, Layers, ChevronUp, ChevronDown, BookOpen, Filter, Check, Square, CheckSquare } from 'lucide-react';
import { useCallPage } from '@/components/sales/call/useCallPage';
import { useAuth } from '@/lib/AuthContext';
import { useCallLocks } from '@/hooks/useCallLocks';
import { C, CALLABLE } from '@/lib/callPageUtils';
import { CaseStatus, Company } from '@/lib/types';
import { ConversionPredictionService } from '@/lib/salesAutomation';
import Link from 'next/link';

// Excel-like Filter Header
const ExcelFilterHeader = ({ 
    label, k, w, sortKey, sortAsc, toggleSort, columnFilters, setColumnFilter, allValues 
}: { 
    label: string; 
    k?: any; 
    w?: string;
    sortKey: string;
    sortAsc: boolean;
    toggleSort: (k: any) => void;
    columnFilters: Record<string, string[]>;
    setColumnFilter: (k: string, values: string[]) => void;
    allValues: string[];
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQ, setSearchQ] = useState('');
    const ref = useRef<HTMLTableCellElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!k) {
        return <th className={`text-left py-3 px-3 align-middle ${w || ''}`}><div className="text-[14px] font-bold text-slate-600">{label}</div></th>;
    }

    const selectedValues = columnFilters[k] || [];
    const isFiltered = selectedValues.length > 0;
    
    // Sort all values alphabetically and filter by search query
    const displayValues = Array.from(new Set(allValues.map(v => (v === undefined || v === null) ? '' : String(v))))
        .sort((a, b) => {
            if (a === '') return 1; // empty at bottom
            if (b === '') return -1;
            return a.localeCompare(b);
        })
        .filter(v => {
            const displayLabel = v || '(비어있음)';
            return displayLabel.toLowerCase().includes(searchQ.toLowerCase());
        });

    const isAllSelected = selectedValues.length === 0 || selectedValues.length === displayValues.length; // 0 means no filter -> all selected

    const handleToggleAll = () => {
        if (isAllSelected) setColumnFilter(k, displayValues); // If all selected, select none? Usually deselecting "All" unchecks everything. Wait! If length === 0, all shown.
        else setColumnFilter(k, []); // If not all selected, reset to empty = all
    };

    const handleToggleOne = (val: string) => {
        if (selectedValues.length === 0) {
            // If currently showing all, unchecking one means selecting everything EXCEPT this one
            setColumnFilter(k, displayValues.filter(v => v !== val));
        } else {
            if (selectedValues.includes(val)) {
                const next = selectedValues.filter(v => v !== val);
                // if it becomes empty, that means no filter? Wait, if we uncheck the last one, it becomes empty. 
                // In Excel, you can't uncheck all. But we can just pass an impossible value or empty.
                // Let's handle: if unchecked, remove.
                setColumnFilter(k, next.length === 0 ? ['__NONE__'] : next);
            } else {
                const next = [...selectedValues, val].filter(v => v !== '__NONE__');
                setColumnFilter(k, next.length === displayValues.length ? [] : next); // if all selected, reset to [] (all)
            }
        }
    };

    return (
        <th className={`relative py-3 px-3 align-middle transition-colors whitespace-nowrap ${w || ''}`} ref={ref}>
            <div className={`flex items-center justify-between gap-0.5 select-none text-[14px] font-bold ${sortKey === k || isFiltered ? 'text-indigo-700' : 'text-slate-600'}`}>
                <div className="flex items-center gap-1 cursor-pointer hover:opacity-70 flex-1" onClick={() => toggleSort(k)}>
                    {label}
                    <span className="flex flex-col">
                        {sortKey === k ? (
                            sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                    </span>
                </div>
                
                <button onClick={() => setIsOpen(!isOpen)} className={`px-0 py-0.5 w-4 flex items-center justify-center rounded hover:bg-slate-200 transition-colors ${isFiltered ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}>
                    <Filter className="w-2.5 h-2.5" />
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden font-normal"
                    >
                        <div className="p-1">
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-slate-50 text-slate-700 rounded-md" onClick={() => { toggleSort(k); setIsOpen(false); }}>
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                                {sortKey === k && sortAsc ? '텍스트 내림차순 정렬(O)' : '텍스트 오름차순 정렬(S)'}
                            </button>
                            <div className="h-px bg-slate-100 my-1 mx-2" />
                            <div className="px-2 py-1.5">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="검색" 
                                        value={searchQ} onChange={e => setSearchQ(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto p-2 scrollbar-thin">
                                <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer group">
                                    <div className="relative flex items-center justify-center w-4 h-4 rounded border border-slate-300">
                                        <input type="checkbox" checked={isAllSelected} onChange={handleToggleAll} className="peer sr-only" />
                                        {(isAllSelected || searchQ) ? <Check className={`w-3 h-3 ${isAllSelected ? 'text-indigo-600' : 'text-slate-200'}`} /> : <Square className="w-3 h-3 text-indigo-600" fill="currentColor" />}
                                    </div>
                                    <span className="text-[13px] text-slate-700 group-hover:text-slate-900 select-none">(모두 선택)</span>
                                </label>
                                {displayValues.map(v => {
                                    const checked = selectedValues.length === 0 || selectedValues.includes(v);
                                    return (
                                        <label key={v || 'empty'} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer group">
                                            <div className="relative flex items-center justify-center w-4 h-4 rounded border border-slate-300">
                                                <input type="checkbox" checked={checked} onChange={() => handleToggleOne(v)} className="peer sr-only" />
                                                {checked && <Check className="w-3 h-3 text-indigo-600" />}
                                            </div>
                                            <span className="text-[13px] text-slate-700 group-hover:text-slate-900 select-none truncate">
                                                {v || '(비어있음)'}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-2 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setColumnFilter(k, [])} className="px-3 py-1 text-[12px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors">초기화</button>
                            <button onClick={() => setIsOpen(false)} className="px-3 py-1 text-[12px] font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">확인</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </th>
    );
};

import CallbackModal from '@/components/sales/call/CallbackModal';
import KakaoModal from '@/components/sales/call/KakaoModal';
import ContractPreviewModal from '@/components/lawyer/ContractPreviewModal';
import CompanyTableRow from '@/components/sales/call/CompanyTableRow';
import SalesCallTour from '@/components/sales/call/SalesCallTour';

export default function SalesCallPage() {
    const { user } = useAuth();
    const [runTour, setRunTour] = useState(false);
    const { locks: callLocks, getLockInfo } = useCallLocks(); // @/hooks/useCallLocks 에 구현된 훅이라고 가정
    const {
        companies, search, setSearch, selectedId, toast, setToast, callResult, activeCallId,
        statusFilter, setStatusFilter, sortKey, sortAsc, showNews, setShowNews, riskAlerts, callQueue,
        showCallbackModal, setShowCallbackModal, callbackTime, setCallbackTime, kakaoTarget, setKakaoTarget,
        kakaoTemplate, setKakaoTemplate, kakaoSending, setKakaoSending, kakaoStatuses, autoSettings,
        contractPreviewTarget, setContractPreviewTarget, timer, isRecording, sttStatus, waveformData,
        filtered, statusCounts, selected, calledCount, highRiskCount, todayStats, newsItems,
        selectCompany, startCall, endCall, handleCallResult, confirmCallback, toggleSort, refresh,
        columnFilters, setColumnFilter, page, setPage, count, deleteCompany
    } = useCallPage(user?.id || '', user?.name || '');

    const getVal = (c: Company, k: string) => {
        if (k === 'name') return c.name;
        if (k === 'franchiseType') return c.franchiseType?.trim() || '';
        if (k === 'status') return c.status;
        if (k === 'risk') return String(c.riskScore || 0);
        if (k === 'contactName') return c.contactName || '';
        if (k === 'salesRep') return c.lastCalledBy || '';
        if (k === 'phone') return c.contactPhone || c.phone || '';
        if (k === 'conversion') return String(ConversionPredictionService.predict(c).score || 0);
        return '';
    };

    const getColumnValues = (k: string) => companies.map(c => getVal(c, k));

    const FILTERS: { key: CaseStatus | 'all' | 'my_calls_today' | 'rejected' | 'invalid_site'; label: string; icon: string }[] = [
        { key: 'my_calls_today', label: '오늘통화', icon: '📞' }, { key: 'all', label: '전체', icon: '📋' }, 
        { key: 'pending', label: '신규 회사', icon: '📥' }, { key: 'crawling', label: '분석중', icon: '⚙️' },
        { key: 'analyzed', label: '분석완료', icon: '🔍' },
        { key: 'reviewing', label: '변호사검토', icon: '📋' }, { key: 'lawyer_confirmed', label: '변호사 컨펌', icon: '⚖️' }, { key: 'emailed', label: '이메일 발송', icon: '📧' },
        { key: 'client_replied', label: '답장수신', icon: '💬' }, { key: 'client_viewed', label: '리포트열람', icon: '👁️' },
        { key: 'contract_sent', label: '계약서발송', icon: '📄' }, { key: 'contract_signed', label: '서명완료', icon: '✍️' },
        { key: 'rejected', label: '거절', icon: '❌' }, { key: 'invalid_site', label: '사이트이상', icon: '⚠️' },
    ];

    return (
        <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: C.body }}>
            <AnimatePresence>
                {toast && <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg"
                    style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>{toast}</motion.div>}
            </AnimatePresence>

            <div className="px-6 pt-5 pb-3 bg-white" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="max-w-[1920px] mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-600"><Phone className="w-4 h-4 text-white" /></div>
                            <div>
                                <h1 className="text-lg font-black text-slate-900">전화 영업 센터</h1>
                                <p className="text-[13px] text-slate-500">{count}개 기업 중 {filtered.length}개 표기</p>
                            </div>
                        </div>
                        <div id="tour-nav" className="flex gap-2 items-center overflow-x-auto pb-1">
                            <div className="relative flex-shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="기업·담당자 검색..."
                                    className="pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 outline-none w-[140px]" />
                            </div>
                            <Link href="/employee"><button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600"><LayoutDashboard className="w-3.5 h-3.5 hidden sm:block" /> 대시보드</button></Link>
                            <Link href="/sales-queue"><button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600"><Layers className="w-3.5 h-3.5 hidden sm:block" /> 세일즈 큐</button></Link>
                            <Link href="/sales/call"><button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-600"><Headphones className="w-3.5 h-3.5 hidden sm:block" /> 전화 영업</button></Link>
                            <Link href="/sales/voice-memo"><button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600"><Mic className="w-3.5 h-3.5 hidden sm:block" /> 음성 메모</button></Link>
                            <Link href="/sales/pricing-calculator"><button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600"><Calculator className="w-3.5 h-3.5 hidden sm:block" /> 견적 계산기</button></Link>
                            <button onClick={() => setRunTour(true)} className="ml-1 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors">
                                <BookOpen className="w-3.5 h-3.5 hidden sm:block" /> 영업용 설명서
                            </button>
                        </div>
                    </div>
                    
                    <div id="tour-stats" className="flex items-center gap-3 mb-2">
                        <div className="flex gap-2 flex-1">
                            {[{ l: '대기', v: companies.length - calledCount, c: '#4f46e5', b: '#eef2ff' }, 
                              { l: '오늘영업', v: todayStats.total, c: '#059669', b: '#ecfdf5', sub: `✅${todayStats.connected} 📵${todayStats.no_answer} 🔄${todayStats.callback}` }, 
                              { l: '고위험', v: highRiskCount, c: '#dc2626', b: '#fef2f2' }, 
                              { l: '전환율', v: companies.length > 0 ? `${Math.round(calledCount / companies.length * 100)}%` : '0%', c: '#0891b2', b: '#ecfeff' }].map(k => (
                                <div key={k.l} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: k.b }}>
                                    <span className="text-base font-black" style={{ color: k.c }}>{k.v}</span>
                                    {k.sub && <span className="text-[12px] font-bold" style={{ color: k.c, opacity: 0.8 }}>{k.sub}</span>}
                                    <span className="text-[12px] font-medium text-slate-600">{k.l}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 items-center">
                            {autoSettings && <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-200 cursor-default">
                                <span className="text-[11px] font-bold text-green-700">🤖</span>
                                <span className="text-[11px] px-1 py-0.5 rounded font-bold bg-blue-100 text-blue-700">자동배정</span>
                                {autoSettings.autoSendEmail ? <span className="text-[11px] px-1 py-0.5 rounded font-bold bg-amber-100 text-amber-800">자동이메일</span> : <span className="text-[11px] font-bold text-gray-500">수동이메일</span>}
                            </div>}
                            {riskAlerts.length > 0 && <button onClick={() => selectCompany(riskAlerts[0].companyId)} className="flex gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-bold animate-pulse bg-red-50 text-red-600 border border-red-200">🚨 고위험 {riskAlerts.length}건</button>}
                            {callQueue.length > 0 && <div className="flex gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">📋 콜백 {callQueue.length}건</div>}
                            <button onClick={() => setShowNews(!showNews)} className={`flex gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-bold border ${showNews ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>📰 뉴스 {newsItems.length}건</button>
                        </div>
                    </div>

                    <AnimatePresence>{showNews && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
                        <div className="grid grid-cols-3 gap-2">{newsItems.map(n => (
                            <div key={n.id} className="rounded-lg p-2.5 bg-slate-50 border border-slate-200">
                                <div className="flex gap-1.5 mb-1"><span className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${n.urgency === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-800'}`}>{n.urgency === 'high' ? '🔴' : '🟡'}</span><span className="text-[11px] text-slate-400">{n.source}</span></div>
                                <p className="text-[12px] font-bold text-slate-900 leading-tight">{n.title}</p>
                            </div>
                        ))}</div>
                    </motion.div>}</AnimatePresence>
                    
                    <div id="tour-filters" className="flex gap-1 flex-wrap">
                        {FILTERS.map(f => {
                            const cnt = f.key === 'my_calls_today' ? todayStats.total : (statusCounts[f.key] || 0); 
                            const a = statusFilter === f.key; 
                            return <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`px-2 py-1 rounded-md text-[12px] font-bold border ${a ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-transparent text-slate-500 border-transparent'}`}>{f.icon} {f.label} <span className="ml-0.5 opacity-60">({cnt})</span></button>;
                        })}
                    </div>
                </div>
            </div>

            <div id="tour-table" className="flex-1 overflow-auto">
                <table className="w-full min-w-[1250px]">
                    <thead className="sticky top-0 z-10 bg-white shadow-sm ring-1 ring-slate-200">
                        <tr>
                            <th className="w-10 py-3 px-3 align-middle bg-slate-50" />
                            <ExcelFilterHeader label="기업명" k="name" w="w-[180px] min-w-[150px] bg-slate-50 border-r border-slate-200/60" sortKey={sortKey} sortAsc={sortAsc} toggleSort={toggleSort} columnFilters={columnFilters} setColumnFilter={setColumnFilter} allValues={getColumnValues('name')} />
                            <ExcelFilterHeader label="구분" k="franchiseType" w="w-[110px] min-w-[100px] bg-slate-50 border-r border-slate-200/60" sortKey={sortKey} sortAsc={sortAsc} toggleSort={toggleSort} columnFilters={columnFilters} setColumnFilter={setColumnFilter} allValues={getColumnValues('franchiseType')} />
                            <ExcelFilterHeader label="상태" k="status" w="w-[120px] min-w-[110px] bg-slate-50 border-r border-slate-200/60" sortKey={sortKey} sortAsc={sortAsc} toggleSort={toggleSort} columnFilters={columnFilters} setColumnFilter={setColumnFilter} allValues={getColumnValues('status')} />
                            <ExcelFilterHeader label="위험도" k="risk" w="w-[90px] min-w-[80px] bg-slate-50 border-r border-slate-200/60" sortKey={sortKey} sortAsc={sortAsc} toggleSort={toggleSort} columnFilters={columnFilters} setColumnFilter={setColumnFilter} allValues={getColumnValues('risk')} />
                            <ExcelFilterHeader label="업체담당" k="contactName" w="w-[100px] min-w-[90px] bg-slate-50 border-r border-slate-200/60" sortKey={sortKey} sortAsc={sortAsc} toggleSort={toggleSort} columnFilters={columnFilters} setColumnFilter={setColumnFilter} allValues={getColumnValues('contactName')} />
                            <ExcelFilterHeader label="영업자" k="salesRep" w="w-[100px] min-w-[90px] bg-slate-50 border-r border-slate-200/60" sortKey={sortKey} sortAsc={sortAsc} toggleSort={toggleSort} columnFilters={columnFilters} setColumnFilter={setColumnFilter} allValues={getColumnValues('salesRep')} />
                            <ExcelFilterHeader label="전화번호" k="phone" w="w-[110px] min-w-[100px] bg-slate-50 border-r border-slate-200/60" sortKey={sortKey} sortAsc={sortAsc} toggleSort={toggleSort} columnFilters={columnFilters} setColumnFilter={setColumnFilter} allValues={getColumnValues('phone')} />
                            <ExcelFilterHeader label="전환율" k="conversion" w="w-[100px] min-w-[90px] bg-slate-50 border-r border-slate-200/60" sortKey={sortKey} sortAsc={sortAsc} toggleSort={toggleSort} columnFilters={columnFilters} setColumnFilter={setColumnFilter} allValues={getColumnValues('conversion')} />
                            <ExcelFilterHeader label="이슈" k="issue" w="w-[100px] min-w-[90px] bg-slate-50 border-r border-slate-200/60" sortKey={sortKey} sortAsc={sortAsc} toggleSort={toggleSort} columnFilters={columnFilters} setColumnFilter={setColumnFilter} allValues={[]} />
                            <ExcelFilterHeader label="최근 메모" k="memo" w="w-[260px] min-w-[220px] bg-slate-50 border-r border-slate-200/60" sortKey={sortKey} sortAsc={sortAsc} toggleSort={toggleSort} columnFilters={columnFilters} setColumnFilter={setColumnFilter} allValues={[]} />
                            <th className="text-left text-[14px] font-bold py-3 px-3 align-middle text-slate-600 w-[130px] min-w-[130px] bg-slate-50 border-l border-slate-200/60 whitespace-nowrap">바로가기</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && <tr><td colSpan={12} className="text-center py-16 text-sm text-slate-500"><Phone className="w-6 h-6 mx-auto mb-2 opacity-30" />통화 대상이 없습니다</td></tr>}
                        {filtered.map((c, i) => (
                            <CompanyTableRow key={c.id} c={c} index={i} selectedId={selectedId} activeCallId={activeCallId}
                                lockInfo={getLockInfo(c.id)} myUserId={user?.id}
                                kakaoStatuses={kakaoStatuses} callResult={callResult as any} timer={timer}
                                isRecording={isRecording} sttStatus={sttStatus} waveformData={waveformData}
                                onSelect={selectCompany} onStartCall={startCall} onEndCall={endCall}
                                onCallResult={handleCallResult} onRefresh={refresh} setToast={setToast}
                                onOpenKakao={(co: Company) => { setKakaoTarget(co); setKakaoTemplate(0); }}
                                onOpenContract={(co: Company) => { setContractPreviewTarget(co); }}
                                onPass={() => selectCompany('')} 
                                onDelete={async (id: string) => {
                                    if (window.confirm("정말로 이 기업 정보를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) {
                                        await deleteCompany(id);
                                        setToast('🗑️ 기업 정보가 삭제되었습니다.');
                                    }
                                }}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="flex bg-white items-center justify-between px-6 py-3 border-t border-slate-200 shrink-0">
                <span className="text-[13px] text-slate-500 font-medium">검색결과: <strong className="text-slate-900">{count.toLocaleString()}</strong>건</span>
                <div className="flex items-center gap-1">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 text-[13px] font-bold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 disabled:opacity-30 transition-colors">이전</button>
                    <div className="px-4 text-[13px] font-bold text-slate-700 select-none">{page}</div>
                    <button onClick={() => setPage(page + 1)} disabled={filtered.length < 50} className="px-3 py-1.5 text-[13px] font-bold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 disabled:opacity-30 transition-colors">다음</button>
                </div>
            </div>

            <CallbackModal show={showCallbackModal} selected={selected} callbackTime={callbackTime} setCallbackTime={setCallbackTime} onClose={() => { setShowCallbackModal(false); setCallbackTime(''); }} onConfirm={confirmCallback} />
            <KakaoModal kakaoTarget={kakaoTarget} kakaoTemplate={kakaoTemplate} setKakaoTemplate={setKakaoTemplate} kakaoSending={kakaoSending}
                setKakaoSending={setKakaoSending} setKakaoTarget={setKakaoTarget} setToast={setToast} />
            {contractPreviewTarget && <ContractPreviewModal company={contractPreviewTarget} setContractPreviewTarget={setContractPreviewTarget}
                onRefresh={refresh} setToast={setToast} />}
            <SalesCallTour run={runTour} onClose={() => setRunTour(false)} />
        </div>
    );
}
