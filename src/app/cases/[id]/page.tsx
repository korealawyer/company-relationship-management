'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { store, LitigationCase, LIT_STATUS_LABEL, LIT_STATUS_COLOR } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Bell, Mail, MessageSquare, Clock, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';

export default function CaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const caseId = params.id as string;
    
    const [caseData, setCaseData] = useState<LitigationCase | null>(null);
    const { settings, setSettings, isSaving, saveSettings } = useNotificationSettings(caseId);

    useEffect(() => {
        if (!caseId) return;
        const c = store.getLitById(caseId);
        if (c) {
            setCaseData(c);
        }
    }, [caseId]);

    const handleSave = async () => {
        if (!caseData) return;
        const success = await saveSettings();
        if (success) {
            alert('알림 설정이 성공적으로 저장되었습니다.');
        } else {
            alert('알림 설정 저장에 실패했습니다.');
        }
    };

    if (!caseData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
                <p className="text-gray-500 font-medium animate-pulse">사건 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f7f4] pt-24 pb-20 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* ── 헤더 ── */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> 뒤로 가기
                    </button>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                    {caseData.caseNo}
                                </span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                    style={{ background: LIT_STATUS_COLOR[caseData.status] || '#111827', color: '#ffffff' }}>
                                    {LIT_STATUS_LABEL[caseData.status] || '알 수 없음'}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 mb-2 leading-tight">
                                vs {caseData.opponent}
                            </h1>
                            <p className="text-gray-600 font-medium">담당: {caseData.assignedLawyer} · {caseData.court}</p>
                        </div>
                    </div>
                </motion.div>

                {/* ── 알림 설정 제어 패널 ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="border-none shadow-xl overflow-hidden rounded-3xl" style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="bg-white p-6 sm:p-10">
                            
                            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: 'linear-gradient(135deg, #1f2937, #111827)' }}>
                                    <Bell className="w-6 h-6" style={{ color: '#c9a84c' }} />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-gray-900">맞춤형 알림 설정</h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">본 사건의 진행 상황과 기일 알림을 어떻게 받을지 선택하세요.</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                                
                                {/* 수신 채널 설정 */}
                                <div className="space-y-4 sm:space-y-6">
                                    <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">수신 채널</h3>
                                    
                                    <label className="flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2" 
                                        style={{ borderColor: settings.notifyEmail ? '#111827' : '#f3f4f6', background: settings.notifyEmail ? '#f9fafb' : '#fff' }}
                                        onClick={() => setSettings(s => ({ ...s, notifyEmail: !s.notifyEmail }))}>
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: settings.notifyEmail ? '#111827' : '#f3f4f6' }}>
                                                <Mail className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: settings.notifyEmail ? '#fff' : '#9ca3af' }} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm sm:text-base text-gray-900">이메일 알림</p>
                                                <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">중요 문서 및 공식 리포트 수신</p>
                                            </div>
                                        </div>
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                                            style={{ borderColor: settings.notifyEmail ? '#111827' : '#d1d5db', background: settings.notifyEmail ? '#111827' : 'transparent' }}>
                                            {settings.notifyEmail && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
                                        </div>
                                    </label>

                                    <label className="flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2" 
                                        style={{ borderColor: settings.notifyKakao ? '#FEE500' : '#f3f4f6', background: settings.notifyKakao ? '#fffee6' : '#fff' }}
                                        onClick={() => setSettings(s => ({ ...s, notifyKakao: !s.notifyKakao }))}>
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: settings.notifyKakao ? '#FEE500' : '#f3f4f6' }}>
                                                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: settings.notifyKakao ? '#374151' : '#9ca3af' }} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm sm:text-base text-gray-900">카카오톡 알림</p>
                                                <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">실시간 기일 안내 및 간편 브리핑</p>
                                            </div>
                                        </div>
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                                            style={{ borderColor: settings.notifyKakao ? '#d97706' : '#d1d5db', background: settings.notifyKakao ? '#FEE500' : 'transparent' }}>
                                            {settings.notifyKakao && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" />}
                                        </div>
                                    </label>
                                </div>

                                {/* 수신 빈도 설정 */}
                                <div className="space-y-4 sm:space-y-6">
                                    <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">수신 빈도</h3>
                                    
                                    <div className="space-y-3">
                                        {[
                                            { id: 'immediate', label: '실시간 (추천)', desc: '변동사항 발생 시 즉시 알림' },
                                            { id: 'daily', label: '일간 요약', desc: '매일 오후 6시 일괄 브리핑' },
                                            { id: 'weekly', label: '주간 리포트', desc: '매주 금요일 주간 통합 리포트' }
                                        ].map(freq => (
                                            <label key={freq.id} className="flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2"
                                                style={{ borderColor: settings.frequency === freq.id ? '#111827' : '#f3f4f6', background: settings.frequency === freq.id ? '#f9fafb' : '#fff' }}
                                                onClick={() => setSettings(s => ({ ...s, frequency: freq.id as any }))}
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: settings.frequency === freq.id ? '#111827' : '#f3f4f6' }}>
                                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: settings.frequency === freq.id ? '#c9a84c' : '#9ca3af' }} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm sm:text-base text-gray-900">{freq.label}</p>
                                                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">{freq.desc}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${settings.frequency === freq.id ? 'border-gray-900' : 'border-gray-300'}`}>
                                                    {settings.frequency === freq.id && <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gray-900" />}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end">
                                <Button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    variant="premium" size="lg" className="rounded-2xl gap-2 font-black shadow-xl hover:shadow-2xl transition-all h-14 w-full sm:w-auto px-10 text-base sm:text-lg" 
                                    style={{ background: 'linear-gradient(135deg, #111827, #374151)' }}>
                                    <Save className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#c9a84c' }} />
                                    {isSaving ? '저장 중...' : '알림 설정 저장'}
                                </Button>
                            </div>

                        </div>
                    </Card>
                </motion.div>

            </div>
        </div>
    );
}