import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CasesClient } from './CasesClient';

export default async function CasesPage() {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Ignore if called from Server Component
                    }
                },
            },
        }
    );

    let user = null;
    let error = null;
    try {
        const result = await supabase.auth.getUser();
        user = result.data.user;
        error = result.error;
    } catch (err: any) {
        // console.warn('SSR getUser exception:', err.message);
        error = err;
    }

    if (error || !user) {
        redirect('/login');
    }

    const authSession = {
       id: user.id,
       email: user.email,
       role: user.user_metadata?.role || 'user',
       companyId: user.user_metadata?.companyId || null,
       companyName: user.user_metadata?.companyName || null,
       name: user.user_metadata?.name || null,
    };

    return <CasesClient initialUser={authSession} />;
}