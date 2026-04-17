'use client';

import useSWR, { useSWRConfig } from 'swr';
import dataLayer from '@/lib/dataLayer';
import type { PaginationOptions, CompanyStats } from '@/lib/supabaseStore';
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
  refreshInterval: 60_000,        // 60초 주기로 전역 SWR 폴링 (DB/Vercel 부하 방지)
  onError: (error: any) => {
    // 401 에러 감지 시 서킷 브레이커 작동 (무한 리로드 스로틀링)
    if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('JWT')) {
      if (typeof window !== 'undefined') {
        const lastRedirect = window.sessionStorage.getItem('reauth_redirected');
        const now = Date.now();
        // 5초 이내에 연속 리다이렉트 방지
        if (!lastRedirect || (now - parseInt(lastRedirect, 10)) > 5000) {
          window.sessionStorage.setItem('reauth_redirected', now.toString());
          // 강제 로그아웃 UI 플로우 연결 (인증 해제 안내)
          window.location.href = '/login?session_expired=true';
        }
      }
    }
  }
};

const EMPTY_COMPANIES: Company[] = [];
const EMPTY_LITIGATIONS: LitigationCase[] = [];
const EMPTY_CONSULTATIONS: Consultation[] = [];
const EMPTY_NOTIFICATIONS: AppNotification[] = [];
const EMPTY_PERSONAL_LITIGATIONS: PersonalLitigation[] = [];
const EMPTY_AUTO_LOGS: AutoLog[] = [];
const EMPTY_DOCUMENTS: Document[] = [];
const EMPTY_CONTRACTS: DbContract[] = [];
const EMPTY_PERSONAL_CLIENTS: PersonalClient[] = [];

