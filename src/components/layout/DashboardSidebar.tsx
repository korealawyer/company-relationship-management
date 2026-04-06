'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, LogOut, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/auth';
import { useZeroTrust } from '@/components/ZeroTrustBriefingProvider';
export interface MenuOption {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  alert?: boolean;
}

interface DashboardSidebarProps {
  role: string;
  menus: MenuOption[];
  activeTab: string;
  onTabChange: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  companyName: string;
  userName: string;
  userEmail: string;
}

export default function DashboardSidebar({
  role,
  menus,
  activeTab,
  onTabChange,
  isOpen,
  setIsOpen,
  companyName,
  userName,
  userEmail,
}: DashboardSidebarProps) {
  const router = useRouter();
  const { initiateLogout } = useZeroTrust();

  // Determine active color theme based on role
  const getActiveStyles = () => {
    switch (role) {
      case 'lawyer': return 'bg-violet-900/30 border-l-4 border-violet-400 text-violet-100';
      case 'litigation': return 'bg-cyan-900/30 border-l-4 border-cyan-400 text-cyan-100';
      case 'finance': return 'bg-emerald-900/30 border-l-4 border-emerald-400 text-emerald-100';
      default: return 'bg-slate-800 border-l-4 border-[#e8c87a] text-[#e8c87a]';
    }
  };

  const handleLogout = async () => {
    try {
      initiateLogout(async () => {
        await clearSession();
        router.push('/login');
      });
    } catch (e) {
      console.error(e);
      window.location.href = '/login';
    }
  };

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#0f172a] text-slate-400 transition-all duration-300 ease-in-out z-20 shadow-xl ${
        isOpen ? 'w-72' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
        <div className={`flex items-center gap-3 overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-slate-600 shrink-0">
            <span className="text-[#e8c87a] font-bold text-sm">IBS</span>
          </div>
          <span className="font-semibold text-slate-100 whitespace-nowrap tracking-wide truncate">
            {companyName}
          </span>
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors shrink-0 ${!isOpen && 'mx-auto'}`}
          aria-label="Toggle Sidebar"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>



      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <ul className="space-y-1.5 px-3">
          {menus.map((menu) => {
            const isActive = activeTab === menu.id;
            const Icon = menu.icon;
            return (
              <li key={menu.id}>
                <button
                  onClick={() => onTabChange(menu.id)}
                  className={`w-full flex items-center rounded-md transition-all duration-200 group relative ${
                    isActive
                      ? getActiveStyles()
                      : 'hover:bg-slate-800 hover:text-slate-200 border-l-4 border-transparent'
                  } ${isOpen ? 'px-3 py-2.5 gap-3' : 'px-0 py-3 justify-center'}`}
                  title={!isOpen ? menu.label : undefined}
                >
                  <Icon 
                    size={20} 
                    className={`shrink-0 ${isActive ? '' : 'text-slate-500 group-hover:text-slate-300'}`} 
                  />
                  
                  {isOpen && (
                    <span className="text-sm font-medium tracking-wide truncate flex-1 text-left">
                      {menu.label}
                    </span>
                  )}

                  {/* Badges / Alerts */}
                  {isOpen && menu.alert && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                  )}
                  {isOpen && menu.badge && menu.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold shrink-0">
                      {menu.badge > 99 ? '99+' : menu.badge}
                    </span>
                  )}
                  
                  {/* Closed state indicator dot */}
                  {!isOpen && (menu.badge || menu.alert) && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors ${
            isOpen ? 'px-3 py-2.5 gap-3' : 'px-0 py-3 justify-center'
          }`}
          title={!isOpen ? '로그아웃' : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          {isOpen && <span className="text-sm font-medium">로그아웃</span>}
        </button>
      </div>
    </aside>
  );
}
