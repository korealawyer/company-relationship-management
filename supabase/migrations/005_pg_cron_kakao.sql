-- ================================================================
-- 005: pg_cron 스케줄 + 카카오 알림톡 템플릿 DB 지원
-- 파일명: supabase/migrations/005_pg_cron_kakao.sql
-- 실행 전제: 004_c3_payment.sql 적용 완료
--
-- 포함 내용:
--   1. pg_net 확장 활성화 (Edge Function HTTP 호출용)
--   2. check_billing_overdue() 함수 — pg_cron → Edge Function 호출
--   3. check_upsell_triggers() 함수 — pg_cron → Edge Function 호출
--   4. pg_cron 스케줄 등록
--      - daily-billing-overdue: 매일 01:00 UTC (10:00 KST)
--      - daily-upsell-check:    매일 02:00 UTC (11:00 KST)
--   5. kakao_templates 테이블 — 알림톡 템플릿 관리
--   6. 기본 템플릿 3개 시드:
--      - BILLING_OVERDUE_D1 (결제 실패 → PAYMENT_FAILED)
--      - TRIAL_ENDING_D7    (체험 만료 7일 전 고지 — 법적 의무)
--      - PAYMENT_SUCCESS    (영수증 링크 포함)
-- ================================================================

-- ================================================================
-- 0. 필수 확장 (없으면 활성화)
-- ================================================================
CREATE EXTENSION IF NOT EXISTS pg_net;   -- HTTP 외부 호출 (Edge Fn 트리거용)
CREATE EXTENSION IF NOT EXISTS pg_cron;  -- 크론 스케줄러

-- ================================================================
-- 1. Helper: Edge Function 호출 공통 함수
--    인자: fn_name (workflow-billing-overdue 등)
-- ================================================================
CREATE OR REPLACE FUNCTION _call_edge_function(fn_name TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  _url    TEXT := current_setting('app.supabase_url', TRUE)
               || '/functions/v1/' || fn_name;
  _secret TEXT := current_setting('app.service_role_key', TRUE);
BEGIN
  -- pg_net.http_post: 비동기 HTTP POST (응답 대기 없음)
  PERFORM net.http_post(
    url     := _url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _secret
    ),
    body    := '{}'::jsonb
  );
EXCEPTION WHEN OTHERS THEN
  -- 외부 호출 실패는 로그만 기록하고 진행
  RAISE WARNING '[_call_edge_function] % 호출 실패: %', fn_name, SQLERRM;
END;
$$;

COMMENT ON FUNCTION _call_edge_function IS
  'pg_cron → Supabase Edge Function HTTP 호출 헬퍼. app.supabase_url / app.service_role_key 설정 필요.';

-- ================================================================
-- 2. check_billing_overdue() — 미납 구독 처리 트리거
--    pg_cron이 호출 → workflow-billing-overdue Edge Function 기동
-- ================================================================
CREATE OR REPLACE FUNCTION check_billing_overdue()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM _call_edge_function('workflow-billing-overdue');
  RAISE LOG '[pg_cron] check_billing_overdue() 호출 완료 at %', NOW();
END;
$$;

COMMENT ON FUNCTION check_billing_overdue IS
  'pg_cron에서 호출하는 미납 결제 추적 함수. workflow-billing-overdue Edge Function을 비동기 실행.';

-- ================================================================
-- 3. check_upsell_triggers() — 업셀 기회 감지 트리거
--    pg_cron이 호출 → workflow-billing-upsell Edge Function 기동
-- ================================================================
CREATE OR REPLACE FUNCTION check_upsell_triggers()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM _call_edge_function('workflow-billing-upsell');
  RAISE LOG '[pg_cron] check_upsell_triggers() 호출 완료 at %', NOW();
END;
$$;

COMMENT ON FUNCTION check_upsell_triggers IS
  'pg_cron에서 호출하는 업셀 기회 감지 함수. workflow-billing-upsell Edge Function을 비동기 실행.';

-- ================================================================
-- 4. pg_cron 스케줄 등록
--    기존 스케줄 중복 방지: unschedule 후 재등록
-- ================================================================
SELECT cron.unschedule('daily-billing-overdue') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-billing-overdue'
);

