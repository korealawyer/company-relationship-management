'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, ArrowRight, ArrowLeft, CheckCircle2, Users,
    Building2, Calendar, Scale, Send, Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

const TEMPLATES = [
    { id: 'franchise', name: '가맹 계약서', desc: '가맹사업법 준수 표준 가맹계약서', icon: '🏪', color: '#6366f1' },
    { id: 'privacy', name: '개인정보 위탁 계약', desc: '개인정보 처리위탁에 관한 표준 계약서', icon: '🔒', color: '#10b981' },
    { id: 'service', name: '서비스 이용 계약', desc: '법률 자문 서비스 이용에 관한 계약서', icon: '⚖️', color: '#f59e0b' },
    { id: 'nda', name: '비밀유지 계약(NDA)', desc: '영업 비밀 및 기밀 정보 보호 계약서', icon: '🤐', color: '#8b5cf6' },
    { id: 'employment', name: '근로 계약서', desc: '근로기준법 준수 표준 근로계약서', icon: '👔', color: '#ef4444' },
    { id: 'custom', name: '직접 작성', desc: '템플릿 없이 직접 내용을 입력합니다', icon: '✏️', color: '#64748b' },
];

const STEPS = ['템플릿 선택', '당사자 정보', '조건 설정', '최종 확인'];

