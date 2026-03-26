import React from 'react';
import { Scale, AlertTriangle, CheckCircle2, Clock, CalendarClock, Briefcase } from 'lucide-react';
import { personalStore } from '@/lib/store';

export interface LawyerStatsOverviewProps {
    assignedCasesLength: number;
    urgentCount: number;
    reviewedCount: number;
    unreviewedCount: number;
}

export function LawyerStatsOverview({ assignedCasesLength, urgentCount, reviewedCount, unreviewedCount }: LawyerStatsOverviewProps) {
    const personalLits = React.useMemo(() => personalStore.getAll().filter(l => l.status !== 'closed'), []);
    const personalUrgentCount = React.useMemo(() => {
        const today = new Date();
        const sevenDaysLater = new Date(today.getTime() + 7 * 86400000);
        return personalLits.flatMap(l => l.deadlines).filter(d => !d.completed && new Date(d.dueDate) <= sevenDaysLater).length;
    }, [personalLits]);

    const STATS = [
        { label: '검토 대기', value: assignedCasesLength, color: '#2563eb', bg: '#eff6ff', icon: Scale },
        { label: '긴급 이슈', value: urgentCount, color: '#dc2626', bg: '#fef2f2', icon: AlertTriangle },
        { label: '담당 개인소송', value: personalLits.length, color: '#7c3aed', bg: '#f5f3ff', icon: Briefcase },
        { label: '개인 긴급기일', value: personalUrgentCount, color: '#dc2626', bg: '#fef2f2', icon: CalendarClock },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {STATS.map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className="relative overflow-hidden p-4 sm:p-5 rounded-xl group"
                    style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    {/* 상단 라인 */}
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                            <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        {React.useMemo(() => value > 0 && (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ background: bg, border: `1.5px solid ${color}` }}>
                                <span className="text-[10px] font-black" style={{ color }}>{value}</span>
                            </div>
                        ), [value, bg, color])}
                    </div>
                    <div className="text-2xl sm:text-3xl font-black leading-none mb-1" style={{ color }}>
                        {value}
                    </div>
                    <div className="text-[11px] font-bold" style={{ color: '#64748b' }}>{label}</div>
                </div>
            ))}
        </div>
    );
}
