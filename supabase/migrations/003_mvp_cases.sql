-- ================================================================
-- MVP #1+#2: 통합 사건 대시보드 + 자동 기일 알림
-- 파일명: supabase/migrations/003_mvp_cases.sql
-- 실행 순서: schema.sql (기존) → 001 → 002 → 003 (이 파일)
--
-- 설계 근거:
--   MVP #1 — 통합 사건 대시보드 (_strategy/LAWTOP_IA_DEEP_RESEARCH.md)
--   MVP #2 — 자동 기일 알림 + 의뢰인 통보 (_strategy/LAWTOP_IA_DEEP_RESEARCH.md)
--   멀티테넌트 격리: tenant_id (NOT law_firm_id) — 절대 규칙 #1
--   RLS Policy 명: tenant_isolation
--   trigger_type 값: src/lib/constants/automation.ts에서 관리
--
-- ⚠️ 이해충돌 체크:
--   cases.opponent TEXT + tenant_id 조합에 UNIQUE 제약 없음.
--   비즈니스 로직 (API 레이어)에서 SELECT 후 409 반환으로 처리.
--   DB 레이어 제약은 operator_name 퍼지 매칭이 필요하므로 의도적으로 제외.
-- ================================================================

-- ── 사전 준비: 참조 타입 확인용 헬퍼 ─────────────────────────────
-- law_firms 테이블이 없으면 생성 (이 프로젝트는 companies가 테넌트 역할)
-- ⚠️ 기존 schema.sql의 companies 테이블이 로펌 테넌트 역할을 함.
--    law_firms 별도 테이블 없이 companies.id를 tenant_id로 참조.
-- ================================================================


-- ================================================================
-- TABLE 1: cases (사건 테이블)
-- ================================================================
CREATE TABLE IF NOT EXISTS cases (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 멀티테넌트 격리 (절대 규칙 #1: tenant_id 사용)
    tenant_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 사건 식별
    case_number          TEXT UNIQUE,  -- 자동 생성: 2026-0001 형식
    title                TEXT NOT NULL,
    case_type            TEXT NOT NULL CHECK (case_type IN (
                           'civil',          -- 민사
                           'criminal',       -- 형사
                           'administrative', -- 행정
                           'corporate',      -- 기업
                           'franchise',      -- 프랜차이즈
                           'labor',          -- 노동
                           'real_estate',    -- 부동산
                           'family',         -- 가사
                           'other'           -- 기타
                         )),

    -- 상태 (칸반 5단계)
    status               TEXT NOT NULL DEFAULT 'intake' CHECK (status IN (
                           'intake',          -- 상담중
                           'retained',        -- 수임
                           'active',          -- 진행중
                           'closing',         -- 종결 준비
                           'closed'           -- 종결
                         )),

    -- 당사자 정보
    client_id            UUID REFERENCES users(id) ON DELETE SET NULL,  -- 개인 의뢰인
    client_company_id    UUID REFERENCES companies(id) ON DELETE SET NULL,  -- 기업 의뢰인

    -- 담당 변호사 (이해충돌 체크에 사용)
    assigned_attorney_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- 상대방 (이해충돌 체크 비즈니스 로직용 — DB UNIQUE 제약 없음, API 레이어 처리)
    opponent             TEXT,  -- 상대방명 (퍼지 매칭 필요 → API에서 ILIKE 검사)

    -- 이해충돌 체크 완료 여부 (신건 등록 프로세스 추적용)
    is_conflict_checked  BOOLEAN NOT NULL DEFAULT FALSE,
    conflict_checked_at  TIMESTAMPTZ,
    conflict_checked_by  UUID REFERENCES users(id) ON DELETE SET NULL,

    -- 불변기일 플래그 (항소기한 등 법적 리스크 최상위)
    is_immutable         BOOLEAN NOT NULL DEFAULT FALSE,

    -- 기일 관련
    deadline_at          DATE,  -- 최종 마감일 (D-Day 알림 기준)
    priority             TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),

    -- 수임료
    retainer_fee         NUMERIC(15, 0),   -- 착수금 (원 단위)
    success_fee          NUMERIC(15, 0),   -- 성공보수

    -- 메모
    notes                TEXT,

    -- 타임스탬프
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at            TIMESTAMPTZ,

    -- 의뢰인/기업 의뢰인 둘 중 하나만 연결 (또는 둘 다 NULL — 잠재 상담)
    CONSTRAINT client_or_company_or_none CHECK (
        NOT (client_id IS NOT NULL AND client_company_id IS NOT NULL)
    )
);

