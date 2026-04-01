'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRequireAuth } from '@/lib/AuthContext';
import {
    Shield, Building2, Mail, CheckCircle2, BarChart3, Sparkles
} from 'lucide-react';
import { RoleType } from '@/lib/types';

const ADMIN_TABS = [
    { href: '/admin',                 label: '대시보드',     icon: Shield },
    { href: '/admin/clients',         label: '고객 목록',    icon: Building2 },
    { href: '/admin/email-preview',   label: '이메일 발송',  icon: Mail },
    { href: '/admin/contract-preview',label: '계약서 발송',  icon: CheckCircle2 },
    { href: '/admin/reports',         label: '월간 리포트',  icon: BarChart3 },
    { href: '/admin/ai-prompts',      label: 'AI 프롬프트',  icon: Sparkles },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isEmailPreview = pathname.startsWith('/admin/email-preview');
    const allowedRoles: RoleType[] = isEmailPreview 
        ? ['super_admin', 'admin', 'hr', 'finance', 'general', 'sales']
        : ['super_admin', 'admin', 'hr', 'finance', 'general'];

    const { loading, authorized } = useRequireAuth(allowedRoles);

    if (loading || !authorized) return null;

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* 상단 탭 네비게이션 바 */}
            <div className="sticky top-0 z-50 px-4 bg-white/90 border-b border-slate-200 backdrop-blur-md shadow-sm">
                {/* 브랜드 + 탭 */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-7xl mx-auto">
                    {/* 로고 */}
                    <div className="flex items-center gap-2 pr-4 mr-2 flex-shrink-0 border-r border-slate-200 py-3">
                        <Shield className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-black tracking-widest text-slate-800">
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
                                    className={`flex items-center gap-1.5 px-3 py-3.5 text-[13px] font-bold transition-all relative cursor-pointer
                                        ${isActive ? 'text-amber-700' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                    {/* 활성 탭 언더라인 */}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-md bg-amber-500" />
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