export default function NewContractPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [template, setTemplate] = useState('');
    const [partyA, setPartyA] = useState({ name: '', bizNo: '', rep: '', address: '' });
    const [partyB, setPartyB] = useState({ name: '', bizNo: '', rep: '', address: '' });
    const [startDate, setStartDate] = useState('');
    const [duration, setDuration] = useState('12');
    const [aiReview, setAiReview] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const canNext = () => {
        if (step === 0) return !!template;
        if (step === 1) return partyA.name && partyB.name;
        return true;
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        router.push('/contracts');
    };

    return (
        <div className="min-h-screen py-8 px-4" style={{ background: T.bg }}>
            <div className="max-w-3xl mx-auto">

                {/* 헤더 */}
                <h1 className="text-2xl font-black flex items-center gap-2 mb-2" style={{ color: T.heading }}>
                    <FileText className="w-6 h-6" style={{ color: '#6366f1' }} />
                    새 계약서 작성
                </h1>

                {/* 단계 표시 */}
                <div className="flex items-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center"
                                    style={{
                                        background: i <= step ? '#6366f1' : T.borderSub,
                                        color: i <= step ? '#fff' : T.muted,
                                    }}>
                                    {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                                </div>
                                <span className="text-xs font-bold hidden sm:block" style={{ color: i <= step ? T.body : T.faint }}>{s}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className="flex-1 h-0.5 rounded" style={{ background: i < step ? '#6366f1' : T.borderSub }} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* 스텝 본문 */}
                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="p-6 rounded-2xl mb-6" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>

                        {/* Step 0: 템플릿 선택 */}
                        {step === 0 && (
                            <>
                                <h2 className="font-black text-base mb-4" style={{ color: T.heading }}>계약서 템플릿을 선택하세요</h2>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {TEMPLATES.map(t => (
                                        <button key={t.id} onClick={() => setTemplate(t.id)}
                                            className="p-4 rounded-xl text-left transition-all"
                                            style={{
                                                background: template === t.id ? `${t.color}08` : T.bg,
                                                border: `1.5px solid ${template === t.id ? t.color : T.border}`,
                                            }}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xl">{t.icon}</span>
                                                <span className="text-sm font-bold" style={{ color: T.heading }}>{t.name}</span>
                                            </div>
                                            <p className="text-xs" style={{ color: T.muted }}>{t.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Step 1: 당사자 정보 */}
                        {step === 1 && (
                            <>
                                <h2 className="font-black text-base mb-4" style={{ color: T.heading }}>당사자 정보를 입력하세요</h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {[
                                        { label: '갑 (甲)', data: partyA, set: setPartyA, icon: Building2, color: '#6366f1' },
                                        { label: '을 (乙)', data: partyB, set: setPartyB, icon: Users, color: '#f59e0b' },
                                    ].map(({ label, data, set, icon: Icon, color }) => (
                                        <div key={label}>
                                            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5" style={{ color }}>
                                                <Icon className="w-4 h-4" /> {label}
                                            </h3>
                                            {[
                                                { key: 'name', ph: '회사명 / 성명', lb: '이름' },
                                                { key: 'bizNo', ph: '000-00-00000', lb: '사업자번호' },
                                                { key: 'rep', ph: '대표자명', lb: '대표자' },
                                                { key: 'address', ph: '주소', lb: '주소' },
                                            ].map(({ key, ph, lb }) => (
                                                <div key={key} className="mb-2">
                                                    <label className="text-[10px] font-bold" style={{ color: T.muted }}>{lb}</label>
                                                    <input value={data[key as keyof typeof data]}
                                                        onChange={e => set({ ...data, [key]: e.target.value })}
                                                        placeholder={ph}
                                                        className="w-full px-3 py-2 rounded-lg text-sm mt-0.5"
                                                        style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.body }} />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Step 2: 조건 설정 */}
                        {step === 2 && (
                            <>
                                <h2 className="font-black text-base mb-4" style={{ color: T.heading }}>계약 조건을 설정하세요</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold flex items-center gap-1 mb-1.5" style={{ color: T.muted }}>
                                            <Calendar className="w-3 h-3" /> 계약 시작일
                                        </label>
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                            className="px-3 py-2 rounded-lg text-sm"
                                            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.body }} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold mb-1.5 block" style={{ color: T.muted }}>계약 기간</label>
                                        <select value={duration} onChange={e => setDuration(e.target.value)}
                                            className="px-3 py-2 rounded-lg text-sm"
                                            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.body }}>
                                            <option value="6">6개월</option>
                                            <option value="12">12개월</option>
                                            <option value="24">24개월</option>
                                            <option value="36">36개월</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                                        <div className="flex items-center gap-2">
                                            <Scale className="w-4 h-4" style={{ color: '#6366f1' }} />
                                            <div>
                                                <p className="text-sm font-bold" style={{ color: T.heading }}>AI 법률 검토</p>
                                                <p className="text-xs" style={{ color: T.muted }}>계약서를 AI가 법적 위험 요소를 분석합니다</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setAiReview(!aiReview)}
                                            className="w-10 h-6 rounded-full flex-shrink-0"
                                            style={{ background: aiReview ? '#4ade80' : T.borderSub }}>
                                            <div className="w-4 h-4 rounded-full bg-white shadow"
                                                style={{ marginLeft: aiReview ? 20 : 4, marginTop: 4, transition: 'margin 0.2s' }} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 3: 최종 확인 */}
                        {step === 3 && (
                            <>
                                <h2 className="font-black text-base mb-4" style={{ color: T.heading }}>최종 확인</h2>
                                <div className="space-y-3">
                                    {[
                                        { label: '템플릿', value: TEMPLATES.find(t => t.id === template)?.name ?? '-' },
                                        { label: '갑 (甲)', value: partyA.name || '-' },
                                        { label: '을 (乙)', value: partyB.name || '-' },
                                        { label: '시작일', value: startDate || '미정' },
                                        { label: '기간', value: `${duration}개월` },
                                        { label: 'AI 검토', value: aiReview ? '✅ 활성화' : '❌ 비활성화' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                            <span className="text-sm font-bold" style={{ color: T.muted }}>{label}</span>
                                            <span className="text-sm font-bold" style={{ color: T.heading }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* 네비게이션 버튼 */}
                <div className="flex justify-between">
                    <button onClick={() => step > 0 ? setStep(step - 1) : router.push('/contracts')}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body }}>
                        <ArrowLeft className="w-4 h-4" /> {step === 0 ? '취소' : '이전'}
                    </button>
                    {step < 3 ? (
                        <button onClick={() => setStep(step + 1)} disabled={!canNext()}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity"
                            style={{
                                background: canNext() ? '#6366f1' : T.borderSub,
                                color: canNext() ? '#fff' : T.muted,
                            }}>
                            다음 <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={submitting}
                            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-black"
                            style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> 생성 중...</> : <><Send className="w-4 h-4" /> 계약서 생성</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
