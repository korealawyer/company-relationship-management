import { requireSessionFromCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const auth = await requireSessionFromCookie(request as any);
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { companyId, userId } = await request.json();
    const supabase = await getServerSupabase();
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase is not configured' }, { status: 500 });
    
    const { data, error } = await supabase.rpc('release_company_call', { 
      p_company_id: companyId, 
      p_user_id: userId 
    });

    if (error) {
      if (error.message.includes('Could not find the function') || error.message.includes('schema cache')) {
        const { memLocksCache } = await import('@/lib/memLockStore');
        const existing = memLocksCache.get(companyId);
        
        if (existing && existing.userId === userId) {
          memLocksCache.delete(companyId);
        }
        
        return NextResponse.json({ success: true });
      }

      console.error('Call lock release error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
