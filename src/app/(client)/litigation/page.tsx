'use client';

import { useState } from 'react';
import LitigationDashboard from './LitigationDashboard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MenuOption } from '@/components/layout/DashboardSidebar';
import { Scale, Gavel, FolderOpen, Calendar } from 'lucide-react';

export default function LitigationPortal() {
    const [tab, setTab] = useState('overview');
    
    const menus: MenuOption[] = [
        { id: 'overview', label: '사건 대시보드', icon: Scale },
        { id: 'my_cases', label: '내 송무사건', icon: Gavel },
        { id: 'documents', label: '기록함', icon: FolderOpen },
        { id: 'calendar', label: '기일 캘린더', icon: Calendar },
    ];

    return (
        <DashboardLayout
            role="litigation"
            menus={menus}
            activeTab={tab}
            onTabChange={setTab}
            userName="최지우 팀장"
            userEmail="jiwoo.choi@ibs.law"
            companyName="IBS 송무지원팀"
        >
            {tab === 'overview' && <div className="-mt-8"><LitigationDashboard isEmbedded={true} /></div>}
            {tab !== 'overview' && (
                <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
                    개발 중인 메뉴입니다.
                </div>
            )}
        </DashboardLayout>
    );
}