SELECT cron.unschedule('daily-upsell-check') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-upsell-check'
);

-- 매일 01:00 UTC (= KST 10:00) — 미납 결제 추적
SELECT cron.schedule(
  'daily-billing-overdue',
  '0 1 * * *',
  $$SELECT check_billing_overdue();$$
);

-- 매일 02:00 UTC (= KST 11:00) — 업셀 기회 감지
SELECT cron.schedule(
  'daily-upsell-check',
  '0 2 * * *',
  $$SELECT check_upsell_triggers();$$
);

-- 스케줄 확인 쿼리 (검증용)
-- SELECT jobname, schedule, command FROM cron.job ORDER BY jobname;

-- ================================================================
-- 5. kakao_templates 테이블
--    알림톡 템플릿 ID / 내용 단일 관리
-- ================================================================
CREATE TABLE IF NOT EXISTS kakao_templates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 템플릿 식별자 (코드에서 참조하는 key)
  template_key    TEXT        NOT NULL UNIQUE,
  -- 예: 'BILLING_OVERDUE_D1', 'TRIAL_ENDING_D7', 'PAYMENT_SUCCESS'

  -- 카카오 비즈니스 채널에서 발급받은 템플릿 코드
  kakao_template_id  TEXT,
  -- 발급 전(개발 중): NULL → 이메일 대체 발송

  -- 메시지 제목 (알림톡 헤더)
  title           TEXT        NOT NULL,

  -- 메시지 본문 템플릿 ({{변수}} 방식)
  body_template   TEXT        NOT NULL,

  -- 버튼 설정 JSONB
  -- 예: [{"name":"결제 관리","type":"WL","url_mobile":"https://lawtop.kr/admin/billing"}]
  buttons         JSONB       DEFAULT '[]'::JSONB,

  -- 법적 의무 여부 (TRIAL_ENDING_D7 등)
  is_legal_required BOOLEAN   NOT NULL DEFAULT FALSE,

  -- 이메일 대체 제목 (알림톡 미발급 시)
  email_subject   TEXT,

  -- 활성 여부
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,

  -- 타임스탬프
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: 서비스 역할만 접근 (super_admin 제외 일반 RLS 없음 — 코드 테이블)
ALTER TABLE kakao_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON kakao_templates
  USING (auth.role() = 'service_role');

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION kakao_templates_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER kakao_templates_updated_at
  BEFORE UPDATE ON kakao_templates
  FOR EACH ROW EXECUTE FUNCTION kakao_templates_set_updated_at();

-- ================================================================
-- 6. 기본 템플릿 3개 시드
-- ================================================================
INSERT INTO kakao_templates
  (template_key, kakao_template_id, title, body_template, buttons, is_legal_required, email_subject)
VALUES

-- ① 결제 실패 D+1 (PAYMENT_FAILED 이벤트 연동)
(
  'BILLING_OVERDUE_D1',
  NULL,  -- 카카오 채널 심사 후 발급받은 ID 입력 (예: 'KA01TP...')
  '[LAWTOP] 구독 결제 실패 안내',
  E'안녕하세요, {{법인명}} 담당자님.\n\n정기 구독 결제가 실패했습니다.\n\n📋 결제 정보\n• 플랜: {{플랜명}}\n• 결제 금액: {{결제금액}}원\n• 실패 사유: {{실패사유}}\n\n카드 정보를 확인하시고 결제 수단을 업데이트해 주세요.\n결제가 완료되지 않으면 서비스 이용이 제한될 수 있습니다.\n\n👉 결제 관리 페이지에서 카드를 재등록하거나 재결제하세요.',
  '[{"name":"결제 관리하기","type":"WL","url_mobile":"https://lawtop.kr/admin/billing","url_pc":"https://lawtop.kr/admin/billing"}]',
  FALSE,
  '[LAWTOP] 구독 결제 실패 — 즉시 확인 필요'
),

