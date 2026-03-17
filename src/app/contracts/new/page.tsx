'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, ArrowLeft, Send, CheckCircle2,
    Building2, User, Calendar, Shield, Upload,
    PenTool, AlertTriangle, Clock, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

/* ── 계약서 유형 ─────────────────────────────────────────── */
const CONTRACT_TYPES = [
    { id: 'advisory', label: '법률자문 계약서', icon: '⚖️', desc: '월간 법률자문 서비스 계약', color: '#c9a84c' },
    { id: 'franchise', label: '가맹계약서', icon: '🏪', desc: '프랜차이즈 가맹 계약', color: '#2563eb' },
    { id: 'nda', label: '비밀유지계약서 (NDA)', icon: '🔐', desc: '영업비밀 및 기밀정보 보호', color: '#7c3aed' },
    { id: 'service', label: '서비스 이용 계약서', icon: '📋', desc: 'SaaS 서비스 이용 약정', color: '#059669' },
    { id: 'employment', label: '근로계약서', icon: '👔', desc: '표준 근로계약 및 취업규칙', color: '#d97706' },
    { id: 'custom', label: '기타 (직접 작성)', icon: '✏️', desc: '자유 양식으로 작성', color: '#6b7280' },
];

/* ── 주요 조항 템플릿 ─────────────────────────────────────── */
const CLAUSE_TEMPLATES: Record<string, string> = {
    advisory: `제1조 (자문의 범위)
을은 갑에게 다음의 법률자문 서비스를 제공한다.
1. 개인정보처리방침 검토 및 수정 자문
2. 가맹계약서 법률 검토
3. 노동법 관련 자문
4. 기업 일반 법률 상담

제2조 (자문료)
월간 자문료는 금 ___________원(부가가치세 별도)으로 하며, 
매월 말일에 청구한다.

제3조 (계약기간)
본 계약의 유효기간은 ____년 __월 __일부터 1년간으로 하며,
어느 일방이 해지를 통보하지 않는 한 동일 조건으로 자동 갱신된다.

제4조 (비밀유지)
을은 자문 과정에서 알게 된 갑의 비밀정보를 제3자에게 누설하지 않으며,
본 계약 종료 후에도 비밀유지 의무를 준수한다.`,
    franchise: `제1조 (가맹사업의 개요)
본 계약은 갑(가맹본부)이 을(가맹점사업자)에게 영업표지 사용권 및 
영업 노하우를 제공하고, 을이 이에 대한 대가를 지급하는 것을 내용으로 한다.

제2조 (가맹금)
가입비: 금 ___________원 (부가가치세 별도)
보증금: 금 ___________원
로열티: 월 매출의 ___%

제3조 (영업지역)
을의 영업지역은 ___________ 일대로 하며, 
갑은 해당 영업지역 내에 동일 브랜드의 가맹점을 추가로 개설하지 않는다.

제4조 (계약기간)
본 계약의 유효기간은 계약일로부터 __년간으로 한다.`,
    nda: `제1조 (비밀정보의 정의)
"비밀정보"란 본 계약에 따라 일방 당사자가 상대방에게 공개하는 
기술적, 사업적, 재정적 정보 일체를 말한다.

제2조 (비밀유지 의무)
수령 당사자는 비밀정보를 본 계약의 목적 이외에 사용하지 아니하며,
사전 서면 동의 없이 제3자에게 공개하지 아니한다.

제3조 (유효기간)
비밀유지 의무는 본 계약 종료 후 __년간 존속한다.`,
    service: `제1조 (서비스 내용)
회사는 이용자에게 클라우드 기반 법률관리 시스템(SaaS)을 제공한다.

제2조 (이용료)
월 이용료: 금 ___________원 (부가가치세 별도)
결제일: 매월 계약일에 자동 결제

제3조 (서비스 수준)
가용성 SLA: 99.9% 업타임 보장
데이터 보호: AES-256 암호화, 일일 자동 백업

제4조 (해지)
이용자는 30일 전 통보하여 해지할 수 있으며, 위약금은 없다.`,
    employment: `제1조 (근무 내용)
직위: ___________
업무: ___________

제2조 (근로계약기간)
____년 __월 __일부터 ____년 __월 __일까지

제3조 (근무시간)
주 40시간 (1일 8시간), 09:00~18:00 (휴게시간 12:00~13:00)

제4조 (임금)
월급: 금 ___________원 (세전)
상여금: 연 ___%`,
    custom: `[계약서 제목]

제1조 (목적)
본 계약은 ...을 목적으로 한다.

제2조 (계약 내용)


제3조 (계약기간)


제4조 (기타사항)

`,
};

