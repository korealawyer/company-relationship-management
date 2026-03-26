import { Company } from '../store';

const EMAIL_TRACKING_KEY = 'ibs_email_tracking';

export interface EmailTrackEntry {
    companyId: string;
    companyName: string;
    contactName: string;
    emailSentAt: string;
    openedAt: string | null;
    autoOpenAt: string; // 시뮬: 자동 열람 감지 시각
    alerted: boolean;
}

export const EmailTrackingService = {
    _load(): EmailTrackEntry[] {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(localStorage.getItem(EMAIL_TRACKING_KEY) || '[]'); } catch { return []; }
    },
    _save(items: EmailTrackEntry[]) { localStorage.setItem(EMAIL_TRACKING_KEY, JSON.stringify(items)); },

    /** 이메일 발송 시 트래킹 등록 (20초 후 열람 시뮬 — 데모) */
    trackEmail(company: Company): void {
        const items = this._load();
        if (items.find(i => i.companyId === company.id)) return;
        items.push({
            companyId: company.id,
            companyName: company.name,
            contactName: company.contactName || '담당자',
            emailSentAt: new Date().toISOString(),
            openedAt: null,
            autoOpenAt: new Date(Date.now() + 20 * 1000).toISOString(), // 20초 (데모)
            alerted: false,
        });
        this._save(items);
    },

    /** 열람된 이메일 체크 (미알림 건만) */
    checkOpened(): EmailTrackEntry[] {
        const now = new Date().toISOString();
        const items = this._load();
        const opened: EmailTrackEntry[] = [];
        items.forEach(i => {
            if (!i.openedAt && i.autoOpenAt <= now) {
                i.openedAt = now;
            }
            if (i.openedAt && !i.alerted) {
                i.alerted = true;
                opened.push(i);
            }
        });
        if (opened.length > 0) this._save(items);
        return opened;
    },

    getAll(): EmailTrackEntry[] { return this._load(); },
};
