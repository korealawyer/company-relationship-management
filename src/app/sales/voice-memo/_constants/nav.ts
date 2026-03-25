import { Mic, Calculator, Users, Headphones, Settings } from 'lucide-react';

/* ─── 사이드바 네비 아이템 ─── */
export const NAV = [
  { href: '/employee',                 icon: Users,      label: 'CRM 대시보드' },
  { href: '/sales/call',               icon: Headphones, label: '전화 영업' },
  { href: '/sales/voice-memo',         icon: Mic,        label: '음성 메모', active: true },
  { href: '/sales/pricing-calculator', icon: Calculator, label: '견적 계산기' },
  { href: '/settings',                 icon: Settings,   label: '설정' },
] as const;
