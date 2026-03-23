'use client';

import { useRequireAuth } from '@/lib/AuthContext';

export default function ClientCompanyHrLayout({ children }: { children: React.ReactNode }) {
    const { loading, authorized } = useRequireAuth(['client_hr']);
    if (loading || !authorized) return null;
    return <>{children}</>;
}
