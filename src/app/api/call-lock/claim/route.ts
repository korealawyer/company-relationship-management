import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { companyId, userId, userName } = await request.json();
    const supabase = getServiceSupabase();
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase is not configured' }, { status: 500 });
    
    const { data, error } = await supabase.rpc('claim_company_call', { 
      p_company_id: companyId, 
      p_user_id: userId, 
      p_user_name: userName, 
      p_lock_minutes: 30 
    });

    if (error) {
      console.error('Call lock claim error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
