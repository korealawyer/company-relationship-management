import { useState, useEffect, useCallback, useMemo } from 'react';
import { getBrowserSupabase } from '@/lib/supabase';
import { CallLock } from '@/lib/types';

export function useCallLocks() {
  const [locks, setLocks] = useState<CallLock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 클라이언트 단에서 타이머가 지나 만료된 락은 투명하게 걸러내는 로직 추가
  const activeLocks = useMemo(() => {
    const now = new Date().getTime();
    return locks.filter(l => new Date(l.lockedUntil).getTime() > now);
  }, [locks]);

  // 초기 데이터 로드
  useEffect(() => {
    async function fetchLocks() {
      try {
        const result = await fetch('/api/call-lock/status');
        if (result.ok) {
          const data = await result.json();
          const items = Array.isArray(data) ? data : (data.data || []);
          const mapped = items.map((item: any) => ({
            id: item.id,
            companyId: item.companyId || item.company_id,
            userId: item.userId || item.user_id,
            userName: item.userName || item.user_name || '',
            lockedAt: item.lockedAt || item.locked_at,
            lockedUntil: item.lockedUntil || item.locked_until || '',
          }));
          setLocks(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch initial call locks:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLocks();
  }, []);

  // Realtime 구독
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel('public:call_locks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_locks' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const record = payload.new as any;
            const newLock: CallLock = {
              id: record.id,
              companyId: record.company_id,
              userId: record.user_id,
              userName: record.user_name || '영업팀',
              lockedAt: record.locked_at,
              lockedUntil: record.locked_until || new Date(Date.now() + 30 * 60000).toISOString(),
            };
            setLocks((prev) => {
              const filterIndex = prev.findIndex(l => l.companyId === newLock.companyId);
              if (filterIndex >= 0) {
                 const newArr = [...prev];
                 newArr[filterIndex] = newLock;
                 return newArr;
              }
              return [...prev, newLock];
            });
          } else if (payload.eventType === 'DELETE') {
            const record = payload.old as any;
            setLocks((prev) => prev.filter((l) => {
              // Delete by company_id if available, otherwise by id if accessible
              if (record.company_id) return l.companyId !== record.company_id;
              if (record.id) return l.id !== record.id;
              return true;
            }));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const isLocked = useCallback((companyId: string) => {
    return activeLocks.some((l) => l.companyId === companyId);
  }, [activeLocks]);

  const getLockInfo = useCallback((companyId: string) => {
    return activeLocks.find((l) => l.companyId === companyId);
  }, [activeLocks]);

  const isLockedByMe = useCallback((companyId: string, myUserId: string) => {
    const lock = activeLocks.find((l) => l.companyId === companyId);
    if (!lock) return false;
    return lock.userId === myUserId;
  }, [activeLocks]);

  return { locks: activeLocks, isLoading, isLocked, getLockInfo, isLockedByMe };
}
