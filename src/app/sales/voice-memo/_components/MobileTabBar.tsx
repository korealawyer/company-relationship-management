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

export default function MobileTabBar() {
  return (
    <nav className="flex md:hidden" style={{
      position: 'sticky', bottom: 0,
      background: C.surface,
      borderTop: `1px solid ${C.border}`,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ display: 'flex', width: '100%' }}>
        {NAV.map(item => {
          const Icon = item.icon;
          const isActive = item.active;
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, textDecoration: 'none', padding: '10px 4px',
              position: 'relative',
            }}>
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 24, height: 3, borderRadius: 2, background: C.primary,
                }} />
              )}
              <Icon style={{ width: 22, height: 22, color: isActive ? C.primary : C.text4, strokeWidth: isActive ? 2.2 : 1.8 }} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? C.primary : C.text4 }}>
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
