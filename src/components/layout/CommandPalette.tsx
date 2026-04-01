'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Briefcase, User, FileText } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-200">
        
        {/* Search Input Area */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <Search size={22} className="text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 placeholder-slate-400"
            placeholder="검색어를 입력하세요... (사건명, 고객명, 사건번호)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="ml-2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Categories (Tabs) */}
        {!query && (
          <div className="flex px-4 pt-3 pb-2 gap-2 text-xs font-medium text-slate-500">
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full">전체</button>
            <button className="hover:bg-slate-100 px-3 py-1.5 rounded-full transition-colors">사건</button>
            <button className="hover:bg-slate-100 px-3 py-1.5 rounded-full transition-colors">연락처</button>
            <button className="hover:bg-slate-100 px-3 py-1.5 rounded-full transition-colors">문서</button>
          </div>
        )}

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto px-4 py-4 space-y-4">
          
          {/* Default / Recent State */}
          {!query && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">최근 본 항목</h3>
              <ul className="space-y-1">
                <li>
                  <button className="w-full flex items-center p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group">
                    <div className="w-8 h-8 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center mr-3 shrink-0 group-hover:bg-violet-200">
                      <Briefcase size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-slate-700 truncate">(주)놀부NBG - 손해배상 청구</p>
                      <p className="text-xs text-slate-500">어제 열람함</p>
                    </div>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group">
                    <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 shrink-0 group-hover:bg-emerald-200">
                      <User size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-slate-700 truncate">김철수 프로 (테크솔루션)</p>
                      <p className="text-xs text-slate-500">2일 전 열람함</p>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Search Result State (Mock) */}
          {query && (
            <div>
               <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">검색 결과</h3>
               <ul className="space-y-1">
                 <li>
                   <button className="w-full flex items-center p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-left group">
                      <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 shrink-0">
                        <Briefcase size={16} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-2">
                          교촌에프앤비 공정위 조사 대응 <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700">진행중</span>
                        </p>
                        <p className="text-xs text-slate-500">사건 번호: 2026-03-014</p>
                      </div>
                   </button>
                 </li>
                 <li>
                   <button className="w-full flex items-center p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group">
                      <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center mr-3 shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          교촌에프앤비_법률자문계약서_v2.pdf
                        </p>
                        <p className="text-xs text-slate-500">문서 • 1시간 전 수정됨</p>
                      </div>
                   </button>
                 </li>
               </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-white border shadow-sm rounded px-1 min-w-[20px] text-center">↑</kbd><kbd className="bg-white border shadow-sm rounded px-1 min-w-[20px] text-center">↓</kbd> 이동</span>
            <span className="flex items-center gap-1"><kbd className="bg-white border shadow-sm rounded px-1 min-w-[36px] text-center">Enter</kbd> 선택</span>
            <span className="flex items-center gap-1"><kbd className="bg-white border shadow-sm rounded px-1 min-w-[32px] text-center">ESC</kbd> 닫기</span>
          </div>
        </div>
      </div>
    </div>
  );
}
