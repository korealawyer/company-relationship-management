import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// POST /api/memos — Add a memo to a company
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { companyId, author, content } = body;

        if (!companyId || !content) {
            return NextResponse.json({ error: 'Missing companyId or content' }, { status: 400 });
        }

        const sb = await getServerSupabase();
        if (!sb) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
        }

        const memoId = crypto.randomUUID();
        const now = new Date().toISOString();

        // 1) Insert into company_memos
        const { error: memoErr } = await sb.from('company_memos').insert({
            id: memoId,
            company_id: companyId,
            author: author || '영업팀',
            content: content.trim(),
            created_at: now,
        });

        if (memoErr) {
            console.error('Failed to insert memo:', memoErr);
            return NextResponse.json({ error: memoErr.message }, { status: 500 });
        }

        // 2) Update company's call_note to the latest memo content
        await sb.from('companies').update({
            call_note: content.trim(),
            updated_at: now,
        }).eq('id', companyId);

        return NextResponse.json({
            success: true,
            memo: { id: memoId, companyId, author: author || '영업팀', content: content.trim(), createdAt: now },
        });
    } catch (err: any) {
        console.error('Memo API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/memos — Delete a memo
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const memoId = searchParams.get('id');
        const companyId = searchParams.get('companyId');

        if (!memoId) {
            return NextResponse.json({ error: 'Missing memo id' }, { status: 400 });
        }

        const sb = await getServerSupabase();
        if (!sb) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
        }

        // Delete the memo
        const { error } = await sb.from('company_memos').delete().eq('id', memoId);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update callNote to the latest remaining memo
        if (companyId) {
            const { data: remaining } = await sb
                .from('company_memos')
                .select('content')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })
                .limit(1);

            await sb.from('companies').update({
                call_note: remaining?.[0]?.content || '',
                updated_at: new Date().toISOString(),
            }).eq('id', companyId);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET /api/memos — Get memos for a company
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');

        if (!companyId) {
            return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
        }

        const sb = await getServerSupabase();
        if (!sb) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
        }

        const { data, error } = await sb
            .from('company_memos')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Convert snake_case to camelCase
        const memos = (data || []).map(row => ({
            id: row.id,
            companyId: row.company_id,
            author: row.author,
            content: row.content,
            createdAt: row.created_at,
        }));

        return NextResponse.json({ memos });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
