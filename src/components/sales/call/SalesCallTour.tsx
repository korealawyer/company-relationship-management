// @ts-nocheck
'use client';

import React from 'react';
import { Joyride, Step } from 'react-joyride';
import { motion } from 'framer-motion';

interface SalesCallTourProps {
    run: boolean;
    onClose: () => void;
}

const TOUR_STEPS: Step[] = [
    {
        target: 'body',
        content: (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center p-2">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📞</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">전화 영업 센터 튜토리얼</h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed text-left">
                    전화 영업 센터는 리드 관리부터 실제 통화 기록, 후속 조치까지<br />
                    세일즈의 모든 과정을 하나로 통합한 올인원 워크스페이스입니다.<br /><br />
                    지금부터 세일즈 성공률을 높여줄 핵심 기능들을 안내해 드립니다!
                </p>
            </motion.div>
        ),
        placement: 'center',
    },
    {
        target: '#tour-nav',
        content: (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-1">
                <h3 className="text-base font-black text-indigo-700 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block" />
                    간편한 네비게이션 및 검색
                </h3>
                <ul className="text-sm font-medium text-slate-600 leading-relaxed text-left list-disc list-inside space-y-1">
                    <li><b>빠른 검색</b>: 기업명이나 담당자 이름으로 즉시 대상을 찾을 수 있습니다.</li>
                    <li><b>메뉴 이동</b>: 세일즈 큐(Sales Queue), 견적 계산기 등 세일즈에 필요한 다른 도구로 클릭 한 번에 이동합니다.</li>
                    <li><b>자동화 옵션</b>: '자동배정' 및 '이메일 자동발송' 설정 여부를 상단 메뉴 우측에서 확인할 수 있습니다.</li>
                </ul>
            </motion.div>
        ),
        placement: 'bottom-start',
    },
    {
        target: '#tour-stats',
        content: (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-1">
                <h3 className="text-base font-black text-emerald-600 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block" />
                    핵심 영업 지표 (KPI)
                </h3>
                <ul className="text-sm font-medium text-slate-600 leading-relaxed text-left list-disc list-inside space-y-1">
                    <li><b>대기</b>: 아직 컨택하지 않은 신규 영업 대상 수입니다.</li>
                    <li><b>오늘 영업</b>: 오늘 진행한 총 통화(연결/부재/콜백) 통계입니다.</li>
                    <li><b>고위험</b>: 파싱된 약관 분석 결과 위험 요소가 높은 우선순위 리드입니다.</li>
                    <li><b>푸시 알림</b>: 예약된 콜백 리스트와 업계 관련 주요 뉴스 알림을 통해 영업 타이밍을 잡도록 도와줍니다.</li>
                </ul>
            </motion.div>
        ),
        placement: 'bottom-start',
    },
    {
        target: '#tour-filters',
        content: (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-1">
                <h3 className="text-base font-black text-amber-600 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block" />
                    영업 파이프라인 필터
                </h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed text-left mb-2">
                    현재 영업의 스텝별로 대상자를 모아볼 수 있습니다.
                </p>
                <ul className="text-[13px] font-medium text-slate-600 text-left bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                    <li>🔍 <b>분석완료</b>: 약관 분석만 된 초기 대상자</li>
                    <li>📋 <b>변호사검토</b>: 법무팀에 검토를 넘긴 대상자</li>
                    <li>⚖️ <b>변호사 컨펌</b>: 고객에게 제안할 전문 의견이 확정된 대상자</li>
                    <li>📧 <b>이메일 발송 / 서명완료</b>: 후속 조치가 들어간 리드 상태</li>
                </ul>
            </motion.div>
        ),
        placement: 'top',
    },
    {
        target: '#tour-table',
        content: (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-1">
                <h3 className="text-base font-black text-blue-600 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-blue-500 rounded-full inline-block" />
                    콜 & 액션 테이블
                </h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed text-left mb-2">
                    모든 영업 활동이 실제로 이루어지는 메인 공간입니다.
                </p>
                <ul className="text-sm font-medium text-slate-600 leading-relaxed text-left list-disc list-inside space-y-1">
                    <li><b>원클릭 전화</b>: 통화 버튼을 누르면 상태가 '통화 중'으로 바뀌고 시간이 측정됩니다.</li>
                    <li><b>결과 처리</b>: 통화 종료 시 '연결', '부재', '콜백' 결과를 즉각 기입합니다.</li>
                    <li><b>편의 기능</b>: 클릭 시 법률 검토 결과를 미리 보거나 카카오톡/문자 템플릿(카카오 모달)을 즉시 전송할 수 있습니다.</li>
                    <li><b>메모 즉시 저장</b>: 메모란에 내용을 수정하면 포커스가 빠질 때 자동으로 클라우드에 저장됩니다.</li>
                </ul>
            </motion.div>
        ),
        placement: 'top',
    }
];

export default function SalesCallTour({ run, onClose }: SalesCallTourProps) {
    const handleJoyrideCallback = (data: any) => {
        const { status } = data;
        const finishedStatuses: string[] = ['finished', 'skipped'];

        if (finishedStatuses.includes(status)) {
            onClose();
        }
    };

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous
            disableScrolling={true}
            hideCloseButton
            run={run}
            showProgress
            showSkipButton
            steps={TOUR_STEPS}
            styles={{
                options: {
                    arrowColor: '#ffffff',
                    backgroundColor: '#ffffff',
                    overlayColor: 'rgba(4, 9, 26, 0.65)',
                    primaryColor: '#4f46e5', // Indigo-600
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
                last: '✨ 완료',
                next: '다음',
                skip: '건너뛰기',
            }}
        />
    );
}
