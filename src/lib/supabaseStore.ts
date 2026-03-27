// @ts-nocheck
// ================================================================
// Supabase Store — mockStore 동일 인터페이스의 Supabase 구현
// IS_SUPABASE_CONFIGURED = true 일 때만 활성화
// ================================================================

import { getSupabase, getServiceSupabase } from './supabase';
import type {
  Company, Issue, CaseStatus, CompanyContact, CompanyMemo,
  CompanyTimelineEvent, LitigationCase, LitigationDeadline,
  Consultation, ConsultCategory, ConsultUrgency, ConsultStatus,
  PersonalClient, PersonalLitigation, PersonalLitDeadline,
  PersonalLitDocument, AutoSettings, AutoLog,
} from './mockStore';
import type { AppNotification } from './types';
import { LAWYERS } from './mockStore';

// ── snake_case ↔ camelCase 변환 유틸 ──────────────────────────

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

function rowToObj<T>(row: Record<string, unknown>): T {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    obj[snakeToCamel(k)] = v;
  }
  return obj as T;
}

function objToRow(obj: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    // 중첩 객체/배열은 JSONB로 저장
    row[camelToSnake(k)] = v;
  }
  return row;
}

// ── Company CRUD ──────────────────────────────────────────────

async function fetchCompaniesWithRelations(): Promise<Company[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data: rows } = await sb.from('companies').select('*').order('created_at', { ascending: false });
  if (!rows) return [];

  const companies: Company[] = [];
  for (const row of rows) {
    const c = rowToObj<Company>(row);

    // issues
    const { data: issueRows } = await sb.from('issues').select('*').eq('company_id', c.id);
    c.issues = (issueRows || []).map(r => rowToObj<Issue>(r));

    // contacts
    const { data: contactRows } = await sb.from('company_contacts').select('*').eq('company_id', c.id);
    c.contacts = (contactRows || []).map(r => rowToObj<CompanyContact>(r));

    // memos
    const { data: memoRows } = await sb.from('company_memos').select('*').eq('company_id', c.id);
    c.memos = (memoRows || []).map(r => rowToObj<CompanyMemo>(r));

    // timeline
    const { data: tlRows } = await sb.from('company_timeline').select('*').eq('company_id', c.id).order('created_at', { ascending: false });
    c.timeline = (tlRows || []).map(r => rowToObj<CompanyTimelineEvent>(r));

    companies.push(c);
  }
  return companies;
}

export const supabaseCompanyStore = {
  getAll: async (): Promise<Company[]> => {
    return fetchCompaniesWithRelations();
  },

  getById: async (id: string): Promise<Company | null> => {
    const all = await fetchCompaniesWithRelations();
    return all.find(c => c.id === id) || null;
  },

  create: async (company: Partial<Company>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    const { issues, contacts, memos, timeline, ...flat } = company as Record<string, unknown>;
    await sb.from('companies').insert(objToRow(flat as Record<string, unknown>));

    if (Array.isArray(issues)) {
      for (const iss of issues) {
        await sb.from('issues').insert({ ...objToRow(iss as Record<string, unknown>), company_id: flat.id });
      }
    }
  },

  update: async (id: string, updates: Partial<Company>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    const { issues, contacts, memos, timeline, ...flat } = updates as Record<string, unknown>;
    const row = objToRow(flat as Record<string, unknown>);
    row.updated_at = new Date().toISOString();
    await sb.from('companies').update(row).eq('id', id);
  },

  delete: async (id: string): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('companies').delete().eq('id', id);
  },

  updateStatus: async (id: string, status: CaseStatus): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('companies').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  },
};

// ── Litigation CRUD ──────────────────────────────────────────

