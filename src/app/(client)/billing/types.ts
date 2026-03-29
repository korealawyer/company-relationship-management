export interface PaymentRecord {
    id: string;
    companyId: string;
    companyName: string;
    plan: string;
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'overdue';
    method: string;
    invoiceNo: string;
}

export const PLAN_PRICE: Record<string, number> = {
    starter: 330000,
    standard: 550000,
    premium: 1100000,
    none: 0,
};

export const PLAN_LABEL: Record<string, string> = {
    starter: 'Entry',
    standard: 'Growth',
    premium: 'Scale',
    none: '-',
};

export const PAY_STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
    paid: { label: '결제 완료', color: '#059669', bg: '#ecfdf5' },
    pending: { label: '결제 대기', color: '#d97706', bg: '#fffbeb' },
    overdue: { label: '연체', color: '#dc2626', bg: '#fef2f2' },
};

export const T = {
    bg: '#f8f7f4', card: '#ffffff', heading: '#111827', body: '#374151',
    muted: '#6b7280', faint: '#9ca3af', border: '#e8e5de', borderSub: '#f0ede6',
    gold: '#c9a84c', goldBg: 'rgba(201,168,76,0.08)',
};

export function formatW(n: number) {
    if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
    if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
    return n.toLocaleString();
}
