'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MenuOption } from '@/components/layout/DashboardSidebar';
import { DollarSign, PieChart, CreditCard, Receipt, FileText } from 'lucide-react';
import FinanceStatsView from './components/FinanceStatsView';

export default function FinancePortal() {
    const [tab, setTab] = useState('overview');
    
    // 에메랄드 테마를 기본으로 하는 회계/재무 포털 메뉴 구성
    const menus: MenuOption[] = [
        { id: 'overview', label: '재무 대시보드', icon: PieChart },
        { id: 'payments', label: '수납 관리', icon: DollarSign },
        { id: 'expenses', label: '지출 관리', icon: CreditCard },
        { id: 'invoice', label: '세금계산서', icon: Receipt },
        { id: 'reports', label: '결산 보고서', icon: FileText },
    ];

    const renderContent = () => {
        switch (tab) {
            case 'overview':
                return (
                    <div className="max-w-6xl mx-auto space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-6 rounded-full bg-emerald-500" />
                            <h2 className="text-xl font-black text-slate-800">
                                월간 재무 현황
                            </h2>
                        </div>
                        <FinanceStatsView />
                    </div>
                );
            case 'payments':
                return (
                    <div className="flex items-center justify-center flex-col h-[60vh] text-center">
                        <DollarSign className="w-16 h-16 mx-auto mb-6 text-emerald-500" style={{ opacity: 0.4 }} />
                        <h2 className="text-xl font-bold mb-2 text-slate-800">수납 관리 내역</h2>
                        <p className="text-slate-500">Supabase finance_payments 테이블과 연동될 화면입니다.</p>
                    </div>
                );
            case 'expenses':
                return (
                    <div className="flex items-center justify-center flex-col h-[60vh] text-center">
                        <CreditCard className="w-16 h-16 mx-auto mb-6 text-red-500" style={{ opacity: 0.4 }} />
                        <h2 className="text-xl font-bold mb-2 text-slate-800">지출 관리 내역</h2>
                        <p className="text-slate-500">Supabase finance_expenses 테이블과 연동될 화면입니다.</p>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center justify-center h-[60vh] text-slate-400 font-medium">
                        개발 중인 메뉴입니다.
                    </div>
                );
        }
    };

    return (
        <DashboardLayout
            role="finance"
            menus={menus}
            activeTab={tab}
            onTabChange={setTab}
            userName="박지민 팀장"
            userEmail="jimin.park@ibs.law"
            companyName="IBS 경영지원팀"
        >
            {renderContent()}
        </DashboardLayout>
    );
}
