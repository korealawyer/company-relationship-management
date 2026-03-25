import { Company, store } from '../mockStore';

export interface CallQueueItem {
    companyId: string;
    companyName: string;
    scheduledAt: string;      // ISO 날짜
    reason: 'no_answer' | 'callback' | 'follow_up' | 'high_risk';
    attempts: number;
    priority: number;         // 1=최고, 5=최저
}

const CALL_QUEUE_KEY = 'ibs_call_queue';

export const CallQueueManager = {
    getQueue(): CallQueueItem[] {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem(CALL_QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    addToQueue(item: Omit<CallQueueItem, 'priority'>): void {
        const queue = this.getQueue();
        const priority = item.reason === 'high_risk' ? 1
            : item.reason === 'callback' ? 2
            : item.reason === 'follow_up' ? 3 : 4;
        queue.push({ ...item, priority });
        queue.sort((a, b) => a.priority - b.priority);
        localStorage.setItem(CALL_QUEUE_KEY, JSON.stringify(queue));
    },

    removeFromQueue(companyId: string): void {
        const queue = this.getQueue().filter(q => q.companyId !== companyId);
        localStorage.setItem(CALL_QUEUE_KEY, JSON.stringify(queue));
    },

    scheduleNoAnswer(company: Company): CallQueueItem {
        const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const item: Omit<CallQueueItem, 'priority'> = {
            companyId: company.id,
            companyName: company.name,
            scheduledAt,
            reason: 'no_answer',
            attempts: (company.callAttempts || 0) + 1,
        };
        this.addToQueue(item);
        return { ...item, priority: 4 };
    },

    scheduleCallback(company: Company, callbackTime: string): CallQueueItem {
        const item: Omit<CallQueueItem, 'priority'> = {
            companyId: company.id,
            companyName: company.name,
            scheduledAt: callbackTime,
            reason: 'callback',
            attempts: (company.callAttempts || 0) + 1,
        };
        this.addToQueue(item);
        return { ...item, priority: 2 };
    },

    getUpcoming(limit = 5): CallQueueItem[] {
        const now = new Date().toISOString();
        return this.getQueue()
            .filter(q => q.scheduledAt <= now || q.reason === 'high_risk')
            .slice(0, limit);
    },

    getPendingCount(): number {
        return this.getQueue().length;
    },
};
