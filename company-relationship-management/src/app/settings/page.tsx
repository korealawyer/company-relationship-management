'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings, Brain, Bell, Shield, Mail, Key, Save,
    CheckCircle2, Cpu, Zap, ToggleLeft, ToggleRight,
} from 'lucide-react';

const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

// ── 토글 컴포넌트 ──────────────────────────────────────────
function Toggle({ on, onToggle, label, desc }: { on: boolean; onToggle: () => void; label: string; desc: string }) {
    return (
        <div className="flex items-start justify-between py-3" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
            <div className="flex-1 mr-4">
                <p className="text-sm font-bold" style={{ color: T.body }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: T.muted }}>{desc}</p>
            </div>
            <button onClick={onToggle} className="flex-shrink-0 mt-0.5">
                {on
                    ? <ToggleRight className="w-8 h-8" style={{ color: '#4ade80' }} />
                    : <ToggleLeft className="w-8 h-8" style={{ color: T.faint }} />
                }
            </button>
        </div>
    );
}

// ── 설정 섹션 ──────────────────────────────────────────────
function Section({ icon: Icon, title, color, children }: {
    icon: React.ElementType; title: string; color: string; children: React.ReactNode;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl mb-4" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
            <h2 className="font-black text-base mb-4 flex items-center gap-2" style={{ color: T.heading }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
                {title}
            </h2>
            {children}
        </motion.div>
    );
}

export default function SettingsPage() {
    const [saved, setSaved] = useState(false);

    // AI 설정
    const [aiProvider, setAiProvider] = useState('claude');
    const [aiModel, setAiModel] = useState('');

    // 알림 설정
    const [notiNewLead, setNotiNewLead] = useState(true);
    const [notiStatusChange, setNotiStatusChange] = useState(true);
    const [notiDripResult, setNotiDripResult] = useState(false);
    const [notiAIAlert, setNotiAIAlert] = useState(true);

    // 자동화 설정
    const [autoAnalyze, setAutoAnalyze] = useState(false);
    const [autoEmail, setAutoEmail] = useState(false);

    // 보안 설정
    const [enforce2FA, setEnforce2FA] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState('60');

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="min-h-screen py-8 px-4" style={{ background: T.bg }}>
            <div className="max-w-3xl mx-auto">

                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: T.heading }}>
                            <Settings className="w-6 h-6" style={{ color: T.muted }} />
                            시스템 설정
                        </h1>
                        <p className="text-sm mt-1" style={{ color: T.muted }}>AI, 알림, 자동화, 보안 설정을 관리합니다</p>
                    </div>
                    <button onClick={handleSave}
                        className="flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
                        style={{
                            background: saved ? '#d1fae5' : 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                            color: saved ? '#065f46' : '#04091a',
                            border: saved ? '1px solid #6ee7b7' : 'none',
                        }}>
                        {saved ? <><CheckCircle2 className="w-4 h-4" /> 저장됨</> : <><Save className="w-4 h-4" /> 저장</>}
                    </button>
                </div>

                {/* AI 설정 */}
                <Section icon={Brain} title="AI 설정" color="#8b5cf6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: T.muted }}>AI Provider</label>
                            <div className="flex gap-2">
                                {[
                                    { id: 'claude', label: 'Claude', color: '#c9a84c' },
                                    { id: 'openai', label: 'GPT-4o', color: '#10a37f' },
                                    { id: 'gemini', label: 'Gemini', color: '#4285f4' },
                                ].map(p => (
                                    <button key={p.id} onClick={() => setAiProvider(p.id)}
                                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                                        style={{
                                            background: aiProvider === p.id ? `${p.color}15` : T.bg,
                                            color: aiProvider === p.id ? p.color : T.muted,
                                            border: `1.5px solid ${aiProvider === p.id ? p.color : T.border}`,
                                        }}>
                                        <Cpu className="w-3.5 h-3.5 inline mr-1" />
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: T.muted }}>모델 (선택)</label>
                            <input value={aiModel} onChange={e => setAiModel(e.target.value)}
                                placeholder="기본값 사용 (비워두면 Provider 기본 모델)"
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.body }} />
                        </div>
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: T.muted }}>API 키 상태</label>
                            <div className="flex gap-4">
                                {['ANTHROPIC', 'OPENAI', 'GOOGLE'].map(k => (
                                    <div key={k} className="flex items-center gap-1.5">
                                        <Key className="w-3 h-3" style={{ color: T.faint }} />
                                        <span className="text-xs" style={{ color: T.muted }}>{k}</span>
                                        <span className="w-2 h-2 rounded-full" style={{ background: '#94a3b8' }} />
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] mt-1" style={{ color: T.faint }}>API 키는 .env.local에서 관리합니다</p>
                        </div>
                    </div>
                </Section>

                {/* 알림 설정 */}
                <Section icon={Bell} title="알림 설정" color="#f59e0b">
                    <Toggle on={notiNewLead} onToggle={() => setNotiNewLead(!notiNewLead)} label="신규 리드 알림" desc="새로운 리드가 등록되면 알림을 받습니다" />
                    <Toggle on={notiStatusChange} onToggle={() => setNotiStatusChange(!notiStatusChange)} label="상태 변경 알림" desc="리드 상태가 변경될 때 알림을 받습니다" />
                    <Toggle on={notiDripResult} onToggle={() => setNotiDripResult(!notiDripResult)} label="드립 이메일 결과" desc="드립 이메일 발송 결과를 알림으로 받습니다" />
                    <Toggle on={notiAIAlert} onToggle={() => setNotiAIAlert(!notiAIAlert)} label="AI 이상 감지" desc="AI 호출 실패율이 높아지면 알림을 받습니다" />
                </Section>

                {/* 자동화 설정 */}
                <Section icon={Zap} title="자동화 설정" color="#6366f1">
                    <Toggle on={autoAnalyze} onToggle={() => setAutoAnalyze(!autoAnalyze)} label="자동 AI 분석" desc="리드 등록 시 자동으로 개인정보처리방침을 분석합니다" />
                    <Toggle on={autoEmail} onToggle={() => setAutoEmail(!autoEmail)} label="자동 드립 이메일" desc="분석 완료 후 자동으로 드립 캠페인을 시작합니다" />
                </Section>

                {/* 보안 설정 */}
                <Section icon={Shield} title="보안 설정" color="#ef4444">
                    <Toggle on={enforce2FA} onToggle={() => setEnforce2FA(!enforce2FA)} label="2단계 인증 강제" desc="모든 내부 직원에게 2FA를 요구합니다" />
                    <div className="py-3">
                        <label className="text-sm font-bold block mb-1" style={{ color: T.body }}>세션 타임아웃 (분)</label>
                        <p className="text-xs mb-2" style={{ color: T.muted }}>비활동 시 자동 로그아웃까지의 시간</p>
                        <select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}
                            className="px-3 py-2 rounded-lg text-sm"
                            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.body }}>
                            <option value="30">30분</option>
                            <option value="60">1시간</option>
                            <option value="120">2시간</option>
                            <option value="480">8시간</option>
                        </select>
                    </div>
                </Section>

                {/* 이메일 설정 */}
                <Section icon={Mail} title="이메일 설정" color="#10b981">
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: T.muted }}>SMTP 서버</label>
                            <input readOnly value={process.env.SMTP_HOST || '미설정'}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.faint }} />
                        </div>
                        <p className="text-[10px]" style={{ color: T.faint }}>SMTP 설정은 환경 변수(.env.local)에서 관리합니다</p>
                    </div>
                </Section>
            </div>
        </div>
    );
}
