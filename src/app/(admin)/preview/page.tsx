"use client";

import React from "react";

export default function PreviewPage() {
  return (
    <div className="min-h-fit bg-slate-950 p-12 flex flex-col gap-12 items-center font-sans">
      
      {/* 1. Morning Briefing Preview */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl relative">
        <div className="absolute top-4 left-4 bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded">1. 출근 브리핑 (Morning)</div>
        <div className="space-y-6 mt-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-4">
            <span className="text-blue-400 font-semibold tracking-widest text-sm uppercase">Zero-Trust Briefing</span>
          </div>
          <h1 className="text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">
            09:00 AM
          </h1>
          <p className="text-slate-400 text-lg mt-4">영업 사원 일일 목표 브리핑 시스템</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-12 mb-12 text-left">
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-2">어제 달성 통화 건수</p>
            <p className="text-3xl font-bold text-slate-200">75 <span className="text-lg font-normal text-slate-500">건</span></p>
            <p className="text-xs text-slate-500 mt-2">* 시스템 기록 기준 (수기 제외)</p>
          </div>
          <div className="bg-blue-900/20 rounded-2xl p-6 border border-blue-800/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <p className="text-sm text-blue-300 mb-2 font-medium">오늘의 기본 할당량</p>
            <p className="text-3xl font-bold text-blue-400">80 <span className="text-lg font-normal text-blue-500/70">건</span></p>
            <p className="text-xs text-blue-400/70 mt-2 font-medium">유효 통화 기준 달성 필수</p>
          </div>
        </div>

        <button className="w-full bg-blue-600 text-white font-bold text-xl py-5 rounded-2xl flex items-center justify-center gap-2">
          🚀 오늘 업무 시작하기
        </button>
      </div>

      {/* 2. 1:30 PM (Small) */}
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl relative">
        <div className="absolute -top-3 -left-3 bg-red-500 text-white font-bold text-xs px-2 py-1 rounded shadow-lg">2. 오후 1:30 (Small)</div>
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 rounded-t-2xl"></div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 mt-2">중간점검 스코어 (1:30 PM)</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">현재 시점 누적 유효 통화 데이터입니다.</p>
        <div className="mb-6">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">오늘 통화 달성률</span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">15.0%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 w-[15%]"></div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] font-medium text-slate-400">
            <span>현재 12건</span><span>목표 80건</span>
          </div>
        </div>
        <button className="w-full py-2.5 rounded-lg text-white text-sm font-bold bg-slate-900 hover:bg-slate-800 transition-all">🔥 오후 스퍼트 올리러 가기</button>
      </div>

      {/* 3. 3:00 PM (Small) */}
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl relative">
        <div className="absolute -top-3 -left-3 bg-red-500 text-white font-bold text-xs px-2 py-1 rounded shadow-lg">3. 오후 3:00 (Small)</div>
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 rounded-t-2xl"></div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 mt-2">중간점검 스코어 (3:00 PM)</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">현재 시점 누적 유효 통화 데이터입니다.</p>
        <div className="mb-6">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">오늘 통화 달성률</span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">42.5%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 w-[42.5%]"></div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] font-medium text-slate-400">
            <span>현재 34건</span><span>목표 80건</span>
          </div>
        </div>
        <button className="w-full py-2.5 rounded-lg text-white text-sm font-bold bg-slate-900 hover:bg-slate-800 transition-all">📞 즉시 전화기 들기 (수치 채우기)</button>
      </div>

      {/* 4. 5:30 PM (Large) */}
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl relative mb-20">
        <div className="absolute -top-3 -left-3 bg-red-600 text-white font-bold text-xs px-2 py-1 rounded shadow-lg transform rotate-1">4. 퇴근 전 마감 (5:30 PM - Large)</div>
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500 rounded-t-2xl"></div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 mt-2">마감 전 최종 점검 (5:30 PM)</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">금일 마감 전 누적 데이터 통계입니다.</p>
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">오늘 통화 달성률</span>
            <span className="text-lg font-bold text-red-600 dark:text-red-400">72.5%</span>
          </div>
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 w-[72.5%]"></div>
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-slate-400">
            <span>현재 58건</span><span>목표 80건</span>
          </div>
        </div>
        <button className="w-full py-3 rounded-xl text-white font-bold bg-slate-900 hover:bg-slate-800 transition-all text-lg">🏃‍♂️ 퇴근 전 마지막 한 콜이라도 더 하기</button>
      </div>

    </div>
  );
}
