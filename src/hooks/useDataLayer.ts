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
  AppNotification
} from '@/lib/types';

// =========================================================================
// SWR Data Fetching Hooks (대규모 Mock store.getAll() 대체용)
// N+1 쿼리를 방지하고, 클라이언트 단에서 비동기 Supabase 쿼리를 캐싱합니다.
// =========================================================================

export function useCompanies() {
  const { data, error, isLoading, mutate } = useSWR<Company[]>(
    'companies',
    async () => await dataLayer.companies.getAll(),
    { fallbackData: [] }
  );

  const addCompany = async (company: Partial<Company>) => {
    await dataLayer.companies.create(company);
    mutate(); // 리프레시
  };

  const updateCompany = async (id: string, patch: Partial<Company>) => {
    // 낙관적 업데이트 가능
    await dataLayer.companies.update(id, patch);
    mutate();
  };

  const deleteCompany = async (id: string) => {
    await dataLayer.companies.delete(id);
    mutate();
  };

  return { companies: data || [], isLoading, error, mutate, addCompany, updateCompany, deleteCompany };
}

export function useLitigations() {
  const { data, error, isLoading, mutate } = useSWR<LitigationCase[]>(
    'litigations',
    async () => await dataLayer.litigation.getAll(),
    { fallbackData: [] }
  );

  const addLitigation = async (lit: Partial<LitigationCase>) => {
    await dataLayer.litigation.create(lit);
    mutate();
  };

  const updateLitigation = async (id: string, patch: Partial<LitigationCase>) => {
    await dataLayer.litigation.update(id, patch);
    mutate();
  };

  return { litigations: data || [], isLoading, error, mutate, addLitigation, updateLitigation };
}

export function useConsultations() {
  const { data, error, isLoading, mutate } = useSWR<Consultation[]>(
    'consultations',
    async () => await dataLayer.consult.getAll(),
    { fallbackData: [] }
  );

  return { consultations: data || [], isLoading, error, mutate };
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<AppNotification[]>(
    'notifications',
    async () => await dataLayer.notifications.getAll(),
    { fallbackData: [] }
  );

  const markAsRead = async (id: string) => {
    await dataLayer.notifications.markAsRead(id);
    mutate();
  };

  const markAllAsRead = async () => {
    await dataLayer.notifications.markAllAsRead();
    mutate();
  };

  const deleteNotification = async (id: string) => {
    await dataLayer.notifications.delete(id);
    mutate();
  };

  return { notifications: data || [], isLoading, error, markAsRead, markAllAsRead, deleteNotification };
}

export function usePersonalLitigations() {
  const { data, error, isLoading, mutate } = useSWR<PersonalLitigation[]>(
    'personal-litigations',
    async () => await dataLayer.personal.getAll(),
    { fallbackData: [] }
  );

  return { personalLitigations: data || [], isLoading, error, mutate };
}

export function useAutoSettings() {
  const { data, error, isLoading, mutate } = useSWR<AutoSettings>(
    'auto-settings',
    async () => await dataLayer.auto.getSettings()
  );

  const updateSettings = async (patch: Partial<AutoSettings>) => {
    await dataLayer.auto.saveSettings(patch);
    mutate();
  };

  return { settings: data, isLoading, error, mutate, updateSettings };
}

export function useAutoLogs() {
  const { data, error, isLoading, mutate } = useSWR<AutoLog[]>(
    'auto-logs',
    async () => await dataLayer.auto.getLogs(),
    { fallbackData: [] }
  );

  return { logs: data || [], isLoading, error, mutate };
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
