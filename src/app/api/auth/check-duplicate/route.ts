import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { type, value } = await req.json();
        const sb = getServiceSupabase();
        
        if (!sb) {
            return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
        }

        if (type === 'email') {
            const email = String(value).toLowerCase().trim();
            const { data, error } = await sb.from('users').select('id').eq('email', email).maybeSingle();
            
            // If error, log it but don't fail immediately, just assume it might not exist or connection issue
            if (error) {
                console.error('Email check error:', error);
                return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
            }
            
            return NextResponse.json({ duplicate: !!data });
        } else if (type === 'bizNum') {
            const digits = String(value).replace(/\D/g, '');
            const { data, error } = await sb.from('companies').select('id').eq('biz_no', digits).maybeSingle();
            
            if (error) {
                console.error('BizNum check error:', error);
                return NextResponse.json({ error: 'Failed to verify bizNum' }, { status: 500 });
            }
            
            return NextResponse.json({ duplicate: !!data });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
