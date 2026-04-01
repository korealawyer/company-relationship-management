'use client';

import React from 'react';
import { MenuOption } from './DashboardSidebar';

interface MobileTabBarProps {
  role: string;
  menus: MenuOption[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function MobileTabBar({
  role,
  menus,
  activeTab,
  onTabChange,
}: MobileTabBarProps) {
  // Take only the first 4-5 items for the mobile tab bar to avoid clutter
  const displayMenus = menus.slice(0, 5);

  const getActiveColor = () => {
    switch (role) {
      case 'lawyer': return 'text-violet-600 bg-violet-50';
      case 'litigation': return 'text-cyan-600 bg-cyan-50';
      case 'finance': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-indigo-600 bg-indigo-50';
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 pb-safe">
      <div className="flex justify-around items-center h-full px-1">
        {displayMenus.map((menu) => {
          const isActive = activeTab === menu.id;
          const Icon = menu.icon;

          return (
            <button
              key={menu.id}
              onClick={() => onTabChange(menu.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 rounded-lg transition-colors ${
                isActive ? getActiveColor() : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <Icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                {menu.alert && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-tight ${isActive ? 'font-bold' : ''}`}>
                {menu.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
