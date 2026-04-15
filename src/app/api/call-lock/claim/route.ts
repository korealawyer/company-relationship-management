import { requireSessionFromCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const auth = await requireSessionFromCookie(request as any);
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { companyId, userId, userName } = await request.json();
    const supabase = await getServerSupabase();
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase is not configured' }, { status: 500 });
    
    const { data, error } = await supabase.rpc('claim_company_call', { 
      p_company_id: companyId, 
      p_user_id: userId, 
      p_user_name: userName, 
      p_lock_minutes: 30 
    });

    if (error) {
      // Fallback for missing SQL schema in development
      if (error.message.includes('Could not find the function') || error.message.includes('schema cache')) {
        const { memLocksCache } = await import('@/lib/memLockStore');
        const now = new Date();
        const existing = memLocksCache.get(companyId);

        if (existing && new Date(existing.lockedUntil).getTime() > now.getTime() && existing.userId !== userId) {
          return NextResponse.json({
            success: false,
            locked_by: existing.userName,
            locked_until: existing.lockedUntil
          });
        }

        const lockedUntil = new Date(now.getTime() + 30 * 60000).toISOString();
        memLocksCache.set(companyId, {
          companyId,
          userId,
          userName,
          lockedAt: now.toISOString(),
          lockedUntil
        });

        return NextResponse.json({ success: true, locked_until: lockedUntil });
      }

      console.error('Call lock claim error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
