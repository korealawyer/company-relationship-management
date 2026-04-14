-- 009: 영업 관리 페이지 개선을 위한 통화 이력 로그 전용 테이블 신설
-- 목적: 기존의 통계 획득용 companies 테이블 전체 조회를 회피하고 
-- O(1) 수준의 빠르고 정확한 통계 집계를 위한 테이블

CREATE TABLE IF NOT EXISTS public.sales_call_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID,          
    user_name TEXT,        
    call_result TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 통계 조회를 위한 복합 및 단일 인덱스 부착
CREATE INDEX IF NOT EXISTS idx_sales_call_logs_created_at ON public.sales_call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_call_logs_user_name ON public.sales_call_logs(user_name);

-- RLS (Row Level Security) 설정
ALTER TABLE public.sales_call_logs ENABLE ROW LEVEL SECURITY;

-- API/프론트엔드에서의 자유로운 삽입 및 조회를 위한 Policy
CREATE POLICY "Enable ALL actions for authenticated users" 
ON public.sales_call_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable ALL actions for anon users"
ON public.sales_call_logs FOR ALL TO anon USING (true) WITH CHECK (true);
