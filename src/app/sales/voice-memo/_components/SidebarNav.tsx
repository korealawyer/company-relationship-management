'use client';
import Link from 'next/link';
import {
  Mic, Calculator, Users, Headphones, Settings,
} from 'lucide-react';

/* ─── 디자인 토큰 ─── */
const C = {
  bg:       '#F0F2F5',
  surface:  '#FFFFFF',
  card:     '#FFFFFF',
  border:   '#E1E4E8',
  divider:  '#F0F2F5',

  text1:    '#111827',
  text2:    '#374151',
  text3:    '#6B7280',
  text4:    '#9CA3AF',

  primary:   '#2563EB',
  primaryBg: '#EFF6FF',
  primaryLight: '#BFDBFE',

  green:   '#059669',
  greenBg: '#ECFDF5',
  greenLight: '#A7F3D0',

  red:   '#DC2626',
  redBg: '#FEF2F2',

  amber:   '#D97706',
  amberBg: '#FFFBEB',

  purple:   '#7C3AED',
  purpleBg: '#F5F3FF',
};

/* ─── 사이드바 네비 아이템 ─── */
const NAV = [
  { href: '/employee',                  icon: Users,      label: 'CRM 대시보드' },
  { href: '/sales/call',                icon: Headphones, label: '전화 영업' },
  { href: '/sales/voice-memo',          icon: Mic,        label: '음성 메모', active: true },
  { href: '/sales/pricing-calculator',  icon: Calculator, label: '견적 계산기' },
  { href: '/settings',                  icon: Settings,   label: '설정' },
];

export default function SidebarNav() {
  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 80, height: 'calc(100dvh - 80px)',
    }}
      className="hidden md:flex"
    >
      {/* 로고 */}
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
        <Link href="/employee" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#2563EB,#7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>IB</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text1, margin: 0 }}>IBS 영업팀</p>
              <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>CRM 플랫폼</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 메뉴 */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.text4, margin: '0 0 8px 8px', letterSpacing: '0.05em' }}>영업 도구</p>
        {NAV.map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: item.active ? C.primaryBg : 'transparent',
                color: item.active ? C.primary : C.text2,
                fontWeight: item.active ? 600 : 400,
                fontSize: 14,
                transition: 'all 0.15s',
                borderLeft: item.active ? `3px solid ${C.primary}` : '3px solid transparent',
              }}>
                <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* 하단 정보 */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.text4, lineHeight: 1.8 }}>
          <p style={{ margin: 0, fontWeight: 600, color: C.text3 }}>음성 메모</p>
          <p style={{ margin: 0 }}>통화 → 녹음 → AI 변환</p>
          <p style={{ margin: 0 }}>CRM 자동 동기화</p>
        </div>
      </div>
    </aside>
  );
}
