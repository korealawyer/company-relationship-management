import { requireSessionFromCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { CallLock } from '@/lib/types';

export async function GET(request: Request) {
  const auth = await requireSessionFromCookie(request as any);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const supabase = await getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
    
    const { data, error } = await supabase.rpc('get_call_locks_status');

    if (error) {
      if (error.message.includes('Could not find the function') || error.message.includes('schema cache')) {
        const { memLocksCache } = await import('@/lib/memLockStore');
        const now = new Date().getTime();
        
        // Cleanup expired locks
        for (const [key, lock] of memLocksCache.entries()) {
          if (new Date(lock.lockedUntil).getTime() <= now) {
            memLocksCache.delete(key);
          }
        }
        
        return NextResponse.json(Array.from(memLocksCache.values()));
      }

      console.error('Call lock status error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // snake_case -> camelCase mapping
    const locks: CallLock[] = (data || []).map((lock: any) => ({
      companyId: lock.company_id,
      userId: lock.user_id,
      userName: lock.user_name,
      lockedAt: lock.locked_at,
      lockedUntil: lock.locked_until
    }));

    return NextResponse.json(locks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
