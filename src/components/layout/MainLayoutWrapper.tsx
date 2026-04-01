'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import FloatingChatbot from './FloatingChatbot';
import RealtimeNotification from './RealtimeNotification';

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Check if current route is using the new DashboardLayout
  const isDashboardLayout = [
    '/lawyer', 
    '/litigation', 
    '/finance',
    '/personal-litigation'
  ].some(p => pathname?.startsWith(p));

  return (
    <>
      {!isDashboardLayout && <Navbar />}
      <main className={`flex-1 ${!isDashboardLayout ? 'pt-20' : ''} h-full`}>
        {children}
      </main>
      {/* <FloatingChatbot /> */}  {/* TODO: 챗봇 준비 완료 후 주석 해제 */}
      <RealtimeNotification />
    </>
  );
}
