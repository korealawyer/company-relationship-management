import { C } from '../_constants/colors';
import { type Company } from '@/lib/store';

/** 전화번호에서 숫자와 + 기호만 남깁니다. */
export function cleanPhone(raw: string): string {
  return raw.replace(/[^0-9+]/g, '');
}

/** 초(seconds)를 MM:SS 포맷으로 변환합니다. */
export function fmtTime(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** 통화 결과에 따른 뱃지 스타일(bg, color, label)을 반환합니다. */
export function resultStyle(r: string): { bg: string; color: string; label: string } {
  if (r === 'connected') return { bg: C.greenBg,   color: C.green,   label: '✅ 연결됨' };
  if (r === 'callback')  return { bg: C.primaryBg, color: C.primary, label: '📋 콜백예정' };
  return                        { bg: C.amberBg,   color: C.amber,   label: '📵 부재중' };
}

/** 기업의 전화번호 목록을 우선순위별로 정리합니다. */
export function getPhoneList(co: Company): { label: string; phone: string; isPrimary: boolean }[] {
  const list: { label: string; phone: string; isPrimary: boolean }[] = [];
  if (co.contactPhone) list.push({ label: `${co.contactName || '담당자'} 휴대폰`, phone: co.contactPhone, isPrimary: true });
  if (co.phone && co.phone !== co.contactPhone) list.push({ label: '회사 대표번호', phone: co.phone, isPrimary: !co.contactPhone });
  co.contacts?.forEach(ct => {
    if (ct.phone && ct.phone !== co.contactPhone && ct.phone !== co.phone)
      list.push({ label: `${ct.name} (${ct.role || ct.department || ''})`, phone: ct.phone, isPrimary: false });
  });
  return list;
}

/** 기업의 대표 전화번호를 반환합니다. */
export function getPrimaryPhone(co: Company): string {
  return co.contactPhone || co.phone || '';
}
