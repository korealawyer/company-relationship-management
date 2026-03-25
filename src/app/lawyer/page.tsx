'use client';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, Search, FileText, AlertTriangle, FolderOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { store, type Company, NotificationStore, PendingClientStore } from '@/lib/mockStore';

import { useRequireAuth } from '@/lib/AuthContext';
import { DocumentWidget } from '@/components/DocumentWidget';
import ConsultQueue from '@/components/lawyer/ConsultQueue';
import ConsultManage from '@/components/lawyer/ConsultManage';
import BillingTracker from '@/components/lawyer/BillingTracker';
import ReviewDocList from '@/components/lawyer/ReviewDocList';
import LitigationDashboard from '@/app/litigation/page';
import PersonalLitigationDashboard from '@/app/personal-litigation/page';
import AttendanceTab from '@/components/AttendanceTab';
import PendingClientsPanel from '@/components/lawyer/PendingClientsPanel';
import SmsTab from '@/components/lawyer/SmsTab';
import MeetingRoomTab from '@/components/lawyer/MeetingRoomTab';
import PermissionDenied from '@/components/common/PermissionDenied';
import { hasPermission, getCurrentUserId } from '@/lib/permissions';

// Refactored components
import { LawyerSidebar, LawyerMobileTabbar, LawyerTabId, LAWYER_TABS } from './components/LawyerSidebar';
import { LawyerStatsOverview } from './components/LawyerStatsOverview';
import { LawyerFabMenu } from './components/LawyerFabMenu';

const RecordingWidget = lazy(() => import('@/components/RecordingWidget'));

