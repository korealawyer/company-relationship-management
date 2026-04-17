import { getBrowserSupabase } from '../supabase';

// ==============================================================================
// [Deprecated Zustand Persistence]
// Legacy Type Definitions
export interface CallQueueItem {
    companyId: string;
    companyName: string;
    scheduledAt: string;      // ISO 날짜
    reason: 'no_answer' | 'callback' | 'follow_up' | 'high_risk';
    attempts: number;
    priority: number;         // 1=최고, 5=최저
}

interface LegacyStorageState {
    state: {
        queue: CallQueueItem[];
    };
    version: number;
}
// ==============================================================================

/**
 * 1회성 마이그레이션 함수
 * 브라우저 탭 접속 시 sessionStorage 'ibs_call_queue_v2'를 읽고 DB에 쓰기 작업 수행
 */
export async function runCallbackMigrationToSupabase() {
    if (typeof window === 'undefined') return;

    try {
        const legacyData = sessionStorage.getItem('ibs_call_queue_v2');
        if (!legacyData) return; // No legacy data found

        const parsed: LegacyStorageState = JSON.parse(legacyData);
        const queue = parsed?.state?.queue;
        
        if (!queue || !Array.isArray(queue) || queue.length === 0) {
            sessionStorage.removeItem('ibs_call_queue_v2');
            return;
        }

        const sb = getBrowserSupabase();
        if (!sb) return;

        console.log(`[Migration] Found ${queue.length} items in local CallQueue. Migrating to Supabase...`);

        // Group promises to parallelize
        const promises = queue.map(async (item) => {
            const mappedResult = item.reason === 'no_answer' ? 'no_answer' : 'callback';
            
            return sb.from('companies').update({
                callback_scheduled_at: item.scheduledAt,
                last_call_result: mappedResult,
                // Do not blindly change the status. Trust the current status but just inject the callback property.
            }).eq('id', item.companyId);
        });

        await Promise.all(promises);

        // Delete local cache on success to avoid double migration
        sessionStorage.removeItem('ibs_call_queue_v2');
        console.log(`[Migration] Successfully migrated local callbacks to Supabase.`);

    } catch (e) {
        console.error(`[Migration] Failed to migrate Call Queue:`, e);
    }
}
