'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, ChevronDown, Settings, HelpCircle, Bell, CreditCard } from 'lucide-react';
import { getSession, clearSession, type AuthUser } from '@/lib/auth';
import type { RoleType } from '@/lib/store';
import { useZeroTrust } from '@/components/ZeroTrustBriefingProvider';
import { startAutomationEngine } from '@/lib/automationEngine';

// ── 역할 레이블·색상 ──────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string }> = {
    super_admin: { label: '슈퍼어드민', color: '#e8c87a' },
    admin: { label: '관리자', color: '#e8c87a' },
    sales: { label: '영업팀', color: '#60a5fa' },
    lawyer: { label: '변호사', color: '#a78bfa' },
    litigation: { label: '송무팀', color: '#f472b6' },
    counselor: { label: 'EAP상담사', color: '#4ade80' },
    client_hr: { label: 'HR 담당', color: '#fb923c' },
    general: { label: '총무팀', color: '#94a3b8' },
    hr: { label: '인사팀', color: '#94a3b8' },
    finance: { label: '재무팀', color: '#94a3b8' },
};

// ── 역할별 메뉴 정의 (플랫) ───────────────────────────────
type NavLink = { href: string; label: string; comingSoon?: boolean };

const LINKS_BY_ROLE: Record<string, NavLink[]> = {
    // 일반 방문자 (비로그인)
    public: [
        { href: '/service', label: '서비스 소개' },
        { href: '/consultation', label: '법률 상담' },
        { href: '/pricing', label: '요금제' },
        { href: '/portal', label: '고객 포털' },
    ],
    // 영업팀
    sales: [
        { href: '/employee', label: 'CRM' },
        { href: '/sales/call', label: '전화 영업' },
        { href: '/sales/voice-memo', label: '음성 메모' },
        { href: '/sales/pricing-calculator', label: '견적 계산기' },
    ],
    // 변호사
    lawyer: [
        { href: '/lawyer', label: '대시보드' },
        { href: '/lawyer/privacy-review', label: '조문 검토' },
        { href: '/litigation', label: '송무 대시보드' },
    ],
    // 송무팀
    litigation: [
        { href: '/litigation', label: '송무 대시보드' },
    ],
    // 관리자 / 슈퍼어드민 — 전체 역할 관리
    admin: [
        { href: '/admin', label: '관리자 홈' },
        { href: '/employee', label: '영업 CRM' },
        { href: '/sales/call', label: '전화 영업' },
        { href: '/sales/voice-memo', label: '음성 메모' },
        { href: '/sales/pricing-calculator', label: '견적 계산기' },
        { href: '/lawyer', label: '변호사 포털' },
        { href: '/lawyer/privacy-review', label: '조문 검토' },
        { href: '/litigation', label: '송무 대시보드' },
        { href: '/counselor', label: 'EAP 상담' },
        { href: '/dashboard', label: '고객 포털' },
    ],
    super_admin: [
        { href: '/admin', label: '관리자 홈' },
        { href: '/employee', label: '영업 CRM' },
        { href: '/sales/call', label: '전화 영업' },
        { href: '/sales/voice-memo', label: '음성 메모' },
        { href: '/sales/pricing-calculator', label: '견적 계산기' },
        { href: '/lawyer', label: '변호사 포털' },
        { href: '/lawyer/privacy-review', label: '조문 검토' },
        { href: '/litigation', label: '송무 대시보드' },
        { href: '/counselor', label: 'EAP 상담' },
        { href: '/dashboard', label: '고객 포털' },
    ],
    // EAP 상담사
    counselor: [
        { href: '/counselor', label: '상담 현황' },
    ],
    // 프랜차이즈 본사 HR (client_hr)
    client_hr: [
        { href: '/dashboard', label: '대시보드' },
        { href: '/consultation-history', label: '법률 상담' },
        { href: '/cases', label: '사건·소송', comingSoon: true },
        { href: '/contracts', label: '전자계약', comingSoon: true },
        { href: '/documents', label: '문서함' },
    ],
    // 기타 내부
    general: [{ href: '/general', label: '총무 포털' }],
    hr: [{ href: '/hr', label: '인사 포털' }],
    finance: [{ href: '/admin', label: 'KPI' }],
};

function getLinks(role: string | null): NavLink[] {
    if (!role) return LINKS_BY_ROLE.public;
    return LINKS_BY_ROLE[role] ?? LINKS_BY_ROLE.public;
}

// 내부 직원 여부 (무료진단 버튼 숨기기용)
const INTERNAL: string[] = ['sales', 'lawyer', 'litigation', 'admin', 'super_admin', 'general', 'hr', 'finance', 'counselor'];

