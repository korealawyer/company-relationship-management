'use client';

import { useRequireAuth } from '@/lib/AuthContext';

export default function CounselorLayout({ children }: { children: React.ReactNode }) {
    const { loading, authorized } = useRequireAuth(['super_admin', 'admin', 'counselor']);
    
    if (loading || !authorized) return null;
    
    return <>{children}</>;
}
