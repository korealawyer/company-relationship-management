import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: LucideIcon;
  colorTheme?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'slate';
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  colorTheme = 'violet',
  className = ''
}: KPICardProps) {

  // Color mappings
  const themeStyles = {
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', border: 'border-violet-100' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', border: 'border-cyan-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', border: 'border-amber-100' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-800', iconBg: 'bg-white', iconColor: 'text-slate-500', border: 'border-slate-200' },
  };

  const currentTheme = themeStyles[colorTheme];

  return (
    <div className={`p-5 rounded-2xl border bg-white shadow-sm flex items-start justify-between transition-all duration-300 hover:shadow-md ${currentTheme.border} ${className}`}>
      <div className="space-y-3">
        {/* Title */}
        <h4 className="text-sm font-medium text-slate-500">{title}</h4>
        
        {/* Big Value */}
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold tracking-tight ${currentTheme.text}`}>
            {value}
          </span>
          {subtitle && (
            <span className="text-sm font-medium text-slate-400">{subtitle}</span>
          )}
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-sm ${
              trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-slate-400">전월 대비</span>
          </div>
        )}
      </div>

      {/* Floating Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${currentTheme.iconBg} ${currentTheme.iconColor} ${currentTheme.border}`}>
        <Icon size={24} className="stroke-[2.5px]" />
      </div>
    </div>
  );
}