// ── 사용자 메뉴 드롭다운 ─────────────────────────────────
function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, right: 0 });
    const btnRef = React.useRef<HTMLButtonElement>(null);
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const meta = ROLE_META[user.role] ?? { label: user.role, color: '#94a3b8' };

    const openMenu = () => {
        // 닫기 타이머 취소
        if (closeTimer.current) clearTimeout(closeTimer.current);
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
        }
        setOpen(true);
    };

    // 지연 닫기: 버튼→간격→드롭다운 이동 중 닫히지 않도록 150ms 유예
    const scheduleClose = () => {
        closeTimer.current = setTimeout(() => setOpen(false), 150);
    };

    return (
        <div>
            <button
                ref={btnRef}
                onMouseEnter={openMenu}
                onMouseLeave={scheduleClose}
                onClick={() => open ? setOpen(false) : openMenu()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }}
            >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs"
                    style={{ background: `${meta.color}20`, color: meta.color }}>
                    {user.name[0]}
                </div>
                <span className="max-w-[80px] truncate hidden sm:block">{user.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold hidden sm:block"
                    style={{ background: `${meta.color}15`, color: meta.color }}>
                    {meta.label}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'rgba(240,244,255,0.4)' }} />
            </button>

            <AnimatePresence>
                {open && (
                    /* fixed로 렌더링 → 어떤 fixed 사이드바/캔버스에도 가려지지 않음 */
                    <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}
                        className="fixed w-52 rounded-xl overflow-hidden"
                        onMouseEnter={() => {
                            // 드롭다운 위로 마우스 진입 시 닫기 타이머 취소
                            if (closeTimer.current) clearTimeout(closeTimer.current);
                        }}
                        onMouseLeave={scheduleClose}
                        style={{
                            top: pos.top, right: pos.right,
                            zIndex: 99999,
                            background: 'rgba(13,27,62,0.98)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                        }}>

                        {/* 유저 정보 */}
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-sm font-black" style={{ color: '#f0f4ff' }}>{user.name}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(240,244,255,0.35)' }}>{user.email}</p>
                            {user.companyName && (
                                <p className="text-[10px] mt-0.5" style={{ color: meta.color }}>{user.companyName}</p>
                            )}
                        </div>

                        {/* 내 대시보드 */}
                        <Link href={user ? (LINKS_BY_ROLE[user.role]?.[0]?.href ?? '/dashboard') : '/dashboard'}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                            style={{ color: 'rgba(240,244,255,0.75)' }}
                            onClick={() => setOpen(false)}>
                            <User className="w-4 h-4" />
                            내 대시보드
                        </Link>

                        {/* 프로필 · 설정 · 도움말 */}
                        <Link href="/profile"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                            style={{ color: 'rgba(240,244,255,0.75)' }}
                            onClick={() => setOpen(false)}>
                            <User className="w-4 h-4" />
                            내 프로필
                        </Link>
                        <Link href="/settings"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                            style={{ color: 'rgba(240,244,255,0.75)' }}
                            onClick={() => setOpen(false)}>
                            <Settings className="w-4 h-4" />
                            설정
                        </Link>
                        <Link href="/help"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                            style={{ color: 'rgba(240,244,255,0.75)' }}
                            onClick={() => setOpen(false)}>
                            <HelpCircle className="w-4 h-4" />
                            도움말
                        </Link>

                        {/* 로그아웃 */}
                        <button onClick={onLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                            style={{ color: '#f87171', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <LogOut className="w-4 h-4" />
                            로그아웃
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── 메인 Navbar ──────────────────────────────────────────
export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const { initiateLogout } = useZeroTrust();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // 세션 감지 (pathname 변경 시 갱신 + 타 탭 로그아웃 동기화)
    useEffect(() => {
        setUser(getSession());
        startAutomationEngine(); // ⚡ 송무 자동화 엔진 시작
    }, [pathname]);

    // 다른 탭에서 로그아웃 시 현재 탭도 즉시 반영
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'ibs_auth_v1') {
                setUser(e.newValue ? getSession() : null);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const handleLogout = () => {
        initiateLogout(() => {
            clearSession();
            setUser(null);
            router.replace('/');
        });
    };

    let links = getLinks(user?.role ?? null);

    // 내부 영업/관리 도구 경로 진입 시 영업팀 상단 탭 노출
    // 단, admin/super_admin은 자신의 전체 탭 목록을 그대로 유지
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    if (!isAdmin && (pathname.startsWith('/sales/') || pathname.startsWith('/employee'))) {
        links = LINKS_BY_ROLE.sales;
    }
    const isInternal = user ? INTERNAL.includes(user.role) : false;

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            style={{
                background: 'rgba(4,9,26,0.97)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(201,168,76,0.15)',
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">

                    {/* 로고 */}
                    <Link href={user ? (LINKS_BY_ROLE[user.role]?.[0]?.href ?? '/') : '/'} className="flex items-center group flex-shrink-0">
                        <span className="font-black text-2xl tracking-tight transition-all duration-300 group-hover:scale-105"
                            style={{ background: 'linear-gradient(135deg,#e8c87a,#c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            IBS
                        </span>
                    </Link>

                    {/* 데스크탑 메뉴 — 플랫 */}
                    <div className="hidden lg:flex items-center gap-1">
                        {links.map((link) => {
                            // 관련 경로도 같은 탭으로 인식
                            const RELATED_PATHS: Record<string, string[]> = {
                                '/dashboard': ['/client-portal', '/chat'],
                            };
                            const related = RELATED_PATHS[link.href] ?? [];
                            const active = pathname === link.href
                                || (link.href !== '/' && pathname.startsWith(link.href + '/'))
                                || related.some(r => pathname === r || pathname.startsWith(r + '/'));
                            return (
                                <Link key={link.href} href={link.href}
                                    className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 group"
                                    style={{ color: active ? '#c9a84c' : 'rgba(240,244,255,0.7)' }}>
                                    {active && (
                                        <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-lg"
                                            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }} />
                                    )}
                                    <span className="relative z-10">{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* 우측 버튼 영역 */}
                    <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0">
                        {user ? (
                            <>
                                {user.role === 'client_hr' && (
                                    <div className="flex items-center gap-1.5 mr-2">
                                        <Link href="/notifications" className="relative p-2 rounded-full hover:bg-white/5 transition-colors" style={{ color: 'rgba(240,244,255,0.7)' }}>
                                            <Bell className="w-5 h-5" />
                                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#f87171' }}></span>
                                        </Link>
                                        <Link href="/billing" className="p-2 rounded-full hover:bg-white/5 transition-colors" style={{ color: 'rgba(240,244,255,0.7)' }}>
                                            <CreditCard className="w-5 h-5" />
                                        </Link>
                                        <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
                                    </div>
                                )}
                                <UserMenu user={user} onLogout={handleLogout} />
                            </>
                        ) : (
                            <>
                                <Link href="/login"
                                    className="text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                                    style={{ color: 'rgba(240,244,255,0.8)', border: '1px solid rgba(201,168,76,0.3)' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.7)'; e.currentTarget.style.color = '#c9a84c'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.color = 'rgba(240,244,255,0.8)'; }}>
                                    로그인
                                </Link>
                                <Link href="/consultation" className="inline-flex items-center justify-center text-sm font-bold px-5 py-2 rounded-lg btn-gold transition-all">
                                    상담 신청하기
                                </Link>
                            </>
                        )}
                    </div>

                    {/* 모바일 햄버거 */}
                    <button className="lg:hidden p-2 rounded-lg" style={{ color: '#c9a84c' }}
                        onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* 모바일 메뉴 */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="lg:hidden overflow-hidden"
                        style={{ background: 'rgba(4,9,26,0.98)', borderTop: '1px solid rgba(201,168,76,0.15)' }}>
                        <div className="px-4 py-5 space-y-1">

                            {/* 메뉴 링크 */}
                            {links.map((link) => {
                                const RELATED_PATHS: Record<string, string[]> = {
                                    '/dashboard': ['/client-portal', '/chat'],
                                };
                                const related = RELATED_PATHS[link.href] ?? [];
                                const active = pathname === link.href
                                    || (link.href !== '/' && pathname.startsWith(link.href + '/'))
                                    || related.some(r => pathname === r || pathname.startsWith(r + '/'));
                                return (
                                    <Link key={link.href} href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                                        style={{ color: active ? '#c9a84c' : 'rgba(240,244,255,0.75)', background: active ? 'rgba(201,168,76,0.08)' : 'transparent' }}>
                                        <span className="flex items-center gap-2">
                                            {link.label}
                                        </span>
                                    </Link>
                                );
                            })}

                            <div className="h-px my-3" style={{ background: 'rgba(255,255,255,0.06)' }} />

                            {/* 로그인/로그아웃 */}
                            {user ? (
                                <div className="space-y-1">
                                    <div className="px-3 py-2 text-xs" style={{ color: 'rgba(240,244,255,0.35)' }}>
                                        {user.name} · {ROLE_META[user.role]?.label}
                                    </div>
                                    <Link href={user ? (LINKS_BY_ROLE[user.role]?.[0]?.href ?? '/dashboard') : '/dashboard'} onClick={() => setMobileOpen(false)}
                                        className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                                        style={{ color: 'rgba(240,244,255,0.75)' }}>
                                        내 대시보드
                                    </Link>
                                    
                                    {user.role === 'client_hr' && (
                                        <>
                                            <Link href="/notifications" onClick={() => setMobileOpen(false)}
                                                className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                                                style={{ color: 'rgba(240,244,255,0.75)' }}>
                                                알림 관리
                                            </Link>
                                            <Link href="/billing" onClick={() => setMobileOpen(false)}
                                                className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                                                style={{ color: 'rgba(240,244,255,0.75)' }}>
                                                구독·결제 관리
                                            </Link>
                                        </>
                                    )}

                                    <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                                        style={{ color: '#f87171' }}>
                                        로그아웃
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 pt-1">
                                    <Link href="/login" onClick={() => setMobileOpen(false)}
                                        className="text-center py-2.5 rounded-lg text-sm font-semibold"
                                        style={{ border: '1px solid rgba(201,168,76,0.4)', color: '#c9a84c' }}>
                                        로그인
                                    </Link>
                                    <Link href="/consultation" onClick={() => setMobileOpen(false)}
                                        className="text-center py-2.5 rounded-lg text-sm font-bold btn-gold">
                                        상담 신청하기
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
