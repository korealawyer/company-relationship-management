import { create } from 'zustand';

interface SalesUIState {
    statusFilter: string;
    sortKey: string;
    sortAsc: boolean;
    activeCallId: string | null;
    toast: string;
    setStatusFilter: (filter: string) => void;
    setSortKey: (key: string) => void;
    setSortAsc: (asc: boolean) => void;
    setActiveCallId: (id: string | null) => void;
    setToast: (toast: string) => void;
}

export const useSalesUIStore = create<SalesUIState>((set) => ({
    statusFilter: 'all',
    sortKey: 'risk_score',
    sortAsc: false,
    activeCallId: null,
    toast: '',

    setStatusFilter: (filter) => set({ statusFilter: filter }),
    setSortKey: (key) => set({ sortKey: key }),
    setSortAsc: (asc) => set({ sortAsc: asc }),
    setActiveCallId: (id) => set({ activeCallId: id }),
    setToast: (toast) => {
        set({ toast });
        if (toast) {
            setTimeout(() => set({ toast: '' }), 5000);
        }
    },
}));
