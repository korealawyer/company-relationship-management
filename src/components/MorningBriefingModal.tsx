"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function MorningBriefingModal() {
  const [show, setShow] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Check if already shown today
    const today = new Date().toISOString().split("T")[0];
    const shownKey = `morning_brief_shown_${today}`;
    
    if (!localStorage.getItem(shownKey)) {
      setShow(true);
    }

    // 2. Setup clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartWork = async () => {
    setIsLoading(true);
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Attempt to record start time in DB
          await supabase.from("attendance").insert({
            user_id: user.id,
          });
        }
      }
    } catch (error) {
      console.error("Failed to record start_time:", error);
    } finally {
      // Always allow them to enter even if DB fails, to prevent hard blocking if offline
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem(`morning_brief_shown_${today}`, "true");
      setShow(false);
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
        
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-4">
            <span className="text-blue-400 font-semibold tracking-widest text-sm uppercase">Zero-Trust Briefing</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">
            {currentTime || "00:00 AM"}
          </h1>
          
          <p className="text-slate-400 text-lg mt-4">영업 사원 일일 목표 브리핑 시스템</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-12 mb-12 text-left">
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-2">어제 달성 통화 건수</p>
            <p className="text-3xl font-bold text-slate-200">0 <span className="text-lg font-normal text-slate-500">건</span></p>
            <p className="text-xs text-slate-500 mt-2">* 시스템 기록 기준 (수기 제외)</p>
          </div>
          <div className="bg-blue-900/20 rounded-2xl p-6 border border-blue-800/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <p className="text-sm text-blue-300 mb-2 font-medium">오늘의 기본 할당량</p>
            <p className="text-3xl font-bold text-blue-400">80 <span className="text-lg font-normal text-blue-500/70">건</span></p>
            <p className="text-xs text-blue-400/70 mt-2 font-medium">유효 통화 기준 달성 필수</p>
          </div>
        </div>

        <button
          onClick={handleStartWork}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl py-5 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="animate-pulse">시스템에 출근 기록 중...</span>
          ) : (
            "🚀 오늘 업무 시작하기"
          )}
        </button>
        <p className="text-xs text-slate-600 mt-6">
          ※ '오늘 업무 시작하기'를 누르면 접속 시간이 기록되며 부정확한 통계 등록은 모니터링 대상이 됩니다.
        </p>
      </div>
    </div>
  );
}
