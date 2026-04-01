'use client';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, Search, FileText, AlertTriangle, FolderOpen, ChevronRight, Scale, MessageSquare, Users, UserCheck, Gavel, User as UserIcon, TrendingDown, Send, Building, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { type Company } from '@/lib/types';
import { NotificationStore, PendingClientStore } from '@/lib/store';
import { useCompanies } from '@/hooks/useDataLayer';

import { useRequireAuth } from '@/lib/AuthContext';
import { DocumentWidget } from '@/components/DocumentWidget';
import ConsultQueue from '@/components/lawyer/ConsultQueue';
import ConsultManage from '@/components/lawyer/ConsultManage';
import BillingTracker from '@/components/lawyer/BillingTracker';
import ReviewDocList from '@/components/lawyer/ReviewDocList';
import LitigationDashboard from '@/app/(client)/litigation/page';
import PersonalLitigationDashboard from '@/app/(client)/personal-litigation/page';
import UnifiedLitigationTab from './components/UnifiedLitigationTab';
import AttendanceTab from '@/components/AttendanceTab';
import PendingClientsPanel from '@/components/lawyer/PendingClientsPanel';
import SmsTab from '@/components/lawyer/SmsTab';
import MeetingRoomTab from '@/components/lawyer/MeetingRoomTab';
import PermissionDenied from '@/components/common/PermissionDenied';
import { hasPermission, getCurrentUserId } from '@/lib/permissions';

import { LawyerStatsOverview } from './components/LawyerStatsOverview';
import { LawyerFabMenu } from './components/LawyerFabMenu';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MenuOption } from '@/components/layout/DashboardSidebar';

import { usePersonalLitigations } from '@/hooks/useDataLayer';

const RecordingWidget = lazy(() => import('@/components/RecordingWidget'));

