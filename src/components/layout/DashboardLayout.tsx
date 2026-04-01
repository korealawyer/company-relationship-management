'use client';

import React, { useState, useEffect } from 'react';
import DashboardSidebar, { MenuOption } from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import MobileTabBar from './MobileTabBar';
import CommandPalette from './CommandPalette';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'lawyer' | 'litigation' | 'finance' | 'admin' | string;
  menus: MenuOption[];
  activeTab: string;
  onTabChange: (id: string) => void;
  userName: string;
  userEmail: string;
  companyName?: string;
  topRightContent?: React.ReactNode; // For extra buttons on header
}

export default function DashboardLayout({
  children,
  role,
  menus,
  activeTab,
  onTabChange,
  userName,
  userEmail,
  companyName = 'IBS 법률사무소',
  topRightContent,
}: DashboardLayoutProps) {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Command Palette listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar (Desktop) */}
      <DashboardSidebar
        role={role}
        menus={menus}
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        companyName={companyName}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header (Desktop) */}
        <DashboardHeader
          role={role}
          userName={userName}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          openCommandPalette={() => setIsCommandPaletteOpen(true)}
          topRightContent={topRightContent}
        />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto w-full relative pb-16 md:pb-0">
          {/* Main content wrapper with max-width and padding */}
          <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Touch Tab Bar (Mobile) */}
      <MobileTabBar
        role={role}
        menus={menus}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* Command Palette Modal */}
      {isCommandPaletteOpen && (
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={(id: string) => {
            setIsCommandPaletteOpen(false);
            if (menus.find((m) => m.id === id)) {
              onTabChange(id);
            } else {
              // Custom navigation or dispatch event could be handled here
            }
          }}
        />
      )}
    </div>
  );
}
