import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Company } from '../store';

export interface CallQueueItem {
    companyId: string;
    companyName: string;
    scheduledAt: string;      // ISO 날짜
    reason: 'no_answer' | 'callback' | 'follow_up' | 'high_risk';
    attempts: number;
    priority: number;         // 1=최고, 5=최저
}

interface CallQueueStore {
    queue: CallQueueItem[];
    addToQueue: (item: Omit<CallQueueItem, 'priority'>) => void;
    removeFromQueue: (companyId: string) => void;
    scheduleNoAnswer: (company: Company) => CallQueueItem;
    scheduleCallback: (company: Company, callbackTime: string) => CallQueueItem;
}

export const useCallQueueStore = create<CallQueueStore>()(
    persist(
        (set, get) => ({
            queue: [],

            addToQueue: (item) => {
                const priority = item.reason === 'high_risk' ? 1
                    : item.reason === 'callback' ? 2
                    : item.reason === 'follow_up' ? 3 : 4;
                
                const newQueue = [...get().queue, { ...item, priority }];
                newQueue.sort((a, b) => a.priority - b.priority);
                set({ queue: newQueue });
            },

            removeFromQueue: (companyId) => {
                set({ queue: get().queue.filter(q => q.companyId !== companyId) });
            },

            scheduleNoAnswer: (company) => {
                const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                const item: Omit<CallQueueItem, 'priority'> = {
                    companyId: company.id,
                    companyName: company.name,
                    scheduledAt,
                    reason: 'no_answer',
                    attempts: (company.callAttempts || 0) + 1,
                };
                get().addToQueue(item);
                return { ...item, priority: 4 };
            },

            scheduleCallback: (company, callbackTime) => {
                const item: Omit<CallQueueItem, 'priority'> = {
                    companyId: company.id,
                    companyName: company.name,
                    scheduledAt: callbackTime,
                    reason: 'callback',
                    attempts: (company.callAttempts || 0) + 1,
                };
                get().addToQueue(item);
                return { ...item, priority: 2 };
            }
        }),
        {
            name: 'ibs_call_queue_v2',
            storage: createJSONStorage(() => {
                if (typeof window !== 'undefined') return sessionStorage;
                return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
            }),
        }
    )
);

// 레거시 호환 래퍼
export const CallQueueManager = {
    getQueue: () => useCallQueueStore.getState().queue,
    addToQueue: (item: Omit<CallQueueItem, 'priority'>) => useCallQueueStore.getState().addToQueue(item),
    removeFromQueue: (companyId: string) => useCallQueueStore.getState().removeFromQueue(companyId),
    scheduleNoAnswer: (company: Company) => useCallQueueStore.getState().scheduleNoAnswer(company),
    scheduleCallback: (company: Company, callbackTime: string) => useCallQueueStore.getState().scheduleCallback(company, callbackTime),
    getUpcoming: (limit = 5) => {
        const now = new Date().toISOString();
        return useCallQueueStore.getState().queue
            .filter(q => q.scheduledAt <= now || q.reason === 'high_risk')
            .slice(0, limit);
    },
    getPendingCount: () => useCallQueueStore.getState().queue.length,
};
