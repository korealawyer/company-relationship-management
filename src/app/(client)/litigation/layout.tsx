'use client';

import { useRequireAuth } from '@/lib/AuthContext';

export default function LitigationLayout({ children }: { children: React.ReactNode }) {
    const { loading, authorized } = useRequireAuth(['super_admin', 'admin', 'litigation']);
    
    if (loading || !authorized) return null;
    
    return <>{children}</>;
}
