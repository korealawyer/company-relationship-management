'use client';

import { Building2, Phone, ChevronRight } from 'lucide-react';
import type { Company } from '@/lib/mockStore';

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

interface CompanyCardProps {
  co: Company;
  onClick: () => void;
  selected: boolean;
  lastCallDate?: string;
}

export function CompanyCard({ co, onClick, selected, lastCallDate }: CompanyCardProps) {
  const phone = co.contactPhone || co.phone || '';
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '14px 16px',
        background: selected ? C.primaryBg : C.surface,
        border: `1.5px solid ${selected ? C.primary : C.border}`,
        borderRadius: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: selected ? C.primaryLight : C.divider,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Building2 style={{ width: 20, height: 20, color: selected ? C.primary : C.text3 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{co.name}</span>
          {co.storeCount > 0 && (
            <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, fontWeight: 500, background: C.divider, color: C.text3, flexShrink: 0 }}>
              {co.storeCount.toLocaleString()}개점
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Phone style={{ width: 12, height: 12, color: C.text4, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: C.text3, fontFamily: 'monospace' }}>{phone || '번호 미등록'}</span>
          {co.contactName && <span style={{ fontSize: 12, color: C.text4 }}>· {co.contactName}</span>}
        </div>
      </div>
      <ChevronRight style={{ width: 16, height: 16, color: selected ? C.primary : C.text4, flexShrink: 0 }} />
    </button>
  );
}
