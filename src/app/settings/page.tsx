'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings, Bell, Shield, Lock, Eye, EyeOff,
    Mail, Smartphone, Globe, Moon, Sun, Monitor,
    CheckCircle2, ToggleLeft, ToggleRight, Save,
    ArrowRight, Palette, Volume2, Languages, Bot,
} from 'lucide-react';
import Link from 'next/link';
import { AI_MODELS, getSelectedModel, setSelectedModel, getApiKey, setApiKey, type AIModel } from '@/lib/ai-assist';
import { getSession } from '@/lib/auth';

/* ── 토글 컴포넌트 ─────────────────────────────────────── */
function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: () => void; label: string; desc: string }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl transition-all"
            style={{ background: on ? '#f8f7f4' : '#fff', border: `1px solid ${on ? '#e8e5de' : '#f0ede6'}` }}>
            <div>
                <div className="text-sm font-bold" style={{ color: '#111827' }}>{label}</div>
                <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{desc}</div>
            </div>
            <button onClick={onChange} className="flex-shrink-0">
                {on
                    ? <ToggleRight className="w-8 h-8" style={{ color: '#059669' }} />
                    : <ToggleLeft className="w-8 h-8" style={{ color: '#d1d5db' }} />}
            </button>
        </div>
    );
}

/* ── 구독 전 CTA ───────────────────────────────────────── */
function SubscribeCTA() {
    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: '#f8f7f4', border: '1px solid #e8e5de' }}>
                    <Settings className="w-10 h-10" style={{ color: '#6b7280' }} />
                </div>
                <h1 className="text-2xl font-black mb-3" style={{ color: '#111827' }}>설정</h1>
                <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
                    구독을 시작하면 알림, 보안, 개인정보 등<br />
                    세부 설정을 맞춤 조정할 수 있습니다.
                </p>
                <Link href="/pricing">
                    <button className="px-8 py-3 rounded-xl font-bold text-sm"
                        style={{ background: '#111827', color: '#fff' }}>
                        구독 시작하기 →
                    </button>
                </Link>
            </div>
        </div>
    );
}

