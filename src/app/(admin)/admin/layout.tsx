'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRequireAuth } from '@/lib/AuthContext';
import {
    Shield, Building2, Mail, CheckCircle2, BarChart3, Sparkles
} from 'lucide-react';

const ADMIN_TABS = [
    { href: '/admin',                 label: '대시보드',     icon: Shield },
    { href: '/admin/clients',         label: '고객 목록',    icon: Building2 },
    { href: '/admin/email-preview',   label: '이메일 발송',  icon: Mail },
    { href: '/admin/contract-preview',label: '계약서 발송',  icon: CheckCircle2 },
    { href: '/admin/reports',         label: '월간 리포트',  icon: BarChart3 },
    { href: '/admin/ai-prompts',      label: 'AI 프롬프트',  icon: Sparkles },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { loading, authorized } = useRequireAuth(['super_admin', 'admin', 'hr', 'finance', 'general']);
    const pathname = usePathname();

    if (loading || !authorized) return null;

    return (
        <div style={{ background: '#04091a', minHeight: '100vh' }}>
            {/* 상단 탭 네비게이션 바 */}
            <div
                className="sticky top-0 z-50 px-4"
                style={{
                    background: 'rgba(4,9,26,0.98)',
                    borderBottom: '1px solid rgba(201,168,76,0.15)',
                    backdropFilter: 'blur(16px)',
                }}
            >
                {/* 브랜드 + 탭 */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-7xl mx-auto">
                    {/* 로고 */}
                    <div className="flex items-center gap-2 pr-4 mr-2 flex-shrink-0"
                        style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                        <Shield className="w-4 h-4" style={{ color: '#c9a84c' }} />
                        <span className="text-xs font-black tracking-widest uppercase"
                            style={{ color: 'rgba(201,168,76,0.8)' }}>
                            ADMIN
                        </span>
                    </div>

                    {/* 탭 목록 */}
                    {ADMIN_TABS.map(({ href, label, icon: Icon }) => {
                        const isActive = href === '/admin'
                            ? pathname === '/admin'
                            : pathname.startsWith(href);

                        return (
                            <Link key={href} href={href} className="flex-shrink-0">
                                <div
                                    className="flex items-center gap-1.5 px-3 py-3.5 text-xs font-bold transition-all relative"
                                    style={{
                                        color: isActive ? '#c9a84c' : 'rgba(240,244,255,0.45)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                    {/* 활성 탭 언더라인 */}
                                    {isActive && (
                                        <div
                                            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                            style={{ background: 'linear-gradient(90deg,#c9a84c,#e8c87a)' }}
                                        />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* 페이지 컨텐츠 */}
            {children}
        </div>
    );
}
