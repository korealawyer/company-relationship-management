import { LitigationStatus } from '@/lib/types';

export const STATUS_TEXT_MAP: Record<LitigationStatus, string> = {
    preparing: '#64748b', filed: '#2563eb', hearing: '#d97706',
    settlement: '#7c3aed', judgment: '#b8960a', closed: '#16a34a',
};
export const STATUSES: LitigationStatus[] = ['preparing', 'filed', 'hearing', 'settlement', 'judgment', 'closed'];

export function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
}