// =========================================================================
// SWR CACHE DICTIONARY (Task 4.3)
// 전역 캐시 키를 하나의 사전으로 관리하여 오타를 방지하고 무효화 관리를 용이하게 합니다.
// =========================================================================
export const CACHE_KEYS = {
  COMPANIES: 'companies',
  PAGINATED_COMPANIES: 'paginated-companies',
  LITIGATIONS: 'litigations',
  CONSULTATIONS: 'consultations',
  PERSONAL_CLIENTS: 'personal-clients',
  PERSONAL_LITIGATIONS: 'personal-litigations',
  AUTO_SETTINGS: 'auto-settings',
  AUTO_LOGS: 'auto-logs',
  NOTIFICATIONS: 'notifications',
  CONTRACTS: 'contracts',
  DOCUMENTS: 'documents',
};
export function useCompanies() {
  const { data, error, isLoading, mutate } = useSWR<Company[]>(
    CACHE_KEYS.COMPANIES,
    async () => await dataLayer.companies.getAll(),
    { fallbackData: EMPTY_COMPANIES, ...SWR_OPTS }
  );

  const addCompany = async (company: Partial<Company>) => {
    await dataLayer.companies.create(company);
    mutate(); // 리프레시
  };

  const { mutate: globalMutate } = useSWRConfig();

  const updateCompany = async (id: string, patch: Partial<Company>, skipMutate: boolean = false) => {
    // Optimistic Concurrency Control (OCC): 현재 SWR에 캐시된 최신 버전을 기준으로 삼음
    let currentData = data?.find(c => c.id === id);
    if (!currentData) {
      // 큐나 기타 스토어에서 업데이트 하는 경우
      // 임시로 우회
    }
    const expectedUpdatedAt = currentData?.updatedAt || (patch as any).updatedAt;
    
    // 낙관적 업데이트
    if (!skipMutate) {
      globalMutate(CACHE_KEYS.COMPANIES, (cur: Company[] | undefined) => cur?.map(c => c.id === id ? { ...c, ...patch } : c), { revalidate: false });
      globalMutate(
        (key: any) => Array.isArray(key) && key[0] === CACHE_KEYS.PAGINATED_COMPANIES,
        (cur: any) => {
          if (!cur || !cur.data) return cur;
          return {
            ...cur,
            data: cur.data.map((c: any) => c.id === id ? { ...c, ...patch } : c)
          };
        },
        { revalidate: false }
      );
    }
    
    try {
      // 패치 파라미터에 숨겨진 내부 필드로 예상 타임스탬프를 보냅니다.
      if (expectedUpdatedAt) {
        (patch as any)._expected_updated_at = expectedUpdatedAt;
      }
      await dataLayer.companies.update(id, patch);
    } catch (err: any) {
      // 낙관적 업데이트 롤백
      console.error(err);
      if (!skipMutate) {
        globalMutate(CACHE_KEYS.COMPANIES);
        globalMutate((key: any) => Array.isArray(key) && key[0] === CACHE_KEYS.PAGINATED_COMPANIES);
      }
      if (err.message === 'VERSION_CONFLICT') {
        alert('다른 사용자가 이미 데이터를 업데이트했습니다. 화면을 새로고침하여 최신 데이터를 확인해주세요.');
      }
      throw err;
    }
    
    // 불필요한 전체 재검증 방지:
    // 낙관적 업데이트(옵티미스틱 캐시)가 이미 적용되었으므로
    // 성공 시에는 globalMutate를 통해 다시 서버에서 리얼타임으로 가져올 필요가 없습니다. (Egrees 초과 트래픽 방지)
    // 서버가 돌려준 최신 updatedAt이 있다면 로컬 캐시만 조용히 갱신합니다.
    /*
    if (!skipMutate) {
      globalMutate(CACHE_KEYS.COMPANIES);
      globalMutate((key: any) => Array.isArray(key) && key[0] === CACHE_KEYS.PAGINATED_COMPANIES);
    }
    */
  };

  const deleteCompany = async (id: string) => {
    // 삭제 요청 전에 로컬 UI에서 즉시 삭제 숨김 처리
    globalMutate(CACHE_KEYS.COMPANIES, (cur: Company[] | undefined) => cur?.filter(c => c.id !== id), { revalidate: false });
    globalMutate(
      (key: any) => Array.isArray(key) && key[0] === CACHE_KEYS.PAGINATED_COMPANIES,
      (cur: any) => cur ? { ...cur, data: cur.data.filter((c: any) => c.id !== id) } : cur,
      { revalidate: false }
    );
    await dataLayer.companies.delete(id);
    // 백그라운드 재동기화는 하지만, 체감 속도는 즉각적
    mutate();
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

export const EMPTY_PAGINATED_COMPANIES = { data: EMPTY_COMPANIES, count: 0 };
export const EMPTY_COMPANY_STATS: CompanyStats = { total: 0, subscribers: 0, premium: 0, standard: 0, starter: 0, atRisk: 0, totalStores: 0, unreviewedIssues: 0, reviewedIssues: 0, statusCounts: {} };

export function usePaginatedCompanies(options: PaginationOptions) {
  const keyStr = JSON.stringify(options);
  const { data, error, isLoading, mutate } = useSWR<{data: Company[], count: number}>(
    [CACHE_KEYS.PAGINATED_COMPANIES, keyStr],
    async () => await dataLayer.companies.getPaginated(options),
    { fallbackData: EMPTY_PAGINATED_COMPANIES, ...SWR_OPTS }
  );

  return { companies: data?.data || EMPTY_COMPANIES, count: data?.count || 0, isLoading, error, mutate };
}

export function useCompanyStats() {
  const { data, error, isLoading, mutate } = useSWR<CompanyStats>(
    'company-stats',
    async () => await dataLayer.companies.getStats(),
    { fallbackData: EMPTY_COMPANY_STATS, ...SWR_OPTS }
  );

  return { stats: data || EMPTY_COMPANY_STATS, isLoading, error, mutate };
}

export function useCompanyMutations() {
  const { mutate } = useSWRConfig();
  
  const refreshCompanies = () => {
    mutate((key: any) => Array.isArray(key) && key[0] === 'paginated-companies');
    mutate('company-stats');
    mutate('companies');
  };

  const addCompany = async (company: Partial<Company>) => {
    await dataLayer.companies.create(company);
    refreshCompanies();
  };

  const updateCompany = async (id: string, patch: Partial<Company>, skipMutate: boolean = false) => {
    if (!skipMutate) {
      mutate('companies', (cur: Company[] | undefined) => cur?.map(c => c.id === id ? { ...c, ...patch } : c), { revalidate: false });
      mutate(
        (key: any) => Array.isArray(key) && key[0] === 'paginated-companies',
        (cur: any) => {
          if (!cur || !cur.data) return cur;
          return {
            ...cur,
            data: cur.data.map((c: any) => c.id === id ? { ...c, ...patch } : c)
          };
        },
        { revalidate: false }
      );
    }
    await dataLayer.companies.update(id, patch);
    if (!skipMutate) refreshCompanies();
  };

  const deleteCompany = async (id: string) => {
    await dataLayer.companies.delete(id);
    refreshCompanies();
  };

  const updateBulk = async (companiesList: Partial<Company>[]) => {
    const result = await dataLayer.companies.updateBulk(companiesList);
    refreshCompanies();
    return result;
  };

  const importBulk = async (companiesList: Partial<Company>[]) => {
    const result = await dataLayer.companies.importBulk(companiesList);
    refreshCompanies();
    return result;
  };

  return { addCompany, updateCompany, deleteCompany, updateBulk, importBulk, refreshCompanies };
}

export function useLitigations() {
  const { data, error, isLoading, mutate } = useSWR<LitigationCase[]>(
    CACHE_KEYS.LITIGATIONS,
    async () => await dataLayer.litigation.getAll(),
    { fallbackData: EMPTY_LITIGATIONS, ...SWR_OPTS }
  );

  const addLitigation = async (lit: Partial<LitigationCase>) => {
    await dataLayer.litigation.create(lit);
    mutate();
  };

  const updateLitigation = async (id: string, patch: Partial<LitigationCase>) => {
    await dataLayer.litigation.update(id, patch);
    mutate();
  };

  return { litigations: data || EMPTY_LITIGATIONS, isLoading, error, mutate, addLitigation, updateLitigation };
}

export function useConsultations() {
  const { data, error, isLoading, mutate } = useSWR<Consultation[]>(
    CACHE_KEYS.CONSULTATIONS,
    async () => await dataLayer.consult.getAll(),
    { fallbackData: EMPTY_CONSULTATIONS, ...SWR_OPTS }
  );

  const addConsultation = async (consult: Partial<Consultation>) => {
    await dataLayer.consult.create(consult);
    mutate();
  };

  const updateConsultation = async (id: string, patch: Partial<Consultation>) => {
    mutate(
      (currentData) => currentData?.map(c => c.id === id ? { ...c, ...patch } : c),
      { revalidate: false }
    );
    try {
      await dataLayer.consult.update(id, patch);
    } catch (err) {
      console.error("Failed to update consultation:", err);
    } finally {
      mutate();
    }
  };

  return { consultations: data || EMPTY_CONSULTATIONS, isLoading, error, mutate, addConsultation, updateConsultation };
}

export function usePersonalClients() {
  const { data, error, isLoading, mutate } = useSWR<PersonalClient[]>(
    CACHE_KEYS.PERSONAL_CLIENTS,
    async () => await dataLayer.personal.getClients(),
    { fallbackData: EMPTY_PERSONAL_CLIENTS, ...SWR_OPTS }
  );

  return { clients: data || EMPTY_PERSONAL_CLIENTS, isLoading, error, mutate };
}

export function useDocuments() {
  const { data, error, isLoading, mutate } = useSWR<Document[]>(
    CACHE_KEYS.DOCUMENTS,
    async () => await dataLayer.documents.getAll(),
    { fallbackData: EMPTY_DOCUMENTS, ...SWR_OPTS }
  );

  return { documents: data || EMPTY_DOCUMENTS, isLoading, error, mutate };
}

export function useContracts() {
  const { data, error, isLoading, mutate } = useSWR<DbContract[]>(
    CACHE_KEYS.CONTRACTS,
    async () => await dataLayer.contracts.getAll(),
    { fallbackData: EMPTY_CONTRACTS, ...SWR_OPTS }
  );

  return { contracts: data || EMPTY_CONTRACTS, isLoading, error, mutate };
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<AppNotification[]>(
    CACHE_KEYS.NOTIFICATIONS,
    async () => await dataLayer.notifications.getAll(),
    { fallbackData: EMPTY_NOTIFICATIONS, ...SWR_OPTS }
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

  return { notifications: data || EMPTY_NOTIFICATIONS, isLoading, error, markAsRead, markAllAsRead, deleteNotification };
}

export function usePersonalLitigations() {
  const { data, error, isLoading, mutate } = useSWR<PersonalLitigation[]>(
    CACHE_KEYS.PERSONAL_LITIGATIONS,
    async () => await dataLayer.personal.getAll(),
    { fallbackData: EMPTY_PERSONAL_LITIGATIONS, ...SWR_OPTS }
  );

  return { personalLitigations: data || EMPTY_PERSONAL_LITIGATIONS, isLoading, error, mutate };
}

export function useAutoSettings() {
  const { data, error, isLoading, mutate } = useSWR<AutoSettings>(
    CACHE_KEYS.AUTO_SETTINGS,
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

const EMPTY_USERS: any[] = [];
export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    'users',
    async () => await dataLayer.users.getAll(),
    { fallbackData: EMPTY_USERS, ...SWR_OPTS }
  );

  return { users: data || EMPTY_USERS, isLoading, error, mutate };
}

export function useAutoLogs() {
  const { data, error, isLoading, mutate } = useSWR<AutoLog[]>(
    CACHE_KEYS.AUTO_LOGS,
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
