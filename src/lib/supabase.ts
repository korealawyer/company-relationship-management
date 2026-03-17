// Supabase 연동 레이어
// Phase 1: Mock 모드 — 환경변수 없이도 모든 페이지 작동
// Phase 2: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY 설정 시 실 DB 연결

export const IS_SUPABASE_CONFIGURED = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Phase 2에서 아래 주석 해제 후 npm install @supabase/supabase-js
/*
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
*/

// ── Supabase 스키마 타입 ─────────────────────────────────────
export interface DbCompany {
  id: string;
  biz_no: string;
  name: string;
  plan: 'basic' | 'pro' | 'premium' | 'none';
  status: string;
  assigned_lawyer_id: string | null;
  created_at: string;
}

export interface DbUser {
  id: string;
  email: string;
  role: string;
  company_id: string | null;
  name: string;
  phone: string;
  created_at: string;
}

export interface DbConsultation {
  id: string;
  company_id: string;
  user_id: string;
  category: string;
  urgency: 'urgent' | 'normal';
  title: string;
  content: string;
  ai_draft: string;
  lawyer_draft: string;
  status: string;
  callback_phone: string;
  created_at: string;
}

export interface DbSubscription {
  id: string;
  company_id: string;
  plan: 'basic' | 'pro' | 'premium';
  amount: number;
  status: 'active' | 'expired' | 'cancelled';
  started_at: string;
  expires_at: string;
}

// ── SQL 스키마 (Phase 2 Supabase 설정 시 실행) ──────────────────────────────────────
/*
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  biz_no varchar(12) UNIQUE NOT NULL,
  name text NOT NULL,
  plan text DEFAULT 'none',
  status text DEFAULT 'pending',
  assigned_lawyer_id uuid,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  company_id uuid REFERENCES companies(id),
  name text,
  phone text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  user_id uuid,
  category text,
  urgency text DEFAULT 'normal',
  title text,
  content text,
  ai_draft text,
  lawyer_draft text,
  status text DEFAULT 'submitted',
  callback_phone text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  plan text NOT NULL,
  amount integer NOT NULL,
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz
);
*/