-- RLS 활성화 및 tenant_isolation 정책 적용
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON cases
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- cases updated_at 자동 갱신
CREATE OR REPLACE FUNCTION cases_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION cases_set_updated_at();

-- 사건번호 자동 생성 (예: 2026-0001)
-- 같은 tenant 내 해당 연도 사건 수 기준 순번 부여
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    seq INT;
BEGIN
    SELECT COUNT(*) + 1 INTO seq
    FROM cases
    WHERE tenant_id = NEW.tenant_id
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

    NEW.case_number := EXTRACT(YEAR FROM NOW())::TEXT
                       || '-'
                       || LPAD(seq::TEXT, 4, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER auto_case_number
    BEFORE INSERT ON cases
    FOR EACH ROW
    WHEN (NEW.case_number IS NULL)
    EXECUTE FUNCTION generate_case_number();


-- ================================================================
-- TABLE 2: case_timeline (사건 타임라인)
-- ================================================================
CREATE TABLE IF NOT EXISTS case_timeline (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id      UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,

    -- 멀티테넌트 격리 (JOIN 없이 RLS 적용 가능하도록 중복 저장)
    tenant_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 이벤트 분류
    -- ⚠️ event_type은 automation.ts의 AUTOMATION_TRIGGER_TYPE과 연계
    event_type   TEXT NOT NULL CHECK (event_type IN (
                   'case_created',          -- 신건 등록 (AUTOMATION_TRIGGER_TYPE.CASE_CREATED)
                   'case_status_changed',   -- 상태 변경 (AUTOMATION_TRIGGER_TYPE.CASE_STATUS_CHANGED)
                   'case_conflict_detected',-- 이해충돌 감지 (AUTOMATION_TRIGGER_TYPE.CASE_CONFLICT_DETECTED)
                   'hearing_added',         -- 기일 등록 (AUTOMATION_TRIGGER_TYPE.HEARING_ADDED)
                   'document_uploaded',     -- 문서 업로드 (AUTOMATION_TRIGGER_TYPE.DOCUMENT_UPLOADED)
                   'note_added',            -- 메모 추가
                   'attorney_assigned',     -- 변호사 배정
                   'client_notified',       -- 의뢰인 통보
                   'custom'                 -- 기타 수동 이벤트
                 )),

    description  TEXT,         -- 이벤트 설명 (예: "수임으로 상태 변경")
    actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,  -- 이벤트 발생 사용자
    payload      JSONB,         -- 추가 데이터 (상태 변경 전/후 값 등)

    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화 및 tenant_isolation 정책 적용
ALTER TABLE case_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON case_timeline
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 인덱스: case_id + 시간순 조회 최적화
CREATE INDEX IF NOT EXISTS idx_case_timeline_case_id
    ON case_timeline(case_id, created_at DESC);


-- ================================================================
-- TABLE 3: hearings (기일 테이블)
-- MVP #2 핵심: 기일 등록 → scheduled_alerts 자동 생성
-- ================================================================
CREATE TABLE IF NOT EXISTS hearings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id        UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,

    -- 멀티테넌트 격리
    tenant_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 기일 정보
    hearing_type   TEXT NOT NULL CHECK (hearing_type IN (
                     'pleading',        -- 변론기일
                     'judgment',        -- 선고기일
                     'mediation',       -- 조정기일
                     'conciliation',    -- 화해기일
                     'examination',     -- 심문기일
                     'evidence',        -- 증거조사기일
                     'other'            -- 기타
                   )),
    hearing_date   DATE NOT NULL,                 -- 기일 날짜
    hearing_time   TIME,                          -- 기일 시각 (NULL: 미정)
    court_name     TEXT NOT NULL,                 -- 법원명 (예: 서울중앙지방법원)
    courtroom      TEXT,                          -- 법정 호수 (예: 제103호)
    location       TEXT,                          -- 상세 위치 (법원 주소 등)

    -- 불변기일 (항소기한 등 — 누락 시 법적 책임)
    is_immutable   BOOLEAN NOT NULL DEFAULT FALSE,

    -- 알림 설정
    notify_client  BOOLEAN NOT NULL DEFAULT TRUE,  -- 의뢰인 카카오 알림톡 발송 여부
    notify_attorney BOOLEAN NOT NULL DEFAULT TRUE, -- 담당 변호사 내부 알림 여부

    -- 변호사 메모 (포털 연동 — 의뢰인이 기일 상세에서 확인)
    attorney_memo  TEXT,

    -- 생성자
    created_by     UUID REFERENCES users(id) ON DELETE SET NULL,

    -- 타임스탬프
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화 및 tenant_isolation 정책 적용
ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON hearings
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- hearings updated_at 자동 갱신
CREATE OR REPLACE FUNCTION hearings_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER hearings_updated_at
    BEFORE UPDATE ON hearings
    FOR EACH ROW EXECUTE FUNCTION hearings_set_updated_at();

-- 인덱스: case_id + 날짜 정렬 (D-Day 소팅용)
CREATE INDEX IF NOT EXISTS idx_hearings_case_date
    ON hearings(case_id, hearing_date ASC);

-- 인덱스: 오늘 + D-7/D-3/D-0 스캔용 (pg_cron 매일 09:00 실행)
CREATE INDEX IF NOT EXISTS idx_hearings_date_tenant
    ON hearings(hearing_date, tenant_id)
    WHERE hearing_date >= CURRENT_DATE;


-- ================================================================
-- TABLE 4: scheduled_alerts (알림 스케줄 테이블)
-- pg_cron 매일 09:00 → 이 테이블 스캔 → 발송
-- ================================================================
CREATE TABLE IF NOT EXISTS scheduled_alerts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hearing_id     UUID NOT NULL REFERENCES hearings(id) ON DELETE CASCADE,
    case_id        UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,

    -- 멀티테넌트 격리
    tenant_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 알림 타입
    -- ⚠️ trigger_type 값은 AUTOMATION_TRIGGER_TYPE.HEARING_ADDED 기준으로 생성
    alert_type     TEXT NOT NULL CHECK (alert_type IN (
                     'immutable_warning',  -- D-14: 불변기일 특별 경고 (대표 CC 포함)
                     'internal_d7',        -- D-7: 내부 변호사+직원 알림
                     'client_d3',          -- D-3: 의뢰인 카카오 알림톡
                     'client_d1',          -- D-1: 의뢰인 카카오 + SMS 폴백
                     'internal_d0'         -- D-0: 변호사 오전 최종 알림 (09:00)
                   )),

    -- 수신 대상
    target_type    TEXT NOT NULL CHECK (target_type IN (
                     'attorney',  -- 담당 변호사
                     'staff',     -- 사무장/직원
                     'client',    -- 의뢰인
                     'all'        -- 전체 (불변기일 경고)
                   )),
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- 특정 개인 (NULL = 역할 기반 발송)

    -- 발송 채널
    channel        TEXT NOT NULL CHECK (channel IN (
                     'kakao',     -- 카카오 알림톡 (1순위)
                     'sms',       -- SMS 폴백 (카카오 실패 시)
                     'email',     -- 이메일 (내부 알림 폴백)
                     'internal'   -- 인앱 알림 (Supabase Realtime)
                   )),

    -- 예약 발송 시각 (pg_cron이 이 값 기준으로 스캔)
    scheduled_for  TIMESTAMPTZ NOT NULL,

    -- 발송 상태
    sent           BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at        TIMESTAMPTZ,
    retry_count    INT NOT NULL DEFAULT 0,
    last_error     TEXT,   -- 마지막 실패 이유

    -- 생성 시각
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화 및 tenant_isolation 정책 적용
ALTER TABLE scheduled_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON scheduled_alerts
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 인덱스: pg_cron 매일 스캔용 (sent=FALSE + scheduled_for 기준)
CREATE INDEX IF NOT EXISTS idx_scheduled_alerts_dispatch
    ON scheduled_alerts(scheduled_for, sent, tenant_id)
    WHERE sent = FALSE;

-- 인덱스: hearing_id 기준 알림 조회
CREATE INDEX IF NOT EXISTS idx_scheduled_alerts_hearing
    ON scheduled_alerts(hearing_id);


-- ================================================================
-- TABLE 5: notification_logs (발송 이력 로그)
-- 직원 모니터링 대시보드 `/notifications/monitor` 데이터 소스
-- ================================================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 멀티테넌트 격리
    tenant_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 연계 알림 (NULL 가능 — 수동 발송의 경우)
    alert_id      UUID REFERENCES scheduled_alerts(id) ON DELETE SET NULL,

    -- 트리거 타입 (automation.ts AUTOMATION_TRIGGER_TYPE에서 import)
    -- 예: AUTOMATION_TRIGGER_TYPE.HEARING_ALERT_SENT / HEARING_ALERT_FAILED
    trigger_type  TEXT NOT NULL,

    -- 수신자
    recipient_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_phone TEXT,   -- 동적 수신 번호 (수신자가 탈퇴해도 이력 보존)
    recipient_email TEXT,

    -- 발송 채널 및 상태
    channel       TEXT NOT NULL CHECK (channel IN ('kakao', 'sms', 'email', 'internal')),
    status        TEXT NOT NULL CHECK (status IN (
                    'delivered',      -- 수신 성공 (AUTOMATION_TRIGGER_TYPE.HEARING_ALERT_SENT 연계)
                    'sms_fallback',   -- 카카오 실패 → SMS 전환 성공
                    'failed',         -- 발송 실패 (AUTOMATION_TRIGGER_TYPE.HEARING_ALERT_FAILED 연계)
                    'pending_retry'   -- 재시도 대기 (retry_count+1 후 1시간 후 재발송)
                  )),

    -- 발송 시각
    sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 외부 API 응답 원문 (카카오/SMS API 응답 JSON)
    response      JSONB,

    -- 연계 사건/기일 (대시보드 조회용)
    case_id       UUID REFERENCES cases(id) ON DELETE SET NULL,
    hearing_id    UUID REFERENCES hearings(id) ON DELETE SET NULL
);

-- RLS 활성화 및 tenant_isolation 정책 적용
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON notification_logs
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 인덱스: 오늘 발송 이력 조회용 (직원 모니터링 대시보드)
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at
    ON notification_logs(tenant_id, sent_at DESC);

-- 인덱스: 실패 건 재시도용
CREATE INDEX IF NOT EXISTS idx_notification_logs_failed
    ON notification_logs(tenant_id, status)
    WHERE status IN ('failed', 'pending_retry');


-- ================================================================
-- TRIGGER: hearings INSERT 시 scheduled_alerts 자동 생성
-- MVP #2 핵심 자동화 로직
-- ================================================================
CREATE OR REPLACE FUNCTION auto_create_scheduled_alerts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    hearing_ts TIMESTAMPTZ;
BEGIN
    -- hearing_time이 있으면 합산, 없으면 오전 9시 기본값
    hearing_ts := (NEW.hearing_date || ' ' || COALESCE(NEW.hearing_time::TEXT, '09:00:00'))::TIMESTAMPTZ;

    -- ① 불변기일 D-14 경고 (is_immutable = TRUE 인 경우만)
    IF NEW.is_immutable = TRUE THEN
        INSERT INTO scheduled_alerts
            (hearing_id, case_id, tenant_id, alert_type, target_type, channel, scheduled_for)
        VALUES
            (NEW.id, NEW.case_id, NEW.tenant_id,
             'immutable_warning', 'all', 'kakao',
             hearing_ts - INTERVAL '14 days');
    END IF;

    -- ② D-7: 내부 변호사+직원 알림 (내부 인앱 + 카카오)
    INSERT INTO scheduled_alerts
        (hearing_id, case_id, tenant_id, alert_type, target_type, channel, scheduled_for)
    VALUES
        (NEW.id, NEW.case_id, NEW.tenant_id,
         'internal_d7', 'attorney', 'internal',
         hearing_ts - INTERVAL '7 days');

    -- ③ D-3: 의뢰인 카카오 알림톡 (notify_client = TRUE 인 경우만)
    IF NEW.notify_client = TRUE THEN
        INSERT INTO scheduled_alerts
            (hearing_id, case_id, tenant_id, alert_type, target_type, channel, scheduled_for)
        VALUES
            (NEW.id, NEW.case_id, NEW.tenant_id,
             'client_d3', 'client', 'kakao',
             hearing_ts - INTERVAL '3 days');

        -- ④ D-1: 의뢰인 카카오 + SMS 폴백
        INSERT INTO scheduled_alerts
            (hearing_id, case_id, tenant_id, alert_type, target_type, channel, scheduled_for)
        VALUES
            (NEW.id, NEW.case_id, NEW.tenant_id,
             'client_d1', 'client', 'kakao',
             hearing_ts - INTERVAL '1 day');
    END IF;

    -- ⑤ D-0: 담당 변호사 오전 9시 최종 알림
    INSERT INTO scheduled_alerts
        (hearing_id, case_id, tenant_id, alert_type, target_type, channel, scheduled_for)
    VALUES
        (NEW.id, NEW.case_id, NEW.tenant_id,
         'internal_d0', 'attorney', 'internal',
         (NEW.hearing_date || ' 09:00:00')::TIMESTAMPTZ);

    RETURN NEW;
END;
$$;

CREATE TRIGGER hearings_auto_alerts
    AFTER INSERT ON hearings
    FOR EACH ROW EXECUTE FUNCTION auto_create_scheduled_alerts();


-- ================================================================
-- TRIGGER: case_timeline 자동 기록 (cases INSERT/UPDATE)
-- ================================================================
CREATE OR REPLACE FUNCTION auto_case_timeline()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- 신건 등록 시
    IF TG_OP = 'INSERT' THEN
        INSERT INTO case_timeline (case_id, tenant_id, event_type, description, payload)
        VALUES (
            NEW.id,
            NEW.tenant_id,
            'case_created',
            '신건이 등록되었습니다.',
            jsonb_build_object(
                'case_number', NEW.case_number,
                'case_type', NEW.case_type,
                'status', NEW.status
            )
        );

    -- 상태 변경 시
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO case_timeline (case_id, tenant_id, event_type, description, payload)
        VALUES (
            NEW.id,
            NEW.tenant_id,
            'case_status_changed',
            '사건 상태가 변경되었습니다: ' || OLD.status || ' → ' || NEW.status,
            jsonb_build_object(
                'from', OLD.status,
                'to', NEW.status
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER cases_auto_timeline
    AFTER INSERT OR UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION auto_case_timeline();


-- ================================================================
-- FUNCTION: 이해충돌 체크 (API 레이어에서 호출)
-- POST /api/cases 에서 INSERT 전 반드시 호출
-- 반환: conflict 있으면 행 반환, 없으면 빈 결과
-- ================================================================
CREATE OR REPLACE FUNCTION check_case_conflict(
    p_tenant_id   UUID,
    p_opponent    TEXT,
    p_client_name TEXT DEFAULT NULL
)
RETURNS TABLE (
    conflict_case_id    UUID,
    conflict_case_title TEXT,
    conflict_reason     TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- [1] 새 사건의 상대방이 기존 의뢰인 중에 있는지 검사
    RETURN QUERY
    SELECT
        c.id,
        c.title,
        '상대방이 기존 의뢰인과 동일합니다: ' || u.name AS reason
    FROM cases c
    JOIN users u ON u.id = c.client_id
    WHERE c.tenant_id = p_tenant_id
      AND c.status NOT IN ('closed')
      AND u.name ILIKE '%' || p_opponent || '%';

    -- [2] 신규 의뢰인이 기존 사건의 상대방인지 검사
    IF p_client_name IS NOT NULL THEN
        RETURN QUERY
        SELECT
            c.id,
            c.title,
            '신규 의뢰인이 기존 사건 상대방과 동일합니다: ' || c.opponent AS reason
        FROM cases c
        WHERE c.tenant_id = p_tenant_id
          AND c.status NOT IN ('closed')
          AND c.opponent ILIKE '%' || p_client_name || '%';
    END IF;
END;
$$;


-- ================================================================
-- VIEW: 오늘의 긴급 사건 (대시보드 D-3 이내 하이라이트용)
-- `SELECT * FROM urgent_cases_today WHERE tenant_id = $1` 형식으로 사용
-- ================================================================
CREATE OR REPLACE VIEW urgent_cases_today AS
SELECT
    c.id            AS case_id,
    c.tenant_id,
    c.title         AS case_title,
    c.case_number,
    c.status,
    c.priority,
    c.opponent,
    c.assigned_attorney_id,
    h.id            AS hearing_id,
    h.hearing_date,
    h.hearing_time,
    h.hearing_type,
    h.court_name,
    h.courtroom,
    h.is_immutable,
    (h.hearing_date - CURRENT_DATE) AS days_until_hearing
FROM cases c
JOIN hearings h ON h.case_id = c.id
WHERE c.status NOT IN ('closed')
  AND h.hearing_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY h.hearing_date ASC, h.is_immutable DESC;

-- VIEW 접근 RLS: cases 테이블 RLS에 의존 (VIEW는 기반 테이블 정책 적용)


-- ================================================================
-- pg_cron: 매일 09:00 KST(00:00 UTC) 알림 발송 스케줄
-- ⚠️ Supabase Pro 플랜 이상 필요
-- ⚠️ [PROJECT_REF]는 실제 Supabase 프로젝트 참조코드로 교체 필요
-- ================================================================
-- SELECT cron.schedule(
--   'daily-hearing-alert-dispatch',
--   '0 0 * * *',
--   $$
--     SELECT net.http_post(
--       url    := 'https://[PROJECT_REF].supabase.co/functions/v1/dispatch-hearing-alerts',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
--         'Content-Type', 'application/json'
--       ),
--       body   := '{}'::jsonb
--     );
--   $$
-- );
-- ↑ pg_cron 등록은 Supabase SQL Editor에서 직접 실행 (migration에서 제외)


-- ================================================================
-- 완료 메시지
-- ================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ 003_mvp_cases.sql 마이그레이션 완료';
    RAISE NOTICE '   - cases 테이블 (+ auto case_number, auto timeline 트리거)';
    RAISE NOTICE '   - case_timeline 테이블';
    RAISE NOTICE '   - hearings 테이블 (+ auto scheduled_alerts 트리거)';
    RAISE NOTICE '   - scheduled_alerts 테이블';
    RAISE NOTICE '   - notification_logs 테이블';
    RAISE NOTICE '   - check_case_conflict() 함수';
    RAISE NOTICE '   - urgent_cases_today VIEW';
    RAISE NOTICE '   ⚠️  pg_cron 스케줄은 별도로 SQL Editor에서 등록 필요';
END;
$$;
