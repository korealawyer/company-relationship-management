// ================================================================
// Data Layer — Supabase 전용 전환 통합 인터페이스
// 
// 사용법:
//   import { dataLayer } from '@/lib/dataLayer';
//   const companies = await dataLayer.companies.getAll();
//
// 이제 영구적으로 Supabase 데이터만 바라보도록 고정되었습니다. (Zero-Mockup)
// ================================================================

import type { Company, LitigationCase, Consultation, AutoSettings, AutoLog, PersonalClient, PersonalLitigation, AppNotification, DbContract, Document } from './types';

import {
  supabaseCompanyStore,
  supabaseLitigationStore,
  supabaseConsultStore,
  supabasePersonalStore,
  supabaseAutoStore,
  supabaseUserStore,
  supabaseNotificationStore,
  supabaseContractStore,
  supabaseDocumentStore
} from './supabaseStore';

// ── 타입 ──────────────────────────────────────────────────────

export interface CompanyDataSource {
  getAll(): Promise<Company[]>;
  getById(id: string): Promise<Company | undefined>;
  update(id: string, patch: Partial<Company>): Promise<void>;
  updateBulk(companies: Partial<Company>[]): Promise<{ success: number; skipped: number }>;
  create(company: Partial<Company>): Promise<void>;
  importBulk(companies: Partial<Company>[]): Promise<{ success: number; skipped: number }>;
  delete(id: string): Promise<void>;
}

export interface LitigationDataSource {
  getAll(): Promise<LitigationCase[]>;
  create(data: Partial<LitigationCase>): Promise<void>;
  update(id: string, patch: Partial<LitigationCase>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ConsultDataSource {
  getAll(): Promise<Consultation[]>;
  create(data: Partial<Consultation>): Promise<void>;
  update(id: string, patch: Partial<Consultation>): Promise<void>;
}

export interface PersonalDataSource {
  getClients(): Promise<PersonalClient[]>;
  getAll(): Promise<PersonalLitigation[]>;
  create(data: Partial<PersonalLitigation>): Promise<void>;
  update(id: string, patch: Partial<PersonalLitigation>): Promise<void>;
}

export interface AutoDataSource {
  getSettings(): Promise<AutoSettings>;
  saveSettings(patch: Partial<AutoSettings>): Promise<void>;
  getLogs(): Promise<AutoLog[]>;
  addLog(log: Omit<AutoLog, 'id' | 'at'>): Promise<void>;
}

export interface NotificationDataSource {
  getAll(): Promise<AppNotification[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ContractDataSource {
  getAll(): Promise<DbContract[]>;
  getById(id: string): Promise<DbContract | null>;
  create(contract: Partial<DbContract>): Promise<void>;
  update(id: string, patch: Partial<DbContract>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface DocumentDataSource {
  getAll(tenantId?: string): Promise<Document[]>;
  getById(id: string): Promise<Document | null>;
}

// ── Supabase 래퍼 ────────────────────────────────────────────

const sbCompanies: CompanyDataSource = {
  getAll: supabaseCompanyStore.getAll,
  getById: async (id) => (await supabaseCompanyStore.getById(id)) ?? undefined,
  update: supabaseCompanyStore.update,
  updateBulk: supabaseCompanyStore.updateBulk,
  create: supabaseCompanyStore.create,
  importBulk: supabaseCompanyStore.importBulk,
  delete: supabaseCompanyStore.delete,
};

const sbLitigation: LitigationDataSource = {
  getAll: supabaseLitigationStore.getAll,
  create: supabaseLitigationStore.create,
  update: supabaseLitigationStore.update,
  delete: supabaseLitigationStore.delete,
};

const sbConsult: ConsultDataSource = {
  getAll: supabaseConsultStore.getAll,
  create: supabaseConsultStore.create,
  update: supabaseConsultStore.update,
};

const sbPersonal: PersonalDataSource = {
  getClients: supabasePersonalStore.getClients,
  getAll: supabasePersonalStore.getAll,
  create: supabasePersonalStore.create,
  update: supabasePersonalStore.update,
};

const sbAuto: AutoDataSource = {
  getSettings: supabaseAutoStore.getSettings,
  saveSettings: supabaseAutoStore.saveSettings,
  getLogs: supabaseAutoStore.getLogs,
  addLog: supabaseAutoStore.addLog,
};

const sbNotifications: NotificationDataSource = {
  getAll: supabaseNotificationStore.getAll,
  markAsRead: supabaseNotificationStore.markAsRead,
  markAllAsRead: supabaseNotificationStore.markAllAsRead,
  delete: supabaseNotificationStore.delete,
};

const sbContracts: ContractDataSource = {
  getAll: supabaseContractStore.getAll,
  getById: supabaseContractStore.getById,
  create: supabaseContractStore.create,
  update: supabaseContractStore.update,
  delete: supabaseContractStore.delete,
};

const sbDocuments: DocumentDataSource = {
  getAll: supabaseDocumentStore.getAll,
  getById: supabaseDocumentStore.getById,
};

// ── 통합 Export ──────────────────────────────────────────────

export const dataLayer = {
  /** 현재 모드 (영구 고정) */
  mode: 'supabase' as const,

  /** 기업 (영업 CRM) */
  companies: sbCompanies,

  /** 송무팀 소송 */
  litigation: sbLitigation,

  /** 법률 상담 */
  consult: sbConsult,

  /** 개인 소송 */
  personal: sbPersonal,

  /** 자동화 설정 */
  auto: sbAuto,

  /** 사용자 */
  users: supabaseUserStore,

  /** 알림 */
  notifications: sbNotifications,

  /** 계약서 */
  contracts: sbContracts,

  /** 문서함 */
  documents: sbDocuments,
};

export default dataLayer;