/* ── 메인 페이지 ───────────────────────────────────────── */
export default function SettingsPage() {
    const [isSubscribed] = useState(true);
    const [saved, setSaved] = useState(false);

    // 역할 체크
    const [role, setRole] = useState<string | null>(null);
    useEffect(() => {
        const s = getSession();
        setRole(s?.role || null);
    }, []);
    const isAdmin = role === 'admin' || role === 'super_admin';

    // 알림 설정
    const [notiDoc, setNotiDoc] = useState(true);
    const [notiPay, setNotiPay] = useState(true);
    const [notiConsult, setNotiConsult] = useState(true);
    const [notiMember, setNotiMember] = useState(true);
    const [notiEmail, setNotiEmail] = useState(true);
    const [notiSms, setNotiSms] = useState(false);
    const [notiMarketing, setNotiMarketing] = useState(false);

    // 보안
    const [twoFa, setTwoFa] = useState(false);
    const [loginAlert, setLoginAlert] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState('30');

    // AI 모델 설정 (관리자 전용)
    const [aiModel, setAiModel] = useState<AIModel>('gpt-4o');
    const [aiKey, setAiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    useEffect(() => {
        setAiModel(getSelectedModel());
        setAiKey(getApiKey(getSelectedModel()));
    }, []);

    const handleSave = () => {
        if (isAdmin) {
            setSelectedModel(aiModel);
            setApiKey(aiModel, aiKey);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (!isSubscribed) return <SubscribeCTA />;

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-3xl mx-auto px-4">

                {/* 헤더 */}
                <div className="py-8 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Settings className="w-5 h-5" style={{ color: '#6b7280' }} />
                            <h1 className="text-2xl font-black" style={{ color: '#111827' }}>설정</h1>
                        </div>
                        <p className="text-sm" style={{ color: '#6b7280' }}>알림, 보안, 개인정보 설정을 관리합니다.</p>
                    </div>
                    <button onClick={handleSave}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={{
                            background: saved ? '#059669' : '#111827',
                            color: '#fff',
                        }}>
                        {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> 저장됨</> : <><Save className="w-3.5 h-3.5" /> 저장</>}
                    </button>
                </div>

                <div className="space-y-6">
                    {/* 알림 설정 */}
                    <section className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <div className="flex items-center gap-2 mb-5">
                            <Bell className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            <h2 className="font-black" style={{ color: '#111827' }}>알림 설정</h2>
                        </div>

                        <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: '#9ca3af' }}>알림 유형</h3>
                        <div className="space-y-2 mb-5">
                            <Toggle on={notiDoc} onChange={() => setNotiDoc(!notiDoc)} label="문서 알림" desc="검토 완료, 리포트 발행 등" />
                            <Toggle on={notiPay} onChange={() => setNotiPay(!notiPay)} label="결제 알림" desc="결제 완료, 수단 만료 등" />
                            <Toggle on={notiConsult} onChange={() => setNotiConsult(!notiConsult)} label="상담 알림" desc="변호사 답변 도착, 상담 접수 등" />
                            <Toggle on={notiMember} onChange={() => setNotiMember(!notiMember)} label="멤버 알림" desc="소속 신청, 승인/거절 등" />
                        </div>

                        <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: '#9ca3af' }}>수신 채널</h3>
                        <div className="space-y-2">
                            <Toggle on={notiEmail} onChange={() => setNotiEmail(!notiEmail)} label="이메일 알림" desc="등록된 이메일로 알림 수신" />
                            <Toggle on={notiSms} onChange={() => setNotiSms(!notiSms)} label="SMS 알림" desc="등록된 휴대폰으로 문자 알림" />
                            <Toggle on={notiMarketing} onChange={() => setNotiMarketing(!notiMarketing)} label="마케팅 정보 수신" desc="서비스 혜택, 이벤트, 법률 뉴스레터" />
                        </div>
                    </section>

                    {/* 보안 설정 */}
                    <section className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <div className="flex items-center gap-2 mb-5">
                            <Shield className="w-5 h-5" style={{ color: '#2563eb' }} />
                            <h2 className="font-black" style={{ color: '#111827' }}>보안</h2>
                        </div>

                        <div className="space-y-2 mb-5">
                            <Toggle on={twoFa} onChange={() => setTwoFa(!twoFa)} label="2단계 인증" desc="로그인 시 추가 인증을 요구합니다" />
                            <Toggle on={loginAlert} onChange={() => setLoginAlert(!loginAlert)} label="로그인 알림" desc="새 기기에서 로그인 시 알림" />
                        </div>

                        {/* 세션 타임아웃 */}
                        <div className="p-4 rounded-xl" style={{ background: '#f8f7f4', border: '1px solid #f0ede6' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold" style={{ color: '#111827' }}>세션 만료 시간</div>
                                    <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>비활성 후 자동 로그아웃</div>
                                </div>
                                <select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg text-sm"
                                    style={{ background: '#fff', border: '1px solid #e8e5de', color: '#111827', outline: 'none' }}>
                                    <option value="15">15분</option>
                                    <option value="30">30분</option>
                                    <option value="60">1시간</option>
                                    <option value="120">2시간</option>
                                </select>
                            </div>
                        </div>

                        {/* 비밀번호 변경 */}
                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid #f0ede6' }}>
                            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
                                style={{ background: '#f8f7f4', color: '#374151', border: '1px solid #e8e5de' }}>
                                <Lock className="w-3.5 h-3.5" /> 비밀번호 변경
                            </button>
                        </div>
                    </section>

                    {/* AI 모델 설정 (관리자 전용) */}
                    {isAdmin && (
                        <section className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <div className="flex items-center gap-2 mb-5">
                                <Bot className="w-5 h-5" style={{ color: '#6366f1' }} />
                                <h2 className="font-black" style={{ color: '#111827' }}>AI 답변 어시스턴트</h2>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                    style={{ background: '#fef2f2', color: '#dc2626' }}>관리자 전용</span>
                            </div>
                            <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                                고객 질문 시 AI가 변호사 말투로 답변 초안을 자동 생성합니다. 변호사에게는 노출되지 않습니다.
                            </p>

                            {/* AI 모델 선택 */}
                            <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: '#9ca3af' }}>AI 모델 선택</h3>
                            <div className="space-y-2 mb-5">
                                {AI_MODELS.map(m => (
                                    <div key={m.id}
                                        onClick={() => { setAiModel(m.id); setAiKey(getApiKey(m.id)); setShowKey(false); }}
                                        className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all"
                                        style={{
                                            background: aiModel === m.id ? `${m.color}08` : '#fff',
                                            border: `1px solid ${aiModel === m.id ? m.color + '40' : '#f0ede6'}`,
                                        }}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{m.icon}</span>
                                            <div>
                                                <div className="text-sm font-bold" style={{ color: aiModel === m.id ? m.color : '#111827' }}>
                                                    {m.label}
                                                    <span className="text-[10px] font-normal ml-2" style={{ color: '#9ca3af' }}>{m.provider}</span>
                                                </div>
                                                <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{m.description}</div>
                                            </div>
                                        </div>
                                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                            style={{ borderColor: aiModel === m.id ? m.color : '#d1d5db' }}>
                                            {aiModel === m.id && (
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* API Key */}
                            <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: '#9ca3af' }}>API 키</h3>
                            <div className="p-4 rounded-xl" style={{ background: '#f8f7f4', border: '1px solid #f0ede6' }}>
                                <label className="text-xs font-bold mb-2 block" style={{ color: '#374151' }}>
                                    {AI_MODELS.find(m => m.id === aiModel)?.label} API Key
                                </label>
                                <div className="relative">
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        value={aiKey}
                                        onChange={e => setAiKey(e.target.value)}
                                        placeholder="sk-... 또는 API 키를 입력하세요"
                                        className="w-full pr-10 px-3 py-2 rounded-lg text-sm outline-none"
                                        style={{ background: '#fff', border: '1px solid #e8e5de', color: '#111827' }}
                                    />
                                    <button onClick={() => setShowKey(!showKey)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2">
                                        {showKey
                                            ? <EyeOff className="w-4 h-4" style={{ color: '#9ca3af' }} />
                                            : <Eye className="w-4 h-4" style={{ color: '#9ca3af' }} />}
                                    </button>
                                </div>
                                <p className="text-[10px] mt-2" style={{ color: '#9ca3af' }}>
                                    키가 없으면 Mock 응답이 사용됩니다. 실제 API 연동 시 키를 입력하세요.
                                </p>
                            </div>
                        </section>
                    )}

                    {/* 개인정보 */}
                    <section className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <div className="flex items-center gap-2 mb-5">
                            <Eye className="w-5 h-5" style={{ color: '#7c3aed' }} />
                            <h2 className="font-black" style={{ color: '#111827' }}>개인정보 · 데이터</h2>
                        </div>

                        <div className="space-y-3">
                            <Link href="/terms/privacy" className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all"
                                style={{ border: '1px solid #f0ede6' }}>
                                <span className="text-sm" style={{ color: '#374151' }}>개인정보처리방침</span>
                                <ArrowRight className="w-4 h-4" style={{ color: '#9ca3af' }} />
                            </Link>
                            <Link href="/terms/service" className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all"
                                style={{ border: '1px solid #f0ede6' }}>
                                <span className="text-sm" style={{ color: '#374151' }}>이용약관</span>
                                <ArrowRight className="w-4 h-4" style={{ color: '#9ca3af' }} />
                            </Link>
                            <button className="flex items-center justify-between w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-all"
                                style={{ border: '1px solid #f0ede6' }}>
                                <span className="text-sm" style={{ color: '#374151' }}>내 데이터 다운로드 (GDPR)</span>
                                <ArrowRight className="w-4 h-4" style={{ color: '#9ca3af' }} />
                            </button>
                        </div>
                    </section>

                    {/* 탈퇴 */}
                    <div className="text-center py-4">
                        <button className="text-xs" style={{ color: '#9ca3af' }}>회원 탈퇴</button>
                    </div>
                </div>
            </div>
        </div>
    );
}