// @ts-nocheck
// ================================================================
// Supabase Store — mockStore 동일 인터페이스의 Supabase 구현
// IS_SUPABASE_CONFIGURED = true 일 때만 활성화
// ================================================================

import { getBrowserSupabase as getSupabase, getServiceSupabase } from './supabase';
import type {
  Company, Issue, CaseStatus, CompanyContact, CompanyMemo,
  CompanyTimelineEvent, LitigationCase, LitigationDeadline,
  Consultation, ConsultCategory, ConsultUrgency, ConsultStatus,
  PersonalClient, PersonalLitigation, PersonalLitDeadline,
  PersonalLitDocument, AutoSettings, AutoLog,
} from './mockStore';
import type { AppNotification, Document, DbContract } from './types';
import { LAWYERS } from './mockStore';

function getEffectiveSupabase() {
  const sb = getSupabase();
  if (!sb) {
    if (typeof window === 'undefined') {
      console.warn('❌ [SECURITY WARNING] SSR Environment detected in a Client Store. getEffectiveSupabase() will NOT fallback to Service Role to prevent RLS bypass. Use createServerClient from @supabase/ssr in API routes.');
    }
  }
  return sb;
}

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

// ── 배치 조회용 groupBy 유틸 ──────────────────────────────────

function groupBy(rows: Record<string, any>[] | null, key: string): Record<string, Record<string, any>[]> {
  const map: Record<string, Record<string, any>[]> = {};
  if (!rows) return map;
  for (const row of rows) {
    const k = row[key];
    if (k == null) continue;
    if (!map[k]) map[k] = [];
    map[k].push(row);
  }
  return map;
}

// ── Company CRUD ──────────────────────────────────────────────

async function fetchCompaniesWithRelations(): Promise<Company[]> {
  const sb = getEffectiveSupabase();
  if (!sb) return [];

  const { data: rows } = await sb.from('companies').select('*').order('created_at', { ascending: false }).limit(100);
  if (!rows) return [];

  // ── 배치 쿼리: 리스트뷰 로딩 속도 최적화를 위해 메모와 타임라인 전역 조회 제외 ──
  const [issuesRes, contactsRes] = await Promise.all([
    sb.from('issues').select('*'),
    sb.from('company_contacts').select('*'),
  ]);

  const issueMap = groupBy(issuesRes.data, 'company_id');
  const contactMap = groupBy(contactsRes.data, 'company_id');

  const companies: Company[] = [];
  for (const row of rows) {
    const anyC = rowToObj<Record<string, any>>(row);
    const c = anyC as unknown as Company;
    
    // DB schema -> frontend model mapping
    c.biz = anyC.bizNo || '';
    c.bizType = anyC.bizCategory || '';
    c.franchiseType = anyC.franchiseType || '';
    c.assignedLawyer = anyC.assignedLawyerId || '';
    c.url = anyC.domain || '';
    c.email = anyC.contactEmail || '';
    c.phone = anyC.contactPhone || '';

    // 클라이언트 사이드 조인 (네트워크 요청 없음)
    c.issues = (issueMap[c.id] || []).map(r => {
      const obj = rowToObj<Record<string, any>>(r);
      if (obj.lawRef) {
        obj.law = obj.lawRef;
        delete obj.lawRef;
      }
      return obj as unknown as Issue;
    });
    c.contacts = (contactMap[c.id] || []).map(r => rowToObj<CompanyContact>(r));
    c.memos = []; // 전체조회 시 성능 최적화: 상세 정보는 API나 getById로 레이지로딩 추천
    c.timeline = []; // 전체조회 시 성능 최적화: 상세 정보는 API나 getById로 레이지로딩 추천

    companies.push(c);
  }
  return companies;
}

// ── 단건 회사 조회 (전체 getAll 호출 없이 직접 조회) ──────────
async function fetchCompanyById(id: string): Promise<Company | null> {
  const sb = getEffectiveSupabase();
  if (!sb) return null;

  const { data: row } = await sb.from('companies').select('*').eq('id', id).single();
  if (!row) return null;

  const anyC = rowToObj<Record<string, any>>(row);
  const c = anyC as unknown as Company;

  c.biz = anyC.bizNo || '';
  c.bizType = anyC.bizCategory || '';
  c.franchiseType = anyC.franchiseType || '';
  c.assignedLawyer = anyC.assignedLawyerId || '';
  c.url = anyC.domain || '';
  c.email = anyC.contactEmail || '';
  c.phone = anyC.contactPhone || '';
  c.ceo = anyC.ceoName || '';

  // 해당 회사의 서브 데이터만 병렬 조회
  const [issuesRes, contactsRes, memosRes, tlRes] = await Promise.all([
    sb.from('issues').select('*').eq('company_id', id),
    sb.from('company_contacts').select('*').eq('company_id', id),
    sb.from('company_memos').select('*').eq('company_id', id),
    sb.from('company_timeline').select('*').eq('company_id', id).order('created_at', { ascending: false }),
  ]);

  c.issues = (issuesRes.data || []).map(r => {
    const obj = rowToObj<Record<string, any>>(r);
    if (obj.lawRef) {
      obj.law = obj.lawRef;
      delete obj.lawRef;
    }
    return obj as unknown as Issue;
  });
  c.contacts = (contactsRes.data || []).map(r => rowToObj<CompanyContact>(r));
  c.memos = (memosRes.data || []).map(r => rowToObj<CompanyMemo>(r));
  c.timeline = (tlRes.data || []).map(r => rowToObj<CompanyTimelineEvent>(r));

  let assignedLawyerRef = c.assignedLawyer;
  let lawyerData = null;
  
  if (assignedLawyerRef) {
    // Try by ID first
    let res = await sb.from('lawyers').select('*').eq('id', assignedLawyerRef).maybeSingle();
    if (!res.data) {
       // Try by name
       res = await sb.from('lawyers').select('*').eq('name', assignedLawyerRef).maybeSingle();
    }
    lawyerData = res.data;
  }
  
  // If still no lawyer, fallback to the first available lawyer in DB
  if (!lawyerData) {
    const { data } = await sb.from('lawyers').select('*').limit(1).maybeSingle();
    lawyerData = data;
  }

  if (lawyerData) {
    c.lawyerProfile = {
      id: lawyerData.id,
      name: lawyerData.name,
      role: lawyerData.role || '담당 변호사',
      signatureImageUrl: lawyerData.signature_image_url
    };
  } else {
    // 테이블 생성이 완료되지 않았거나 데이터가 없을 때를 대비한 모의 데이터
    c.lawyerProfile = {
      id: 'dummy',
      name: assignedLawyerRef || '담당 변호사',
      role: '개인정보보호 전문 팀장',
      signatureImageUrl: 'https://placehold.co/150x50/transparent/333333?text=Signature&font=Caveat'
    };
  }

  return c;
}

