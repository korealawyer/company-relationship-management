import React from 'react';
import { Scale, MessageSquare, Users, UserCheck, Gavel, User, TrendingDown, Send, Building, FileText, FolderOpen, CalendarDays } from 'lucide-react';
import { personalStore } from '@/lib/mockStore';

export const LAWYER_TABS = [
    { id: 'overview' as const, label: '검토 대기', icon: Scale },
    { id: 'consult' as const, label: '상담 검토', icon: MessageSquare },
    { id: 'pending' as const, label: '대기중', icon: Users },
    { id: 'consultMgmt' as const, label: '내 상담관리', icon: UserCheck },
    { id: 'litigation' as const, label: '기업 송무사건', icon: Gavel },
    { id: 'personalLit' as const, label: '개인 송무사건', icon: User },
    { id: 'billing' as const, label: '청구/미수', icon: TrendingDown },
    { id: 'sms' as const, label: '문자 발송', icon: Send },
    { id: 'meetingRoom' as const, label: '회의실', icon: Building },
    { id: 'contracts' as const, label: '계약서', icon: FileText },
    { id: 'documents' as const, label: '문서함', icon: FolderOpen },
    { id: 'attendance' as const, label: '근태/행선지', icon: CalendarDays },
];

export type LawyerTabId = typeof LAWYER_TABS[number]['id'];

export interface LawyerSidebarProps {
    tab: LawyerTabId;
    setTab: (t: LawyerTabId) => void;
    assignedCasesLength: number;
    urgentCount: number;
    pendingCount: number;
}

export function LawyerSidebar({ tab, setTab, assignedCasesLength, urgentCount, pendingCount }: LawyerSidebarProps) {
    const personalLits = React.useMemo(() => personalStore.getAll().filter(l => l.status !== 'closed'), []);
    const personalUrgentCount = React.useMemo(() => {
        const today = new Date();
        const sevenDaysLater = new Date(today.getTime() + 7 * 86400000);
        return personalLits.flatMap(l => l.deadlines).filter(d => !d.completed && new Date(d.dueDate) <= sevenDaysLater).length;
    }, [personalLits]);

    return (
        <div className="hidden sm:flex fixed top-20 left-0 bottom-0 w-48 flex-col gap-2 py-6 px-3 z-40"
            style={{ background: '#ffffff', borderRight: '1px solid #e5e7eb', boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>
            {LAWYER_TABS.map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setTab(id as LawyerTabId)} title={label}
                    className="relative w-full h-11 px-3 rounded-xl flex items-center justify-start gap-3 transition-all group"
                    style={{ background: tab === id ? '#eff6ff' : 'transparent', color: tab === id ? '#2563eb' : '#64748b', border: tab === id ? '1px solid #bfdbfe' : '1px solid transparent' }}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-bold truncate group-hover:text-[#2563eb] transition-colors">{label}</span>
                    {id === 'overview' && assignedCasesLength > 0 && (
                        <span className="ml-auto w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0"
                            style={{ background: urgentCount > 0 ? '#dc2626' : '#3b82f6', color: '#ffffff' }}>
                            {assignedCasesLength}
                        </span>
                    )}
                    {id === 'pending' && pendingCount > 0 && (
                        <span className="ml-auto w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0"
                            style={{ background: '#ef4444', color: '#ffffff' }}>
                            {pendingCount}
                        </span>
                    )}
                    {id === 'personalLit' && personalUrgentCount > 0 && (
                        <span className="ml-auto w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0"
                            style={{ background: '#dc2626', color: '#ffffff' }}>
                            {personalUrgentCount}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

export function LawyerMobileTabbar({ tab, setTab, assignedCasesLength, urgentCount, pendingCount }: LawyerSidebarProps) {
    const personalLits = React.useMemo(() => personalStore.getAll().filter(l => l.status !== 'closed'), []);
    const personalUrgentCount = React.useMemo(() => {
        const today = new Date();
        const sevenDaysLater = new Date(today.getTime() + 7 * 86400000);
        return personalLits.flatMap(l => l.deadlines).filter(d => !d.completed && new Date(d.dueDate) <= sevenDaysLater).length;
    }, [personalLits]);

    return (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex overflow-x-auto hide-scrollbar"
            style={{ background: '#ffffff', borderTop: '1px solid #e5e7eb', boxShadow: '0 -2px 12px rgba(0,0,0,0.08)' }}>
            {LAWYER_TABS.map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setTab(id as LawyerTabId)}
                    className="flex-shrink-0 w-16 flex flex-col items-center gap-1 py-2.5 relative"
                    style={{ color: tab === id ? '#2563eb' : '#94a3b8' }}>
                    <div className="relative">
                        <Icon className="w-5 h-5" />
                        {id === 'overview' && assignedCasesLength > 0 && (
                            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                                style={{ background: urgentCount > 0 ? '#dc2626' : '#3b82f6', color: '#ffffff' }}>
                                {assignedCasesLength}
                            </span>
                        )}
                        {id === 'pending' && pendingCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                                style={{ background: '#ef4444', color: '#ffffff' }}>
                                {pendingCount}
                            </span>
                        )}
                        {id === 'personalLit' && personalUrgentCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                                style={{ background: '#dc2626', color: '#ffffff' }}>
                                {personalUrgentCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold">{label}</span>
                    {tab === id && (
                        <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full" style={{ background: '#3b82f6' }} />
                    )}
                </button>
            ))}
        </div>
    );
}
