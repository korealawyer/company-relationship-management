'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Search, LayoutDashboard, Headphones, Mic, Calculator, ArrowUpDown, Layers } from 'lucide-react';
import { useCallPage } from '@/components/sales/call/useCallPage';
import { useAuth } from '@/lib/AuthContext';
import { useCallLocks } from '@/hooks/useCallLocks';
import { C, CALLABLE } from '@/lib/callPageUtils';
import { CaseStatus, Company } from '@/lib/types';
import Link from 'next/link';

import CallbackModal from '@/components/sales/call/CallbackModal';
import KakaoModal from '@/components/sales/call/KakaoModal';
import ContractPreviewModal from '@/components/lawyer/ContractPreviewModal';
import CompanyTableRow from '@/components/sales/call/CompanyTableRow';

export default function SalesCallPage() {
    const { user } = useAuth();
    const { locks: callLocks, getLockInfo } = useCallLocks(); // @/hooks/useCallLocks 에 구현된 훅이라고 가정
    const {
        companies, search, setSearch, selectedId, toast, setToast, callResult, activeCallId,
        statusFilter, setStatusFilter, sortKey, sortAsc, showNews, setShowNews, riskAlerts, callQueue,
        showCallbackModal, setShowCallbackModal, callbackTime, setCallbackTime, kakaoTarget, setKakaoTarget,
        kakaoTemplate, setKakaoTemplate, kakaoSending, setKakaoSending, kakaoStatuses, autoSettings,
        contractPreviewTarget, setContractPreviewTarget, timer, isRecording, sttStatus, waveformData,
        filtered, statusCounts, selected, calledCount, highRiskCount, todayStats, newsItems,
        selectCompany, startCall, endCall, handleCallResult, confirmCallback, toggleSort, refresh
    } = useCallPage(user?.name || '');

    const [colFilters, setColFilters] = useState({
        name: '', status: '', risk: '', contactName: '', salesRep: '', phone: '', memo: ''
    });

    const finalFiltered = filtered.filter(c => {
        if (colFilters.name && !c.name.toLowerCase().includes(colFilters.name.toLowerCase())) return false;
        const statusMap: Record<string, string> = { 
            'analyzed': '분석완료', 'lawyer_confirmed': '변호사컨펌', 'emailed': '이메일발송', 
            'client_replied': '답장수신', 'client_viewed': '리포트열람', 
            'contract_sent': '계약서발송', 'contract_signed': '서명완료' 
        };
        const cStatusKo = statusMap[c.status] || c.status;
        if (colFilters.status && !cStatusKo.includes(colFilters.status) && !c.status.toLowerCase().includes(colFilters.status.toLowerCase())) return false;
        if (colFilters.risk && c.riskScore.toString() !== colFilters.risk && !c.riskScore.toString().includes(colFilters.risk)) return false;
        if (colFilters.contactName && (!c.contactName || !c.contactName.toLowerCase().includes(colFilters.contactName.toLowerCase()))) return false;
        if (colFilters.salesRep && (!c.lastCalledBy || !c.lastCalledBy.toLowerCase().includes(colFilters.salesRep.toLowerCase()))) return false;
        if (colFilters.phone && !((c.contactPhone || '') + (c.phone || '')).includes(colFilters.phone)) return false;
        if (colFilters.memo) {
            const memoStr = [c.callNote, ...(c.memos || []).map(m => m.content)].join(' ').toLowerCase();
            if (!memoStr.includes(colFilters.memo.toLowerCase())) return false;
        }
        return true;
    });

    const handleColFilterChange = (k: keyof typeof colFilters, v: string) => {
        setColFilters(prev => ({ ...prev, [k]: v }));
    };

    const SortHeader = ({ label, k, w }: { label: string; k: typeof sortKey; w?: string }) => (
        <th className={`text-left py-3 px-3 cursor-pointer select-none text-[11px] font-bold ${w || ''}`} style={{ color: sortKey === k ? C.accent : C.muted }} onClick={() => toggleSort(k)}>
            <span className="flex items-center gap-1">{label}{sortKey === k && <ArrowUpDown className="w-3 h-3" />}</span>
        </th>
    );

    const FILTERS: { key: CaseStatus | 'all' | 'my_calls_today'; label: string; icon: string }[] = [
        { key: 'my_calls_today', label: '오늘통화', icon: '📞' }, { key: 'all', label: '전체', icon: '📋' }, { key: 'analyzed', label: '분석완료', icon: '🔍' },
        { key: 'lawyer_confirmed', label: '변호사컨펌', icon: '⚖️' }, { key: 'emailed', label: '이메일발송', icon: '📧' },
        { key: 'client_replied', label: '답장수신', icon: '💬' }, { key: 'client_viewed', label: '리포트열람', icon: '👁️' },
        { key: 'contract_sent', label: '계약서발송', icon: '📄' }, { key: 'contract_signed', label: '서명완료', icon: '✍️' },
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
                                <p className="text-[11px] text-slate-500">{filtered.length}개 기업</p>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center overflow-x-auto pb-1">
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
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex gap-2 flex-1">
                            {[{ l: '대기', v: companies.length - calledCount, c: '#4f46e5', b: '#eef2ff' }, 
                              { l: '오늘영업', v: todayStats.total, c: '#059669', b: '#ecfdf5', sub: `✅${todayStats.connected} 📵${todayStats.no_answer} 🔄${todayStats.callback}` }, 
                              { l: '고위험', v: highRiskCount, c: '#dc2626', b: '#fef2f2' }, 
                              { l: '전환율', v: companies.length > 0 ? `${Math.round(calledCount / companies.length * 100)}%` : '0%', c: '#0891b2', b: '#ecfeff' }].map(k => (
                                <div key={k.l} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: k.b }}>
                                    <span className="text-base font-black" style={{ color: k.c }}>{k.v}</span>
                                    {k.sub && <span className="text-[10px] font-bold" style={{ color: k.c, opacity: 0.8 }}>{k.sub}</span>}
                                    <span className="text-[10px] font-medium text-slate-600">{k.l}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 items-center">
                            {autoSettings && <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-200 cursor-default">
                                <span className="text-[9px] font-bold text-green-700">🤖</span>
                                <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-blue-100 text-blue-700">자동배정</span>
                                {autoSettings.autoSendEmail ? <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-amber-100 text-amber-800">자동이메일</span> : <span className="text-[9px] font-bold text-gray-500">수동이메일</span>}
                            </div>}
                            {riskAlerts.length > 0 && <button onClick={() => selectCompany(riskAlerts[0].companyId)} className="flex gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold animate-pulse bg-red-50 text-red-600 border border-red-200">🚨 고위험 {riskAlerts.length}건</button>}
                            {callQueue.length > 0 && <div className="flex gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">📋 콜백 {callQueue.length}건</div>}
                            <button onClick={() => setShowNews(!showNews)} className={`flex gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border ${showNews ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>📰 뉴스 {newsItems.length}건</button>
                        </div>
                    </div>

                    <AnimatePresence>{showNews && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
                        <div className="grid grid-cols-3 gap-2">{newsItems.map(n => (
                            <div key={n.id} className="rounded-lg p-2.5 bg-slate-50 border border-slate-200">
                                <div className="flex gap-1.5 mb-1"><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${n.urgency === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-800'}`}>{n.urgency === 'high' ? '🔴' : '🟡'}</span><span className="text-[9px] text-slate-400">{n.source}</span></div>
                                <p className="text-[10px] font-bold text-slate-900 leading-tight">{n.title}</p>
                            </div>
                        ))}</div>
                    </motion.div>}</AnimatePresence>
                    
                    <div className="flex gap-1 flex-wrap">
                        {FILTERS.map(f => {
                            const cnt = f.key === 'my_calls_today' ? todayStats.total : (statusCounts[f.key] || 0); 
                            const a = statusFilter === f.key; 
                            if (f.key !== 'all' && f.key !== 'my_calls_today' && cnt === 0) return null;
                            return <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`px-2 py-1 rounded-md text-[10px] font-bold border ${a ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-transparent text-slate-500 border-transparent'}`}>{f.icon} {f.label} {cnt > 0 && <span className="ml-0.5 opacity-60">{cnt}</span>}</button>;
                        })}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full min-w-[1000px]">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                        <tr className="border-b-2 border-slate-200">
                            <th className="w-8 py-3 px-3" />
                            <SortHeader label="기업명" k="name" w="w-[140px] max-w-[140px]" />
                            <SortHeader label="상태" k="status" w="w-[90px]" />
                            <SortHeader label="위험도" k="risk" w="w-[80px]" />
                            <th className="text-left text-[11px] font-bold py-3 px-3 text-slate-500 w-[70px]">업체담당</th>
                            <th className="text-left text-[11px] font-bold py-3 px-3 text-slate-500 w-[70px]">영업자</th>
                            <th className="text-left text-[11px] font-bold py-3 px-3 text-slate-500 w-[120px]">전화번호</th>
                            <th className="text-left text-[11px] font-bold py-3 px-3 text-slate-500 w-[60px]">전환율</th>
                            <th className="text-left text-[11px] font-bold py-3 px-3 text-slate-500 w-[60px]">이슈</th>
                            <th className="text-left text-[11px] font-bold py-3 px-3 text-slate-500 min-w-[200px]">최근 메모</th>
                            <th className="text-left text-[11px] font-bold py-3 px-3 text-slate-500 w-[160px]">바로가기</th>
                        </tr>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="py-1.5 px-2 border-r border-slate-200/50"></th>
                            <th className="py-1.5 px-2 border-r border-slate-200/50"><input value={colFilters.name} onChange={e => handleColFilterChange('name', e.target.value)} className="w-full px-1.5 py-1 text-[10px] border border-slate-200 rounded outline-none focus:border-indigo-400 bg-white" placeholder="필터..." /></th>
                            <th className="py-1.5 px-2 border-r border-slate-200/50"><input value={colFilters.status} onChange={e => handleColFilterChange('status', e.target.value)} className="w-full px-1.5 py-1 text-[10px] border border-slate-200 rounded outline-none focus:border-indigo-400 bg-white" placeholder="필터..." /></th>
                            <th className="py-1.5 px-2 border-r border-slate-200/50"><input value={colFilters.risk} onChange={e => handleColFilterChange('risk', e.target.value)} className="w-full px-1.5 py-1 text-[10px] border border-slate-200 rounded outline-none focus:border-indigo-400 bg-white" placeholder="필터..." /></th>
                            <th className="py-1.5 px-2 border-r border-slate-200/50"><input value={colFilters.contactName} onChange={e => handleColFilterChange('contactName', e.target.value)} className="w-full px-1.5 py-1 text-[10px] border border-slate-200 rounded outline-none focus:border-indigo-400 bg-white" placeholder="필터..." /></th>
                            <th className="py-1.5 px-2 border-r border-slate-200/50"><input value={colFilters.salesRep} onChange={e => handleColFilterChange('salesRep', e.target.value)} className="w-full px-1.5 py-1 text-[10px] border border-slate-200 rounded outline-none focus:border-indigo-400 bg-white" placeholder="필터..." /></th>
                            <th className="py-1.5 px-2 border-r border-slate-200/50"><input value={colFilters.phone} onChange={e => handleColFilterChange('phone', e.target.value)} className="w-full px-1.5 py-1 text-[10px] border border-slate-200 rounded outline-none focus:border-indigo-400 bg-white" placeholder="필터..." /></th>
                            <th className="py-1.5 px-2 border-r border-slate-200/50"></th>
                            <th className="py-1.5 px-2 border-r border-slate-200/50"></th>
                            <th className="py-1.5 px-2 border-r border-slate-200/50"><input value={colFilters.memo} onChange={e => handleColFilterChange('memo', e.target.value)} className="w-full px-1.5 py-1 text-[10px] border border-slate-200 rounded outline-none focus:border-indigo-400 bg-white" placeholder="필터..." /></th>
                            <th className="py-1.5 px-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {finalFiltered.length === 0 && <tr><td colSpan={10} className="text-center py-16 text-sm text-slate-500"><Phone className="w-6 h-6 mx-auto mb-2 opacity-30" />통화 대상이 없습니다</td></tr>}
                        {finalFiltered.map((c, i) => (
                            <CompanyTableRow key={c.id} c={c} index={i} selectedId={selectedId} activeCallId={activeCallId}
                                lockInfo={getLockInfo(c.id)} myUserId={user?.id}
                                kakaoStatuses={kakaoStatuses} callResult={callResult as any} timer={timer}
                                isRecording={isRecording} sttStatus={sttStatus} waveformData={waveformData}
                                onSelect={selectCompany} onStartCall={startCall} onEndCall={endCall}
                                onCallResult={handleCallResult} onRefresh={refresh} setToast={setToast}
                                onOpenKakao={(co: Company) => { setKakaoTarget(co); setKakaoTemplate(0); }}
                                onOpenContract={(co: Company) => { setContractPreviewTarget(co); }} />
                        ))}
                    </tbody>
                </table>
            </div>

            <CallbackModal show={showCallbackModal} selected={selected} callbackTime={callbackTime} setCallbackTime={setCallbackTime} onClose={() => { setShowCallbackModal(false); setCallbackTime(''); }} onConfirm={confirmCallback} />
            <KakaoModal kakaoTarget={kakaoTarget} kakaoTemplate={kakaoTemplate} setKakaoTemplate={setKakaoTemplate} kakaoSending={kakaoSending}
                setKakaoSending={setKakaoSending} setKakaoTarget={setKakaoTarget} setToast={setToast} />
            {contractPreviewTarget && <ContractPreviewModal company={contractPreviewTarget} setContractPreviewTarget={setContractPreviewTarget}
                onRefresh={refresh} setToast={setToast} />}
        </div>
    );
}
