-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the zoom_consultations table
CREATE TABLE IF NOT EXISTS public.zoom_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    company_name TEXT,
    consultation_type TEXT NOT NULL CHECK (consultation_type IN ('기업자문', '계약검토', '분쟁')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    zoom_meeting_id TEXT,
    zoom_join_url TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Turn on Row Level Security
ALTER TABLE public.zoom_consultations ENABLE ROW LEVEL SECURITY;

-- Policy 1: 누구나 Insert 가능 (퍼블릭 예약 폼 지원)
CREATE POLICY "누구나 예약 정보를 추가할 수 있음"
ON public.zoom_consultations
FOR INSERT
WITH CHECK (true);

-- Policy 2: 본인 조회 가능
-- 일반적으로 Supabase Auth를 통해 로그인된 사용자의 email과 예약 이메일이 일치하는 경우를 조회 가능하도록 설정
CREATE POLICY "사용자는 본인의 이메일로 등록된 예약만 조회할 수 있음"
ON public.zoom_consultations
FOR SELECT
USING (auth.jwt() ->> 'email' = client_email);