/* ── 메인 페이지 ─────────────────────────────────────────── */
export default function NewContractPage() {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [step, setStep] = useState<'type' | 'info' | 'edit' | 'done'>('type');
    const [form, setForm] = useState({
        partyA: '', partyABiz: '', partyAContact: '',
        partyB: '법률사무소 IBS', partyBContact: '대표 변호사 김수현',
        startDate: '', endDate: '',
    });
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const selectedContract = CONTRACT_TYPES.find(t => t.id === selectedType);

    const handleTypeSelect = (id: string) => {
        setSelectedType(id);
        setContent(CLAUSE_TEMPLATES[id] || '');
        setStep('info');
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 2000));
        setStep('done');
        setSubmitting(false);
    };

    // 완료 화면
    if (step === 'done') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#04091a' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center rounded-3xl p-10"
                    style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(13,27,62,0.8))',
                        border: '2px solid rgba(34,197,94,0.3)',
                        boxShadow: '0 0 80px rgba(34,197,94,0.1)',
                    }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
                        <CheckCircle2 className="w-20 h-20 mx-auto mb-6" style={{ color: '#4ade80' }} />
                    </motion.div>
                    <h2 className="text-2xl font-black mb-2" style={{ color: '#4ade80' }}>서명 요청 발송 완료!</h2>
                    <p className="text-sm mb-2" style={{ color: '#f0f4ff' }}>
                        {selectedContract?.label} 계약서가 생성되었습니다
                    </p>
                    <p className="text-xs mb-6" style={{ color: 'rgba(240,244,255,0.4)' }}>
                        {form.partyA || '상대방'}에게 전자서명 요청 이메일이 발송되었습니다
                    </p>
                    <div className="rounded-xl p-4 mb-6"
                        style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span style={{ color: 'rgba(240,244,255,0.5)' }}>계약서 번호</span>
                                <span className="font-bold" style={{ color: '#e8c87a' }}>IBS-CTR-2026-{String(Math.floor(Math.random() * 9000) + 1000)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: 'rgba(240,244,255,0.5)' }}>상태</span>
                                <span className="font-bold" style={{ color: '#d97706' }}>서명 대기 중</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Link href="/contracts">
                            <button className="w-full py-3 rounded-xl font-bold text-sm btn-gold">
                                계약서 목록으로 이동
                            </button>
                        </Link>
                        <button onClick={() => { setStep('type'); setSelectedType(null); }}
                            className="w-full py-3 rounded-xl font-bold text-sm"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            새 계약서 작성
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: '#04091a' }}>
            <div className="max-w-3xl mx-auto">

                {/* 헤더 */}
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/contracts">
                        <button className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg"
                            style={{ color: 'rgba(240,244,255,0.6)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <ArrowLeft className="w-4 h-4" /> 계약서 목록
                        </button>
                    </Link>
                </div>

                {/* 단계 인디케이터 */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {[
                        { id: 'type', label: '유형 선택' },
                        { id: 'info', label: '당사자 정보' },
                        { id: 'edit', label: '조항 편집' },
                    ].map((s, i) => {
                        const steps = ['type', 'info', 'edit'];
                        const currentIdx = steps.indexOf(step);
                        const active = steps.indexOf(s.id) <= currentIdx;
                        return (
                            <React.Fragment key={s.id}>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
                                        style={{
                                            background: active ? (steps.indexOf(s.id) === currentIdx ? '#c9a84c' : 'rgba(34,197,94,0.2)') : 'rgba(255,255,255,0.05)',
                                            color: active ? (steps.indexOf(s.id) === currentIdx ? '#04091a' : '#4ade80') : 'rgba(240,244,255,0.25)',
                                            border: active ? `2px solid ${steps.indexOf(s.id) === currentIdx ? '#c9a84c' : 'rgba(34,197,94,0.3)'}` : '1px solid rgba(255,255,255,0.08)',
                                        }}>
                                        {steps.indexOf(s.id) < currentIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                                    </div>
                                    <span className="text-[11px] font-bold"
                                        style={{ color: active ? (steps.indexOf(s.id) === currentIdx ? '#c9a84c' : '#4ade80') : 'rgba(240,244,255,0.25)' }}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < 2 && <div className="w-8 h-px" style={{ background: active && i < currentIdx ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)' }} />}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                        <PenTool className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-sm font-bold" style={{ color: '#c9a84c' }}>새 계약서 작성</span>
                    </div>
                    <h1 className="text-2xl font-black" style={{ color: '#f0f4ff' }}>
                        {step === 'type' && '계약서 유형을 선택하세요'}
                        {step === 'info' && '계약 당사자 정보를 입력하세요'}
                        {step === 'edit' && '계약 조항을 확인·수정하세요'}
                    </h1>
                </div>

                {/* Step 1: 유형 선택 */}
                {step === 'type' && (
                    <div className="grid sm:grid-cols-2 gap-3">
                        {CONTRACT_TYPES.map((type, i) => (
                            <motion.button
                                key={type.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                onClick={() => handleTypeSelect(type.id)}
                                className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02]"
                                style={{
                                    background: 'rgba(13,27,62,0.6)',
                                    border: `1px solid ${type.color}25`,
                                }}
                            >
                                <span className="text-3xl mb-3 block">{type.icon}</span>
                                <h3 className="font-black text-sm mb-1" style={{ color: '#f0f4ff' }}>{type.label}</h3>
                                <p className="text-xs" style={{ color: 'rgba(240,244,255,0.4)' }}>{type.desc}</p>
                            </motion.button>
                        ))}
                    </div>
                )}

                {/* Step 2: 당사자 정보 */}
                {step === 'info' && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="rounded-2xl p-6 mb-4"
                            style={{ background: 'rgba(13,27,62,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h2 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: '#c9a84c' }}>
                                <Building2 className="w-4 h-4" /> 갑 (계약 상대방)
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {[
                                    { k: 'partyA', label: '회사명/이름 *', ph: '(주)회사명' },
                                    { k: 'partyABiz', label: '사업자등록번호', ph: '123-45-67890' },
                                    { k: 'partyAContact', label: '담당자/이메일', ph: 'legal@company.kr' },
                                ].map(f => (
                                    <div key={f.k}>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.4)' }}>{f.label}</label>
                                        <input value={form[f.k as keyof typeof form]}
                                            onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                                            placeholder={f.ph} className="input-navy text-sm" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl p-6 mb-4"
                            style={{ background: 'rgba(13,27,62,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h2 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: '#2563eb' }}>
                                <Shield className="w-4 h-4" /> 을 (법률사무소)
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.4)' }}>법률사무소명</label>
                                    <input value={form.partyB} readOnly className="input-navy text-sm opacity-60" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.4)' }}>담당 변호사</label>
                                    <input value={form.partyBContact} readOnly className="input-navy text-sm opacity-60" />
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl p-6 mb-6"
                            style={{ background: 'rgba(13,27,62,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h2 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: '#059669' }}>
                                <Calendar className="w-4 h-4" /> 계약 기간
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.4)' }}>시작일</label>
                                    <input type="date" value={form.startDate}
                                        onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                                        className="input-navy text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(240,244,255,0.4)' }}>종료일</label>
                                    <input type="date" value={form.endDate}
                                        onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                                        className="input-navy text-sm" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep('type')}
                                className="px-6 py-3 rounded-xl font-bold text-sm"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                ← 이전
                            </button>
                            <button onClick={() => setStep('edit')}
                                className="flex-1 py-3 rounded-xl font-black text-sm"
                                style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                                다음: 조항 편집 →
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: 조항 편집 */}
                {step === 'edit' && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="rounded-2xl p-6 mb-4"
                            style={{ background: 'rgba(13,27,62,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{selectedContract?.icon}</span>
                                    <h2 className="text-sm font-black" style={{ color: '#f0f4ff' }}>{selectedContract?.label}</h2>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
                                    style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c' }}>
                                    <AlertTriangle className="w-3 h-3" /> 수정 가능
                                </div>
                            </div>
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={16}
                                className="w-full rounded-xl p-4 text-sm leading-relaxed font-mono"
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    color: 'rgba(240,244,255,0.75)',
                                    outline: 'none',
                                    resize: 'vertical',
                                }}
                            />
                        </div>

                        <div className="rounded-xl p-3 mb-6 flex items-start gap-2"
                            style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
                            <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#c9a84c' }} />
                            <p className="text-[11px]" style={{ color: 'rgba(240,244,255,0.45)' }}>
                                서명 요청 발송 후 상대방이 전자서명을 완료하면 양측에 체결 완료 알림이 전송됩니다.
                                전자서명은 「전자서명법」에 따라 법적 효력을 가집니다.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setStep('info')}
                                className="px-6 py-3 rounded-xl font-bold text-sm"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,244,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                ← 이전
                            </button>
                            <button onClick={handleSubmit} disabled={submitting}
                                className="flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2"
                                style={{
                                    background: 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                                    color: '#04091a',
                                    opacity: submitting ? 0.7 : 1,
                                    boxShadow: '0 6px 30px rgba(201,168,76,0.4)',
                                }}>
                                {submitting ? (
                                    <><div className="w-4 h-4 border-2 border-amber-900 border-t-transparent rounded-full animate-spin" /> 발송 중...</>
                                ) : (
                                    <><Send className="w-4 h-4" /> 서명 요청 발송</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}