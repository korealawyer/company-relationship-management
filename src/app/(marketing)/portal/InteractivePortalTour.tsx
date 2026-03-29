'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ChevronRight, ChevronLeft, LayoutDashboard, 
    FileText, MessageSquare, Bot, User, Bell, Search,
    CheckCircle2, Clock, Shield, Sparkles, Folders,
    Scale, Calendar
} from 'lucide-react';

interface InteractivePortalTourProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

const TOUR_STEPS = [
    {
        id: 'timeline',
        title: "한눈에 보는 사건 타임라인",
        description: "진행 중인 모든 사건의 타임라인을 한눈에 확인하세요.",
        targetIndex: 0,
    },
    {
        id: 'status',
        title: "직관적인 진행 상태바",
        description: "복잡한 법률 용어 대신, 직관적인 진행 상태바로 현재 상황을 보여드립니다.",
        targetIndex: 1,
    },
    {
        id: 'documents',
        title: "프리미엄 문서 보관함",
        description: "수십 시간의 이메일 검색은 이제 그만. 모든 서류와 의견서가 이곳에 안전하게 보관됩니다.",
        targetIndex: 2,
    },
    {
        id: 'chat',
        title: "24시간 AI & 전담 변호사",
        description: "궁금한 점이 생겼나요? 24시간 대기하는 AI와 담당 변호사에게 바로 질문하세요.",
        targetIndex: 3,
    }
];

