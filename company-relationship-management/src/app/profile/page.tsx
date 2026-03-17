'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, Mail, Lock, Camera, Save, CheckCircle2,
    Bell, Shield, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

const ROLE_LABEL: Record<string, string> = {
    super_admin: '슈퍼어드민', admin: '관리자', sales: '영업팀', lawyer: '변호사',
    litigation: '송무팀', counselor: 'EAP상담사', client_hr: 'HR 담당',
    general: '총무팀', hr: '인사팀', finance: '재무팀',
};

export default function ProfilePage() {
    const { user } = useAuth();
    const [saved, setSaved] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');

    // 알림 설정
    const [emailNoti, setEmailNoti] = useState(true);
    const [pushNoti, setPushNoti] = useState(false);

    const handleSave = () => {
        if (newPw && newPw !== confirmPw) {
            alert('새 비밀번호가 일치하지 않습니다');
            return;
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const initials = (name || '사용자').slice(0, 1);

    return (
        <div className="min-h-screen py-8 px-4" style={{ background: T.bg }}>
            <div className="max-w-2xl mx-auto">

                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: T.heading }}>
                        <User className="w-6 h-6" style={{ color: '#6366f1' }} />
                        내 프로필
                    </h1>
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

                {/* 프로필 사진 + 기본 정보 */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl mb-4" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                    <div className="flex items-center gap-5 mb-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black"
                                style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', color: '#04091a' }}>
                                {initials}
                            </div>
                            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ background: T.card, border: `1.5px solid ${T.border}`, color: T.muted }}>
                                <Camera className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div>
                            <h2 className="text-lg font-black" style={{ color: T.heading }}>{user?.name ?? '사용자'}</h2>
                            <p className="text-xs mt-0.5" style={{ color: T.muted }}>{user?.email ?? 'user@ibslaw.co.kr'}</p>
                            <span className="text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block"
                                style={{ background: '#eef2ff', color: '#6366f1' }}>
                                {ROLE_LABEL[user?.role ?? 'sales'] ?? '영업팀'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: T.muted }}>이름</label>
                            <input value={name} onChange={e => setName(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg text-sm"
                                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.body }} />
                        </div>
                        <div>
                            <label className="text-xs font-bold block mb-1.5 flex items-center gap-1" style={{ color: T.muted }}>
                                <Mail className="w-3 h-3" /> 이메일
                            </label>
                            <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                                className="w-full px-3 py-2.5 rounded-lg text-sm"
                                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.body }} />
                        </div>
                    </div>
                </motion.div>

                {/* 비밀번호 변경 */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl mb-4" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                    <h2 className="font-black text-base mb-4 flex items-center gap-2" style={{ color: T.heading }}>
                        <Lock className="w-4 h-4" style={{ color: '#ef4444' }} />
                        비밀번호 변경
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: T.muted }}>현재 비밀번호</label>
                            <div className="relative">
                                <input value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                                    type={showPw ? 'text' : 'password'} placeholder="현재 비밀번호 입력"
                                    className="w-full px-3 py-2.5 rounded-lg text-sm pr-10"
                                    style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.body }} />
                                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: T.faint }}>
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: T.muted }}>새 비밀번호</label>
                            <input value={newPw} onChange={e => setNewPw(e.target.value)} type="password"
                                placeholder="새 비밀번호 (8자 이상)"
                                className="w-full px-3 py-2.5 rounded-lg text-sm"
                                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.body }} />
                        </div>
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: T.muted }}>비밀번호 확인</label>
                            <input value={confirmPw} onChange={e => setConfirmPw(e.target.value)} type="password"
                                placeholder="새 비밀번호 다시 입력"
                                className="w-full px-3 py-2.5 rounded-lg text-sm"
                                style={{
                                    background: T.bg,
                                    border: `1px solid ${confirmPw && confirmPw !== newPw ? '#f87171' : T.border}`,
                                    color: T.body,
                                }} />
                            {confirmPw && confirmPw !== newPw && (
                                <p className="text-xs mt-1" style={{ color: '#f87171' }}>비밀번호가 일치하지 않습니다</p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* 알림 설정 */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.borderSub}` }}>
                    <h2 className="font-black text-base mb-4 flex items-center gap-2" style={{ color: T.heading }}>
                        <Bell className="w-4 h-4" style={{ color: '#f59e0b' }} />
                        알림 수신 설정
                    </h2>
                    {[
                        { on: emailNoti, toggle: () => setEmailNoti(!emailNoti), label: '이메일 알림', desc: '중요 이벤트를 이메일로 받습니다', icon: Mail },
                        { on: pushNoti, toggle: () => setPushNoti(!pushNoti), label: '푸시 알림', desc: '브라우저 푸시 알림을 받습니다', icon: Shield },
                    ].map(({ on, toggle, label, desc, icon: Icon }) => (
                        <div key={label} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                            <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4" style={{ color: T.muted }} />
                                <div>
                                    <p className="text-sm font-bold" style={{ color: T.body }}>{label}</p>
                                    <p className="text-xs" style={{ color: T.muted }}>{desc}</p>
                                </div>
                            </div>
                            <button onClick={toggle}
                                className="w-10 h-6 rounded-full transition-all flex-shrink-0"
                                style={{ background: on ? '#4ade80' : T.borderSub }}>
                                <div className="w-4 h-4 rounded-full bg-white shadow transition-all"
                                    style={{ marginLeft: on ? 20 : 4, marginTop: 4 }} />
                            </button>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