export default function LawyerPage() {
    const { loading, authorized } = useRequireAuth(['lawyer']);
    const [tab, setTab] = useState<string>('overview');
    const [search, setSearch] = useState('');
    const [cases, setCases] = useState<Company[]>([]);
    const [selectedDocCompanyId, setSelectedDocCompanyId] = useState<string | null>(null);
    const [showRecWidget, setShowRecWidget] = useState(false);
    const [recWidgetMode, setRecWidgetMode] = useState<'new_client' | 'intake_url'>('new_client');
    const [notifCount, setNotifCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);

    const userId = getCurrentUserId();
    const { companies } = useCompanies();
    const { personalLitigations } = usePersonalLitigations();
    
    const personalLits = React.useMemo(() => personalLitigations.filter((l: any) => l.status !== 'closed'), [personalLitigations]);
    const personalUrgentCount = React.useMemo(() => {
        const today = new Date();
        const sevenDaysLater = new Date(today.getTime() + 7 * 86400000);
        return personalLits.flatMap(l => l.deadlines).filter(d => !d.completed && new Date(d.dueDate) <= sevenDaysLater).length;
    }, [personalLits]);

    useEffect(() => {
        setCases(companies || []);
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
    }, [companies]);

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

    const menus: MenuOption[] = [
        { id: 'overview', label: '대시보드', icon: Scale, badge: assignedCases.length, alert: urgentCount > 0 },
        { id: 'consult', label: '상담 검토', icon: MessageSquare },
        { id: 'pending', label: '대기중(예비고객)', icon: Users, badge: pendingCount, alert: pendingCount > 0 },
        { id: 'consultMgmt', label: '내 상담관리', icon: UserCheck },
        { id: 'litigation', label: '송무사건 관리', icon: Gavel },
        { id: 'billing', label: '청구/미수', icon: TrendingDown },
        { id: 'sms', label: '문자 발송', icon: Send },
        { id: 'meetingRoom', label: '회의실', icon: Building },
        { id: 'contracts', label: '계약서', icon: FileText },
        { id: 'documents', label: '문서함', icon: FolderOpen },
        { id: 'attendance', label: '근태/행선지', icon: CalendarDays },
    ];

    const renderContent = () => {
        switch (tab) {
            case 'consult':
                return <ConsultQueue />;
            case 'pending':
                return <PendingClientsPanel onConfirm={() => setPendingCount(PendingClientStore.count())} />;
            case 'consultMgmt':
                return <ConsultManage />;
            case 'billing':
                return <BillingTracker />;
            case 'overview':
                return (
                    <div className="flex flex-col gap-6 -mt-2">
                        <LawyerStatsOverview 
                            assignedCasesLength={assignedCases.length}
                            urgentCount={urgentCount}
                            reviewedCount={reviewedCount}
                            unreviewedCount={unreviewedCount}
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 rounded-full bg-violet-500" />
                                    <h2 className="text-lg font-black text-slate-800">
                                        검토 대기 문서
                                    </h2>
                                </div>
                                {urgentCount > 0 && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black animate-pulse bg-red-500 text-white shadow-sm shadow-red-500/20">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        긴급 {urgentCount}건
                                    </span>
                                )}
                                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-500">
                                    전체 {assignedCases.length}건
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        value={search} 
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="고객사·사업자번호 검색..." 
                                        className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all bg-white shadow-sm"
                                    />
                                </div>
                                <Link href="/lawyer/privacy-review"
                                    className="hidden sm:flex items-center gap-1.5 text-sm font-bold transition-colors text-slate-400 hover:text-violet-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-violet-200 shadow-sm"
                                >
                                    전체 검토 시작 <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                        <ReviewDocList cases={filtered} />
                    </div>
                );
            case 'contracts':
                return (
                    <div className="flex items-center justify-center flex-col h-full py-20 text-center">
                        <FileText className="w-16 h-16 mx-auto mb-6 text-violet-500" style={{ opacity: 0.4 }} />
                        <p className="text-lg font-bold mb-4 text-slate-500">계약서 검토 대기</p>
                        <Link href="/legal/review">
                            <button className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-bold text-base bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100 transition-colors shadow-sm">
                                계약서 검토 페이지로 <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                );
            case 'documents':
                return (
                    <div className="h-full flex flex-col sm:flex-row gap-6 pb-6">
                        <div className="w-full sm:w-80 flex-shrink-0 bg-white border border-slate-200/60 rounded-2xl overflow-hidden flex flex-col h-[300px] sm:h-[calc(100vh-12rem)] shadow-sm">
                            <div className="p-4 bg-slate-50/50 border-b border-slate-200/60">
                                <h3 className="text-sm font-bold text-slate-700 font-sans">관리 중인 기업</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {cases.map(c => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => setSelectedDocCompanyId(c.id)}
                                        className={`p-4 border-b border-slate-100 flex items-center justify-between cursor-pointer transition-colors ${selectedDocCompanyId === c.id ? 'bg-violet-50 border-l-4 border-l-violet-500' : 'hover:bg-slate-50'}`}
                                    >
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                                            <p className="text-xs mt-1 text-slate-500">{c.biz}</p>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 ${selectedDocCompanyId === c.id ? 'text-violet-500' : 'text-slate-300'}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 h-full min-h-[500px]">
                            {selectedDocCompanyId ? (
                                <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm h-full overflow-hidden">
                                    <DocumentWidget companyId={selectedDocCompanyId} currentUserRole="lawyer" />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-white border border-slate-200/60 rounded-2xl shadow-sm text-slate-400">
                                    <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="text-base font-medium">기업을 선택하면 문서함이 표시됩니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'litigation':
                return <UnifiedLitigationTab />;
            case 'attendance':
                return <AttendanceTab />;
            case 'sms':
                return hasPermission(userId, 'sms_send') ? <SmsTab /> : <PermissionDenied label="SMS 발송" />;
            case 'meetingRoom':
                return hasPermission(userId, 'meeting_room') ? <MeetingRoomTab /> : <PermissionDenied label="회의실" />;
            default:
                return (
                    <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
                        개발 중인 메뉴입니다.
                    </div>
                );
        }
    };

    return (
        <DashboardLayout
            role="lawyer"
            menus={menus}
            activeTab={tab}
            onTabChange={setTab}
            userName="김수현 변호사"
            userEmail="soohyun.kim@ibs.law"
            companyName="IBS 법률사무소"
        >
            {renderContent()}

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
        </DashboardLayout>
    );
}
