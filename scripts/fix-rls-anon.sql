-- ================================================================
-- IBS CRM — RLS (Zero-Day Vulnerability) Fix Script
-- 실행 방법: Supabase Dashboard → SQL Editor → 붙여넣기 → Run
-- ================================================================

-- 모든 테이블의 익명 접근 정책(Allow anon read) 일괄 삭제
-- 프로덕션 환경의 데이터 격리를 강제하기 위한 조치입니다.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'users','companies','issues','company_contacts','company_timeline',
      'company_memos','litigation_cases','litigation_deadlines','consultations',
      'personal_clients','personal_litigations','personal_lit_deadlines',
      'personal_lit_documents','auto_settings','auto_logs'
    ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Allow anon read" ON %I;',
      tbl
    );
  END LOOP;
END
$$;
