-- ================================================================
-- 009: auto_settings 테이블 누락 컬럼 추가
-- 프론트엔드(types.ts AutoSettings 인터페이스)에는 정의되어 있으나
-- Supabase DB에 물리적으로 존재하지 않았던 컬럼들을 일괄 추가합니다.
-- 실행: Supabase Dashboard > SQL Editor
-- ================================================================

ALTER TABLE auto_settings
  ADD COLUMN IF NOT EXISTS signature_auto_check BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS signature_check_interval_hours INT DEFAULT 24,
  ADD COLUMN IF NOT EXISTS welcome_email_auto_send BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_onboarding BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_follow_up BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS kakao_auto_send BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS kakao_schedule_hours INT DEFAULT 24,
  ADD COLUMN IF NOT EXISTS kakao_template TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS auto_sales_confirm BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_assign_lawyer BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_generate_draft BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_send_email BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_deadline_alert BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_monthly_billing BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_overdue_reminder BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_satisfaction_survey BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_ai_memo_summary BOOLEAN DEFAULT true;
