'use client';

import { useRequireAuth } from '@/lib/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { loading, authorized } = useRequireAuth(['super_admin', 'admin', 'sales']);
    if (loading || !authorized) return null;
    return <>{children}</>;
}