export default function InteractivePortalTour({ isOpen, onClose, onComplete }: InteractivePortalTourProps) {
    const [currentStep, setCurrentStep] = useState(0);

    // Reset step when opened
    useEffect(() => {
        if (isOpen) setCurrentStep(0);
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentStep]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            if (onComplete) onComplete();
            onClose(); // End of tour
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (!isOpen) return null;

    const isActive = (index: number) => currentStep === index;
    const getHighlightedStyle = (index: number) => {
        if (isActive(index)) {
            return 'relative z-30 ring-2 ring-[#c9a84c] scale-[1.03] bg-[#0a0f24] shadow-[0_0_40px_rgba(201,168,76,0.15)]';
        }
        return 'opacity-40 grayscale-[30%] scale-100 bg-white/5';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
                >
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-[#020510]/80 backdrop-blur-md" 
                        onClick={onClose}
                    />

                    {/* Main Modal Container */}
                    <motion.div 
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-[1400px] h-[90vh] bg-[#04091a] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(201,168,76,0.05)]"
                    >
                        {/* ─── Mock Sidebar ─── */}
                        <div className="hidden md:flex w-64 border-r border-white/5 bg-[#030614] flex-col p-6 relative z-10 transition-opacity duration-300">
                            <div className="flex items-center gap-3 mb-12">
                                <Shield className="w-8 h-8 text-[#c9a84c]" />
                                <span className="text-xl font-black tracking-widest text-[#f0f4ff]">IBS<span className="text-[#c9a84c]">.</span></span>
                            </div>
                            
                            <nav className="flex flex-col gap-2 flex-grow">
                                {[
                                    { icon: LayoutDashboard, label: '대시보드', active: true },
                                    { icon: Scale, label: '나의 사건' },
                                    { icon: Folders, label: '문서 보관함' },
                                    { icon: Calendar, label: '일정 관리' },
                                    { icon: MessageSquare, label: '메시지 & AI' }
                                ].map((item, i) => (
                                    <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${item.active ? 'bg-[#c9a84c]/10 text-[#c9a84c]' : 'text-white/40'}`}>
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </div>
                                ))}
                            </nav>

                            <div className="mt-auto px-4 py-4 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mix-blend-luminosity">
                                    <User className="w-5 h-5 text-white/70" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white/90">김대표 대표님</p>
                                    <p className="text-xs text-[#c9a84c]">프리미엄 멤버십</p>
                                </div>
                            </div>
                        </div>

                        {/* ─── Mock Main Content ─── */}
                        <div className="flex-1 flex flex-col relative z-10">
                            {/* Header */}
                            <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#030614]/50">
                                <h1 className="text-2xl font-bold tracking-tight text-[#f0f4ff]">대시보드</h1>
                                <div className="flex items-center gap-4 text-white/40">
                                    <Search className="w-5 h-5" />
                                    <Bell className="w-5 h-5" />
                                </div>
                            </header>

                            {/* Dashboard Grid */}
                            <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar">
                                
                                {/* Left Column: Status & Timeline */}
                                <div className="lg:col-span-2 flex flex-col gap-6">
                                    
                                    {/* [Target 1] Status Bar */}
                                    <div className={`rounded-3xl p-6 border border-white/10 transition-all duration-500 ease-out ${getHighlightedStyle(1)}`}>
                                        <div className="flex justify-between items-end mb-6">
                                            <div>
                                                <div className="text-[#c9a84c] text-xs font-bold tracking-widest mb-1">상태 요약</div>
                                                <h2 className="text-xl font-bold text-white/90">진행 중인 계약 검토건</h2>
                                            </div>
                                            <div className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-bold border border-green-500/20">
                                                순조로움
                                            </div>
                                        </div>
                                        
                                        <div className="relative pt-2 pb-4">
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-[#e8c87a] to-[#c9a84c] w-[65%]" />
                                            </div>
                                            <div className="flex justify-between text-xs text-white/40 mt-3 font-medium">
                                                <span>접수 (완료)</span>
                                                <span className="text-[#c9a84c]">검토 중 (현재)</span>
                                                <span>피드백 전송 (예정)</span>
                                                <span>최종 완료</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* [Target 0] Timeline */}
                                    <div className={`rounded-3xl p-6 border border-white/10 flex-1 transition-all duration-500 ease-out ${getHighlightedStyle(0)}`}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-xl font-bold text-white/90">최근 업데이트 타임라인</h2>
                                            <button className="text-sm text-white/40">전체보기</button>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            {[
                                                { time: '오늘 오전 10:30', title: '계약서 1차 검토 완료', desc: '조항 수정 제안서가 업로드 되었습니다.', icon: CheckCircle2, color: '#4ade80' },
                                                { time: '어제 오후 4:15', title: '상대방 측 의견 접수', desc: '이메일로 접수된 의견서를 확인 중입니다.', icon: Clock, color: '#fb923c' },
                                                { time: '3. 21. (월)', title: '사건 최초 접수', desc: '담당 전담팀 배정이 완료되었습니다.', icon: LayoutDashboard, color: '#c9a84c' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 z-10">
                                                            <item.icon className="w-4 h-4" style={{ color: item.color }} />
                                                        </div>
                                                        {i < 2 && <div className="w-px h-full bg-white/5 -my-2" />}
                                                    </div>
                                                    <div className="pb-6">
                                                        <div className="text-xs text-white/40 mb-1">{item.time}</div>
                                                        <div className="font-bold text-white/90 text-[15px]">{item.title}</div>
                                                        <div className="text-sm text-white/50 mt-1">{item.desc}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Documents & Chat */}
                                <div className="flex flex-col gap-6">
                                    
                                    {/* [Target 2] Documents */}
                                    <div className={`rounded-3xl p-6 border border-white/10 flex-1 transition-all duration-500 ease-out ${getHighlightedStyle(2)}`}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-lg font-bold text-white/90">최근 보관 문서</h2>
                                            <button className="text-sm text-[#c9a84c]">업로드</button>
                                        </div>
                                        <div className="space-y-3">
                                            {[
                                                { name: '근로계약서_수정안.pdf', size: '2.4 MB' },
                                                { name: 'MOU_초안_v2.docx', size: '1.1 MB' },
                                                { name: '법률검토의견서.pdf', size: '3.8 MB' }
                                            ].map((doc, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="text-sm font-semibold truncate text-white/80">{doc.name}</div>
                                                        <div className="text-xs text-white/40">{doc.size}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* [Target 3] Chat */}
                                    <div className={`rounded-3xl p-6 border border-white/10 flex-1 transition-all duration-500 ease-out flex flex-col ${getHighlightedStyle(3)}`}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-lg font-bold text-white/90">빠른 질의응답</h2>
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#4ade80]" />
                                        </div>
                                        
                                        <div className="flex-1 space-y-4 mb-4">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 flex items-center justify-center flex-shrink-0">
                                                    <Bot className="w-4 h-4 text-[#c9a84c]" />
                                                </div>
                                                <div className="bg-white/5 p-3 rounded-2xl rounded-tl-sm text-sm text-white/80 border border-white/5">
                                                    안녕하세요 대표님, 계약 검토건 중 궁금한 점이 있으신가요?
                                                </div>
                                            </div>
                                            <div className="flex gap-3 flex-row-reverse">
                                                <div className="bg-[#c9a84c] text-black p-3 rounded-2xl rounded-tr-sm text-sm font-medium">
                                                    제3조 비밀유지 조항이 적절한지 확인해주세요.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative mt-auto">
                                            <input 
                                                type="text" 
                                                placeholder="메시지를 입력하세요..." 
                                                readOnly
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-sm text-white placeholder-white/30"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c9a84c]">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* ─── Tour Overlay UI ─── */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-[600px]">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={currentStep}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white p-6 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col md:flex-row gap-6 items-center"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#c9a84c] to-[#e8c87a] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg text-black">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="text-[#c9a84c] text-xs font-black tracking-widest mb-1">STEP 0{currentStep + 1}</div>
                                        <h3 className="text-xl font-black text-gray-900 mb-2">{TOUR_STEPS[currentStep].title}</h3>
                                        <p className="text-gray-600 font-medium text-sm leading-relaxed">{TOUR_STEPS[currentStep].description}</p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                            
                            {/* Controls */}
                            <div className="flex items-center justify-between mt-6 px-4">
                                <div className="flex gap-2">
                                    {TOUR_STEPS.map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-[#c9a84c]' : 'w-2 bg-white/20'}`}
                                        />
                                    ))}
                                </div>
                                
                                <div className="flex gap-3">
                                    {currentStep > 0 && (
                                        <button 
                                            onClick={handlePrev}
                                            className="px-6 py-3 rounded-full font-bold text-white hover:bg-white/10 transition-colors border border-white/10 backdrop-blur-md"
                                        >
                                            이전
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleNext}
                                        className="flex items-center gap-2 px-8 py-3 rounded-full font-black text-black transition-transform hover:scale-105 shadow-[0_0_30px_rgba(201,168,76,0.3)]"
                                        style={{ background: 'linear-gradient(135deg, #e8c87a, #c9a84c)' }}
                                    >
                                        {currentStep === TOUR_STEPS.length - 1 ? '투어 종료' : '다음'}
                                        {currentStep !== TOUR_STEPS.length - 1 && <ChevronRight className="w-5 h-5 -mr-1" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Top Right Close */}
                        <button 
                            onClick={onClose}
                            className="absolute top-6 right-6 z-50 w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
