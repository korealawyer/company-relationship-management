-- Create finance_payments table for tracking invoice and revenue collection
CREATE TABLE IF NOT EXISTS public.finance_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  amount numeric(15, 2) NOT NULL,
  description text,
  status text CHECK (status IN ('PAID', 'PENDING', 'OVERDUE', 'CANCELLED')) DEFAULT 'PENDING',
  due_date date,
  paid_date date,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create finance_expenses table for tracking internal spending
CREATE TABLE IF NOT EXISTS public.finance_expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  amount numeric(15, 2) NOT NULL,
  category text NOT NULL, -- e.g., 'OFFICE', 'TRAVEL', 'SOFTWARE', 'MARKETING'
  description text,
  payment_method text,
  incurred_date date DEFAULT CURRENT_DATE,
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.finance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
-- Only 'finance' and 'admin' roles can perform all operations, others can only read their related data.
-- (Simplified RLS for this application: All authenticated users can read, only finance can edit)

CREATE POLICY "Enable read access for all users on finance_payments"
ON public.finance_payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "finance_payments_all_access_finance"
ON public.finance_payments FOR ALL TO authenticated
USING (
  ((current_setting('request.jwt.claims', true))::jsonb ->> 'role') IN ('finance', 'admin', 'service_role')
);

CREATE POLICY "Enable read access for all users on finance_expenses"
ON public.finance_expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "finance_expenses_all_access_finance"
ON public.finance_expenses FOR ALL TO authenticated
USING (
  ((current_setting('request.jwt.claims', true))::jsonb ->> 'role') IN ('finance', 'admin', 'service_role')
);

-- Insert Seed Data for finance_payments
INSERT INTO public.finance_payments (amount, description, status, due_date, paid_date, payment_method)
VALUES 
  (5500000, '(주)놀부NBG 정기 자문료 (3월)', 'PAID', '2026-03-31', '2026-03-31', 'BANK_TRANSFER'),
  (3300000, '스타트업 A시드 투자 자문', 'PAID', '2026-03-25', '2026-03-26', 'CREDIT_CARD'),
  (12000000, '교촌에프앤비 공정위 대응 수임료', 'PENDING', '2026-04-15', NULL, NULL),
  (2500000, '주식회사 이노베이션 착수금', 'OVERDUE', '2026-03-20', NULL, NULL),
  (4400000, '개인회생 수임료 (김철수)', 'PAID', '2026-03-10', '2026-03-10', 'CREDIT_CARD');

-- Insert Seed Data for finance_expenses
INSERT INTO public.finance_expenses (amount, category, description, incurred_date, payment_method)
VALUES 
  (1500000, 'OFFICE', '3월 임대료 및 관리비', '2026-03-25', 'BANK_TRANSFER'),
  (350000, 'SOFTWARE', 'AWS 및 CRM 클라우드 호스팅', '2026-03-28', 'CORPORATE_CARD'),
  (800000, 'MARKETING', '네이버 검색광고 (3월)', '2026-03-30', 'CORPORATE_CARD'),
  (120000, 'TRAVEL', '대전지법 출장 KTX 및 식대', '2026-03-15', 'CORPORATE_CARD');
