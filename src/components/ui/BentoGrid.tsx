import React from 'react';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  );
}

interface BentoItemProps {
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
  className?: string;
}

export function BentoItem({ children, colSpan = 1, rowSpan = 1, className = '' }: BentoItemProps) {
  // Tailwind dynamic class generation mappings for colSpan and rowSpan
  const colClass = {
    1: 'col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4'
  }[colSpan];

  const rowClass = {
    1: 'row-span-1',
    2: 'md:row-span-2'
  }[rowSpan];

  return (
    <div className={`
      bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden 
      flex flex-col transition-all duration-300 hover:shadow-md
      bg-clip-padding backdrop-filter backdrop-blur-xl bg-opacity-80
      ${colClass} ${rowClass} ${className}
    `}>
      {children}
    </div>
  );
}

// Subcomponents for easy styling within a BentoItem
export function BentoHeader({ title, subtitle, action }: { title: string, subtitle?: string, action?: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50 shrink-0">
      <div>
        <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function BentoContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`p-4 md:p-5 flex-1 relative ${className}`}>
      {children}
    </div>
  );
}
