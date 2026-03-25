import { CaseStatus, LawCase } from '@/types/cases';

export const STATUS_MAP: Record<CaseStatus, { label: string; color: string; bg: string }> = {
    active: { label: '진행 중', color: '#3b82f6', bg: '#eff6ff' },
    pending: { label: '준비 중', color: '#f59e0b', bg: '#fffbeb' },
    won: { label: '승소', color: '#22c55e', bg: '#f0fdf4' },
    settled: { label: '합의', color: '#8b5cf6', bg: '#f5f3ff' },
    closed: { label: '종결', color: '#6b7280', bg: '#f9fafb' },
};

export function getDynamicStatus(c: LawCase): { label: string; color: string; bg: string; twClass: string } {
    if (c.status !== 'pending') {
        const s = STATUS_MAP[c.status];
        return { ...s, twClass: `text-[${s.color}] bg-[${s.bg}]` };
    }
    
    // filedDate 타임스탬프와 id를 기반으로 동적 상태 도출
    const timeNum = new Date(c.filedDate || 0).getTime();
    const hash = (timeNum + (c.id ? c.id.charCodeAt(0) : 0)) % 3;
    
    if (hash === 0) return { label: '배정 대기', color: '#ea580c', bg: '#ffedd5', twClass: 'bg-orange-100 text-orange-600' };
    if (hash === 1) return { label: '검토 대기', color: '#d97706', bg: '#fef3c7', twClass: 'bg-yellow-100 text-yellow-600' };
    return { label: '승인 요청', color: '#dc2626', bg: '#fee2e2', twClass: 'bg-red-100 text-red-600' };
}
