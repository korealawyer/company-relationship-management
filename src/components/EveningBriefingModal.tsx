"use client";

import React, { useState, useEffect } from "react";
// import { supabase } from "@/lib/supabase";

export type BriefingVariant = 'logout' | '1330' | '1500' | '1730';

interface EveningBriefingModalProps {
  isOpen: boolean;
  variant: BriefingVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EveningBriefingModal({ isOpen, variant, onConfirm, onCancel }: EveningBriefingModalProps) {
  const [actualCalls, setActualCalls] = useState(0);
  const targetCalls = 80;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchCallData = async () => {
        setIsLoading(true);
        try {
          const { supabase } = await import('@/lib/supabase');
          
          // Get start of today
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          
          if (!supabase) return;
          
          const { count, error } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .gte('lastCallAt', startOfToday.toISOString());
            
          if (error) throw error;
          
          setActualCalls(count || 0);
        } catch (error) {
          console.error('Failed to fetch call stats:', error);
          setActualCalls(0);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCallData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercentage = Math.min(100, (actualCalls / targetCalls) * 100);
  const isGoalMet = actualCalls >= targetCalls;
  const remainingCalls = targetCalls - actualCalls;
  
  const isSmall = variant === '1330' || variant === '1500';
  
  // Custom texts depending on variant
  let title, description, buttonText;
  
  if (variant === 'logout') {
    title = "업무 종료 최종 스코어";
    description = "오늘의 최종 시스템 통계입니다. 목표 달성률을 확인 후 퇴근을 눌러주세요.";
    buttonText = isGoalMet ? '✨ 기분 좋게 퇴근하기' : '확인 후 퇴근하기';
  } else if (variant === '1330') {
    title = "중간점검 스코어 (1:30 PM)";
    description = "현재 시점 누적 유효 통화 데이터입니다.";
    buttonText = isGoalMet ? '👍 여유롭게 오후 일정 시작하기' : '🔥 오후 스퍼트 올리러 가기';
  } else if (variant === '1500') {
    title = "중간점검 스코어 (3:00 PM)";
    description = "현재 시점 누적 유효 통화 데이터입니다.";
    buttonText = isGoalMet ? '💪 현재 페이스 완벽하게 유지하기' : '📞 즉시 전화기 들기 (수치 채우기)';
  } else { // 1730
    title = "마감 전 최종 점검 (5:30 PM)";
    description = "금일 마감 전 누적 데이터 통계입니다.";
    buttonText = isGoalMet ? '🙌 달성의 기쁨 누리기' : '🏃‍♂️ 퇴근 전 마지막 한 콜이라도 더 하기';
  }

  const isMidday = variant === '1330' || variant === '1500';

  // Wrapper classes for non-blocking vs full-screen overlay
  const wrapperClass = isMidday 
    ? "fixed bottom-8 right-8 z-[100] w-full max-w-[420px] pointer-events-none" 
    : "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200";

  const cardClass = isMidday
    ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] pointer-events-auto relative overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500"
    : "w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300";

  return (
    <div className={wrapperClass}>
      <div className={cardClass}>
        
        {/* Dynamic header colored based on goal met */}
        <div className={`absolute top-0 left-0 w-full h-2 ${isGoalMet ? 'bg-green-500' : 'bg-red-500'}`}></div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          {description}
        </p>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Custom Tailwind Progress Bar */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  오늘 통화 달성률
                </span>
                <span className={`text-lg font-bold ${isGoalMet ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${isGoalMet ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs font-medium text-slate-400">
                <span>현재 {actualCalls}건</span>
                <span>목표 {targetCalls}건</span>
              </div>
            </div>

            <div className={`flex ${isMidday ? 'flex-col gap-2 pt-2' : 'gap-3'} pt-2`}>
              {variant === 'logout' && (
                <button 
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  계속 업무하기
                </button>
              )}
              
              <button 
                onClick={onConfirm}
                className={`flex-1 py-4 px-4 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] shadow-md ${isGoalMet ? 'bg-slate-900 dark:bg-white dark:text-slate-900' : variant === 'logout' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
              >
                {buttonText}
              </button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