export const supabaseLitigationStore = {
  getAll: async (): Promise<LitigationCase[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data: rows } = await sb.from('litigation_cases').select('*').order('created_at', { ascending: false });
    if (!rows) return [];

    const cases: LitigationCase[] = [];
    for (const row of rows) {
      const c = rowToObj<LitigationCase>(row);
      const { data: dlRows } = await sb.from('litigation_deadlines').select('*').eq('case_id', c.id).order('due_date');
      c.deadlines = (dlRows || []).map(r => rowToObj<LitigationDeadline>(r));
      cases.push(c);
    }
    return cases;
  },

  create: async (litCase: Partial<LitigationCase>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    const { deadlines, ...flat } = litCase as Record<string, unknown>;
    await sb.from('litigation_cases').insert(objToRow(flat as Record<string, unknown>));
    if (Array.isArray(deadlines)) {
      for (const dl of deadlines) {
        await sb.from('litigation_deadlines').insert({ ...objToRow(dl as Record<string, unknown>), case_id: flat.id });
      }
    }
  },

  update: async (id: string, updates: Partial<LitigationCase>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    const { deadlines, ...flat } = updates as Record<string, unknown>;
    const row = objToRow(flat as Record<string, unknown>);
    row.updated_at = new Date().toISOString();
    await sb.from('litigation_cases').update(row).eq('id', id);
  },

  delete: async (id: string): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('litigation_cases').delete().eq('id', id);
  },
};

// ── Consultation CRUD ────────────────────────────────────────

export const supabaseConsultStore = {
  getAll: async (): Promise<Consultation[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data: rows } = await sb.from('consultations').select('*').order('created_at', { ascending: false });
    return (rows || []).map(r => rowToObj<Consultation>(r));
  },

  create: async (consult: Partial<Consultation>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('consultations').insert(objToRow(consult as Record<string, unknown>));
  },

  update: async (id: string, updates: Partial<Consultation>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    const row = objToRow(updates as Record<string, unknown>);
    row.updated_at = new Date().toISOString();
    await sb.from('consultations').update(row).eq('id', id);
  },
};

// ── Personal Client + Litigation CRUD ────────────────────────

export const supabasePersonalStore = {
  // Clients
  getClients: async (): Promise<PersonalClient[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data } = await sb.from('personal_clients').select('*').order('created_at', { ascending: false });
    return (data || []).map(r => rowToObj<PersonalClient>(r));
  },

  addClient: async (client: PersonalClient): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('personal_clients').insert(objToRow(client as unknown as Record<string, unknown>));
  },

  // Litigations
  getAll: async (): Promise<PersonalLitigation[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data: rows } = await sb.from('personal_litigations').select('*').order('created_at', { ascending: false });
    if (!rows) return [];

    const cases: PersonalLitigation[] = [];
    for (const row of rows) {
      const c = rowToObj<PersonalLitigation>(row);
      // deadlines
      const { data: dlRows } = await sb.from('personal_lit_deadlines').select('*').eq('litigation_id', c.id).order('due_date');
      c.deadlines = (dlRows || []).map(r => rowToObj<PersonalLitDeadline>(r));
      // documents
      const { data: docRows } = await sb.from('personal_lit_documents').select('*').eq('litigation_id', c.id);
      c.documents = (docRows || []).map(r => rowToObj<PersonalLitDocument>(r));
      cases.push(c);
    }
    return cases;
  },

  create: async (lit: Partial<PersonalLitigation>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    const { deadlines, documents, ...flat } = lit as Record<string, unknown>;
    await sb.from('personal_litigations').insert(objToRow(flat as Record<string, unknown>));
    if (Array.isArray(deadlines)) {
      for (const dl of deadlines) {
        await sb.from('personal_lit_deadlines').insert({ ...objToRow(dl as Record<string, unknown>), litigation_id: flat.id });
      }
    }
    if (Array.isArray(documents)) {
      for (const doc of documents) {
        await sb.from('personal_lit_documents').insert({ ...objToRow(doc as Record<string, unknown>), litigation_id: flat.id });
      }
    }
  },

  update: async (id: string, updates: Partial<PersonalLitigation>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    const { deadlines, documents, ...flat } = updates as Record<string, unknown>;
    const row = objToRow(flat as Record<string, unknown>);
    row.updated_at = new Date().toISOString();
    await sb.from('personal_litigations').update(row).eq('id', id);
  },

  toggleDeadline: async (litId: string, dlId: string): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from('personal_lit_deadlines').select('completed').eq('id', dlId).single();
    if (data) {
      await sb.from('personal_lit_deadlines').update({
        completed: !data.completed,
        completed_at: data.completed ? null : new Date().toISOString(),
      }).eq('id', dlId);
    }
  },
};

