'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User, Building2, Mail, Phone, MapPin, Edit3,
    Save, X, Camera, Shield, CheckCircle2, Users,
    Briefcase, Calendar, Lock, ArrowRight, Crown,
} from 'lucide-react';
import Link from 'next/link';
import { getSession, type AuthUser } from '@/lib/auth';

/* ── 구독 전 CTA ───────────────────────────────────────── */
function SubscribeCTA() {
    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <User className="w-10 h-10" style={{ color: '#2563eb' }} />
                </div>
                <h1 className="text-2xl font-black mb-3" style={{ color: '#111827' }}>내 프로필</h1>
                <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
                    구독을 시작하면 프로필 및 회사 정보를 관리하고<br />
                    팀원을 초대하여 함께 서비스를 이용할 수 있습니다.
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

/* ── 목업 팀원 ─────────────────────────────────────────── */
const TEAM_MEMBERS = [
    { name: '박HR담당', email: 'hr@client.com', role: '관리자', joinDate: '2025.09.15', active: true },
    { name: '김영업부장', email: 'sales@nolbu.co.kr', role: '멤버', joinDate: '2025.10.01', active: true },
    { name: '이법무팀장', email: 'legal@nolbu.co.kr', role: '멤버', joinDate: '2025.11.20', active: true },
    { name: '최인사과장', email: 'hr2@nolbu.co.kr', role: '멤버', joinDate: '2026.01.05', active: false },
];

/* ── 메인 페이지 ───────────────────────────────────────── */
export default function ProfilePage() {
    const [session, setSession] = useState<AuthUser | null>(null);
    const [editing, setEditing] = useState(false);
    const [isSubscribed] = useState(true);

    // 프로필 편집 필드
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('010-1234-5678');
    const [department, setDepartment] = useState('HR팀');

    useEffect(() => {
        const s = getSession();
        setSession(s);
        if (s) { setName(s.name); setEmail(s.email); }
    }, []);

    if (!isSubscribed) return <SubscribeCTA />;

    const company = session?.companyName || '(주)놀부NBG';

    return (
        <div className="min-h-screen pt-20 pb-16" style={{ background: '#f8f7f4' }}>
            <div className="max-w-4xl mx-auto px-4">

                {/* 헤더 */}
                <div className="py-8">
                    <div className="flex items-center gap-2 mb-1">
                        <User className="w-5 h-5" style={{ color: '#2563eb' }} />
                        <h1 className="text-2xl font-black" style={{ color: '#111827' }}>내 프로필</h1>
                    </div>
                    <p className="text-sm" style={{ color: '#6b7280' }}>개인 정보와 회사 정보를 관리합니다.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-5">
                    {/* 프로필 카드 */}
                    <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                        <div className="text-center mb-5">
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black"
                                style={{ background: '#f0ede6', color: '#c9a84c' }}>
                                {(session?.name || '사')[0]}
                            </div>
                            <h2 className="font-black text-lg" style={{ color: '#111827' }}>{session?.name || '사용자'}</h2>
                            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{department}</p>
                            <div className="flex items-center justify-center gap-1.5 mt-2">
                                <Crown className="w-3.5 h-3.5" style={{ color: '#c9a84c' }} />
                                <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>Pro 플랜</span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4" style={{ borderTop: '1px solid #f0ede6' }}>
                            {[
                                { icon: <Mail className="w-4 h-4" />, value: session?.email || '' },
                                { icon: <Phone className="w-4 h-4" />, value: phone },
                                { icon: <Building2 className="w-4 h-4" />, value: company },
                                { icon: <Calendar className="w-4 h-4" />, value: '가입일: 2025.09.15' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2.5 text-xs" style={{ color: '#374151' }}>
                                    <span style={{ color: '#9ca3af' }}>{item.icon}</span>
                                    {item.value}
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setEditing(!editing)}
                            className="w-full mt-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                            style={{ background: editing ? '#111827' : '#f8f7f4', color: editing ? '#fff' : '#374151', border: '1px solid #e8e5de' }}>
                            {editing ? <><Save className="w-3.5 h-3.5" /> 저장</> : <><Edit3 className="w-3.5 h-3.5" /> 프로필 수정</>}
                        </button>
                    </div>

                    {/* 상세 정보 */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* 회사 정보 */}
                        <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <h3 className="font-black mb-4" style={{ color: '#111827' }}>회사 정보</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: '회사명', value: company },
                                    { label: '사업자 번호', value: '123-45-67890' },
                                    { label: '대표자', value: '김정래' },
                                    { label: '업종', value: '프랜차이즈 (외식)' },
                                    { label: '임직원 수', value: '약 3,800명' },
                                    { label: '가맹점 수', value: '약 1,200개' },
                                ].map(field => (
                                    <div key={field.label}>
                                        <label className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#9ca3af' }}>{field.label}</label>
                                        <p className="text-sm font-bold mt-0.5" style={{ color: '#111827' }}>{field.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 팀원 관리 */}
                        <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e8e5de' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black" style={{ color: '#111827' }}>팀원 관리</h3>
                                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                                    style={{ background: '#111827', color: '#fff' }}>
                                    <Users className="w-3.5 h-3.5" /> 초대하기
                                </button>
                            </div>

                            <div className="space-y-2">
                                {TEAM_MEMBERS.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                                        style={{ background: '#f8f7f4', border: '1px solid #f0ede6' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                                style={{ background: '#f0ede6', color: m.active ? '#111827' : '#9ca3af' }}>
                                                {m.name[0]}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold" style={{ color: m.active ? '#111827' : '#9ca3af' }}>{m.name}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                                        style={{
                                                            background: m.role === '관리자' ? '#fff3cd' : '#f3f4f6',
                                                            color: m.role === '관리자' ? '#c9a84c' : '#6b7280',
                                                        }}>{m.role}</span>
                                                    {!m.active && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                                            style={{ background: '#fef2f2', color: '#dc2626' }}>비활성</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px]" style={{ color: '#9ca3af' }}>{m.email}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px]" style={{ color: '#9ca3af' }}>{m.joinDate}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}