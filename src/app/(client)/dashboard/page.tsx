import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DashboardClient, ClientPortalLanding } from './DashboardClient';

export default async function DashboardPage() {
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
        return <ClientPortalLanding />;
    }

    const role = user.user_metadata?.role || 'user';
    const allowedRoles = ['super_admin', 'admin', 'client_hr'];
    
    if (!allowedRoles.includes(role)) {
         return <ClientPortalLanding />;
    }

    const authSession = {
       id: user.id,
       email: user.email,
       role,
       companyId: user.user_metadata?.companyId || null,
       companyName: user.user_metadata?.companyName || null,
       name: user.user_metadata?.name || null,
    };

    // Fetch company server-side 
    let initialCompany = null;
    try {
       let query = supabase.from('companies').select('*');
       if (authSession.companyId) {
           query = query.eq('id', authSession.companyId);
       } else if (authSession.email) {
           query = query.or(`email.eq.${authSession.email},contact_email.eq.${authSession.email}`);
       } else {
           // No valid id or email to lookup
           query = query.eq('id', 'INVALID');
       }
       const { data } = await query.single();
       if (data) {
           // Mapping raw row to Company interface partially
           initialCompany = {
               id: data.id,
               name: data.name,
               email: data.email,
               contactEmail: data.contact_email,
               status: data.status,
               issues: data.issues || [],
               lawyerConfirmed: data.lawyer_confirmed || false,
               riskLevel: data.risk_level || ''
           };
       }
    } catch(err) {
       console.log("Failed to fetch initial company for dashboard", err);
    }

    return <DashboardClient initialUser={authSession} initialCompany={initialCompany} />;
}
