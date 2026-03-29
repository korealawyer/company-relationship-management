'use client';

import { Building2, Mic, Search, Sparkles, X } from 'lucide-react';
import type { Company } from '@/lib/types';
import { CompanyCard } from './CompanyCard';

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

interface CompanyListProps {
  filtered: Company[];
  search: string;
  setSearch: (v: string) => void;
  lastCallMap: Record<string, string>;
  onSelect: (co: Company) => void;
}

export function CompanyList({ filtered, search, setSearch, lastCallMap, onSelect }: CompanyListProps) {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* 상단 타이틀 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: C.text1 }}>음성 메모 녹음</h1>
        <p style={{ fontSize: 15, color: C.text3, margin: 0 }}>통화할 기업을 선택하면 음성 녹음이 시작됩니다. AI가 자동으로 내용을 정리해 CRM에 저장합니다.</p>
      </div>

      {/* 안내 카드 3종 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { icon: Building2, color: C.green, bg: C.greenBg, title: '① 기업 선택', desc: '아래 목록에서 통화할 기업을 클릭하세요' },
          { icon: Mic, color: C.red, bg: C.redBg, title: '② 녹음 시작', desc: '빨간 버튼을 누르면 통화 내용이 녹음됩니다' },
          { icon: Sparkles, color: C.purple, bg: C.purpleBg, title: '③ AI 정리', desc: 'AI가 핵심 내용을 요약해 CRM에 자동 저장합니다' },
        ].map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} style={{
            padding: '16px', borderRadius: 12,
            background: bg, border: `1px solid ${color}20`,
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon style={{ width: 18, height: 18, color }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text1, margin: '0 0 3px' }}>{title}</p>
              <p style={{ fontSize: 12, color: C.text3, margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 검색 */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '6px 16px',
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
      }}>
        <Search style={{ width: 18, height: 18, color: C.text4, flexShrink: 0 }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="기업명, 전화번호, 담당자 이름으로 검색"
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 15, color: C.text1,
            background: 'transparent', fontFamily: 'inherit', padding: '10px 0',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text4 }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {/* 기업 수 표시 */}
      <p style={{ fontSize: 13, color: C.text3, margin: '0 0 12px', fontWeight: 500 }}>
        {search ? `"${search}" 검색 결과 ${filtered.length}개` : `전체 ${filtered.length}개 기업`}
      </p>

      {/* 기업 목록 — 2컬럼 그리드 (PC) */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Search style={{ width: 40, height: 40, margin: '0 auto 12px', color: C.text4, display: 'block' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: C.text2 }}>검색 결과가 없습니다</p>
          <p style={{ fontSize: 14, color: C.text3 }}>다른 키워드로 검색해보세요</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10 }}>
          {filtered.map(co => (
            <CompanyCard
              key={co.id} co={co} selected={false}
              onClick={() => onSelect(co)}
              lastCallDate={lastCallMap[co.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
