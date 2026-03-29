'use client';

import React, { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import ClientBillingMain from './components/ClientBillingMain';
import { InternalBillingMain } from './components/InternalBillingMain';

export default function BillingPage() {
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const s = getSession();
        setRole(s?.role || null);
    }, []);

    if (role === 'client_hr') {
        return <ClientBillingMain />;
    }

    return <InternalBillingMain />;
}
