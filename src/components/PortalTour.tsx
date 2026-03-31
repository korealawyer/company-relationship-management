// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Joyride, Step } from 'react-joyride';
import { motion } from 'framer-motion';

import { getBrowserSupabase } from '@/lib/supabase';

const TOUR_STEPS: Step[] = [
    {
        target: 'body',
        content: (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center p-2">
                <h3 className="text-lg font-black text-slate-900 mb-2">환영합니다!</h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    IBS 클라이언트 포털에 오신 것을 환영합니다.<br />
                    앞으로 고객님의 모든 법무를 가장 빠르고 투명하게<br />
                    관리해 드리겠습니다.
                </p>
            </motion.div>
        ),
        placement: 'center',
    },
    {
        target: '#tour-summary',
        content: (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-1">
                <h3 className="text-base font-black text-indigo-700 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block" />
                    핵심 요약 정보
                </h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    현재 진행 중인 사건과 핵심 요약 정보를<br />
                    가장 먼저 확인하실 수 있습니다.
                </p>
            </motion.div>
        ),
        placement: 'top',
    },
    {
        target: '#tour-timeline',
        content: (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-1">
                <h3 className="text-base font-black text-amber-600 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block" />
                    실시간 진행 타임라인
                </h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    가장 궁금해하시는 '지금 어디까지 진행됐지?'에 대한 답입니다.<br />
                    담당 변호사가 실시간으로 진행 상황을 업데이트합니다.
                </p>
            </motion.div>
        ),
        placement: 'bottom',
    },
    {
        target: '#tour-team',
        content: (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-1">
                <h3 className="text-base font-black text-emerald-600 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block" />
                    전담 로펌 데스크
                </h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    고객님만을 위한 전담 파트너 변호사와 전문팀입니다.<br />
                    언제든 다이렉트로 메시지를 보내주세요.
                </p>
            </motion.div>
        ),
        placement: 'left',
    },
    {
        target: 'body',
        content: (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-2">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">프리미엄 법무 관리</h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    투어가 완료되었습니다.<br />
                    이제 IBS의 프리미엄 법무 관리를 경험해 보세요.
                </p>
            </motion.div>
        ),
        placement: 'center',
    }
];

export function PortalTour() {
    const [isMounted, setIsMounted] = useState(false);
    const [run, setRun] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        
        const initTour = async () => {
            const supabase = getBrowserSupabase();
            let hasSeen = false;

            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                hasSeen = !!user?.user_metadata?.hasSeenPortalTour;
            } else {
                hasSeen = !!localStorage.getItem('hasSeenPortalTour');
            }

            if (!hasSeen) {
                // Add a small delay for page rendering before starting
                const timer = setTimeout(() => {
                    setRun(true);
                    
                    // Mark as seen immediately
                    if (supabase) {
                        supabase.auth.updateUser({
                            data: { hasSeenPortalTour: true }
                        });
                    }
                    localStorage.setItem('hasSeenPortalTour', 'true');
                }, 1000);
                
                return () => clearTimeout(timer);
            }
        };

        initTour();
    }, []);

    if (!isMounted) return null;

    const handleJoyrideCallback = (data: any) => {
        const { status } = data;
        const finishedStatuses: string[] = ['finished', 'skipped'];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem('hasSeenPortalTour', 'true');
        }
    };

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous
            hideCloseButton
            run={run}
            scrollToFirstStep
            showProgress
            showSkipButton
            steps={TOUR_STEPS}
            styles={{
                options: {
                    arrowColor: '#ffffff',
                    backgroundColor: '#ffffff',
                    overlayColor: 'rgba(4, 9, 26, 0.65)',
                    primaryColor: '#1e3a8a', // Deep indigo/blue
                    textColor: '#1e293b',
                    zIndex: 1000,
                },
                tooltip: {
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                },
                buttonNext: {
                    backgroundColor: '#111827',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    padding: '10px 20px',
                    outline: 'none',
                },
                buttonBack: {
                    color: '#64748b',
                    marginRight: '12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    outline: 'none',
                },
                buttonSkip: {
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    outline: 'none',
                },
            } as any}
            locale={{
                back: '이전',
                close: '닫기',
                last: '✨ 바로 시작하기',
                next: '다음',
                skip: '건너뛰기',
            }}
        />
    );
}
