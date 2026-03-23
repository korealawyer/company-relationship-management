"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MorningBriefingModal } from "./MorningBriefingModal";
import { EveningBriefingModal, BriefingVariant } from "./EveningBriefingModal";
import { getSession } from "@/lib/auth";

interface ZeroTrustContextType {
  initiateLogout: (originalLogoutFn: () => Promise<void> | void) => void;
}

const ZeroTrustContext = createContext<ZeroTrustContextType | null>(null);

export function useZeroTrust() {
  const context = useContext(ZeroTrustContext);
  if (!context) {
    throw new Error("useZeroTrust must be used within a ZeroTrustBriefingProvider");
  }
  return context;
}

export function ZeroTrustBriefingProvider({ children }: { children: React.ReactNode }) {
  const [showEveningModal, setShowEveningModal] = useState(false);
  const [variant, setVariant] = useState<BriefingVariant>('logout');
  const [pendingLogoutFn, setPendingLogoutFn] = useState<(() => Promise<void> | void) | null>(null);
  const [isSales, setIsSales] = useState(false);

  useEffect(() => {
    const checkRole = () => {
      const session = getSession();
      setIsSales(session?.role === 'sales' || session?.role === 'admin' || session?.role === 'super_admin'); 
    };
    checkRole();
    
    const handleStorage = () => checkRole();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!isSales) return;

    const checkTimes = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();

      const today = now.toISOString().split('T')[0];
      const tryTrigger = (targetH: number, targetM: number, v: BriefingVariant) => {
        if (h === targetH && m === targetM) {
          if (!localStorage.getItem(`briefing_shown_${v}_${today}`)) {
            setVariant(v);
            setShowEveningModal(true);
          }
        }
      };

      tryTrigger(13, 30, '1330');
      tryTrigger(15, 0, '1500');
      tryTrigger(17, 30, '1730');
    };

    checkTimes(); // check on mount
    const interval = setInterval(checkTimes, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isSales]);

  const initiateLogout = (originalLogoutFn: () => Promise<void> | void) => {
    if (!isSales) {
      originalLogoutFn();
      return;
    }
    setPendingLogoutFn(() => originalLogoutFn);
    setVariant('logout');
    setShowEveningModal(true);
  };

  const handleConfirmLogout = async () => {
    if (variant !== 'logout') {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`briefing_shown_${variant}_${today}`, 'true');
      setShowEveningModal(false);
      return;
    }

    if (pendingLogoutFn) {
      await pendingLogoutFn();
    }
    setShowEveningModal(false);
  };

  const handleCancelLogout = () => {
    setShowEveningModal(false);
    setPendingLogoutFn(null);
  };

  return (
    <ZeroTrustContext.Provider value={{ initiateLogout }}>
      {children}
      {/* 
        This handles the automatic morning briefing on mount 
        It manages its own state natively based on localStorage.
      */}
      {isSales && <MorningBriefingModal />}
      
      {/* 
        This is triggered vertically from anywhere when initiateLogout is called
      */}
      <EveningBriefingModal 
        isOpen={showEveningModal} 
        variant={variant}
        onConfirm={handleConfirmLogout} 
        onCancel={handleCancelLogout} 
      />
    </ZeroTrustContext.Provider>
  );
}
