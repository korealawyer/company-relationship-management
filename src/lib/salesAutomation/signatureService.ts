import { Company, store } from '../mockStore';

const SIGNATURE_KEY = 'ibs_auto_signature';

export interface SignatureWatch {
    companyId: string;
    companyName: string;
    sentAt: string;
    autoDetectAt: string; // 자동 감지 예정 시각
    status: 'watching' | 'signed' | 'expired';
}

export const AutoSignatureService = {
    _load(): SignatureWatch[] {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(localStorage.getItem(SIGNATURE_KEY) || '[]'); } catch { return []; }
    },
    _save(items: SignatureWatch[]) { localStorage.setItem(SIGNATURE_KEY, JSON.stringify(items)); },

    /** 계약서 발송 시 서명 감시 등록 (30초 후 자동 감지 — 데모용, 프로덕션: 웹훅) */
    watchForSignature(company: Company): SignatureWatch {
        const items = this._load();
        const existing = items.find(i => i.companyId === company.id);
        if (existing) return existing;
        const entry: SignatureWatch = {
            companyId: company.id,
            companyName: company.name,
            sentAt: new Date().toISOString(),
            autoDetectAt: new Date(Date.now() + 30 * 1000).toISOString(), // 30초 후 (데모)
            status: 'watching',
        };
        items.push(entry);
        this._save(items);
        return entry;
    },

    /** 서명 완료된 기업 체크 (폴링) */
    checkSigned(): SignatureWatch[] {
        const now = new Date().toISOString();
        const items = this._load();
        const signed: SignatureWatch[] = [];
        items.forEach(i => {
            if (i.status === 'watching' && i.autoDetectAt <= now) {
                i.status = 'signed';
                signed.push(i);
            }
        });
        if (signed.length > 0) this._save(items);
        return signed;
    },

    getAll(): SignatureWatch[] { return this._load(); },
    getStatus(companyId: string): SignatureWatch | null {
        return this._load().find(i => i.companyId === companyId) || null;
    },
};
