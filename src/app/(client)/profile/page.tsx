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

import { useCompanies } from '@/hooks/useDataLayer';

/* ── 메인 페이지 ───────────────────────────────────────── */
export default function ProfilePage() {
    const [session, setSession] = useState<AuthUser | null>(null);
    const [editing, setEditing] = useState(false);
    const [isSubscribed] = useState(true);

    const { companies } = useCompanies();
    const [company, setCompany] = useState<any>(null);

    // 프로필 편집 필드
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('010-1234-5678');
    const [department, setDepartment] = useState('대표이사/담당자');

    useEffect(() => {
        const s = getSession();
        setSession(s);
        if (s) { setName(s.name); setEmail(s.email); }
    }, []);

    useEffect(() => {
        if (session?.companyId && companies?.length) {
            const match = companies.find((c: any) => c.id === session.companyId);
            if (match) setCompany(match);
        }
    }, [session, companies]);

    if (!isSubscribed) return <SubscribeCTA />;

    const companyName = company?.name || session?.companyName || '회사 정보 없음';
    const bizNo = company?.biz || '-';
    // Use first primary contact as representative if none specifically stored, or fallback
    const representative = company?.contacts?.find((c: any) => c.isPrimary)?.name || company?.contactName || '미지정';
    const industry = company?.franchiseType === '프랜차이즈' ? '프랜차이즈 (가맹본부)' : (company?.bizType || '일반 기업');
    const employeeCount = '-'; // Not in schema, leave placeholder or omit
    const storeCount = company?.storeCount ? `${company.storeCount}개` : '-';

    const TEAM_MEMBERS = (company?.contacts || []).map((c: any) => ({
        name: c.name,
        email: c.email || '-',
        role: c.isPrimary ? '관리자' : (c.role || '멤버'),
        joinDate: '-', // No join date in schema
        active: true
    }));

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
                            {company?.plan && company.plan !== 'none' ? (
                                <div className="flex items-center justify-center gap-1.5 mt-2">
                                    <Crown className="w-3.5 h-3.5" style={{ color: '#c9a84c' }} />
                                    <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>
                                        {company.plan.charAt(0).toUpperCase() + company.plan.slice(1)} 플랜
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-1.5 mt-2">
                                    <span className="text-xs font-bold" style={{ color: '#6b7280' }}>Free 플랜</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 pt-4" style={{ borderTop: '1px solid #f0ede6' }}>
                            {[
                                { icon: <Mail className="w-4 h-4" />, value: session?.email || '' },
                                { icon: <Phone className="w-4 h-4" />, value: phone },
                                { icon: <Building2 className="w-4 h-4" />, value: companyName },
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
                                    { label: '회사명', value: companyName },
                                    { label: '사업자 번호', value: bizNo },
                                    { label: '대표자', value: representative },
                                    { label: '업종', value: industry },
                                    { label: '임직원 수', value: employeeCount },
                                    { label: '가맹점 수', value: storeCount },
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
                                {TEAM_MEMBERS.length > 0 ? TEAM_MEMBERS.map((m: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                                        style={{ background: '#f8f7f4', border: '1px solid #f0ede6' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                                style={{ background: '#f0ede6', color: m.active ? '#111827' : '#9ca3af' }}>
                                                {(m.name || '알')[0]}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold" style={{ color: m.active ? '#111827' : '#9ca3af' }}>{m.name || '알 수 없음'}</span>
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
                                )) : (
                                    <div className="p-4 text-center text-sm" style={{ color: '#6b7280', border: '1px solid #f0ede6', borderRadius: '0.75rem' }}>
                                        등록된 팀원이 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}