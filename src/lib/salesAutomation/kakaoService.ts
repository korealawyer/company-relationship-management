import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Company } from '../store';

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

interface KakaoStore {
    items: KakaoScheduleItem[];
    scheduleAfterEmail: (company: Company) => KakaoScheduleItem;
    markSent: (companyId: string) => void;
    cancel: (companyId: string) => void;
}

export const useKakaoStore = create<KakaoStore>()(
    persist(
        (set, get) => ({
            items: [],

            scheduleAfterEmail: (company) => {
                const existing = get().items.find(i => i.companyId === company.id && i.status === 'scheduled');
                if (existing) return existing;

                const entry: KakaoScheduleItem = {
                    companyId: company.id,
                    companyName: company.name,
                    contactName: company.contactName || '담당자',
                    phone: company.contactPhone || company.phone,
                    template: 'report',
                    scheduledAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                    status: 'scheduled',
                };
                set({ items: [...get().items, entry] });
                return entry;
            },

            markSent: (companyId) => {
                set({
                    items: get().items.map(i =>
                        i.companyId === companyId && i.status === 'scheduled'
                            ? { ...i, status: 'sent', sentAt: new Date().toISOString() }
                            : i
                    )
                });
            },

            cancel: (companyId) => {
                set({ items: get().items.filter(i => i.companyId !== companyId) });
            }
        }),
        {
            name: 'ibs_kakao_schedule_v2',
            storage: createJSONStorage(() => {
                if (typeof window !== 'undefined') return sessionStorage;
                return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
            }),
        }
    )
);

// 레거시 호환 래퍼
export const AutoKakaoService = {
    getAll: () => useKakaoStore.getState().items,
    
    scheduleAfterEmail: (company: Company) => useKakaoStore.getState().scheduleAfterEmail(company),

    getPendingSends: () => {
        const now = new Date().toISOString();
        return useKakaoStore.getState().items.filter(i => i.status === 'scheduled' && i.scheduledAt <= now);
    },

    markSent: (companyId: string) => useKakaoStore.getState().markSent(companyId),

    getStatus: (companyId: string): KakaoScheduleItem | null => {
        return useKakaoStore.getState().items.find(i => i.companyId === companyId) || null;
    },

    cancel: (companyId: string) => useKakaoStore.getState().cancel(companyId),

    getRemainingSeconds: (item: KakaoScheduleItem): number => {
        return Math.max(0, Math.floor((new Date(item.scheduledAt).getTime() - Date.now()) / 1000));
    },
};
