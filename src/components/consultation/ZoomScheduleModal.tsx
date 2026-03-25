import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar as CalendarIcon, Clock, User, Building, 
  Mail, Phone, MessageSquare, ChevronRight, ChevronLeft, 
  CheckCircle2, FileText, Loader2, Video
} from 'lucide-react';

interface ZoomScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4;

const consultationTypes = [
  { id: 'corporate', label: '기업 자문', icon: Building, description: '기업 운영 전반에 걸친 법률 자문' },
  { id: 'contract', label: '계약서 검토', icon: FileText, description: '국문/영문 계약서 검토 및 수정' },
  { id: 'dispute', label: '일반 분쟁', icon: MessageSquare, description: '민사/상사 등 일반 법적 분쟁' },
];

const timeSlots = ['10:00', '10:30', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function ZoomScheduleModal({ isOpen, onClose }: ZoomScheduleModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomUrl, setZoomUrl] = useState<string>('');

  // Form State
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    inquiry: '',
  });

  const resetForm = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setFormData({ name: '', phone: '', email: '', company: '', inquiry: '' });
    setZoomUrl('');
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetForm, 300);
  };

  const nextStep = () => {
    setDirection(1);
    setStep((prev) => (prev < 3 ? prev + 1 : prev) as Step);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => (prev > 1 ? prev - 1 : prev) as Step);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Calculate datetime for `scheduled_at`
      let scheduled_at = new Date().toISOString();
      if (selectedDate && selectedTime) {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const dt = new Date(selectedDate);
        dt.setHours(hours, minutes, 0, 0);
        scheduled_at = dt.toISOString();
      }

      const response = await fetch('/api/zoom/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: formData.name,
          client_email: formData.email,
          client_phone: formData.phone,
          company_name: formData.company,
          consultation_type: consultationTypes.find(t => t.id === selectedType)?.label || '일반 분쟁',
          scheduled_at
        }),
      });
      const result = await response.json();
      
      if (!response.ok) {
        alert(`예약 실패: ${result.error || result.details || '서버 오류'}`);
        return;
      }
      
      setZoomUrl(result.data?.zoom_join_url || '');
      setDirection(1);
      setStep(4);
    } catch (error: any) {
      alert(`예약 중 네트워크 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate next 7 days
  const today = new Date();
  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1); // Start from tomorrow
    return d;
  });

  const getDayName = (date: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const isStep1Valid = selectedType !== null;
  const isStep2Valid = selectedDate !== null && selectedTime !== null;
  const isStep3Valid = formData.name.trim() !== '' && formData.phone.trim() !== '' && formData.email.trim() !== '';

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const renderTimeline = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((s, idx) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center relative">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300
                ${step === s 
                  ? 'bg-[#c9a84c] text-black shadow-[0_0_15px_rgba(201,168,76,0.5)]' 
                  : step > s 
                    ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/50' 
                    : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
            >
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            <span className={`absolute -bottom-5 text-xs whitespace-nowrap ${step === s ? 'text-[#c9a84c]' : 'text-gray-500'}`}>
              {s === 1 ? '상담 유형' : s === 2 ? '일자 및 시간' : '정보 입력'}
            </span>
          </div>
          {idx < 2 && (
            <div className={`w-16 h-[2px] mx-2 self-center -mt-4 transition-colors duration-300 ${step > s ? 'bg-[#c9a84c]/50' : 'bg-gray-800'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl overflow-hidden bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#c9a84c]/10 rounded-lg">
                  <Video className="w-6 h-6 text-[#c9a84c]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">화상(Zoom) 상담 예약</h2>
                  <p className="text-sm text-gray-400">맞춤형 법률 자문을 위한 일정을 선택해주세요.</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 transition-colors rounded-full hover:text-white hover:bg-gray-800 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="relative flex-1 overflow-x-hidden overflow-y-auto">
              {step < 4 && (
                <div className="pt-6 pb-2">
                  {renderTimeline()}
                </div>
              )}

              <div className="relative px-6 pb-6 w-full">
                <AnimatePresence mode="wait" custom={direction}>
                  
                  {/* STEP 1: Consultation Type */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="w-full"
                    >
                      <h3 className="mb-6 text-lg font-medium text-white">어떤 상담이 필요하신가요?</h3>
                      <div className="space-y-4">
                        {consultationTypes.map((type) => {
                          const Icon = type.icon;
                          const isSelected = selectedType === type.id;
                          return (
                            <button
                              key={type.id}
                              onClick={() => setSelectedType(type.id)}
                              className={`w-full flex items-center p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer group
                                ${isSelected 
                                  ? 'bg-[#c9a84c]/10 border-[#c9a84c] shadow-[0_0_15px_rgba(201,168,76,0.15)] transform scale-[1.02]' 
                                  : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'}`}
                            >
                              <div className={`p-3 rounded-lg mr-4 ${isSelected ? 'bg-[#c9a84c]/20 text-[#c9a84c]' : 'bg-gray-800 text-gray-400 group-hover:text-gray-300'}`}>
                                <Icon className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-semibold ${isSelected ? 'text-[#c9a84c]' : 'text-gray-200'}`}>{type.label}</h4>
                                <p className="text-sm text-gray-400 mt-1">{type.description}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                ${isSelected ? 'border-[#c9a84c]' : 'border-gray-600'}`}
                              >
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#c9a84c]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Date & Time */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="w-full"
                    >
                      <h3 className="mb-6 text-lg font-medium text-white flex items-center">
                        <CalendarIcon className="w-5 h-5 mr-2 text-[#c9a84c]" />
                        편하신 날짜를 선택해주세요
                      </h3>
                      
                      {/* Date Picker (Horizontal Scroll) */}
                      <div className="flex space-x-3 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {next7Days.map((date, idx) => {
                          const isSelected = selectedDate && isSameDay(selectedDate, date);
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedDate(date);
                                setSelectedTime(null); // Reset time when date changes
                              }}
                              className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[88px] rounded-xl border transition-all duration-200
                                ${isSelected 
                                  ? 'bg-[#c9a84c] text-zinc-900 border-[#c9a84c] shadow-[0_0_15px_rgba(201,168,76,0.3)]' 
                                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-500 hover:text-gray-200'}`}
                            >
                              <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-zinc-800' : 'text-gray-500'}`}>{getDayName(date)}</span>
                              <span className="text-2xl font-bold">{date.getDate()}</span>
                            </button>
                          );
                        })}
                      </div>

                      <AnimatePresence>
                        {selectedDate && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <h3 className="mb-4 text-lg font-medium text-white flex items-center">
                              <Clock className="w-5 h-5 mr-2 text-[#c9a84c]" />
                              시간을 선택해주세요
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                              {timeSlots.map((time) => {
                                const isSelected = selectedTime === time;
                                return (
                                  <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                                      ${isSelected 
                                        ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#c9a84c] shadow-[0_0_15px_rgba(201,168,76,0.15)]' 
                                        : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-500'}`}
                                  >
                                    {time}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* STEP 3: Client Info */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="w-full"
                    >
                      <h3 className="mb-6 text-lg font-medium text-white">상담에 필요한 정보를 입력해주세요</h3>
                      
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 flex items-center">
                              <User className="w-4 h-4 mr-1.5" /> 이름 <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="홍길동"
                              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 flex items-center">
                              <Phone className="w-4 h-4 mr-1.5" /> 연락처 <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="010-0000-0000"
                              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 flex items-center">
                              <Mail className="w-4 h-4 mr-1.5" /> 이메일 <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="example@company.com"
                              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 flex items-center">
                              <Building className="w-4 h-4 mr-1.5" /> 회사명 <span className="text-gray-600 ml-1 font-normal">(선택)</span>
                            </label>
                            <input
                              type="text"
                              name="company"
                              value={formData.company}
                              onChange={handleInputChange}
                              placeholder="(주)회사명"
                              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400 flex items-center">
                            <FileText className="w-4 h-4 mr-1.5" /> 사전 문의 내용 <span className="text-gray-600 ml-1 font-normal">(선택)</span>
                          </label>
                          <textarea
                            name="inquiry"
                            value={formData.inquiry}
                            onChange={handleInputChange}
                            placeholder="상담하실 내용을 자유롭게 작성해주세요."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent transition-all resize-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: Success */}
                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="w-full flex flex-col items-center justify-center text-center pb-8 pt-4"
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
                        className="w-20 h-20 bg-[#c9a84c]/20 rounded-full flex items-center justify-center mb-6 border border-[#c9a84c]/30 shadow-[0_0_30px_rgba(201,168,76,0.3)]"
                      >
                        <CheckCircle2 className="w-10 h-10 text-[#c9a84c]" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-2">예약이 확정되었습니다</h3>
                      <div className="mb-8 max-w-[80%] mx-auto space-y-3">
                        <p className="text-gray-400">
                          {zoomUrl 
                            ? "아래 링크를 통해 예약된 시간에 Zoom 회의에 바로 접속하실 수 있습니다."
                            : "입력해주신 이메일과 연락처로 Zoom 회의 링크 및 상담 안내를 보내드립니다."}
                        </p>
                        {zoomUrl && (
                          <div className="bg-white/5 border border-[#c9a84c]/30 rounded-lg p-3 break-all">
                            <a href={zoomUrl} target="_blank" rel="noreferrer" className="text-[#c9a84c] text-sm hover:underline">
                              {zoomUrl}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="w-full bg-gray-800/40 border border-gray-700 rounded-xl p-5 mb-8 text-left space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">상담 날짜</span>
                          <span className="font-medium text-white">
                            {selectedDate?.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} {selectedTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">상담 유형</span>
                          <span className="font-medium text-[#c9a84c]">
                            {consultationTypes.find(t => t.id === selectedType)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">예약자</span>
                          <span className="font-medium text-white">{formData.name}님</span>
                        </div>
                      </div>

                      <button
                        onClick={handleClose}
                        className="w-full py-4 px-6 bg-[#c9a84c] hover:bg-[#b0923f] text-zinc-900 font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(201,168,76,0.39)] hover:shadow-[0_6px_20px_rgba(201,168,76,0.23)] hover:-translate-y-0.5 active:translate-y-0"
                      >
                        확인
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Navigation */}
            {step < 4 && (
              <div className="p-6 border-t border-gray-800 bg-gray-900/80 backdrop-blur-md relative z-10">
                <div className="flex justify-between items-center">
                  <button
                    onClick={prevStep}
                    className={`flex items-center px-4 py-2 text-sm font-medium transition-colors rounded-lg
                      ${step === 1 ? 'invisible' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                  </button>
                  
                  {step < 3 ? (
                    <button
                      onClick={nextStep}
                      disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                      className={`flex items-center px-6 py-2.5 text-sm font-bold rounded-lg transition-all
                        ${(step === 1 ? isStep1Valid : isStep2Valid)
                          ? 'bg-[#c9a84c] text-zinc-900 hover:bg-[#b0923f] shadow-[0_0_15px_rgba(201,168,76,0.2)]' 
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                    >
                      다음 <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!isStep3Valid || isSubmitting}
                      className={`flex items-center px-8 py-2.5 text-sm font-bold rounded-lg transition-all
                        ${isStep3Valid && !isSubmitting
                          ? 'bg-[#c9a84c] text-zinc-900 hover:bg-[#b0923f] shadow-[0_0_15px_rgba(201,168,76,0.2)]' 
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 처리중...
                        </>
                      ) : (
                        '예약 확정하기'
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
