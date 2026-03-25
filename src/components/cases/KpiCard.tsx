import React from 'react';

export interface KpiCardProps {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    label: string;
    value: string | number;
    sub: string;
    color: string;
}

export function KpiCard({ icon: Icon, label, value, sub, color }: KpiCardProps) {
    return (
        <div className="p-4 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="text-2xl font-black leading-none" style={{ color }}>{value}</div>
            </div>
            <div className="text-xs font-bold" style={{ color: '#6b7280' }}>{label}</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>{sub}</div>
        </div>
    );
}

export default KpiCard;
