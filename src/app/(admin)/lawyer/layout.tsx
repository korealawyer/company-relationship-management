'use client';

import { useRequireAuth } from '@/lib/AuthContext';

export default function LawyerLayout({ children }: { children: React.ReactNode }) {
    const { loading, authorized } = useRequireAuth(['super_admin', 'admin', 'lawyer']);
    
    if (loading || !authorized) return null;
    
    return <>{children}</>;
}