// ── 페이지네이션 및 통계 조회 ──────────────────────────────────
export interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  userName?: string;
  plan?: string;
  health?: string;
  sortBy?: string;
  sortAsc?: boolean;
}

export interface CompanyStats {
  total: number;
  subscribers: number;
  premium: number;
  standard: number;
  starter: number;
  atRisk: number;
  totalStores: number;
  unreviewedIssues: number;
  reviewedIssues: number;
  statusCounts?: Record<string, number>;
}

async function fetchPaginatedCompanies(options: PaginationOptions): Promise<{ data: Company[]; count: number }> {
  const sb = getEffectiveSupabase();
  if (!sb) return { data: [], count: 0 };

  const { page = 1, limit = 50, search, status, userName, plan, health, sortBy = 'created_at', sortAsc = false } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const overviewColumns = `id, name, domain, url, email, phone, contact_name, contact_email, contact_phone, ceo_name, biz_category, franchise_type, store_count, plan, status, risk_level, risk_score, issue_count, privacy_url, privacy_policy_text, audit_report, assigned_lawyer_id, email_sent_at, lawyer_confirmed, lawyer_confirmed_at, source, biz_no, created_at, updated_at, sales_confirmed, sales_confirmed_at, sales_confirmed_by, email_subject, client_replied, client_replied_at, client_reply_note, login_count, call_note, auto_mode, ai_draft_ready, custom_script, lawyer_note, contract_sent_at, contract_signed_at, contract_method, contract_note, callback_scheduled_at, follow_up_step, ai_memo_summary, ai_next_action, ai_next_action_type, last_call_result, last_call_at, call_attempts, last_called_by`;

  let query = sb.from('companies').select(overviewColumns, { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,biz_no.ilike.%${search}%,domain.ilike.%${search}%,contact_email.ilike.%${search}%,contact_phone.ilike.%${search}%`);
  }

  if (status && status !== 'all') {
    if (status === 'pending') query = query.in('status', ['pending', '등록됨']);
    else if (status === 'crawling') query = query.in('status', ['crawling', '분석중']);
    else if (status === 'analyzed') query = query.in('status', ['analyzed', '분석완료']);
    else if (status === 'lawyer_active') query = query.in('status', ['assigned', 'reviewing', 'subscribed']);
    else if (status === 'my_calls_today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.gte('last_call_at', today.toISOString());
      if (userName) {
        query = query.eq('last_called_by', userName);
      }
    }
    else query = query.eq('status', status);
  } else {
    // 거절 및 사이트이상은 '전체' 탭에서 보이지 않도록 제외합니다.
    query = query.not('status', 'in', '("rejected","invalid_site")');
  }
  
  if (plan && plan !== 'all_clients' && plan !== 'all_users') {
    if (plan === 'none') {
      query = query.or('plan.is.null,plan.eq.none');
    } else {
      query = query.eq('plan', plan);
    }
  } else if (plan === 'all_clients') {
    query = query.not('plan', 'is', 'null').neq('plan', 'none');
  }

  if (health && health !== 'all') {
    if (health === 'danger') query = query.gte('risk_score', 50);
    else if (health === 'warning') query = query.gte('risk_score', 20).lt('risk_score', 50);
    else if (health === 'healthy') query = query.lt('risk_score', 20);
  }

  const dbSortCol = camelToSnake(sortBy);
  if (dbSortCol !== 'health' && dbSortCol !== 'activity') {
    query = query.order(dbSortCol, { ascending: sortAsc }).order('id', { ascending: true });
  } else if (dbSortCol === 'health') {
    query = query.order('risk_score', { ascending: sortAsc }).order('id', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: sortAsc }).order('id', { ascending: true });
  }

  query = query.range(from, to);

  const { data: rows, count, error } = await query;
  if (error || !rows) return { data: [], count: count || 0 };

  const companyIds = rows.map(r => r.id);
  let issueMap: Record<string, Record<string, any>[]> = {};
  let contactMap: Record<string, Record<string, any>[]> = {};
  
  if (companyIds.length > 0) {
    const [issuesRes, contactsRes] = await Promise.all([
      sb.from('issues').select('*').in('company_id', companyIds),
      sb.from('company_contacts').select('*').in('company_id', companyIds)
    ]);
    issueMap = groupBy(issuesRes.data, 'company_id');
    contactMap = groupBy(contactsRes.data, 'company_id');
  }

  const companies: Company[] = [];
  for (const row of rows) {
    const anyC = rowToObj<Record<string, any>>(row);
    const c = anyC as unknown as Company;
    c.biz = anyC.bizNo || '';
    c.bizType = anyC.bizCategory || '';
    c.franchiseType = anyC.franchiseType || '';
    c.assignedLawyer = anyC.assignedLawyerId || '';
    c.url = anyC.domain || '';
    c.email = anyC.contactEmail || '';
    c.phone = anyC.contactPhone || '';
    c.ceo = anyC.ceoName || '';

    // Normalize Korean status strings to English enum keys
    if (c.status === '등록됨' as any) c.status = 'pending';
    if (c.status === '분석중' as any) c.status = 'crawling';
    if (c.status === '분석완료' as any) c.status = 'analyzed';

    c.issues = (issueMap[c.id] || []).map(r => {
      const obj = rowToObj<Record<string, any>>(r);
      if (obj.lawRef) { obj.law = obj.lawRef; delete obj.lawRef; }
      return obj as unknown as Issue;
    });
    c.contacts = (contactMap[c.id] || []).map(r => rowToObj<CompanyContact>(r));
    c.memos = [];
    c.timeline = [];
    companies.push(c);
  }
  return { data: companies, count: count || 0 };
}

async function fetchCompanyStats(): Promise<CompanyStats> {
  const defaultStats = { total: 0, subscribers: 0, premium: 0, standard: 0, starter: 0, atRisk: 0, totalStores: 0, unreviewedIssues: 0, reviewedIssues: 0, statusCounts: {} };
  const sb = getEffectiveSupabase();
  if (!sb) return defaultStats;
  
  const { data, error } = await sb.rpc('get_company_stats');
  if (error || !data) {
    console.error('Failed to fetch company stats via RPC', error);
    return defaultStats;
  }
  
  return data as CompanyStats;
}

function cleanCompanyRow(companyData: Partial<Company>, isCreate: boolean = false): Record<string, any> {
  const { issues, contacts, memos, timeline, biz, bizType, franchiseType, assignedLawyer, id, ...flat } = companyData as Record<string, any>;
  const rawRow = objToRow(flat);
  
  if (id !== undefined) rawRow.id = id;
  if (biz !== undefined || isCreate) {
    rawRow.biz_no = biz || `T${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
  }
  if (bizType !== undefined) rawRow.biz_category = bizType || null;
  if (franchiseType !== undefined) rawRow.franchise_type = franchiseType || null;
  if (assignedLawyer !== undefined) {
    rawRow.assigned_lawyer_id = (typeof assignedLawyer === 'string' && assignedLawyer.length === 36) ? assignedLawyer : null;
  }

  // Fallbacks for frontend aliases
  if (rawRow.url !== undefined && !rawRow.domain) rawRow.domain = rawRow.url;
  if (rawRow.email !== undefined && !rawRow.contact_email) rawRow.contact_email = rawRow.email;
  if (rawRow.phone !== undefined && !rawRow.contact_phone) rawRow.contact_phone = rawRow.phone;
  if (flat.ceo !== undefined) rawRow.ceo_name = flat.ceo;

  const allowedDbColumns = [
    // 기존 컬럼
    'name', 'domain', 'url', 'email', 'phone',
    'contact_name', 'contact_email', 'contact_phone', 'ceo_name',
    'biz_category', 'franchise_type', 'store_count', 'plan', 'status', 'risk_level',
    'risk_score', 'issue_count', 'privacy_url', 'privacy_policy_text', 'assigned_lawyer_id',
    'email_sent_at', 'lawyer_confirmed', 'lawyer_confirmed_at', 'source', 'biz_no', 'id',
    'created_at', 'updated_at', 'assigned_sales_id',
    // 영업 프로세스
    'sales_confirmed', 'sales_confirmed_at', 'sales_confirmed_by',
    // 이메일 / 클라이언트 응답
    'email_subject', 'client_replied', 'client_replied_at', 'client_reply_note',
    // 통화 / 로그인
    'login_count', 'call_note',
    // 자동화 / AI
    'auto_mode', 'ai_draft_ready', 'custom_script', 'lawyer_note', 'audit_report',
    // 계약 프로세스
    'contract_sent_at', 'contract_signed_at', 'contract_method', 'contract_note',
    // 자동화 추적
    'callback_scheduled_at', 'follow_up_step', 'ai_memo_summary',
    'ai_next_action', 'ai_next_action_type',
    'last_call_result', 'last_call_at', 'call_attempts', 'last_called_by',
  ];
  
  const row: Record<string, any> = {};
  for (const key of allowedDbColumns) {
    if (rawRow[key] !== undefined) {
      if (rawRow[key] === '' && (key.endsWith('_at') || key.endsWith('_id') || key.endsWith('_count') || key.endsWith('_score'))) {
        row[key] = null;
      } else {
        row[key] = rawRow[key];
      }
    }
  }
  return row;
}

export const supabaseCompanyStore = {
  getPaginated: fetchPaginatedCompanies,
  getStats: fetchCompanyStats,
  getAll: async (): Promise<Company[]> => {
    return fetchCompaniesWithRelations();
  },

  getQueue: async (scope: 'all' | 'mine' = 'all', userName?: string): Promise<Company[]> => {
    const sb = getEffectiveSupabase();
    if (!sb) return [];
    
    // Get KST today string for callback comparison
    const today = new Date();
    today.setHours(today.getHours() + 9);
    const todayStr = today.toISOString().split('T')[0];

    // 오로지 세일즈 큐(Sales Queue)에서 콜 할 수 있는 컴퍼니 호출
    // status in ('analyzed', 'assigned')
    let query = sb.from('companies')
      .select('id, name, domain, url, email, phone, contact_name, contact_phone, ceo_name, biz_category, franchise_type, status, risk_score, call_note, last_call_result, last_call_at, callback_scheduled_at, last_called_by')
      .in('status', ['analyzed', 'assigned']);

    if (scope === 'mine' && userName) {
      // 본인 담당(or 이전에 본인이 통화한) 데이터 + 아직 아무도 통화하지 않은(미배정) 데이터
      query = query.or(`last_called_by.eq.${userName},last_called_by.is.null`);
    }
    
    // 복합 인덱스와 callback 우선순위를 위해 데이터 가져오기 (100개 fetch 하여 JS 단에서 정렬/필터)
    // 콜백은 riskScore와 무관하게 최우선 배치해야 하므로 여기서 적당히 넓게 가져옵니다.
    const { data: rows } = await query
      .order('callback_scheduled_at', { ascending: true, nullsFirst: false }) // 1순위: 콜백 (null은 뒤로)
      .order('risk_score', { ascending: false }) // 2순위: 위험도
      .limit(100);
      
    if (!rows) return [];
    
    // 최소한의 조인만 실행
    const ids = rows.map(r => r.id);
    const { data: issuesRes } = await sb.from('issues').select('company_id, level, title').in('company_id', ids);
    const issueMap = groupBy(issuesRes, 'company_id');
    
    return rows.map(r => {
      const anyC = rowToObj<Record<string, any>>(r);
      const c = anyC as unknown as Company;
      c.issues = (issueMap[c.id] || []).map((iss: any) => rowToObj(iss));
      return c;
    });
  },

  logCall: async (payload: { companyId: string, userId: string, userName: string, callResult: string }) => {
    const sb = getEffectiveSupabase();
    if (!sb) return;
    await sb.from('sales_call_logs').insert({
      company_id: payload.companyId,
      user_id: payload.userId,
      user_name: payload.userName,
      call_result: payload.callResult
    });
  },

  getTodaySalesStats: async (userName: string): Promise<Record<string, number>> => {
    const sb = getEffectiveSupabase();
    if (!sb) return {};
    
    // Get KST today string
    const today = new Date();
    today.setHours(today.getHours() + 9);
    const todayStr = today.toISOString().split('T')[0];
    
    const { data: logs } = await sb.from('sales_call_logs')
      .select('call_result')
      .eq('user_name', userName)
      .gte('created_at', `${todayStr}T00:00:00Z`);
      
    if (!logs) return {};
    return logs.reduce((acc, curr) => {
      acc[curr.call_result] = (acc[curr.call_result] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  },
  
  getTodayActivity: async (userName: string): Promise<{ companyId: string, companyName: string, callResult: string, createdAt: string }[]> => {
    const sb = getEffectiveSupabase();
    if (!sb) return [];
    
    // Get KST today string
    const today = new Date();
    today.setHours(today.getHours() + 9);
    const todayStr = today.toISOString().split('T')[0];
    
    const { data: logs } = await sb.from('sales_call_logs')
      .select('company_id, call_result, created_at, companies (name)')
      .eq('user_name', userName)
      .gte('created_at', `${todayStr}T00:00:00Z`)
      .order('created_at', { ascending: false });
      
    if (!logs) return [];
    return logs.map((l: any) => ({ 
      companyId: l.company_id, 
      companyName: l.companies ? l.companies.name : '알수없음',
      callResult: l.call_result,
      createdAt: l.created_at
    }));
  },

  getTotalCompanyCount: async (): Promise<number> => {
    const sb = getEffectiveSupabase();
    if (!sb) return 0;
    const { count } = await sb.from('companies').select('*', { count: 'exact', head: true });
    return count || 0;
  },

  getById: async (id: string): Promise<Company | null> => {
    return fetchCompanyById(id);
  },

  create: async (company: Partial<Company>): Promise<void> => {
    const sb = getEffectiveSupabase();
    if (!sb) return;
    
    if (company.name) {
      const normalizedName = company.name.replace(/\s+/g, '');
      const searchPattern = '%' + normalizedName.split('').join('%') + '%';
      
      const { data: existingMatches } = await sb
          .from('companies')
          .select('name')
          .ilike('name', searchPattern);

      if (existingMatches && existingMatches.length > 0) {
         const isDuplicate = existingMatches.some(e => e.name.replace(/\s+/g, '') === normalizedName);
         if (isDuplicate) {
            throw new Error(`이미 등록된 기업명입니다: ${company.name}`);
         }
      }
    }
    
    // Explicitly generate a UUID if not provided 
    // This handles the case where companies table lacks `DEFAULT gen_random_uuid()` 
    if (!company.id) {
      company.id = crypto.randomUUID();
    }

    const row = cleanCompanyRow(company, true);

    const { data: newCompany, error } = await sb.from('companies').insert(row).select().single();
    if (error || !newCompany) {
      console.error('Failed to create company:', error);
      return;
    }

    // issues (from mockStore) is not defined here in the original code, but we'll leave it if it was there
    if (company.issues && Array.isArray(company.issues) && company.issues.length > 0) {
      for (const iss of company.issues) {
        if (!iss.id) iss.id = crypto.randomUUID();
        await sb.from('issues').insert({ ...objToRow(iss as Record<string, any>), company_id: newCompany.id });
      }
    }
  },

  updateBulk: async (companies: Partial<Company>[]): Promise<{ success: number; skipped: number }> => {
    const sb = getEffectiveSupabase();
    if (!sb) return { success: 0, skipped: companies.length };

    const rows = companies.map(company => cleanCompanyRow(company, false));
    let successCount = 0;
    
    // PostgreSQL upsert (ON CONFLICT) requires all NOT NULL columns for the INSERT evaluation phase.
    // Since we receive partial objects (e.g., just { id, status }), upsert will fail.
    // Therefore, we use Promise.all to run individual updates safely.
    const BATCH_SIZE = 50;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      const promises = chunk.map(row => {
        const { id, ...updates } = row;
        if (!id || Object.keys(updates).length === 0) return Promise.resolve({ error: null });
        updates.updated_at = new Date().toISOString();
        return sb.from('companies').update(updates).eq('id', id);
      });
      
      const results = await Promise.all(promises);
      for (const res of results) {
        if (res.error) {
          console.error('Bulk update individual mapping error:', res.error);
        } else {
          successCount++;
        }
      }
    }
    
    return { success: successCount, skipped: companies.length - successCount };
  },

  importBulk: async (companies: Partial<Company>[]): Promise<{ success: number; skipped: number }> => {
    const sb = getEffectiveSupabase();
    if (!sb) return { success: 0, skipped: companies.length };

    const rows = companies.map(company => {
      if (!company.id) company.id = crypto.randomUUID();
      return cleanCompanyRow(company, true);
    });

    // 엑셀 업로드 시 중복 비교를 위해 전체 기업명 캐싱 (띄어쓰기 무시)
    const existingNameSet = new Set<string>();
    let page = 0;
    while(true) {
        const { data: dbNames } = await sb.from('companies').select('name').range(page * 1000, (page + 1) * 1000 - 1);
        if (dbNames && dbNames.length > 0) {
            dbNames.forEach(d => {
                if (d.name) existingNameSet.add(d.name.replace(/\s+/g, ''));
            });
            if (dbNames.length < 1000) break;
            page++;
        } else {
            break;
        }
    }

    let successCount = 0;
    
    // 100건씩 쪼개서 Bulk Insert (GET 파라미터 URL 길이 제한 회피)
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const originalChunk = companies.slice(i, i + 100);

      const deduplicatedChunk = [];
      const chunkNameSet = new Set<string>();

      for (const c of chunk) {
        if (!c.name || c.name.trim() === '') {
           deduplicatedChunk.push(c);
           continue; 
        }

        const normalized = c.name.replace(/\s+/g, '');
        // 이미 DB에 존재하는 기업명이면 스킵 (띄어쓰기 무시)
        if (existingNameSet.has(normalized)) {
          continue;
        }
        // 청크 내부 중복 스킵
        if (chunkNameSet.has(normalized)) continue;
        
        chunkNameSet.add(normalized);
        deduplicatedChunk.push(c);
      }

      if (deduplicatedChunk.length === 0) continue; // 전부 중복이면 다음 청크로

      // (2) Insert 실행
      const { data, error } = await sb
        .from('companies')
        .insert(deduplicatedChunk)
        .select('id, name');

      if (error) {
        console.error('Bulk import error mapping chunk:', error);
      } else if (data && data.length > 0) {
        successCount += data.length;

        // Memo Bulk Insert
        const memosToInsert: any[] = [];
        data.forEach(inserted => {
          // find original company
          const original = originalChunk.find(c => c.name === inserted.name || c.id === inserted.id);
          if (original && original.memos && original.memos.length > 0) {
            original.memos.forEach(m => {
              memosToInsert.push({
                id: m.id || crypto.randomUUID(),
                company_id: inserted.id,
                author: m.author || '시스템',
                content: m.content,
                created_at: m.createdAt || new Date().toISOString()
              });
            });
          }
        });

        if (memosToInsert.length > 0) {
          await sb.from('company_memos').insert(memosToInsert);
        }
      }
    }

    return { success: successCount, skipped: companies.length - successCount };
  },

  update: async (id: string, updates: Partial<Company>): Promise<void> => {
    const sb = getEffectiveSupabase();
    if (!sb) return;
    
    // 1) Update main companies table
    const row = cleanCompanyRow(updates, false);
    if (Object.keys(row).length > 0) {
      row.updated_at = new Date().toISOString();
      const { error } = await sb.from('companies').update(row).eq('id', id);
      if (error) {
        console.error('Failed to update company:', error);
        throw new Error(error.message);
      }
    }

    // 2) Handle Nested Arrays (Memos, Timelines, Contacts)
    // The UI passes down the full array whenever an item is added.
    if (updates.memos && updates.memos.length > 0) {
      const memoRows = updates.memos.map(m => ({
        id: m.id || crypto.randomUUID(),
        company_id: id,
        author: m.author,
        content: m.content,
        created_at: m.createdAt || new Date().toISOString()
      }));
      await sb.from('company_memos').upsert(memoRows);
    }

    if (updates.timeline && updates.timeline.length > 0) {
      const tlRows = updates.timeline.map(t => ({
        id: t.id || crypto.randomUUID(),
        company_id: id,
        author: t.author,
        type: t.type,
        content: t.content,
        created_at: t.createdAt || new Date().toISOString()
      }));
      await sb.from('company_timeline').upsert(tlRows);
    }

    if (updates.contacts && updates.contacts.length > 0) {
      const contactRows = updates.contacts.map(c => ({
        id: (!c.id || c.id === 'legacy') ? crypto.randomUUID() : c.id,
        company_id: id,
        name: c.name,
        role: c.role || null,
        department: c.department || null,
        phone: c.phone || null,
        email: c.email || null,
        is_primary: c.isPrimary || false
      }));
      await sb.from('company_contacts').upsert(contactRows);
    }

    // 🔥 AI 분석 시 반환된 issues가 있으면 기존 이슈를 덮어쓰거나 추가 (기존 내역 초기화 후 새로 추가가 안정적임)
    if (updates.issues) { // 이슈가 0개(빈 배열)일 때도 업데이트하기 위해 존재 검사만 수행
      // 기존 이슈 삭제 후 통째로 교체 (AI 재분석을 위해)
      await sb.from('issues').delete().eq('company_id', id);
      
      let riskScore = 0;
      let highCount = 0;
      let medCount = 0;

      if (updates.issues.length > 0) {
        const issueRows = updates.issues.map(iss => {
          // DB 컬럼 추가 마이그레이션이 완료되었으므로, 해당 필드들도 정상 매칭되어 저장됩니다.
          const { law, ...safeIss } = iss as Record<string, any>;
          const row = objToRow(safeIss);
          if (law) row.law_ref = law;
          if (!row.id) row.id = crypto.randomUUID();
          row.company_id = id;
          
          const lvl = iss.level || 'LOW';
          if (lvl === 'HIGH') { riskScore += 30; highCount++; }
          else if (lvl === 'MEDIUM') { riskScore += 15; medCount++; }
          else if (lvl === 'LOW') { riskScore += 5; }

          return row;
        });

        console.log('--- [DEBUG] issueRows attempting insert ---', JSON.stringify(issueRows, null, 2));
        
        const { error: insertError } = await sb.from('issues').insert(issueRows);
        if (insertError) {
          console.error('Failed to insert issues. Error:', JSON.stringify(insertError, null, 2));
          console.error('Raw error dump:', insertError);
          console.error('Failed to insert issues:', insertError);
          throw new Error(insertError.message);
        }
      }
      
      riskScore = Math.min(100, riskScore);
      let riskLevel = 'LOW';
      if (highCount > 0 || riskScore >= 70) riskLevel = 'HIGH';
      else if (medCount > 0 || riskScore >= 40) riskLevel = 'MEDIUM';

      // Update the companies table with recalculated riskScore
      const { error: secondUpdateError } = await sb.from('companies').update({
        risk_score: riskScore,
        risk_level: riskLevel,
        issue_count: updates.issues.length,
      }).eq('id', id);
      
      if (secondUpdateError) {
        console.error('Failed to update company risk score:', secondUpdateError);
        throw new Error(secondUpdateError.message);
      }
    }
  },

  delete: async (id: string): Promise<void> => {
    const sb = getEffectiveSupabase();
    if (!sb) return;
    await sb.from('companies').delete().eq('id', id);
  },

  updateStatus: async (id: string, status: CaseStatus): Promise<void> => {
    const sb = getEffectiveSupabase();
    if (!sb) return;
    await sb.from('companies').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  },

  incrementCallAttempts: async (id: string): Promise<void> => {
    const sb = getEffectiveSupabase();
    if (!sb) return;
    const { error } = await sb.rpc('increment_call_attempts', { target_company_id: id });
    if (error) {
      console.error('Failed to increment call attempts:', JSON.stringify(error));
      throw new Error(error.message || 'increment_call_attempts RPC failed');
    }
  },

  decrementCallAttempts: async (id: string): Promise<void> => {
    const sb = getEffectiveSupabase();
    if (!sb) return;
    const { error } = await sb.rpc('decrement_call_attempts', { target_company_id: id });
    if (error) {
      console.error('Failed to decrement call attempts:', JSON.stringify(error));
      throw new Error(error.message || 'decrement_call_attempts RPC failed');
    }
  },
};

// ── Litigation CRUD ──────────────────────────────────────────

export const supabaseLitigationStore = {
  getAll: async (): Promise<LitigationCase[]> => {
    const sb = getEffectiveSupabase();
    if (!sb) return [];
    const { data: rows } = await sb.from('litigation_cases').select('*').order('created_at', { ascending: false });
    if (!rows) return [];

    // 배치 쿼리: 기일 데이터를 한 번에 조회 (N+1 → 2 고정)
    const { data: allDeadlines } = await sb.from('litigation_deadlines').select('*').order('due_date');
    const dlMap = groupBy(allDeadlines, 'case_id');

    const cases: LitigationCase[] = [];
    for (const row of rows) {
      const c = rowToObj<LitigationCase>(row);
      c.deadlines = (dlMap[c.id] || []).map(r => rowToObj<LitigationDeadline>(r));
      cases.push(c);
    }
    return cases;
  },

  create: async (litCase: Partial<LitigationCase>): Promise<void> => {
    const sb = getEffectiveSupabase();
    if (!sb) return;
    if (!litCase.id) litCase.id = crypto.randomUUID();
    const { deadlines, ...flat } = litCase as Record<string, unknown>;
    const row = objToRow(flat as Record<string, unknown>);

    const { error } = await sb.from('litigation_cases').insert(row);
    if (error) {
      console.error("Litigation Create Error:", error);
      // Fallback: older 'litigation_cases' schema might missing 'title'
      const fallbackRow = { ...row };
      if (fallbackRow.hasOwnProperty('title')) {
        fallbackRow.notes = `[사건명: ${fallbackRow.title}]\n${fallbackRow.notes || ''}`;
        delete fallbackRow.title;
      }
      
      const { error: fallbackError } = await sb.from('litigation_cases').insert(fallbackRow);
      if (fallbackError) {
        console.error("Litigation Create Fallback Error:", fallbackError);
        throw new Error(fallbackError.message);
      }
    }

    if (Array.isArray(deadlines)) {
      for (const dl of deadlines) {
        if (!(dl as any).id) (dl as any).id = crypto.randomUUID();
        const { error: dlError } = await sb.from('litigation_deadlines').insert({ ...objToRow(dl as Record<string, unknown>), case_id: flat.id });
        if (dlError) console.error("Litigation Deadline Create Error:", dlError);
      }
    }
  },

  update: async (id: string, updates: Partial<LitigationCase>): Promise<void> => {
    const sb = getEffectiveSupabase();
    if (!sb) return;
    const { deadlines, ...flat } = updates as Record<string, unknown>;
    const row = objToRow(flat as Record<string, unknown>);
    row.updated_at = new Date().toISOString();
    await sb.from('litigation_cases').update(row).eq('id', id);
  },

  delete: async (id: string): Promise<void> => {
    const sb = getEffectiveSupabase();
    if (!sb) return;
    await sb.from('litigation_cases').delete().eq('id', id);
  },
};

// ── Consultation CRUD ────────────────────────────────────────

export const supabaseConsultStore = {
  getAll: async (): Promise<Consultation[]> => {
    const sb = getEffectiveSupabase();
    if (!sb) return [];
    const { data: rows } = await sb.from('consultations').select('*').order('created_at', { ascending: false });
    return (rows || []).map(r => rowToObj<Consultation>(r));
  },

  create: async (consult: Partial<Consultation>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    if (!consult.id) consult.id = crypto.randomUUID();
    
    // Convert to row format
    const row = objToRow(consult as Record<string, unknown>);
    
    // Explicitly handle attachedFiles if the DB expects it as JSON or if it shouldn't exist
    // If the DB throws error about attached_files, we stringify or drop it.
    // Ensure content body has the attachedFiles data (already done in ServiceRequestModal)
    // We will attempt to insert attached_files.
    if (Array.isArray(row.attached_files)) {
       // Just pass as is. Supabase accepts arrays for JSONB.
    }

    const { data, error } = await sb.from('consultations').insert(row);
    if (error) {
       console.error("Consult Create Error:", error);
       
       // Fallback: Clean up schema mismatches
       const fallbackRow = { ...row };
       if (fallbackRow.attached_files) delete fallbackRow.attached_files;
       if (fallbackRow.body) {
           fallbackRow.content = fallbackRow.body; // map body to content
           delete fallbackRow.body;
       }
       
       const { error: fallbackError } = await sb.from('consultations').insert(fallbackRow);
       if (fallbackError) {
           console.error("Consult Create Fallback Error:", fallbackError);
           
           // Super fallback: only standard DbConsultation columns
           const safeRow = {
              id: fallbackRow.id,
              company_id: fallbackRow.company_id,
              author_name: fallbackRow.author_name,
              category: fallbackRow.category,
              urgency: fallbackRow.urgency,
              title: fallbackRow.title,
              content: fallbackRow.content || fallbackRow.body,
              status: fallbackRow.status || 'submitted',
              callback_phone: fallbackRow.callback_phone,
              is_private: fallbackRow.is_private,
              created_at: new Date().toISOString()
           };
           
           const { error: safeError } = await sb.from('consultations').insert(safeRow);
           if (safeError) throw new Error(safeError.message);
       }
    }
  },

  update: async (id: string, updates: Partial<Consultation>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    const row = objToRow(updates as Record<string, unknown>);
    row.updated_at = new Date().toISOString();
    
    // Explicitly drop attached_files if it got here to avoid error
    if ('attached_files' in row) delete row.attached_files;

    const { error } = await sb.from('consultations').update(row).eq('id', id);
    if (error) {
       console.warn("Consult UPDATE error:", error);
       
       // Fallback: DB might be missing newer columns like callback_note etc.
       const fallbackRow = { ...row };
       if ('callback_note' in fallbackRow) delete fallbackRow.callback_note;
       if ('callback_phone' in fallbackRow) delete fallbackRow.callback_phone;
       if ('callback_requested_at' in fallbackRow) delete fallbackRow.callback_requested_at;
       if ('callback_done_at' in fallbackRow) delete fallbackRow.callback_done_at;
       
       const { error: fbErr } = await sb.from('consultations').update(fallbackRow).eq('id', id);
       if (fbErr) {
          console.error("Consult UPDATE Fallback Error:", fbErr);
          throw new Error(fbErr.message);
       }
    }
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
    if (!client.id) client.id = crypto.randomUUID();
    await sb.from('personal_clients').insert(objToRow(client as unknown as Record<string, unknown>));
  },

  // Litigations
  getAll: async (): Promise<PersonalLitigation[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data: rows } = await sb.from('personal_litigations').select('*').order('created_at', { ascending: false });
    if (!rows) return [];

    // 배치 쿼리: 기일 + 문서 데이터를 한 번에 조회 (N+1 → 3 고정)
    const [allDl, allDocs] = await Promise.all([
      sb.from('personal_lit_deadlines').select('*').order('due_date'),
      sb.from('personal_lit_documents').select('*'),
    ]);
    const dlMap = groupBy(allDl.data, 'litigation_id');
    const docMap = groupBy(allDocs.data, 'litigation_id');

    const cases: PersonalLitigation[] = [];
    for (const row of rows) {
      const c = rowToObj<PersonalLitigation>(row);
      c.deadlines = (dlMap[c.id] || []).map(r => rowToObj<PersonalLitDeadline>(r));
      c.documents = (docMap[c.id] || []).map(r => rowToObj<PersonalLitDocument>(r));
      cases.push(c);
    }
    return cases;
  },

  create: async (lit: Partial<PersonalLitigation>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    if (!lit.id) lit.id = crypto.randomUUID();
    const { deadlines, documents, ...flat } = lit as Record<string, unknown>;
    await sb.from('personal_litigations').insert(objToRow(flat as Record<string, unknown>));
    if (Array.isArray(deadlines)) {
      for (const dl of deadlines) {
        if (!(dl as any).id) (dl as any).id = crypto.randomUUID();
        await sb.from('personal_lit_deadlines').insert({ ...objToRow(dl as Record<string, unknown>), litigation_id: flat.id });
      }
    }
    if (Array.isArray(documents)) {
      for (const doc of documents) {
        if (!(doc as any).id) (doc as any).id = crypto.randomUUID();
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
    row.id = 'default';
    const { error } = await sb.from('auto_settings').upsert(row);
    if (error) console.error("saveSettings error:", error);
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
    const { error } = await sb.from('auto_logs').insert({
      id: `log${Date.now()}`,
      ...objToRow(log as Record<string, unknown>),
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.error('Failed to insert auto_log:', error);
    }
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

// ── Document CRUD ────────────────────────────────────────────
export const supabaseDocumentStore = {
  getAll: async (tenantId?: string): Promise<Document[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    
    let query = sb.from('documents').select('*').order('created_at', { ascending: false });
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    const { data: rows } = await query;
    if (!rows) return [];
    
    return rows.map(r => ({
      id: r.id,
      companyId: r.tenant_id,
      authorRole: r.doc_source === 'internal' ? 'lawyer' : 'client',
      name: r.title,
      size: r.file_size || 0,
      type: r.file_type || 'application/pdf',
      category: (r.doc_type === 'contract' ? '계약서' :
                 r.doc_type === 'opinion' ? '의견서' :
                 r.doc_type === 'compliance_report' ? '리포트' :
                 r.doc_type === 'court_filing' ? '소장' :
                 r.doc_type === 'timecost_invoice' ? '영수증' : '기타') as unknown as Document['category'],
      status: (r.status === 'draft' ? '검토 대기' :
               r.status === 'reviewing' ? '검토 중' :
               r.status === 'approved' ? '검토 완료' : '검토 중') as unknown as Document['status'],
      createdBy: r.uploaded_by || '',
      url: r.file_url || '#',
      createdAt: r.created_at,
      isNewForClient: false,
      isNewForLawyer: false
    }));
  },

  getById: async (id: string): Promise<Document | null> => {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: r } = await sb.from('documents').select('*').eq('id', id).single();
    if (!r) return null;
    return {
      id: r.id,
      companyId: r.tenant_id,
      authorRole: r.doc_source === 'internal' ? 'lawyer' : 'client',
      name: r.title,
      size: r.file_size || 0,
      type: r.file_type || 'application/pdf',
      category: (r.doc_type === 'contract' ? '계약서' :
                 r.doc_type === 'opinion' ? '의견서' :
                 r.doc_type === 'compliance_report' ? '리포트' :
                 r.doc_type === 'court_filing' ? '소장' :
                 r.doc_type === 'timecost_invoice' ? '영수증' : '기타') as unknown as Document['category'],
      status: (r.status === 'draft' ? '검토 대기' :
               r.status === 'reviewing' ? '검토 중' :
               r.status === 'approved' ? '검토 완료' : '검토 중') as unknown as Document['status'],
      createdBy: r.uploaded_by || '',
      url: r.file_url || '#',
      createdAt: r.created_at,
      isNewForClient: false,
      isNewForLawyer: false
    };
  }
};

// ── Contract CRUD ────────────────────────────────────────────
export const supabaseContractStore = {
  getAll: async (): Promise<DbContract[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data: rows } = await sb.from('contracts').select('*').order('created_at', { ascending: false });
    return rows ? rows.map(r => rowToObj<DbContract>(r)) : [];
  },

  getById: async (id: string): Promise<DbContract | null> => {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: row } = await sb.from('contracts').select('*').eq('id', id).single();
    return row ? rowToObj<DbContract>(row) : null;
  },

  create: async (contract: Partial<DbContract>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    if (!contract.id) contract.id = crypto.randomUUID();
    await sb.from('contracts').insert(objToRow(contract as Record<string, unknown>));
  },

  update: async (id: string, updates: Partial<DbContract>): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    const row = objToRow(updates as Record<string, unknown>);
    row.updated_at = new Date().toISOString();
    await sb.from('contracts').update(row).eq('id', id);
  },

  delete: async (id: string): Promise<void> => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('contracts').delete().eq('id', id);
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
