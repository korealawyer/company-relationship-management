import React, { useState } from 'react';
import LitigationDashboardBase from '@/app/(client)/litigation/LitigationDashboard';
import PersonalLitigationDashboardBase from '@/app/(client)/personal-litigation/PersonalLitigationDashboard';
import { Gavel, User } from 'lucide-react';

export default function UnifiedLitigationTab() {
  const [activeTab, setActiveTab] = useState<'corporate' | 'personal'>('corporate');

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 탭 헤더 */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('corporate')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'corporate' 
              ? 'border-violet-600 text-violet-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Gavel className="w-4 h-4" />
          기업 송무사건
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'personal' 
              ? 'border-violet-600 text-violet-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          개인 송무사건
        </button>
      </div>

      {/* 탭 내용 */}
      <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-slate-200 p-0 overflow-hidden relative">
        {activeTab === 'corporate' ? (
          <LitigationDashboardBase isEmbedded={true} />
        ) : (
          <PersonalLitigationDashboardBase isEmbedded={true} />
        )}
      </div>
    </div>
  );
}
