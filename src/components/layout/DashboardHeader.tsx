'use client';

import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';

interface DashboardHeaderProps {
  role: string;
  userName: string;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openCommandPalette: () => void;
  topRightContent?: React.ReactNode;
}

export default function DashboardHeader({
  role,
  userName,
  isSidebarOpen,
  toggleSidebar,
  openCommandPalette,
  topRightContent,
}: DashboardHeaderProps) {
  
  // Date formatting (e.g., 2026년 3월 31일 화요일)
  const today = new Date();
  const dateStr = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(today);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0 shadow-sm">
      {/* Left side: Mobile menu toggle / Page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu size={22} />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-medium text-slate-500">{dateStr}</h2>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
            환영합니다, <span className="text-slate-900">{userName}</span> 님 {role === 'lawyer' ? '🧑‍⚖️' : role === 'litigation' ? '💼' : '📊'}
          </h1>
        </div>
      </div>

      {/* Right side: Search, Actions, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Command Palette Trigger */}
        <button
          onClick={openCommandPalette}
          className="hidden md:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
        >
          <Search size={16} />
          <span className="hidden lg:inline mr-8">검색어 입력...</span>
          <span className="bg-white border border-slate-300 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest hidden lg:inline">
            ⌘K
          </span>
        </button>
        
        {/* Mobile Search Icon */}
        <button
          onClick={openCommandPalette}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
        >
          <Search size={22} />
        </button>

        {/* Notifications */}
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
          <Bell size={22} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

        {/* Dynamic Context Actions (passed from parent page) */}
        {topRightContent && (
          <div className="pl-2 ml-2 border-l border-slate-200 hidden sm:flex items-center gap-2">
            {topRightContent}
          </div>
        )}
      </div>
    </header>
  );
}
