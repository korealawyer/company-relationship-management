import { useState, useEffect, useCallback } from 'react';
import { Company, CaseStatus, type AutoSettings } from '@/lib/types';
import { getSession } from '@/lib/auth';
import { useAutoSettings, useAutoLogs, usePaginatedCompanies, useCompanyStats, useCompanyMutations } from '@/hooks/useDataLayer';

export function useEmployeeCRM() {
    const [role, setRole] = useState<string | null>(null);
    useEffect(() => {
        const s = getSession();
        setRole(s?.role || null);
    }, []);
    const isAdmin = role === 'admin' || role === 'super_admin';

    // Pagination & Filter state
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | CaseStatus>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortAsc, setSortAsc] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [filterStatus, pageSize, sortBy, sortAsc]);

    // Data Hooks
    const { companies: dbCompanies, count, isLoading: isCompaniesLoading } = usePaginatedCompanies({
        page, limit: pageSize, search: debouncedSearch, status: filterStatus, sortBy, sortAsc
    });
    const { stats } = useCompanyStats();
    
    // Mutation Hooks
    const { addCompany, updateCompany, updateBulk, deleteCompany, importBulk, refreshCompanies } = useCompanyMutations();
    const { settings: dbSettings, updateSettings, mutate: mutateSettings } = useAutoSettings();
    const { logs: dbLogs, mutate: mutateLogs } = useAutoLogs(); 

    const companies = dbCompanies || [];
    const autoSettings = dbSettings || null;
    const autoLogs = dbLogs || [];

    const [viewMode, setViewMode] = useState<'table' | 'phone' | 'kanban'>('table');
    const [toast, setToast] = useState<string | null>(null);

    const refresh = useCallback(() => {
        refreshCompanies();
        mutateSettings();
        mutateLogs();
    }, [refreshCompanies, mutateSettings, mutateLogs]);

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
        mutateLogs([], false); 
    };

    return {
        role, isAdmin,
        companies, count, stats, isCompaniesLoading,
        search, setSearch,
        filterStatus, setFilterStatus,
        page, setPage,
        pageSize, setPageSize,
        sortBy, setSortBy,
        sortAsc, setSortAsc,
        autoSettings, autoLogs, updateAuto, clearLogs,
        viewMode, setViewMode,
        toast, showToast,
        refresh, updateCompany, updateBulk, addCompany, importBulk, deleteCompany
    };
}
