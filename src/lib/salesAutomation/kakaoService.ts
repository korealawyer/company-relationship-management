import { Company } from '../mockStore';

export interface KakaoScheduleItem {
    companyId: string;
    companyName: string;
    contactName: string;
    phone: string;
    template: 'report' | 'followup' | 'remind';
    scheduledAt: string;   // ISO — 발송 예정 시각
    sentAt?: string;       // ISO — 실제 발송 시각
    status: 'scheduled' | 'sending' | 'sent' | 'failed';
}

const KAKAO_SCHEDULE_KEY = 'ibs_kakao_schedule';

export const AutoKakaoService = {
    getAll(): KakaoScheduleItem[] {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem(KAKAO_SCHEDULE_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    _save(items: KakaoScheduleItem[]): void {
        localStorage.setItem(KAKAO_SCHEDULE_KEY, JSON.stringify(items));
    },

    /** 이메일 발송 직후 호출 → 5분 뒤 자동 카카오 예약 */
    scheduleAfterEmail(company: Company): KakaoScheduleItem {
        const items = this.getAll();
        // 중복 방지
        const existing = items.find(i => i.companyId === company.id && i.status === 'scheduled');
        if (existing) return existing;

        const entry: KakaoScheduleItem = {
            companyId: company.id,
            companyName: company.name,
            contactName: company.contactName || '담당자',
            phone: company.contactPhone || company.phone,
            template: 'report',
            scheduledAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5분 뒤
            status: 'scheduled',
        };
        items.push(entry);
        this._save(items);
        return entry;
    },

    /** 예약 시각이 지난 아이템 중 아직 미발송인 것 */
    getPendingSends(): KakaoScheduleItem[] {
        const now = new Date().toISOString();
        return this.getAll().filter(i => i.status === 'scheduled' && i.scheduledAt <= now);
    },

    /** 발송 완료 처리 */
    markSent(companyId: string): void {
        const items = this.getAll().map(i =>
            i.companyId === companyId && i.status === 'scheduled'
                ? { ...i, status: 'sent' as const, sentAt: new Date().toISOString() }
                : i
        );
        this._save(items);
    },

    /** 특정 기업의 카카오 스케줄 상태 */
    getStatus(companyId: string): KakaoScheduleItem | null {
        const items = this.getAll();
        return items.find(i => i.companyId === companyId) || null;
    },

    /** 예약 취소 */
    cancel(companyId: string): void {
        const items = this.getAll().filter(i => i.companyId !== companyId);
        this._save(items);
    },

    /** 남은 시간(초) — 0 이하면 발송 시점 경과 */
    getRemainingSeconds(item: KakaoScheduleItem): number {
        return Math.max(0, Math.floor((new Date(item.scheduledAt).getTime() - Date.now()) / 1000));
    },
};
