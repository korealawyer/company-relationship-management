// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { store, Company, CaseStatus, AutoSettings, AutoLog } from '@/lib/mockStore';
import { getSession } from '@/lib/auth';

export function useEmployeeCRM() {
    const [role, setRole] = useState<string | null>(null);
    useEffect(() => {
        const s = getSession();
        setRole(s?.role || null);
    }, []);
    const isAdmin = role === 'admin' || role === 'super_admin';

    const [companies, setCompanies] = useState<Company[]>([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | CaseStatus>('all');
    
    // Auto panel and UI state
    const [autoSettings, setAutoSettings] = useState<AutoSettings>(store.getAutoSettings());
    const [autoLogs, setAutoLogs] = useState<AutoLog[]>(store.getLogs());
    
    const [viewMode, setViewMode] = useState<'table' | 'phone' | 'kanban'>('table');
    const [toast, setToast] = useState<string | null>(null);

    const refresh = useCallback(() => {
        setCompanies([...store.getAll()]);
        setAutoLogs([...store.getLogs()]);
        setAutoSettings(store.getAutoSettings());
    }, []);

    useEffect(() => { 
        refresh(); 
        const id = setInterval(refresh, 2000); 
        const instantRefresh = () => refresh();
        window.addEventListener('new-crm-lead', instantRefresh);
        return () => {
            clearInterval(id);
            window.removeEventListener('new-crm-lead', instantRefresh);
        };
    }, [refresh]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    const showToast = (msg: string) => setToast(msg);

    const updateAuto = (patch: Partial<AutoSettings>) => {
        const s = store.updateAutoSettings(patch, '영업팀');
        setAutoSettings(s);
        setAutoLogs([...store.getLogs()]);
    };

    const clearLogs = () => {
        store.clearLogs();
        setAutoLogs([]);
    };

    return {
        role, isAdmin,
        companies, search, setSearch,
        filterStatus, setFilterStatus,
        autoSettings, autoLogs, updateAuto, clearLogs,
        viewMode, setViewMode,
        toast, showToast,
        refresh
    };
}