export default function LawyerPage() {
    const { loading, authorized } = useRequireAuth(['lawyer']);
    const [tab, setTab] = useState<LawyerTabId>('overview');
    const [search, setSearch] = useState('');
    const [cases, setCases] = useState<Company[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [selectedDocCompanyId, setSelectedDocCompanyId] = useState<string | null>(null);
    const [showRecWidget, setShowRecWidget] = useState(false);
    const [recWidgetMode, setRecWidgetMode] = useState<'new_client' | 'intake_url'>('new_client');
    const [notifCount, setNotifCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);

    const userId = getCurrentUserId();

    useEffect(() => {
        setCases(store.getAll());
        const refreshCounts = () => {
            setNotifCount(NotificationStore.unreadCount());
            setPendingCount(PendingClientStore.count());
        };
        refreshCounts();
        window.addEventListener('ibs-notif-updated', refreshCounts);
        window.addEventListener('ibs-pending-updated', refreshCounts);
        return () => {
            window.removeEventListener('ibs-notif-updated', refreshCounts);
            window.removeEventListener('ibs-pending-updated', refreshCounts);
        };
    }, []);

    if (loading || !authorized) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 14, color: '#6b7280' }}>로딩 중...</div>
        </div>
    );

    const assignedCases = cases.filter(c => ['assigned', 'reviewing'].includes(c.status));
    const filtered = assignedCases.filter(c => !search || c.name.includes(search) || c.biz.includes(search));
    const urgentCount = assignedCases.filter(c => c.issues.some(i => i.level === 'HIGH' && !i.reviewChecked)).length;
    const reviewedCount = cases.filter(c => c.lawyerConfirmed).length;
    const unreviewedCount = cases.reduce((s, c) => s + c.issues.filter(i => !i.reviewChecked).length, 0);

    return (
        <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
            {/* ── 데스크탑 전용 좌측 사이드바 (확장형) ── */}
            <LawyerSidebar 
                tab={tab} 
                setTab={setTab} 
                assignedCasesLength={assignedCases.length} 
                urgentCount={urgentCount} 
                pendingCount={pendingCount} 
            />

            {/* ── 메인 콘텐츠 (sm: 좌측 사이드바 여백) ── */}
            <div className="sm:pl-48 pt-14 sm:pt-20 flex flex-col" style={{ minHeight: '100vh' }}>
                {/* 헤더 */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid #e5e7eb', background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="font-black text-base sm:text-lg truncate" style={{ color: '#1e293b' }}>
                                {LAWYER_TABS.find(t => t.id === tab)?.label}
                            </h1>
                            <p className="text-xs mt-0.5 font-medium hidden sm:block" style={{ color: '#64748b' }}>IBS 법률사무소 · 변호사 포털</p>
                        </div>
                        {tab === 'overview' && (
                            <div className="flex items-center gap-2">
                                {/* 모바일: 검색 토글 버튼 */}
                                <button
                                    onClick={() => setShowSearch(p => !p)}
                                    className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#64748b' }}
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                                {/* 데스크탑: 항상 표시 */}
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="고객사·사업자번호 검색..." className="hidden sm:block px-4 py-2 rounded-xl outline-none text-sm w-44 lg:w-56"
                                    style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                <Link href="/lawyer/privacy-review"
                                    className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap"
                                    style={{ background: 'linear-gradient(135deg,#60a5fa,#2563eb)', color: '#ffffff' }}>
                                    검토 <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                    {/* 모바일 검색바 (토글) */}
                    {tab === 'overview' && showSearch && (
                        <div className="sm:hidden mt-2">
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="고객사·사업자번호 검색..." className="w-full px-4 py-2 rounded-xl outline-none text-sm"
                                style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }}
                                autoFocus />
                        </div>
                    )}
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 overflow-hidden">
                    {tab === 'consult' ? (
                        <div className="h-full" style={{ height: 'calc(100vh - 8rem)' }}>
                            <ConsultQueue />
                        </div>
                    ) : tab === 'pending' ? (
                        <div className="h-full">
                            <PendingClientsPanel onConfirm={() => setPendingCount(PendingClientStore.count())} />
                        </div>
                    ) : tab === 'consultMgmt' ? (
                        <div className="h-full" style={{ height: 'calc(100vh - 8rem)' }}>
                            <ConsultManage />
                        </div>
                    ) : tab === 'billing' ? (
                        <div className="h-full" style={{ height: 'calc(100vh - 8rem)' }}>
                            <BillingTracker />
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto p-4 sm:p-6">
                            {tab === 'overview' && (
                                <>
                                    <LawyerStatsOverview 
                                        assignedCasesLength={assignedCases.length}
                                        urgentCount={urgentCount}
                                        reviewedCount={reviewedCount}
                                        unreviewedCount={unreviewedCount}
                                    />
                                    {/* 검토 대기 문서 섹션 헤더 */}
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-5 rounded-full" style={{ background: '#1e293b' }} />
                                                <h2 className="text-sm font-black" style={{ color: '#1e293b' }}>
                                                    검토 대기 문서
                                                </h2>
                                            </div>
                                            {urgentCount > 0 && (
                                                <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black animate-pulse"
                                                    style={{ background: '#dc2626', color: '#ffffff' }}>
                                                    <AlertTriangle className="w-3 h-3" />
                                                    긴급 {urgentCount}건
                                                </span>
                                            )}
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                style={{ background: '#f1f5f9', color: '#64748b' }}>
                                                전체 {assignedCases.length}건
                                            </span>
                                        </div>
                                        <Link href="/lawyer/privacy-review"
                                            className="hidden sm:flex items-center gap-1.5 text-xs font-bold transition-colors"
                                            style={{ color: '#94a3b8' }}>
                                            전체 검토 시작 <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                    <ReviewDocList cases={filtered} />
                                </>
                            )}
                            {tab === 'contracts' && (
                                <div className="text-center py-16">
                                    <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#3b82f6', opacity: 0.4 }} />
                                    <p className="font-bold mb-2" style={{ color: '#64748b' }}>계약서 검토 대기</p>
                                    <Link href="/legal/review">
                                        <button className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl font-bold text-sm"
                                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                                            계약서 검토 페이지로 <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </Link>
                                </div>
                            )}
                            
                            {tab === 'documents' && (
                                <div className="h-full flex flex-col sm:flex-row gap-4">
                                    {/* Company List Sidebar */}
                                    <div className="w-full sm:w-64 flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[200px] sm:h-full">
                                        <div className="p-3 bg-gray-50 border-b border-gray-200">
                                            <h3 className="text-sm font-bold text-gray-700">관리 중인 기업</h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            {cases.map(c => (
                                                <div 
                                                    key={c.id} 
                                                    onClick={() => setSelectedDocCompanyId(c.id)}
                                                    className={`p-3 border-b flex items-center justify-between cursor-pointer transition-colors ${selectedDocCompanyId === c.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-800">{c.name}</h4>
                                                        <p className="text-[10px] text-gray-500">{c.biz}</p>
                                                    </div>
                                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Document Widget Area */}
                                    <div className="flex-1 h-full min-h-[400px]">
                                        {selectedDocCompanyId ? (
                                            <DocumentWidget companyId={selectedDocCompanyId} currentUserRole="lawyer" />
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400">
                                                <FolderOpen className="w-12 h-12 mb-3 opacity-20" />
                                                <p className="text-sm">기업을 선택하면 문서함이 표시됩니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {tab === 'litigation' && (
                        <div className="flex-1 p-0 sm:p-2 lg:p-4">
                            <LitigationDashboard isEmbedded={true} />
                        </div>
                    )}
                    {tab === 'personalLit' && (
                        <div className="flex-1 p-0 sm:p-2 lg:p-4">
                            <PersonalLitigationDashboard isEmbedded={true} />
                        </div>
                    )}
                    {tab === 'attendance' && (
                        <div className="flex-1 p-0 sm:p-2 lg:p-4">
                            <AttendanceTab />
                        </div>
                    )}
                    {tab === 'sms' && (
                        hasPermission(userId, 'sms_send') ? (
                            <div className="flex-1 p-0">
                                <SmsTab />
                            </div>
                        ) : <PermissionDenied label="SMS 발송" />
                    )}
                    {tab === 'meetingRoom' && (
                        hasPermission(userId, 'meeting_room') ? (
                            <div className="flex-1 p-0">
                                <MeetingRoomTab />
                            </div>
                        ) : <PermissionDenied label="회의실" />
                    )}
                </div>
            </div>

            {/* ── 🎙️ 녹음 FAB ── */}
            <LawyerFabMenu 
                pendingCount={pendingCount} 
                onRecordNewClient={() => { setRecWidgetMode('new_client'); setShowRecWidget(true); }}
                onRecordIntakeUrl={() => { setRecWidgetMode('intake_url'); setShowRecWidget(true); }}
            />

            {/* ── 🎤 녹음 위젯 모달 ── */}
            <Suspense fallback={null}>
                <AnimatePresence>
                    {showRecWidget && (
                        <RecordingWidget
                            mode={recWidgetMode}
                            onClose={() => setShowRecWidget(false)}
                            userId="lawyer1"
                            userName="김수현 변호사"
                        />
                    )}
                </AnimatePresence>
            </Suspense>

            {/* ── 모바일 전용 하단 탭바 ── */}
            <LawyerMobileTabbar
                tab={tab}
                setTab={setTab}
                assignedCasesLength={assignedCases.length}
                urgentCount={urgentCount}
                pendingCount={pendingCount}
            />
        </div>
    );
}