-- ② 체험 만료 D-7 (법적 의무: 유료 전환 7일 전 사전 고지)
(
  'TRIAL_ENDING_D7',
  NULL,
  '[LAWTOP] 무료 체험 종료 7일 전 안내',
  E'안녕하세요, {{법인명}} 담당자님.\n\n30일 무료 체험이 7일 후 종료됩니다.\n\n📋 체험 정보\n• 종료일: {{체험종료일}}\n• 선택 플랜: {{플랜명}}\n• 자동 전환 금액: {{월정액}}원/월\n\n체험 종료 후 등록된 결제 수단으로 자동 청구됩니다.\n계속 이용하지 않으시면 체험 종료 전까지 언제든 해지해 주세요.\n\n⚠️ 해지 시 데이터는 30일간 보관됩니다.',
  '[{"name":"구독 관리","type":"WL","url_mobile":"https://lawtop.kr/admin/billing","url_pc":"https://lawtop.kr/admin/billing"},{"name":"해지하기","type":"WL","url_mobile":"https://lawtop.kr/admin/billing#cancel","url_pc":"https://lawtop.kr/admin/billing#cancel"}]',
  TRUE,  -- 전자상거래법 제21조: 유료 전환 7일 전 고지 의무
  '[LAWTOP] 무료 체험 종료 7일 전 — 유료 전환 안내 (법적 고지)'
),

-- ③ 결제 성공 / 영수증 (PAYMENT_SUCCESS 이벤트 연동)
(
  'PAYMENT_SUCCESS',
  NULL,
  '[LAWTOP] 결제 완료 영수증',
  E'안녕하세요, {{법인명}} 담당자님.\n\n구독 결제가 완료되었습니다. 💳\n\n📋 결제 영수증\n• 플랜: {{플랜명}}\n• 결제 금액: {{결제금액}}원\n• 결제 일시: {{결제일시}}\n• 거래 번호: {{거래번호}}\n• 다음 결제일: {{다음결제일}}\n\n세금계산서 발행이 필요하신 경우 결제 관리 페이지에서 신청해 주세요.',
  '[{"name":"영수증 보기","type":"WL","url_mobile":"https://lawtop.kr/admin/billing","url_pc":"https://lawtop.kr/admin/billing"},{"name":"세금계산서 신청","type":"WL","url_mobile":"https://lawtop.kr/admin/billing#invoice","url_pc":"https://lawtop.kr/admin/billing#invoice"}]',
  FALSE,
  '[LAWTOP] 결제 완료 영수증'
)

ON CONFLICT (template_key) DO UPDATE SET
  title             = EXCLUDED.title,
  body_template     = EXCLUDED.body_template,
  buttons           = EXCLUDED.buttons,
  is_legal_required = EXCLUDED.is_legal_required,
  email_subject     = EXCLUDED.email_subject,
  updated_at        = NOW();

-- ================================================================
-- 7. app.settings — Edge Function URL/KEY 주입 (운영 배포 시 설정)
--
-- Supabase Dashboard → Project Settings → Database → Extensions → pg_cron
-- 또는 아래 쿼리로 직접 설정:
--
-- ALTER DATABASE postgres
--   SET "app.supabase_url" = 'https://YOUR_PROJECT_REF.supabase.co';
-- ALTER DATABASE postgres
--   SET "app.service_role_key" = 'YOUR_SERVICE_ROLE_KEY';
--
-- ⚠️ 운영 DB에서만 실행. 개발 환경은 주석 처리 유지.
-- ================================================================

-- ================================================================
-- 완료 메시지
-- ================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ 005_pg_cron_kakao.sql 마이그레이션 완료';
  RAISE NOTICE '   - pg_net, pg_cron 확장 활성화';
  RAISE NOTICE '   - check_billing_overdue() 등록 (매일 01:00 UTC)';
  RAISE NOTICE '   - check_upsell_triggers() 등록 (매일 02:00 UTC)';
  RAISE NOTICE '   - kakao_templates 테이블 + 3개 템플릿 시드';
  RAISE NOTICE '   ⚠️  app.supabase_url / app.service_role_key DB 설정 필요';
  RAISE NOTICE '   ⚠️  카카오 심사 후 kakao_template_id 업데이트 필요';
END;
$$;