// ── AutoSettings CRUD ────────────────────────────────────────

export const supabaseAutoStore = {
  getSettings: async (): Promise<AutoSettings> => {
    const sb = getSupabase();
    const defaults: AutoSettings = {
      autoSalesConfirm: true, autoAssignLawyer: true,
      autoGenerateDraft: true, autoSendEmail: true,
      autoDeadlineAlert: true, autoMonthlyBilling: true,
      autoOverdueReminder: true, autoSatisfactionSurvey: true,
      autoAiMemoSummary: true,
      lawyerRoundRobin: 0, updatedAt: '', updatedBy: '시스템',
    };
    if (!sb) return defaults;
    const { data } = await sb.from('auto_settings').select('*').eq('id', 'default').single();
    return data ? rowToObj<AutoSettings>(data) : defaults;
  },

  saveSettings: async (settings: Partial<AutoSettings>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    const row = objToRow(settings as Record<string, unknown>);
    row.updated_at = new Date().toISOString();
    await sb.from('auto_settings').update(row).eq('id', 'default');
  },

  getLogs: async (): Promise<AutoLog[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data } = await sb.from('auto_logs').select('*').order('created_at', { ascending: false }).limit(50);
    return (data || []).map(r => rowToObj<AutoLog>(r));
  },

  addLog: async (log: Omit<AutoLog, 'id' | 'at'>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('auto_logs').insert({
      id: `log${Date.now()}`,
      ...objToRow(log as Record<string, unknown>),
      created_at: new Date().toISOString(),
    });
  },
};

// ── Notifications ────────────────────────────────────────────

export const supabaseNotificationStore = {
  getAll: async () => {
    const sb = getSupabase();
    if (!sb) return [];
    
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) return [];

    const { data } = await sb
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
    return (data || []).map(r => rowToObj<AppNotification>(r));
  },

  markAsRead: async (id: string) => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('notifications').update({ status: 'read' }).eq('id', id);
  },

  markAllAsRead: async () => {
    const sb = getSupabase();
    if (!sb) return;

    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) return;

    await sb.from('notifications')
        .update({ status: 'read' })
        .eq('user_id', session.user.id)
        .eq('status', 'unread');
  },

  delete: async (id: string) => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('notifications').delete().eq('id', id);
  }
};

// ── User CRUD ────────────────────────────────────────────────

export const supabaseUserStore = {
  getByEmail: async (email: string) => {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.from('users').select('*').eq('email', email.toLowerCase()).single();
    return data ? rowToObj(data) : null;
  },

  create: async (user: { email: string; name: string; role: string; password_hash?: string; company_id?: string; company_name?: string }) => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('users').insert(user);
  },

  getAll: async () => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data } = await sb.from('users').select('*').order('created_at', { ascending: false });
    return data || [];
  },
};

// ── Seed Function — Mock 데이터를 Supabase에 입력 ────────────

export async function seedSupabaseFromMock(): Promise<{ success: boolean; message: string }> {
  const sb = getSupabase();
  if (!sb) return { success: false, message: 'Supabase not configured' };

  // Check if already seeded
  const { count } = await sb.from('companies').select('*', { count: 'exact', head: true });
  if (count && count > 0) return { success: true, message: `Already seeded (${count} companies)` };

  // Import mock data dynamically
  try {
    const mock = await import('./mockStore');
    // This would need the DEFAULT_COMPANIES, DEFAULT_LITIGATION_CASES etc.
    // For now, return instruction
    return { success: false, message: 'Run seed SQL separately — see supabase/migrations/002_seed.sql' };
  } catch {
    return { success: false, message: 'Seed failed' };
  }
}
