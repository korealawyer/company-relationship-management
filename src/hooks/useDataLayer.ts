'use client';

import useSWR from 'swr';
import dataLayer from '@/lib/dataLayer';
import type { 
  Company, 
  LitigationCase, 
  Consultation, 
  PersonalClient, 
  PersonalLitigation,
  AutoSettings,
  AutoLog,
  AppNotification,
  DbContract,
  Document
} from '@/lib/types';

// =========================================================================
// SWR Data Fetching Hooks (대규모 Mock store.getAll() 대체용)
// N+1 쿼리를 방지하고, 클라이언트 단에서 비동기 Supabase 쿼리를 캐싱합니다.
// =========================================================================

// ── 공통 SWR 옵션 (중복 요청 방지 + 불필요한 재검증 차단) ──
const SWR_OPTS = {
  dedupingInterval: 10_000,       // 10초 내 동일 키 중복 요청 방지
  revalidateOnFocus: false,       // 탭 전환 시 불필요한 재요청 방지
  revalidateOnReconnect: true,    // 네트워크 재연결 시만 재검증
  errorRetryCount: 2,             // 에러 시 재시도 2회 제한
};

const EMPTY_COMPANIES: Company[] = [];
const EMPTY_LITIGATIONS: LitigationCase[] = [];
const EMPTY_CONSULTATIONS: Consultation[] = [];
const EMPTY_NOTIFICATIONS: AppNotification[] = [];
const EMPTY_PERSONAL_LITIGATIONS: PersonalLitigation[] = [];
const EMPTY_AUTO_LOGS: AutoLog[] = [];
const EMPTY_DOCUMENTS: Document[] = [];
const EMPTY_CONTRACTS: DbContract[] = [];

export function useCompanies() {
  const { data, error, isLoading, mutate } = useSWR<Company[]>(
    'companies',
    async () => await dataLayer.companies.getAll(),
    { fallbackData: EMPTY_COMPANIES, ...SWR_OPTS }
  );

  const addCompany = async (company: Partial<Company>) => {
    await dataLayer.companies.create(company);
    mutate(); // 리프레시
  };

  const updateCompany = async (id: string, patch: Partial<Company>, skipMutate: boolean = true) => {
    try {
      mutate(
        (currentData) => currentData?.map(c => c.id === id ? { ...c, ...patch } : c),
        { revalidate: false }
      );
      await dataLayer.companies.update(id, patch);
      if (!skipMutate) {
        mutate();
      }
    } catch (e) {
      mutate(); // rollback
      throw e;
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      mutate((currentData) => currentData?.filter(c => c.id !== id), { revalidate: false });
      await dataLayer.companies.delete(id);
    } catch (e) {
      mutate();
      throw e;
    }
  };

  const updateBulk = async (companiesList: Partial<Company>[]) => {
    const result = await dataLayer.companies.updateBulk(companiesList);
    mutate();
    return result;
  };

  const importBulk = async (companiesList: Partial<Company>[]) => {
    const result = await dataLayer.companies.importBulk(companiesList);
    mutate();
    return result;
  };

  return { companies: data || EMPTY_COMPANIES, isLoading, error, mutate, addCompany, updateCompany, updateBulk, deleteCompany, importBulk };
}

export function useLitigations() {
  const { data, error, isLoading, mutate } = useSWR<LitigationCase[]>(
    'litigations',
    async () => await dataLayer.litigation.getAll(),
    { fallbackData: EMPTY_LITIGATIONS, ...SWR_OPTS }
  );

  const addLitigation = async (lit: Partial<LitigationCase>) => {
    await dataLayer.litigation.create(lit);
    mutate();
  };

  const updateLitigation = async (id: string, patch: Partial<LitigationCase>) => {
    try {
      mutate(curr => curr?.map(l => l.id === id ? { ...l, ...patch } : l), { revalidate: false });
      await dataLayer.litigation.update(id, patch);
    } catch (e) {
      mutate();
      throw e;
    }
  };

  return { litigations: data || EMPTY_LITIGATIONS, isLoading, error, mutate, addLitigation, updateLitigation };
}

