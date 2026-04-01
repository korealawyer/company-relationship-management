import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { CallLock } from '@/lib/types';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
    
    const { data, error } = await supabase.rpc('get_call_locks_status');

    if (error) {
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
