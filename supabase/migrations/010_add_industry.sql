-- /supabase/migrations/010_add_industry.sql
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS industry text;
