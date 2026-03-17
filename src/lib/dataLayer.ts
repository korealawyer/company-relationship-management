// ================================================================
// Data Layer — Mock ↔ Supabase 자동 전환 통합 인터페이스
// 
// 사용법:
//   import { dataLayer } from '@/lib/dataLayer';
//   const companies = await dataLayer.companies.getAll();
//
// IS_SUPABASE_CONFIGURED 에 따라 자동으로 Backend 전환
// ================================================================

import { IS_SUPABASE_CONFIGURED } from './supabase';
import { store, personalStore, consultStore } from './mockStore';
import type {
  Company, LitigationCase, Consultation, AutoSettings, AutoLog,
  PersonalClient, PersonalLitigation,
} from './mockStore';

import {
  supabaseCompanyStore,
  supabaseLitigationStore,
  supabaseConsultStore,
  supabasePersonalStore,
  supabaseAutoStore,
  supabaseUserStore,
} from './supabaseStore';

// ── 타입 ──────────────────────────────────────────────────────

export interface CompanyDataSource {
  getAll(): Promise<Company[]>;
  getById(id: string): Promise<Company | undefined>;
  update(id: string, patch: Partial<Company>): Promise<void>;
  create(company: Partial<Company>): Promise<void>;
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
}

// ── Mock 래퍼 (sync → async 변환) ────────────────────────────

const mockCompanies: CompanyDataSource = {
  getAll: async () => store.getAll(),
  getById: async (id) => store.getById(id),
  update: async (id, patch) => { store.update(id, patch); },
  create: async (company) => { store.add(company as Parameters<typeof store.add>[0]); },
  delete: async () => { /* mock doesn't support delete */ },
};

const mockLitigation: LitigationDataSource = {
  getAll: async () => store.getLitAll(),
  create: async (data) => { store.addLit(data as Parameters<typeof store.addLit>[0]); },
  update: async (id, patch) => { store.updateLit(id, patch); },
  delete: async () => {},
};

const mockConsult: ConsultDataSource = {
  getAll: async () => consultStore.getAll(),
  create: async () => {},
  update: async (id, patch) => {
    if (patch.lawyerAnswer && patch.assignedLawyer) {
      consultStore.sendAnswer(id, patch.lawyerAnswer);
    }
  },
};

const mockPersonal: PersonalDataSource = {
  getClients: async () => personalStore.getClients(),
  getAll: async () => personalStore.getAll(),
  create: async (data) => { personalStore.add(data as Parameters<typeof personalStore.add>[0]); },
  update: async (id, patch) => { personalStore.update(id, patch); },
};

const mockAuto: AutoDataSource = {
  getSettings: async () => store.getAutoSettings(),
  saveSettings: async (patch) => { store.updateAutoSettings(patch); },
  getLogs: async () => store.getLogs(),
};

// ── Supabase 래퍼 ────────────────────────────────────────────

const sbCompanies: CompanyDataSource = {
  getAll: supabaseCompanyStore.getAll,
  getById: async (id) => (await supabaseCompanyStore.getById(id)) ?? undefined,
  update: supabaseCompanyStore.update,
  create: supabaseCompanyStore.create,
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
};

// ── 통합 Export ──────────────────────────────────────────────

export const dataLayer = {
  /** 현재 모드 */
  mode: IS_SUPABASE_CONFIGURED ? ('supabase' as const) : ('mock' as const),

  /** 기업 (영업 CRM) */
  companies: IS_SUPABASE_CONFIGURED ? sbCompanies : mockCompanies,

  /** 송무팀 소송 */
  litigation: IS_SUPABASE_CONFIGURED ? sbLitigation : mockLitigation,

  /** 법률 상담 */
  consult: IS_SUPABASE_CONFIGURED ? sbConsult : mockConsult,

  /** 개인 소송 */
  personal: IS_SUPABASE_CONFIGURED ? sbPersonal : mockPersonal,

  /** 자동화 설정 */
  auto: IS_SUPABASE_CONFIGURED ? sbAuto : mockAuto,

  /** 사용자 */
  users: supabaseUserStore,
};

export default dataLayer;
