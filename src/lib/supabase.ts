// ================================================================
// Supabase 연동 레이어 — Dual Mode (Mock / Live)
// 환경변수 설정 시 Supabase 실 연결, 미설정 시 Mock 모드 자동 전환
// ================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// ── 환경변수 기반 모드 결정 ───────────────────────────────────
export const IS_SUPABASE_CONFIGURED = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Supabase 클라이언트 (싱글턴) ──────────────────────────────
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!IS_SUPABASE_CONFIGURED) return null;
  if (_supabase) return _supabase;
  _supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _supabase;
}

// 편의 export — null 가능
export const supabase = IS_SUPABASE_CONFIGURED
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : null;

// ── CSR용 Supabase 클라이언트 (Auth 전용) ────────────────────
// @supabase/ssr의 createBrowserClient — 쿠키 자동 관리
let _browserClient: ReturnType<typeof createBrowserClient> | null = null;
export function getBrowserSupabase() {
  if (!IS_SUPABASE_CONFIGURED) return null;
  if (_browserClient) return _browserClient;
  _browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _browserClient;
}

// ── 서버사이드 전용 Service Role 클라이언트 ───────────────────
export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── DB 스키마 타입 ────────────────────────────────────────────
export interface DbCompany {
  id: string;
  biz_no: string;
  name: string;
  domain?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  biz_category?: string;
  store_count: number;
  plan: 'none' | 'basic' | 'standard' | 'premium';
  status: string;
  risk_level?: string;
  risk_score: number;
  issue_count: number;
  privacy_url?: string;
  assigned_lawyer_id?: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface DbUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: string;
  company_id?: string;
  created_at: string;
}

export interface DbConsultation {
  id: string;
  company_id?: string;
  user_id?: string;
  category?: string;
  urgency: 'urgent' | 'normal';
  title?: string;
  content?: string;
  ai_draft?: string;
  lawyer_draft?: string;
  status: string;
  callback_phone?: string;
  created_at: string;
}

export interface DbSubscription {
  id: string;
  company_id: string;
  plan: 'basic' | 'standard' | 'premium';
  amount: number;
  status: 'active' | 'expired' | 'cancelled';
  started_at: string;
  expires_at?: string;
}

export interface DbIssue {
  id: string;
  company_id: string;
  level: string;
  law_ref?: string;
  title: string;
  original_text?: string;
  risk_desc?: string;
  custom_draft?: string;
  lawyer_note?: string;
  scenario?: string;
  review_checked: boolean;
  created_at: string;
}

export interface DbTimeline {
  id: string;
  company_id: string;
  author: string;
  content: string;
  type: string;
  created_at: string;
}

export interface DbSalesContact {
  id: string;
  company_id?: string;
  contact_type?: string;
  message?: string;
  created_at: string;
}

// ── 기능 플래그 (Painted Door 전략) ────────────────────────────
// true = 실제 기능 구현 완료, false = Painted Door (데모 데이터 + 가입 유도 모달)
export const FEATURE_FLAGS = {
  AUTH: IS_SUPABASE_CONFIGURED,           // 실제 인증
  PAYMENT: !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID,  // 실제 결제
  AI_CHAT: !!process.env.ANTHROPIC_API_KEY,             // 실제 AI 챗봇
  CASES: false,            // 사건 관리 → Painted Door
  DOCUMENTS: false,        // 문서 허브 → Painted Door
  CONTRACTS: true,         // 전자계약 → 실제 구현
  NOTIFICATIONS: false,    // 기일 알림 → Painted Door
  AI_REVIEW: false,        // AI 계약서 검토 → Painted Door
  EAP: false,              // EAP 심리상담 → Painted Door
  BILLING: false,          // 수납/청구 → Painted Door
  MONTHLY_REPORT: false,   // 월간 리포트 → Painted Door
} as const;