export function useConsultations() {
  const { data, error, isLoading, mutate } = useSWR<Consultation[]>(
    'consultations',
    async () => await dataLayer.consult.getAll(),
    { fallbackData: EMPTY_CONSULTATIONS, ...SWR_OPTS }
  );

  const addConsultation = async (consult: Partial<Consultation>) => {
    await dataLayer.consult.create(consult);
    mutate();
  };

  const updateConsultation = async (id: string, patch: Partial<Consultation>) => {
    try {
      mutate(curr => curr?.map(c => c.id === id ? { ...c, ...patch } : c), { revalidate: false });
      await dataLayer.consult.update(id, patch);
    } catch (e) {
      mutate();
      throw e;
    }
  };

  return { consultations: data || EMPTY_CONSULTATIONS, isLoading, error, mutate, addConsultation, updateConsultation };
}

export function useDocuments() {
  const { data, error, isLoading, mutate } = useSWR<Document[]>(
    'documents',
    async () => await dataLayer.documents.getAll(),
    { fallbackData: EMPTY_DOCUMENTS, ...SWR_OPTS }
  );

  return { documents: data || EMPTY_DOCUMENTS, isLoading, error, mutate };
}

export function useContracts() {
  const { data, error, isLoading, mutate } = useSWR<DbContract[]>(
    'contracts',
    async () => await dataLayer.contracts.getAll(),
    { fallbackData: EMPTY_CONTRACTS, ...SWR_OPTS }
  );

  return { contracts: data || EMPTY_CONTRACTS, isLoading, error, mutate };
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<AppNotification[]>(
    'notifications',
    async () => await dataLayer.notifications.getAll(),
    { fallbackData: EMPTY_NOTIFICATIONS, ...SWR_OPTS }
  );

  const markAsRead = async (id: string) => {
    try {
      mutate(curr => curr?.map(n => n.id === id ? { ...n, isRead: true } : n), { revalidate: false });
      await dataLayer.notifications.markAsRead(id);
    } catch (e) {
      mutate();
      throw e;
    }
  };

  const markAllAsRead = async () => {
    try {
      mutate(curr => curr?.map(n => ({ ...n, isRead: true })), { revalidate: false });
      await dataLayer.notifications.markAllAsRead();
    } catch (e) {
      mutate();
      throw e;
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      mutate(curr => curr?.filter(n => n.id !== id), { revalidate: false });
      await dataLayer.notifications.delete(id);
    } catch (e) {
      mutate();
      throw e;
    }
  };

  return { notifications: data || EMPTY_NOTIFICATIONS, isLoading, error, markAsRead, markAllAsRead, deleteNotification };
}

export function usePersonalLitigations() {
  const { data, error, isLoading, mutate } = useSWR<PersonalLitigation[]>(
    'personal-litigations',
    async () => await dataLayer.personal.getAll(),
    { fallbackData: EMPTY_PERSONAL_LITIGATIONS, ...SWR_OPTS }
  );

  return { personalLitigations: data || EMPTY_PERSONAL_LITIGATIONS, isLoading, error, mutate };
}

export function useAutoSettings() {
  const { data, error, isLoading, mutate } = useSWR<AutoSettings>(
    'auto-settings',
    async () => await dataLayer.auto.getSettings(),
    SWR_OPTS
  );

  const updateSettings = async (patch: Partial<AutoSettings>) => {
    // 낙관적 업데이트: 서버 응답 전 즉시 UI 반영
    mutate(
      (prev) => (prev ? { ...prev, ...patch } : undefined) as AutoSettings,
      false 
    );
    await dataLayer.auto.saveSettings(patch);
    mutate();
  };

  return { settings: data, isLoading, error, mutate, updateSettings };
}

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    'users',
    async () => await dataLayer.users.getAll(),
    { fallbackData: [], ...SWR_OPTS }
  );

  return { users: data || [], isLoading, error, mutate };
}

export function useAutoLogs() {
  const { data, error, isLoading, mutate } = useSWR<AutoLog[]>(
    'auto-logs',
    async () => await dataLayer.auto.getLogs(),
    { fallbackData: EMPTY_AUTO_LOGS, ...SWR_OPTS }
  );

  const addLog = async (log: Omit<AutoLog, 'id' | 'at'>) => {
    await dataLayer.auto.addLog(log);
    mutate();
  };

  return { logs: data || EMPTY_AUTO_LOGS, isLoading, error, mutate, addLog };
}

// 기존 store 호환을 위한 공통 리프레시 헬퍼
export function useRefreshAll() {
  const { mutate: mutateC } = useSWR('companies');
  const { mutate: mutateL } = useSWR('litigations');
  const { mutate: mutateCo } = useSWR('consultations');
  const { mutate: mutateP } = useSWR('personal-litigations');

  return async () => {
    await Promise.all([mutateC(), mutateL(), mutateCo(), mutateP()]);
  };
}
