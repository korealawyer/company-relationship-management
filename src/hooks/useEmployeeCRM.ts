import { useState, useEffect, useCallback } from 'react';
import { Company, CaseStatus, type AutoSettings } from '@/lib/types';
import { getSession } from '@/lib/auth';
import { useCompanies, useAutoSettings, useAutoLogs } from '@/hooks/useDataLayer';

export function useEmployeeCRM() {
    const [role, setRole] = useState<string | null>(null);
    useEffect(() => {
        const s = getSession();
        setRole(s?.role || null);
    }, []);
    const isAdmin = role === 'admin' || role === 'super_admin';

    const { companies: dbCompanies, updateCompany, addCompany, importBulk, mutate: mutateCompanies } = useCompanies();
    const { settings: dbSettings, updateSettings, mutate: mutateSettings } = useAutoSettings();
    const { logs: dbLogs, mutate: mutateLogs } = useAutoLogs(); 

    const companies = dbCompanies || [];
    const autoSettings = dbSettings || null;
    const autoLogs = dbLogs || [];

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | CaseStatus>('all');
    
    const [viewMode, setViewMode] = useState<'table' | 'phone' | 'kanban'>('table');
    const [toast, setToast] = useState<string | null>(null);

    const refresh = useCallback(() => {
        mutateCompanies();
        mutateSettings();
        mutateLogs();
    }, [mutateCompanies, mutateSettings, mutateLogs]);

    useEffect(() => { 
        const instantRefresh = () => refresh();
        window.addEventListener('new-crm-lead', instantRefresh);
        return () => {
            window.removeEventListener('new-crm-lead', instantRefresh);
        };
    }, [refresh]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    const showToast = (msg: string) => setToast(msg);

    const updateAuto = async (patch: Partial<AutoSettings>) => {
        await updateSettings(patch);
        refresh();
    };

    const clearLogs = () => {
        // Just clear locally, real fix would be db deletion
        mutateLogs([], false); 
    };

    return {
        role, isAdmin,
        companies, search, setSearch,
        filterStatus, setFilterStatus,
        autoSettings, autoLogs, updateAuto, clearLogs,
        viewMode, setViewMode,
        toast, showToast,
        refresh, updateCompany, addCompany, importBulk
    };
}
