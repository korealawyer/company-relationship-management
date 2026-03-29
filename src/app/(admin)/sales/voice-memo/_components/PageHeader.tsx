'use client';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, Mic, Calculator, Headphones, LayoutDashboard,
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

interface PageHeaderProps {
  step: 'select' | 'record' | 'result';
  selectedName?: string;
  onBack: () => void;
}

export default function PageHeader({ step, selectedName, onBack }: PageHeaderProps) {
  return (
    <header style={{
      background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      padding: '0 24px',
      height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 80, zIndex: 30,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {step !== 'select' && (
          <button onClick={onBack} style={{
            width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: 4,
          }}>
            <ArrowLeft style={{ width: 16, height: 16, color: C.text2 }} />
          </button>
        )}
        {/* 브레드크럼 */}
        <Link href="/employee" style={{ fontSize: 13, color: C.primary, textDecoration: 'none', fontWeight: 500 }}>영업팀</Link>
        <ChevronRight style={{ width: 14, height: 14, color: C.text4 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>
          {step === 'select' ? '음성 메모' : step === 'record' ? (selectedName || '녹음') : '메모 완료'}
        </span>
      </div>
      {/* 퀵 버튼들 (상단 네비게이션) */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        <Link href="/employee" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.surface, color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}>
            <LayoutDashboard style={{ width: 14, height: 14 }} />
            <span className="hidden sm:inline">대시보드</span>
          </button>
        </Link>
        <Link href="/sales/call" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.surface, color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}>
            <Headphones style={{ width: 14, height: 14 }} />
            <span className="hidden sm:inline">전화 영업</span>
          </button>
        </Link>
        <Link href="/sales/voice-memo" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.primary}`,
            background: '#eef2ff', color: C.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}>
            <Mic style={{ width: 14, height: 14 }} />
            <span className="hidden sm:inline">음성 메모</span>
          </button>
        </Link>
        <Link href="/sales/pricing-calculator" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.surface, color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}>
            <Calculator style={{ width: 14, height: 14 }} />
            <span className="hidden sm:inline">견적 계산기</span>
          </button>
        </Link>
      </div>
    </header>
  );
}
