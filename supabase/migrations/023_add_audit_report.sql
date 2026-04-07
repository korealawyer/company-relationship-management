-- add audit_report text column to store the AI-generated full markdown audit report

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS audit_report TEXT;

COMMENT ON COLUMN public.companies.audit_report IS '완성형 법률 실사 보고서 (Markdown 포맷)';
