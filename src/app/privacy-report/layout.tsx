'use client';

import { useRequireAuth } from '@/lib/AuthContext';

export default function ClientPrivacyReportLayout({ children }: { children: React.ReactNode }) {
    const { loading, authorized } = useRequireAuth(['super_admin', 'admin', 'client_hr']);
    if (loading || !authorized) return null;
    return <>{children}</>;
}
