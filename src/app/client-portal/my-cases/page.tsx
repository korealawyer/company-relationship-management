'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, ChevronLeft, MapPin, Calendar, Clock, Bell, CheckCircle2, User } from 'lucide-react';
import { personalStore, PersonalLitigation } from '@/lib/store';

const formatMoney = (n: number) => n >= 100000000 ? `${(n / 100000000).toFixed(1)}억` : n >= 10000 ? `${(n / 10000).toFixed(0)}만원` : `${n.toLocaleString()}원`;

export default function ClientPortalMyCasesPage() {
    const [caseData, setCaseData] = useState<PersonalLitigation | null>(null);

    useEffect(() => {
        const allCases = personalStore.getAll();
        const activeCase = allCases.find(c => c.status !== 'closed') || allCases[0];
        setCaseData(activeCase);
    }, []);

    if (!caseData) return <div className="min-h-screen flex items-center justify-center bg-indigo-50"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

    const stages = [
        { key: 'filed', label: '소장접수' },
        { key: 'hearing', label: '1차변론' },
        { key: 'judgment', label: '판결' }
    ];

    const currentStageIndex = caseData.status === 'preparing' || caseData.status === 'consulting' ? -1 : 
                              caseData.status === 'filed' ? 0 : 
                              caseData.status === 'judgment' || caseData.status === 'appeal' || caseData.status === 'enforcing' || caseData.status === 'closed' ? 2 : 1;

    const upcomingDeadlines = caseData.deadlines?.filter(d => !d.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) || [];
    const nextDeadline = upcomingDeadlines.length > 0 ? upcomingDeadlines[0] : null;

    return (
        <div className="min-h-screen bg-[#f8faff] text-slate-800 font-sans pb-20 sm:pb-8">
            <header className="bg-indigo-600 text-white rounded-b-3xl shadow-lg shadow-indigo-200 px-5 pt-12 pb-6 sticky top-0 z-40">
                <div className="max-w-md mx-auto relative">
                    <button className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all">
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="text-center">
                        <p className="text-indigo-100 text-xs font-bold tracking-widest uppercase mb-1">{caseData.caseNo}</p>
                        <h1 className="text-xl font-black">{caseData.clientName} 의뢰인님,</h1>
                        <p className="text-indigo-100 text-sm mt-0.5 font-medium">{caseData.assignedLawyer}가 사건을 전담하고 있습니다.</p>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-5 pt-6 space-y-6">
                
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-50">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold mb-2">{caseData.type}</span>
                            <h2 className="text-lg font-black text-slate-900 leading-tight">상대방: {caseData.opponent}</h2>
                            <p className="text-xs text-slate-500 mt-1">{caseData.court} 관할</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                            <Scale className="w-5 h-5" />
                        </div>
                    </div>
                    {caseData.claimAmount > 0 && (
                        <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100">
                            <span className="text-xs font-bold text-slate-500">청구금액</span>
                            <span className="text-sm font-black text-indigo-700">{formatMoney(caseData.claimAmount)}</span>
                        </div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20"></div>
                    <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>사건 진행 현황
                    </h3>
                    
                    <div className="relative">
                        <div className="absolute top-4 left-4 right-4 h-1 bg-slate-100 rounded-full">
                            <motion.div 
                                className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: currentStageIndex <= 0 ? "0%" : currentStageIndex === 1 ? "50%" : "100%" }}
                                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                            />
                        </div>

                        <div className="flex justify-between relative z-10 px-2">
                            {stages.map((stage, idx) => {
                                const isCompleted = idx < currentStageIndex;
                                const isCurrent = idx === currentStageIndex;
                                const stageColor = isCompleted ? 'bg-indigo-600 text-white' : isCurrent ? 'bg-white border-2 border-indigo-600 text-indigo-600' : 'bg-white border-2 border-slate-200 text-slate-300';
                                return (
                                    <div key={stage.key} className="flex flex-col items-center bg-white z-10">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${stageColor} shadow-sm`}>
                                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                        </div>
                                        <span className={`text-[10px] font-bold mt-2 transition-colors ${isCurrent ? 'text-indigo-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>{stage.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {caseData.status === 'hearing' && (
                        <div className="mt-6 p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-2">
                            <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /></div>
                            <p className="text-xs font-medium text-indigo-900 leading-relaxed">
                                현재 변론이 진행 중입니다. 법원 일정에 맞추어 서면을 준비하고 있습니다.
                            </p>
                        </div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h3 className="text-sm font-black text-slate-800 mb-3 ml-1 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>다음 기일 안내
                    </h3>
                    {nextDeadline ? (
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200/50 relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-5 rounded-full blur-xl"></div>
                            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-indigo-400 opacity-20 rounded-full blur-lg"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-200" />
                                        <span className="text-[10px] font-bold text-indigo-100">{nextDeadline.label}</span>
                                        {nextDeadline.isFixed && <span className="ml-1 text-[9px] px-1 py-0.5 bg-red-500/80 text-white rounded font-bold">불변</span>}
                                    </div>
                                    <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm"><Bell className="w-4 h-4 text-white" /></div>
                                </div>
                                
                                <h4 className="text-3xl font-black mb-1">{nextDeadline.dueDate ? new Date(nextDeadline.dueDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : '일정 미정'}</h4>
                                <p className="text-indigo-200 text-xs font-medium mb-5">{nextDeadline.dueDate ? new Date(nextDeadline.dueDate).toLocaleDateString('ko-KR', { weekday: 'short' }) + '요일, ' : ''}{caseData.court}</p>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="bg-white text-indigo-600 hover:bg-slate-50 transition-colors py-2.5 rounded-xl text-xs font-bold w-full flex items-center justify-center shadow-sm">
                                        <MapPin className="w-3.5 h-3.5 mr-1" /> 길찾기
                                    </button>
                                    <button className="bg-indigo-700/50 hover:bg-indigo-700 transition-colors text-white border border-indigo-400/30 py-2.5 rounded-xl text-xs font-bold w-full flex items-center justify-center">
                                        <Calendar className="w-3.5 h-3.5 mr-1" /> 캘린더 추가
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-indigo-50">
                            <Clock className="w-8 h-8 text-indigo-200 mx-auto mb-2" />
                            <p className="text-sm font-bold text-slate-600">예정된 기일이 없습니다.</p>
                            <p className="text-xs text-slate-400 mt-1">일정이 업데이트되면 안내해 드립니다.</p>
                        </div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-50">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">전담 법률팀</h3>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                            <User className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-slate-800">{caseData.assignedLawyer}</p>
                            <p className="text-[10px] text-slate-500 font-medium">IBS 법률사무소 담당 변호사</p>
                        </div>
                        <button className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 22.621l-3.521-6.795c-.008.004-1.974.97-2.064 1.011-2.24 1.086-6.799-7.82-4.609-8.994l2.083-1.022-3.498-6.82-2.106 1.039c-1.684.83-3.346 6.836 2.396 11.623 5.34 4.492 11.234 1.487 13.564-.326l-2.245-1.111v-.005zm-6.68-19.167c2.618.36 4.706 2.457 5.056 5.086l2.164-.298c-.46-3.66-3.266-6.476-6.922-6.953l-.298 2.165zm-2.091 2.22c1.472.248 2.657 1.442 2.895 2.923l2.09-.344c-.347-2.39-2.222-4.275-4.641-4.669l-.344 2.09z"/></svg>
                        </button>
                    </div>
                </motion.div>

            </main>
        </div>
    );
}
