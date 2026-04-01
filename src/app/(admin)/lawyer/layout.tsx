'use client';

import { useRequireAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';
import { RoleType } from '@/lib/types';

export default function LawyerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPrivacyReview = pathname.startsWith('/lawyer/privacy-review');
    const allowedRoles: RoleType[] = isPrivacyReview 
        ? ['super_admin', 'admin', 'lawyer', 'sales'] 
        : ['super_admin', 'admin', 'lawyer'];

    const { loading, authorized } = useRequireAuth(allowedRoles);
    
    if (loading || !authorized) return null;
    
    return <>{children}</>;
}
